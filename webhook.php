<?php
/**
 * webhook.php
 *
 * Receives server-to-server payment notifications FROM RukaPay.
 *
 * This is the ONLY place in the entire codebase allowed to mark a donation
 * as 'completed'. It does so only after:
 *   1. Verifying the request really came from RukaPay (signature check).
 *   2. Looking up the donation by OUR internal reference.
 *   3. Optionally double-checking status directly via RukaPay's API
 *      (defends against a forged/replayed webhook even if the secret leaked).
 *
 * Configure this URL in RukaPay's merchant dashboard once you have access,
 * e.g. https://yourdomain.com/webhook.php
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/RukaPayClient.php';

// Always respond 200 quickly once verified+processed, so RukaPay doesn't retry endlessly.
// But never respond 200 to an unverified request - return 401 instead so it's logged as suspicious.

$rawPayload = file_get_contents('php://input');

// NOTE: Confirm the actual header name RukaPay uses once docs arrive.
// Common alternatives: 'X-RukaPay-Signature', 'X-Signature', 'Ruka-Signature'.
$signatureHeader = $_SERVER['HTTP_X_RUKAPAY_SIGNATURE'] ?? '';

$rukapay = new RukaPayClient();

if (!$rukapay->verifyWebhookSignature($rawPayload, $signatureHeader)) {
    error_log('Webhook signature verification failed. Payload: ' . $rawPayload);
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid signature']);
    exit;
}

$payload = json_decode($rawPayload, true);

if (!$payload) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid payload']);
    exit;
}

// ---- PLACEHOLDER field names - confirm exact webhook payload shape against real docs ----
$internalReference = $payload['reference'] ?? null;       // our reference, e.g. "donation-20260617-abc123"
$rukapayReference = $payload['rukapay_reference'] ?? null; // RukaPay's own transaction id
$webhookStatus = $payload['status'] ?? null;                // e.g. 'completed', 'failed'
$webhookAmount = $payload['amount'] ?? null;

if (!$internalReference || !$webhookStatus) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields in webhook']);
    exit;
}

try {
    $conn = get_db_connection();

    // Look up the pending donation by OUR reference - never trust an amount/status
    // sent by the webhook alone without cross-checking what we expect.
    $stmt = $conn->prepare("SELECT id, amount, status FROM donations WHERE transaction_id = ? LIMIT 1");
    $stmt->bind_param('s', $internalReference);
    $stmt->execute();
    $result = $stmt->get_result();
    $donation = $result->fetch_assoc();
    $stmt->close();

    if (!$donation) {
        error_log("Webhook referenced unknown donation: $internalReference");
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Unknown reference']);
        exit;
    }

    // Idempotency: if we've already processed this donation, don't process twice.
    if ($donation['status'] !== 'pending') {
        echo json_encode(['success' => true, 'message' => 'Already processed']);
        exit;
    }

    // Sanity check: amount in webhook should match what we recorded when creating the payment.
    if ($webhookAmount !== null && (float)$webhookAmount !== (float)$donation['amount']) {
        error_log("Webhook amount mismatch for $internalReference: expected {$donation['amount']}, got $webhookAmount");
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Amount mismatch']);
        exit;
    }

    // ---- Optional but recommended extra safety net ----
    // Independently re-verify status directly with RukaPay's API rather than
    // trusting the webhook payload alone. Uncomment once verifyTransaction()
    // is implemented:
    //
    // if ($rukapayReference) {
    //     $verified = $rukapay->verifyTransaction($rukapayReference);
    //     if ($verified['status'] !== $webhookStatus) {
    //         error_log("Webhook/API status mismatch for $internalReference");
    //         http_response_code(409);
    //         echo json_encode(['success' => false, 'message' => 'Status verification mismatch']);
    //         exit;
    //     }
    // }

    $newStatus = ($webhookStatus === 'completed' || $webhookStatus === 'success') ? 'completed' : 'failed';

    $update = $conn->prepare(
        "UPDATE donations SET status = ?, rukapay_reference = ? WHERE transaction_id = ? AND status = 'pending'"
    );
    $update->bind_param('sss', $newStatus, $rukapayReference, $internalReference);
    $update->execute();
    $affected = $update->affected_rows;
    $update->close();
    $conn->close();

    if ($affected === 0) {
        // Someone else (e.g. a concurrent webhook retry) already updated it - not an error.
        echo json_encode(['success' => true, 'message' => 'No update needed (already processed)']);
        exit;
    }

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "Donation marked as $newStatus"]);

} catch (Throwable $e) {
    error_log('Webhook processing error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal error']);
}

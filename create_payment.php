<?php
/**
 * create_payment.php
 *
 * Called by the frontend when the donor submits the giving form.
 *
 * This endpoint:
 *   1. Validates input.
 *   2. Creates a `pending` donation row in our DB with OUR OWN unique reference.
 *   3. Calls RukaPay server-to-server to actually initiate the payment.
 *   4. Returns ONLY a reference + instructions to the browser.
 *
 * Critically: this endpoint NEVER marks a donation as completed. It can only
 * create a pending record. Completion is decided exclusively by webhook.php
 * (or a manual admin reconciliation), based on RukaPay's own confirmation.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/RukaPayClient.php';

function respond(array $data, int $httpCode = 200): void
{
    http_response_code($httpCode);
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Invalid request method'], 405);
}

// ---- Collect + validate input ----
$amount = filter_input(INPUT_POST, 'amount', FILTER_VALIDATE_FLOAT);
$fund = trim($_POST['fund'] ?? '');
$otherFund = trim($_POST['other_fund'] ?? '');
$name = trim($_POST['donor_name'] ?? '');
$email = trim($_POST['donor_email'] ?? '');
$phone = trim($_POST['donor_phone'] ?? '');
$anonymous = isset($_POST['anonymous']) && $_POST['anonymous'] === 'true';

$errors = [];

if (!$amount || $amount <= 0) {
    $errors[] = 'Please enter a valid amount.';
}
if (APP_ENV === 'test' && $amount > TEST_MODE_MAX_AMOUNT) {
    $errors[] = 'Test mode is limited to ' . number_format(TEST_MODE_MAX_AMOUNT) . ' UGX.';
}
if (empty($fund) || $fund === 'Select contribution') {
    $errors[] = 'Please select a contribution type.';
}
if ($fund === 'Other' && empty($otherFund)) {
    $errors[] = 'Please specify the contribution purpose.';
}
if (empty($name) || empty($phone)) {
    $errors[] = 'Please fill in all required fields.';
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
// Basic Uganda phone sanity check (accepts formats like 07XXXXXXXX or 2567XXXXXXXX)
if (!empty($phone) && !preg_match('/^(0|256)?7\d{8}$/', preg_replace('/\s+/', '', $phone))) {
    $errors[] = 'Please enter a valid Ugandan phone number.';
}

if (!empty($errors)) {
    respond(['success' => false, 'message' => implode(' ', $errors)], 422);
}

// ---- Generate our own unique reference (idempotency key) ----
$internalReference = 'donation-' . date('Ymd') . '-' . bin2hex(random_bytes(6));

try {
    $conn = get_db_connection();

    // Insert as PENDING. This is the only status a fresh donation can have.
    $stmt = $conn->prepare(
        "INSERT INTO donations
            (transaction_id, amount, currency, payment_type, donor_name, donor_email,
             donor_phone, fund_type, real_name, is_anonymous, payment_date, other_fund, status)
         VALUES (?, ?, 'UGX', 'online', ?, ?, ?, ?, ?, ?, NOW(), ?, 'pending')"
    );

    $isAnonymousStr = $anonymous ? 'Yes' : 'No';
    $displayName = $anonymous ? 'Anonymous Donor' : $name;

    $stmt->bind_param(
        'sdsssssss',
        $internalReference,
        $amount,
        $displayName,
        $email,
        $phone,
        $fund,
        $name,
        $isAnonymousStr,
        $otherFund
    );

    if (!$stmt->execute()) {
        error_log('Failed to insert pending donation: ' . $stmt->error);
        respond(['success' => false, 'message' => 'Could not start donation. Please try again.'], 500);
    }
    $stmt->close();

    // ---- Now actually initiate payment with RukaPay ----
    $rukapay = new RukaPayClient();

    $rukapayResponse = $rukapay->initiatePayment(
        $internalReference,
        (float)$amount,
        $phone,
        $email,
        'Donation - ' . $fund
    );

    // Store RukaPay's own reference alongside ours, for cross-referencing in the webhook.
    if (!empty($rukapayResponse['rukapay_reference'])) {
        $update = $conn->prepare("UPDATE donations SET rukapay_reference = ? WHERE transaction_id = ?");
        $update->bind_param('ss', $rukapayResponse['rukapay_reference'], $internalReference);
        $update->execute();
        $update->close();
    }

    $conn->close();

    // Return ONLY the reference + whatever the donor needs to complete payment
    // (e.g. "check your phone for a mobile money prompt", or a redirect_url).
    respond([
        'success' => true,
        'reference' => $internalReference,
        'redirect_url' => $rukapayResponse['redirect_url'] ?? null,
        'message' => 'Payment initiated. Please complete it on your phone if prompted.',
    ]);

} catch (RukaPayException $e) {
    error_log('RukaPay error: ' . $e->getMessage());

    // Mark the donation as failed since RukaPay rejected/couldn't process the request.
    if (isset($conn) && $conn instanceof mysqli) {
        $fail = $conn->prepare("UPDATE donations SET status = 'failed' WHERE transaction_id = ?");
        $fail->bind_param('s', $internalReference);
        $fail->execute();
        $fail->close();
        $conn->close();
    }

    respond(['success' => false, 'message' => 'Could not reach payment provider. Please try again shortly.'], 502);

} catch (Throwable $e) {
    error_log('Unexpected error in create_payment.php: ' . $e->getMessage());
    respond(['success' => false, 'message' => 'Something went wrong. Please try again.'], 500);
}

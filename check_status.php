<?php
/**
 * check_status.php
 *
 * Lets the frontend poll: "has my donation completed yet?"
 *
 * This endpoint only READS from the donations table. It never writes.
 * The donation's status can only ever be changed by webhook.php (or manual
 * admin reconciliation), so whatever this returns reflects RukaPay's own
 * confirmation - never something the browser claimed.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

$reference = $_GET['reference'] ?? '';

if (empty($reference)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing reference']);
    exit;
}

try {
    $conn = get_db_connection();

    $stmt = $conn->prepare(
        "SELECT status, amount, fund_type, real_name, is_anonymous
         FROM donations WHERE transaction_id = ? LIMIT 1"
    );
    $stmt->bind_param('s', $reference);
    $stmt->execute();
    $result = $stmt->get_result();
    $donation = $result->fetch_assoc();
    $stmt->close();
    $conn->close();

    if (!$donation) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Donation not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'status' => $donation['status'], // 'pending' | 'completed' | 'failed'
        'amount' => $donation['amount'],
        'fund_type' => $donation['fund_type'],
    ]);

} catch (Throwable $e) {
    error_log('check_status.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal error']);
}

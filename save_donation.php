<?php
// save_donation.php - Saves donation info to database
// This is called from JavaScript after successful payment

header('Content-Type: application/json');

// Database connection 
$servername = "localhost";
$username = "root";             
$password = "";                  
$dbname = "promised_church";           

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

// Get POST data
$transaction_id = $conn->real_escape_string($_POST['transaction_id'] ?? '');
$flutterwave_id = $conn->real_escape_string($_POST['flutterwave_id'] ?? '');
$amount = $conn->real_escape_string($_POST['amount'] ?? 0);
$currency = $conn->real_escape_string($_POST['currency'] ?? 'UGX');
$payment_type = $conn->real_escape_string($_POST['payment_type'] ?? 'online');
$donor_name = $conn->real_escape_string($_POST['donor_name'] ?? '');
$donor_email = $conn->real_escape_string($_POST['donor_email'] ?? '');
$donor_phone = $conn->real_escape_string($_POST['donor_phone'] ?? '');
$fund_type = $conn->real_escape_string($_POST['fund_type'] ?? '');
$real_name = $conn->real_escape_string($_POST['real_name'] ?? '');
$is_anonymous = $conn->real_escape_string($_POST['is_anonymous'] ?? 'No');
$payment_date = date('Y-m-d H:i:s');
$other_fund = $conn->real_escape_string($_POST['other_fund'] ?? '');

// Validate required fields
if (empty($transaction_id) || empty($amount)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields'
    ]);
    exit;
}

// Check for duplicate transactions
$check_sql = "SELECT id FROM donations WHERE transaction_id = '$transaction_id'";
$check_result = $conn->query($check_sql);

if ($check_result->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Transaction already recorded'
    ]);
    exit;
}

// Insert into database
$sql = "INSERT INTO donations 
        (transaction_id, flutterwave_id, amount, currency, payment_type, 
         donor_name, donor_email, donor_phone, fund_type, real_name, 
         is_anonymous, payment_date, other_fund,status) 
        VALUES 
        ('$transaction_id', '$flutterwave_id', '$amount', '$currency', '$payment_type',
         '$donor_name', '$donor_email', '$donor_phone', '$fund_type', '$real_name',
         '$is_anonymous', '$payment_date','$other_fund', 'completed')";

if ($conn->query($sql) === TRUE) {
    echo json_encode([
        'success' => true,
        'message' => 'Donation saved successfully',
        'donation_id' => $conn->insert_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error saving donation: ' . $conn->error
    ]);
}

$conn->close();
?>
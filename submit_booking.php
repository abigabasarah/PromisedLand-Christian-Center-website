<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
 
// Allow normal form posts
header("Content-Type: text/plain");
 
// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "promised_church";
 
$conn = new mysqli($servername, $username, $password, $dbname);
 
// Check connection
if ($conn->connect_error) {
    echo "Connection failed: " . $conn->connect_error;
    exit;
}
 
// Get form values safely
$serviceType     = $_POST['serviceType'] ?? '';
$name            = $_POST['name'] ?? '';
$email           = $_POST['email'] ?? '';
$phone           = $_POST['phone'] ?? '';
$preferredDate   = $_POST['preferredDate'] ?? '';
$preferredTime   = $_POST['preferredTime'] ?? '';
$message         = $_POST['message'] ?? '';
$childName       = $_POST['childName'] ?? ''; // Added this line
 
// Basic validation (date not required for counselling)
if (empty($name) || empty($email) || empty($preferredTime)) {
    echo "Error: Missing required fields.";
    exit;
}
 
if ($serviceType !== "counselling" && empty($preferredDate)) {
    echo "Error: Date is required for this service.";
    exit;
}

// Validation for dedication - child name required
if ($serviceType === "dedication" && empty($childName)) {
    echo "Error: Child's name is required for dedication.";
    exit;
}
 
// Insert into database INCLUDING service_type and child_name
$stmt = $conn->prepare("
    INSERT INTO bookings (service_type, name, email, phone, preferred_date, preferred_time, message, child_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
 
if (!$stmt) {
    echo "Prepare failed: " . $conn->error;
    exit;
}
 
$stmt->bind_param("ssssssss",
    $serviceType,
    $name,
    $email,
    $phone,
    $preferredDate,
    $preferredTime,
    $message,
    $childName  // Added this parameter
);
 
if ($stmt->execute()) {
 
    // Optional email notification
    @mail(
        "abigabapatiencesarah@gmail.com",
        "New Booking - $name",
        "A new booking has been submitted.\n\nName: $name\nEmail: $email\nPhone: $phone\nService: $serviceType\nDate: $preferredDate\nTime: $preferredTime\nChild's Name: $childName\nMessage: $message",
        "From: no-reply@plcc.org"
    );
 
    echo "SUCCESS";
} else {
    echo "Database error: " . $stmt->error;
}
 
$stmt->close();
$conn->close();
?>
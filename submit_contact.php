<?php
// Database configuration
$host = 'localhost';
$dbname = 'promised_church';
$username = 'root';
$password = '';

// Connect to database
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Return JSON error
    echo json_encode([
        'success' => false,
        'message' => "Connection failed: " . $e->getMessage()
    ]);
    exit;
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $subject = $_POST['subject'] ?? 'general';
    $message = trim($_POST['message'] ?? '');

     // Phone is required
    if ($phone === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Phone number is required.'
        ]);
        exit;
    }

    // Phone format validation
    if (!preg_match('/^0\d{9}$/', $phone)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid phone number. Must be 10 digits starting with 0.'
        ]);
        exit;
    }

// Email validation (optional, but must be valid if provided)
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email address.'
        ]);
        exit;
    }

    if ($email === '') { $email = null; }

    $sql = "INSERT INTO contact_us (name, email, phone, subject, message) 
            VALUES (:name, :email, :phone, :subject, :message)";
   

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':subject' => $subject,
            ':message' => $message
        ]);

        // Return JSON success
        echo json_encode([
            'success' => true,
            'message' => 'Your information has been received. Thank you!'
        ]);
        exit;

    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => "There was a problem sending your message: " . $e->getMessage()
        ]);
        exit;
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request.'
    ]);
    exit;
}
?>

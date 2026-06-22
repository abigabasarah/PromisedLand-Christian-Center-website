<?php
/**
 * config.php
 * Central configuration: database + payment gateway credentials.
 *
 * IMPORTANT:
 * - Never commit real secrets to Git. Use environment variables in production.
 * - This file should sit OUTSIDE any publicly-served directory if possible,
 *   or at minimum be blocked via .htaccess / server config.
 */

// ---- Database ----
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'promised_church');

// ---- RukaPay credentials (placeholders until docs/keys arrive) ----
// Replace these once RukaPay shares API documentation.
define('RUKAPAY_BASE_URL', 'https://api.rukapay.co.ug'); // placeholder, confirm real base URL
define('RUKAPAY_PUBLIC_KEY', 'REPLACE_WITH_PUBLIC_KEY');
define('RUKAPAY_SECRET_KEY', 'REPLACE_WITH_SECRET_KEY');       // server-side only, never expose to frontend
define('RUKAPAY_WEBHOOK_SECRET', 'REPLACE_WITH_WEBHOOK_SECRET'); // used to verify webhook signatures

// ---- App-level settings ----
define('APP_ENV', 'test'); // 'test' or 'live'
define('TEST_MODE_MAX_AMOUNT', 50000); // UGX cap while in test mode

/**
 * Get a mysqli DB connection.
 * Throws on failure rather than silently continuing.
 */
function get_db_connection(): mysqli
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        error_log('DB connection failed: ' . $conn->connect_error);
        throw new RuntimeException('Database connection failed');
    }
    return $conn;
}

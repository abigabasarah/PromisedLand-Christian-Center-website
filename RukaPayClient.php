<?php
/**
 * RukaPayClient.php
 *
 * Thin wrapper around RukaPay's API.
 *
 * NOTE: Method bodies below are PLACEHOLDERS. The exact endpoint paths,
 * request payload shape, auth header format, and response shape will
 * be filled in once RukaPay shares their API documentation. Everything
 * else in this codebase (create_payment.php, webhook.php, check_status.php)
 * is written against this class's public interface, so once we fill in
 * the real HTTP calls here, nothing else needs to change.
 */

require_once __DIR__ . '/config.php';

class RukaPayException extends Exception {}

class RukaPayClient
{
    private string $baseUrl;
    private string $secretKey;

    public function __construct()
    {
        $this->baseUrl = RUKAPAY_BASE_URL;
        $this->secretKey = RUKAPAY_SECRET_KEY;
    }

    /**
     * Initiate a payment / collection request with RukaPay.
     *
     * @param string $reference   Our own unique reference for this donation (idempotency key)
     * @param float  $amount      Amount in UGX
     * @param string $phone       Donor phone number (for mobile money push)
     * @param string $email       Donor email (optional, some gateways require it)
     * @param string $description Short description shown to the payer
     *
     * @return array Expected shape (TO CONFIRM against real docs):
     *   [
     *     'success' => true,
     *     'rukapay_reference' => 'string',   // RukaPay's own transaction id
     *     'status' => 'pending',
     *     'redirect_url' => 'string|null',   // if checkout requires redirect
     *   ]
     *
     * @throws RukaPayException on failure to reach RukaPay or on API error response
     */
    public function initiatePayment(
        string $reference,
        float $amount,
        string $phone,
        string $email,
        string $description
    ): array {
        // ---------------------------------------------------------------
        // PLACEHOLDER IMPLEMENTATION
        // Replace with real endpoint + payload once docs are available.
        // Example shape (guessing common conventions, NOT confirmed):
        //
        // POST {baseUrl}/v1/payments
        // Headers: Authorization: Bearer {secretKey}
        // Body: {
        //   "reference": $reference,
        //   "amount": $amount,
        //   "currency": "UGX",
        //   "phone_number": $phone,
        //   "email": $email,
        //   "description": $description,
        //   "callback_url": "https://yourdomain.com/webhook.php"
        // }
        // ---------------------------------------------------------------

        throw new RukaPayException(
            'RukaPayClient::initiatePayment() is not yet implemented. ' .
            'Fill this in once RukaPay API docs are available.'
        );

        /* Example of what the real implementation will likely look like:

        $payload = [
            'reference'    => $reference,
            'amount'       => $amount,
            'currency'     => 'UGX',
            'phone_number' => $phone,
            'email'        => $email,
            'description'  => $description,
            'callback_url' => 'https://yourdomain.com/webhook.php',
        ];

        $ch = curl_init($this->baseUrl . '/v1/payments');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->secretKey,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT        => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new RukaPayException('Network error contacting RukaPay: ' . $curlError);
        }

        $data = json_decode($response, true);

        if ($httpCode >= 400 || !$data) {
            throw new RukaPayException('RukaPay API error: HTTP ' . $httpCode . ' - ' . $response);
        }

        return $data;
        */
    }

    /**
     * Query RukaPay directly for the current status of a transaction.
     * This is the server-to-server "source of truth" check — used as a
     * fallback / double-check even if a webhook already arrived.
     *
     * @param string $rukapayReference RukaPay's transaction reference
     * @return array Expected shape: ['status' => 'completed'|'pending'|'failed', ...]
     */
    public function verifyTransaction(string $rukapayReference): array
    {
        // PLACEHOLDER - replace with real GET /v1/payments/{reference} call once docs exist.
        throw new RukaPayException(
            'RukaPayClient::verifyTransaction() is not yet implemented. ' .
            'Fill this in once RukaPay API docs are available.'
        );
    }

    /**
     * Verify that an incoming webhook payload genuinely came from RukaPay.
     *
     * Most gateways sign webhooks with HMAC-SHA256 using a shared secret,
     * sent in a header like "X-RukaPay-Signature". Adjust once confirmed.
     *
     * @param string $rawPayload  The raw (unparsed) request body
     * @param string $signatureHeader  The signature value from the request header
     * @return bool
     */
    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool
    {
        if (empty($signatureHeader)) {
            return false;
        }

        // PLACEHOLDER logic - common HMAC pattern, confirm against real docs:
        $computedSignature = hash_hmac('sha256', $rawPayload, RUKAPAY_WEBHOOK_SECRET);

        return hash_equals($computedSignature, $signatureHeader);
    }
}

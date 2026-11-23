<?php

namespace Midtrans;

/**
 * Midtrans Snap - Create Snap Payment Transactions & Generate Tokens
 */
class Snap
{
    /**
     * Create Snap payment transaction
     *
     * @param array $params Transaction parameters
     * @return object JSON decoded response from Midtrans
     * @throws \Exception
     */
    public static function createTransaction($params)
    {
        $payloads = [
            'credit_card' => [
                'secure' => Config::$is3ds
            ]
        ];

        if (array_key_exists('item_details', $params)) {
            $total_price = 0;
            foreach ($params['item_details'] as $item) {
                $total_price += ((int) $item['price'] * (int) $item['quantity']);
            }
            $params['transaction_details']['gross_amount'] = $total_price;
        }

        if (Config::$isSanitized) {
            // Sanitization if needed
        }

        $params = array_replace_recursive($payloads, $params);

        return ApiRequestor::post(
            Config::getSnapBaseUrl() . '/transactions',
            Config::$serverKey,
            $params
        );
    }

    /**
     * Generate Snap Token string
     *
     * @param array $params Transaction parameters
     * @return string
     * @throws \Exception
     */
    public static function getSnapToken($params)
    {
        $result = self::createTransaction($params);
        return $result->token ?? '';
    }

    /**
     * Generate Snap Redirect URL string
     *
     * @param array $params Transaction parameters
     * @return string
     * @throws \Exception
     */
    public static function getSnapUrl($params)
    {
        $result = self::createTransaction($params);
        return $result->redirect_url ?? '';
    }
}

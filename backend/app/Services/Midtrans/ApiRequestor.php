<?php

namespace Midtrans;

use Exception;

/**
 * Midtrans ApiRequestor - Handles HTTP POST and GET requests to Midtrans API
 */
class ApiRequestor
{
    public static function get($url, $server_key, $data_hash)
    {
        return self::remoteCall($url, $server_key, $data_hash, 'GET');
    }

    public static function post($url, $server_key, $data_hash)
    {
        return self::remoteCall($url, $server_key, $data_hash, 'POST');
    }

    public static function remoteCall($url, $server_key, $data_hash, $method = 'POST')
    {
        $ch = curl_init();

        $curl_options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => false,
            CURLOPT_USERPWD        => $server_key . ':',
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'User-Agent: midtrans-php-v2.6.0',
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
        ];

        if ($method === 'POST') {
            $curl_options[CURLOPT_POST] = 1;
            if ($data_hash) {
                $curl_options[CURLOPT_POSTFIELDS] = json_encode($data_hash);
            }
        }

        if (is_array(Config::$curlOptions)) {
            $curl_options = array_replace($curl_options, Config::$curlOptions);
        }

        curl_setopt_array($ch, $curl_options);

        $result = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if ($result === false) {
            throw new Exception("Midtrans cURL Error: " . $curl_error);
        }

        $result_array = json_decode($result);

        if ($http_code < 200 || $http_code >= 300) {
            $message = 'Midtrans API Error: HTTP ' . $http_code;
            if (isset($result_array->error_messages)) {
                $message .= ' - ' . implode(', ', (array) $result_array->error_messages);
            } elseif (isset($result_array->message)) {
                $message .= ' - ' . $result_array->message;
            }
            throw new Exception($message, $http_code);
        }

        return $result_array;
    }
}

<?php

namespace Midtrans;

use Exception;

/**
 * Midtrans Notification - Parse incoming HTTP notification webhook from Midtrans
 */
class Notification
{
    protected $response;

    public function __construct($input_source = "php://input")
    {
        $raw_notification = json_decode(file_get_contents($input_source), true);

        if ($raw_notification === null) {
            $raw_notification = $_POST;
        }

        if (empty($raw_notification)) {
            throw new Exception("Midtrans Notification: Empty payload received.");
        }

        $this->response = $raw_notification;
    }

    public function __get($name)
    {
        if (array_key_exists($name, $this->response)) {
            return $this->response[$name];
        }
        return null;
    }

    public function getResponse()
    {
        return $this->response;
    }
}

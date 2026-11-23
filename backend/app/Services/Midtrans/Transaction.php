<?php

namespace Midtrans;

/**
 * Midtrans Transaction - Check status, approve, cancel, expire, or refund transactions
 */
class Transaction
{
    public static function status($id)
    {
        return ApiRequestor::get(
            Config::getBaseUrl() . '/' . $id . '/status',
            Config::$serverKey,
            false
        );
    }

    public static function approve($id)
    {
        return ApiRequestor::post(
            Config::getBaseUrl() . '/' . $id . '/approve',
            Config::$serverKey,
            false
        );
    }

    public static function cancel($id)
    {
        return ApiRequestor::post(
            Config::getBaseUrl() . '/' . $id . '/cancel',
            Config::$serverKey,
            false
        );
    }

    public static function expire($id)
    {
        return ApiRequestor::post(
            Config::getBaseUrl() . '/' . $id . '/expire',
            Config::$serverKey,
            false
        );
    }
}

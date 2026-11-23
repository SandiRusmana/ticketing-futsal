<?php

namespace App\Services;

use App\Models\Order;
use App\Models\FutsalMatch;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * MidtransService - Layanan Payment Gateway Midtrans Snap
 * FutsalTix Cianjur - Liga Futsal Pelajar (LFP) 2026
 */
class MidtransService
{
    protected string $serverKey;
    protected string $clientKey;
    protected bool $isProduction;
    protected string $snapUrl;

    public function __construct()
    {
        $this->serverKey = env('MIDTRANS_SERVER_KEY', 'SB-Mid-server-o7N3TTMRzViugr8qepcVdU-I');
        $this->clientKey = env('MIDTRANS_CLIENT_KEY', 'Mid-client-1mj89rmVH1fUUz1I');
        $this->isProduction = (bool) env('MIDTRANS_IS_PRODUCTION', false);

        $this->snapUrl = $this->isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    }

    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    /**
     * Membuat Snap Token transaksi ke server Midtrans
     */
    public function createSnapToken(Order $order, FutsalMatch $match, User $user): array
    {
        $homeName = $match->homeTeam->name ?? $match->home_placeholder ?? 'Tim A';
        $awayName = $match->awayTeam->name ?? $match->away_placeholder ?? 'Tim B';
        $matchTitle = "Tiket LFP 2026: {$homeName} vs {$awayName}";
        if (mb_strlen($matchTitle) > 50) {
            $matchTitle = mb_substr($matchTitle, 0, 47) . '...';
        }

        $payload = [
            'transaction_details' => [
                'order_id'     => $order->order_code,
                'gross_amount' => (int) $order->total_amount,
            ],
            'item_details' => [
                [
                    'id'       => 'TIX-' . $match->id,
                    'price'    => (int) $order->unit_price,
                    'quantity' => (int) $order->quantity,
                    'name'     => $matchTitle,
                ],
                [
                    'id'       => 'ADM-FEE',
                    'price'    => (int) $order->admin_fee,
                    'quantity' => 1,
                    'name'     => 'Biaya Layanan & Gate Turnstile',
                ],
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone ?? '081234567890',
            ],
            'enabled_payments' => [
                'qris',
                'gopay',
                'shopeepay',
                'bca_va',
                'bni_va',
                'bri_va',
                'permata_va',
                'other_va',
            ],
        ];

        $lastError = null;

        // 1. Inisialisasi Konfigurasi Resmi Midtrans PHP SDK
        \Midtrans\Config::$serverKey = $this->serverKey;
        \Midtrans\Config::$clientKey = $this->clientKey;
        \Midtrans\Config::$isProduction = $this->isProduction;
        \Midtrans\Config::$is3ds = true;
        \Midtrans\Config::$isSanitized = true;

        // 2. Eksekusi Pembuatan Snap Transaction via Midtrans PHP SDK
        try {
            $transaction = \Midtrans\Snap::createTransaction($payload);
            if (!empty($transaction->token)) {
                return [
                    'success'      => true,
                    'token'        => $transaction->token,
                    'redirect_url' => $transaction->redirect_url ?? null,
                    'is_live'      => true,
                ];
            }
        } catch (\Exception $e) {
            $lastError = $e->getMessage();
            Log::warning('Midtrans PHP SDK Snap Exception: ' . $e->getMessage());
        }

        // 3. Fallback Eksekusi Direct HTTP Client (Bypass SSL di Local Environment)
        try {
            $response = Http::withoutVerifying()
                ->withBasicAuth($this->serverKey, '')
                ->withHeaders([
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(10)
                ->post($this->snapUrl, $payload);

            if ($response->successful()) {
                $body = $response->json();
                return [
                    'success'      => true,
                    'token'        => $body['token'] ?? null,
                    'redirect_url' => $body['redirect_url'] ?? null,
                    'is_live'      => true,
                ];
            }

            $rawBody = $response->body();
            $lastError = 'HTTP ' . $response->status() . ' - ' . $rawBody;
            Log::warning('Midtrans Snap API Warning: ' . $rawBody);
        } catch (\Exception $e) {
            $lastError = $e->getMessage();
            Log::error('Midtrans Exception: ' . $e->getMessage());
        }

        // JANGAN kembalikan token palsu (SNAP-LFP-...) karena akan memicu "Transaksi tidak ditemukan" di Snap SDK
        return [
            'success'       => false,
            'token'         => null,
            'redirect_url'  => null,
            'is_live'       => false,
            'error_message' => $lastError,
        ];
    }

    /**
     * Generate string token QR unik berbasis hash/UUID untuk E-Tiket
     * Format: TIX-LFP2026-{RANDOM_6}-{HASH_8}
     * Contoh: TIX-LFP2026-X8K9P2-4A82F1B9
     */
    public function generateETicketToken(Order $order): string
    {
        $hashPart = strtoupper(substr(hash('sha256', $order->id . $order->order_code . time()), 0, 8));
        $randomPart = strtoupper(Str::random(6));
        return "TIX-LFP2026-{$randomPart}-{$hashPart}";
    }

    /**
     * Memverifikasi signature notification dari Midtrans Webhook
     */
    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signatureKey): bool
    {
        $calculated = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);
        return hash_equals($calculated, $signatureKey);
    }
}

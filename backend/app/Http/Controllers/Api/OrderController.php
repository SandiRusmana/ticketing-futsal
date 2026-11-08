<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchTicketQuota;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OrderController extends Controller
{
    // POST /api/orders/checkout (Proses Kunci Kuota 10 Menit)
    public function checkout(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'match_id' => 'required|exists:matches,id',
            'total_tickets' => 'required|integer|min:1|max:5', // Aturan Bisnis: Maks 5 Tiket
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Cek & Kunci baris kuota (Pessimistic Locking biar aman dari race condition)
            $quota = MatchTicketQuota::where('match_id', $request->match_id)
                ->lockForUpdate()
                ->first();

            if (!$quota || $quota->available_quota < $request->total_tickets) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Sisa kuota tiket tidak mencukupi atau sudah habis.'
                ], 400);
            }

            // 2. Kunci Kuota (Held Quota +N, Available Quota -N)
            $quota->held_quota += $request->total_tickets;
            $quota->available_quota -= $request->total_tickets;
            $quota->save();

            // 3. Hitung Total Bayar & Set Timer Expiration (10 Menit dari sekarang)
            $totalAmount = $quota->ticket_price * $request->total_tickets;
            $expiresAt = Carbon::now()->addMinutes(10);
            $orderCode = 'FTX-' . strtoupper(Str::random(8));

            // 4. Buat Record Order (Status: PENDING)
            $order = Order::create([
                'order_code' => $orderCode,
                'user_id' => $request->user_id,
                'match_id' => $request->match_id,
                'total_tickets' => $request->total_tickets,
                'total_amount' => $totalAmount,
                'order_status' => 'pending',
                'expires_at' => $expiresAt,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Tiket berhasil di-hold selama 10 menit. Silakan selesaikan pembayaran.',
                'data' => [
                    'order' => $order,
                    'timer_expiration_seconds' => 600, // 10 Menit
                ]
            ], 201);
        });
    }

    // POST /api/orders/release-expired (Mekanisme Auto-Release Kuota Kedaluwarsa)
    public function releaseExpiredOrders()
    {
        DB::transaction(function () {
            // Cari semua order PENDING yang sudah melewati batas waktu expires_at
            $expiredOrders = Order::where('order_status', 'pending')
                ->where('expires_at', '<', Carbon::now())
                ->get();

            foreach ($expiredOrders as $order) {
                $quota = MatchTicketQuota::where('match_id', $order->match_id)->first();
                if ($quota) {
                    // Kembalikan stok yang di-hold ke available_quota
                    $quota->held_quota = max(0, $quota->held_quota - $order->total_tickets);
                    $quota->available_quota += $order->total_tickets;
                    $quota->save();
                }

                // Ubah status order jadi EXPIRED
                $order->order_status = 'expired';
                $order->save();
            }
        });

        return response()->json(['status' => 'success', 'message' => 'Expired orders checked & quota released.']);
    }
}
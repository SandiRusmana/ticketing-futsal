<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchTicketQuota;
use App\Models\Order;
use App\Models\FutsalMatch;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * OrderController - Alur Pemesanan & Pembayaran Midtrans Snap
 * Turnamen: Liga Futsal Pelajar (LFP) Cianjur 2026
 */
class OrderController extends Controller
{
    protected MidtransService $midtransService;

    public function __construct(MidtransService $midtransService)
    {
        $this->midtransService = $midtransService;
    }

    /**
     * POST /api/orders/checkout
     * 1. Kunci kuota tiket (Holding Quota selama 10 menit)
     * 2. Buat record Order PENDING di MySQL
     * 3. Minta Snap Token asli ke API Midtrans
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'user_id'       => 'nullable|exists:users,id',
            'match_id'      => 'required|exists:matches,id',
            'total_tickets' => 'nullable|integer|min:1|max:5', // Input dari frontend
            'quantity'      => 'nullable|integer|min:1|max:5',
        ]);

        $quantity = (int) ($request->quantity ?? $request->total_tickets ?? 1);
        $userId = $request->user_id ?? $request->user()?->id;
        if (!$userId) {
            $user = User::where('role', 'user')->first() ?? User::first();
            $userId = $user ? $user->id : 3;
        }

        $user = User::findOrFail($userId);
        $match = FutsalMatch::with(['homeTeam', 'awayTeam', 'category'])->findOrFail($matchId ?? $request->match_id);

        return DB::transaction(function () use ($user, $match, $quantity) {
            // 1. Kunci baris kuota di database (Pessimistic Locking biar aman dari double booking)
            $quota = MatchTicketQuota::where('match_id', $match->id)
                ->lockForUpdate()
                ->first();

            if (!$quota || $quota->available_quota < $quantity) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Sisa kuota tiket tidak mencukupi atau sudah habis terjual!'
                ], 400);
            }

            if ($quota->sale_status !== 'OPEN') {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Penjualan tiket untuk pertandingan ini sedang ditutup.'
                ], 400);
            }

            // 2. Tahan Kuota (Holding Quota)
            $quota->held_quota += $quantity;
            $quota->available_quota -= $quantity;
            $quota->save();

            // 3. Hitung Biaya
            $unitPrice = (int) $quota->price;
            $adminFee = 2500;
            $totalAmount = ($unitPrice * $quantity) + $adminFee;
            $orderCode = 'LFP-FTX-' . strtoupper(Str::random(8));
            $expiresAt = Carbon::now()->addMinutes(10);

            // 4. Generate token awal QR E-Tiket berbasis UUID unik
            $preliminaryQr = 'TIX-LFP2026-' . strtoupper(Str::random(6)) . '-' . strtoupper(substr(md5($orderCode . time()), 0, 8));

            // 5. Simpan Order Baru (Status: PENDING)
            $order = Order::create([
                'order_code'      => $orderCode,
                'user_id'         => $user->id,
                'match_id'        => $match->id,
                'quantity'        => $quantity,
                'unit_price'      => $unitPrice,
                'admin_fee'       => $adminFee,
                'total_amount'    => $totalAmount,
                'status'          => 'PENDING',
                'payment_method'  => 'Midtrans Snap',
                'expires_at'      => $expiresAt,
                'qr_payload'      => $preliminaryQr,
                'is_checked_in'   => false,
            ]);

            // 6. Buat Snap Token ke Server Midtrans
            $snapResult = $this->midtransService->createSnapToken($order, $match, $user);

            if (!$snapResult['is_live'] || empty($snapResult['token'])) {
                // Batalkan penahanan kuota karena Midtrans menolak pembuatan transaksi
                $quota->held_quota = max(0, $quota->held_quota - $quantity);
                $quota->available_quota += $quantity;
                $quota->save();

                $errorDetail = $snapResult['error_message'] ?? 'Midtrans Server Key tidak valid.';
                if (str_contains($errorDetail, '401') || str_contains($errorDetail, 'Unauthorized')) {
                    $errorDetail = 'Kredensial Midtrans Server Key di file .env tidak valid atau ditolak oleh Midtrans (HTTP 401 Unauthorized). Pastikan menyalin Server Key dari dashboard Midtrans mode SANDBOX (diawali dengan SB-Mid-server-...).';
                }

                return response()->json([
                    'status'        => 'error',
                    'error_type'    => 'MIDTRANS_UNAUTHORIZED',
                    'message'       => $errorDetail,
                    'order_id'      => $order->id,
                    'order_code'    => $order->order_code,
                ], 400);
            }

            $snapToken = $snapResult['token'];
            $order->update(['snap_token' => $snapToken]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Kuota tiket berhasil dikunci selama 10 menit. Silakan selesaikan pembayaran.',
                'data'    => [
                    'order'                    => $order->load(['match.homeTeam', 'match.awayTeam']),
                    'snap_token'               => $snapToken,
                    'client_key'               => $this->midtransService->getClientKey(),
                    'timer_expiration_seconds' => 600, // 10 Menit
                ],
            ], 201);
        });
    }

    /**
     * POST /api/orders/{id}/pay atau POST /api/orders/confirm-payment
     * Mengonfirmasi pembayaran sukses dari callback Snap SDK di Frontend
     * Menghasilkan QR Code E-Tiket Asli dan Memotong Kuota Riil
     */
    public function payOrder(Request $request, $id = null)
    {
        $targetId = $id ?? $request->order_id ?? $request->id;
        $order = Order::with(['match', 'user'])->find($targetId);

        if (!$order && $targetId) {
            // Coba cari berdasarkan order_code atau order_number jika $targetId adalah string kode
            $order = Order::where('order_code', $targetId)
                ->orWhere('order_number', $targetId)
                ->with(['match', 'user'])
                ->first();
        }

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pesanan tiket tidak ditemukan.'
            ], 404);
        }

        if ($order->status === 'PAID') {
            return response()->json([
                'status'  => 'success',
                'message' => 'Tiket sudah lunas terbayar.',
                'order'   => $order->load(['match.homeTeam', 'match.awayTeam']),
            ], 200);
        }

        return DB::transaction(function () use ($order, $request) {
            // 1. Kurangi held_quota (karena transaksi sudah resmi menjadi penjualan riil)
            $quota = MatchTicketQuota::where('match_id', $order->match_id)->first();
            if ($quota) {
                $quota->held_quota = max(0, $quota->held_quota - $order->quantity);
                $quota->save();
            }

            // 2. Generate token unik hash/UUID untuk E-Tiket asli
            $realQrToken = $this->midtransService->generateETicketToken($order);
            $paymentMethod = $request->payment_method ?? $request->payment_type ?? 'Midtrans Snap (Verified)';

            // 3. Update status Order menjadi PAID
            $order->update([
                'status'         => 'PAID',
                'payment_method' => $paymentMethod,
                'paid_at'        => Carbon::now(),
                'qr_payload'     => $realQrToken,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Pembayaran tiket berhasil dikonfirmasi! E-Tiket resmi telah diterbitkan.',
                'order'   => $order->fresh(['match.homeTeam', 'match.awayTeam', 'user']),
            ], 200);
        });
    }

    /**
     * POST /api/orders/webhook atau POST /api/orders/midtrans-callback
     * Menangkap webhook HTTP Notification langsung dari Midtrans Server
     */
    public function handleWebhook(Request $request)
    {
        $orderId = $request->order_id;
        $transactionStatus = $request->transaction_status;
        $fraudStatus = $request->fraud_status;

        $order = Order::where('order_code', $orderId)->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Tangani status sukses Midtrans
        if ($transactionStatus == 'capture') {
            if ($fraudStatus == 'accept') {
                $this->finalizeOrderPaid($order, $request->payment_type ?? 'Credit Card');
            }
        } elseif ($transactionStatus == 'settlement') {
            $this->finalizeOrderPaid($order, $request->payment_type ?? 'Midtrans Settlement');
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            // Kembalikan kuota yang di-hold jika pesanan dibatalkan atau kedaluwarsa
            DB::transaction(function () use ($order, $transactionStatus) {
                $quota = MatchTicketQuota::where('match_id', $order->match_id)->first();
                if ($quota && $order->status === 'PENDING') {
                    $quota->held_quota = max(0, $quota->held_quota - $order->quantity);
                    $quota->available_quota += $order->quantity;
                    $quota->save();
                }
                $order->update(['status' => strtoupper($transactionStatus)]);
            });
        }

        return response()->json(['status' => 'success']);
    }

    protected function finalizeOrderPaid(Order $order, string $paymentMethod)
    {
        if ($order->status === 'PAID') return;

        DB::transaction(function () use ($order, $paymentMethod) {
            $quota = MatchTicketQuota::where('match_id', $order->match_id)->first();
            if ($quota) {
                $quota->held_quota = max(0, $quota->held_quota - $order->quantity);
                $quota->save();
            }

            $order->update([
                'status'         => 'PAID',
                'payment_method' => $paymentMethod,
                'paid_at'        => Carbon::now(),
                'qr_payload'     => $this->midtransService->generateETicketToken($order),
            ]);
        });
    }

    /**
     * GET /api/my-tickets
     * Mengambil seluruh tiket sah milik pengguna yang sedang login dari database MySQL
     * Mendukung multi-ticket listing & QR Code individual untuk quantity > 1
     */
    public function myTickets(Request $request)
    {
        $user = auth('sanctum')->user() ?? $request->user('sanctum') ?? $request->user();
        $userId = $user ? $user->id : ($request->query('user_id') ?? $request->user_id ?? 3);

        $orders = Order::where('user_id', $userId)
            ->where('status', 'PAID')
            ->with(['match.homeTeam', 'match.awayTeam', 'match.category'])
            ->latest()
            ->get();

        // Dekomposisi order menjadi sub_tickets untuk pemesanan multi-tiket (quantity > 1)
        $orders->transform(function ($order) {
            $qty = max(1, (int) $order->quantity);
            $subTickets = [];
            for ($i = 1; $i <= $qty; $i++) {
                $subTickets[] = [
                    'ticket_number' => $i,
                    'total_tickets' => $qty,
                    'ticket_code'   => $qty > 1 ? "{$order->order_code}-T{$i}" : $order->order_code,
                    'qr_payload'    => $qty > 1 ? "{$order->qr_payload}-T{$i}" : $order->qr_payload,
                    'seat_label'    => "Tiket #{$i} dari {$qty} (Reguler Tribun)",
                    'is_checked_in' => (bool) $order->is_checked_in,
                    'checked_in_at' => $order->checked_in_at,
                    'checked_in_gate' => $order->checked_in_gate,
                ];
            }
            $order->sub_tickets = $subTickets;
            return $order;
        });

        return response()->json([
            'status' => 'success',
            'orders' => $orders,
        ], 200);
    }

    /**
     * POST /api/orders/release-expired
     * Otomatis mengembalikan kuota yang di-hold jika user tidak menyelesaikan pembayaran dalam 10 menit
     */
    public function releaseExpiredOrders()
    {
        DB::transaction(function () {
            $expiredOrders = Order::where('status', 'PENDING')
                ->where('expires_at', '<', Carbon::now())
                ->get();

            foreach ($expiredOrders as $order) {
                $quota = MatchTicketQuota::where('match_id', $order->match_id)->first();
                if ($quota) {
                    $quota->held_quota = max(0, $quota->held_quota - $order->quantity);
                    $quota->available_quota += $order->quantity;
                    $quota->save();
                }

                $order->update(['status' => 'EXPIRED']);
            }
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Pemeriksaan kuota kedaluwarsa selesai.'
        ]);
    }
}

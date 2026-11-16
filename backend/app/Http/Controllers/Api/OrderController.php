<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchTicketQuota;
use App\Models\Order;
use App\Models\TurnstileLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function releaseExpiredOrders()
    {
        $expiredOrders = Order::where('status', 'PENDING')
            ->where('expires_at', '<', now())
            ->get();

        foreach ($expiredOrders as $order) {
            DB::transaction(function () use ($order) {
                $quota = MatchTicketQuota::where('match_id', $order->match_id)->lockForUpdate()->first();
                if ($quota) {
                    $quota->available_quota += $order->quantity;
                    $quota->held_quota = max(0, $quota->held_quota - $order->quantity);
                    $quota->save();
                }
                $order->update(['status' => 'EXPIRED']);
            });
        }
    }

    public function checkout(Request $request)
    {
        $this->releaseExpiredOrders();

        $data = $request->validate([
            'match_id' => 'required|exists:matches,id',
            'quantity' => 'required|integer|min:1|max:5',
            'payment_method' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $data) {
            $quota = MatchTicketQuota::where('match_id', $data['match_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($quota->sale_status !== 'OPEN') {
                return response()->json(['message' => 'Penjualan tiket untuk laga ini sudah ditutup'], 422);
            }

            if ($quota->available_quota < $data['quantity']) {
                return response()->json(['message' => 'Kuota tiket tidak mencukupi'], 422);
            }

            $quota->available_quota -= $data['quantity'];
            $quota->held_quota += $data['quantity'];
            $quota->save();

            $adminFee = 2500;
            $totalAmount = ($quota->price * $data['quantity']) + $adminFee;
            $randomNum = rand(100000, 999999);

            $order = Order::create([
                'order_code' => 'FTX-' . $randomNum,
                'user_id' => $request->user()->id,
                'match_id' => $data['match_id'],
                'quantity' => $data['quantity'],
                'unit_price' => $quota->price,
                'admin_fee' => $adminFee,
                'total_amount' => $totalAmount,
                'status' => 'PENDING',
                'payment_method' => $data['payment_method'] ?? 'QRIS',
                'snap_token' => 'SNAP-' . Str::random(24),
                'expires_at' => now()->addMinutes(10),
                'qr_payload' => 'TIX-GGM-' . $randomNum . '-' . strtoupper(Str::random(4)),
            ]);

            return response()->json([
                'message' => 'Kuota berhasil dikunci selama 10 menit',
                'order' => $order->load(['match.homeTeam', 'match.awayTeam', 'match.category']),
            ], 201);
        });
    }

    public function pay(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->status === 'PAID') {
            return response()->json(['message' => 'Pesanan sudah dibayar', 'order' => $order]);
        }

        if ($order->status === 'EXPIRED' || ($order->expires_at && $order->expires_at->isPast())) {
            $this->releaseExpiredOrders();
            return response()->json(['message' => 'Waktu pembayaran habis, silakan pesan ulang'], 422);
        }

        return DB::transaction(function () use ($request, $order) {
            $quota = MatchTicketQuota::where('match_id', $order->match_id)->lockForUpdate()->first();
            if ($quota) {
                $quota->held_quota = max(0, $quota->held_quota - $order->quantity);
                $quota->save();
            }

            $order->update([
                'status' => 'PAID',
                'payment_method' => $request->input('payment_method', $order->payment_method ?? 'QRIS'),
                'paid_at' => now(),
            ]);

            return response()->json([
                'message' => 'Pembayaran berhasil! E-Ticket siap digunakan.',
                'order' => $order->load(['match.homeTeam', 'match.awayTeam', 'match.category']),
            ]);
        });
    }

    public function myTickets(Request $request)
    {
        $this->releaseExpiredOrders();

        $orders = Order::with(['match.homeTeam', 'match.awayTeam', 'match.category'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function verifyGate(Request $request)
    {
        $data = $request->validate([
            'qr_payload' => 'required|string',
            'gate_name' => 'nullable|string',
        ]);

        $operator = $request->user();
        $gateName = $data['gate_name'] ?? $operator->assigned_gate ?? 'GATE A - TRIBUN UTARA';
        $code = trim($data['qr_payload']);

        $order = Order::with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])
            ->where('qr_payload', $code)
            ->orWhere('order_code', $code)
            ->first();

        if (!$order || $order->status !== 'PAID') {
            $log = TurnstileLog::create([
                'order_id' => $order?->id,
                'operator_id' => $operator->id,
                'scanned_code' => $code,
                'gate_name' => $gateName,
                'result' => 'INVALID',
                'message' => 'Kode tiket tidak terdaftar atau belum dibayar',
            ]);

            return response()->json([
                'status' => 'INVALID',
                'message' => 'TIKET TIDAK VALID / BELUM LUNAS',
                'log' => $log,
            ], 404);
        }

        if ($order->is_checked_in) {
            $log = TurnstileLog::create([
                'order_id' => $order->id,
                'operator_id' => $operator->id,
                'scanned_code' => $code,
                'gate_name' => $gateName,
                'result' => 'DUPLICATE',
                'message' => 'Tiket sudah dipakai masuk pada ' . $order->checked_in_at->format('H:i'),
            ]);

            return response()->json([
                'status' => 'DUPLICATE',
                'message' => 'TIKET SUDAH DIGUNAKAN (ANTI-DUPLIKAT)',
                'order' => $order,
                'log' => $log,
            ], 409);
        }

        $order->update([
            'is_checked_in' => true,
            'checked_in_at' => now(),
            'checked_in_by' => $operator->id,
            'checked_in_gate' => $gateName,
        ]);

        $log = TurnstileLog::create([
            'order_id' => $order->id,
            'operator_id' => $operator->id,
            'scanned_code' => $code,
            'gate_name' => $gateName,
            'result' => 'VALID',
            'message' => 'Akses diizinkan untuk ' . $order->quantity . ' penonton (' . $order->user->name . ')',
        ]);

        return response()->json([
            'status' => 'VALID',
            'message' => 'AKSES DIIZINKAN — SILAKAN MASUK',
            'order' => $order,
            'log' => $log,
        ]);
    }

    public function scanLogs()
    {
        $logs = TurnstileLog::with(['order.user', 'operator'])
            ->latest()
            ->take(20)
            ->get();

        return response()->json(['logs' => $logs]);
    }
}
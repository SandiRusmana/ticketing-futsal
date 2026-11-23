<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FutsalMatch;
use App\Models\MatchTicketQuota;
use App\Models\Order;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function summary()
    {
        $paidOrdersQuery = Order::where('status', 'PAID');
        $grossRevenue = (int) (clone $paidOrdersQuery)->sum('total_amount');
        $ticketsSold = (int) (clone $paidOrdersQuery)->sum('quantity');
        $checkedInCount = (int) Order::where('status', 'PAID')->where('is_checked_in', true)->sum('quantity');
        $activeMatchesCount = FutsalMatch::whereIn('status', ['UPCOMING', 'LIVE'])->count();
        $liveMatchesCount = FutsalMatch::where('status', 'LIVE')->count();
        $totalOperators = User::where('role', 'operator')->count();

        // Hitung persentase kapasitas terisi dari total kuota tiket
        $totalQuota = (int) MatchTicketQuota::sum('total_quota');
        $availableQuota = (int) MatchTicketQuota::sum('available_quota');
        $usedQuota = max(0, $totalQuota - $availableQuota);
        $capacityPercentage = $totalQuota > 0 ? round(($usedQuota / $totalQuota) * 100) : 0;

        // Penjualan Harian Real dari Database MySQL
        $dailySales = Order::where('status', 'PAID')
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, SUM(quantity) as tickets')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->take(7)
            ->get();

        // 15 Transaksi Terkini Real dari MySQL
        $recentTransactions = Order::with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])
            ->where('status', 'PAID')
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($order) {
                $home = $order->match?->homeTeam?->name ?? $order->match?->home_placeholder ?? 'Tim Home';
                $away = $order->match?->awayTeam?->name ?? $order->match?->away_placeholder ?? 'Tim Away';
                return [
                    'id'             => $order->id,
                    'order_code'     => $order->order_code,
                    'buyer_name'     => $order->user?->name ?? 'Suporter Futsal',
                    'buyer_email'    => $order->user?->email ?? '-',
                    'match_title'    => "{$home} vs {$away}",
                    'quantity'       => $order->quantity,
                    'total_amount'   => $order->total_amount,
                    'payment_method' => $order->payment_method ?? 'Midtrans Snap',
                    'payment_status' => $order->status,
                    'created_at'     => $order->created_at?->format('d M Y H:i'),
                ];
            });

        return response()->json([
            'status'               => 'success',
            'gross_revenue'        => $grossRevenue,
            'total_revenue'        => $grossRevenue,
            'total_tickets_sold'   => $ticketsSold,
            'tickets_sold'         => $ticketsSold,
            'checked_in_count'     => $checkedInCount,
            'capacity_percentage'  => $capacityPercentage,
            'active_matches_count' => $activeMatchesCount,
            'live_matches_count'   => $liveMatchesCount,
            'total_operators'      => $totalOperators,
            'daily_sales'          => $dailySales,
            'recent_transactions'  => $recentTransactions,
            'recent_orders'        => $recentTransactions,
            'stats' => [
                'total_revenue'        => $grossRevenue,
                'tickets_sold'         => $ticketsSold,
                'checked_in_count'     => $checkedInCount,
                'capacity_percentage'  => $capacityPercentage,
                'active_matches'       => $activeMatchesCount,
                'live_matches'         => $liveMatchesCount,
                'total_operators'      => $totalOperators,
            ],
            'operators' => User::where('role', 'operator')->latest()->get(),
        ]);
    }
}
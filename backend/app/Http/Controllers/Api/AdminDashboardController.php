<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FutsalMatch;
use App\Models\Order;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function summary()
    {
        $paidOrders = Order::where('status', 'PAID');

        return response()->json([
            'stats' => [
                'total_revenue' => (int) $paidOrders->sum('total_amount'),
                'tickets_sold' => (int) $paidOrders->sum('quantity'),
                'checked_in_count' => (int) Order::where('status', 'PAID')->where('is_checked_in', true)->sum('quantity'),
                'active_matches' => FutsalMatch::whereIn('status', ['UPCOMING', 'LIVE'])->count(),
                'total_operators' => User::where('role', 'operator')->count(),
            ],
            'recent_orders' => Order::with(['user', 'match.homeTeam', 'match.awayTeam', 'match.category'])
                ->latest()
                ->take(10)
                ->get(),
            'operators' => User::where('role', 'operator')->latest()->get(),
        ]);
    }
}
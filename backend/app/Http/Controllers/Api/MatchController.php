<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FutsalMatch;
use App\Models\MatchTicketQuota;
use App\Models\Team;
use App\Models\TournamentCategory;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $query = FutsalMatch::with(['category', 'homeTeam', 'awayTeam', 'winnerTeam', 'ticketQuota', 'events.team'])
            ->orderBy('match_time', 'asc');

        if ($request->filled('category') && $request->category !== 'ALL') {
            $query->whereHas('category', fn($q) => $q->where('code', strtoupper($request->category)));
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        return response()->json([
            'categories' => TournamentCategory::all(),
            'teams' => Team::with('category')->get(),
            'matches' => $query->get(),
        ]);
    }

    public function show($id)
    {
        $match = FutsalMatch::with(['category', 'homeTeam', 'awayTeam', 'winnerTeam', 'ticketQuota', 'events.team'])
            ->findOrFail($id);

        return response()->json(['match' => $match]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:tournament_categories,id',
            'home_team_id' => 'nullable|exists:teams,id',
            'away_team_id' => 'nullable|exists:teams,id',
            'home_placeholder' => 'nullable|string',
            'away_placeholder' => 'nullable|string',
            'match_time' => 'required|date',
            'stage' => 'required|in:GROUP,ROUND_16,QUARTER_FINAL,SEMI_FINAL,FINAL',
            'bracket_slot' => 'nullable|string',
            'total_quota' => 'required|integer|min:10',
            'price' => 'required|integer|min:0',
        ]);

        $match = FutsalMatch::create([
            'category_id' => $data['category_id'],
            'home_team_id' => $data['home_team_id'] ?? null,
            'away_team_id' => $data['away_team_id'] ?? null,
            'home_placeholder' => $data['home_placeholder'] ?? null,
            'away_placeholder' => $data['away_placeholder'] ?? null,
            'match_time' => $data['match_time'],
            'stage' => $data['stage'],
            'bracket_slot' => $data['bracket_slot'] ?? null,
            'status' => 'UPCOMING',
        ]);

        MatchTicketQuota::create([
            'match_id' => $match->id,
            'total_quota' => $data['total_quota'],
            'available_quota' => $data['total_quota'],
            'held_quota' => 0,
            'price' => $data['price'],
            'sale_status' => 'OPEN',
        ]);

        return response()->json([
            'message' => 'Pertandingan berhasil ditambahkan',
            'match' => $match->load(['category', 'homeTeam', 'awayTeam', 'ticketQuota']),
        ], 201);
    }

    public function toggleSaleStatus($id)
    {
        $quota = MatchTicketQuota::where('match_id', $id)->firstOrFail();
        $quota->sale_status = $quota->sale_status === 'OPEN' ? 'CLOSED' : 'OPEN';
        $quota->save();

        return response()->json([
            'message' => 'Status penjualan tiket diperbarui',
            'sale_status' => $quota->sale_status,
        ]);
    }
}
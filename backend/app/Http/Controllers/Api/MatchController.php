<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatchDetail;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    // GET /api/matches (Ambil daftar match + filter kategori)
    public function index(Request $request)
    {
        $query = MatchDetail::with(['category', 'homeTeam', 'awayTeam', 'quota']);

        // Filter berdasarkan nama kategori (misal: SMP atau SMA/SMK)
        if ($request->has('category') && $request->category != '') {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('category_name', $request->category);
            });
        }

        $matches = $query->orderBy('match_date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $matches
        ], 200);
    }

    // GET /api/matches/{id} (Ambil detail 1 pertandingan)
    public function show($id)
    {
        $match = MatchDetail::with(['category', 'homeTeam', 'awayTeam', 'quota'])->find($id);

        if (!$match) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pertandingan tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $match
        ], 200);
    }
}
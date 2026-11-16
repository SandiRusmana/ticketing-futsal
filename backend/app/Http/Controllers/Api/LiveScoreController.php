<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FutsalMatch;
use App\Models\MatchEvent;
use Illuminate\Http\Request;

class LiveScoreController extends Controller
{
    public function updateScore(Request $request, $id)
    {
        $match = FutsalMatch::findOrFail($id);

        $data = $request->validate([
            'status' => 'nullable|in:UPCOMING,LIVE,FINISHED',
            'home_score' => 'nullable|integer|min:0',
            'away_score' => 'nullable|integer|min:0',
            'home_fouls' => 'nullable|integer|min:0',
            'away_fouls' => 'nullable|integer|min:0',
            'match_minute' => 'nullable|string|max:20',
            'winner_team_id' => 'nullable|exists:teams,id',
        ]);

        $match->update(array_filter($data, fn($val) => !is_null($val)));

        if ($match->status === 'FINISHED' && !$match->winner_team_id) {
            if ($match->home_score > $match->away_score) {
                $match->update(['winner_team_id' => $match->home_team_id, 'match_minute' => 'FT']);
            } elseif ($match->away_score > $match->home_score) {
                $match->update(['winner_team_id' => $match->away_team_id, 'match_minute' => 'FT']);
            }
        }

        return response()->json([
            'message' => 'Skor & status pertandingan diperbarui',
            'match' => $match->load(['category', 'homeTeam', 'awayTeam', 'winnerTeam', 'events.team']),
        ]);
    }

    public function addEvent(Request $request, $id)
    {
        $match = FutsalMatch::findOrFail($id);

        $data = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'player_name' => 'required|string|max:100',
            'event_type' => 'required|in:GOAL,YELLOW_CARD,RED_CARD,FOUL',
            'minute' => 'required|integer|min:1|max:60',
        ]);

        $event = MatchEvent::create([
            'match_id' => $match->id,
            ...$data,
        ]);

        if ($data['event_type'] === 'GOAL') {
            if ($data['team_id'] == $match->home_team_id) {
                $match->increment('home_score');
            } elseif ($data['team_id'] == $match->away_team_id) {
                $match->increment('away_score');
            }
        } elseif ($data['event_type'] === 'FOUL') {
            if ($data['team_id'] == $match->home_team_id) {
                $match->increment('home_fouls');
            } elseif ($data['team_id'] == $match->away_team_id) {
                $match->increment('away_fouls');
            }
        }

        return response()->json([
            'message' => 'Momen pertandingan dicatat',
            'event' => $event->load('team'),
            'match' => $match->fresh(['category', 'homeTeam', 'awayTeam', 'events.team']),
        ], 201);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchEvent extends Model
{
    protected $fillable = ['match_id', 'team_id', 'player_name', 'event_type', 'minute'];

    public function match()
    {
        return $this->belongsTo(FutsalMatch::class, 'match_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }
}
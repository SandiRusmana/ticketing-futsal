<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchDetail extends Model
{
    protected $table = 'matches';
    public $timestamps = false; // <-- Matikan timestamp otomatis Laravel
    protected $guarded = ['id'];

    public function category()
    {
        return $this->belongsTo(TournamentCategory::class, 'category_id');
    }

    public function homeTeam()
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    public function awayTeam()
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    public function quota()
    {
        return $this->hasOne(MatchTicketQuota::class, 'match_id');
    }
}
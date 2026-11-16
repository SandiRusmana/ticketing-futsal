<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FutsalMatch extends Model
{
    protected $table = 'matches';

    protected $fillable = [
        'category_id',
        'home_team_id',
        'away_team_id',
        'home_placeholder',
        'away_placeholder',
        'match_time',
        'venue',
        'stage',
        'bracket_slot',
        'status',
        'home_score',
        'away_score',
        'home_fouls',
        'away_fouls',
        'match_minute',
        'winner_team_id',
    ];

    protected $casts = [
        'match_time' => 'datetime',
    ];

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

    public function winnerTeam()
    {
        return $this->belongsTo(Team::class, 'winner_team_id');
    }

    public function ticketQuota()
    {
        return $this->hasOne(MatchTicketQuota::class, 'match_id');
    }

    public function events()
    {
        return $this->hasMany(MatchEvent::class, 'match_id')->orderBy('minute');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'match_id');
    }
}
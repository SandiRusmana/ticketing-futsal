<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TournamentCategory extends Model
{
    protected $fillable = ['code', 'name', 'ticket_price'];

    public function teams()
    {
        return $this->hasMany(Team::class, 'category_id');
    }

    public function matches()
    {
        return $this->hasMany(FutsalMatch::class, 'category_id');
    }
}
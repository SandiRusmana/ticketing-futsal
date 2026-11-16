<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = ['category_id', 'name', 'short_name', 'logo_color'];

    public function category()
    {
        return $this->belongsTo(TournamentCategory::class, 'category_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchTicketQuota extends Model
{
    protected $fillable = [
        'match_id',
        'total_quota',
        'available_quota',
        'held_quota',
        'price',
        'sale_status',
    ];

    public function match()
    {
        return $this->belongsTo(FutsalMatch::class, 'match_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchTicketQuota extends Model
{
    protected $table = 'match_ticket_quotas';
    public $timestamps = false;
    protected $guarded = ['id'];

    public function match()
    {
        return $this->belongsTo(MatchDetail::class, 'match_id');
    }
}
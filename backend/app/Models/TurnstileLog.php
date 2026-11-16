<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TurnstileLog extends Model
{
    protected $fillable = ['order_id', 'operator_id', 'scanned_code', 'gate_name', 'result', 'message'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
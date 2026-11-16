<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_code',
        'user_id',
        'match_id',
        'quantity',
        'unit_price',
        'admin_fee',
        'total_amount',
        'status',
        'payment_method',
        'snap_token',
        'expires_at',
        'paid_at',
        'qr_payload',
        'is_checked_in',
        'checked_in_at',
        'checked_in_by',
        'checked_in_gate',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'is_checked_in' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function match()
    {
        return $this->belongsTo(FutsalMatch::class, 'match_id');
    }

    public function checkedInOperator()
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }
}
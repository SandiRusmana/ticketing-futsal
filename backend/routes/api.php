<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\OrderController;

// Endpoint Pertandingan & Kuota
Route::get('/matches', [MatchController::class, 'index']);
Route::get('/matches/{id}', [MatchController::class, 'show']);

// Endpoint Checkout & Holding Kuota 10 Menit
Route::post('/orders/checkout', [OrderController::class, 'checkout']);
Route::post('/orders/release-expired', [OrderController::class, 'releaseExpiredOrders']);
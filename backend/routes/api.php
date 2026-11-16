<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminOperatorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LiveScoreController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

// Public Endpoints
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/matches', [MatchController::class, 'index']);
Route::get('/matches/{id}', [MatchController::class, 'show']);

// Protected Endpoints (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Suporter Ticketing
    Route::post('/orders/checkout', [OrderController::class, 'checkout']);
    Route::post('/orders/{id}/pay', [OrderController::class, 'pay']);
    Route::get('/my-tickets', [OrderController::class, 'myTickets']);

    // Operator Gate & Meja Wasit
    Route::post('/operator/tickets/verify', [OrderController::class, 'verifyGate']);
    Route::get('/operator/scan-logs', [OrderController::class, 'scanLogs']);
    Route::patch('/matches/{id}/score', [LiveScoreController::class, 'updateScore']);
    Route::post('/matches/{id}/events', [LiveScoreController::class, 'addEvent']);
    Route::patch('/matches/{id}/toggle-sale', [MatchController::class, 'toggleSaleStatus']);

    // Super Admin GGM
    Route::get('/admin/summary', [AdminDashboardController::class, 'summary']);
    Route::post('/admin/matches', [MatchController::class, 'store']);
    Route::get('/admin/operators', [AdminOperatorController::class, 'index']);
    Route::post('/admin/operators', [AdminOperatorController::class, 'store']);
});
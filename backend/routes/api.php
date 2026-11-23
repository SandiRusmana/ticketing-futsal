<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\LiveScoreController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminOperatorController;

/*
|--------------------------------------------------------------------------
| API Routes - FutsalTix Cianjur
| Turnamen Utama: Liga Futsal Pelajar (LFP) Cianjur 2026
| Standar Evaluasi Dosen Penguji (Pak Yayat)
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. OTENTIKASI & AKUN
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'handleGoogleCallback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// ==========================================
// 2. JADWAL, HASIL, KLASEMEN & TOP SCORER (REAL MYSQL)
// ==========================================
Route::get('/matches', [MatchController::class, 'index']);
Route::get('/matches/{id}', [MatchController::class, 'show']);
Route::post('/matches', [MatchController::class, 'store']);
Route::post('/admin/matches', [MatchController::class, 'store']);
Route::delete('/matches/{id}', [MatchController::class, 'destroy']);

Route::get('/categories', [MatchController::class, 'categories']);
Route::get('/teams', [MatchController::class, 'teams']);

// Fitur Wajib Evaluasi Pak Yayat:
Route::get('/standings', [MatchController::class, 'standings']);      // Klasemen Otomatis dari Laga FT
Route::get('/top-scorers', [MatchController::class, 'topScorers']);  // Top Scorer Dihitung dari match_events

// ==========================================
// 3. MEJA WASIT & KONTROL SKOR REAL-TIME
// ==========================================
Route::patch('/matches/{id}/score', [LiveScoreController::class, 'updateScore']);
Route::post('/matches/{id}/events', [LiveScoreController::class, 'addEvent']);
Route::delete('/matches/{id}/events/{eventId}', [LiveScoreController::class, 'deleteEvent']);
Route::patch('/matches/{id}/toggle-sale', [MatchController::class, 'toggleTicketSale']);

// ==========================================
// 4. SCANNER TURNSTILE & VALIDASI E-TIKET GATE
// ==========================================
Route::post('/operator/tickets/verify', [MatchController::class, 'verifyTicket']);
Route::post('/operator/scan', [MatchController::class, 'verifyTicket']);
Route::post('/operator/tickets/reset', [MatchController::class, 'resetTicketCheckIn']);
Route::get('/operator/tickets/active-test-tickets', [MatchController::class, 'activeTestTickets']);
Route::get('/operator/scan-logs', [MatchController::class, 'scanLogs']);

// ==========================================
// 5. TRANSAKSI TIKET & MIDTRANS SNAP GATEWAY
// ==========================================
Route::post('/orders/checkout', [OrderController::class, 'checkout']);
Route::post('/orders/{id}/pay', [OrderController::class, 'payOrder']);
Route::post('/orders/confirm-payment', [OrderController::class, 'payOrder']);
Route::post('/orders/webhook', [OrderController::class, 'handleWebhook']);
Route::post('/orders/midtrans-callback', [OrderController::class, 'handleWebhook']);
Route::post('/orders/release-expired', [OrderController::class, 'releaseExpiredOrders']);
Route::get('/my-tickets', [OrderController::class, 'myTickets']);

// ==========================================
// 6. DASHBOARD SUPER ADMIN GGM
// ==========================================
Route::get('/admin/summary', [AdminDashboardController::class, 'summary']);
Route::get('/admin/operators', [AdminOperatorController::class, 'index']);
Route::post('/admin/operators', [AdminOperatorController::class, 'store']);
Route::post('/admin/operators/{id}/status', [AdminOperatorController::class, 'updateStatus']);

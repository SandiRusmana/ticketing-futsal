<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 40)->unique(); // Contoh: FTX-882910
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $table->unsignedTinyInteger('quantity');
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('admin_fee')->default(2500);
            $table->unsignedInteger('total_amount');

            // Pembayaran & Hold Timer
            $table->enum('status', ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'])->default('PENDING');
            $table->string('payment_method', 50)->nullable(); // QRIS, GoPay, DANA, VA
            $table->string('snap_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();

            // E-Ticket & Turnstile Gate Check-in
            $table->string('qr_payload', 64)->unique(); // Contoh: TIX-GGM-882910-ABCD
            $table->boolean('is_checked_in')->default(false);
            $table->timestamp('checked_in_at')->nullable();
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('checked_in_gate', 50)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
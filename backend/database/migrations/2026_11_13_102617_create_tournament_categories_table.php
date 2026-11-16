<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tournament_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // SD, SMP, SMA
            $table->string('name'); // Tingkat SD / Sederajat
            $table->integer('ticket_price')->default(15000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_categories');
    }
};
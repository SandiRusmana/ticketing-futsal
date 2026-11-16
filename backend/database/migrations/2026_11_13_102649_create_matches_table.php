<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('tournament_categories')->cascadeOnDelete();
            $table->foreignId('home_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('away_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('home_placeholder')->nullable(); // Contoh: Pemenang QF 1
            $table->string('away_placeholder')->nullable(); // Contoh: Pemenang QF 2

            // Waktu & Venue
            $table->dateTime('match_time');
            $table->string('venue')->default('GOR Gelanggang Generasi Muda (GGM) Cianjur');

            // Tahap Turnamen & Bagan
            $table->enum('stage', ['GROUP', 'ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'])->default('ROUND_16');
            $table->string('bracket_slot', 20)->nullable(); // Contoh: R16-1, QF-1, SF-1, FINAL

            // Status & Live Score Meja Wasit
            $table->enum('status', ['UPCOMING', 'LIVE', 'FINISHED'])->default('UPCOMING');
            $table->unsignedTinyInteger('home_score')->default(0);
            $table->unsignedTinyInteger('away_score')->default(0);
            $table->unsignedTinyInteger('home_fouls')->default(0);
            $table->unsignedTinyInteger('away_fouls')->default(0);
            $table->string('match_minute', 20)->nullable(); // Contoh: "24' Babak 2" atau "FT"
            $table->foreignId('winner_team_id')->nullable()->constrained('teams')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
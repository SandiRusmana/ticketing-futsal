<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('match_ticket_quotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->unique()->constrained('matches')->cascadeOnDelete();
            $table->unsignedInteger('total_quota')->default(400);
            $table->unsignedInteger('available_quota')->default(400);
            $table->unsignedInteger('held_quota')->default(0);
            $table->integer('price')->default(15000);
            $table->enum('sale_status', ['OPEN', 'CLOSED'])->default('OPEN');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_ticket_quotas');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('tournament_categories')->cascadeOnDelete();
            $table->string('name'); // Contoh: SMAN 1 Cianjur
            $table->string('short_name', 15); // Contoh: SMANSA
            $table->string('logo_color', 20)->default('#C6FF00');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
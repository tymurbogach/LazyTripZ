<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pet_recommendations', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('recommendation', 320);
            $table->string('reason', 1024)->nullable();
            $table->foreignId('recommendation_type_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('pet_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pet_recommendations');
    }
};

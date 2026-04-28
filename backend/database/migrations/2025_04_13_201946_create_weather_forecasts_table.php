<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('weather_forecasts', function (Blueprint $table) {
        $table->id();
        $table->timestamps();
        $table->decimal('temperature', 5, 2);
        $table->unsignedInteger('rain_probability');
        $table->string('forecast', 64);
        $table->date('day');
        $table->time('time');
        $table->foreignId('location_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weather_forecasts');
    }
};

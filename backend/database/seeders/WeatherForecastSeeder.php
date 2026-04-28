<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WeatherForecast;

class WeatherForecastSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (WeatherForecast::count() > 0) {
            $this->command->info('Weather forecasts already exist. Skipping seeding.');
            return;
        }

        WeatherForecast::factory(30)->create();

        $this->command->info('Weather forecasts seeded successfully.');
    }
}

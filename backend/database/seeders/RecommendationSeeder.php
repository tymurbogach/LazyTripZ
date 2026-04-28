<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recommendation;
use App\Models\Trip;
use App\Models\RecommendationType;

class RecommendationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Recommendation::count() > 0) {
            $this->command->info('Recommendations already exist. Skipping seeding.');
            return;
        }

        $trips = Trip::all();
        $types = RecommendationType::all();

        foreach ($trips as $trip) {
            // Crear 3-5 recomendaciones por viaje
            Recommendation::factory()
                ->count(rand(3, 5))
                ->create([
                    'trip_id' => $trip->id,
                    'recommendation_type_id' => $types->random()->id
                ]);
        }

        $this->command->info('Recommendations seeded successfully.');
    }
}

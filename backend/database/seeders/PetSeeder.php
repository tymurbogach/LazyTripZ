<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Pet;
use App\Models\Trip;

class PetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Pet::count() > 0) {
            $this->command->info('Pets already exist. Skipping seeding.');
            return;
        }

        $trips = Trip::all();

        foreach ($trips as $trip) {
            // Crear 1-2 mascotas por viaje
            Pet::factory()->count(rand(1, 2))->create([
                    'trip_id' => $trip->id
                ]);
        }

        $this->command->info('Pets seeded successfully.');
    }
}

<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Location::count() > 0) {
            $this->command->info('Locations already exist. Skipping seeding.');
            return;
        }

        Location::factory()->count(10)->create();

        $this->command->info('Locations seeded successfully.');
    }
}

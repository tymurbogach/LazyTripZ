<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Activity;

class ActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verificar si ya existen actividades
        if (Activity::count() > 0) {
            $this->command->info('Activities already exist. Skipping seeding.');
            return;
        }

        // Crear 20 actividades de prueba
        Activity::factory(20)->create();

        $this->command->info('Activities seeded successfully.');
    }
}

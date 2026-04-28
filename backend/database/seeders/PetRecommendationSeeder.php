<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PetRecommendation;
use App\Models\Pet;
use App\Models\RecommendationType;

class PetRecommendationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (PetRecommendation::count() > 0) {
            $this->command->info('Pet recommendations already exist. Skipping seeding.');
            return;
        }

        $pets = Pet::all();
        $types = RecommendationType::all();

        $recommendations = [
            'Este lugar es apto para mascotas',
            'Tiene áreas especiales para mascotas',
            'Permite mascotas en interiores',
            'Tiene servicios para mascotas',
            'No es recomendable para mascotas',
            'No tiene facilidades para mascotas',
            'Requiere reserva previa para mascotas',
            'Tiene restricciones para mascotas'
        ];

        $reasons = [
            'Cuenta con áreas verdes',
            'Tiene personal especializado',
            'Ofrece servicios veterinarios',
            'Tiene restricciones de tamaño',
            'No permite mascotas agresivas',
            'Requiere documentación especial',
            'Tiene horarios específicos',
            'Ofrece alojamiento para mascotas'
        ];

        foreach ($pets as $pet) {
            // Crear 2-3 recomendaciones por mascota
            $selectedTypes = $types->random(rand(2, 3));

            foreach ($selectedTypes as $type) {
                PetRecommendation::create([
                    'pet_id' => $pet->id,
                    'recommendation_type_id' => $type->id,
                    'recommendation' => fake()->randomElement($recommendations),
                    'reason' => fake()->randomElement($reasons)
                ]);
            }
        }

        $this->command->info('Pet recommendations seeded successfully.');
    }
}

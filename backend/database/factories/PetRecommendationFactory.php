<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\PetRecommendation;
use App\Models\Pet;
use App\Models\Trip;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PetRecomendation>
 */
class PetRecommendationFactory extends Factory
{
    protected $model = PetRecommendation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $petRecommendations = [
            'Llevar cartilla de vacunación',
            'Preparar transportín adecuado',
            'Llevar comida específica',
            'Reservar hotel pet-friendly',
            'Programar descansos frecuentes',
            'Llevar juguete favorito',
            'Visitar veterinario antes del viaje'
        ];

        $petReasons = [
            'Requisito obligatorio para viajar',
            'Para un transporte seguro y cómodo',
            'Para evitar problemas digestivos',
            'Para asegurar el alojamiento',
            'Para el bienestar del animal',
            'Para reducir el estrés del viaje',
            'Para verificar el estado de salud'
        ];

        return [
            'recommendation' => fake()->randomElement($petRecommendations),
            'reason' => fake()->randomElement($petReasons),
            'pet_id' => Pet::factory(),
            'recommendation_type_id' => \App\Models\RecommendationType::factory(),
        ];
    }
}

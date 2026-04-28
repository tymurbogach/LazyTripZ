<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\RecommendationType;
use App\Models\Trip;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Recommendation>
 */
class RecommendationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $recommendations = [
            'Llevar botiquín de primeros auxilios',
            'Reservar alojamiento con anticipación',
            'Contratar seguro de viaje',
            'Verificar documentación necesaria',
            'Planificar itinerario diario',
            'Llevar adaptador de corriente',
            'Hacer copias de documentos importantes'
        ];

        $reasons = [
            'Por seguridad durante el viaje',
            'Para evitar problemas de disponibilidad',
            'Para estar protegido ante imprevistos',
            'Para evitar inconvenientes en destino',
            'Para aprovechar mejor el tiempo',
            'Para poder usar dispositivos electrónicos',
            'En caso de pérdida de originales'
        ];

        return [
            'recommendation' => fake()->randomElement($recommendations),
            'reason' => fake()->randomElement($reasons),
            'recommendation_type_id' => RecommendationType::factory(),
            'trip_id' => Trip::factory(),
        ];
    }
}

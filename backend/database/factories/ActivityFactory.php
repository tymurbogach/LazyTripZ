<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $activities = [
            'Visita al museo',
            'Tour por la ciudad',
            'Paseo en barco',
            'Degustación de comida local',
            'Excursión a la montaña',
            'Visita a monumentos históricos',
            'Tour gastronómico',
            'Clase de cocina local',
            'Paseo en bicicleta',
            'Visita a parques naturales'
        ];

        return [
            'description' => fake()->randomElement($activities),
            'day' => fake()->dateTimeBetween('now', '+1 year'),
            'time_of_day' => fake()->randomElement(['morning', 'afternoon', 'evening']),
            'location_id' => Location::inRandomOrder()->first()->id,
            'trip_id' => Trip::inRandomOrder()->first()->id,
        ];
    }
}

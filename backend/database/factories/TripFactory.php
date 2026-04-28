<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Trip>
 */
class TripFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $destinations = [
            'París Primavera',
            'Roma Clásica',
            'Londres Weekend',
            'Barcelona Tour',
            'Madrid Cultural',
            'Berlín Express',
            'Amsterdam Canales'
        ];

        $transportOptions = [
            ['type' => 'bicycle', 'duration' => '2 hours'],
            ['type' => 'car', 'duration' => '1 hour'],
            ['type' => 'bus', 'duration' => '1.5 hours'],
            ['type' => 'train', 'duration' => '2.5 hours'],
            ['type' => 'subway', 'duration' => '45 minutes'],
            ['type' => 'plane', 'duration' => '3 hours'],
            ['type' => 'ship', 'duration' => '4 hours']
        ];

        return [
            'name' => substr(fake()->randomElement($destinations), 0, 32),
            'adults' => fake()->numberBetween(1, 4),
            'children' => fake()->numberBetween(0, 3),
            'transport' => json_encode(fake()->randomElement($transportOptions)),
        ];
    }
}

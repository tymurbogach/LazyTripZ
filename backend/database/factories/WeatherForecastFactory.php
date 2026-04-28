<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WeatherForecast>
 */
class WeatherForecastFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $forecasts = [
            'Soleado',
            'Parcialmente nublado',
            'Nublado',
            'Lluvia ligera',
            'Lluvia moderada',
            'Lluvia fuerte',
            'Tormenta',
            'Nevada ligera',
            'Nevada moderada',
            'Niebla'
        ];

        return [
            'temperature' => fake()->randomFloat(2, -10, 40),
            'rain_probability' => fake()->numberBetween(0, 100),
            'forecast' => fake()->randomElement($forecasts),
            'day' => fake()->dateTimeBetween('now', '+7 days'),
            'time' => fake()->time(),
            'location_id' => Location::inRandomOrder()->first()->id,
        ];
    }
}

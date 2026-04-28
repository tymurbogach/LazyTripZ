<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RecommendationTypeSeeder::class,
            //UserSeeder::class,
            //LocationSeeder::class,
            //TripSeeder::class,
            //PetSeeder::class,
            //ActivitySeeder::class,
        ]);
    }
}

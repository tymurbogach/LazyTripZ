<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Trip;
use App\Models\User;
use App\Models\Location;
use Carbon\Carbon;

class TripSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Trip::count() > 0) {
            $this->command->info('Trips already exist. Skipping seeding.');
            return;
        }

        $users = User::all();
        $locations = Location::all();

        foreach ($users as $user) {
            // Crear 2-3 viajes por usuario
            $trips = Trip::factory()->count(rand(2, 3))->create();

            foreach ($trips as $trip) {
                // Asociar el viaje con el usuario
                $user->trips()->attach($trip->id, [
                    'permission' => 'admin',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Asociar con otros usuarios aleatorios
                $randomUsers = $users->where('id', '!=', $user->id)->random(rand(1, 2));
                foreach ($randomUsers as $randomUser) {
                    $randomUser->trips()->attach($trip->id, [
                        'permission' => 'user',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                // Asociar con ubicaciones aleatorias
                $numLocations = rand(1, 3);
                $selectedLocations = $locations->random($numLocations);

                $startDate = Carbon::parse($trip->start_date);
                $endDate = Carbon::parse($trip->end_date);

                // Asegurarnos de que la fecha de fin sea posterior a la de inicio
                if ($endDate->lt($startDate)) {
                    $endDate = $startDate->copy()->addDays(rand(1, 7));
                    $trip->update(['end_date' => $endDate]);
                }

                $totalDays = $endDate->diffInDays($startDate);
                $daysPerLocation = max(1, floor($totalDays / $numLocations));

                foreach ($selectedLocations as $index => $location) {
                    $locationStartDate = $startDate->copy()->addDays($index * $daysPerLocation);
                    $locationEndDate = $locationStartDate->copy()->addDays($daysPerLocation - 1);

                    // Asegurarnos de que la fecha de fin no exceda la fecha final del viaje
                    if ($locationEndDate->gt($endDate)) {
                        $locationEndDate = $endDate;
                    }

                    $trip->locations()->attach($location->id, [
                        'start_date' => $locationStartDate,
                        'end_date' => $locationEndDate,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Trips seeded successfully.');
    }
}

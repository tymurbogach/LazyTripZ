<?php

namespace App\Http\Controllers;

use App\Services\WeatherForecastService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Location;
use App\Models\LocationTrip;
use App\Models\Trip;

class LocationTripController extends Controller
{
    public function getLocationsFromTrip(Trip $trip) {
        // 1.Obtengo las relaciones pivote con la localización y las previsiones
        $locationTrips = $trip->locationTrips()->with(['location', 'weatherForecasts'])->get();

        if ($locationTrips->isEmpty()) {
            return $this->sendResponse(false, 'Locations not found');
        }

        // 2.Filtro solo las que tienen previsiones
        $formattedLocations = $locationTrips->filter(function ($locationTrip) {
            return $locationTrip->weatherForecasts->isNotEmpty();
        })->map(function ($locationTrip) {
            return [
                'locality' => $locationTrip->location->locality,
                'province' => $locationTrip->location->province,
                'country' => $locationTrip->location->country,
                'start_date' => $locationTrip->start_date,
                'end_date' => $locationTrip->end_date,
                'weather_forecasts' => $locationTrip->weatherForecasts
                    ->groupBy('day')
                    ->map(function ($weather_forecasts, $day) {
                        return [
                            'day' => $day,
                            'weather_forecasts' => $weather_forecasts->map(function ($weather_forecast) {
                                return [
                                    'temperature' => round($weather_forecast->temperature, 1),
                                    'rain_probability' => $weather_forecast->rain_probability,
                                    'forecast' => $weather_forecast->forecast,
                                    'time' => Carbon::parse($weather_forecast->time)->format('G:i')
                                ];
                            })->values(),
                        ];
                    })->values(),
            ];
        })->values();

        return $this->sendResponse(true, 'Locations retrieved successfully', $formattedLocations);
    }

    public function getSimpleLocationsFromTrip(Trip $trip)
    {
        // 1.Uso locationTrips para obtener la info básica de cada localización en el viaje
        $locationTrips = $trip->locationTrips()->with('location')->get();

        if ($locationTrips->isEmpty()) {
            return $this->sendResponse(false, 'Locations not found');
        }

        $simpleLocations = $locationTrips->map(function ($locationTrip) {
            return [
                'locality' => $locationTrip->location->locality,
                'province' => $locationTrip->location->province,
                'country' => $locationTrip->location->country,
                'start_date' => $locationTrip->start_date,
                'end_date' => $locationTrip->end_date,
            ];
        })->values();

        return $this->sendResponse(true, 'Simple locations retrieved successfully', $simpleLocations);
    }

    public function addLocationsToTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'locations' => 'required|array|min:1',
                'locations.*.locality' => 'required|string|max:64',
                'locations.*.province' => 'nullable|string|max:64',
                'locations.*.country' => 'required|string|max:32',
                'locations.*.start_date' => 'required|date',
                'locations.*.end_date' => 'required|date|after_or_equal:locations.*.start_date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        // 1.Creo las localizaciones y compruebo si ya existe para no duplicar
        $added = [];
        foreach ($params['locations'] as $loc) {
            $location = Location::where('locality', $loc['locality'])->first();
            
            // 1.1.Si no existe, la creamos
            if (!$location) {
                $location = Location::create([
                    'locality' => $loc['locality'],
                    'province' => $loc['province'] ?? null,
                    'country' => $loc['country'],
                ]);
            }
            //$locations[] = $location->id;

            // 1.2.Compruebo si ya existe la relación pivote para este viaje y localización
            $exists = LocationTrip::where('trip_id', $trip->id)
                ->where('location_id', $location->id)
                ->exists();

            if (!$exists) {
                $locationTrip = LocationTrip::create([
                    'trip_id' => $trip->id,
                    'location_id' => $location->id,
                    'start_date' => $loc['start_date'],
                    'end_date' => $loc['end_date'],
                ]);

                // 2.Añado la localización y las fechas al array de añadidos
                $added[] = [
                    'locality' => $location->locality,
                    'province' => $location->province,
                    'country' => $location->country,
                    'start_date' => $locationTrip->start_date,
                    'end_date' => $locationTrip->end_date,
                ];
            }
        }

        return $this->sendResponse(true, 'Locations successfully added to trip', $added);
    }

    public function updateLocationsFromTrip(Request $request, Trip $trip, WeatherForecastService $service) {
        try {
            $params = $request->validate([
                'locations' => 'required|array|min:1',
                'locations.*.locality' => 'required|string|exists:locations,locality',
                'locations.*.start_date' => 'required|date',
                'locations.*.end_date' => 'required|date|after_or_equal:locations.*.start_date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $updated = [];

        try {
            foreach ($params['locations'] as $loc) {
                // 1.Recojo el modelo de localidad de la tabla Location
                $location = Location::where('locality', $loc['locality'])->first();
                if (!$location) {
                    continue;
                }

                // 2.Compruebo si ya existe la relación pivote para este viaje y localización
                $locationTrip = LocationTrip::where('trip_id', $trip->id)
                    ->where('location_id', $location->id)
                    ->first();

                // 3.Actualizo las fechas de la localidad en el viaje
                if ($locationTrip) {
                    $locationTrip->update([
                        'start_date' => $loc['start_date'],
                        'end_date' => $loc['end_date'],
                    ]);
                }

                // 4.Borro las previsiones del tiempo viejas y las creo con las nuevas fechas
                $locationTrip->weatherForecasts()->delete();
                $response = $service->getWeatherForecastFromApi(
                    $location, 
                    $loc['start_date'], 
                    $loc['end_date']
                );

                if ($response['success']) {
                    $service->saveWeatherForecastToLocationTrip($locationTrip, $response['data']);
                    $updated[] = [
                        'locality' => $location->locality,
                        'start_date' => $locationTrip->start_date,
                        'end_date' => $locationTrip->end_date,
                    ];
                }
            }

            return $this->sendResponse(true, 'Location succesfully updated in trip', $updated);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Internal error updating trip locations' . $e, [], 500);
        }
    }

    public function removeLocationsFromTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'locations' => 'required|array|min:1',
                'locations.*.locality' => 'required|string|max:64',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $removed = [];

        try {
            foreach ($params['locations'] as $location) {
                // 1.Recojo el modelo de localidad de la tabla Location
                $location = Location::where('locality', $location['locality'])->first();
                if (!$location) {
                    continue;
                }

                // 2.Busco la relación pivote entre el viaje y la localización
                $locationTrip = LocationTrip::where('trip_id', $trip->id)
                    ->where('location_id', $location->id)
                    ->first();
                
                // 3.Si existe, borro las previsiones del tiempo y la relación pivote
                if ($locationTrip) {
                    $locationTrip->weatherForecasts()->delete();
                    $locationTrip->delete();
                    $removed[] = [
                        'locality' => $location->locality,
                        'province' => $location->province,
                        'country' => $location->country,
                    ];
                }
            }

            return $this->sendResponse(true, 'Locations succesfully removed from trip', $removed);

        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Internal error removing trip locations', $e->getMessage(), 500);
        }
    }
}

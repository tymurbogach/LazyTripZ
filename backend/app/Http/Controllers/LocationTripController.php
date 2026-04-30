<?php

namespace App\Http\Controllers;

use App\Services\WeatherSyncService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Location;
use App\Models\LocationTrip;
use App\Models\Trip;

class LocationTripController extends Controller
{
    /**
     * Get locations from trip with weather forecasts (grouped by day).
     */
    public function getLocationsFromTrip(Trip $trip)
    {
        $locationTrips = $trip->locationTrips()
            ->with(['location', 'weatherForecasts'])
            ->get();

        if ($locationTrips->isEmpty()) {
            return $this->sendResponse(false, 'Locations not found');
        }

        $formatted = $locationTrips
            ->filter(fn($lt) => $lt->weatherForecasts->isNotEmpty())
            ->map(function ($lt) {
                return [
                    'locality' => $lt->location->locality,
                    'province' => $lt->location->province,
                    'country' => $lt->location->country,
                    'start_date' => $lt->start_date,
                    'end_date' => $lt->end_date,
                    'weather_forecasts' => $lt->weatherForecasts
                        ->groupBy('day')
                        ->map(fn($forecasts, $day) => [
                            'day' => $day,
                            'weather_forecasts' => $forecasts->map(fn($f) => [
                                'temperature' => round($f->temperature, 1),
                                'rain_probability' => $f->rain_probability,
                                'forecast' => $f->forecast,
                                'time' => Carbon::parse($f->time)->format('G:i')
                            ])->values()
                        ])->values()
                ];
            })->values();

        return $this->sendResponse(true, 'Locations retrieved successfully', $formatted);
    }

    /**
     * Get simple locations from trip (no weather).
     */
    public function getSimpleLocationsFromTrip(Trip $trip)
    {
        $locationTrips = $trip->locationTrips()
            ->with('location')
            ->get();

        if ($locationTrips->isEmpty()) {
            return $this->sendResponse(false, 'Locations not found');
        }

        $simple = $locationTrips->map(fn($lt) => [
            'locality' => $lt->location->locality,
            'province' => $lt->location->province,
            'country' => $lt->location->country,
            'start_date' => $lt->start_date,
            'end_date' => $lt->end_date,
        ])->values();

        return $this->sendResponse(true, 'Simple locations retrieved successfully', $simple);
    }

    /**
     * Add locations to a trip.
     */
    public function addLocationsToTrip(Request $request, Trip $trip)
    {
        $params = $request->validate([
            'locations' => 'required|array|min:1',
            'locations.*.locality' => 'required|string|max:64',
            'locations.*.province' => 'nullable|string|max:64',
            'locations.*.country' => 'required|string|max:32',
            'locations.*.start_date' => 'required|date',
            'locations.*.end_date' => 'required|date|after_or_equal:locations.*.start_date',
        ]);

        $added = [];

        foreach ($params['locations'] as $loc) {
            // Find or create location
            $location = Location::firstOrCreate(
                ['locality' => $loc['locality']],
                [
                    'province' => $loc['province'] ?? null,
                    'country' => $loc['country'],
                ]
            );

            // Check if relationship already exists
            $exists = LocationTrip::where('trip_id', $trip->id)
                ->where('location_id', $location->id)
                ->exists();

            if (!$exists) {
                $locationTrip = $location->locationTrips()->create([
                    'trip_id' => $trip->id,
                    'start_date' => $loc['start_date'],
                    'end_date' => $loc['end_date'],
                ]);

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

    /**
     * Update locations from trip (including weather sync).
     */
    public function updateLocationsFromTrip(Request $request, Trip $trip, WeatherSyncService $weatherService)
    {
        $params = $request->validate([
            'locations' => 'required|array|min:1',
            'locations.*.locality' => 'required|string|exists:locations,locality',
            'locations.*.start_date' => 'required|date',
            'locations.*.end_date' => 'required|date|after_or_equal:locations.*.start_date',
        ]);

        $updated = [];

        foreach ($params['locations'] as $loc) {
            $location = Location::where('locality', $loc['locality'])->first();
            if (!$location) {
                continue;
            }

            $locationTrip = LocationTrip::where('trip_id', $trip->id)
                ->where('location_id', $location->id)
                ->first();

            if (!$locationTrip) {
                continue;
            }

            // Update dates
            $locationTrip->update([
                'start_date' => $loc['start_date'],
                'end_date' => $loc['end_date'],
            ]);

            // Sync weather
            $forecast = $weatherService->fetchForecast(
                $location,
                $loc['start_date'],
                $loc['end_date']
            );

            if ($forecast['success']) {
                $weatherService->syncToLocationTrip($locationTrip, $forecast['data']);
                $updated[] = [
                    'locality' => $location->locality,
                    'start_date' => $locationTrip->start_date,
                    'end_date' => $locationTrip->end_date,
                ];
            }
        }

        return $this->sendResponse(true, 'Locations successfully updated in trip', $updated);
    }

    /**
     * Remove locations from trip.
     */
    public function removeLocationsFromTrip(Request $request, Trip $trip)
    {
        $params = $request->validate([
            'locations' => 'required|array|min:1',
            'locations.*.locality' => 'required|string|max:64',
        ]);

        $removed = [];

        foreach ($params['locations'] as $loc) {
            $location = Location::where('locality', $loc['locality'])->first();
            if (!$location) {
                continue;
            }

            $locationTrip = LocationTrip::where('trip_id', $trip->id)
                ->where('location_id', $location->id)
                ->first();

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

        return $this->sendResponse(true, 'Locations successfully removed from trip', $removed);
    }
}
<?php

namespace App\Http\Controllers;

use App\Services\WeatherForecastService;
use Illuminate\Http\Request;
use App\Models\Trip;
use App\Models\WeatherForecast;

class WeatherForecastController extends Controller
{
    public function addWeatherForecastsToTrip(Trip $trip, WeatherForecastService $service)
    {
        $locationTrips = $trip->locationTrips()->with('location')->get();
        if ($locationTrips->isEmpty()) {
            return $this->sendResponse(false, 'No locations found for this trip');
        }

        foreach ($locationTrips as $locationTrip) {
            $location = $locationTrip->location;

            $response = $service->getWeatherForecastFromApi(
                $location,
                $locationTrip->start_date,
                $locationTrip->end_date,
            );

            if ($response['success']) {
                $service->saveWeatherForecastToLocationTrip($locationTrip, $response['data']);
            }
        }

        return $this->sendResponse(true, 'Weather forecasts successfully saved and added to trip');
    }

    public function updateWeatherForecastsToTrip(Trip $trip, WeatherForecastService $service)
    {
        $locationTrips = $trip->locationTrips()->with('location')->get();
        if ($locationTrips->isEmpty()) {
            return $this->sendResponse(false, 'No locations found for this trip');
        }

        foreach ($locationTrips as $locationTrip) {
            $location = $locationTrip->location;

            $response = $service->getWeatherForecastFromApi(
                $location,
                $locationTrip->start_date,
                $locationTrip->end_date,
            );

            if ($response['success']) {
                // Elimino y guardo las nuevas previsiones para este locationTrip
                $service->syncWeatherForecastToLocationTrip($locationTrip, $response['data']);
            }
        }

        // Actualizo el campo de sincronización del trip
        $trip->last_weather_sync_at = now();
        $trip->save();

        return $this->sendResponse(true, 'Weather forecasts successfully updated for trip', $trip->last_weather_sync_at);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $weatherForecasts = WeatherForecast::all();
        if (!$weatherForecasts) {
            return $this->sendResponse(false, 'The weather forecasts table is empty');
        }

        return $this->sendResponse(true, 'Weather forecasts successfully retrieved', $weatherForecasts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

    }

    /**
     * Display the specified resource.
     */
    public function show(WeatherForecast $weatherForecast)
    {
        return $this->sendResponse(true, 'Weather forecast successfully retrieved', $weatherForecast);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, WeatherForecast $weatherForecast)
    {

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WeatherForecast $weatherForecast)
    {
        $weatherForecast->delete();
        return $this->sendResponse(true, 'Weather forecast successfully deleted');
    }
}

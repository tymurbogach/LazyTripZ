<?php

namespace App\Services;

use App\Models\Location;
use App\Models\LocationTrip;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class WeatherSyncService
{
    private string $apiKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.openweather.key');
        $this->apiUrl = config('services.openweather.url');
    }

    /**
     * Fetch weather forecast from OpenWeatherMap API.
     */
    public function fetchForecast(Location $location, string $startDate, string $endDate): array
    {
        $startTimestamp = Carbon::parse($startDate)->startOfDay()->timestamp;
        $endTimestamp = Carbon::parse($endDate)->endOfDay()->timestamp;

        // Build location query
        $query = $this->buildLocationQuery($location);

        // Get coordinates
        $coords = $this->getCoordinates($query);
        if (!$coords) {
            return [
                'success' => false,
                'message' => "No coordinates found for {$location->locality}"
            ];
        }

        // Fetch weather data
        $weather = $this->fetchWeatherData($coords['lat'], $coords['lon']);
        if (!$weather) {
            return [
                'success' => false,
                'message' => "No weather data for {$location->locality}"
            ];
        }

        // Filter by date range
        $filteredData = $this->filterByDateRange($weather, $startTimestamp, $endTimestamp);
        if ($filteredData->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No weather forecasts in date range'
            ];
        }

        return [
            'success' => true,
            'message' => "Weather forecast fetched for {$location->locality}",
            'data' => $filteredData
        ];
    }

    /**
     * Sync weather to a LocationTrip (delete old + save new).
     */
    public function syncToLocationTrip(LocationTrip $locationTrip, array $weatherData): array
    {
        // Delete existing forecasts
        $locationTrip->weatherForecasts()->delete();

        // Save new forecasts
        $saved = [];
        foreach ($weatherData as $entry) {
            $locationTrip->weatherForecasts()->create([
                'temperature' => $entry['main']['temp'],
                'rain_probability' => $entry['pop'] * 100,
                'forecast' => $entry['weather'][0]['main'],
                'day' => date('Y-m-d', $entry['dt']),
                'time' => date('H:i', $entry['dt']),
            ]);
            $saved[] = $entry;
        }

        return [
            'success' => true,
            'message' => 'Weather forecasts synced',
            'data' => $saved
        ];
    }

    /**
     * Build location query string.
     */
    private function buildLocationQuery(Location $location): string
    {
        $parts = array_filter([
            $location->locality,
            $location->province ?? null,
            $location->country ?? null
        ]);

        return implode(',', $parts);
    }

    /**
     * Get coordinates from geocoding API.
     */
    private function getCoordinates(string $query): ?array
    {
        $response = Http::get("{$this->apiUrl}/geo/1.0/direct", [
            'q' => $query,
            'limit' => 1,
            'appid' => $this->apiKey,
        ]);

        if (!$response->successful() || empty($response[0])) {
            return null;
        }

        return [
            'lat' => $response[0]['lat'],
            'lon' => $response[0]['lon']
        ];
    }

    /**
     * Fetch weather data from API.
     */
    private function fetchWeatherData(float $lat, float $lon): ?array
    {
        $response = Http::get("{$this->apiUrl}/data/2.5/forecast", [
            'lat' => $lat,
            'lon' => $lon,
            'appid' => $this->apiKey,
            'units' => 'metric',
            'lang' => 'es',
        ]);

        if (!$response->successful()) {
            return null;
        }

        return $response['list'];
    }

    /**
     * Filter weather data by date range.
     */
    private function filterByDateRange(array $weatherData, int $start, int $end): array
    {
        return collect($weatherData)
            ->filter(fn($entry) => $entry['dt'] >= $start && $entry['dt'] <= $end)
            ->values()
            ->all();
    }
}
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use App\Models\Location;
use App\Models\LocationTrip;

class WeatherForecastService 
{
    public function getWeatherForecastFromApi(Location $location, $startDate, $endDate) {
        $apiKey = config('services.openweather.key');
        $apiUrl = config('services.openweather.url');

        $startDate = Carbon::parse($startDate)->startOfDay()->timestamp;
        $endDate = Carbon::parse($endDate)->endOfDay()->timestamp;

        $qParts = array_filter([
            $location['locality'],
            $location['province'] ?? null,
            $location['country'] ?? null
        ]);
        $q = implode(',', $qParts);

        $geo = Http::get("$apiUrl/geo/1.0/direct", [
            'q' => $q,
            'limit' => 1,
            'appid' => $apiKey,
        ]);

        if (!$geo->successful() || empty($geo[0])) {
            return [
                'success' => false,
                'message' => 'No se han encontrado las coordenadas de ' . $location['locality']
            ];
        }

        $lat = $geo[0]['lat'];
        $lon = $geo[0]['lon'];

        $weather = Http::get("$apiUrl/data/2.5/forecast", [
            'lat' => $lat,
            'lon' => $lon,
            'appid' => $apiKey,
            'units' => 'metric',
            'lang' => 'es',
        ]);

        if (!$weather->successful()) {
            return [
                'success' => false,
                'message' => 'No se ha encontrado la previsión del tiempo para ' . $location['locality']
            ];
        }

        $dataWeather = collect($weather['list'])->filter(function ($entry) use ($startDate, $endDate) {
            return $entry['dt'] >= $startDate && $entry['dt'] <= $endDate;
        })->values();

        if (empty($dataWeather)) {
            return [
                'success' => false, 
                'message' => 'No existen previsiones de tiempo'
            ];
        }

        return [
            'success' => true, 
            'message' => 'Previsión del tiempo añadida a la localidad ' . $location['locality'],
            'data' => $dataWeather,
        ];
    }

    public function saveWeatherForecastToLocationTrip(LocationTrip $locationTrip, $dataWeather) {
        foreach ($dataWeather as $entry) {
            $locationTrip->weatherForecasts()->create([
                'temperature' => $entry['main']['temp'],
                'rain_probability' => $entry['pop'] * 100,
                'forecast' => $entry['weather'][0]['main'],
                'day' => date('Y-m-d', $entry['dt']),
                'time' => date('H:i', $entry['dt']),
            ]);
        }
        return [
            'success' => true, 
            'message' => 'Previsiones del tiempo añadidas en base de datos con éxito'
        ];
    }

    public function syncWeatherForecastToLocationTrip(LocationTrip $locationTrip, $dataWeather) {
        // 1.Elimino previsiones antiguas
        $locationTrip->weatherForecasts()->delete();

        // 2.Uso la función save para guardar las nuevas
        return $this->saveWeatherForecastToLocationTrip($locationTrip, $dataWeather);
    }
}
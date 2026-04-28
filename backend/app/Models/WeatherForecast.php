<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeatherForecast extends Model
{
    /** @use HasFactory<\Database\Factories\WeatherForecastFactory> */
    use HasFactory;

    protected $fillable = [
        'temperature',
        'rain_probability',
        'forecast',
        'day',
        'time',
        'location_trip_id'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];


    public function locationTrip()
    {
        return $this->belongsTo(LocationTrip::class);
    }
}

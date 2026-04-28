<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationTrip extends Model
{
    protected $table = 'location_trip';

    protected $fillable = [
        'trip_id',
        'location_id',
        'start_date',
        'end_date',
    ];

    protected $hidden = [
        'updated_at',
        'created_at',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function weatherForecasts()
    {
        return $this->hasMany(WeatherForecast::class);
    }
}

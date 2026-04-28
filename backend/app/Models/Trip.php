<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    /** @use HasFactory<\Database\Factories\TripFactory> */
    use HasFactory;

    /**
    * The attributes that are mass assignable.
    *
    * @var list<string>
    */
    protected $fillable = [
        'name',
        'adults',
        'children',
        'transport',
        'last_weather_sync_at',
    ];

    /**
    * The attributes that should be hidden for serialization.
    *
    * @var list<string>
    */
    protected $hidden = [
        'updated_at',
        'created_at',
    ];

    protected $casts = [
        'transport' => 'array',
    ];

    public function users() {
        return $this->belongsToMany(User::class)->withPivot('permission');
    }

    public function pets() {
        return $this->hasMany(Pet::class);
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function locations()
    {
        return $this->belongsToMany(Location::class)->withPivot('start_date', 'end_date');
    }

    public function locationTrips()
    {
        return $this->hasMany(LocationTrip::class);
    }

    public function weatherForecasts()
    {
        return $this->hasManyThrough(
            WeatherForecast::class,
            LocationTrip::class,
            'trip_id',           // Foreign key en location_trip que apunta a trips.id
            'location_trip_id',  // Foreign key en weather_forecasts que apunta a location_trip.id
            'id',                // Local key en trips (id)
            'id'                 // Local key en location_trip (id)
        );
    }

    public function diaries()
    {
        return $this->hasMany(Diary::class);
    }
}

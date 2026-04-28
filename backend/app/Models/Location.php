<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    /** @use HasFactory<\Database\Factories\LocalityFactory> */
    use HasFactory;

    /**
    * The attributes that are mass assignable.
    *
    * @var list<string>
    */
    protected $fillable = [
        'locality',
        'province',
        'country'
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


    public function locationTrips()
    {
        return $this->hasMany(LocationTrip::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function trips()
    {
        return $this->belongsToMany(Trip::class)->withPivot('start_date', 'end_date');
    }

    public function weatherForecasts()
    {
        return $this->hasManyThrough(
            WeatherForecast::class,
            LocationTrip::class,
            'location_id',
            'location_trip_id',
            'id',
            'id'
        );
    }
}

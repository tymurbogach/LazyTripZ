<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    /** @use HasFactory<\Database\Factories\ActivityFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'description',
        'day',
        'time_of_day',
        'location_id',
        'trip_id'
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

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}

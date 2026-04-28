<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'recommendation', 
        'reason', 
        'recommendation_type_id', 
        'trip_id'
    ]; 

    protected $hidden = [
        'created_at', 
        'updated_at'
    ];

    public function recommendationType()
    {
        return $this->belongsTo(RecommendationType::class);
    }


    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PetRecommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'recommendation', 
        'reason', 
        'recommendation_type_id',
        'pet_id', 
    ];

    protected $hidden = [
        'created_at', 
        'updated_at'
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function recommendationType()
    {
        return $this->belongsTo(RecommendationType::class);
    }
}

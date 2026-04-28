<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendationType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'prompt_template',
        'label',
        'category'
    ];

    protected $hidden = [
        'created_at', 
        'updated_at'
    ];

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class);
    }

    public function petRecommendations()
    {
        return $this->hasMany(PetRecommendation::class);
    }
}

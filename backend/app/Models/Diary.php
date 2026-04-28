<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Diary extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array<string>
     */
    protected $fillable = [
        'trip_id',
        'user_id',
        'image_path',
        'description',
        'date'
    ];

    /**
     * Los atributos que deben ser ocultados para la serialización.
     *
     * @var array<string>
     */
    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'trip_id' => 'integer',
        'user_id' => 'integer'
    ];

    protected $appends = ['image_url'];

    /**
     * Obtiene el viaje asociado al diario.
     */
    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }

    /**
     * Obtiene el usuario propietario del diario.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtiene la URL completa de la imagen.
     */
    public function getImageUrlAttribute()
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:32',
            'adults' => 'required|integer|min:0',
            'children' => 'required|integer|min:0',
            'transport' => 'nullable|array',
            'transport.*' => 'in:bicycle,car,bus,train,subway,plane,ship',
            'last_weather_sync_at' => 'nullable|date',
        ];
    }
}
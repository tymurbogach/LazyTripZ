<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TripController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {
        $trips = Trip::all();
        if (!$trips) {
            return $this->sendResponse(false, 'The trips table is empty');
        }

        return $this->sendResponse(true, 'Trips successfully retrieved', $trips);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        try {
            $params = $request->validate([
                'name' => 'required|string|max:32',
                'adults' => 'required|integer|min:0',
                'children' => 'required|integer|min:0',
                'transport' => 'nullable|array',
                'transport.*' => 'in:bicycle,car,bus,train,subway,plane,ship',
                'last_weather_sync_at' => 'nullable|date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Error en las validaciones', $e->errors(), 422);
        }
        
        if (empty($params)) {
            return $this->sendResponse(false, 'No hay datos para crear el viaje');
        }

        try {
            // 1.Creo el viaje
            $trip = Trip::create($params);

            // 2.Añado el usuario al viaje con permiso de admin
            $trip->users()->attach($request->user()->id, [
                'permission' => 'admin'
            ]);

            return $this->sendResponse(true, 'Viaje creado con éxito', $trip, 201);

        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Fallo al crear el viaje: ' . $e->getMessage(), [], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Trip $trip) {
        $this->authorize('view', $trip);
        $tripArray = $trip->toArray();
        $tripArray['last_weather_sync_at'] = $trip->last_weather_sync_at
            ? Carbon::parse($trip->last_weather_sync_at)->setTimezone('Europe/Madrid')->format('Y-m-d H:i:s')
            : null;
        return $this->sendResponse(true, 'Trip successfully retrieved', $tripArray);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Trip $trip) {
        $this->authorize('update', $trip);
        try {
            $params = $request->validate([
                'name' => 'nullable|string|max:32',
                'adults' => 'nullable|integer|min:1',
                'children' => 'nullable|integer|min:0',
                'transport' => 'nullable|array',
                'transport.*' => 'in:bicycle,car,bus,train,subway,plane,ship',
                'last_weather_sync_at' => 'nullable|date',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        if (empty($params)) {
            return $this->sendResponse(false, 'No data to update');
        }

        $trip->update($params);
        $trip->refresh(); 
        return $this->sendResponse(true, 'Trip successfully updated', $trip);
    }
    
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Trip $trip) {
        $this->authorize('delete', $trip);
        $trip->delete();
        return $this->sendResponse(true, 'Trip successfully deleted',$trip);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\Trip;
use App\Models\Pet;

class PetController extends Controller
{
    public function addPetsToTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'pets' => 'required|array|min:1',
                'pets.*.type' => 'required|in:dog,cat',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        DB::beginTransaction();
        
        try {
            foreach ($params['pets'] as $data) {
                $trip->pets()->create($data);
            }

            DB::commit();
            return $this->sendResponse(true, 'Pets successfully added to trip', $trip->pets, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendResponse(false, 'Ha ocurrido un error añadiendo mascotas al viaje', [], 500);
        }
    }

    public function removePetsFromTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'pets' => 'required|array|min:1',
                'pets.*.id' => 'required|integer|min:1|exists:pets,id',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $petsId = array_column($params['pets'], 'id');
        Pet::whereIn('id', $petsId)->where('trip_id', $trip->id)->delete();

        return $this->sendResponse(true, 'Pets successfully removed from trip', null);
    }
    
    public function getPetsFromTrip(Trip $trip) {
        return $this->sendResponse(true, 'Pets retrieved successfully', $trip->pets);
    }

    /**
     * Display a listing of the resource.
     */
    public function index() {
        $pets = Pet::all();
        if (!$pets) {
            return $this->sendResponse(false, 'The pets table is empty');
        }

        return $this->sendResponse(true, 'Pets successfully retrieved', $pets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        try {
            $params = $request->validate([
                'type' => 'required|in:dog,cat',
                'trip_id' => 'required|integer|min:1|exists:trips,id',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $pet = Pet::create($params);
        return $this->sendResponse(true, 'Pet successfully created', $pet, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Pet $pet) {
        return $this->sendResponse(true, 'Pet successfully retrieved', $pet);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Pet $pet) {
        /*
        try {
            $params = $request->validate([
                'type' => 'nullable|in:dog,cat',
                'trip_id' => 'sometimes|integer|min:1|exists:trips,id',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        if (empty($params)) {
            return $this->sendResponse(false, 'No data to update');
        }

        $pet->update($params);
        $pet->refresh(); 
        return $this->sendResponse(true, 'Pet successfully updated', $pet);
        */
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pet $pet) {
        $pet->delete();
        return $this->sendResponse(true, 'Pet successfully deleted');
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Location;

class LocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {
        $locations = Location::all();
        if (!$locations) {
            return $this->sendResponse(false, 'The locations table is empty');
        }

        return $this->sendResponse(true, 'Locations successfully retrieved', $locations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        try {
            $params = $request->validate([
                'locality' => 'required|string|max:64',
                'province' => 'nullable|string|max:64',
                'country' => 'required|string|max:32',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $location = Location::firstOrNew($params);

        if ($location->exists) {
            return $this->sendResponse(false, 'Location already exists');
        }
        $location->save();
        return $this->sendResponse(true, 'Country successfully created', $location, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Location $location) {
        return $this->sendResponse(true, 'Location successfully retrieved', $location);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Location $location) {

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Location $location) {
        $location->delete();
        return $this->sendResponse(true, 'Location successfully deleted');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\RecommendationType;
use App\Models\Trip;
use Illuminate\Http\Request;

class RecommendationTypeController extends Controller
{
    public function getRecommendationTypesFromTrip(Trip $trip) {
        // 1.Recojo los tipos de recomendaciones generales del viaje
        $general_types_id = $trip->recommendations()->pluck('recommendation_type_id')->toArray();

        // 2.Recojo los tipos de recomendaciones de las mascotas del viaje
        $pet_types_id = $trip->pets->flatMap(function ($pet) {
            return $pet->petRecommendations()->pluck('recommendation_type_id');
        })->toArray();

        // 3.Unifico y elimino duplicados
        $types_id = array_unique(array_merge($general_types_id, $pet_types_id));

        // 4.Recojo los tipos de recomendaciones
        $types = RecommendationType::whereIn('id', $types_id)->get();
        if ($types->isEmpty()) {
            return $this->sendResponse(false, 'No recommendation types found for this trip');
        }

        return $this->sendResponse(true, 'Recommendation types retrieved successfully', $types);
    }

    /**
     * Retrieve a list of all Recommendation Types.
     */
    public function index()
    {
        $recomendation_types = RecommendationType::all();
        if (!$recomendation_types) {
            return $this->sendResponse(false, 'The RecommendationTypes table is empty');
        }

        return $this->sendResponse(true, 'Recommendation types retrieved successfully', $recomendation_types);
    }

    /**
     * Store a newly created Recommendation Type.
     */
    public function store(Request $request)
    {
        try {
            $params = $request->validate([
                'name' => 'required|string|max:32|unique:recommendation_types',
                'label' => 'required|string',
                'category' => 'required|string|max:32',
                'prompt_template' => 'nullable|text',
                'icon' => 'nullable|string|max:64'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $recommendation_type = RecommendationType::create($params);
        return $this->sendResponse(true, 'Recommendation type created successfully', $recommendation_type, 201);
    }

    /**
     * Retrieve a specific Recommendation Type by ID.
     */
    public function show(RecommendationType $recommendation_type)
    {
        return $this->sendResponse(true, 'Recommendation type retrieved successfully', $recommendation_type);
    }

    /**
     * Update an existing Recommendation Type.
     */
    public function update(Request $request, RecommendationType $recommendation_type)
    {
        try {
            $params = $request->validate([
                'name' => 'sometimes|string|max:32|unique:recommendation_types',
                'label' => 'sometimes|string',
                'category' => 'sometimes|string|max:32',
                'prompt_template' => 'nullable|text',
                'icon' => 'nullable|string|max:64'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        if (empty($params)) {
            return $this->sendResponse(false, 'No parameters to update');
        }

        $recommendation_type->update($params);
        return $this->sendResponse(true, 'Recommendation type successfully updated', $recommendation_type);
    }

    /**
     * Delete a Recommendation Type.
     */
    public function destroy(RecommendationType $recommendation_type)
    {
        $recommendation_type->delete();
        return $this->sendResponse(true, 'Recommendation type deleted successfully');
    }
}

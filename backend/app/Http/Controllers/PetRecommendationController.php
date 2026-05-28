<?php

namespace App\Http\Controllers;

use App\Jobs\GeneratePetRecommendationsJob;
use App\Models\PetRecommendation;
use App\Models\RecommendationType;
use App\Models\Trip;
use Illuminate\Http\Request;

class PetRecommendationController extends Controller
{
    public function getPetRecommendationsFromTrip(Trip $trip) {
        if ($trip->pets->isEmpty()) {
            return $this->sendResponse(false, 'No hay mascotas en el viaje para generar recomendaciones');
        }

        // 1.Recojo todas las recomendaciones de mascotas y las agrupo por tipo
        $allPetRecommendations = collect();
        $trip->pets->each(function ($pet) use (&$allPetRecommendations) {
            $pet->petRecommendations->each(function ($recommendation) use ($pet, &$allPetRecommendations) {
                $allPetRecommendations->push([
                    'pet_type' => $pet->type,
                    'recommendation_type_id' => $recommendation->recommendation_type_id,
                    'recommendation' => $recommendation->recommendation,
                    'reason' => $recommendation->reason,
                    'recommendation_type_name' => optional($recommendation->recommendationType)->label,
                ]);
            });
        });

        // 2.Agrupo por tipo de recomendación
        $groupedByType = $allPetRecommendations->groupBy('recommendation_type_id');

        // 3.Para cada tipo, agrupo por texto de recomendación y razón, y recojo las mascotas asociadas
        $formatted = $groupedByType->map(function ($items, $typeId) {
            $typeName = optional($items->first())['recommendation_type_name'];
            //Agrupo por texto y razón
            $grouped = $items->groupBy(function ($item) {
                return $item['recommendation'].'|'.$item['reason'];
            });

            $recommendations = $grouped->map(function ($group) {
                return [
                    'recommendation' => $group->first()['recommendation'],
                    'reason' => $group->first()['reason'],
                    'pets' => $group->pluck('pet_type')->unique()->values(),
                ];
            })->values();

            return [
                'name' => $typeName,
                'items' => $recommendations,
            ];
        })->values();

        if ($formatted->isEmpty()) {
            return $this->sendResponse(false, 'No hay recomendaciones de mascotas para este viaje');
        }

        return $this->sendResponse(true, 'Recomendaciones de mascotas obtenidas con éxito', $formatted);
    }

    public function generatePetRecommendationsToTrip(Request $request, Trip $trip) {
        // Si no hay mascotas, no se pueden generar recomendaciones
        if ($trip->pets->isEmpty()) {
            return $this->sendResponse(false, 'No hay mascotas en el viaje para generar recomendaciones');
        }

        try {
            $params = $request->validate([
                'recommendations_types' => 'required|array',
                'recommendations_types.*.name' => 'required|string|max:32|exists:recommendation_types,name',
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        if (empty($params['recommendations_types'])) {
            return $this->sendResponse(false, 'No hay recomendaciones de mascotas para generar');
        }

        // 1.Recojo los datos que me interesan para añadirlos en el prompt
        $locations = $trip->locationTrips->map(function ($locationTrip) {
            return [
                'name' => $locationTrip->location->locality,
                'start_date' => $locationTrip->start_date,
                'end_date' => $locationTrip->end_date
            ];
        })->all();

        // 2.Recojo los tipos de recomendaciones que quiere el usuario en el viaje
        $types = collect($params['recommendations_types'])->pluck('name');

        // 3.Obtengo los IDs de los tipos seleccionados
        $types_id = RecommendationType::whereIn('name', $types)->pluck('id', 'name');

        // 4.Obtengo los tipos de recomendaciones ya existentes para el viaje
        $existing_types_id = collect();
        foreach ($trip->pets as $pet) {
            $existing_types_id = $existing_types_id->merge(
                $pet->petRecommendations->pluck('recommendation_type_id')
            );
        }
        $existing_types_id = $existing_types_id->unique()->toArray();
        $existing_type_names = RecommendationType::whereIn('id', $existing_types_id)->pluck('name')->toArray();

        // 5.Elimino las recomendaciones que ya no están seleccionadas
        foreach ($trip->pets as $pet) {
            $pet->petRecommendations()
                ->whereNotIn('recommendation_type_id', $types_id)
                ->delete();
        }

        // 6.Creo un array de mascotas con sus IDs y tipos
        $new_types = $types->diff($existing_type_names);
        $pets_data = $trip->pets->map(function ($pet) {
            return [
                'id' => $pet->id,
                'type' => $pet->type
            ];
        })->all();

        // 7.Genero en paralelo para cada tipo de recomendación las llamadas con openAI y las inserciones en base de datos
        $delay = 0;
        foreach ($new_types as $type) {
            GeneratePetRecommendationsJob::dispatch($locations, $type, $trip->id, $pets_data)
                ->delay(now()->addSeconds($delay));
            $delay += 4; // 15 RPM Gemini free tier → 1 req each 4s
        }
       
        return $this->sendResponse(true, 'Las recomendaciones sobre mascotas se están generando. Serán visibles en cuanto estén listas.');
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index() {
        $pet_recommendations = PetRecommendation::all();
        if (!$pet_recommendations) {
            return $this->sendResponse(false, 'The pet recommendations table is empty');
        }

        return $this->sendResponse(true, 'Pet recommendations successfully retrieved', $pet_recommendations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {

    }

    /**
     * Display the specified resource.
     */
    public function show(PetRecommendation $pet_recommendation) {
        return $this->sendResponse(true, 'Pet recommendation successfully retrieved', $pet_recommendation);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PetRecommendation $pet_recommendation) {
 
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PetRecommendation $pet_recommendation) {
        $pet_recommendation->delete();
        return $this->sendResponse(true, 'Pet recommendation successfully deleted');
    }

    public function destroyAll($tripId){
        $trip = Trip::with('pets.petRecommendations')->findOrFail($tripId);
        foreach ($trip->pets as $pet) {
            $pet->petRecommendations()->delete();
        }
        return $this->sendResponse(true, 'Recomendaciones de mascotas eliminadas correctamente.');
    }

}

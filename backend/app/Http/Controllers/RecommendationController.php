<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateRecommendationsJob;
use App\Models\Recommendation;
use App\Models\RecommendationType;
use App\Models\Trip;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function getRecommendationsFromTrip(Trip $trip) {
        $recommendations = $trip->recommendations()->with('recommendationType')->get();
        if ($recommendations->isEmpty()) {
            return $this->sendResponse(false, 'No hay recomendaciones para este viaje');
        }

        $formatted = $recommendations
            ->groupBy('recommendation_type_id')
            ->map(function ($recommendations) {
                $typeName = optional($recommendations->first()->recommendationType)->label;
                return [
                    'name' => $typeName,
                    'items' => $recommendations->map(function ($recommendation) {
                        return [
                            'recommendation' => $recommendation->recommendation,
                            'reason' => $recommendation->reason
                        ];
                    })->values(),
                ];
            }
        )->values();

        return $this->sendResponse(true, 'Recomendaciones obtenidas con éxito', $formatted);
    }

    public function generateRecommendationsToTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'recommendations_types' => 'required|array',
                'recommendations_types.*.name' => 'required|string|max:32|exists:recommendation_types,name',
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        if (empty($params['recommendations_types'])) {
            return $this->sendResponse(false, 'No hay recomendaciones para generar');
        }

        // 1.Recojo los datos que me interesan para añadirlos en el prompt
        $locations = $trip->locationTrips->map(function ($locationTrip) {
            return [
                'name' => $locationTrip->location->locality,
                'start_date' => $locationTrip->start_date,
                'end_date' => $locationTrip->end_date,
            ];
        })->all();

        // 2.Recojo los tipos de recomendaciones que quiere el usuario en el viaje
        $types = collect($params['recommendations_types'])->pluck('name');

        // 3.Obtengo los IDs de los tipos seleccionados
        $types_id = RecommendationType::whereIn('name', $types)->pluck('id', 'name');

        // 4.Obtengo los tipos de recomendaciones ya existentes para el viaje
        $existing_types_id = $trip->recommendations()->pluck('recommendation_type_id')->toArray();
        $existing_type_names = RecommendationType::whereIn('id', $existing_types_id)->pluck('name')->toArray();

        // 5.Elimino las recomendaciones que ya no están seleccionadas
        $trip->recommendations()
            ->whereNotIn('recommendation_type_id', $types_id)
            ->delete();

        // 6.Genero en paralelo para cada tipo de recomendación las llamadas con openAI y las inserciones en base de datos
        $new_types = $types->diff($existing_type_names);
        foreach ($new_types as $type) {
            GenerateRecommendationsJob::dispatch($locations, $type, $trip->id);
        }
       
        return $this->sendResponse(true, 'Las recomendaciones se están generando. Serán visibles en cuanto estén listas.');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $recommendations = Recommendation::all();

        if ($recommendations->isEmpty()) {
            return $this->sendResponse(false, 'The recommendations table is empty');
        }

        return $this->sendResponse(true, 'Recommendations successfully retrieved', $recommendations);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Recommendation $recommendation) {
        $recommendation->delete();
        return $this->sendResponse(true, 'Recommendation successfully deleted');
    }

    public function destroyAll($tripId) {
        Recommendation::where('trip_id', $tripId)->delete();
        return $this->sendResponse(true, 'Recomendaciones eliminadas');
    }

}

<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Activity;
use App\Models\Location;
use App\Models\Trip;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    // Función para recoger modelo de localidad en bd y comprobar que los datos de destino y fecha son correctos
    private function checkDataActivity($activity, Trip $trip) {
        // 1.Busco la localización que coincida con la localización de la actividad
        $location = Location::where('locality', $activity['locality'])->first();
        if (!$location) {
            return [
                'success' => false,
                'message' => 'Destino ' . $activity['locality'] . ' no encontrado en la base de datos',
                'data' => null,
                'status' => 404,
            ];
        }

        // 2.Busco las fechas de la localización asociada al viaje
        $locationTrip = $trip->locations()->where('locations.id', $location->id)->first();
        if (!$locationTrip) {
            return [
                'success' => false,
                'message' => 'El destino ' . $location->locality . ' no está asociado al viaje',
                'data' => null,
                'status' => 200,
            ];
        }

        // 3.Compruebo que la fecha de la actividad esté dentro del rango de fechas de la localización en el viaje
        $start = Carbon::parse($locationTrip->pivot->start_date);
        $end = Carbon::parse($locationTrip->pivot->end_date);
        $activityDay = Carbon::parse($activity['day']);

        if ($activityDay->lt($start) || $activityDay->gt($end)) {
            return [
                'success' => false,
                'message' => 'El día ' . $activity['day'] . ' no está dentro del rango de fechas de ' . $location->locality . ' ' . $start . ' - ' . $end,
                'data' => null,
                'status' => 200,
            ];
        }

        return [
            'success' => true,
            'message' => 'Datos de la actividad comprobados con éxito',
            'data' => $location,
            'status' => 200,
        ];
    }

    public function getActivitiesFromTrip(Trip $trip){
        $activities = $trip->activities()->with('location')->get();

        return $this->sendResponse(true, 'Actividades del viaje obtenidas con éxito', $activities);
    }

    public function addActivitiesToTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'activities' => 'required|array',
                'activities.*.description' => 'required|string|max:200',
                'activities.*.day' => 'required|date',
                'activities.*.time_of_day' => 'nullable|in:morning,afternoon,evening',
                'activities.*.locality' => 'required|string|max:64',
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        foreach ($params['activities'] as $activity) {
            $response = $this->checkDataActivity($activity, $trip);

            if ($response['success']) {
                // Creo la actividad en el viaje y la asocio a la localización
                $trip->activities()->create([
                    'description' => $activity['description'],
                    'day' => $activity['day'],
                    'time_of_day' => $activity['time_of_day'] ?? null,
                    'location_id' => $response['data']->id
                ]);
            } else {
                return $this->sendResponse(false, $response['message'], $response['data'], $response['status']);
            }
        }
        return $this->sendResponse(true, 'Actividades añadidas al viaje con éxito', $trip->activities);
    }

    public function updateActivitiesFromTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'activities' => 'required|array',
                'activities.*.id' => 'required|integer|exists:activities,id',
                'activities.*.description' => 'required|string|max:200',
                'activities.*.day' => 'required|date',
                'activities.*.time_of_day' => 'nullable|in:morning,afternoon,evening',
                'activities.*.locality' => 'required|string|max:64',
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        foreach ($params['activities'] as $activity) {
            $response = $this->checkDataActivity($activity, $trip);

            if ($response['success']) {
                // Compruebo la existencia de la actividad en el viaje y la actualizo
                $existingActivity = $trip->activities()->where('id', $activity['id'])->first();
                if (!$existingActivity) {
                    continue;
                }
                $existingActivity->update([
                    'description' => $activity['description'],
                    'day' => $activity['day'],
                    'time_of_day' => $activity['time_of_day'] ?? null,
                    'location_id' => $response['data']->id
                ]);
            } else {
                return $this->sendResponse(false, $response['message'], $response['data'], $response['status']);
            }
        }
        return $this->sendResponse(true, 'Actividades del viaje actualizadas con éxito', $trip->activities);
    }

    public function removeActivitiesFromTrip(Request $request, Trip $trip) {
        try {
            $params = $request->validate([
                'activities' => 'required|array',
                'activities.*.id' => 'required|exists:activities,id',
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        foreach ($params['activities'] as $activity) {
            // 1.Busco la actividad en el viaje
            $activityToRemove = $trip->activities()->find($activity['id']);
            if (!$activityToRemove) {
                continue;
            }
            // 2.Elimino la actividad
            $activityToRemove->delete();
        }
        return $this->sendResponse(true, 'Actividades eliminadas del viaje con éxito', null);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $activities = Activity::all();
        if ($activities->isEmpty()) {
            return $this->sendResponse(false, 'The activities table is empty');
        }
        return $this->sendResponse(true, 'Activities successfully retrieved', $activities);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $params = $request->validate([
                'description' => 'required|string|max:200',
                'day' => 'required|date',
                'time_of_day' => 'nullable|in:morning, afternoon, evening',
                'location_id' => 'required|exists:locations,id',
                'trip_id' => 'required|exists:trips,id'
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        $activity = Activity::create($params);
        return $this->sendResponse(true, 'Activity successfully created', $activity, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Activity $activity)
    {
        return $this->sendResponse(true, 'Activity successfully retrieved', $activity);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Activity $activity)
    {
        try {
            $params = $request->validate([
                'description' => 'sometimes|string|max:200',
                'day' => 'sometimes|date',
                'time_of_day' => 'nullable|in:morning, afternoon, evening',
                'location_id' => 'required|exists:locations,id',
                'trip_id' => 'required|exists:trips,id'
            ]);
        } catch (\Exception $e) {
            return $this->sendResponse(false, 'Validation error', $e->getMessage(), 422);
        }

        if (empty($params)) {
            return $this->sendResponse(false, 'No data to update');
        }

        $activity->update($params);
        $activity->refresh();
        return $this->sendResponse(true, 'Activity successfully updated', $activity);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Activity $activity)
    {
        $activity->delete();
        return $this->sendResponse(true, 'Activity successfully deleted');
    }
}

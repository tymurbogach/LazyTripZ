<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Trip;
use Carbon\Carbon;

class TripUserController extends Controller
{
    public function getTripsFromUser(Request $request) {
        $user = User::find($request->user()->id);
        if (!$user) {
            return $this->sendResponse(false, 'Usuario inválido');
        }

        $trips = $user->trips()->with([
            'pets', 
            'locations', 
            'activities', 
            'locationTrips.location', 
            'locationTrips.weatherForecasts'
        ])->get();

        if (!$trips) {
            return $this->sendResponse(false, 'No tienes viajes programados');
        }

        $formattedTrips = $trips->map(function ($trip) {
            return [
                'id' => $trip->id,
                'name' => $trip->name,
                'adults' => $trip->adults,
                'children' => $trip->children,
                'transport' => $trip->transport,
                'last_weather_sync_at' => $trip->last_weather_sync_at ? Carbon::parse($trip->last_weather_sync_at)->setTimezone('Europe/Madrid')->format('Y-m-d H:i:s') : null,

                'pets' => $trip->pets->map(function ($pet) {
                    return [
                        'type' => $pet->type
                    ];
                })->values(),
                
                'locations' => $trip->locationTrips->map(function ($locationTrip) use ($trip) {
                    return [
                        'locality' => $locationTrip->location->locality,
                        'province' => $locationTrip->location->province,
                        'country' => $locationTrip->location->country,
                        'start_date' => $locationTrip->start_date,
                        'end_date' => $locationTrip->end_date,

                        'weather_forecasts' => $locationTrip->weatherForecasts
                            ->groupBy('day')    
                            ->map(function ($weather_forecast, $day) {
                                return [
                                    'min_temperature' => round($weather_forecast->min('temperature'), 1),
                                    'max_temperature' => round($weather_forecast->max('temperature'), 1),
                                    'max_rain_probability' => round($weather_forecast->max('rain_probability'), 1),
                                    'day' => $day,
                                ];
                            }
                        )->values(),

                        'activities' => $trip->activities->map(function ($activity) {
                            return [
                                'description' => $activity->description,
                                'day' => $activity->day
                            ];
                        })->values(),
                    ];
                }),
            ];
        });
        return $this->sendResponse(true, 'Trips successfully retrieved', $formattedTrips);
    }

    public function getPermissionUserFromTrip(Request $request, Trip $trip) {
        if (!$trip->users()->where('user_id', $request->user()->id)->exists()) {
            return $this->sendResponse(false, 'User not found in trip');
        }

        $permission = $trip->users()->where('user_id', $request->user()->id)->first()->pivot->permission;
        return $this->sendResponse(true, 'Permission successfully retrieved', $permission);
    }

    public function getUsersFromTrip(Trip $trip) {
        $users = $trip->users;
        if (!$users) {
            return $this->sendResponse(false, 'Users not found');
        }

        return $this->sendResponse(true, 'Users successfully retrieved', $users);
    }


    public function addUserToTrip(Request $request, Trip $trip, User $user) {
        if ($trip->users()->where('user_id', $user->id)->exists()) {
            return $this->sendResponse(false, 'User already exists in trip');
        }

        $trip->users()->attach($user, [
            'permission' => 'user'
        ]);

        return $this->sendResponse(true, 'User successfully added to trip', $user);
    }


    public function updatePermissionUserFromTrip(Request $request, Trip $trip, User $user) {
        if (!$trip->users()->where('user_id', $user->id)->exists()) {
            return $this->sendResponse(false, 'User not found in trip');
        }

        $params = $request->validate([
            'permission' => 'required|in:admin,user',
        ]);
        $trip->users()->updateExistingPivot($user, [
            'permission' => $params['permission']
        ]);

        return $this->sendResponse(true, 'Permission user successfully updated in trip', $params['permission']);
    }


    public function removeUserFromTrip(Trip $trip, User $user) {
        if (!$trip->users()->where('user_id', $user->id)->exists()) {
            return $this->sendResponse(false, 'User not found in trip');
        }

        $trip->users()->detach($user);
        return $this->sendResponse(true, 'User successfully removed from trip');
    }

    public function exitUserFromTrip(Request $request, Trip $trip) {
        $user = $request->user();
        if (!$trip->users()->where('user_id', $user->id)->exists()) {
            return $this->sendResponse(false, 'User not found in trip');
        }

        if ($trip->users()->count() === 1) {
            return $this->sendResponse(false, 'Cannot exit trip as you are the only user');
        }

        $trip->users()->detach($user);
        return $this->sendResponse(true, 'User successfully exited from trip');
    }
}
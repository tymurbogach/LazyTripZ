<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\LocationTripController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\TripUserController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\PetRecommendationController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\RecommendationTypeController;
use App\Http\Controllers\WeatherForecastController;
use App\Http\Controllers\DiaryController;

//------------------AUTHENTICATION----------------
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::post('/login', 'login');
    Route::post('/register', 'register');
    Route::post('/check/{field}', 'checkField');
    Route::get('/token-from-cookie', 'getTokenFromCookie'); // público, lee cookie directamente
});

Route::middleware('auth:api')->group(function () {
    //------------------AUTHENTICATION----------------
    Route::prefix('auth')->controller(AuthController::class)->group(function () {
        Route::post('/logout', 'logout');
    });

    //------------------USER----------------
    Route::prefix('user')->controller(UserController::class)->group(function () {
        Route::post('/password', 'setPassword');
        Route::get('', 'show');
        Route::put('', 'update');
        Route::post('/avatar', 'updateAvatar');
        Route::get('/{trip}/search', 'searchUsers')->middleware('trip.permission:member');
    });

    //------------------TRIP----------------
    Route::apiResource('trips', TripController::class);

    //------------------TRIP_USER----------------
    Route::prefix('user')->controller(TripUserController::class)->group(function () {
        Route::get('/trips', 'getTripsFromUser');
    });
    Route::prefix('trip')->middleware('trip.permission:member')->controller(TripUserController::class)->group(function () {
        Route::get('/{trip}/user/permission', 'getPermissionUserFromTrip');
        Route::get('/{trip}/users', 'getUsersFromTrip');
        Route::post('/{trip}/users/{user}', 'addUserToTrip')->middleware('trip.permission:admin');
        Route::put('/{trip}/users/{user}', 'updatePermissionUserFromTrip')->middleware('trip.permission:admin');
        Route::delete('/{trip}/users/{user}', 'removeUserFromTrip')->middleware('trip.permission:admin');
        Route::delete('/{trip}/user', 'exitUserFromTrip');
    });

    //------------------PET----------------
    Route::apiResource('pets', PetController::class);
    Route::prefix('trip')->middleware('trip.permission:member')->controller(PetController::class)->group(function () {
        Route::post('/{trip}/pets', 'addPetsToTrip');
        Route::delete('/{trip}/pets', 'removePetsFromTrip');
        Route::get('/{trip}/pets', 'getPetsFromTrip');
    });

    //------------------RECOMMENDATION_TYPE----------------
    Route::apiResource('recommendation_types', RecommendationTypeController::class);
    Route::prefix('trip')->middleware('trip.permission:member')->controller(RecommendationTypeController::class)->group(function () {
        Route::get('{trip}/recommendation_types', 'getRecommendationTypesFromTrip');
    });

    //------------------RECOMMENDATION----------------
    Route::prefix('trip')->middleware('trip.permission:member')->controller(RecommendationController::class)->group(function () {
        Route::get('{trip}/recommendations', 'getRecommendationsFromTrip');
        Route::post('{trip}/recommendations', 'generateRecommendationsToTrip');
        Route::delete('{trip}/recommendations', 'destroyAll');
    });

    //------------------PET_RECOMMENDATION----------------
    Route::prefix('trip')->middleware('trip.permission:member')->controller(PetRecommendationController::class)->group(function () {
        Route::get('{trip}/pet_recommendations', 'getPetRecommendationsFromTrip');
        Route::post('{trip}/pet_recommendations', 'generatePetRecommendationsToTrip');
        Route::delete('{trip}/pet_recommendations', 'destroyAll');
    });

    //------------------LOCATION----------------
    Route::apiResource('locations', LocationController::class);

    //------------------ACTIVITY----------------
    Route::apiResource('activities', ActivityController::class);
    Route::prefix('trip')->middleware('trip.permission:member')->controller(ActivityController::class)->group(function () {
        Route::get('{trip}/activities', 'getActivitiesFromTrip');
        Route::post('{trip}/activities', 'addActivitiesToTrip');
        Route::put('{trip}/activities', 'updateActivitiesFromTrip');
        Route::delete('{trip}/activities', 'removeActivitiesFromTrip');
    });

    //------------------LOCATION_TRIP----------------
    Route::prefix('trip')->middleware('trip.permission:member')->controller(LocationTripController::class)->group(function () {
        Route::get('{trip}/locations', 'getLocationsFromTrip');
        Route::get('{trip}/locations/simple', 'getSimpleLocationsFromTrip');
        Route::post('{trip}/locations', 'addLocationsToTrip');
        Route::put('{trip}/locations', 'updateLocationsFromTrip');
        Route::delete('{trip}/locations', 'removeLocationsFromTrip');
    });

    //------------------WEATHER_FORECAST----------------
    Route::apiResource('weather_forecasts', WeatherForecastController::class);
    Route::prefix('trip')->middleware('trip.permission:member')->controller(WeatherForecastController::class)->group(function () {
        Route::post('{trip}/weather_forecasts', 'addWeatherForecastsToTrip');
        Route::post('{trip}/weather_forecasts/refresh', 'updateWeatherForecastsToTrip');
    });

    //------------------DIARY----------------
    Route::prefix('trip')->middleware('trip.permission:member')->controller(DiaryController::class)->group(function () {
        Route::get('{trip}/diaries', 'getDiariesFromTrip');
        Route::post('{trip}/diaries', 'store');
        Route::put('{trip}/diaries/{diary}', 'update');
        Route::delete('{trip}/diaries/{diary}', 'destroy');
    });
});

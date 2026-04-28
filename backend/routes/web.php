<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;


Route::get('/', function () {
    return view('welcome');
});

Route::prefix('auth/google')->controller(AuthController::class)->group(function () {
    Route::get('', 'redirectToGoogle');
    Route::get('callback', 'googleCallback');
});
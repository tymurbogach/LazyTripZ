<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckTripPermission
{
    public function handle(Request $request, Closure $next, $permission)
    {
        $trip = $request->route('trip');

        if (!$trip) {
            return response()->json([
                'success' => false,
                'message' => 'Viaje no encontrado',
                'data' => null
            ], 404);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado',
                'data' => null
            ], 401);
        }

        $tripUser = $trip->users()->find($user->id);

        if (!$tripUser) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este viaje',
                'data' => null
            ], 403);
        }

        if ($permission === 'admin' && $tripUser->pivot->permission !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos de administrador en este viaje',
                'data' => null
            ], 403);
        }

        return $next($request);
    }
}

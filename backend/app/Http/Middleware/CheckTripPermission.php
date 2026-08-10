<?php

namespace App\Http\Middleware;

use App\Models\Trip;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckTripPermission
{
    public function handle(Request $request, Closure $next, $permission)
    {
        $trip = $this->resolveTrip($request->route('trip'));

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

    /**
     * Devuelve el Trip del parámetro de ruta.
     *
     * No todos los controllers tipan el parámetro como Trip: varios reciben el id crudo
     * (`$tripId`), y en esos casos Laravel no aplica route model binding. Sin esto el
     * middleware solo protegería las rutas que ya venían tipadas.
     */
    private function resolveTrip($routeParam): ?Trip
    {
        if ($routeParam instanceof Trip) {
            return $routeParam;
        }

        if ($routeParam === null || $routeParam === '') {
            return null;
        }

        return Trip::find($routeParam);
    }
}

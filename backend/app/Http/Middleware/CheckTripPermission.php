<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Trip;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class CheckTripPermission extends Controller
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $permission)
    {
        $trip = $request->route('trip');

        if (!$trip) {
            return $this->sendResponse(false, 'Viaje no encontrado', null, 404);
        }

        $user = Auth::user();
        if (!$user) {
            return $this->sendResponse(false, 'Usuario no autenticado', null, 401);
        }

        $tripUser = $trip->users()->find($user->id);

        if (!$tripUser) {
            return $this->sendResponse(false, 'No tienes acceso a este viaje', null, 403);
        }

        if ($permission === 'admin' && $tripUser->pivot->permission !== 'admin') {
            return $this->sendResponse(false, 'No tienes permisos de administrador en este viaje', null, 403);
        }

        return $next($request);
    }
}

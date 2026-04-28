<?php

namespace App\Http\Controllers;

use App\Models\Diary;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DiaryController extends Controller
{
    /**
     * Obtiene todos los diarios de un viaje.
     */
    public function getDiariesFromTrip(Trip $trip)
    {
        // Verificar que el usuario es parte del viaje
        if (!$trip->users()->where('user_id', Auth::id())->exists()) {
            return $this->sendResponse(false, 'No tienes acceso a este viaje', null, 403);
        }

        $diaries = $trip->diaries()->with('user')->orderBy('date', 'desc')->get();
        if ($diaries->isEmpty()) {
            return $this->sendResponse(false, 'No hay entradas en el diario para este viaje');
        }

        return $this->sendResponse(true, 'Diarios recuperados con éxito', $diaries);
    }

    /**
     * Store a newly created diary entry.
     */
    public function store(Request $request, Trip $trip)
    {
        // Verificar que el usuario es parte del viaje
        if (!$trip->users()->where('user_id', Auth::id())->exists()) {
            return $this->sendResponse(false, 'No tienes acceso a este viaje', null, 403);
        }

        try {
            $params = $request->validate([
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'description' => 'required|string|min:10|max:1000',
                'date' => 'required|date|before_or_equal:today'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Error en las validaciones', $e->errors(), 422);
        }

        DB::beginTransaction();
        try {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = Str::random(40) . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('diaries', $imageName, 'public');
            }

            $diary = $trip->diaries()->create([
                'user_id' => Auth::id(),
                'image_path' => $imagePath,
                'description' => $params['description'],
                'date' => $params['date']
            ]);

            DB::commit();
            return $this->sendResponse(true, 'Entrada del diario creada con éxito', $diary, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            // Si hubo un error y se subió una imagen, la eliminamos
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            return $this->sendResponse(false, 'Error al crear la entrada del diario: ' . $e->getMessage(), [], 500);
        }
    }

    /**
     * Update the specified diary entry.
     */
    public function update(Request $request, Trip $trip, Diary $diary)
    {
        // Verificar que el diario pertenece al viaje
        if ($diary->trip_id !== $trip->id) {
            return $this->sendResponse(false, 'El diario no pertenece a este viaje', null, 403);
        }

        // Verificar que el usuario es el propietario del diario
        if ($diary->user_id !== Auth::id()) {
            return $this->sendResponse(false, 'No tienes permisos para editar esta entrada', null, 403);
        }

        // Validar los datos de entrada
        try {
            $validated = $request->validate([
                'description' => 'sometimes|required|string|min:10|max:1000',
                'date' => 'sometimes|required|date|before_or_equal:today',
                'image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Error en las validaciones', $e->errors(), 422);
        }

        // Si no hay datos para actualizar, retornar error
        if (empty($validated)) {
            return $this->sendResponse(false, 'No hay datos para actualizar');
        }

        try {
            // Iniciar transacción
            DB::beginTransaction();

            // Manejar la imagen si se proporciona una nueva
            if ($request->hasFile('image')) {
                // Eliminar imagen anterior si existe
                if ($diary->image_path) {
                    Storage::disk('public')->delete($diary->image_path);
                }

                // Guardar nueva imagen
                $image = $request->file('image');
                $imageName = Str::random(40) . '.' . $image->getClientOriginalExtension();
                $validated['image_path'] = $image->storeAs('diaries', $imageName, 'public');
            }

            // Actualizar el diario
            $diary->fill($validated);
            $diary->save();

            // Confirmar transacción
            DB::commit();

            // Retornar respuesta exitosa
            return $this->sendResponse(
                true,
                'Entrada del diario actualizada con éxito',
                $diary->fresh()
            );
        } catch (\Exception $e) {
            // Revertir transacción en caso de error
            DB::rollBack();

            // Eliminar imagen si se subió una nueva y hubo error
            if (isset($validated['image_path'])) {
                Storage::disk('public')->delete($validated['image_path']);
            }

            return $this->sendResponse(
                false,
                'Error al actualizar la entrada del diario: ' . $e->getMessage(),
                [],
                500
            );
        }
    }

    /**
     * Remove the specified diary entry.
     */
    public function destroy(Trip $trip, Diary $diary)
    {
        // Verificar que el diario pertenece al viaje
        if ($diary->trip_id !== $trip->id) {
            return $this->sendResponse(false, 'El diario no pertenece a este viaje', null, 403);
        }

        // Verificar que el usuario es el propietario del diario
        if ($diary->user_id !== Auth::id()) {
            return $this->sendResponse(false, 'No tienes permisos para eliminar esta entrada', null, 403);
        }

        DB::beginTransaction();
        try {
            // Guardar la ruta de la imagen antes de eliminar el diario
            $imagePath = $diary->image_path;

            // Eliminar la entrada del diario
            $diary->delete();

            // Si existía una imagen, eliminarla del almacenamiento
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }

            DB::commit();
            return $this->sendResponse(true, 'Entrada del diario eliminada con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendResponse(
                false,
                'Error al eliminar la entrada del diario: ' . $e->getMessage(),
                [],
                500
            );
        }
    }
}

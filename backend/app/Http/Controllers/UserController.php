<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UserController extends Controller
{
	/**
    * Display profile user.
    */
	public function show(Request $request) {
        return $this->sendResponse(true, 'User data successfully retrieved', $request->user());
    }

    /**
    * Update the specified resource in storage.
    */
    public function update(Request $request) {
        try {
            $params = $request->validate([
                'name' => 'string|max:32',
                'email' => 'email|max:32|unique:users',
                'password' => 'string|min:4',
                'number_phone' => 'string|max:16|unique:users',
                'username' => 'string|max:32|unique:users',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $user = $request->user();
        $user->update($params);

        return $this->sendResponse(true, 'User successfully updated', $user);
    }

    // Función para cambiar la contraseña temporal generada cuando te registras por Google
    public function setPassword(Request $request) {
        try {
            $request->validate([
                'password' => 'required|string|min:4',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $user = $request->user();
        $user->password = bcrypt($request->password);
        $user->must_set_password = false;
        $user->save();

        return $this->sendResponse(true, 'User password successfully updated');
    }

    // Función para buscar usuarios por nombre de usuario y que me devuelva como máx 3 resultados
    public function searchUsers(Request $request, Trip $trip) {
        try {
            $param = $request->validate([
                'query' => 'required|string|max:32',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        // Obtengo los IDs de los usuarios ya añadidos al viaje
        $addedUserIds = $trip->users()->pluck('users.id')->toArray();

        // Realizo la búsqueda de usuarios que coincidan con el query y que no estén en los IDs de usuarios añadidos
        $users = User::where('username', 'like', '%' . $param['query'] . '%')
            ->whereNotIn('id', $addedUserIds)
            ->limit(3)
            ->get();

        return $this->sendResponse(true, 'Users successfully retrieved', $users);
    }

    /**
     * Actualiza el avatar del usuario. Transacción DB garantiza consistencia:
     * si falla el guardado en disco, el modelo no se actualiza.
     */
    public function updateAvatar(Request $request) {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $user = $request->user();

        DB::beginTransaction();
        try {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $image = $request->file('avatar');
            $imageName = Str::random(40) . '.' . $image->getClientOriginalExtension();
            $avatarPath = $image->storeAs('avatars', $imageName, 'public');

            $user->avatar = $avatarPath;
            $user->save();

            DB::commit();
            return $this->sendResponse(true, 'Avatar actualizado con éxito', $user->fresh());
        } catch (\Exception $e) {
            DB::rollBack();
            Storage::disk('public')->delete($avatarPath ?? '');
            return $this->sendResponse(false, 'Error al actualizar el avatar', [], 500);
        }
    }
}

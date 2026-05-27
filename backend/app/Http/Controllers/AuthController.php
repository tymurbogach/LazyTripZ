<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Storage;

class AuthController extends Controller
{
    // Función para comprobar si ya existe el nombre de usuario o email a la hora de un nuevo registro
    public function checkField(Request $request, $field) {
        if (!in_array($field, ['username', 'email'])) {
            return $this->sendResponse(false, 'Campo no válido', null, 400);
        }

        $value = $request->$field;
        $exists = User::where($field, $value)->exists();

        if (!$exists) {
            return $this->sendResponse(true, ucfirst($field) . ' disponible');
        }

        if ($field === 'username') {
            $message = 'Ya existe un usuario con este nombre';
        }
        if ($field === 'email') {
            $message = 'Ya existe una cuenta con este email';
        }

        return $this->sendResponse(false, $message, null, 409);
    }

    // Función para generar nombre de usuario único cuando te registras por Google y ya existe uno con el mismo nombre
    private function generateUniqueUsername($base) {
        $username = $base;
        $counter = 1;

        // Me aseguro de que sea único en la tabla users
        while (User::where('username', $username)->exists()) {
            $username = $base . $counter;
            $counter++;
        }

        return $username;
    }

    // Guardo el avatar de Google en local solo si no existe ya uno para el usuario
    private function saveGoogleAvatar($url, $userId = null) {
        if (!$url) {
            return 'avatars/default.jpg';
        }

        // Si ya existe un avatar para este usuario, no lo sobrescribo
        if ($userId) {
            $user = User::find($userId);
            if ($user && $user->avatar && Storage::disk('public')->exists($user->avatar)) {
                return $user->avatar;
            }
        }

        $avatarContents = @file_get_contents($url);
        if ($avatarContents === false) {
            return 'avatars/default.jpg';
        }

        $avatarName = 'avatar_' . uniqid() . '.jpg';
        $avatarPath = 'avatars/' . $avatarName;
        Storage::disk('public')->put($avatarPath, $avatarContents);

        return $avatarPath;
    }

    /**
    * Store a newly created resource in storage.
    */
    public function register(Request $request) {
        try {
            $params = $request->validate([
                'name' => 'required|string|max:32',
                'email' => 'required|email|max:32|unique:users',
                'password' => 'required|string|min:4',
                'number_phone' => 'nullable|string|max:16|unique:users',
                'username' => 'required|string|max:32|unique:users',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $user = User::create($params);
        return $this->sendResponse(true, 'User successfully created', $user, 201);
    }

    /**
    * Authenticate a user and return a token.
    */
    public function login(Request $request) {
        try {
            $credentials = $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendResponse(false, 'Validation error', $e->errors(), 422);
        }

        $login = $credentials['username'];

        // 1.Compruebo si es username o email lo que recibo en el input del login
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        // 2.Intento autenticarme
        if (!Auth::attempt([$field => $login, 'password' => $credentials['password']])) {
            return $this->sendResponse(false, 'Invalid credentials', null, 401);
        }
        
        // 3.Recojo el usuario y creo el token
        $user = Auth::user();
        $token = $user->createToken('AuthToken')->accessToken;
        return $this->sendResponse(true, 'User logged in successfully', $token);
    }

/**
     * Logout a user and invalidate their token.
     */
    public function logout() {
        $user = Auth::user();

        if (!$user) {
            return $this->sendResponse(false, 'User not authenticated', null, 401);
        }

        $user->tokens()->delete();
        return $this->sendResponse(true, 'User logged out successfully', null);
    }

    /**
     * Get token from cookie (for Google OAuth callback).
     * Route is public, reads directly from cookie.
     */
    public function getTokenFromCookie() {
        $token = request()->cookie('auth_token');

        if (!$token) {
            return $this->sendResponse(false, 'No token found', null, 404);
        }

        return $this->sendResponse(true, 'Token retrieved', $token);
    }

    public function redirectToGoogle() {
        return Socialite::driver('google')->redirect();
    }

    public function googleCallback() {
        try {
            $googleUser = Socialite::driver('google')->user();

            // 1.Obtengo la URL del avatar de Google
            $avatarUrl = $googleUser->getAvatar();

            // 2.Busco si ya existe un usuario con el mismo id de google o email
            $user = User::where('google_id', $googleUser->id)
                        ->orWhere('email', $googleUser->email)
                        ->first();

            // 3.Si el usuario no existe, creo uno nuevo con una contraseña temporal
            if (!$user) {
                // Uso la parte local del email como nombre de usuario base
                $baseUsername = explode('@', $googleUser->email)[0];
                $username = $this->generateUniqueUsername($baseUsername);

                $avatarFilePath = $this->saveGoogleAvatar($avatarUrl, null);

                $user = User::create([
                    'google_id' => $googleUser->id,
                    'name' => $googleUser->name,
                    'username' => $username,
                    'avatar' => $avatarFilePath,
                    'email' => $googleUser->email,
                    'password' => bcrypt('changeme'),
                    'must_set_password' => true,
                ]);
            } else {
                // 4. Si el usuario existe y no tiene avatar, lo guardo
                $avatarFilePath = $this->saveGoogleAvatar($avatarUrl, $user->id);

                if (!$user->avatar) {
                    $user->avatar = $avatarFilePath;
                    $user->save();
                }
            
                // 5.Si el usuario existe pero no tiene id de google o es distinto, lo actualizo
                if ($user->google_id !== $googleUser->id) {
                    $user->google_id = $googleUser->id;
                    $user->save();
                }
            }

            // 6.Login y Creo el token y lo guardo en cookie segura
            Auth::login($user);
            $token = $user->createToken('AuthToken')->accessToken;

            // Cookie segura: httponly (no accesible por JS), secure (HTTPS), samesite (CSRF protection)
            $cookie = cookie(
                'auth_token',           // name
                $token,                // value
                60 * 24 * 7,          // minutes (1 week)
                '/',                   // path
                null,                  // domain
                null,                  // secure (null = auto based on HTTPS)
                true,                   // httpOnly (no JS access)
                false,                  // raw
                'Lax'                   // sameSite
            );

            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/');
            return redirect("{$frontendUrl}/auth/callback")
                ->withCookie($cookie);

        } catch (\Exception $e) {
            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/');
            return redirect("{$frontendUrl}/auth/err?err=googleAuthFailed");
        }
    }
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Arquitectura

Monorepo con backend Laravel y frontend Angular separados.
- **Backend**: `./backend/` — Laravel 11 API REST + Passport OAuth2
- **Frontend**: `./frontend/` — Angular 19 SPA (standalone components)

## Cómo arrancar

### 1. Base de datos
```bash
sudo service mariadb start
```

### 2. Backend
```bash
cd backend
php artisan serve        # http://localhost:8000
php artisan queue:work   # terminal separada — obligatorio para recomendaciones IA
```

### 3. Frontend
```bash
cd frontend
npx ng serve             # http://localhost:4200
# IMPORTANTE: usar siempre --legacy-peer-deps al instalar
npm install --legacy-peer-deps
```

### Arranque desde cero (backend)
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
sudo service mariadb start
php artisan migrate --seed
php artisan serve
```

## Comandos de desarrollo

```bash
# Backend — tests
cd backend && php artisan test
cd backend && php artisan test --filter NombreTest   # test individual

# Backend — utilidades
php artisan tinker
php artisan route:list

# Frontend — build y tests
cd frontend && npx ng build
cd frontend && npx ng test
```

## Stack completo
- **Backend**: Laravel 11 + Passport OAuth2 + Socialite (Google) + MariaDB
- **IA**: OpenAI `gpt-4o-mini` via `RecommendationService` (HTTP directo, no SDK)
- **Clima**: OpenWeatherMap via `WeatherForecastService`
- **Frontend**: Angular 19 + Angular Material + FontAwesome 0.15.0

## Variables de entorno críticas (backend)

```env
DB_CONNECTION=mariadb          # importante: mariadb, no mysql
DB_DATABASE=projectbackend
DB_USERNAME=laravel
DB_PASSWORD=password

OPENAI_API_KEY=...
OPENWEATHER_API_KEY=...
OPENWEATHER_API_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Modelos y relaciones

```
User → Trip               (many-to-many via trip_user, con campo permission: admin|viewer)
Trip → Location           (many-to-many via location_trip)
Trip → Pet                (has-many)
Trip → Recommendation     (has-many, generadas por IA via Jobs)
Trip → PetRecommendation  (has-many, generadas por IA via Jobs)
Trip → WeatherForecast    (via LocationTrip)
Trip → Diary              (has-many)
RecommendationType → Recommendation (has-many, con prompt_template para la IA)
```

## Flujo de autenticación

1. Login normal (`POST /api/auth/login`) o Google OAuth (Socialite callback)
2. Passport emite Bearer token
3. Angular interceptor `auth.interceptor.ts` añade token a cada request
4. Guard `auth.guard.ts` protege rutas privadas Angular
5. Middleware `auth:api` protege rutas Laravel
6. Middleware `trip.permission:admin` (`CheckTripPermission`) restringe operaciones de admin

## Rutas API principales

| Grupo | Prefijo | Notas |
|-------|---------|-------|
| Auth | `/api/auth/` | login, register, logout, checkField |
| User | `/api/user/` | perfil, búsqueda de usuarios |
| Trips | `/api/trips` | apiResource completo |
| Trip↔User | `/api/trip/{trip}/users` | gestión de miembros del viaje |
| Pets | `/api/pets`, `/api/trip/{trip}/pets` | CRUD + asociación |
| Recommendations | `/api/trip/{trip}/recommendations` | generar/listar/eliminar |
| PetRecommendations | `/api/trip/{trip}/pet_recommendations` | ídem para mascotas |
| Diary | `/api/trip/{trip}/diary` | entradas de diario |
| Weather | `/api/trip/{trip}/weather` | pronósticos |

## Jobs asíncronos

- `GenerateRecommendationsJob` — llama a `RecommendationService::callOpenAI()` con el `prompt_template` del `RecommendationType`
- `GeneratePetRecommendationsJob` — ídem para mascotas
- `RecommendationService` limpia el JSON de OpenAI antes de persistir (quita bloques ` ```json ``` `)
- Requieren `php artisan queue:work` en paralelo; sin él, los jobs se encolan pero nunca ejecutan

## Convenciones

**Backend:**
- Respuestas JSON: `response()->json(['data' => ..., 'message' => ...])`
- Autorización: `$this->authorize()` en controllers usando Policies
- Validación: FormRequests en `app/Http/Requests/`

**Frontend:**
- Componentes standalone (sin NgModules)
- `ng` no está en PATH global — usar siempre `npx ng`
- No usar `any` en TypeScript salvo casos justificados
- `@fortawesome/angular-fontawesome` fijado en `0.15.0` — no actualizar (0.13 requiere Angular 16, 4.x requiere Angular 21)

## Archivos a ignorar

- `*.Zone.Identifier` — metadatos de Windows/WSL, sin utilidad
- `.env` — nunca modificar directamente, usar `.env.example` como referencia

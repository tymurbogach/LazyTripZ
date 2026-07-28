# CLAUDE.md - LazyTripZ

This file provides guidance to Claude Code when working with code in this repository.

## Arquitectura

Monorepo con backend Laravel y frontend Angular separados.
- **Backend**: `./backend/` — Laravel 13 API REST + Passport OAuth2
- **Frontend**: `./frontend/` — Angular 21 SPA (standalone components)

## Quick start

```bash
# 1. DB (siempre primero)
sudo service mariadb start

# 2. Backend (dos terminales)
cd backend && php artisan serve        # http://localhost:8000
cd backend && php artisan queue:work   # OBLIGATORIO para recomendaciones IA

# 3. Frontend
cd frontend && npm install --legacy-peer-deps
cd frontend && npx ng serve            # http://localhost:4200
```

## Setup nuevo (backend)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Crear DB (solo primera vez):
sudo mariadb -e "CREATE DATABASE projectbackend; CREATE USER 'laravel'@'localhost' IDENTIFIED BY 'password'; GRANT ALL PRIVILEGES ON projectbackend.* TO 'laravel'@'localhost'; FLUSH PRIVILEGES;"

php artisan migrate --seed
php artisan serve
```

## Stack completo

| Capa | Tecnología |
|------|-------------|
| Backend | Laravel 13 + Passport OAuth2 + MariaDB |
| Frontend | Angular 21 (standalone) + Angular Material |
| IA | **Google Gemini 2.0 Flash** (HTTP directo, NO SDK, v1beta) |
| Clima | OpenWeatherMap API |
| Auth social | Google OAuth (Socialite) |

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

## Variables de entorno críticas (backend)

```env
DB_CONNECTION=mariadb          # importante: mariadb, no mysql
DB_DATABASE=projectbackend
DB_USERNAME=laravel
DB_PASSWORD=password

GEMINI_API_KEY=...              # Google Gemini 2.0 Flash (v1beta endpoint)
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
Trip → PetRecommendation    (has-many, generadas por IA via Jobs)
Trip → WeatherForecast    (via LocationTrip)
Trip → Diary              (has-many)
Trip → Activity           (has-many, ligada a Location)
RecommendationType → Recommendation (has-many, con prompt_template para la IA)
```

## Autenticación

1. Login normal (`POST /api/auth/login`) o Google OAuth (Socialite callback)
2. Passport emite Bearer token
3. Angular interceptor añade token a cada request
4. Guard protege rutas privadas Angular
5. Middleware `auth:api` protege rutas Laravel
6. Middleware `trip.permission:admin` restringe operaciones de admin

## Rutas API principales

| Grupo | Prefijo | Notas |
|-------|---------|-------|
| Auth | `/api/auth/` | login, register, logout |
| User | `/api/user/` | perfil, búsqueda |
| Trips | `/api/trips` | apiResource completo |
| Trip↔User | `/api/trip/{trip}/users` | gestión de miembros |
| Pets | `/api/pets`, `/api/trip/{trip}/pets` | CRUD + asociación |
| Recommendations | `/api/trip/{trip}/recommendations` | generar/listar |
| PetRecommendations | `/api/trip/{trip}/pet_recommendations` | idem para mascotas |
| Diary | `/api/trip/{trip}/diary` | entradas de diario |
| Weather | `/api/trip/{trip}/weather` | pronóstico |

## Jobs asíncronos

- `GenerateRecommendationsJob` — llama a Gemini con el `prompt_template` del `RecommendationType`
- `GeneratePetRecommendationsJob` — idem para mascotas
- Requieren `php artisan queue:work` en paralelo

## Convenciones

**Backend:**
- Respuestas JSON: `response()->json(['data' => ..., 'message' => ...])`
- Autorización: `$this->authorize()` usando Policies
- Validación: FormRequests en `app/Http/Requests/`

**Frontend:**
- Componentes standalone (sin NgModules)
- `ng` no está en PATH global — usar siempre `npx ng`
- No usar `any` en TypeScript salvo casos justificados
- FontAwesome: `@fortawesome/angular-fontawesome@4.x` (requiere Angular 21+)
- Templates: usar block control flow (`@if`, `@for`) — NO `*ngIf`/`*ngFor`

## Archivos a ignorar

- `*.Zone.Identifier` — metadatos Windows/WSL
- `.env` — nunca modificar, usar `.env.example`

## Extensiones PHP requeridas

```
php8.3-xml php8.3-mysql php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-tokenizer
```
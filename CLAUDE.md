# CLAUDE.md - LazyTripZ

Fuente única de instrucciones para agentes de IA en este repositorio.
`AGENTS.md` apunta aquí; `backend/CLAUDE.md` y `frontend/CLAUDE.md` cubren solo lo específico
de cada capa y no repiten nada de este fichero.

## Arquitectura

Monorepo con backend Laravel y frontend Angular separados.
- **Backend**: `./backend/` — Laravel 13 API REST + Passport OAuth2
- **Frontend**: `./frontend/` — Angular 21 SPA (standalone components)
- **Docker**: `./docker/` — stack Compose + nginx (origen único en `:8081`)

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

`ng serve` usa `frontend/proxy.conf.json` para redirigir `/api`, `/auth` y `/storage` al
backend en `:8000`. Los servicios Angular usan rutas relativas (`serverUrl = ''`), así que
**sin el proxy la SPA no habla con la API**.

## Setup nuevo (backend)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan passport:keys     # imprescindible: sin claves, el guard api falla

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
| IA | **Google Gemini 2.5 Flash** (HTTP directo, NO SDK, v1beta) |
| Clima | OpenWeatherMap API |
| Geocodificación | Nominatim / OpenStreetMap |
| Auth social | Google OAuth (Socialite) |

El modelo se configura en `GEMINI_MODEL` (`config/services.php`), por defecto
`gemini-2.5-flash`. No hardcodear el nombre del modelo en el código.

## Comandos de desarrollo

```bash
# Backend — tests (SQLite en memoria, no necesitan MariaDB)
cd backend && php artisan test
cd backend && php artisan test --filter NombreTest

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

GEMINI_API_KEY=...              # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash
OPENWEATHER_API_KEY=...
OPENWEATHER_API_URL=https://api.openweathermap.org/data/2.5
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Modelos y relaciones

```
User → Trip               (many-to-many via trip_user, con campo permission: admin|user)
Trip → Location           (many-to-many via location_trip)
Trip → Pet                (has-many)
Trip → Recommendation     (has-many, generadas por IA via Jobs)
Trip → PetRecommendation  (has-many, generadas por IA via Jobs)
Trip → WeatherForecast    (via LocationTrip)
Trip → Diary              (has-many)
Trip → Activity           (has-many, ligada a Location)
RecommendationType → Recommendation (has-many, con prompt_template para la IA)
```

Los valores de `permission` son **`admin`** y **`user`** (no `viewer`).

## Autenticación y autorización

1. Login normal (`POST /api/auth/login`) o Google OAuth (Socialite callback)
2. Passport emite Bearer token
3. Angular interceptor añade token a cada request
4. Guard protege rutas privadas Angular
5. Middleware `auth:api` protege rutas Laravel

**Autorización a nivel de objeto — no romper esto:** toda ruta con `{trip}` lleva
`trip.permission:member` (pertenencia) o `trip.permission:admin` (rol admin), aplicado a nivel
de grupo en `routes/api.php`. El recurso `trips` se protege aparte con `TripPolicy`.
`TripAuthorizationTest` cubre esta regresión: si añades una ruta de viaje sin middleware, el
test no lo detecta automáticamente — **añádela al grupo protegido**.

`CheckTripPermission` resuelve el viaje tanto si llega como modelo (route model binding) como
si llega el id crudo, porque no todos los controllers tipan el parámetro.

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
- Ambos pasan por `RecommendationService::callGemini()`, único punto de integración con la IA
- Requieren `php artisan queue:work` en paralelo

## Convenciones

**Backend:**
- Respuestas JSON: `response()->json(['data' => ..., 'message' => ...])` (helper `sendResponse`)
- Validación: FormRequests en `app/Http/Requests/`
- Autorización de viajes: middleware `trip.permission`, no Policies nuevas.
  Solo existe `TripPolicy`; las demás se borraron por ser scaffolding que denegaba todo

**Frontend:**
- Componentes standalone (sin NgModules)
- `ng` no está en PATH global — usar siempre `npx ng`
- No usar `any` en TypeScript salvo casos justificados
- FontAwesome: `@fortawesome/angular-fontawesome@4.x` (requiere Angular 21+)
- Templates: usar block control flow (`@if`, `@for`) — NO `*ngIf`/`*ngFor`

## Estado del proyecto

Repositorio **público**, usado como pieza de portfolio. Cualquier cambio debe aguantar
escrutinio técnico externo y la documentación no puede afirmar nada falso — contrastar
versiones contra `composer.json` / `package.json` antes de escribirlas.

Cobertura de tests: solo `TripAuthorizationTest` es real. El resto es scaffolding.
No presumir de tests en documentación pública.

## Archivos a ignorar

- `*.Zone.Identifier` — metadatos Windows/WSL
- `.env` — nunca modificar, usar `.env.example`
- `backend/_ide_helper.php` — stubs generados, gitignorado

## Extensiones PHP requeridas

`composer.json` declara `"php": "^8.2"`. Con PHP 8.3:

```
php8.3-xml php8.3-mysql php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-tokenizer
```

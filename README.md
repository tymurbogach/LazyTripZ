# LazyTripZ

**AI-powered trip planner.** Build a multi-destination trip, add activities and pets, and get
tailored recommendations generated per destination by Google Gemini — plus weather forecasts,
a shared travel diary, and multi-user trips with role-based permissions.

🇪🇸 [Léeme en español](README.es.md)

```
Laravel 13 API  ·  Angular 21 SPA  ·  MariaDB  ·  Passport OAuth2  ·  Google Gemini
```

---

## What it does

| Feature | Detail |
|---|---|
| **Multi-destination trips** | Each destination has its own date range; activities are validated against it |
| **AI recommendations** | 19 categories, generated per trip and per pet by Gemini |
| **Pet-aware planning** | Pet-friendly lodging, vets, local regulations, transport — per animal |
| **Weather forecast** | OpenWeatherMap, per destination and date |
| **Shared trips** | Invite users with `admin` or `user` roles |
| **Travel diary** | Dated entries with image upload |
| **Auth** | Email/password or Google OAuth, Bearer tokens via Passport |

City search uses **Nominatim** (OpenStreetMap) — no billing account required.

---

## Architecture

Monorepo, two independent apps:

```
backend/    Laravel 13 REST API      → :8000
frontend/   Angular 21 SPA           → :4200
docker/     Compose stack + nginx    → :8081 (single origin)
```

The API is stateless: every request carries a Passport Bearer token, injected by an Angular
HTTP interceptor. No server-side sessions.

### AI generation is asynchronous

Recommendations are **not** generated in the request cycle. The controller enqueues a job and
responds immediately; a queue worker calls Gemini in the background and persists the results.

```
POST /api/trip/{id}/recommendations
   └─► GenerateRecommendationsJob        (queue: database)
          └─► RecommendationService::callGemini()
                 └─► Gemini v1beta, responseSchema-constrained JSON
                        └─► recommendations table
```

Each of the 19 recommendation types stores its own `prompt_template` in the database, so
prompts are tunable without touching code. Gemini is called over plain HTTP with a
`responseSchema`, which forces structurally valid JSON back — no SDK, no output parsing
guesswork.

> **The queue worker is mandatory.** Without `php artisan queue:work`, recommendations are
> enqueued and never generated.

### Authorization

Trip-scoped routes go through the `CheckTripPermission` middleware, which verifies the caller
belongs to the trip via the `trip_user` pivot and, where required, holds the `admin` role.
`TripPolicy` covers the `trips` resource itself: membership to read, admin to modify.

---

## Quick start

**Prerequisites:** PHP 8.2+, Composer, Node 20+, MariaDB.

PHP extensions: `xml mysql mbstring curl zip bcmath tokenizer`

### 1. Database

```bash
sudo service mariadb start
sudo mariadb -e "
  CREATE DATABASE projectbackend;
  CREATE USER 'laravel'@'localhost' IDENTIFIED BY 'password';
  GRANT ALL PRIVILEGES ON projectbackend.* TO 'laravel'@'localhost';
  FLUSH PRIVILEGES;"
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan passport:keys      # OAuth2 signing keys — required
php artisan migrate --seed
```

Add your API keys to `.env` (both are free tiers):

```env
GEMINI_API_KEY=...        # https://aistudio.google.com/apikey
OPENWEATHER_API_KEY=...   # https://openweathermap.org/api
```

Then run **two** processes:

```bash
php artisan serve        # terminal 1 → http://localhost:8000
php artisan queue:work   # terminal 2 → required for AI recommendations
```

### 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npx ng serve             # → http://localhost:4200
```

`ng serve` proxies `/api`, `/auth` and `/storage` to port 8000 via `proxy.conf.json`, so the
SPA talks to the API on a single origin — same as in production behind nginx.

---

## Docker

```bash
cp docker/.env.example .env      # fill in real values
cp docker/docker-compose.example.yml docker-compose.yml
docker compose up -d --build
docker compose exec backend php artisan migrate --force
```

nginx fronts everything on one origin (`:8081`), routing `/api`, `/auth` and `/storage` to
Laravel and everything else to the Angular build. `deploy.sh` is the deployment script used on
a Raspberry Pi host.

---

## Tests

```bash
cd backend && php artisan test
```

Tests run against in-memory SQLite — no database setup needed.

Coverage is **partial and honest about it**: `TripAuthorizationTest` locks down object-level
authorization (the security-critical part). The rest of the suite is still the default
scaffolding; there is no broad unit/feature coverage yet.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| API | Laravel 13 + Passport | OAuth2 tokens without hand-rolling auth |
| SPA | Angular 21, standalone components | No NgModules; `@if`/`@for` block control flow |
| DB | MariaDB | — |
| AI | Gemini 2.5 Flash over raw HTTP | `responseSchema` guarantees parseable JSON; no SDK dependency |
| Queue | Laravel Queue, `database` driver | No Redis needed for a single-host deployment |
| Geocoding | Nominatim (OSM) | Free, no billing account |
| Weather | OpenWeatherMap | Free tier, 1000 calls/day |

---

## Data model

```
User ──many-to-many──► Trip          (trip_user pivot: permission = admin | user)
                         ├──► Location          (many-to-many, with per-destination dates)
                         ├──► Pet
                         ├──► Activity          (bound to a Location)
                         ├──► WeatherForecast   (via LocationTrip)
                         ├──► Recommendation    (AI-generated)
                         ├──► PetRecommendation (AI-generated, per pet)
                         └──► Diary             (optional image)
```

---

## License

MIT — see [LICENSE](LICENSE).

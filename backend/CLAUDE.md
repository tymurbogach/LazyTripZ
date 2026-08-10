# Backend — Laravel 13 API

Solo lo específico del backend. Setup, stack, variables de entorno y reglas de autorización
están en [`../CLAUDE.md`](../CLAUDE.md) — no se repiten aquí.

## Estructura

```
app/
├── Http/
│   ├── Controllers/   — un controller por recurso (REST)
│   ├── Middleware/    — CheckTripPermission
│   └── Requests/      — validación de entrada (FormRequests)
├── Jobs/              — GenerateRecommendationsJob, GeneratePetRecommendationsJob
├── Models/            — Eloquent con relaciones definidas
├── Policies/          — solo TripPolicy
├── Providers/         — AppServiceProvider, AuthServiceProvider
└── Services/          — RecommendationService, WeatherForecastService, WeatherSyncService
```

## Convenciones

- Respuestas siempre en JSON vía el helper `sendResponse()` de `Controller`
  (fan-in alto: lo usan casi todos los controllers)
- Validación via FormRequests en `app/Http/Requests/`
- Migraciones con nombre descriptivo y timestamp

## Autorización

`AuthServiceProvider` registra **solo** `Trip => TripPolicy`. No añadir policies nuevas para
recursos de viaje: la autorización de todo lo que cuelga de un viaje se hace con el middleware
`trip.permission` aplicado a nivel de grupo en `routes/api.php`.

Contexto: existían 7 policies más generadas con `make:policy` que devolvían `false` en todos
los métodos y referenciaban modelos inexistentes (`Pet_Recomendation`, `Recommendation_Type`).
Se borraron. Si vuelves a crear una con `make:policy`, Laravel la autodetectará por nombre y
denegará todo silenciosamente.

## Servicios

- `RecommendationService::callGemini()` — **único** punto de integración con Gemini. Llama a
  `v1beta` por HTTP con `responseSchema`, que fuerza JSON válido en la respuesta
- `WeatherForecastService` / `WeatherSyncService` — OpenWeatherMap por coordenadas

## Base de datos

- Motor: MariaDB en desarrollo y producción
- Los **tests** usan SQLite en memoria (configurado en `phpunit.xml`), así que
  `php artisan test` no necesita MariaDB arrancada ni toca tu BD de desarrollo
- Esquema de referencia en `schema.sql`
- Seeders para todos los modelos; `DatabaseSeeder` solo invoca `RecommendationTypeSeeder`

## Tests

`tests/Feature/TripAuthorizationTest.php` es el único test real y cubre la regresión de
autorización a nivel de objeto. Usa `Passport::actingAs()` — no `actingAs($user, 'api')`, que
requiere claves de firma reales y falla con `Invalid key supplied`.

El resto (`ExampleTest.php`) es scaffolding por defecto.

## Docker

El stack está en `../docker/`: `php:8.3-fpm` para el backend, nginx como proxy inverso,
MariaDB como servicio aparte y el queue worker como servicio propio (misma imagen, comando
distinto). Volúmenes para `storage/` y `public/avatars/`.

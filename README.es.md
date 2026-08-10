# LazyTripZ

**Planificador de viajes con IA.** Crea un viaje con varios destinos, añade actividades y
mascotas, y recibe recomendaciones adaptadas a cada destino generadas por Google Gemini —
además de pronóstico del tiempo, diario de viaje compartido y viajes multiusuario con permisos
por rol.

🇬🇧 [Read this in English](README.md)

```
Laravel 13 API  ·  Angular 21 SPA  ·  MariaDB  ·  Passport OAuth2  ·  Google Gemini
```

---

## Qué hace

| Función | Detalle |
|---|---|
| **Viajes multidestino** | Cada destino tiene sus propias fechas; las actividades se validan contra ellas |
| **Recomendaciones IA** | 19 categorías, generadas por viaje y por mascota con Gemini |
| **Pensado para mascotas** | Alojamiento pet-friendly, veterinarios, normativa local, transporte — por animal |
| **Pronóstico del tiempo** | OpenWeatherMap, por destino y fecha |
| **Viajes compartidos** | Invita usuarios con rol `admin` o `user` |
| **Diario de viaje** | Entradas con fecha e imagen |
| **Autenticación** | Email/contraseña o Google OAuth, tokens Bearer vía Passport |

La búsqueda de ciudades usa **Nominatim** (OpenStreetMap) — sin cuenta de facturación.

---

## Arquitectura

Monorepo con dos aplicaciones independientes:

```
backend/    API REST Laravel 13     → :8000
frontend/   SPA Angular 21          → :4200
docker/     Stack Compose + nginx   → :8081 (origen único)
```

La API es stateless: cada petición lleva un token Bearer de Passport, inyectado por un
interceptor HTTP de Angular. No hay sesiones en servidor.

### La generación con IA es asíncrona

Las recomendaciones **no** se generan dentro de la petición. El controller encola un job y
responde al momento; un worker llama a Gemini en segundo plano y guarda los resultados.

```
POST /api/trip/{id}/recommendations
   └─► GenerateRecommendationsJob        (cola: database)
          └─► RecommendationService::callGemini()
                 └─► Gemini v1beta, JSON restringido por responseSchema
                        └─► tabla recommendations
```

Cada uno de los 19 tipos de recomendación guarda su propio `prompt_template` en base de datos,
así que los prompts se ajustan sin tocar código. Gemini se llama por HTTP plano con un
`responseSchema`, lo que obliga a que la respuesta sea JSON estructuralmente válido — sin SDK
y sin adivinar al parsear.

> **El worker de cola es obligatorio.** Sin `php artisan queue:work` las recomendaciones se
> encolan y no se generan nunca.

### Autorización

Las rutas de viaje pasan por el middleware `CheckTripPermission`, que comprueba que quien llama
pertenece al viaje (vía el pivot `trip_user`) y, donde hace falta, que tiene rol `admin`.
`TripPolicy` cubre el recurso `trips` en sí: pertenencia para leer, admin para modificar.

---

## Puesta en marcha

**Requisitos:** PHP 8.2+, Composer, Node 20+, MariaDB.

Extensiones PHP: `xml mysql mbstring curl zip bcmath tokenizer`

### 1. Base de datos

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
php artisan passport:keys      # claves de firma OAuth2 — imprescindible
php artisan migrate --seed
```

Añade tus claves de API al `.env` (ambas tienen plan gratuito):

```env
GEMINI_API_KEY=...        # https://aistudio.google.com/apikey
OPENWEATHER_API_KEY=...   # https://openweathermap.org/api
```

Después arranca **dos** procesos:

```bash
php artisan serve        # terminal 1 → http://localhost:8000
php artisan queue:work   # terminal 2 → necesario para las recomendaciones IA
```

### 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npx ng serve             # → http://localhost:4200
```

`ng serve` redirige `/api`, `/auth` y `/storage` al puerto 8000 mediante `proxy.conf.json`, de
forma que la SPA habla con la API en un único origen — igual que en producción tras nginx.

---

## Docker

```bash
cp docker/docker-compose.example.yml docker-compose.yml
cp docker/.env.example .env      # rellena los valores reales
./deploy.sh
```

`deploy.sh` construye las imágenes, levanta el stack, espera a MariaDB, ejecuta las migraciones
y cachea configuración y rutas. Con `./deploy.sh --no-pull` reconstruye sin tocar git, o usa
`docker compose` directamente si lo prefieres.

nginx expone todo en un único origen (`:8081`) y enruta `/api`, `/auth` y `/storage` a Laravel
y el resto al build de Angular.

---

## Tests

```bash
cd backend && php artisan test
```

Los tests corren sobre SQLite en memoria — no hace falta preparar ninguna base de datos.

La cobertura es **parcial y no lo disimula**: `TripAuthorizationTest` blinda la autorización a
nivel de objeto (la parte crítica para la seguridad). El resto de la suite sigue siendo el
scaffolding por defecto; todavía no hay cobertura amplia de unidad ni de integración.

---

## Stack y por qué

| Capa | Elección | Motivo |
|---|---|---|
| API | Laravel 13 + Passport | Tokens OAuth2 sin escribir la autenticación a mano |
| SPA | Angular 21, componentes standalone | Sin NgModules; control de flujo con `@if`/`@for` |
| BD | MariaDB | — |
| IA | Gemini 2.5 Flash por HTTP directo | `responseSchema` garantiza JSON parseable; sin dependencia del SDK |
| Colas | Laravel Queue, driver `database` | Sin Redis para un despliegue de un solo host |
| Geocodificación | Nominatim (OSM) | Gratis y sin cuenta de facturación |
| Clima | OpenWeatherMap | Plan gratuito, 1000 llamadas/día |

---

## Modelo de datos

```
User ──muchos-a-muchos──► Trip       (pivot trip_user: permission = admin | user)
                            ├──► Location          (muchos-a-muchos, con fechas por destino)
                            ├──► Pet
                            ├──► Activity          (ligada a una Location)
                            ├──► WeatherForecast   (vía LocationTrip)
                            ├──► Recommendation    (generada por IA)
                            ├──► PetRecommendation (generada por IA, por mascota)
                            └──► Diary             (imagen opcional)
```

---

## Licencia

MIT — ver [LICENSE](LICENSE).

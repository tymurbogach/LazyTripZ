# LazyTripZ — Resumen técnico del proyecto

## ¿Qué es?

Planificador de viajes con IA. El usuario crea viajes con múltiples destinos y fechas, añade actividades, gestiona mascotas y recibe recomendaciones personalizadas generadas por IA según cada destino.

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Backend | Laravel 13 + Passport OAuth2 |
| Frontend | Angular 21 (standalone components) |
| Base de datos | MariaDB |
| IA | Google Gemini 2.5 Flash (via HTTP directo) |
| Clima | OpenWeatherMap API |
| Geocodificación | Nominatim / OpenStreetMap (gratuito) |
| Auth social | Google OAuth (Socialite) |
| Jobs asíncronos | Laravel Queue (driver: database) |
| Archivos | Laravel Storage (disco `public`) |

---

## Arquitectura

```
Monorepo
├── backend/    Laravel 13 API REST — puerto 8000
└── frontend/   Angular 21 SPA     — puerto 4200
```

La API es completamente stateless: cada request lleva un Bearer token emitido por Passport. El frontend nunca maneja sesiones.

Los jobs de recomendación son asíncronos: el controller encola el job y responde inmediatamente; el worker procesa la llamada a Gemini en segundo plano e inserta los resultados en BD.

---

## Modelo de datos (relaciones principales)

```
User ──┐ many-to-many (trip_user: permission admin|viewer)
       ▼
      Trip ──► Location      (many-to-many via location_trip, con start_date/end_date)
           ──► Pet           (has-many)
           ──► Activity      (has-many, ligada a Location)
           ──► WeatherForecast (via LocationTrip)
           ──► Recommendation    (has-many, generada por IA)
           ──► PetRecommendation (has-many, generada por IA, ligada a Pet)
           ──► Diary         (has-many, con imagen opcional)
```

---

## Flujo de creación de un viaje (wizard 4 pasos)

1. **Datos básicos**: nombre, adultos, niños, transporte
2. **Destinos**: ciudad + fechas (búsqueda via Nominatim)
3. **Actividades**: descripción, día, momento del día (vinculada al destino)
4. **Recomendaciones**: selección de categorías → jobs encolan llamadas a Gemini

Al enviar, el frontend ejecuta en cadena:
```
createTrip → addPets (parallel) → addLocations → addWeather → addActivities → generateRecs
```

---

## Recomendaciones IA

Hay **19 tipos de recomendaciones** en dos categorías:

**General** (para el viaje): alojamiento, cultura, salud, documentación, transporte, conectividad, seguridad, eventos, ecología, vida social, métodos de pago.

**Mascotas** (por cada mascota): alojamiento pet-friendly, restaurantes pet-friendly, transporte, documentación, veterinarios, parques, normativa local, tiendas/comida, servicios, clima/salud, adaptación, actividades.

Cada tipo tiene un `prompt_template` en BD que se envía a Gemini. La respuesta JSON se parsea y persiste en `recommendations` / `pet_recommendations`.

---

## Autenticación

- Login normal: `POST /api/auth/login` → Bearer token (Passport)
- Google OAuth: redirect → callback Socialite → Bearer token
- Interceptor Angular añade token a cada petición automáticamente
- Middleware `trip.permission:admin` restringe operaciones de admin en viajes compartidos

---

## Funcionalidades completas

- [x] CRUD completo de viajes
- [x] Multi-usuario por viaje (admin / viewer)
- [x] Gestión de mascotas
- [x] Búsqueda de ciudades (Nominatim, gratuito)
- [x] Pronóstico del tiempo por destino y fechas
- [x] Actividades con validación de fechas por destino
- [x] Recomendaciones IA generales y por mascota
- [x] Diario de viaje con imágenes
- [x] Avatar de usuario
- [x] Google OAuth

---

## APIs externas y sus costes

| Servicio | Uso | Coste |
|----------|-----|-------|
| Google Gemini 2.5 Flash | Generación de recomendaciones | Gratuito (límite generoso) |
| OpenWeatherMap | Pronóstico por coordenadas | Gratuito (1000 llamadas/día) |
| Nominatim (OSM) | Geocodificación de ciudades | Gratuito (1 req/seg máx) |
| Google OAuth | Login social | Gratuito |

---

## ¿Para qué más podría servir este código?

El núcleo del proyecto es un **planificador de eventos multi-destino con IA**. El dominio "viajes" es intercambiable. El motor subyacente sirve para:

| Idea | Reutilización |
|------|---------------|
| **Planificador de bodas** | Trip → Evento, Location → Venue, Activity → Tarea, Recs → proveedores recomendados |
| **Gestión de proyectos ligera** | Trip → Proyecto, Location → Fase, Activity → Tarea, Recs → IA sugiere siguientes pasos |
| **Agenda de conciertos/festivales** | Trip → Festival, Location → Escenario, Activity → Actuación, Weather → clima del día |
| **Dieta/rutina de viaje** | Trip → Plan semanal, Activity → comida/ejercicio, Recs → IA sugiere según destino |
| **Roadtrip planner** | Mismo dominio, UI diferente — rutas en vez de ciudades aisladas |

Lo que habría que cambiar para cada caso:
- Seeders de `recommendation_types` (los prompts de IA)
- Nombres/labels en el frontend
- Tema visual (colores, ilustraciones, tipografía)
- Modelos opcionales (`Pet` → lo que aplique al nuevo dominio)

Lo que **no cambiaría**: auth, wizard multi-paso, jobs asíncronos de IA, sistema de recomendaciones, diario, weather (si aplica), compartir con otros usuarios.

---

## Comandos de arranque

```bash
# Base de datos
sudo service mariadb start

# Backend
cd backend && php artisan serve        # terminal 1
cd backend && php artisan queue:work   # terminal 2 (obligatorio para IA)

# Frontend
cd frontend && npx ng serve            # terminal 3
```

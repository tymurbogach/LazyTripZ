# Frontend — Angular 21 SPA

Solo lo específico del frontend. Setup general y convenciones comunes están en
[`../CLAUDE.md`](../CLAUDE.md) — no se repiten aquí.

## Trampas de arranque

```bash
npm install --legacy-peer-deps   # sin el flag falla por conflicto de peer deps
npx ng serve                     # ng no está en PATH global
```

## Comunicación con la API

Los servicios usan **rutas relativas** (`serverUrl = ''`, p. ej. `/api/user/trips`), no una URL
absoluta al backend. Esto es deliberado: en producción nginx sirve SPA y API en el mismo origen.

En desarrollo eso lo resuelve `proxy.conf.json`, enganchado al target `serve` de `angular.json`,
que redirige `/api`, `/auth` y `/storage` a `http://localhost:8000`. **Si tocas el proxy o la
URL base, comprueba que ambos entornos siguen funcionando.**

## Estructura

```
src/app/
├── components/
│   ├── auth/              — login, register, google oauth callback
│   ├── dashboard/         — área principal autenticada
│   │   └── trip/          — detalle de viaje, clima, opciones
│   ├── diaries/           — diario de viaje
│   ├── edit-trip/         — edición de viaje
│   ├── header/            — cabecera global
│   ├── new-trip/          — wizard de creación (trip, locations, activities, recommendations)
│   ├── profile/           — perfil de usuario
│   ├── recommendations/   — recomendaciones IA
│   └── utilities/         — componentes reutilizables
│       ├── dialog/        — diálogos de confirmación/error global
│       ├── input/         — input personalizado
│       ├── spinner/       — loading indicator
│       ├── btn-show-passwd/
│       └── search-google-places/  — búsqueda de ciudades vía Nominatim
├── services/              — lógica de negocio y llamadas API
├── guards/                — auth.guard.ts protege rutas privadas
├── interfaces/            — tipos TypeScript
└── enum/                  — input.enum.ts, weather.enum.ts
```

## Convenciones

- Componentes standalone (sin NgModules)
- Servicios inyectados via `inject()` o constructor
- No usar `any` en TypeScript salvo casos justificados y comentados
- Templates: block control flow (`@if`, `@for`, `@else`) — NO `*ngIf`/`*ngFor`

## Autenticación

- `auth.interceptor.ts` añade el Bearer token a cada request automáticamente
- `auth.guard.ts` protege las rutas privadas
- Callback de Google OAuth en `auth-callback.component.ts`

## Servicios principales

```
auth.service.ts           — login, register, logout, google oauth
trip.service.ts           — CRUD de viajes
trip-user.service.ts      — gestión de usuarios en viaje y permisos
user.service.ts           — perfil y datos de usuario
recommendation.service.ts — recomendaciones IA
diary.service.ts          — diario de viaje
dialog.service.ts         — diálogos globales (error, confirm, info)
error-input.service.ts    — manejo de errores de formulario
weather-icon.service.ts   — mapeo de códigos de clima a iconos
```

## Permisos en UI

`getPermissionUserFromTrip` devuelve `'admin'` o `'user'`. La UI solo restringe a admin la
edición/borrado del viaje y la gestión de miembros; el resto de acciones están abiertas a
cualquier miembro. El backend aplica la misma regla — si endureces una, endurece la otra.

## Docker

`../docker/`: build con `node:20-alpine` (`npm install --legacy-peer-deps && npx ng build`),
resultado servido por nginx.

# Frontend — Angular 21 SPA

## Arranque desde cero
```bash
# IMPORTANTE: no usar npm install normal, hay conflicto de peer deps
npm install --legacy-peer-deps

# ng no está en PATH global, usar siempre npx
npx ng serve    # http://localhost:4200
```

## Templates
- Se usa block control flow (`@if`, `@for`, `@else`) — NO usar `*ngIf`/`*ngFor` (migrado en Angular 21)

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
│       └── search-google-places/
├── services/              — lógica de negocio y llamadas API
├── guards/                — auth.guard.ts protege rutas privadas
├── interfaces/            — tipos TypeScript
└── enum/                  — input.enum.ts, weather.enum.ts
```

## Convenciones
- Componentes standalone (sin NgModules)
- Servicios inyectados via `inject()` o constructor
- No usar `any` en TypeScript salvo casos justificados y comentados
- Ignorar archivos `*.Zone.Identifier` — metadatos de Windows/WSL sin utilidad

## Autenticación
- Interceptor `auth.interceptor.ts` añade Bearer token a cada request automáticamente
- Guard `auth.guard.ts` protege todas las rutas privadas
- Callback de Google OAuth en `auth-callback.component.ts`

## Servicios principales
```
auth.service.ts          — login, register, logout, google oauth
trip.service.ts          — CRUD de viajes
trip-user.service.ts     — gestión de usuarios en viaje
user.service.ts          — perfil y datos de usuario
recommendation.service.ts — recomendaciones IA
diary.service.ts         — diario de viaje
dialog.service.ts        — diálogos globales (error, confirm, info)
error-input.service.ts   — manejo de errores de formulario
weather-icon.service.ts  — mapeo de códigos de clima a iconos
```

## API
- Backend en `http://localhost:8000/api`
- Todas las peticiones autenticadas llevan `Authorization: Bearer {token}`
- Estructura de respuesta esperada: `{ data: ..., message: ... }`

## Notas Docker (pendiente)
- Imagen base: node:20-alpine
- Build: `npm install --legacy-peer-deps && npx ng build`
- Servir build con nginx
- Variable de entorno para URL del backend en producción
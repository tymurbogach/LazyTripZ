# AGENTS.md - LazyTrip

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

## Stack

| Capa | Tecnología |
|------|-------------|
| Backend | Laravel 13 + Passport OAuth2 + MariaDB |
| Frontend | Angular 21 (standalone) + Angular Material |
| IA | **Google Gemini 2.0 Flash** (HTTP directo, NO SDK, v1beta) |
| Clima | OpenWeatherMap API |
| Auth social | Google OAuth (Socialite) |

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

## Comandos clave

```bash
# Backend tests
php artisan test
php artisan test --filter NombreTest

# Routes
php artisan route:list

# Frontend build/test
npx ng build
npx ng test
```

## Convenciones críticas

- **DB**: `DB_CONNECTION=mariadb` (NO mysql)
- **ng**: usar siempre `npx ng`, no `ng` global
- **FontAwesome**: `@fortawesome/angular-fontawesome@4.x` (requiere Angular 21+)
- **Templates**: usar `@if`/`@for` block control flow — NO `*ngIf`/`*ngFor`
- **Respuestas JSON**: `response()->json(['data' => ..., 'message' => ...])`
- **Ignorar**: `*.Zone.Identifier` (metadatos Windows/WSL)

## Extensiones PHP requeridas

```
php8.3-xml php8.3-mysql php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-tokenizer
```
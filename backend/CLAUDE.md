# Backend — Laravel 13 API

## Arranque desde cero
```bash
# 1. Dependencias PHP
composer install

# 2. Entorno
cp .env.example .env
php artisan key:generate

# 3. Base de datos — MariaDB debe estar corriendo
sudo service mariadb start

# Crear DB la primera vez (solo una vez):
sudo mariadb
# Dentro del prompt:
# CREATE DATABASE projectbackend;
# CREATE USER 'laravel'@'localhost' IDENTIFIED BY 'password';
# GRANT ALL PRIVILEGES ON projectbackend.* TO 'laravel'@'localhost';
# FLUSH PRIVILEGES;
# EXIT;

# 4. Migrar y sembrar
php artisan migrate --seed

# 5. Arrancar
php artisan serve        # http://localhost:8000
php artisan queue:work   # terminal separada, necesario para recomendaciones IA
```

## Configuración .env crítica
```env
DB_CONNECTION=mariadb    # importante: mariadb, no mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=projectbackend
DB_USERNAME=laravel
DB_PASSWORD=password
```

## Estructura
```
app/
├── Http/
│   ├── Controllers/   — un controller por recurso (REST)
│   ├── Middleware/    — CheckTripPermission
│   └── Requests/      — validación de entrada (FormRequests)
├── Jobs/              — GenerateRecommendationsJob, GeneratePetRecommendationsJob
├── Models/            — Eloquent con relaciones definidas
├── Policies/          — autorización por recurso
├── Providers/         — AppServiceProvider, AuthServiceProvider
└── Services/          — RecommendationService, WeatherForecastService
```

## Convenciones
- Respuestas siempre en JSON: `response()->json(['data' => ..., 'message' => ...])`
- Autorización via `$this->authorize()` en controllers usando Policies
- Validación via FormRequests en `app/Http/Requests/`
- Migraciones con nombre descriptivo y timestamp

## Autenticación
- Laravel Passport (OAuth2) para tokens API
- Laravel Socialite para Google OAuth
- Middleware `auth:api` en rutas protegidas
- `CheckTripPermission` middleware para permisos de viaje

## Base de datos
- Motor: MariaDB
- Esquema completo disponible en `schema.sql`
- Seeders disponibles para todos los modelos
- Arrancar MariaDB antes de cualquier operación: `sudo service mariadb start`

## Extensiones PHP requeridas
```
php8.3-xml php8.3-mysql php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-tokenizer
```

## Notas Docker (pendiente)
- Imagen base: php:8.3-fpm
- Nginx como proxy reverso
- MariaDB como servicio separado
- Queue worker como servicio separado (mismo imagen, comando diferente)
- Volumen para `storage/` y `public/avatars/`
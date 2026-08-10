# LazyTripZ — Backend

Laravel 13 REST API with Passport OAuth2, MariaDB and asynchronous AI recommendation jobs.

**Setup, architecture and full documentation live in the [root README](../README.md).**
Spanish version: [README.es.md](../README.es.md).

## Quick reference

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan passport:keys      # required — the api guard fails without signing keys
php artisan migrate --seed

php artisan serve              # http://localhost:8000
php artisan queue:work         # required for AI recommendations
php artisan test               # in-memory SQLite, no MariaDB needed
```

Notes for contributors: [CLAUDE.md](CLAUDE.md).

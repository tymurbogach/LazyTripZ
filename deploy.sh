#!/usr/bin/env bash
#
# Despliega LazyTripZ con Docker Compose.
#
# Uso:
#   ./deploy.sh              # pull + build + up + migrate
#   ./deploy.sh --no-pull    # no toca git, solo reconstruye y arranca
#
# Requisitos previos (una sola vez):
#   cp docker/docker-compose.example.yml docker-compose.yml
#   cp docker/.env.example .env      # y rellenar los valores reales
#
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
ENV_FILE="${ENV_FILE:-.env}"
PULL=true
[ "${1:-}" = "--no-pull" ] && PULL=false

log()  { printf '\033[0;34m→\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
die()  { printf '\033[0;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker no está instalado"
docker compose version >/dev/null 2>&1 || die "se necesita el plugin 'docker compose'"
[ -f "$COMPOSE_FILE" ] || die "falta $COMPOSE_FILE — copia docker/docker-compose.example.yml"
[ -f "$ENV_FILE" ]     || die "falta $ENV_FILE — copia docker/.env.example"

compose() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

if [ "$PULL" = true ] && [ -d .git ]; then
    log "Actualizando código..."
    git pull --ff-only
    ok "En $(git rev-parse --short HEAD)"
fi

log "Construyendo imágenes..."
compose build

log "Levantando servicios..."
compose up -d

log "Esperando a la base de datos..."
for i in $(seq 1 40); do
    if compose exec -T db mariadb-admin ping -h localhost --silent >/dev/null 2>&1; then
        ok "Base de datos lista"; break
    fi
    [ "$i" -eq 40 ] && die "timeout esperando a la base de datos"
    sleep 3
done

log "Ejecutando migraciones..."
compose exec -T backend php artisan migrate --force

# storage:link falla si el enlace ya existe; no es motivo para abortar
compose exec -T backend php artisan storage:link >/dev/null 2>&1 || true

log "Cacheando configuración y rutas..."
compose exec -T backend php artisan config:cache >/dev/null
compose exec -T backend php artisan route:cache  >/dev/null

ok "LazyTripZ desplegado — http://localhost:8081"

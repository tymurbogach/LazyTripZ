#!/bin/bash

# 🚀 Deploy LazyTrip en Raspberry Pi

STACK_PATH="/home/pi/docker/stacks/lazytrip"
APP_PATH="/home/pi/docker/appdata"
REPO_URL="https://github.com/TimurTwerKing/lazytrip.git"

echo "🔄 Iniciando actualización en $APP_PATH..."

cd "$APP_PATH" || { echo "❌ Error: No se encuentra $APP_PATH"; exit 1; }

# Clonar limpio o hacer pull si ya existe
if [ -d "lazytrip" ]; then
    echo "📥 Actualizando código existente..."
    cd lazytrip && git pull && cd ..
else
    echo "📥 Clonando repositorio..."
    git clone "$REPO_URL" lazytrip
fi

# Copiar config de nginx al stack si no existe
if [ ! -f "$STACK_PATH/lazytrip.conf" ]; then
    echo "📋 Copiando nginx.conf al stack..."
    cp "$APP_PATH/lazytrip/docker/nginx/lazytrip.conf" "$STACK_PATH/lazytrip.conf"
fi

echo "🧱 Construyendo imágenes y reiniciando contenedores..."
cd "$STACK_PATH" || { echo "❌ Error: No se encuentra $STACK_PATH"; exit 1; }

docker compose build --no-cache
docker compose down --remove-orphans
docker compose up -d --force-recreate

# Esperar a que MariaDB arranque
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# Migraciones y storage link
echo "🗄️  Ejecutando migraciones..."
docker compose exec -T backend php artisan migrate --force

echo "🔗 Creando storage:link..."
docker compose exec -T backend php artisan storage:link

# Limpiar imágenes huérfanas
echo "🧹 Limpiando imágenes antiguas..."
docker image prune -f

echo "✅ LazyTrip desplegado correctamente."
echo "🌐 Accede desde http://$(hostname -I | awk '{print $1}'):8081"

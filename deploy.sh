#!/bin/bash

# 🚀 Deploy LazyTripZ en Raspberry Pi

STACK_PATH="/home/pi/docker/stacks/lazytripz"
APP_PATH="/home/pi/docker/appdata"
REPO_URL="https://github.com/tymurbogach/lazytripz.git"

echo "🔄 Iniciando actualización en $APP_PATH..."

cd "$APP_PATH" || { echo "❌ Error: No se encuentra $APP_PATH"; exit 1; }

# Clonar limpio o hacer pull si ya existe
if [ -d "lazytripz" ]; then
    echo "📥 Actualizando código existente..."
    cd lazytripz && git pull && cd ..
else
    echo "📥 Clonando repositorio..."
    git clone "$REPO_URL" lazytripz
fi

# Copiar config de nginx al stack si no existe
if [ ! -f "$STACK_PATH/lazytripz.conf" ]; then
    echo "📋 Copiando nginx.conf al stack..."
    cp "$APP_PATH/lazytripz/docker/nginx/lazytripz.conf" "$STACK_PATH/lazytripz.conf"
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

echo "✅ LazyTripZ desplegado correctamente."
echo "🌐 Accede desde http://$(hostname -I | awk '{print $1}'):8081"

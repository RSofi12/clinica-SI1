#!/bin/sh
set -e

echo "==> Verificando directorios y permisos de Laravel..."
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 777 storage bootstrap/cache

# Respaldo de seguridad para APP_KEY si no fue definida en el entorno
if [ -z "$APP_KEY" ]; then
    echo "==> APP_KEY no detectado. Estableciendo clave de seguridad por defecto..."
    export APP_KEY="base64:cPd/KNoY7lgscKGb4jRO969xCEZ/ZGLdhrSGbfGtXVA="
fi

# Respaldo de seguridad para SESSION_DRIVER si no fue definido en el entorno
if [ -z "$SESSION_DRIVER" ]; then
    export SESSION_DRIVER="file"
fi

# Respaldo de seguridad para DB_CONNECTION si no fue definido en el entorno
if [ -z "$DB_CONNECTION" ]; then
    export DB_CONNECTION="pgsql"
fi

echo "==> Limpiando cache previa..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "==> Ejecutando migraciones en PostgreSQL..."
php artisan migrate --force

echo "==> Ejecutando seeders de datos iniciales..."
php artisan db:seed --force || true

echo "==> Servidor listo. Iniciando en puerto ${PORT:-10000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"

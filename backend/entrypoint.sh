#!/bin/sh
set -e

echo "==> Limpiando cache previa..."
php artisan config:clear || true

echo "==> Ejecutando migraciones en PostgreSQL..."
php artisan migrate --force

echo "==> Ejecutando seeders de datos iniciales..."
php artisan db:seed --force || true

echo "==> Optimizando configuracion de Laravel..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "==> Servidor listo. Iniciando en puerto ${PORT:-10000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"

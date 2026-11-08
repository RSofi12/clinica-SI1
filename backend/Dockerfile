FROM php:8.3-cli-alpine

# Dependencias del sistema y librerias de PostgreSQL
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    bash

# Extensiones de PHP requeridas por Laravel y PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql bcmath zip

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar codigo fuente del backend (incluye el frontend precompilado en public/)
COPY . .

# Instalar dependencias de Composer para produccion
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Permisos para storage y cache
RUN chmod -R 777 storage bootstrap/cache
RUN chmod +x entrypoint.sh

ENV PORT=10000
EXPOSE 10000

CMD ["./entrypoint.sh"]

# Bitácora de Sesión: Dockerización del Monorepo con Nginx, PHP-FPM, PostgreSQL y Vite

**Fecha:** 05 de Noviembre de 2026  
**Autor:** Agente Antigravity  
**Alcance:** Preparación y estandarización del entorno de despliegue en la nube mediante contenedores Docker y Docker Compose para Backend (Laravel), Frontend (React + Vite), Base de Datos (PostgreSQL 16) y Servidor Web (Nginx).  
**Componentes Afectados:** `docker/php/Dockerfile`, `docker/nginx/default.conf`, `docker/frontend/Dockerfile`, `docker-compose.yml`, `README.md`, `docs/ai/`.

---

## 1. Resumen Ejecutivo
Siguiendo los requerimientos técnicos del examen para despliegue en la nube (AWS, Azure, GCP o PaaS) y asegurando consistencia entre entornos de desarrollo y producción:
1. **Servidor Web Nginx como Proxy Inverso:** Implementación de contenedor `clinica_nginx` con configuración optimizada para Laravel, manejo de URLs limpias, cabeceras de seguridad y comunicación vía FastCGI con PHP-FPM en el puerto 9000.
2. **Contenedor PHP 8.3 FPM:** Creación de imagen ligera sobre Alpine Linux (`php:8.3-fpm-alpine`) con extensiones PostgreSQL (`pdo_pgsql`, `pgsql`), librerías del sistema y Composer 2 oficial.
3. **Contenedor Frontend React + Vite:** Configuración de entorno Node 22 Alpine para ejecutar el SPA con soporte de host expuesto (`--host 0.0.0.0`).
4. **Orquestación con Docker Compose:** Archivo `docker-compose.yml` que enlaza los 4 servicios en una red privada bridge (`clinica-network`), con volumen persistente para PostgreSQL (`pgdata`) e inyección automática de `DB_HOST=postgres` para permitir alternancia sin modificar `.env`.

---

## 2. Archivos Creados y Modificados

### 2.1 Infraestructura Docker
- **`docker/php/Dockerfile`:**
  - Base: `php:8.3-fpm-alpine`.
  - Extensiones instaladas: `pdo`, `pdo_pgsql`, `pgsql`, `mbstring`, `zip`, `bcmath`, `intl`, `opcache`.
  - Composer 2 copiado desde imagen oficial `composer:2`.
  - Directorio de trabajo: `/var/www/backend`.
- **`docker/nginx/default.conf`:**
  - Servidor en puerto 80 con raíz en `/var/www/backend/public`.
  - `client_max_body_size 20M` y `fastcgi_read_timeout 300`.
  - Proxy FastCGI dirigido a `backend:9000`.
- **`docker/frontend/Dockerfile`:**
  - Base: `node:22-alpine`.
  - Dependencias y código montados en `/app`.
  - Comando por defecto: `npm run dev -- --host 0.0.0.0`.
- **`docker-compose.yml`:**
  - Servicios: `postgres` (16-alpine), `backend` (PHP 8.3), `web` (Nginx), `frontend` (Node 22).
  - Red: `clinica-network`.
  - Volumen: `pgdata`.

### 2.2 Documentación
- **`README.md`:**
  - Actualizada la estructura de directorios del monorepo incorporando `docker/` y `docker-compose.yml`.
  - Añadida la sección *4. Levantamiento Alternativo con Docker & Docker Compose* con comandos de construcción, ejecución de migraciones en contenedor y gestión de logs.
- **`docs/ai/`:**
  - Actualizados `CURRENT_STATE.md`, `HANDOFF_LATEST.md`, `NEXT_STEPS.md` y `DECISIONS_LOG.md` (Registro 20).

---

## 3. Comandos a Ejecutar tras Hacer Pull

Para integrantes del equipo que deseen levantar el proyecto con Docker:

```powershell
# 1. Asegurar archivo .env base en backend si no existe
copy backend\.env.example backend\.env

# 2. Construir y levantar contenedores en segundo plano
docker compose up -d --build

# 3. Generar clave y ejecutar migraciones con seeders en el contenedor backend
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
```

*(Para continuar trabajando en modo local nativo sin Docker, no se requiere ningún cambio adicional; el flujo tradicional con `php artisan serve` y `npm run dev` permanece 100% operativo).*

---

## 4. Verificaciones Realizadas
- [x] Sintaxis válida en `docker-compose.yml` (validación de servicios, volúmenes y redes).
- [x] Sintaxis de directivas FastCGI y reescritura en `docker/nginx/default.conf`.
- [x] Dockerfiles de PHP y Frontend configurados con rutas relativas al monorepo.
- [x] Integridad de `.gitignore` preservando código fuente y excluyendo temporales.

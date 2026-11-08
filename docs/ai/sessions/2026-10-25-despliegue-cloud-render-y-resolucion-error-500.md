# Sesión: Despliegue en la Nube (Render Cloud) y Resolución de Error 500
**Fecha:** 25 de Octubre de 2026  
**Rama:** `robert-dev`  
**Autor:** Antigravity / Roberto  

---

## 1. Solicitud y Objetivos
1. Empaquetar y desplegar la solución fullstack (Laravel 13 + React + PostgreSQL) en la nube pública (Render) bajo arquitectura All-in-One: `https://clinica-la-cruz-si1.onrender.com`.
2. Garantizar alta responsividad en smartphones y sincronización en zona horaria boliviana (`America/La_Paz`, UTC-4).
3. Eliminar accesos directos / botones de credenciales rápidas de la pantalla de inicio de sesión (`LoginPage.jsx`) para proyectar la estética institucional formal.
4. Diagnosticar y erradicar la pantalla de error HTTP `500 | Server Error` observada al acceder al dominio en Render.

---

## 2. Diagnóstico del Error 500 (Root Cause Analysis)
Al consultar la URL en Render tras el despliegue del contenedor Docker:
- El endpoint de diagnóstico `/up` respondía `200 OK` (*Application up. HTTP request received. Response rendered in 46ms*), confirmando que el contenedor y `php artisan serve` estaban activos.
- La ruta raíz `/` y las rutas de API (`/api/roles`, etc.) arrojaban `500 | Server Error`.

**Causas Raíz Identificadas:**
1. **Inexistencia de la tabla `sessions` en PostgreSQL:**  
   Laravel 13 por defecto configura `SESSION_DRIVER=database` en `config/session.php`. Sin embargo, las migraciones personalizadas del proyecto no incluían la tabla de sesiones de Laravel. Al procesar el middleware `web` (`StartSession`), Laravel intentaba consultar la tabla `sessions` inexistente, provocando una excepción de PostgreSQL no controlada con `APP_DEBUG=false`.
2. **Conexión de Base de Datos por Defecto (`DB_CONNECTION=sqlite`):**  
   En `config/database.php`, el valor por defecto ante la ausencia de la variable en el entorno era `sqlite`. Si Render no inyectaba explícitamente `DB_CONNECTION`, el framework intentaba abrir un archivo SQLite inexistente.
3. **Acoplamiento de Middleware `web` a la Entrega de la SPA:**  
   En `routes/web.php`, la ruta comodín `/{any?}` estaba subordinada al grupo `web`, ejecutando sesiones y cookies para servir un simple archivo estático `index.html`.
4. **Ausencia de Canal `stderr` en Logs:**  
   `config/logging.php` utilizaba únicamente el canal `single` (`storage/logs/laravel.log`), imposibilitando ver los volcados de excepción en la consola de Render en tiempo real.

---

## 3. Cambios Implementados

### Backend
1. **Migración de Tabla de Sesiones:**
   - Creado [`backend/database/migrations/2026_10_20_000007_create_sessions_table.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/database/migrations/2026_10_20_000007_create_sessions_table.php) con soporte condicional `Schema::hasTable('sessions')`.
2. **Configuración de Base de Datos y Sesiones:**
   - [`backend/config/database.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/config/database.php): Fallback de `DB_CONNECTION` actualizado a `'pgsql'` (eliminado `'sqlite'`).
   - [`backend/config/session.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/config/session.php): Fallback de `SESSION_DRIVER` actualizado a `'file'` para máxima resiliencia.
3. **Logging en Contenedor:**
   - [`backend/config/logging.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/config/logging.php): `LOG_STACK` actualizado a `'single,stderr'`, enviando los errores a la consola de Render de forma inmediata.
4. **Ruta SPA Desacoplada de Sesión:**
   - [`backend/routes/web.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/routes/web.php): Aplicado `Route::withoutMiddleware(['web'])` para entregar `public/index.html` de forma directa e instantánea.
5. **Entrypoint de Docker Robusto:**
   - [`backend/entrypoint.sh`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/entrypoint.sh):
     - Creación obligatoria de subcarpetas `storage/framework/sessions`, `views`, `cache`, `logs` con permisos `777`.
     - Inyección de fallbacks seguros de entorno: `APP_KEY`, `SESSION_DRIVER=file`, `DB_CONNECTION=pgsql`.
     - Reemplazo de optimización estática `config:cache` / `route:cache` por limpieza dinámica `config:clear`, `route:clear`, `view:clear` para evitar colisiones con closures.
     - Ejecución forzosa de migraciones y seeders automáticos.

### Frontend
1. **Retiro de Botones de Prueba en Login:**
   - [`frontend/src/pages/LoginPage.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/pages/LoginPage.jsx): Removidos los botones de acceso rápido y textos de demostración para presentar una interfaz institucional limpia y formal.
2. **Empaquetado SPA:**
   - Compilación generada con `npm run build` directamente hacia `backend/public/`.

---

## 4. Verificación y Resultados
- **Sintaxis PHP:** `php -l` verificado con 0 errores en todos los archivos modificados.
- **Git Commits:**
  - `70828b3`: *style(auth): retirar botones de acceso rapido de login para aspecto formal institucional*
  - `0916981`: *fix(deploy): resolver error 500 en Render configurando pgsql por defecto, tabla sessions, bypass de middleware web para SPA y fallbacks en entrypoint*
- **Push:** Desplegado en rama `robert-dev` hacia GitHub.

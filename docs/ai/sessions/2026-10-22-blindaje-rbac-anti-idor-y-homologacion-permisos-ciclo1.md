# Bitácora de Sesión: Blindaje RBAC Global, Scoping Anti-IDOR y Homologación de Permisos del Ciclo 1

**Fecha:** 22 de Octubre de 2026  
**Autor:** Roberto Torrez / Agente Antigravity  
**Casos de Uso Abordados:** CU01 al CU15 (Auditoría Integral y Blindaje de Ciclo 1)  
**Requisitos Funcionales:** RF01 al RF13, Matriz de Roles y Actores (§3 y Especificación Oficial PUDS)  

---

## 1. Resumen Ejecutivo y Diagnóstico
En atención a la auditoría del documento oficial de especificación del sistema ([Google Docs Especificación](https://docs.google.com/document/d/1TvLU6YS-kjZiggrP37u81xSAfYJobEIabnQAsATx9_s/edit?tab=t.0)) y a los incidentes de aislamiento de datos detectados, se realizó una inspección minuciosa de los 13 Casos de Uso del Ciclo 1.

Se identificaron y corrigieron tres fallas críticas de seguridad y autorización:
1. **Ausencia de Middleware RBAC Global a Nivel de Rutas (`routes/api.php`):** Las rutas API estaban agrupadas únicamente bajo `middleware('web')`, que gestiona sesiones pero no exigía autenticación ni validaba los roles permitidos por caso de uso. Peticiones no autenticadas podían alcanzar métodos de controladores donde ciertas validaciones de sesión eran eludibles.
2. **Vulnerabilidad IDOR (Insecure Direct Object Reference) en Reserva de Citas (CU10):** El backend confiaba ciegamente en el campo `id_paciente` enviado en el cuerpo JSON de la petición HTTP. Esto permitía que un usuario con rol `PACIENTE` manipulara el payload en el navegador y programara citas a nombre de terceros.
3. **Desalineación de Permisos en Frontend y Backend (CU06 Médicos y CU08 Horarios):** Según la especificación oficial, la gestión del plantel médico (CU06) y la configuración de horarios/bloqueos institucionales (CU08) son de competencia exclusiva del **Administrador**. El frontend permitía a la Recepcionista acceder a la gestión de médicos y a los Médicos configurar franjas horarias directamente.

---

## 2. Modificaciones en Backend (Laravel 13)

### 2.1 Middleware Global de Control de Acceso por Roles
- Se creó el middleware [`EnsureUserRole.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Http/Middleware/EnsureUserRole.php):
  - Verifica `Auth::check()`. Si no hay sesión, rechaza inmediatamente con `HTTP 401 Unauthorized`.
  - Verifica que el usuario se encuentre en estado `ACTIVO` (RN11). Si está inactivo, invalida la sesión y rechaza con `HTTP 403 Forbidden`.
  - Compara `$user->tipo_usuario` contra la lista de roles permitidos en la ruta (`ADMIN`, `RECEPCIONISTA`, `MEDICO`, `PACIENTE`). Si no coincide, rechaza con `HTTP 403 Forbidden`.
- Se registró el alias `'role'` en el pipeline de la aplicación dentro de [`bootstrap/app.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/bootstrap/app.php).

### 2.2 Reorganización y Protección de Rutas (`backend/routes/api.php`)
Se organizaron los endpoints de los 13 CUs mediante grupos protegidos por roles:
- `/api/users/*`: `middleware(['role:ADMIN'])` (CU02).
- `/api/audit/*`: `middleware(['role:ADMIN'])` (CU03).
- `/api/security/*`: `middleware(['role:ADMIN'])` (Políticas de seguridad).
- `/api/doctors/*` (POST, PUT, PATCH): `middleware(['role:ADMIN'])` (CU06). La consulta (GET) permanece accesible para `ADMIN,RECEPCIONISTA,MEDICO`.
- `/api/specialties` (POST): `middleware(['role:ADMIN'])` (CU07). La consulta de especialidades activas y por edad permanece pública para el agendamiento asistido y autoservicio.
- `/api/schedules/` (Guardado de franjas y alta/baja de bloqueos): `middleware(['role:ADMIN'])` (CU08).
- `/api/patients/*`: `middleware(['role:ADMIN,RECEPCIONISTA,MEDICO'])` (CU04). Bloquea de forma tajante a `PACIENTE`.
- `/api/appointments/doctor-agenda`: `middleware(['role:ADMIN,RECEPCIONISTA,MEDICO'])` (CU14).
- Endpoints de consulta abierta/pública para reserva (CU09 y catálogos): `/api/appointments/availability`, `/api/appointments/booking-form-data` y `/api/specialties`.

### 2.3 Blindaje Anti-IDOR y Scoping en Controladores
- [`AppointmentsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AppointmentsController.php):
  - `store()` (CU10): Si el usuario autenticado tiene rol `PACIENTE`, se recupera su ficha clínica mediante `$user->patient` o `Paciente::where('id_usuario', $user->id_usuario)->first()` y se sobreescribe obligatoriamente `$data['id_paciente'] = $miPaciente->id_paciente`. Cualquier intento de suplantación de ID es neutralizado en el servidor.
  - `show()` (CU10): Se exige sesión activa (`HTTP 401`). Si el rol es `PACIENTE`, se valida que `$cita->id_paciente === $miPaciente->id_paciente` (rechazando con `HTTP 403` si pertenece a otro paciente). Si el rol es `MEDICO`, se valida que `$cita->id_medico === $miMedico->id_medico`.
  - `cancel()` (CU12): Se exige sesión activa (`HTTP 401`). Pacientes solo pueden cancelar citas donde sean los titulares.
  - `doctorAgenda()` (CU14): Bloquea explícitamente a `PACIENTE` con `HTTP 403 Forbidden`.
  - `patientHistory()` (CU15): Si el rol es `PACIENTE`, se valida que `$patientId === $miPaciente->id_paciente`, bloqueando el acceso a historiales ajenos con `HTTP 403`.
- [`PatientsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Controllers/PatientsController.php):
  - `index()` (CU04): Se bloquea explícitamente al rol `PACIENTE` con `HTTP 403 Forbidden` para impedir la filtración masiva del padrón de pacientes.
  - `enableWebAccount()` (CU05): Valida que solo operadores con rol `ADMIN` o `RECEPCIONISTA` puedan crear o activar credenciales web para pacientes.

---

## 3. Modificaciones en Frontend (React + JavaScript)

### 3.1 Corrección de Accesos en Navegación y Vistas
- [`Sidebar.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/shared/components/Sidebar.jsx):
  - Gestión de Médicos (`doctors` / CU06): Restringido estrictamente a `requiredRoles: ['ADMIN']` (removido `RECEPCIONISTA`).
  - Gestión de Horarios y Feriados (`schedules` / CU08): Restringido estrictamente a `requiredRoles: ['ADMIN']` (removido `RECEPCIONISTA` y `MEDICO`).
- [`App.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/App.jsx):
  - Se blindó el renderizado condicional de `DoctorsManager` y `SchedulesManager` exigiendo `role === 'ADMIN'`.

### 3.2 Habilitación de Autoservicio de Citas para el Paciente (CU10)
- [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx):
  - Se habilitó el botón `+ Reservar Mi Cita (CU10)` cuando el usuario tiene rol `PACIENTE`.
- [`AppointmentBookingModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx):
  - Se integró `useAuth()` y `patientProfileService.fetchMyProfile()`.
  - Al abrir el modal con rol `PACIENTE`, el sistema carga automáticamente la ficha del paciente autenticado y bloquea la selección a su propia identidad.
  - Se oculta el buscador de pacientes y se muestra un banner de seguridad con el distintivo *"Tu Ficha Personal (Verificada)"*, impidiendo cualquier confusión o intento de selección de terceros.
  - En el Paso 2 de confirmación, se presenta un banner visual informativo que ratifica que la cita será emitida a nombre del titular.

---

## 4. Pruebas y Verificaciones Realizadas

1. **Pruebas de Sintaxis Backend (PHP Linting):**
   - `php -l backend/app/Http/Middleware/EnsureUserRole.php` → `No syntax errors detected`.
   - `php -l backend/bootstrap/app.php` → `No syntax errors detected`.
   - `php -l backend/routes/api.php` → `No syntax errors detected`.
   - `php -l backend/app/Packages/Appointments/Controllers/AppointmentsController.php` → `No syntax errors detected`.
   - `php -l backend/app/Packages/ClinicalResources/Controllers/PatientsController.php` → `No syntax errors detected`.

2. **Compilación de Producción Frontend:**
   - `npm run build` ejecutado en `frontend/`:
     - 45 módulos transformados.
     - Build exitoso en **529 ms** con cero errores de sintaxis o empaquetado.

3. **Pruebas de Seguridad HTTP contra API (cURL):**
   - `GET /api/users` sin token/sesión → `HTTP 401 Unauthorized` (Esperado: antes devolvía error no capturado o 200 si la sesión era permisiva).
   - `GET /api/audit` sin token/sesión → `HTTP 401 Unauthorized`.
   - `GET /api/patients` sin token/sesión → `HTTP 401 Unauthorized`.
   - `GET /api/appointments/doctor-agenda` sin token/sesión → `HTTP 401 Unauthorized`.
   - `GET /api/appointments/patient-history/1` sin token/sesión → `HTTP 401 Unauthorized`.
   - `GET /api/specialties` (Catálogo público para booking) → `HTTP 200 OK` (Público).
   - `GET /api/appointments/availability?id_medico=1&fecha=2026-10-23` → `HTTP 200 OK` (Público).

---

## 5. Comandos a Ejecutar Tras Hacer Pull
No se requieren nuevas migraciones ni librerías adicionales. Únicamente reiniciar servidores si estaban en ejecución:
```bash
# Backend
php artisan optimize:clear

# Frontend
npm run build # o npm run dev
```

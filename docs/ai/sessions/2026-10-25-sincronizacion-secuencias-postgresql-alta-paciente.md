# Sesión: Sincronización de Secuencias en PostgreSQL y Corrección de Alta de Pacientes (CU04 / RF02)
**Fecha:** 25 de Octubre de 2026  
**Rama:** `robert-dev`  
**Autor:** Antigravity / Roberto  

---

## 1. Solicitud y Problema Reportado
Al intentar registrar un nuevo paciente en el entorno en la nube (Render) desde el modal `PatientFormModal.jsx` (Admisión clínica institucional — CU04 / RF02), el sistema devolvía la alerta `Server Error` (HTTP 500).

---

## 2. Diagnóstico de Causa Raíz
1. **Desincronización de la secuencia `pacientes_id_paciente_seq` en PostgreSQL:**
   - En [`PatientSeeder.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/database/seeders/PatientSeeder.php), los 15 pacientes demostrativos fueron sembrados con claves primarias explícitas (`'id_paciente' => 1`, `'id_paciente' => 2`, ..., `'id_paciente' => 15`).
   - En PostgreSQL, cuando se realiza una inserción directa con un ID explícito, la secuencia interna (`bigserial` / `serial`) **no avanza automáticamente**, manteniéndose en `1`.
   - Al invocar `Patient::create(...)` desde el formulario web, Eloquent solicita el siguiente valor de la secuencia vía `nextval('pacientes_id_paciente_seq')`, el cual devolvió `1`.
   - Al ya existir el registro con `id_paciente = 1` (Mateo Morales Choque), PostgreSQL arrojó de inmediato:
     ```
     SQLSTATE[23505]: Unique violation: 7 ERROR: duplicate key value violates unique constraint "pacientes_pkey"
     DETAIL: Key (id_paciente)=(1) already exists.
     ```
   - Dado que el controlador ejecutaba la operación dentro de un bloque `DB::transaction()` sin captura de excepciones de secuencia, Laravel convirtió el fallo en un genérico `500 | Server Error`.

---

## 3. Solución Implementada

1. **Migración Universal de Sincronización de Secuencias:**
   - Creada [`backend/database/migrations/2026_10_20_000008_sync_all_database_sequences.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/database/migrations/2026_10_20_000008_sync_all_database_sequences.php).
   - Recorre todas las tablas relacionales del sistema (`usuarios`, `roles`, `permisos`, `pacientes`, `contactos_emergencia`, `medicos`, `especialidades`, `disponibilidades`, `bloqueos_horario`, `tipos_cita`, `citas`, `cita_estado_historial`, `bitacora`) y ajusta cada secuencia mediante `SELECT setval(pg_get_serial_sequence(tabla, columna), MAX(columna))`.
   - Se ejecuta automáticamente durante el despliegue con `php artisan migrate --force`.

2. **Sincronización en Seeders:**
   - En [`PatientSeeder.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/database/seeders/PatientSeeder.php), se añadió la llamada a `setval` inmediatamente después del bucle de inserción tanto para `pacientes` como para `contactos_emergencia`.

3. **Mecanismo de Auto-Recuperación en el Controlador:**
   - En [`PatientsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Controllers/PatientsController.php), el método `store()` ahora captura cualquier `QueryException` en PostgreSQL provocada por claves duplicadas rezagadas, repara la secuencia al instante (`SELECT setval(...)`) y reintenta la transacción de forma transparente para el usuario final.

4. **Validación Flexible de Notificaciones:**
   - En [`PatientCreateRequest.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Requests/PatientCreateRequest.php), se ajustó `'notificaciones_activas' => ['nullable', 'boolean']`.

---

## 4. Verificación
- Sintaxis PHP validada con `php -l` (0 errores).
- Pruebas de correlativo `generarNumeroHistoria()` operativas (`HC-0036`).

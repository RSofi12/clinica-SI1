# Bitácora de Sesión: 2026-11-08 — Ordenamiento Alfabético Universal en Desplegables de Nombres

## 1. Solicitud del Usuario / Observación
El usuario observó en el selector de pacientes de **Expediente Clínico y Antecedentes (CU19)** que los nombres aparecían desordenados (en orden inverso de ID: `HC-0111`, `HC-0110`, etc.), solicitando que aparezcan en **orden alfabético (A-Z)** tanto en esta vista como en todos los menús desplegables del sistema que listen nombres de personas o catálogos clínicos.

## 2. Diagnóstico Técnico
1. **Expediente Clínico Digital:** `PatientsController.php` retornaba por defecto `orderBy('id_paciente', 'desc')`, lo que provocaba que en el desplegable de `ExpedienteClinicoView.jsx` los pacientes se listaran desde el último registrado hacia atrás sin criterio alfabético.
2. **Otros Selectores del Sistema:**
   - En `AppointmentBookingModal.jsx` y `AppointmentAvailabilityViewer.jsx`, los médicos y especialidades se filtraban dinámicamente pero no se ordenaban explícitamente con `localeCompare` en español.
   - En `DynamicReportsView.jsx`, el selector de "Médico Responsable" no ordenaba alfabéticamente a los médicos del plantel.
   - En `AppointmentsManager.jsx` y `DoctorAgendaView.jsx`, el filtro de médicos conservaba el orden de inserción de base de datos.
   - En `SchedulesManager.jsx`, la lista de médicos para configurar franjas horarias requería orden alfabético por apellidos y nombres.
   - En `AuditLogViewer.jsx`, los operadores, módulos y acciones se listaban en orden bruto de BD.

## 3. Cambios Implementados

### Backend
1. **`PatientsController.php`:**
   - Incorporado soporte para ordenamiento alfabético mediante parámetro `sort=alfabetico` o `sort=nombre` (`orderBy('apellidos', 'asc')->orderBy('nombres', 'asc')`).
2. **`DynamicReportService.php`:**
   - La consulta de médicos en `getCatalogs()` ahora aplica `->orderBy('apellidos', 'asc')->orderBy('nombres', 'asc')`.
3. **`AppointmentsController.php`:**
   - La consulta de médicos en `getBookingFormData()` ahora ordena con `->orderBy('apellidos')->orderBy('nombres')`.
4. **`AuditController.php`:**
   - En `filtersData()`, los módulos y acciones se ordenan alfabéticamente (`->sort()->values()`) y los usuarios por `username asc`.

### Frontend
1. **`ExpedienteClinicoView.jsx` (CU19):**
   - La llamada a `patientService.fetchPatients` solicita `per_page: 200, sort: 'alfabetico'`.
   - `patientsList` y `filteredPatients` se ordenan estrictamente con `localeCompare('es')` comparando `${apellidos} ${nombres}` (A-Z).
   - El selector muestra los pacientes empezando desde la **A** (`Aguilera`, `Baldivieso`, `Barbery`...) hasta la **Z** (`Zeballos`).
2. **`AppointmentBookingModal.jsx` (CU10):**
   - Catálogos de especialidades ordenados alfabéticamente por `nombre`.
   - Médicos filtrados por especialidad ordenados alfabéticamente A-Z por apellidos y nombres.
   - Búsqueda de pacientes en el modal ordenada alfabéticamente.
3. **`AppointmentAvailabilityViewer.jsx` (CU09):**
   - Especialidades y médicos ordenados alfabéticamente A-Z.
4. **`DoctorAgendaView.jsx` (CU14):**
   - Selector de médicos para visualización de agenda ordenado A-Z por apellidos y nombres.
5. **`AppointmentsManager.jsx` (CU11):**
   - Filtro de médicos ordenado A-Z (`Dr(a). Apellidos, Nombres`).
6. **`SchedulesManager.jsx` (CU08):**
   - Selector de médico para asignación de disponibilidad semanal ordenado A-Z.
7. **`DynamicReportsView.jsx` (CU22):**
   - Selectores de "Médico Responsable" y "Especialidad Médica" ordenados alfabéticamente A-Z.
8. **`AuditLogViewer.jsx` (CU03):**
   - Desplegable de Operadores, Módulos y Acciones ordenados alfabéticamente.

## 4. Verificación y Pruebas
1. `php -l` verificado con **0 errores de sintaxis** en los 4 controladores y servicios backend modificados.
2. `npm --prefix frontend run build`: compilación de Vite completada con éxito en 1.95s con **0 errores**.
3. Servidor HMR en caliente activo en `http://localhost:5173`.

## 5. Comandos a Ejecutar tras Pull
```bash
# Ninguna migración nueva requerida
npm --prefix frontend run build
```

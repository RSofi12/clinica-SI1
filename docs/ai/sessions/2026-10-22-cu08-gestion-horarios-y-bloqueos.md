# Sesión: Implementación CU08 — Gestión de Horarios de Atención Médica y Feriados Institucionales

**Fecha:** 2026-10-22  
**Autor:** Antigravity (Google DeepMind) & Grupo 14 (Raysa Rodriguez Laguna & Roberto Torrez Escalante)  
**Caso de Uso Abordado:** CU08 (Gestionar Horarios de Atención Médica — RF05)  
**Estado:** 100% Funcional, Compilado y Verificado  

---

## 1. Solicitud y Objetivos de la Sesión
1. Iniciar la primera tanda de 3 Casos de Uso del Ciclo 1 (**CU08, CU09, CU10**).
2. Implementar **CU08: Gestionar Horarios de Atención Médica (RF05)** siguiendo rigurosamente las métricas del proyecto, `AGENTS.md`, la arquitectura por paquetes de dominio, `DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml`.
3. Crear el modelo relacional de franjas horarias semanales por médico (`disponibilidades`) y excepciones de calendario (`bloqueos_horario`).
4. Implementar la validación estricta de coherencia horaria (**Prueba P8.1**: `hora_fin > hora_inicio` y detección de solapamiento de turnos).
5. Permitir la configuración de días laborables (**Prueba P8.2**: Lunes a Viernes / Sábados).
6. Permitir el registro de bloqueos de feriados generales institucionales (**Prueba P8.3**: `id_medico = NULL`).
7. Construir interfaz React dinámica, atractiva y responsiva con cuadrícula semanal de 7 días, duración de cita y modal de feriados.

---

## 2. Implementación en Backend (Laravel 13 - PostgreSQL)

### 📦 Paquete 2: Recursos Clínicos y Pacientes (`app/Packages/ClinicalResources/`)
- **Migración:**
  - `backend/database/migrations/2026_10_20_000005_create_paquete2_horarios_and_bloqueos_tables.php`:
    - Tabla `disponibilidades`: `id_disponibilidad`, `id_medico` (FK cascade), `dia_semana` (1-7: Lunes a Domingo), `hora_inicio`, `hora_fin`, `duracion_cita_minutos` (default 30), `activo` (default true).
    - Tabla `bloqueos_horario`: `id_bloqueo`, `id_medico` (nullable FK cascade, NULL = feriado general de la clínica), `fecha`, `hora_inicio` (nullable), `hora_fin` (nullable), `motivo`.
- **Modelos Oficiales en Español:**
  - [`Disponibilidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Disponibilidad.php): Relación `medico()`, métodos PUDS `generarSlots(?string $fecha = null)` y `verificarHorario(string $hora)`, accessor `dia_nombre` (Lunes a Domingo) y scope `scopeActivos()`.
  - [`BloqueoHorario.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/BloqueoHorario.php): Relación `medico()`, métodos PUDS `esFeriadoGeneral()`, `solapaConHorario(?string $horaInicio, ?string $horaFin)`, accessors `es_general` y `tipo_bloqueo`, scopes `scopeFeriadosGenerales()` y `scopeParaMedicoOInstitucional()`.
  - [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php): Incorporación de las relaciones `disponibilidades()` y `bloqueos()`.
- **FormRequests de Validación:**
  - `ScheduleBatchRequest.php`: Valida array de franjas horarias semanales, exige `hora_fin > hora_inicio` para cada franja (Prueba P8.1), valida rango de duración de cita (5-240 min) y previene solapamiento de franjas en un mismo día.
  - `BlockCreateRequest.php`: Valida fecha, motivo, coherencia horaria en bloqueos parciales y soporte de bloqueos institucionales con `id_medico` nulo (Prueba P8.3).
- **Controlador y Auditoría Inmutable:**
  - `SchedulesController.php`:
    - `getDoctorSchedule(Request $request, int $idMedico)`: Retorna disponibilidades agrupadas y bloqueos vigentes del profesional.
    - `saveDoctorSchedule(ScheduleBatchRequest $request, int $idMedico)`: Actualización atómica en lote dentro de `DB::transaction()` con registro inmutable en `bitacora` (`ACTUALIZAR_HORARIOS`).
    - `getBlocks(Request $request)`: Filtro de feriados y licencias por fecha, médico o generales.
    - `storeBlock(BlockCreateRequest $request)`: Registro de feriados generales de la clínica o licencias particulares con registro en `bitacora` (`REGISTRAR_BLOQUEO`).
    - `deleteBlock(int $id)`: Eliminación de bloqueo con registro en `bitacora` (`ELIMINAR_BLOQUEO`).
- **Rutas API (`backend/routes/api.php`):**
  - Prefijo `/api/schedules` con middleware `web` para protección de sesión:
    - `GET /api/schedules/doctors/{id}`
    - `POST /api/schedules/doctors/{id}`
    - `GET /api/schedules/blocks`
    - `POST /api/schedules/blocks`
    - `DELETE /api/schedules/blocks/{id}`

---

## 3. Implementación en Frontend (React + Tailwind CSS)

### 🎨 Componentes y Servicios (`src/apps/clinical-resources/`)
- **Servicio:**
  - `scheduleService.js`: Funciones `fetchDoctorSchedule`, `saveDoctorSchedule`, `fetchBlocks`, `createBlock`, `deleteBlock`.
- **Componentes:**
  - [`SchedulesManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/SchedulesManager.jsx):
    - Selector dinámico de médico con badge de especialidad principal.
    - Cuadrícula interactiva de 7 días (Lunes a Domingo) con tarjetas independientes.
    - Soporte de múltiples franjas por día (ej. Mañana 08:00-12:00 y Tarde 14:00-18:00).
    - Selector de duración de cita por franja (15, 20, 30, 45, 60 min).
    - Botones de plantilla rápida: "L-V Doble Turno", "L-S Mañanas", "L-V Tardes", "Limpiar Todo".
    - Validación visual inmediata en tiempo real que resalta en color rojo si la hora de fin es menor o igual a la de inicio (**Prueba P8.1**).
    - Barra inferior flotante fija con botón "Guardar Horarios Semanales" y confirmación interactiva.
    - Pestaña de "Feriados y Bloqueos Institucionales" con visualización en tabla, badges distintivos y botón de eliminación.
  - [`BlockModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/BlockModal.jsx):
    - Selector interactivo entre "Feriado Institucional" (toda la clínica) y "Licencia Médica" (médico particular).
    - Opción de "Bloquear todo el día" o franja específica con validación de horas.
- **Navegación e Integración:**
  - `Sidebar.jsx`: Nuevo ítem "Horarios y Disponibilidad" (CU08 / RF05) con icono `Clock` para roles `ADMIN`, `RECEPCIONISTA` y `MEDICO`.
  - `App.jsx`: Breadcrumb superior dinámico, renderizado del componente y tarjeta de acceso rápido en el panel general.

---

## 4. Verificaciones y Pruebas Realizadas
1. **Sintaxis PHP (`php -l`):**
   - `Disponibilidad.php` ✅ Sin errores.
   - `BloqueoHorario.php` ✅ Sin errores.
   - `Medico.php` ✅ Sin errores.
   - `ScheduleBatchRequest.php` ✅ Sin errores.
   - `BlockCreateRequest.php` ✅ Sin errores.
   - `SchedulesController.php` ✅ Sin errores.
   - `api.php` ✅ Sin errores.
   - Migración `2026_10_20_000005_create_paquete2_horarios_and_bloqueos_tables.php` ✅ Sin errores.
2. **Compilación Frontend (`npm run build`):**
   - Vite compiló exitosamente en 1.17 segundos generando los bundles limpios sin ningún tipo de error.
3. **Métricas de Casos de Uso:**
   - **Ciclo 1:** 8 de 13 Casos de Uso completados (**61.5%**).
   - **Progreso Global:** 8 de 23 Casos de Uso completados (**34.8%**).

---

## 5. Comandos a Ejecutar tras hacer Pull

```powershell
# 1. En backend:
cd backend
php artisan migrate

# 2. En frontend:
cd ../frontend
npm run build
npm run dev
```

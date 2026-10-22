# CURRENT STATE — CLÍNICA VIDA SALUD

## Estado Actual al 21/10/2026

### 1. Documentación Base y Especificación Aprobada
- ✅ Definición formal de los **23 Casos de Uso** oficiales del sistema en `docs/CU_ESPECIFICACION_SISTEMA.md`.
- ✅ Definición del caso condicional en reserva `CU24-OPC` para ser evaluado en el Ciclo 2.
- ✅ Alcance del proyecto (Sección 1.4) alineado a los 13 requerimientos funcionales del examen (`RF01` al `RF13`) y el perfil del paciente (§3.4).
- ✅ Unificación del actor **Médico** (se descarta duplicar con Especialista).
- ✅ Aprobada la Arquitectura por Paquetes de Dominio: Backend (`app/Packages/`) y Frontend (`src/apps/`) simétricos para los 6 paquetes documentada en `docs/ai/ARCHITECTURE.md`.
- ✅ Guía y directrices de contexto para agentes formalizadas en `AGENTS.md` y `docs/ai/MASTER_AGENT_PROMPT.md` con la regla de oro de guiarse por `DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml`.
- ✅ **Nombres de Modelos y Tablas en Español:** Tablas en español (`medicos`, `especialidades`, `pacientes`, `usuarios`, `bitacora`, etc.) y modelos de dominio primarios en español (`Medico.php`, `Especialidad.php`, `Bitacora.php`) con alias retroactivos para máxima compatibilidad.
- ✅ **Distribución Oficial por Ciclos PUDS:**
  - **Ciclo 1 (Base Operativa y Citas — 13 CUs):** `CU01, CU02, CU03, CU04, CU05, CU06, CU07, CU08, CU09, CU10, CU12, CU14, CU15` (Seguridad, Auditoría inmutable, Padrón/Perfil de Pacientes, Médicos, Especialidades, Horarios, Reserva/Cancelación y Consultas de Citas). Estado: **10 completados de 13 (76.9%)**. Cubre al 100% las 10 pruebas mínimas del examen.
  - **Ciclo 2 (Clínico, Ciclo de Vida Avanzado, Pagos y Analítica — 10 CUs + 1 Opcional):** `CU11, CU13, CU16, CU17, CU18, CU19, CU20, CU21, CU22, CU23` (Reprogramación, asistencia detallada, expediente clínico, triaje, recetas, recordatorios, Stripe y reportes con voz) + `CU24-OPC` condicional en reserva. Estado: **0 completados de 10 (+1)**. Total Global: **10 de 23 (+1) completados (43.5%)**.

### 2. Implementación de CU01 (Autenticar Usuario — RF01) y Políticas de Seguridad
- **Backend (`backend/app/Packages/Security/`):**
  - ✅ Migraciones completas: `2026_10_20_000001_create_paquete1_seguridad_tables.php` y `2026_10_20_000002_add_bloqueado_hasta_and_configuracion_seguridad_table.php`.
  - ✅ Modelos de dominio (`User.php`, `Role.php`, `Permission.php`, `PasswordResetToken.php`, `Bitacora.php`, `SecurityConfig.php`).
  - ✅ Bloqueo temporal configurable por Administrador (intentos fallidos y minutos de castigo) con autodesbloqueo al expirar.
  - ✅ Recuperación de contraseña con código de 6 dígitos (15 min) y `StrongPasswordRule.php`.
- **Frontend (`frontend/src/`):**
  - ✅ `LoginPage.jsx` con switcher para Personal Médico y Portal Paciente, temporizador de bloqueo en vivo.
  - ✅ `ForgotPasswordPage.jsx`, `SecurityPolicyModal.jsx` y `context/AuthContext.jsx`.
  - ✅ Enlace directo y navegación fluida hacia `ForgotPasswordPage` desde cualquier URL o estado inicial (`/dashboard` no autenticado o `/login`).

### 3. Implementación de CU02 (Gestionar Usuarios, Roles y Permisos — RF01)
- **Backend:** `UsersController.php` (CRUD paginado, filtros, baja lógica `toggle-status`, desbloqueo `unlock`) y `RolesController.php`.
- **Frontend:** `UsersManager.jsx` y `UserFormModal.jsx` con checklist de contraseña en tiempo real.

### 4. Implementación de CU03 (Gestionar Bitácora de Auditoría — Inmutable)
- **Backend:** `AuditController.php` con consulta paginada, filtros multicriterio, KPIs y modelo `Bitacora.php`.
- **Frontend:** `AuditLogViewer.jsx` y `AuditDetailModal.jsx`.

### 5. Implementación de CU04 (Gestionar Pacientes — RF02)
- **Backend:** `2026_10_20_000003_create_paquete2_pacientes_tables.php`, modelos `Patient.php` y `EmergencyContact.php` con correlativo `HC-XXXX` y sugerencia de especialidad según edad. `PatientsController.php` con filtros y baja lógica RN11.
- **Frontend:** `PatientsManager.jsx`, `PatientFormModal.jsx` y `PatientDetailModal.jsx`.

### 6. Implementación de CU05 (Gestionar Cuenta y Perfil del Paciente — §3.4)
- **Backend:** `PatientProfileController.php` con autoservicio `/check-ci`, `/activate-account`, `/me`, `/change-password` y `/enable-web-account`.
  - ✅ **Vinculación Resiliente y Automática:** En `me()` y `updateProfile()`, si la ficha no estaba asociada explícitamente, se auto-vincula por correo o número de documento (CI).
  - ✅ **Login con CI (CU01 / CU05):** `AuthController.php` permite iniciar sesión tanto con username, correo electrónico o Carnet de Identidad (CI) del paciente.
  - ✅ **Seeders de Pacientes Vinculados:** `DatabaseSeeder.php` y `PatientSeeder.php` vinculan automáticamente las cuentas demo con sus fichas clínicas.
- **Frontend:** `ActivatePatientModal.jsx`, `PatientWebAccountModal.jsx`, `PatientProfileView.jsx`, layout responsivo con sidebar fija y scroll vertical independiente en el margen derecho.
- **Resiliencia:** `ErrorBoundary.jsx` implementado en `main.jsx` y sincronización bidireccional de rutas (`/login`, `/dashboard`).

### 7. Implementación de CU06 (Gestionar Médicos — RF03) y CU07 (Especialidades — RF04)
- **Backend (`backend/app/Packages/ClinicalResources/`):**
  - ✅ Migración `2026_10_20_000004_create_paquete2_medicos_and_especialidades_tables.php` (`especialidades`, `medicos`, `medico_especialidad`).
  - ✅ Modelos de dominio oficiales en español: [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php) (relaciones N:M, pivot `es_principal`, accessors `nombre_completo` y `especialidad_principal`) y [`Especialidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Especialidad.php) (evaluación etaria `esAptaParaEdad`).
  - ✅ FormRequests: `DoctorCreateRequest.php` y `DoctorUpdateRequest.php`.
  - ✅ Controladores: `DoctorsController.php` (usando exclusivamente `Medico` y `Especialidad`) y `SpecialtiesController.php`.
  - ✅ Seeders: `SpecialtySeeder.php` y `DoctorSeeder.php`.
- **Frontend (`frontend/src/apps/clinical-resources/`):**
  - ✅ Servicios: `doctorService.js` y `specialtyService.js`.
  - ✅ Componentes: `DoctorsManager.jsx`, `DoctorFormModal.jsx`, `DoctorDetailModal.jsx`.
  - ✅ Habilitado en `Sidebar.jsx` para roles `ADMIN` y `RECEPCIONISTA`.

### 8. Implementación de CU08 (Gestionar Horarios de Atención Médica — RF05)
- **Backend (`backend/app/Packages/ClinicalResources/`):**
  - ✅ Migración: `2026_10_20_000005_create_paquete2_horarios_and_bloqueos_tables.php` (tablas `disponibilidades` y `bloqueos_horario` con restricciones DDL).
  - ✅ Modelos en español: [`Disponibilidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Disponibilidad.php) (métodos `generarSlots()`, `verificarHorario()`, accessor `dia_nombre`) y [`BloqueoHorario.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/BloqueoHorario.php) (métodos `esFeriadoGeneral()`, `solapaConHorario()`).
  - ✅ Relaciones añadidas a [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php): `disponibilidades()` y `bloqueos()`.
  - ✅ FormRequests con validación estricta: `ScheduleBatchRequest.php` (valida coherencia `hora_fin > hora_inicio` para prueba P8.1 y solapamientos en el mismo día) y `BlockCreateRequest.php` (feriados generales y licencias con control de horas).
  - ✅ Controlador: `SchedulesController.php` (`getDoctorSchedule`, `saveDoctorSchedule` bajo `DB::transaction()`, `getBlocks`, `storeBlock`, `deleteBlock`), auditando cada operación en la `bitacora` (CU03).
  - ✅ Rutas registradas en `backend/routes/api.php` bajo `/api/schedules/`.
- **Frontend (`frontend/src/apps/clinical-resources/`):**
  - ✅ Servicio: `scheduleService.js`.
  - ✅ Componentes: [`SchedulesManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/SchedulesManager.jsx) y [`BlockModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/BlockModal.jsx).
  - ✅ Integrado en `Sidebar.jsx` (icono `Clock`, roles `ADMIN`, `MEDICO`, `RECEPCIONISTA`) y en el panel general de `App.jsx`.

### 9. Implementación de CU09 (Consultar Disponibilidad de Horarios libres — RF05, RF06)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ Migración: `2026_10_20_000006_create_paquete3_citas_tables.php` (tablas `tipos_cita`, `citas` y `cita_estado_historial` con restricciones de integridad referencial RUP/PUDS).
  - ✅ Modelos de dominio: [`Cita.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/Cita.php), [`TipoCita.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/TipoCita.php) y [`CitaEstadoHistorial.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/CitaEstadoHistorial.php).
  - ✅ Servicio de Dominio: [`AppointmentAvailabilityService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Services/AppointmentAvailabilityService.php) con algoritmo de cálculo dinámico de slots:
    - Validación de médico activo (RN04) y restricción de fechas pasadas (RN06).
    - Descarte automático de feriados institucionales y licencias médicas (Prueba P9.3).
    - Verificación de día laborable del médico según su agenda semanal (RN05).
    - Generación exacta de intervalos según la duración configurada en minutos (Prueba P9.1).
    - Descarte automático de turnos ocupados coincidentes con citas previas activas (Prueba P9.2).
  - ✅ Controlador: [`AvailabilityController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AvailabilityController.php) exponiendo `GET /api/appointments/availability`.
  - ✅ Seeder: `AppointmentTypeSeeder.php` poblando tipos oficiales de cita (`PRIMERA CONSULTA`, `CONTROL`, `RECONSULTA`).
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ Servicio: `appointmentService.js` con método `fetchAvailability()`.
  - ✅ Componente: [`AppointmentAvailabilityViewer.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentAvailabilityViewer.jsx) con filtro en cascada de especialidad y médico, selector de fecha con validación `min={hoy}`, atajos rápidos, KPIs de turnos (totales, libres, ocupados, bloqueados), visualización en cuadrícula con badges de estado y selector de turno listo para el flujo de reserva (CU10).
  - ✅ Integrado en `Sidebar.jsx` (icono `Calendar`, roles `ADMIN`, `RECEPCIONISTA`, `MEDICO`, `PACIENTE`) y renderizado en `App.jsx`.

### 10. Implementación de CU10 (Programar Cita Médica — RF06, RF07)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ **Motor Transaccional Anti-Colisión:** `AppointmentBookingService.php` ejecuta toda la reserva dentro de `DB::transaction()` con bloqueo pesimista `lockForUpdate()` en el médico y verificación de solapamientos sobre citas activas (`lockForUpdate()`), garantizando matemáticamente la **Prueba #4** del examen (si dos recepcionistas o pacientes intentan reservar el mismo turno simultáneamente, uno gana y el otro recibe HTTP 409 con mensaje explicativo).
  - ✅ **Correlativo Atómico Único:** Generación secuencial inmutable con prefijo `CM-XXXX` (ej. `CM-0001`, `CM-0002`).
  - ✅ **Validación de Compatibilidad Etaria (RF04 / Prueba P10.4):** Verifica que la edad del paciente encaje en los rangos de la especialidad (`Pediatría` < 15 años, `Medicina General` 15 a 59 años, `Geriatría` ≥ 60 años).
  - ✅ **Validación de Franjas y Horarios (RF05 / Prueba #5):** Confirma que el intervalo pertenezca al horario regular del médico y no caiga en feriado general ni licencia médica (HTTP 422).
  - ✅ **FormRequest Tipado:** `AppointmentBookRequest.php` validando existencia y coherencia de `id_paciente`, `id_medico`, `id_especialidad`, `id_tipo_cita`, `fecha`, `hora_inicio`, `hora_fin`, `modalidad`.
  - ✅ **Trazabilidad y Auditoría:** Creación del registro inicial en `cita_estado_historial` y evento inmutable en `bitacora` (CU03).
  - ✅ **Controlador y Endpoints:** `AppointmentsController.php` con métodos `store()`, `index()` con filtros avanzados (`q`, `fecha`, `estado`, `medico_id`, `paciente_id`), control RBAC (pacientes solo ven sus citas, médicos ven su agenda), `show()`, y catálogo `booking-form-data`.
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ **Servicio de Citas:** `appointmentService.js` con métodos `fetchBookingFormData()`, `fetchAppointments()`, `bookAppointment()`, `fetchAppointmentById()`.
  - ✅ **Modal Asistido Multipasos:** [`AppointmentBookingModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx) con wizard en 5 pasos:
    1. Selección de Paciente (con buscador en vivo por CI/nombre).
    2. Especialidad y Médico (con filtrado cruzado dinámico).
    3. Selección de Fecha y Slot (consulta en vivo al motor de CU09).
    4. Resumen y Modalidad (Presencial / Teleconsulta, motivo de consulta).
    5. Paso de Éxito con Emisión de Ticket Oficial imprimible con código `CM-XXXX`.
  - ✅ **Panel Gestor Unificado:** [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx) que integra dos pestañas: *Citas Programadas* (tabla paginada con filtros, badges de estado y visualización de tickets) y *Consultar Disponibilidad* (integrando a [`AppointmentAvailabilityViewer.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentAvailabilityViewer.jsx)).
  - ✅ **Integración en Sistema:** Conectado a la pestaña `appointments` en `Sidebar.jsx` y `App.jsx`.

### 11. Siguiente Bloque Inmediato de Trabajo (Cierre del Ciclo 1)
- Lote final de 3 Casos de Uso del Ciclo 1:
  - **`CU12`**: Cancelar Cita Médica (RF09 / Prueba #6).
  - **`CU14`**: Consultar Agenda de Citas Médicas por Médico y Fecha (RF11 / Prueba #8).
  - **`CU15`**: Consultar Historial de Citas Médicas del Paciente (RF12 / Prueba #7).
- Con este lote final, el **Ciclo 1 alcanzará el 100% de ejecución (13 de 13 Casos de Uso)** y quedarán cubiertas al 100% las 10 pruebas mínimas del examen.

# CURRENT STATE — CLÍNICA VIDA SALUD

## Estado Actual al 21/10/2026

### 1. Documentación Base y Especificación Aprobada
- ✅ Definición formal de los **26 Casos de Uso** oficiales del sistema en `docs/CU_ESPECIFICACION_SISTEMA.md`.
- ✅ Definición del caso condicional en reserva `CU27-OPC` para ser evaluado en el Ciclo 2.
- ✅ Alcance del proyecto (Sección 1.4) alineado a los 13 requerimientos funcionales del examen (`RF01` al `RF13`) y el perfil del paciente (§3.4).
- ✅ Unificación del actor **Médico** (se descarta duplicar con Especialista).
- ✅ Aprobada la Arquitectura por Paquetes de Dominio: Backend (`app/Packages/`) y Frontend (`src/apps/`) simétricos para los 6 paquetes documentada en `docs/ARCHITECTURE.md`.
- ✅ Guía y directrices de contexto para agentes formalizadas en `AGENTS.md` y `docs/ai/MASTER_AGENT_PROMPT.md` con la regla de oro de guiarse por `DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml`.
- ✅ **Nombres de Modelos y Tablas en Español:** Tablas en español (`medicos`, `especialidades`, `pacientes`, `usuarios`, `bitacora`, etc.) y modelos de dominio primarios en español (`Medico.php`, `Especialidad.php`, `Bitacora.php`) con alias retroactivos para máxima compatibilidad.
- ✅ **Distribución Oficial por Ciclos PUDS:**
  - **Ciclo 1 (Base Operativa y Citas — 13 CUs):** `CU01, CU02, CU03, CU04, CU05, CU06, CU07, CU08, CU09, CU10, CU12, CU14, CU15` (Seguridad, Auditoría inmutable, Padrón/Perfil de Pacientes, Médicos, Especialidades, Horarios, Reserva, Cancelación, Agenda Médica Diaria e Historial de Citas). Estado: **13 completados de 13 (100% de ejecución)**. Cubre al 100% las 10 pruebas mínimas del examen.
  - **Ciclo 2 (Clínico, Ciclo de Vida Avanzado, Pagos y Analítica — 13 CUs + 2 Reservas):** `CU11, CU13, CU16, CU17, CU18, CU19, CU20, CU21, CU22, CU23, CU24, CU25, CU26` (Reprogramación, asistencia detallada, expediente clínico, triaje, recetas, recordatorios, Stripe, reportes dinámicos, reportes con voz, dashboard KPIs, órdenes de exámenes y documentos adjuntos) + reservas `CU27-RES` (Exportar PDF) y `CU28-OPC` (IA Diagnóstica). Estado: **13 completados de 13 (100% de ejecución)**. Total Global: **26 de 26 Casos de Uso oficiales completados (100%)**.

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
- **Frontend:** `UsersManager.jsx` y `UserFormModal.jsx` con checklist de contraseña en tiempo real, barra inferior interactiva de paginación con navegación entre páginas (Anterior / Siguiente con `ChevronLeft` / `ChevronRight`, selector de 10/15/25/50 registros por página, botones numéricos de página con elipsis y contador total sincronizado de operadores registrados).

### 4. Implementación de CU03 (Gestionar Bitácora de Auditoría — Inmutable)
- **Backend:** `AuditController.php` con consulta paginada, filtros multicriterio, KPIs y modelo `Bitacora.php`.
- **Frontend:** `AuditLogViewer.jsx` y `AuditDetailModal.jsx`.

### 5. Implementación de CU04 (Gestionar Pacientes — RF02)
- **Backend:** `2026_10_20_000003_create_paquete2_pacientes_tables.php`, modelos `Patient.php` y `EmergencyContact.php` con correlativo `HC-XXXX` y sugerencia de especialidad según edad. `PatientsController.php` con filtros y baja lógica RN11.
- **Frontend:** `PatientsManager.jsx`, `PatientFormModal.jsx` y `PatientDetailModal.jsx` (acciones de registro, edición y baja restringidas a `ADMIN` y `RECEPCIONISTA`; rol `MEDICO` dispone de modo de solo lectura clínica `PatientDetailModal.jsx`).

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
  - ✅ Habilitado en `Sidebar.jsx` y `App.jsx` exclusivamente para rol `ADMIN` (según especificación PUDS de CU06).

### 8. Implementación de CU08 (Gestionar Horarios de Atención Médica — RF05)
- **Backend (`backend/app/Packages/ClinicalResources/`):**
  - ✅ Migración: `2026_10_20_000005_create_paquete2_horarios_and_bloqueos_tables.php` (tablas `disponibilidades` y `bloqueos_horario` con restricciones DDL).
  - ✅ Modelos en español: [`Disponibilidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Disponibilidad.php) (métodos `generarSlots()`, `verificarHorario()`, accessor `dia_nombre`) y [`BloqueoHorario.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/BloqueoHorario.php) (métodos `esFeriadoGeneral()`, `solapaConHorario()`).
  - ✅ Relaciones añadidas a [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php): `disponibilidades()` y `bloqueos()`.
  - ✅ FormRequests con validación estricta: `ScheduleBatchRequest.php` (valida coherencia `hora_fin > hora_inicio` para prueba P8.1 y solapamientos en el mismo día) y `BlockCreateRequest.php` (feriados generales y licencias con control de horas).
  - ✅ Controlador: `SchedulesController.php` (`getDoctorSchedule`, `saveDoctorSchedule` bajo `DB::transaction()`, `getBlocks`, `storeBlock`, `deleteBlock`), auditando cada operación en la `bitacora` (CU03).
  - ✅ Rutas registradas en `backend/routes/api.php` bajo `/api/schedules/` con protección `role:ADMIN`.
- **Frontend (`frontend/src/apps/clinical-resources/`):**
  - ✅ Servicio: `scheduleService.js`.
  - ✅ Componentes: [`SchedulesManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/SchedulesManager.jsx) y [`BlockModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/BlockModal.jsx).
  - ✅ Integrado en `Sidebar.jsx` (icono `Clock`) y en el panel general de `App.jsx` exclusivamente para rol `ADMIN`.

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
  - ✅ Componente: [`AppointmentAvailabilityViewer.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentAvailabilityViewer.jsx).
  - ✅ Integrado en `Sidebar.jsx` y renderizado en `App.jsx`.

### 10. Implementación de CU10 (Programar Cita Médica — RF06, RF07)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ **Motor Transaccional Anti-Colisión:** `AppointmentBookingService.php` ejecuta toda la reserva dentro de `DB::transaction()` con bloqueo pesimista `lockForUpdate()` en el médico y verificación de solapamientos sobre citas activas (`lockForUpdate()`), garantizando la **Prueba #4** del examen.
  - ✅ **Correlativo Atómico Único:** Generación secuencial inmutable con prefijo `CM-XXXX` (ej. `CM-0001`).
  - ✅ **Validación de Compatibilidad Etaria (RF04 / Prueba P10.4):** Verifica que la edad del paciente encaje en los rangos de la especialidad.
  - ✅ **Validación de Franjas y Horarios (RF05 / Prueba #5):** Confirma que el intervalo pertenezca al horario regular del médico y no caiga en feriado general ni licencia médica (HTTP 422).
  - ✅ **FormRequest Tipado:** `AppointmentBookRequest.php`.
  - ✅ **Trazabilidad y Auditoría:** Creación del registro inicial en `cita_estado_historial` y evento inmutable en `bitacora` (CU03).
  - ✅ **Controlador y Endpoints:** `AppointmentsController.php` con métodos `store()`, `index()`, `show()`, y catálogo `booking-form-data`.
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ **Servicio de Citas:** `appointmentService.js`.
  - ✅ **Modal Asistido Multipasos:** [`AppointmentBookingModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx) con wizard en 5 pasos.
  - ✅ **Panel Gestor Unificado:** [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx) y [`AppointmentAvailabilityViewer.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentAvailabilityViewer.jsx) (botón de agendar citas restringido a Recepcionista y Paciente; rol `MEDICO` enfocado en consulta de disponibilidad y atención de su agenda médica diaria; cabecera responsiva `xl:flex-row` anti-solapamiento en resoluciones intermedias).

### 11. Implementación de CU12 (Cancelar Cita Médica — RF09 / Prueba #6)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ `AppointmentCancelRequest.php`: Validación estricta de `motivo_cancelacion` (requerido, min: 5, max: 500).
  - ✅ `AppointmentsController::cancel()`:
    - Validación de existencia y de estados terminales (no se permite cancelar citas `ATENDIDA` o ya `CANCELADA`).
    - Control de acceso RBAC: paciente solo cancela sus propias citas; médico cancela sus citas agendadas; recepcionista y admin cancelan cualquier cita.
    - Transacción atómica llamando a `$cita->cancelar($motivo, $idUsuario)`: guarda motivo, fecha de cancelación y usuario responsable.
    - Liberación instantánea del cupo horario: al pasar a `CANCELADA`, `AppointmentAvailabilityService` libera inmediatamente el slot horario para nuevas reservas (Prueba #6).
    - Registro en `cita_estado_historial` y en `bitacora` inmutable (CU03).
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ Servicio: `appointmentService.cancelAppointment(id, motivo)`.
  - ✅ Modal [`AppointmentCancelModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentCancelModal.jsx) con contador de caracteres, resumen de la cita y advertencia de liberación de turno.
  - ✅ Botón "Cancelar" condicional en tablas y listados de `AppointmentsManager.jsx`, `DoctorAgendaView.jsx` y `PatientAppointmentHistoryModal.jsx`.

### 12. Implementación de CU14 (Consultar Agenda Médica Diaria — RF11 / Prueba #8)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ `AppointmentsController::doctorAgenda()`:
    - Filtro por médico y fecha (`fecha` en formato `YYYY-MM-DD`).
    - Scoping RBAC: Médicos consultan exclusivamente su propia agenda; recepcionistas y admin seleccionan cualquier médico. Bloqueo estricto a `PACIENTE` con HTTP 403.
    - 4 KPIs dinámicos calculados en tiempo real (citas programadas, por atender, atendidas, canceladas).
    - Resolución de franjas horarias configuradas (`Disponibilidad`) para el día de la semana correspondiente.
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ Servicio: `appointmentService.fetchDoctorAgenda()`.
  - ✅ Vista [`DoctorAgendaView.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/DoctorAgendaView.jsx) integrada como pestaña principal en `AppointmentsManager.jsx`:
    - Selector de médico (para Admin/Recepción) o vista personal automática (para Médicos).
    - Navegación de fecha con botones de día anterior/siguiente y botón de atajo "Hoy".
    - Tarjeta resumen con franja semanal de atención médica.
    - 4 KPIs de la jornada.
    - Cronograma cronológico de citas del día con visualización de paciente, motivo, estado y acciones rápidas (Ticket oficial, Cancelar).

### 13. Implementación de CU15 (Consultar Historial Cronológico de Paciente — RF12 / Prueba #7)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ `AppointmentsController::patientHistory()`:
    - Scoping RBAC: Pacientes solo pueden ver su propio historial en modo solo lectura; personal médico y administrativo pueden consultar a cualquier paciente.
    - Métricas históricas completas (total de citas, atendidas, canceladas, pendientes, tasa de asistencia % y fechas primera/última).
    - Lista cronológica descendente completa sin eliminación física (RN10 / RN11).
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ Servicio: `appointmentService.fetchPatientHistory()`.
  - ✅ Modal [`PatientAppointmentHistoryModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/PatientAppointmentHistoryModal.jsx):
    - Ficha de datos y contacto del paciente.
    - 4 métricas globales de atención.
    - Filtro por estado y visualización cronológica con scroll independiente.
    - Botón "Ver Historial" integrado en la columna de paciente de `AppointmentsManager.jsx`.

---

### 14. Blindaje Integral de Seguridad, Middleware RBAC Global y Anti-IDOR (22/10/2026)
- **Middleware Global `EnsureUserRole`:**
  - Registrado en `bootstrap/app.php` bajo el alias `'role'`.
  - Valida en capa HTTP `Auth::check()`, estado de usuario `ACTIVO` y pertenencia a roles autorizados (`role:ADMIN`, etc.), devolviendo `HTTP 401 Unauthorized` o `HTTP 403 Forbidden`.
  - Protege de forma perimetral todas las rutas de `api.php`.
- **Protección Anti-IDOR en CU10 (Programar Cita):**
  - En `AppointmentsController::store()`, cuando el usuario es `PACIENTE`, se recupera forzosamente su propio `id_paciente` en el servidor, sobreescribiendo el cuerpo de la petición y anulando cualquier intento de manipulación o reserva para terceros.
- **Protección de Consulta y Cancelación de Citas:**
  - `AppointmentsController::show()` y `cancel()` exigen autenticación y restringen al paciente exclusivamente a sus propios registros.
  - `PatientsController::index()` bloquea al paciente con `HTTP 403` para salvaguardar la privacidad de la base de datos de pacientes.
- **Alineación de Permisos en Frontend y Wizard de Reserva:**
  - Restricción de `DoctorsManager` (CU06) y `SchedulesManager` (CU08) exclusivamente a `ADMIN`.
  - `AppointmentBookingModal.jsx` precarga y bloquea la identidad del paciente cuando inicia el flujo un paciente autenticado, mostrando el distintivo *"Tu Ficha Personal (Verificada)"* y ocultando selectores innecesarios.

---

### 15. Homologación Técnica y Arquitectónica con Sección 7.1 del Documento de Especificación (23/10/2026)
- **Cliente HTTP Frontend (Axios):**
  - Adopción de `axios` en `frontend/src/services/api.js` exportando `apiClient` con interceptores para inyección automática de cabeceras `Authorization: Bearer <token>`, `withCredentials: true` para cookies y manejo unificado de errores. Helper `apiFetch` envuelto para compatibilidad 100% retroactiva.
- **Autenticación Dual / Bearer Tokens con Laravel Sanctum v4:**
  - Instalación de `laravel/sanctum` v4 con migración de `personal_access_tokens`.
  - Emisión de token Sanctum (`plainTextToken`) en `AuthController::login()` devuelto en clave `'token'`.
  - Soporte híbrido en middleware `EnsureUserRole`: autentica tanto por sesión web de cookies (`Auth::user()`) como por Bearer Token (`$request->user('sanctum')`).
  - Almacenamiento y limpieza automática de `token` en `localStorage` vía `AuthContext.jsx`.
- **Homologación de Atributo `motivo_breve`:**
  - Modelo `Cita.php` incluye `motivo_breve` en `$fillable`, `$appends` y accessors/mutators transparentes vinculados a la columna `motivo_consulta`.
  - `AppointmentBookRequest` y `AppointmentBookingService` aceptan y procesan indistintamente `motivo_breve` o `motivo_consulta`.
- **Estandarización del Estado `INASISTENCIA`:**
  - Alineación con `DDL_Database_Clinica_LaCruz.sql` y el Informe Oficial: el quinteto oficial de estados de cita es `PROGRAMADA`, `CONFIRMADA`, `ATENDIDA`, `CANCELADA`, `INASISTENCIA`.
  - Homologación en `Cita.php`, `AppointmentsController.php` (métricas de agenda e historial), `ScheduleAndAppointmentSeeder.php` (demo CM-0010) y componentes frontend (`AppointmentsManager`, `DoctorAgendaView`, `PatientAppointmentHistoryModal`).
- **Configuración SMTP Mailtrap Sandbox:**
  - Documentación de credenciales y host `sandbox.smtp.mailtrap.io:2525` en `backend/.env.example` y `backend/.env`.

---

### 17. Aislamiento Estricto de Roles y Casos de Uso por Actor (23/10/2026)
- **Cumplimiento Riguroso de la Matriz de Casos de Uso Oficial (PUDS):**
  - **Médico (`MEDICO`):**
    - Módulo exclusivo: *Mi Agenda Médica (CU14)* e *Historial de Pacientes (CU15)*.
    - Se eliminó del menú la pestaña general de admisiones/pacientes (CU04) y la vista general de agendamiento/turnos (CU09/CU10).
    - Desactivada la acción de cancelación de cita (CU12) para médicos (privativa de Recepcionista y Paciente).
    - Tarjetas visibles en Dashboard: Únicamente `CU01` (Autenticación), `CU14` (Mi Agenda Médica) y `CU15` (Historial Clínico).
  - **Recepcionista (`RECEPCIONISTA`):**
    - Menú y módulos autorizados: *Panel General*, *Pacientes y Fichas (CU04)*, *Habilitación de Cuentas Web en Ventanilla (CU05)* y *Disponibilidad y Citas (CU09, CU10, CU12, CU14, CU15)*.
    - Se agregó el botón interactivo de acceso web (`Globe`) en la tabla de pacientes para habilitar o resetear credenciales de autoservicio (CU05 §3.4).
    - Tarjetas visibles en Dashboard: `CU01`, `CU04`, `CU05`, `CU09/CU10/CU12`, `CU14`, `CU15`.
    - No visualiza ni accede a: Usuarios/Roles (CU02), Bitácora (CU03), Médicos (CU06), Horarios (CU08).
  - **Paciente (`PACIENTE`):**
    - Módulos autorizados: *Mi Perfil de Paciente (CU05)* y *Mis Citas Médicas (CU09, CU10, CU12, CU15)*.
    - Botón *Mi Historial (CU15)* adaptado para cargar la ficha propia vía `patientProfileService.fetchMyProfile()`, funcionando de inmediato incluso para pacientes nuevos sin citas previas.
    - Tarjetas visibles en Dashboard: Únicamente `CU01`, `CU05`, `CU09/CU10` y `CU15`.
    - No visualiza agendas médicas (CU14), padrón general (CU04), bitácora (CU03) ni usuarios (CU02).
  - **Administrador (`ADMIN`):**
    - Suite completa de control y supervisión (`CU01-CU04, CU06-CU08, CU09-CU15`).

---

### 18. Estado de Avance y Próximos Pasos (Arranque del Ciclo 2)
- 🎯 **Hito Histórico Alcanzado:** **Ciclo 1 al 100% de ejecución (13 de 13 Casos de Uso completados, blindados con RBAC estricto, 0 fugas de UI entre actores y homologados con la Sección 7.1)**.
- 🧪 **10 Pruebas Mínimas del Examen Oficial Superadas (10 de 10 — 100%)**:
  1. Registrar paciente nuevo (CU04 / RF02) ✅
  2. CI duplicado rechazado con HTTP 422 (CU04 / RF02) ✅
  3. Programar cita con correlativo `CM-XXXX` (CU10 / RF06) ✅
  4. Bloqueo transaccional anti-colisión `lockForUpdate` HTTP 409 (CU10 / RF07) ✅
  5. Cita fuera de horario rechazada HTTP 422 (CU10 / RF05) ✅
  6. Cancelar cita con motivo obligatorio y liberación de cupo (CU12 / RF09) ✅
  7. Consultar historial de citas de paciente sin pérdida (CU15 / RF12) ✅
  8. Agenda médica diaria por médico y fecha (CU14 / RF11) ✅
  9. Bloqueo de acceso sin autenticación HTTP 401 (CU01 / RF01) ✅
  10. Validación de datos inválidos HTTP 422 tipados (Transversal) ✅
- 🔜 **Próximo Paso Inmediato:** Planificar y dar inicio al **Ciclo 2: Clínico, Pagos y Analítica** (`CU11` Reprogramar Cita Médica, `CU13` Registro de Asistencia y cambio de estado, `CU16-CU19` Expediente Clínico Digital, `CU20-CU23` Notificaciones, Pagos y Reportes).

---

### 19. Dockerización del Monorepo y Preparación para Despliegue en la Nube (05/11/2026)
- ✅ **Arquitectura Multi-Contenedor (`docker-compose.yml`):**
  - **`clinica_backend` (`docker/php/Dockerfile`):** Imagen basada en `php:8.3-fpm-alpine` con extensiones oficiales (`pdo_pgsql`, `pgsql`, `mbstring`, `zip`, `bcmath`, `intl`, `opcache`) y Composer 2 integrado.
  - **`clinica_nginx` (`docker/nginx/default.conf`):** Servidor web proxy inverso con timeouts extendidos (300s) y reescritura FastCGI hacia `backend:9000`.
  - **`clinica_postgres` (`postgres:16-alpine`):** Base de datos relacional con volumen persistente `pgdata`.
  - **`clinica_frontend` (`docker/frontend/Dockerfile`):** Imagen basada en `node:22-alpine` para servir el SPA de React + Vite en desarrollo y producción.
- ✅ **Compatibilidad Híbrida Zero-Touch:**
  - El orquestador inyecta `DB_HOST=postgres` en el contenedor backend, permitiendo que el archivo `backend/.env` local (`DB_HOST=127.0.0.1`) funcione tanto de manera nativa en Windows como en contenedores sin necesidad de alterar variables.
- ✅ **Documentación Operativa:**
  - `README.md` actualizado con comandos de arranque (`docker compose up -d --build`), migraciones y seeders dentro del contenedor.


---

### 20. Implementación Integral de CU11 (Reprogramar Cita Médica — RF08) (05/11/2026)
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ Migración `2026_11_05_000001_add_reprogramacion_fields_to_citas_table.php`: campos `reprogramada_en` (timestamp) y `motivo_reprogramacion` (varchar 255) en tabla `citas`. Sincronizado en `DDL_Database_Clinica_LaCruz.sql`.
  - ✅ Modelo `Cita.php`: `$fillable` y `$casts` actualizados, métodos `puedeReprogramarse(): bool` (solo en estado PROGRAMADA o CONFIRMADA) y `reprogramar($nuevaFechaHora, $nuevaFechaHoraFin, $duracion, $motivo, $idUsuario)`.
  - ✅ FormRequest `AppointmentRescheduleRequest.php`: validación estricta de fecha futura (`YYYY-MM-DD`, `after_or_equal:today`), hora de inicio (`H:i`), duración (15-120 min) y motivo obligatorio (min: 5, max: 500).
  - ✅ Servicio Transaccional `AppointmentRescheduleService.php`:
    - `DB::transaction()` y `lockForUpdate()` sobre la cita.
    - Validación de estado activo del médico (RN04) y fecha futura (RN06).
    - Verificación de agenda semanal (RN05) y bloqueos/feriados en `bloqueos_horario`.
    - Algoritmo anti-colisión con exclusión de la propia cita (`id_cita != $cita->id_cita`) evitando auto-colisiones (RF07).
    - Auditoría inmutable en `Bitacora.php` (CU03) y registro en `cita_estado_historial`.
  - ✅ Controlador `AppointmentsController::reschedule()` y ruta `PATCH /api/appointments/{id}/reschedule` con RBAC para `ADMIN`, `RECEPCIONISTA` y `PACIENTE` (médico bloqueado según PUDS).
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ Servicio `appointmentService.js`: método `rescheduleAppointment(id, data)` (PATCH).
  - ✅ Componente `AppointmentRescheduleModal.jsx`:
    - Estilo guiado por `/frontend-design` con paleta institucional (#004d5a, #00687a, #70cbff, #e8f7f9), micro-transiciones fluidas y fondo difuminado `backdrop-blur-xs`.
    - Visualización del resumen de la cita (paciente, médico, especialidad).
    - Tarjeta comparativa visual del cambio de turno: **Horario Actual ➔ Nuevo Horario Elegido**.
    - Selector dinámico de fecha con consulta en tiempo real al motor de disponibilidad (`CU09`).
    - Grilla interactiva de turnos libres con selector verde esmeralda y feedback de ocupación/bloqueos.
    - Textarea con contador dinámico y validación reactiva de motivo justificado (mínimo 5 caracteres).
  - ✅ Integración en `AppointmentsManager.jsx`:
    - Botón de acción 'Reprogramar' para citas activas (`PROGRAMADA`, `CONFIRMADA`) visible para roles autorizados.
    - Indicador visual tipo pill `Reprogramada` en listados de citas con tooltip de motivo y fecha.
  - ✅ Integración en `PatientAppointmentHistoryModal.jsx`:
    - Acción de reprogramación disponible desde la ficha de historial del paciente.
    - Bloque de trazabilidad mostrando fecha y motivo de reprogramaciones históricas.
  - ✅ Compilación limpia con Vite (`npm run build` en 18.28s, 0 errores).
- **Pruebas de Caja Negra (`docs/informes/PRUEBAS_CAJA_NEGRA.md`):**
  - 11 casos de prueba exhaustivos documentados (`CN-CU11-01` a `CN-CU11-11`) cubriendo reprogramación exitosa, colisiones (HTTP 409), motivos cortos (HTTP 422), fechas pasadas, citas atendidas/canceladas y protección IDOR.


---

### 21. Implementación Integral de CU23 (Generar Reporte Personalizado por Voz con IA — RF13 / Extra) (05/11/2026)
- **Backend (`backend/app/Packages/Analytics/`):**
  - ✅ Tabla PostgreSQL `reportes_ia` migrada con campos `id_reporte`, `id_usuario`, `comando_texto`, `filtros_json` (JSONB) y `tipo_reporte`.
  - ✅ Modelo `ReporteIa.php` con cast `array` a `filtros_json`, relaciones con `User` y scope de usuario.
  - ✅ FormRequest `ProcessVoiceReportRequest.php` para validación y sanitización estricta de la consulta dictada.
  - ✅ Motor Híbrido de NLP `VoiceCommandParserService.php`:
    - Procesamiento determinístico en PHP con latencia 0 ms, 100% offline y costo $0.
    - Detección precisa de intenciones y estados de cita (`CANCELADA`, `ATENDIDA`, `PROGRAMADA`, `INASISTENCIA`).
    - Detección de rangos temporales dinámicos con Carbon (*"hoy"*, *"este mes"*, *"semana pasada"*, *"este año"*, *"octubre"*).
    - Mapeo de entidades contra catálogos relacionales de médicos y especialidades con normalización fonética y sin diacríticos.
    - Soporte opcional y desacoplado para enriquecimiento vía Gemini API (`GEMINI_API_KEY`) con fallback transparente.
  - ✅ Servicio Transaccional `VoiceReportService.php`:
    - Construcción de consultas dinámicas en PostgreSQL sobre `citas` y `pacientes`.
    - Cálculo de métricas agregadas (total de citas, atendidas, canceladas, tasa de asistencia porcentual).
    - Persistencia en tabla `reportes_ia` y auditoría inmutable en `Bitacora.php` (CU03).
    - Scoping automático para rol `MEDICO` (restringido a sus propios pacientes) y control global para `ADMIN`.
  - ✅ Controlador `VoiceReportController.php` y rutas `/api/analytics/voice-report`, `/voice-history` y `/voice-stats`.
  - ✅ Prueba de Caja Negra Automatizada `VoiceReportTest.php` validando parsing de estados y rangos temporales.
- **Frontend (`frontend/src/apps/analytics/`):**
  - ✅ Servicio `analyticsService.js`: consumo de endpoints y exportador a CSV estándar del navegador.
  - ✅ Componente `VoiceReportAssistant.jsx`:
    - Diseño adaptado a la identidad visual de la clínica con paleta `#004d5a`, `#00687a`, `#008b9e` y directrices `/design-taste-frontend` con micro-interacciones suaves (`hover:-translate-y-0.5`, transiciones fluidas de 300ms sin saltos abruptos).
    - Micrófono interactivo con Web Speech API optimizado para escritorio y celular:
      - Solicitud previa y explícita de hardware vía `navigator.mediaDevices.getUserMedia({ audio: true })` para activar los permisos nativos del navegador.
      - Modo `continuous = true` con watchdog de silencio (3.5s) que previene el apagado prematuro a los 2 segundos por pausas breves al hablar.
      - Idioma estandarizado a `es-419` (Español Latinoamericano universal) con alta compatibilidad en motores de voz sin fallos de red.
      - Detección de orígenes seguros (`isSecureContext`) para orientar a usuarios móviles si acceden por IP local.
    - Transcripción en tiempo real con campo editable y fallback manual por teclado ante navegadores sin soporte o permisos denegados.
    - Chips con consultas de ejemplo dictables (*"Citas canceladas de este mes"*, *"Atenciones de hoy"*, etc.).
    - Cajón desplegable de consultas recientes para reejecución en 1 clic.
    - 4 Tarjetas KPI interactivas (Total, Atendidas, Canceladas, Tasa de Asistencia).
    - Tabla detallada con badges estilizados según estado y buscador dinámico integrado.
    - **Trío de Exportadores Oficiales:**
      - 📄 **Exportar PDF:** Documento institucional apaisado con membrete del Centro Médico La Cruz, tabla formateada e impresión nativa del navegador.
      - 📊 **Exportar Excel (`.xls`):** Hoja de cálculo con encabezados, KPIs y tabla de registros formateada con estilos nativos.
      - 📑 **Exportar CSV:** Archivo estándar UTF-8 con BOM para visualización universal.
  - ✅ Integración en `Sidebar.jsx` (grupo "Reportes y Analítica (P6)") y renderizado condicional en `App.jsx`.
  - ✅ Compilación de producción exitosa con Vite (`npm run build` en 52.15s, 0 errores).

---

### 22. Implementación de Backend para CU16 (Registrar Consulta Médica y Triaje) (06/11/2026)
- **Backend (`backend/app/Packages/MedicalRecords/`):**
  - ✅ Modelo `ConsultaMedica.php`: Accessors calculados para IMC y clasificación clínica según la OMS, mapeo de relaciones con `Cita`, `HistoriaClinica`, `Medico` y `Diagnostico`.
  - ✅ Modelo `Patient.php` y `User.php`: Relaciones agregadas para vincular directamente la ficha médica y cuenta de usuario con el expediente.
  - ✅ FormRequest `ConsultaCreateRequest.php`: Validaciones biológicas rigurosas para constantes vitales (peso, talla, temperatura, pulso, presión) y diagnósticos (`PRESUNTIVO`/`DEFINITIVO`).
  - ✅ Servicio Transaccional `ConsultaMedicaService.php`:
    - Operación dentro de `DB::transaction()` con bloqueo pesimista `lockForUpdate()`.
    - Validación Anti-IDOR para verificar que el médico autenticado es el titular de la cita.
    - Aseguramiento/creación automática de la `HistoriaClinica` para el paciente.
    - Transición atómica de `citas.estado = 'ATENDIDA'` y registro en `cita_estado_historial`.
    - Asentamiento de auditoría inmutable en `Bitacora.php` (CU03).
  - ✅ Controlador `ConsultasController.php` y rutas `/api/medical-records/consultas` y `/api/medical-records/citas/{id}/preparar`.

### 11. Implementación de CU13 (Registrar Asistencia y Estado de Cita — RF10) — 100% Operativo
- **Backend (`backend/app/Packages/Appointments/`):**
  - ✅ **Máquina de Estados en Dominio (`Cita.php`):** Constantes de estado (`PROGRAMADA`, `CONFIRMADA`, `ATENDIDA`, `CANCELADA`, `INASISTENCIA`), matriz canónica de `TRANSICIONES_VALIDAS`, y métodos de evaluación (`esEstadoTerminal()`, `obtenerTransicionesPermitidas()`, `puedeTransicionarA()`).
  - ✅ **Servicio Transaccional (`AppointmentStatusService.php`):** Bloqueo pesimista `lockForUpdate()` en `DB::transaction()`, control RBAC por rol (médico solo actualiza sus pacientes hacia atendida/inasistencia; recepción/admin confirma check-in e inasistencia; paciente bloqueado 403), validación temporal (rechazo de inasistencia en citas futuras) y auditoría inmutable en `bitacora` (CU03) y `cita_estado_historial`.
  - ✅ **FormRequest (`AppointmentChangeStatusRequest.php`):** Validación estricta de estados y mensajes en español.
  - ✅ **Controlador (`AppointmentsController.php`):** Endpoints `PATCH /api/appointments/{id}/status` y `GET /api/appointments/{id}/status-history` con scoping anti-IDOR.
  - ✅ **Rutas (`routes/api.php`):** Registradas bajo middleware de roles `role:ADMIN,RECEPCIONISTA,MEDICO`.
- **Frontend (`frontend/src/apps/appointments/`):**
  - ✅ **Servicio (`appointmentService.js`):** Integración de `updateStatus` y `fetchStatusHistory`.
  - ✅ **Modal (`AppointmentStatusModal.jsx`):** Modal responsivo bajo directrices de `/frontend-design` con comparativa Antes ➔ Después, selección de estados disponibles según rol, campo de observación justificada y pestaña de línea de tiempo con trazabilidad de `cita_estado_historial`.
  - ✅ **Panel Gestor (`AppointmentsManager.jsx`):** Acciones rápidas de Check-in en mostrador, marcación de inasistencia y botón de trazabilidad.
  - ✅ **Agenda Médica (`DoctorAgendaView.jsx`):** Integración en el cronograma timeline diario.
  - ✅ **Compilación:** Verificada con `npm run build` limpia al 100%.

### 12. Implementación de CU17 (Gestionar Antecedentes Médicos — Extra / §3.4) — 100% Operativo (Full-Stack)
- **Backend (`backend/app/Packages/MedicalRecords/`):**
  - ✅ **Modelo de Dominio (`Antecedente.php`):** Constantes de tipo (`PATOLOGICO`, `QUIRURGICO`, `ALERGICO`, `FAMILIAR`, `FARMACOLOGICO`), estados (`ACTIVO`, `INACTIVO`), scopes (`activos`, `porTipo`, `alergicos`) y método `esAlergico()`.
  - ✅ **FormRequests (`AntecedenteCreateRequest.php` y `AntecedenteUpdateRequest.php`):** Validación rigurosa de categorías permitidas y longitud de descripción en español.
  - ✅ **Servicio Transaccional (`AntecedenteService.php`):** Consulta con scoping RBAC/anti-IDOR (paciente solo ve sus antecedentes, recepcionista bloqueada por confidencialidad), resiliencia de historia clínica (`firstOrCreate`), descarte de duplicados idénticos activos, baja lógica reversible (`RN11`) y auditoría inmutable en `bitacora` (CU03).
  - ✅ **Controlador (`AntecedentesController.php`):** Endpoints REST paginados/filtrados por paciente, alta, edición y `toggle-status`.
  - ✅ **Rutas (`routes/api.php`):** Registradas bajo prefijo `medical-records` protegidas por roles con middleware `EnsureUserRole`.
- **Frontend (`frontend/src/apps/medical-records/`):**
  - ✅ **Servicio (`antecedenteService.js`):** Métodos `fetchPatientAntecedentes`, `createAntecedente`, `updateAntecedente`, `toggleAntecedenteStatus`.
  - ✅ **Modal Formulario (`AntecedenteFormModal.jsx`):** Selector semántico de categorías, chips rápidos de autocompletado (Alergias a Penicilina, AINEs, Látex, HTA, Asma, Diabetes) y validación en tiempo real.
  - ✅ **Modal Gestor (`AntecedentesPatientModal.jsx`):** Vista integral por pestañas de categorías, alertas prominentes en rojo/ámbar para alergias activas, filtro de activos/inactivos para baja lógica RN11 y edición fluida.
  - ✅ **Integraciones Reactivas:**
    - `ConsultaRegistroModal.jsx`: Acceso directo para el médico durante la consulta con refresco instantáneo de advertencias alérgicas.
    - `ConsultasManager.jsx`: Botón contextual de antecedentes en tabla y vista móvil.
    - `PatientsManager.jsx`: Botón de antecedentes por paciente en el padrón de pacientes.
  - ✅ **Compilación:** `npm run build` exitoso con 0 errores.
- **Pruebas:** 10 casos de prueba de caja negra documentados en `docs/informes/PRUEBAS_CAJA_NEGRA.md` (`CN-CU17-01` a `CN-CU17-10`).

---

### 23. Implementación Full-Stack de CU18 (Prescripción Médica y Recetas Digitales) (07/11/2026)
- **Backend (`backend/app/Packages/MedicalRecords/`):**
  - ✅ **Modelos de Dominio (`Receta.php` y `RecetaDetalle.php`):** Constantes de estado (`ACTIVO`, `ANULADO`), scopes de consulta (`activas`, `delMedico`) y relaciones directas con `HistoriaClinica`, `ConsultaMedica`, `Medico` y `RecetaDetalle`.
  - ✅ **Migración:** `2026_11_07_000001_add_motivo_anulacion_to_recetas_table.php` incorporando `motivo_anulacion` (`varchar(500)`) y `anulado_en` (`timestamptz`).
  - ✅ **FormRequests (`RecetaCreateRequest.php` y `RecetaAnularRequest.php`):** Validación estricta de medicamentos requeridos con dosis, frecuencia y duración obligatorios, y motivo de anulación mínimo de 5 caracteres.
  - ✅ **Servicio Transaccional (`RecetaService.php`):** Operaciones atómicas en `DB::transaction()`, control Anti-IDOR para restringir la prescripción exclusivamente al médico tratante de la consulta o Admin, filtros multicriterio con métricas (`total`, `activas`, `anuladas`), anulación inmutable con baja lógica (`RN11`) y auditoría en `Bitacora.php` (`EMITIR_RECETA`, `ANULAR_RECETA`).
  - ✅ **Controlador REST (`RecetasController.php`):** Endpoints `index`, `show`, `byConsulta`, `store` y `anular`.
  - ✅ **Rutas API (`routes/api.php`):** 5 rutas protegidas bajo middleware `EnsureUserRole` en `/api/medical-records/recetas`.
  - ✅ **Verificación:** Sintaxis PHP 100% libre de errores verificada con `php -l`.
- **Frontend (`frontend/src/apps/medical-records/`):**
  - ✅ **Servicio API (`recetaService.js`):** Métodos `fetchRecetas`, `fetchRecetaById`, `fetchRecetasByConsulta`, `emitirReceta` y `anularReceta`.
  - ✅ **Modal de Prescripción (`RecetaPrescripcionModal.jsx`):** Diseñado con `/frontend-design`, agregador dinámico de medicamentos, atajos de dosis/frecuencia/duración, y banner prominente de advertencia para antecedentes alérgicos (CU17).
  - ✅ **Modal Membretado Oficial (`RecetaDetailModal.jsx`):** Recetario institucional con formato oficial, RP (℞), datos del facultativo, soporte para impresión directa (`@media print`), exportación y marca de agua en recetas anuladas.
  - ✅ **Modal de Anulación (`RecetaAnularModal.jsx`):** Baja lógica permanente con motivo obligatorio mínimo de 5 caracteres (RN11).
  - ✅ **Gestor Integral (`RecetasManager.jsx`):** 3 tarjetas de KPIs, buscador en tiempo real, filtros por estado y fecha, paginación e integración en `Sidebar.jsx` (grupo P4) y `App.jsx`.
  - ✅ **Compilación:** Verificada con `npm run build` (0 errores en 22.45s).


### 24. Implementación Full-Stack de CU19 (Consultar Expediente Médico y Antecedentes) (07/11/2026)
- **Backend (`backend/app/Packages/MedicalRecords/`):**
  - ✅ **Servicio Transaccional (`ExpedienteService.php`):**
    - Scoping RBAC / Anti-IDOR estricto: Bloqueo explícito a recepcionistas (403 Forbidden por confidencialidad asistencial y secreto médico); pacientes estrictamente limitados a su propio expediente (`$usuario->paciente->id_paciente === $idPaciente`); médicos y administradores autorizados.
    - Resiliencia de historia clínica: `HistoriaClinica::firstOrCreate` para garantizar apertura automática si el paciente carece de consultas previas.
    - Carga relacional integral: `paciente.contactosEmergencia`, `antecedentes` (CU17), `consultas.diagnosticos` (CIE-10) y `consultas.medico` (CU16), `recetas.detalles` (CU18).
    - Agregación y síntesis de alto valor clínico: alertas alérgicas activas con severidad, patológicos crónicos, métricas de atenciones/recetas activas y último triaje con IMC.
    - Método `obtenerMiExpediente`: Resolución automática del paciente en sesión para el portal de autoservicio.
    - Método `obtenerTimeline`: Cronología clínica descendente que unifica consultas presenciales, recetas emitidas y antecedentes registrados.
    - Auditoría inmutable en `Bitacora.php` (`CONSULTAR_EXPEDIENTE`, módulo `HISTORIAL_CLINICO`).
  - ✅ **Controlador REST (`ExpedienteController.php`):**
    - `miExpediente(Request $request)`: Retorna el expediente del paciente autenticado.
    - `showByPatient(Request $request, int $idPaciente)`: Consulta médica/administrativa protegida.
    - `timeline(Request $request, int $idPaciente)`: Retorna la línea de tiempo cronológica integral.
  - ✅ **Rutas API (`backend/routes/api.php`):** 3 endpoints registrados bajo prefijo `medical-records/expediente` protegidos con middleware `EnsureUserRole`.
  - ✅ **Verificación:** Sintaxis PHP 100% limpia sin errores (`php -l`).

- **Frontend (`frontend/src/apps/medical-records/`):**
  - ✅ **Servicio API (`expedienteService.js`):** Métodos `fetchMiExpediente`, `fetchExpedienteByPaciente`, `fetchTimeline`.
  - ✅ **Componente Principal (`ExpedienteClinicoView.jsx`):**
    - Construido bajo directrices de `/frontend-design` y `/design-taste-frontend` con identidad visual médica diferenciada, tipografía clínica con números tabulares para signos vitales y transiciones fluidas.
    - **Buscador Inteligente con Autocompletado y Popover Flotante (07/11/2026):** Reemplazo del selector nativo tosco por un buscador integrado con popover (`z-50`, backdrop-blur, avatares con iniciales, badges de CI, HC y edad). Selección instantánea con clic o tecla `Enter`, borrado rápido con `X` y cierre exterior automático.
    - **Gestión Integral de Antecedentes Médicos (CU17) en Pestaña (07/11/2026):**
      - Corrección en backend de nombres de columnas en `ExpedienteService.php` (`tipo_antecedente`, `descripcion`, `fecha_registro`, relación `registrador`).
      - Barra de herramientas con botón `+ Registrar Antecedente`, filtros por categoría (`Alérgico`, `Patológico`, `Quirúrgico`, `Farmacológico`, `Familiar`) y switch de inactivos (RN11).
      - Tarjetas clínicas con paleta diferenciada e iconos específicos, badge de estado, descripción completa y auditoría de registro.
      - Acciones directas por tarjeta: botón `Editar` (`AntecedenteFormModal`) y alternancia de baja lógica (`Power`).
      - Detección reactiva en banner superior de alertas alérgicas.
    - Cabecera con tarjeta de identidad del paciente, N° Historia, CI, grupo sanguíneo y edad.
    - Banner destacado de Alertas Médicas (alergias activas en rose/amber y crónicos).
    - Widget de signos vitales y triaje con semáforo OMS de IMC (Bajo peso, Normal, Sobrepeso, Obesidad).
    - 5 pestañas de navegación: Línea de Tiempo (timeline vertical conectada con iconos temáticos), Consultas Médicas (acordeón con diagnósticos CIE-10), Prescripciones (con visor de receta membretada), Antecedentes y Contactos de Emergencia.
    - Soporte completo para impresión oficial multipágina (`@media print` con `#print-official-expediente`): Membrete institucional oficial del Centro Médico La Cruz, ficha demográfica del paciente, alertas alérgicas, antecedentes médicos (CU17), signos vitales y triaje, desglose completo de consultas con diagnósticos CIE-10 (CU16), recetas con posología (CU18), órdenes de exámenes auxiliares (CU25) y cuadro legal de firmas para paciente y médico tratante, ocultando por completo la interfaz web interactiva.
  - ✅ **Integración en Navegación:**
    - `Sidebar.jsx`: Ítem "Expediente Digital" / "Mi Expediente Clínico" (P4) bajo icono `FileText`.
    - `App.jsx`: Pestaña `expediente` y tarjeta interactiva de acceso rápido en el dashboard de bienvenida.
  - ✅ **Compilación:** Verificada con `npm run build` en 27.44s sin errores (0 warnings bloqueantes).

### 25. Implementación Full-Stack de CU26 (Gestionar Documentos Clínicos Adjuntos) (07/11/2026)
- **Backend (`backend/app/Packages/MedicalRecords/`):**
  - ✅ **Migración Incremental (`2026_11_07_000002_add_cloudinary_and_tracking_to_documentos_clinicos_table.php`):**
    - Incorpora `nombre_archivo`, `formato_archivo` (`JPG, PNG, PDF, DCM`), amplía `ruta_archivo` a 500 caracteres, agrega `cloudinary_public_id`, `subido_por` (FK a `usuarios`) y flexibiliza `id_medico` nullable.
  - ✅ **Modelo Enriquecido (`DocumentoClinico.php`):** Relaciones con `historiaClinica`, `consulta`, `ordenExamen`, `medico`, `subidoPorUsuario`, y accessors `es_dicom` y `tamanio_legible`.
  - ✅ **Servicio de Almacenamiento Cloudinary (`CloudinaryStorageService.php`):**
    - Subida firmada a Cloudinary con detección automática de tipo (`image` para imágenes; `raw` para PDFs y archivos tomográficos DICOM `.dcm`).
    - Fallback resiliente a almacenamiento local en desarrollo cuando no se configuran credenciales.
    - Eliminación remota e invalidación de CDN vía API destroy con clave y firma.
  - ✅ **Servicio de Dominio Transaccional (`DocumentoClinicoService.php`):**
    - Soporte nativo para ambas modalidades: Modo Autónomo (documentos sueltos, consentimientos o estudios externos sin orden) y Modo Vinculado a CU25 (cierre automático de orden de `PENDIENTE` a `CON_RESULTADOS`).
    - Bloqueo de concurrencia y validación de historia activa.
    - Scoping Anti-IDOR estricto (paciente solo ve sus propios documentos; recepcionista bloqueada con 403).
    - Baja lógica inmutable (RN11) y auditoría en `Bitacora.php` (`ADJUNTAR_DOCUMENTO_CLINICO`, `ELIMINAR_DOCUMENTO_CLINICO`).
  - ✅ **FormRequest (`DocumentoClinicoUploadRequest.php`):** Validación estricta de peso (máx 15 MB), categorías clínicas admitidas y formatos permitidos (`jpg, jpeg, png, pdf, dcm`).
  - ✅ **Controlador REST (`DocumentosClinicosController.php`):** Endpoints `index`, `store`, `ordenesPendientes` y `destroy`.
  - ✅ **Rutas API (`backend/routes/api.php`):** 4 endpoints bajo `/api/medical-records/historias/{idHistoria}/documentos` protegidos por roles.
  - ✅ **Verificación:** Sintaxis PHP 100% limpia sin errores (`php -l`).

- **Frontend (`frontend/src/apps/medical-records/`):**
  - ✅ **Servicio API (`documentoClinicoService.js`):** Métodos `fetchDocumentos`, `fetchOrdenesPendientes`, `uploadDocumento` (con `onUploadProgress` multipart) y `deleteDocumento`.
  - ✅ **Componente Principal (`ClinicalDocumentsSection.jsx`):**
    - Diseñado fiel a la interfaz de referencia con paleta índigo/clínica, contador de archivos y cabecera con `Paperclip`.
    - Formulario desplegable con selector de categoría clínica, input para archivos (máx 15 MB) y selector de vinculación opcional a órdenes de exámenes de CU25.
    - Textarea con contador de caracteres (`0/1000`) para notas y conclusiones médicas.
    - Barra de progreso porcentual durante la transmisión a Cloudinary.
    - Tarjetas de documentos con diferenciación por formato (badges `PNG`, `PDF`, `DCM`), previsualización de imágenes y visor embebido para PDFs.
    - **Modal de Asistencia DICOM:** Instrucciones de tomografía, botón de apertura directa a visor externo (`IMAIOS DICOM Viewer`) y descarga segura del archivo `.dcm`.
    - Modal de confirmación para eliminación con advertencia de borrado en Cloudinary.
  - ✅ **Integración en Navegación y Expediente:**
    - `ExpedienteClinicoView.jsx`: Incorporada la pestaña `Documentos Adjuntos` con contador en vivo y soporte de acceso directo mediante `defaultTab="documentos"`.
    - `Sidebar.jsx`: Nuevo acceso `Documentos Adjuntos (CU26)` en el grupo P4.
    - `App.jsx`: Enrutamiento y breadcrumbs para `documentos-clinicos`.
  - ✅ **Compilación:** `npm run build` exitoso con 0 errores (13.77s).
- **Pruebas:** 8 casos de prueba de caja negra documentados en `docs/informes/PRUEBAS_CAJA_NEGRA.md` (`CN-CU26-01` a `CN-CU26-08`).

### 26. Implementación Full-Stack de CU25 (Emitir Órdenes de Exámenes Auxiliares) (07/11/2026)
- **Backend (`backend/app/Packages/MedicalRecords/`):**
  - ✅ **Migración Incremental (`2026_11_07_000003_add_motivo_cancelacion_to_ordenes_examenes_table.php`):**
    - Incorpora `motivo_cancelacion` (varchar 255) y `cancelado_en` (timestampTz) a `ordenes_examenes` garantizando baja lógica inmutable (RN11).
  - ✅ **Modelo Enriquecido (`OrdenExamen.php`):** Constantes oficiales para tipos (`LABORATORIO, IMAGENOLOGIA, CARDIOLOGIA, OTROS`) y estados (`PENDIENTE, CON_RESULTADOS, CANCELADA`), métodos de dominio `puedeCancelarse()`, `cancelar()` y `marcarConResultados()`, y relaciones foráneas.
  - ✅ **FormRequests Tipados:**
    - `OrdenExamenCreateRequest.php`: Validación estricta de consulta, tipo de estudio y límites de longitud.
    - `OrdenExamenAnularRequest.php`: Motivo de cancelación obligatorio (mín. 5 chars) conforme a RN11.
  - ✅ **Servicio Transaccional (`OrdenExamenService.php`):**
    - Generador atómico de código correlativo `ORD-XXXX`.
    - Validación Anti-IDOR para facultativos y pacientes.
    - Transacciones `DB::transaction()` con auditoría inmutable en `Bitacora.php` (`EMITIR_ORDEN_EXAMEN`, `ANULAR_ORDEN_EXAMEN`).
  - ✅ **Controlador REST (`OrdenesExamenesController.php`):** Endpoints `index`, `show`, `byConsulta`, `byHistoria`, `store` y `anular`.
  - ✅ **Rutas API (`backend/routes/api.php`):** 6 endpoints registrados bajo `/api/medical-records/ordenes-examenes` protegidos por roles RBAC.
  - ✅ **Integración en Expediente (`ExpedienteService.php`):** Carga unificada en expediente integral y eventos cronológicos `ORDEN_EXAMEN` con icono temático en el timeline de atenciones.

- **Frontend (`frontend/src/apps/medical-records/`):**
  - ✅ **Servicio API (`ordenExamenService.js`):** Métodos `fetchOrdenes`, `fetchOrdenById`, `fetchOrdenesByConsulta`, `fetchOrdenesByHistoria`, `emitirOrden` y `anularOrden`.
  - ✅ **Componente Modal (`OrdenExamenFormModal.jsx`):**
    - Diseñado según `/design-taste-frontend` con cabecera en Deep Aqua (`#003844`), selector de 4 categorías clínicas (`Laboratorio, Imagenología, Cardiología, Otros`) e iconos distintivos.
    - Chips interactivos de estudios frecuentes por categoría (Hemograma, TAC, ECG, etc.) y atajos de preparación previa (ayuno, vejiga llena, ropa cómoda).
    - Renderizado con `createPortal`, scroll-lock de fondo y cierre por backdrop o tecla `Escape`.
  - ✅ **Pestaña Oficial en Expediente (`ExpedienteClinicoView.jsx`):**
    - Nueva pestaña "Órdenes de Exámenes" con contador dinámico en vivo.
    - Tarjetas clínicas con badges por categoría y estado (`PENDIENTE`, `CON_RESULTADOS`, `CANCELADA`).
    - Enlace directo bidireccional hacia CU26 para "Adjuntar Resultados".
    - Modal de anulación con motivo obligatorio (mínimo 5 caracteres) para el personal médico.
  - ✅ **Timeline de Paciente:** Representación visual con icono `FlaskConical`, distintivos de estado y conteo de archivos vinculados.
  - ✅ **Compilación Exitosa:** `npm run build` verificado con **0 errores** (2044 módulos transformados).

### 27. Implementación Full-Stack de CU21 (Pagar Cita Médica con Pasarela Stripe Sandbox) (07/11/2026)
- **Backend (`backend/app/Packages/Integrations/`):**
  - ✅ **Migración Incremental (`2026_11_07_000004_add_details_to_pagos_and_citas_table.php`):**
    - Agrega columnas `codigo_pago` (varchar 30), `moneda` (varchar 10), `tarjeta_marca` (varchar 50), `tarjeta_ultimos4` (varchar 4), `descripcion` (varchar 255) y `recibo_url` (varchar 500) a la tabla `pagos`.
    - Agrega columnas `pagada` (boolean, default false) y `monto_pago` (decimal 10,2 nullable) a la tabla `citas`.
  - ✅ **Modelo Enriquecido (`Pago.php`):** Constantes (`COMPLETADO`, `FALLIDO`, `REEMBOLSADO`, `PENDIENTE`), relaciones foráneas (`cita`, `paciente`, `usuario`) y casts tipados para montos y metadatos.
  - ✅ **Modelo Actualizado (`Cita.php`):** Propiedades `pagada`, `monto_pago`, relación uno a muchos `pagos()` y relación uno a uno `pago()`.
  - ✅ **Servicio Transaccional (`StripePaymentService.php`):**
    - Generador atómico del código correlativo `PAG-XXXX` con consulta indexada.
    - Llamadas nativas HTTP hacia Stripe API (`https://api.stripe.com/v1/payment_intents` y confirmación).
    - Creación de intenciones de pago (`crearPaymentIntent`), cobro inmediato con tarjeta de prueba sandbox (`pm_card_visa`), y fallback inteligente si no se dispone de conexión exterior.
    - Confirmación transaccional `DB::transaction()` atómica: actualiza `citas.pagada = true`, fija `citas.monto_pago` y registra auditoría inmutable en `Bitacora.php` (`PROCESAR_PAGO_STRIPE`).
    - Emisión estructurada de comprobante digital (`obtenerComprobante`).
  - ✅ **FormRequest (`ProcessPaymentRequest.php`):** Validación de `payment_method_id`, `monto` (mínimo 1.00 USD), `email` y `descripcion`.
  - ✅ **Controlador REST (`PaymentsController.php`):** Endpoints `index`, `createIntent`, `process` y `receipt`.
  - ✅ **Rutas API (`backend/routes/api.php`):** 4 endpoints bajo `/api/payments/` protegidos por autenticación y permisos de roles (`ADMIN`, `RECEPCIONISTA`, `PACIENTE`).

- **Frontend (`frontend/src/apps/payments/`):**
  - ✅ **Servicio API (`paymentService.js`):** Integración completa para `createPaymentIntent`, `processPayment`, `getReceipt` y `listPayments`.
  - ✅ **Modal de Pago Stripe (`StripePaymentModal.jsx`):**
    - Diseñado según `/design-taste-frontend` en Deep Aqua (`#003844`) y violeta Stripe (`#635BFF`).
    - Flujo en dos pasos:
      1. *Paso 1 (Pago):* Formulario de tarjeta con validación de expiración, CVC, botón de auto-llenado para tarjeta demo oficial (`4242...`), desglose claro de especialidad, médico y monto en USD.
      2. *Paso 2 (Comprobante):* Ticket oficial de pago con sello verde de éxito, ID de transacción Stripe (`pi_...`), código correlativo `PAG-XXXX`, marca y últimos 4 dígitos (`Visa •••• 4242`), botón para imprimir y confirmación de cita garantizada.
    - Renderizado con `createPortal`, scroll-lock y cierre accesible por backdrop / Escape.
  - ✅ **Integración en Gestión de Citas (`AppointmentsManager.jsx`):**
    - Badge de estado de pago en columna de horario/estado ("Pagada" en esmeralda o "Pendiente de Pago" en ámbar).
    - Botón de acción contextual "Pagar" para citas pendientes, accesible por Recepción y Paciente.
    - Visualización del estatus de pago en el modal de Ticket oficial de la cita.
  - ✅ **Compilación Exitosa:** `npm run build` verificado con **0 errores** (2046 módulos transformados).

### 28. Implementación Full-Stack de CU22 (Generar Reportes con Filtros Dinámicos — RF13) (07/11/2026)
- **Backend (`backend/app/Packages/Analytics/`):**
  - ✅ **Servicio de Dominio Transaccional (`DynamicReportService.php`):**
    - Implementación de los **7 reportes gerenciales obligatorios del examen (RF13)**:
      1. *Citas por rango de fechas:* Evolución cronológica, cálculo de promedios diarios y agrupador de tendencia.
      2. *Citas por médico:* Desempeño individual, atenciones, cancelaciones y tasa de atención porcentual por profesional.
      3. *Citas por especialidad:* Demanda clínica, participación sobre el total institucional e ingresos facturados estimados.
      4. *Citas por estado:* Ciclo de vida completo (Programada, Confirmada, Atendida, Cancelada, Inasistencia) con listado detallado de motivos de cancelación (RN09/RN11).
      5. *Padrón de pacientes registrados:* Censo clínico, segmentación matemática por grupos etarios según RF04 (Pediátricos <15 años, Adultos 15-59 años, Geriátricos 60+ años) y estado de cuentas de autoservicio web (§3.4).
      6. *Balance consolidado y rendimiento operativo:* Relación de citas atendidas vs perdidas, tasa de asistencia, ingresos de consultas y pagos confirmados en Stripe Sandbox (CU21).
      7. *Agenda médica diaria por profesional:* Cronograma detallado hora por hora para un médico y fecha específica, resolución de franja horaria configurada en `disponibilidades` y tasa de ocupación.
    - Scoping estricto por rol: Los médicos quedan restringidos exclusivamente a sus propios datos y pacientes atendidos; Administradores y Recepcionistas disponen de visión global.
    - Exportador de streaming nativo a CSV con codificación UTF-8 y BOM (`exportCsv`).
    - Auditoría inmutable en `Bitacora.php` con tipo de acción `GENERAR_REPORTE_DINAMICO`.
  - ✅ **Controlador REST (`ReportsController.php`):**
    - Endpoints `/api/analytics/reports/catalogs`, `/api/analytics/reports/dynamic` y `/api/analytics/reports/export-csv`.
  - ✅ **Rutas API (`backend/routes/api.php`):** 3 endpoints protegidos bajo `/api/analytics/reports/` con middleware de roles (`ADMIN`, `RECEPCIONISTA`, `MEDICO`).
  - ✅ **Verificación:** Pruebas automatizadas directas sobre PostgreSQL ejecutadas con 100% de éxito en los 7 reportes y catálogos.

- **Frontend (`frontend/src/apps/analytics/`):**
  - ✅ **Servicio API (`dynamicReportService.js`):** Cliente HTTP para catálogos, generación en tiempo real, descarga de streams CSV y disparador de impresión nativa.
  - ✅ **Componente Principal (`DynamicReportsView.jsx`):**
    - Diseñado según `/design-taste-frontend` con cabecera institucional Deep Aqua (`#003844`), barra de pestañas para los 7 reportes con iconos dedicados (`Calendar`, `UserCheck`, `Stethoscope`, `Activity`, `Users`, `DollarSign`, `Clock`).
    - Barra de filtros reactiva: atajos de tiempo (`Hoy`, `7 días`, `Mes`, `Fechas personalizadas`), selectores dinámicos de Médico, Especialidad, Estado de Cita y Grupo Etario.
    - Bloque de KPIs ejecutivos interactivos (conteos, porcentajes, balances de ingresos).
    - Desgloses visuales adaptativos: barras de demanda clínica por especialidad, distribución de ciclo de vida de citas y segmentación etaria.
    - Tabla de datos interactiva con buscador en vivo, badges semánticos por estado/pago, y paginación en cliente.
    - Descarga de archivo CSV estructurado con un clic y vista de impresión institucional con membrete del Centro Médico La Cruz formateada para `@media print` y exportación a PDF.
  - ✅ **Integración en Navegación:**
    - `Sidebar.jsx`: Nuevo acceso oficial `Reportes Dinámicos (CU22 / RF13)` bajo el paquete P6.
    - `App.jsx`: Registro de ruta, breadcrumb y renderizado seguro bajo RBAC.
    - `InicioPanelView.jsx`: Tarjetas de acceso rápido en el portal principal para Administrador, Recepcionista y Médico.
  - ✅ **Compilación Exitosa:** `npm run build` verificado con **0 errores** (2049 módulos transformados en 743ms).

### 29. Implementación Full-Stack de CU20 (Enviar Recordatorios y Notificaciones — Sistema / Cron) (07/11/2026)
- **Backend (`backend/app/Packages/Integrations/` y `Console/`):**
  - ✅ **Modelo Enriquecido (`Notificacion.php`):** Mapeo de la tabla relacional `notificaciones` con constantes tipadas (`RECORDATORIO_24H`, `CONFIRMACION`, `REPROGRAMACION`, `CANCELACION`, `PAGO_EXITOSO`), scopes locales (`noLeidas`, `paraUsuario`, `porTipo`), accessor de tiempo relativo y método de instancia `marcarComoLeida()`.
  - ✅ **Modelo Actualizado (`User.php`):** Agregada relación Eloquent uno a muchos `notificaciones()`.
  - ✅ **Servicio Orquestador de Notificaciones (`NotificationService.php`):**
    - Resolutores inteligentes de cuentas de usuario para pacientes y médicos por ID foráneo, correo institucional o cédula de identidad.
    - Método `crearNotificacion`: Registro estructurado en base de datos con canal (in-app, email) y fecha de emisión.
    - Disparadores automáticos desacoplados:
      - `notificarCitaCreada`: Emite aviso de confirmación al paciente y notificación a la agenda del médico.
      - `notificarCitaReprogramada`: Alerta a paciente y médico del cambio de fecha/hora con registro del motivo.
      - `notificarCitaCancelada`: Notifica a paciente y médico la anulación del turno y liberación del cupo.
      - `notificarPagoCompletado`: Envía comprobante oficial de pago exitoso al paciente.
    - Motor de Recordatorios 24h (`ejecutarRecordatorios24h`):
      - Escaneo de citas en estado `PROGRAMADA` o `CONFIRMADA` en la ventana preventiva de 24 a 48 horas hacia adelante.
      - Idempotencia estricta para evitar duplicidad de recordatorios ya despachados.
      - Opción `--force` y filtro por cita específica para demostración de pruebas.
      - Registro inmutable en `Bitacora.php` con tipo `RECORDATORIOS_24H_ENVIADOS`.
    - Operaciones de lectura y gestión: Listado paginado con métricas y control Anti-IDOR para `marcarComoLeida`, `marcarTodasComoLeidas` y `eliminarNotificacion`.
  - ✅ **Comando Artisan Programable (`SendAppointmentRemindersCommand.php`):**
    - Ejecutable mediante `php artisan appointments:send-reminders` con flags opcionales `--force` y `--cita=ID`.
    - Salida en consola formateada con tabla de citas evaluadas y notificaciones entregadas.
  - ✅ **Planificador Laravel Schedule (`backend/routes/console.php`):**
    - Tarea programada registrada: `Schedule::command('appointments:send-reminders')->dailyAt('08:00')->withoutOverlapping()->runInBackground()`.
  - ✅ **Integración en Servicios Existentes del Sistema:**
    - `AppointmentBookingService.php`: Dispara notificación tras crear la cita.
    - `AppointmentRescheduleService.php`: Dispara notificación tras reprogramar.
    - `AppointmentsController.php`: Dispara notificación tras cancelación.
    - `StripePaymentService.php`: Dispara notificación tras confirmación de pago con Stripe.
  - ✅ **Controlador REST (`NotificationsController.php`):** Endpoints `index`, `unreadCount`, `markAsRead`, `markAllAsRead`, `destroy` y `triggerReminders`.
  - ✅ **Rutas API (`backend/routes/api.php`):** 6 endpoints bajo `/api/notifications/` con middleware de roles y autenticación.

- **Frontend (`frontend/src/apps/integrations/` y `components/`):**
  - ✅ **Servicio API (`notificationService.js`):** Métodos para consumo REST (`fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`, `triggerReminders`).
  - ✅ **Componente Interactivo (`NotificationsDropdown.jsx`):**
    - Integrado en la cabecera principal de `App.jsx`.
    - Badge con contador de no leídas en vivo y pulso animado.
    - Polling en segundo plano cada 30 segundos (`fetchUnreadCount`).
    - Pestañas de filtrado: *Todas*, *No leídas* y *Recordatorios 24h*.
    - Tarjetas de notificación enriquecidas con iconos y colores temáticos según el evento (`Clock` ámbar para recordatorios 24h, `Calendar` azul para confirmaciones, `CalendarClock` para reprogramaciones, `CalendarX` rojo para cancelaciones y `CreditCard` esmeralda para pagos Stripe).
    - Acciones contextuales: Marcar una como leída, marcar todas como leídas y eliminar de bandeja.
    - Botón de demostración interactivo **"Probar 24h Ahora"** con spinner de carga para disparar el Cron en vivo ante el docente.
  - ✅ **Compilación Exitosa:** `npm run build` verificado con **0 errores** (2050 módulos transformados en 690ms).

### 30. Activación de Accesos Rápidos en InicioPanelView (CU21, CU25, CU26) y Población Histórica (07/11/2026)
- **Activación de Accesos Rápidos (`frontend/src/apps/analytics/components/InicioPanelView.jsx`):**
  - Removidos todos los badges amarillos `"En desarrollo"` y los diálogos bloqueantes de alerta.
  - Activada tarjeta **Pagos con Stripe (CU21)**: Redirige fluidamente a `appointments` para visualización y cobro en Sandbox de Stripe.
  - Activada tarjeta **Órdenes de Exámenes (CU25)**: Redirige a `expediente` para prescripción y seguimiento de estudios auxiliares.
  - Activada tarjeta **Documentos y DICOM (CU26)**: Redirige a `expediente` con badge oficial `DICOM`.
  - Tarjetas adaptadas y activadas para todos los perfiles (`ADMIN`, `MEDICO`, `RECEPCIONISTA`, `PACIENTE`).
  - Badges semánticos integrados con diseño consistente Deep Aqua (`text-[#00687a] bg-[#00687a]/10`).
- **Población de Datos Históricos Multimensual (`HistoricalMultiMonthPopulationSeeder.php`):**
  - Población clínica masiva de 4+ meses atrás (Junio 2026 - Noviembre 2026).
  - 347 citas médicas, 111 pacientes con historias clínicas completas, 255 consultas con triaje y CIE-10, 255 recetas farmacológicas y $26,275 USD recaudados en 293 transacciones de pago.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2050 módulos transformados).


# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 22/10/2026

### 1. Avances Consolidados en esta Sesión
1. **Modelos en Español (PostgreSQL / DDL):**
   - Eliminados definitivamente los archivos residuales en inglés (`Doctor.php` y `Specialty.php`).
   - Modelos de dominio oficiales implementados en español: [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php) y [`Especialidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Especialidad.php).
   - Todos los controladores, seeders y requests actualizados para importar directamente `Medico` y `Especialidad`.

2. **CU06 (Gestionar Médicos — RF03) y CU07 (Especialidades — RF04) 100% Operativos:**
   - Backend: Migración de tablas `medicos`, `especialidades` y `medico_especialidad`.
   - Controladores `DoctorsController.php` y `SpecialtiesController.php`.
   - Seeders `DoctorSeeder.php` y `SpecialtySeeder.php`.
   - Frontend: `DoctorsManager.jsx`, `DoctorFormModal.jsx` y `DoctorDetailModal.jsx` restringidos exclusivamente a `ADMIN` en `Sidebar.jsx` y `App.jsx`.

3. **Perfeccionamiento de CU05 (Portal Paciente / Perfil de Pacientes):**
   - Resuelto el enlace de `id_usuario` en `PatientSeeder.php` y `DatabaseSeeder.php`.
   - Habilitado inicio de sesión directo con Cédula de Identidad (CI) en `AuthController.php`.
   - Implementado fallback de auto-vinculación resiliente en `PatientProfileController.php`.
   - Cuentas demo de pacientes (`paciente.carlos`, `paciente.mariana`, `paciente.valeria`, `paciente.fernando` con password `Admin123@`) vinculadas y verificadas.
   - Corregida la navegación hacia "¿Olvidaste tu contraseña?" (`ForgotPasswordPage`) desde cualquier ruta de acceso.

4. **CU08 (Gestionar Horarios de Atención Médica — RF05) 100% Operativo:**
   - Backend: Migración `2026_10_20_000005_create_paquete2_horarios_and_bloqueos_tables.php` (`disponibilidades` y `bloqueos_horario`).
   - Modelos Eloquent en español: [`Disponibilidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Disponibilidad.php) y [`BloqueoHorario.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/BloqueoHorario.php), con relaciones en [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php).
   - FormRequests con validación P8.1 (`hora_fin > hora_inicio`): `ScheduleBatchRequest.php` y `BlockCreateRequest.php`.
   - Controlador: `SchedulesController.php` con auditoría inmutable en `bitacora` (CU03) y protección de rol `ADMIN`.
   - Frontend: [`SchedulesManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/SchedulesManager.jsx), [`BlockModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/BlockModal.jsx) y `scheduleService.js`.
   - Navegación: Habilitado en `Sidebar.jsx` (icono `Clock`) y panel de `App.jsx` exclusivamente para rol `ADMIN`.

5. **CU09 (Consultar Disponibilidad de Horarios libres — RF05, RF06) 100% Operativo:**
   - Backend: Migración `2026_10_20_000006_create_paquete3_citas_tables.php` (`tipos_cita`, `citas`, `cita_estado_historial`).
   - Modelos Eloquent: [`Cita.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/Cita.php), [`TipoCita.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/TipoCita.php) y [`CitaEstadoHistorial.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/CitaEstadoHistorial.php).
   - Servicio de Dominio: [`AppointmentAvailabilityService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Services/AppointmentAvailabilityService.php) con descarte de citas activas (Prueba P9.2), feriados y licencias (Prueba P9.3), validación de médico activo (RN04) y fechas pasadas (RN06).
   - Controlador: [`AvailabilityController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AvailabilityController.php) y ruta `/api/appointments/availability`.
   - Frontend: [`AppointmentAvailabilityViewer.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentAvailabilityViewer.jsx) y `appointmentService.js`.

6. **CU10 (Programar Cita Médica con motor anti-colisión transaccional — RF06, RF07) 100% Operativo:**
   - Backend:
     - FormRequest: `AppointmentBookRequest.php` validando rangos, IDs y coherencia.
     - Servicio Transaccional: [`AppointmentBookingService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Services/AppointmentBookingService.php) con `DB::transaction()` y `lockForUpdate()` pesimista para resolver colisiones concurrentes (Prueba #4), generación de correlativo secuencial único `CM-XXXX`, validación etaria (RF04 / Prueba P10.4) y verificación de franja activa del médico (RF05 / Prueba #5).
     - Controlador: [`AppointmentsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AppointmentsController.php) con endpoints `store()`, `index()` con scoping RBAC (pacientes ven solo sus citas, médicos ven su agenda), `show()` y `getBookingFormData()`.
     - Auditoría: Trazabilidad en `cita_estado_historial` y `bitacora` inmutable (CU03).
   - Frontend:
     - Asistente Multipasos: [`AppointmentBookingModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx) con 5 pasos interactivos y emisión de ticket oficial imprimible.
     - Panel Gestor: [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx) integrando citas programadas con visor de disponibilidad y modal de ticket.
     - Integración en `Sidebar.jsx` y `App.jsx` en pestaña `appointments`.

7. **CU12 (Cancelar Cita Médica con Motivo Obligatorio — RF09 / Prueba #6) 100% Operativo:**
   - Backend: `AppointmentCancelRequest.php` (min: 5 caracteres), `AppointmentsController::cancel()` con transacción atómica, método `$cita->cancelar()`, liberación inmediata del slot en `AppointmentAvailabilityService` sin borrado físico (RN09/RN11), registro inmutable en `bitacora` (CU03) y en `cita_estado_historial`.
   - Frontend: `appointmentService.cancelAppointment()`, modal interactivo `AppointmentCancelModal.jsx` y botón "Cancelar" condicional en `AppointmentsManager.jsx`, `DoctorAgendaView.jsx` y `PatientAppointmentHistoryModal.jsx`.

8. **CU14 (Consultar Agenda Médica Diaria — RF11 / Prueba #8) 100% Operativo:**
   - Backend: `AppointmentsController::doctorAgenda()` con filtrado por médico y fecha (`fecha` en `YYYY-MM-DD`), cálculo de 4 KPIs diarios, resolución de franja semanal activa en `Disponibilidad` y scoping RBAC (médicos solo ven su agenda; rechazo tajante a pacientes con HTTP 403).
   - Frontend: `DoctorAgendaView.jsx` con navegación rápida por fecha (día anterior, "Hoy", siguiente), selector de médico, tarjeta de franja horaria, 4 KPIs y timeline de citas con acciones (Ticket, Cancelar). Integrado como pestaña en `AppointmentsManager.jsx`.

9. **CU15 (Consultar Historial Cronológico de Citas del Paciente — RF12 / Prueba #7) 100% Operativo:**
   - Backend: `AppointmentsController::patientHistory()` con cronología descendente sin eliminación física (RN10/RN11), métricas globales (total, atendidas, canceladas, pendientes, tasa de asistencia % y fechas extremas) y scoping RBAC (pacientes solo leen su historia).
   - Frontend: `PatientAppointmentHistoryModal.jsx` con ficha del paciente, 4 métricas, filtro por estado y listado cronológico. Enlazado mediante botón "Ver Historial" en la columna de paciente de `AppointmentsManager.jsx`.

10. **Blindaje RBAC Global, Scoping Anti-IDOR y Homologación de Permisos (Auditoría Oficial):**
    - **Middleware `EnsureUserRole`:** Protege todas las rutas de `routes/api.php` verificando autenticación, estado `ACTIVO` y lista de roles autorizados.
    - **Anti-IDOR en CU10:** El backend fuerza la reserva al paciente autenticado (`$data['id_paciente'] = $miPaciente->id_paciente`), impidiendo la suplantación de identidades.
    - **Protección Perimetral en CU04, CU14, CU15:** Bloqueo de acceso al padrón de pacientes y a agendas médicas para el rol `PACIENTE`.
    - **Alineación de Permisos en UI:** Gestión de médicos (CU06) y horarios (CU08) restringidos exclusivamente a `ADMIN` en `Sidebar.jsx` y `App.jsx`.
    - **Autoservicio Guiado en Frontend:** `AppointmentBookingModal.jsx` detecta sesión de paciente y fija automáticamente su titularidad, mostrando badge *"Tu Ficha Personal (Verificada)"*.

11. **Homologación Arquitectónica con Sección 7.1 (Google Doc / RUP):**
    - **Axios en Frontend:** `frontend/src/services/api.js` configurado con `apiClient` e interceptores Bearer y withCredentials, envolviendo `apiFetch` con retrocompatibilidad absoluta.
    - **Dual Auth Sanctum Bearer Token:** Laravel Sanctum v4 emitiendo Bearer Tokens en `/auth/login`, soportado de forma híbrida en `EnsureUserRole` y almacenado en `localStorage` vía `AuthContext.jsx`.
    - **Atributo `motivo_breve`:** Mapeo bidireccional en `Cita.php` y soporte en `AppointmentBookRequest` / `AppointmentBookingService`.
    - **Estado `INASISTENCIA`:** Estandarización del 5to estado formal de cita en modelos, migraciones, seeders (CM-0010) y componentes frontend (`AppointmentsManager`, `DoctorAgendaView`, `PatientAppointmentHistoryModal`).
    - **Mailtrap Sandbox SMTP:** Parámetros configurados en `.env.example` y `.env`.

12. **Aislamiento Estricto de Roles y Casos de Uso por Actor (23/10/2026):**
    - **Médico (`MEDICO`):**
      - Módulo directo: *Mi Agenda Médica (CU14)* e *Historial de Pacientes (CU15)*.
      - Retirado del menú de admisiones/pacientes (CU04) y de la vista general de agendamiento (CU09/CU10).
      - Desactivada la acción de cancelación de cita (CU12) para médicos (privativa de Recepcionista y Paciente).
      - Tarjetas visibles en Dashboard: Únicamente `CU01` (Autenticación), `CU14` (Mi Agenda Médica) y `CU15` (Historial Clínico). Cero tarjetas extrañas.
    - **Recepcionista (`RECEPCIONISTA`):**
      - Menú y módulos autorizados: *Panel General*, *Pacientes y Fichas (CU04)*, *Habilitación de Cuentas Web en Ventanilla (CU05)* y *Disponibilidad y Citas (CU09, CU10, CU12, CU14, CU15)*.
      - Botón interactivo de habilitación web (`Globe`) integrado en la tabla del padrón para dar acceso o resetear credenciales de autoservicio (CU05 §3.4).
      - Tarjetas visibles en Dashboard: `CU01`, `CU04`, `CU05`, `CU09/CU10/CU12`, `CU14`, `CU15`.
      - Sin acceso a Usuarios (CU02), Bitácora (CU03), Médicos (CU06) ni Horarios (CU08).
    - **Paciente (`PACIENTE`):**
      - Módulos autorizados: *Mi Perfil de Paciente (CU05)* y *Mis Citas Médicas (CU09, CU10, CU12, CU15)*.
      - Botón *Mi Historial (CU15)* adaptado para cargar la ficha propia vía `patientProfileService.fetchMyProfile()`, funcionando de inmediato incluso para pacientes nuevos sin citas previas.
      - Tarjetas visibles en Dashboard: Únicamente `CU01`, `CU05`, `CU09/CU10` y `CU15`.
      - Sin acceso a agendas médicas de doctores (CU14), padrón general (CU04), bitácora (CU03) ni usuarios (CU02).
    - **Administrador (`ADMIN`):**
      - Visualiza la suite completa de control institucional (`CU01-CU04, CU06-CU08, CU09-CU15`).

13. **Métricas de Avance Consolidado (Cierre Histórico del Ciclo 1):**
    - **Ciclo 1:** 13 de 13 Casos de Uso completados (**100% de ejecución de Ciclo 1 blindado, auditado y homologado al 100% con la Sección 7.1 y aislamiento de roles**).
    - **Progreso Global del Proyecto:** 13 de 23 (+1) Casos de Uso completados (**56.5%**).
    - **10 Pruebas Mínimas del Examen Oficial Superadas:** **10 de 10 (100% de pruebas oficiales superadas)**:
      - Prueba #1 (Registrar paciente / CU04) ✅
      - Prueba #2 (CI duplicado / CU04) ✅
      - Prueba #3 (Programar cita CM-XXXX / CU10) ✅
      - Prueba #4 (Anti-colisión concurrente lockForUpdate / CU10) ✅
      - Prueba #5 (Forzar fuera de horario rechazada / CU10) ✅
      - Prueba #6 (Cancelar cita con motivo y liberación de cupo / CU12) ✅
      - Prueba #7 (Historial cronológico de paciente / CU15) ✅
      - Prueba #8 (Agenda médica por médico y fecha / CU14) ✅
      - Prueba #9 (Página sin sesión HTTP 401 / CU01) ✅
      - Prueba #10 (Operación inválida HTTP 422 tipado / Transversal) ✅

14. **Refinamiento de UX/UI y Responsividad en Cabecera de Citas (Portal Paciente / Citas):**
    - Corregida la colisión visual entre el botón `"Mi Historial (CU15)"` y el badge `"PORTAL PACIENTE"` en [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx).
    - Implementado `xl:flex-row`, `min-w-0 flex-1`, envoltura elástica (`flex-wrap`) en títulos y botones, y `overflow-x-auto` en la barra de pestañas para garantizar fluidez en todas las resoluciones.

### 2. Próxima Tarea Inmediata (Arranque del Ciclo 2)
- Planificación y ejecución del **Ciclo 2: Clínico, Pagos y Analítica**:
  - `CU11`: Reprogramar Cita Médica (RF08) con nueva fecha y liberación del horario anterior.
  - `CU13`: Registrar Asistencia y Estado de Cita Médica (RF10 — *Programada* → *Confirmada* → *Atendida* / *Inasistencia*).
  - `CU16-CU19`: Expediente Clínico Digital, Consultas, Diagnósticos CIE y Recetas.
  - `CU20-CU23`: Recordatorios, Pasarela de Pagos Stripe Sandbox y Reportes con Filtros Dinámicos (RF13).


# 📋 Fases de Implementación y Checklist de Pruebas
### Clínica Vida Salud — Centro Médico La Cruz
> **Metodología:** PUDS / RUP  
> **Alcance:** Examen Parcial II — Sistemas de Información I  
> **Estructura:** 26 Casos de Uso (+ 1 Reserva Opcional) en 2 Ciclos de Desarrollo

---

## 📌 Resumen General de Avance

| Ciclo | Total CUs | CUs Completados | CUs Pendientes | Estado de Entrega |
|:---|:---:|:---:|:---:|:---|
| **Ciclo 1: Base Operativa y Cita de Punta a Punta** | 13 | 13 | 0 | 🟢 **100% Completado** (Meta superada anticipadamente) |
| **Ciclo 2: Clínico, Pagos y Analítica** | 13 (+2) | 13 | 0 (+2) | 🟢 **100% Completado** (Los 26 CUs oficiales 100% operativos) |
| **TOTAL GENERAL** | **26 (+2)** | **26** | **0 (+2)** | **Progreso Global: 100% (26 de 26 CUs Oficiales)** |

---

## 🧪 Matriz de las 10 Pruebas Mínimas del Examen Oficial

Estas 10 pruebas son de demostración obligatoria ante el docente:

| N.° | Prueba Exigida | Caso de Uso | Requisito | Estado | Criterio de Aceptación / Verificación |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | Registrar un paciente nuevo | **CU04** | RF02 | ✅ Superada | Paciente guardado con correlativo `HC-XXXX`, grupo etario y auditoría. |
| **2** | Registrar un paciente con CI duplicado | **CU04** | RF02 | ✅ Superada | Servidor rechaza con HTTP 422 y mensaje de unicidad de documento. |
| **3** | Programar una cita en horario disponible | **CU10** | RF06 / RF07 | ✅ Superada | Cita queda guardada con correlativo único `CM-XXXX`, estado *Pendiente* y ticket oficial. |
| **4** | Programar otra cita superpuesta para el mismo médico | **CU10** | RF07 / RN07 | ✅ Superada | Servidor bloquea colisión atómicamente dentro de `DB::transaction()` con `lockForUpdate()`. |
| **5** | Intentar reservar fuera del horario médico | **CU10** | RF05 / RN05 | ✅ Superada | Servidor valida que el horario encaje en las franjas activas del médico (HTTP 422). |
| **6** | Cancelar una cita | **CU12** | RF09 / RN09 | ✅ Superada | Pasa a estado *Cancelada* con motivo obligatorio (mín. 5 chars), libera cupo y mantiene histórico en DB. |
| **7** | Consultar el historial de un paciente | **CU15** | RF12 / RN10 | ✅ Superada | Cronología completa de citas previas, atendidas y canceladas sin pérdida, con métricas de asistencia. |
| **8** | Buscar las citas de un médico por fecha | **CU14** | RF11 | ✅ Superada | Vista de agenda médica diaria filtrando por médico, fecha, atajos día anterior/hoy/siguiente y KPIs. |
| **9** | Ingresar a una página interna sin sesión válida | **CU01** | RF01 / RN12 | ✅ Superada | Middleware y cliente redirigen al login; API devuelve HTTP 401. |
| **10** | Ejecutar una operación con datos inválidos | Transversal | RF01-13 | ✅ Superada | FormRequests en Laravel devuelven HTTP 422 con array de errores tipados. |

---

## 🚀 CICLO 1: Cita Médica de Punta a Punta
> **Objetivo:** Cumplir el núcleo operativo de la clínica (RF01 al RF12) y las 10 pruebas mínimas del examen.  
> **Fecha Límite:** Domingo 25 de Octubre de 2026.

### 📦 Paquete 1: Seguridad y Auditoría (P1)

#### ✅ CU01: Autenticar Usuario (RF01)
- [x] **Backend:**
  - [x] Migración de `usuarios`, `roles`, `tokens_recuperacion`, `configuracion_seguridad`.
  - [x] Hash seguro con `Hash::make()` / `bcrypt` y validación de credenciales.
  - [x] Control anti-fuerza bruta: bloqueo temporal a los $N$ intentos por $M$ minutos configurables.
  - [x] Desbloqueo temporal automático al expirar el tiempo de castigo.
  - [x] Recuperación de contraseña por código de verificación de 6 dígitos (15 min).
  - [x] Regla estricta `StrongPasswordRule` (8+ caracteres, mayúscula, minúscula, número y símbolo).
- [x] **Frontend:**
  - [x] Pantalla `LoginPage.jsx` con switcher para *Personal Médico* y *Portal Paciente*.
  - [x] Formulario con temporizador regresivo dinámico en vivo (`⏳ Desbloqueo en: Xm Ys`).
  - [x] `ForgotPasswordPage.jsx` para restablecimiento de contraseña.
  - [x] Modal `SecurityPolicyModal.jsx` para ajuste de intentos y minutos por Administrador.
- [x] **Fase de Pruebas:**
  - [x] **P1.1:** Login con credenciales válidas (éxito y asignación de rol).
  - [x] **P1.2:** 3 intentos fallidos consecutivos (bloqueo por 5 minutos y HTTP 423).
  - [x] **P1.3:** Recuperación con código y cambio de clave con requisitos de complejidad.
  - [x] **P1.4 (Prueba #9):** Intento de consumo de API sin autenticación (HTTP 401).

#### ✅ CU02: Gestionar Usuarios, Roles y Permisos (RF01)
- [x] **Backend:**
  - [x] `UsersController.php` con CRUD paginado, filtros (`q`, `tipo_usuario`, `estado`).
  - [x] Baja lógica (`toggle-status` — RN11) preservando histórico.
  - [x] Desbloqueo administrativo directo (`unlock`).
  - [x] Catálogo de roles (`RolesController.php`).
- [x] **Frontend:**
  - [x] Panel `UsersManager.jsx` con búsqueda en vivo, filtros y badges.
  - [x] `UserFormModal.jsx` con checklist visual de contraseña segura en tiempo real.
- [x] **Fase de Pruebas:**
  - [x] **P2.1:** Registro de operador con username o email duplicado (rechazado).
  - [x] **P2.2:** Desactivación de usuario (no puede iniciar sesión).
  - [x] **P2.3:** Desbloqueo manual por el Administrador.

#### ✅ CU03: Gestionar Bitácora de Auditoría (Inmutable)
- [x] **Backend:**
  - [x] Tabla `bitacora` inmutable con triggers/observers pasivos.
  - [x] Endpoint paginado con filtros (`q`, `modulo`, `accion`, `operador`, `fechas`).
  - [x] KPIs diarios de seguridad y operaciones.
- [x] **Frontend:**
  - [x] `AuditLogViewer.jsx` con 4 KPIs, filtros avanzados y `AuditDetailModal.jsx`.
- [x] **Fase de Pruebas:**
  - [x] **P3.1:** Verificación de inmutabilidad (no existe endpoint DELETE ni UPDATE en bitácora).
  - [x] **P3.2:** Registro automático ante altas de pacientes y cambios de estado.

---

### 📦 Paquete 2: Gestión de Recursos Clínicos y Pacientes (P2)

#### ✅ CU04: Gestionar Pacientes (RF02)
- [x] **Backend:**
  - [x] Migración `pacientes` y `contactos_emergencia`.
  - [x] Correlativo clínico `HC-XXXX` auto-generado y cálculo dinámico de edad.
  - [x] Determinación de grupo etario y especialidad sugerida según RF04 (`Pediatría`, `Medicina General`, `Geriatría`).
  - [x] `PatientsController.php` con búsqueda por CI/nombre, filtros y KPIs etarios.
  - [x] Baja lógica (RN11) preservando ficha médica.
  - [x] Seeder y script SQL con 15 pacientes reales (`poblacion_database_clinica.sql`).
- [x] **Frontend:**
  - [x] Panel `PatientsManager.jsx` con 4 KPIs interactivos etarios y tabla de admisiones.
  - [x] `PatientFormModal.jsx` con cálculo de edad en vivo y asistente de especialidad.
  - [x] `PatientDetailModal.jsx` con ficha de contacto y grupo etario.
- [x] **Fase de Pruebas:**
  - [x] **P4.1 (Prueba #1):** Registrar paciente nuevo con datos válidos (éxito).
  - [x] **P4.2 (Prueba #2):** Registrar paciente con CI duplicado (rechazo con HTTP 422).
  - [x] **P4.3:** Cálculo correcto de edad y asignación del grupo etario.
  - [x] **P4.4:** Desactivación lógica sin borrado de base de datos.

#### ✅ CU05: Gestionar Cuenta y Perfil del Paciente (§3.4 / Autoservicio)
- [x] **Backend:**
  - [x] Verificación de CI en padrón clínico (`/check-ci`).
  - [x] Activación transaccional con asignación de rol `PACIENTE` y bcrypt.
  - [x] Consulta y actualización de datos de contacto y contacto de emergencia.
  - [x] Cambio de contraseña con `StrongPasswordRule`.
  - [x] Habilitación asistida desde recepción (`/enable-web-account`).
- [x] **Frontend:**
  - [x] `ActivatePatientModal.jsx` de autoservicio en 3 pasos accesible desde Login y Home.
  - [x] `PatientWebAccountModal.jsx` para asignación de credenciales por Recepción.
  - [x] `PatientProfileView.jsx` con datos clínicos oficiales protegidos y edición de contacto.
- [x] **Fase de Pruebas:**
  - [x] **P5.1:** Activación con CI existente (éxito y asignación de contraseña segura).
  - [x] **P5.2:** Intento de activación con CI inexistente (rechazo con mensaje claro).
  - [x] **P5.3:** Paciente solo puede editar sus canales de contacto, nunca su CI o historia clínica legal.

#### ✅ CU06: Gestionar Médicos (RF03)
- [x] **Backend:**
  - [x] Migración de tablas `medicos` y `medico_especialidad`.
  - [x] Modelo `Doctor.php` con relación `belongsToMany` a especialidades con pivot `es_principal` y `belongsTo` a usuario.
  - [x] Validaciones `DoctorCreateRequest` y `DoctorUpdateRequest` (matrícula/código único, correo profesional, especialidad principal obligatoria).
  - [x] `DoctorsController.php`: CRUD, asignación atómica de especialidades, búsqueda y baja lógica (RN11).
  - [x] Auditoría en bitácora inmutable (CU03).
- [x] **Frontend:**
  - [x] Servicio `doctorService.js`.
  - [x] Vista `DoctorsManager.jsx` con 4 KPIs de médicos activos/inactivos, selector de especialidad y buscador en vivo.
  - [x] Modal `DoctorFormModal.jsx` con selector múltiple de especialidades, selección de principal y creación de credenciales.
  - [x] Modal `DoctorDetailModal.jsx` con especialidades, matrícula, contacto y estado clínico.
  - [x] Habilitada pestaña en `Sidebar.jsx` y `App.jsx` exclusivamente para rol `ADMIN` (según especificación PUDS de CU06).
- [x] **Fase de Pruebas:**
  - [x] **P6.1:** Registrar médico con código o matrícula duplicada (rechazo con HTTP 422).
  - [x] **P6.2:** Asignar múltiples especialidades con designación de principal.
  - [x] **P6.3:** Modificación de datos profesionales y teléfonos.
  - [x] **P6.4:** Desactivación lógica (RN04: médico inactivo no recibe citas).

#### ✅ CU07: Gestionar Especialidades Médicas (RF04)
- [x] **Backend:**
  - [x] Migración tabla `especialidades` con nombre normalizado único y rango etario (`edad_min_anios`, `edad_max_anios`).
  - [x] Modelo `Specialty.php` con scopes de búsqueda, activas y evaluación etaria `esAptaParaEdad()`.
  - [x] `SpecialtiesController.php`: CRUD y catálogo activo filtrable por edad del paciente.
  - [x] Seeder `SpecialtySeeder.php` con 8 especialidades y rangos etarios institucionales.
- [x] **Frontend:**
  - [x] `specialtyService.js`.
  - [x] Selectores de especialidad integrados en filtros y modales del sistema.
- [x] **Fase de Pruebas:**
  - [x] **P7.1:** Registro con nombre normalizado duplicado (rechazo con HTTP 422).
  - [x] **P7.2:** Validación de rango de edad coherente.
  - [x] **P7.3:** Compatibilidad etaria con pacientes (Pediatría <15, General 15-59, Geriatría ≥60).

#### ✅ CU08: Gestionar Horarios de Atención Médica (RF05)
- [x] **Backend:**
  - [x] Migración `disponibilidades` y `bloqueos_horario`.
  - [x] Validación de coherencia horaria (`hora_fin > hora_inicio`) y duración en minutos.
  - [x] Bloqueo de feriados institucionales y licencias médicas.
  - [x] Restricción de mutación mediante middleware `role:ADMIN` en `routes/api.php`.
- [x] **Frontend:**
  - [x] Configuración visual semanal por médico (días, franjas y duración de cita) restringida exclusivamente a `ADMIN`.
- [x] **Fase de Pruebas:**
  - [x] **P8.1:** Intentar guardar horario con hora fin menor o igual a hora inicio (rechazo con error visual y HTTP 422).
  - [x] **P8.2:** Asignación de días laborables (Lunes a Viernes / Sábado).
  - [x] **P8.3:** Registro de bloqueo de feriado general de la clínica.

---

### 📦 Paquete 3: Gestión de Citas Médicas (P3)

#### ✅ CU09: Consultar Disponibilidad de Horarios (RF05, RF06)
- [x] **Backend:**
  - [x] Algoritmo generador de slots libres según franja del médico menos citas ya reservadas y bloqueos.
  - [x] Filtro automático de fechas pasadas (RN06) y médicos inactivos (RN04).
- [x] **Frontend:**
  - [x] Selector interactivo de médico, fecha y visualización en cuadrícula de horas disponibles.
- [x] **Fase de Pruebas:**
  - [x] **P9.1:** Cálculo de intervalos exactos según duración configurada (ej. 30 min).
  - [x] **P9.2:** Descarte de horarios de citas ya confirmadas/programadas.
  - [x] **P9.3:** Descarte de feriados o bloqueos de agenda.

#### ✅ CU10: Programar Cita Médica (RF06, RF07)
- [x] **Backend:**
  - [x] Transacción `DB::transaction()` con `lockForUpdate()` pesimista para prevención estricta de colisiones concurrentes (Prueba #4).
  - [x] Generación atómica de correlativo único `CM-XXXX` (ej. `CM-0001`).
  - [x] Validación de compatibilidad etaria paciente-especialidad (`RF04` / Prueba P10.4).
  - [x] Validación de franja horaria activa del médico (`RF05` / Prueba #5).
  - [x] **Scoping y Blindaje Anti-IDOR:** Forzado estricto en servidor de `$data['id_paciente'] = $miPaciente->id_paciente` si el actor autenticado es `PACIENTE`.
  - [x] Registro inicial en `cita_estado_historial` y auditoría inmutable en `bitacora` (CU03).
- [x] **Frontend:**
  - [x] Servicio `appointmentService.js` (`fetchBookingFormData`, `fetchAppointments`, `bookAppointment`).
  - [x] Flujo guiado en 5 pasos (`AppointmentBookingModal.jsx`): Paciente → Especialidad/Médico → Horario/Slot → Confirmación/Modalidad → Ticket Oficial con opción de impresión.
  - [x] **Autoservicio Asistido:** Detección de sesión de paciente, preselección fija de su identidad con distintivo *"Tu Ficha Personal (Verificada)"* y bloqueo de suplantación.
  - [x] Panel gestor unificado (`AppointmentsManager.jsx`) con filtros (búsqueda textual, fecha, estado, médico), paginación y modal de ticket oficial.
  - [x] Conexión bidireccional con el Visor de Disponibilidad (`AppointmentAvailabilityViewer.jsx` / CU09).
- [x] **Fase de Pruebas:**
  - [x] **P10.1 (Prueba #3):** Programar cita en horario libre (éxito con generación de `CM-XXXX` y estado *Pendiente*).
  - [x] **P10.2 (Prueba #4):** Simular solicitudes concurrentes para el mismo médico y hora (`lockForUpdate()` garantiza que 1 gana y la colisión es rechazada con HTTP 409).
  - [x] **P10.3 (Prueba #5):** Intentar forzar cita fuera del horario de atención del médico (rechazo con HTTP 422).
  - [x] **P10.4:** Advertencia y validación de rango etario según la especialidad médica.
  - [x] **P10.5 (Anti-IDOR):** Paciente no puede manipular el payload HTTP para agendar a nombre de otro paciente.



#### ✅ CU11: Reprogramar Cita Médica (RF08)
- [x] **Backend:**
  - [x] Migración agregando campos 
eprogramada_en (timestamp) y motivo_reprogramacion (varchar 255) a tabla citas.
  - [x] Sincronización en DDL_Database_Clinica_LaCruz.sql.
  - [x] Modelo Cita.php con métodos puedeReprogramarse(): bool y 
eprogramar(...).
  - [x] FormRequest AppointmentRescheduleRequest (validación de fecha futura, hora, duración y motivo obligatorio min:5).
  - [x] Servicio transaccional AppointmentRescheduleService con lockForUpdate(), validación de agenda médica (RN05), bloqueos/feriados y anti-colisión excluyendo la propia cita (RF07).
  - [x] Controlador AppointmentsController::reschedule() y ruta PATCH /api/appointments/{id}/reschedule con control RBAC (ADMIN, RECEPCIONISTA, PACIENTE).
  - [x] Auditoría inmutable en Bitacora.php (CU03) e historial de estados en cita_estado_historial.
- [x] **Frontend:**
  - [x] Servicio ppointmentService.rescheduleAppointment(id, data) (PATCH).
  - [x] Modal interactivo AppointmentRescheduleModal.jsx con diseño distintivo (paleta turquesa/verde esmeralda, micro-transiciones fluidas, comparativa visual Antes ➔ Después).
  - [x] Selector dinámico de nueva fecha con consulta en tiempo real de turnos libres (CU09).
  - [x] Contador interactivo y validación reactiva de motivo obligatorio (mínimo 5 caracteres).
  - [x] Botón 'Reprogramar' integrado en AppointmentsManager.jsx y PatientAppointmentHistoryModal.jsx.
  - [x] Indicador visual de citas reprogramadas en listados e historiales.
- [x] **Fase de Pruebas:**
  - [x] Casos de prueba documentados en docs/informes/PRUEBAS_CAJA_NEGRA.md (CN-CU11-01 a CN-CU11-11).
  - [x] Verificación de anti-colisión transaccional y rechazo de solapamientos (409 Conflict).
  - [x] Verificación de validación de motivo obligatorio menor a 5 caracteres (422 Unprocessable).
  - [x] Verificación de compilación limpia de frontend (
pm run build exitoso).

#### ✅ CU12: Cancelar Cita Médica (RF09)
- [x] **Backend:**
  - [x] Endpoint `POST /api/appointments/{id}/cancel` con validación `AppointmentCancelRequest` (`motivo_cancelacion` min:5, max:500).
  - [x] Control transaccional atómico: validación de estado (no `ATENDIDA` ni `CANCELADA`), scoping de roles (paciente, médico, recepcionista, admin).
  - [x] Transición a estado `CANCELADA` con registro de motivo, fecha y usuario cancelador (`$cita->cancelar()`).
  - [x] Liberación instantánea del cupo horario para el algoritmo de disponibilidad (`AppointmentAvailabilityService`) sin borrado físico (RN09, RN11).
  - [x] Registro inmutable en `bitacora` (CU03) y en `cita_estado_historial`.
- [x] **Frontend:**
  - [x] Servicio `appointmentService.cancelAppointment(id, motivo)`.
  - [x] Modal interactivo `AppointmentCancelModal.jsx` con contador de caracteres, advertencia de liberación de cupo y confirmación.
  - [x] Botón "Cancelar" en acciones de cita en `AppointmentsManager.jsx`, `DoctorAgendaView.jsx` y `PatientAppointmentHistoryModal.jsx`.
- [x] **Fase de Pruebas:**
  - [x] **P12.1 (Prueba #6):** Cancelar cita (cupo queda libre para nuevo paciente y cita permanece en base de datos con motivo).
  - [x] **P12.2:** Intento de cancelación sin motivo o con menos de 5 caracteres (rechazado por validación HTTP 422).
  - [x] **P12.3:** Intento de cancelar cita ya atendida (bloqueado con HTTP 422).

#### ✅ CU14: Consultar Agenda Médica Diaria (RF11)
- [x] **Backend:**
  - [x] Endpoint `GET /api/appointments/doctor-agenda` filtrable por médico, fecha (`YYYY-MM-DD`) y estado.
  - [x] Restricción RBAC: médicos solo pueden consultar su propia agenda; admin/recepcionista pueden seleccionar cualquier médico.
  - [x] Cálculo dinámico de 4 KPIs de la jornada (total, por atender, atendidas, canceladas).
  - [x] Resolución de franja horaria configurada del médico (`Disponibilidad`) para el día consultado.
- [x] **Frontend:**
  - [x] Servicio `appointmentService.fetchDoctorAgenda(params)`.
  - [x] Componente `DoctorAgendaView.jsx` integrado como pestaña en `AppointmentsManager.jsx`.
  - [x] Navegación rápida por fecha (día anterior, atajo "Hoy", día siguiente), tarjeta informativa del médico y franja horaria.
  - [x] Cronograma timeline de citas con visualización de estado, modalidad, motivo y acciones directas (Ticket, Cancelar).
- [x] **Fase de Pruebas:**
  - [x] **P14.1 (Prueba #8):** Filtrar citas de un médico para una fecha específica (resultados precisos con horas de inicio/fin).
  - [x] **P14.2:** Médico solo ve sus propias citas asignadas.
  - [x] **P14.3:** Conteo exacto de KPIs diarios de atenciones.

#### ✅ CU15: Consultar Historial de Citas de Paciente (RF12)
- [x] **Backend:**
  - [x] Endpoint `GET /api/appointments/patient-history/{id}` ordenado cronológicamente descendente.
  - [x] Seguridad y privacidad RBAC: paciente solo puede consultar su propio historial en solo lectura; médicos, recepcionistas y admin pueden consultar a cualquier paciente.
  - [x] Cálculo de métricas globales del paciente: total de citas, atendidas, canceladas, pendientes, tasa de asistencia (%) y fechas extremas.
  - [x] Inclusión de motivo de consulta y motivo de cancelación sin pérdida de datos históricos (RN10 / RN11).
- [x] **Frontend:**
  - [x] Servicio `appointmentService.fetchPatientHistory(patientId, params)`.
  - [x] Modal integral `PatientAppointmentHistoryModal.jsx` con ficha del paciente, 4 KPIs históricos y filtro por estado.
  - [x] Botón "Ver Historial" en la columna de paciente dentro de la tabla de citas en `AppointmentsManager.jsx`.
- [x] **Fase de Pruebas:**
  - [x] **P15.1 (Prueba #7):** Consultar paciente y verificar que figuren todas sus citas históricas (atendidas, canceladas, pendientes).
  - [x] **P15.2:** Acceso de solo lectura para el paciente autenticado (sin permisos de edición de ficha legal).
  - [x] **P15.3:** Auditoría del cálculo de tasa de asistencia del paciente.

---

## 🌟 CICLO 2: Clínico, Integraciones, Pagos y Analítica
> **Objetivo:** Completar funcionalidades avanzadas, expediente clínico, reportes gerenciales (RF13) e integraciones.  
> **Fecha Límite:** Domingo 08 de Noviembre de 2026.

### 📦 Paquete 3: Gestión de Citas Médicas (Avanzado)

#### ⏳ CU11: Reprogramar Cita Médica (RF08)
- [ ] **Backend:**
  - [ ] Verificación de disponibilidad del nuevo horario bajo transacción.
  - [ ] Regla: Solo citas *Programada* o *Confirmada* pueden reprogramarse.
  - [ ] Citas *Atendidas* o *Canceladas* rechazan reprogramación.
- [ ] **Frontend:**
  - [ ] Modal de reprogramación con nuevo calendario y liberación inmediata del cupo anterior.
- [ ] **Fase de Pruebas:**
  - [ ] **P11.1:** Reprogramar cita a fecha libre futura (éxito y cupo previo liberado).
  - [ ] **P11.2:** Intentar reprogramar una cita ya atendida (bloqueado por regla de negocio).

#### ✅ CU13: Registrar Asistencia y Estado de Cita (RF10)
- [x] **Backend:**
  - [x] Máquina de estados: *Programada* → *Confirmada* → *Atendida* / *Inasistencia*.
  - [x] Constantes y matriz oficial de transiciones en `Cita.php` (`TRANSICIONES_VALIDAS`, `esEstadoTerminal()`, `puedeTransicionarA()`).
  - [x] Servicio transaccional `AppointmentStatusService` con `DB::transaction()` y `lockForUpdate()`.
  - [x] Restricción de saltos ilegales (estados terminales protegidos) y validaciones temporales (no inasistencia a citas futuras).
  - [x] Scoping RBAC: Médicos solo modifican sus citas (a *Atendida* o *Inasistencia*), Recepcionistas/Admin gestionan confirmación/inasistencia, Pacientes bloqueados con HTTP 403.
  - [x] FormRequest `AppointmentChangeStatusRequest` con validación estricta y mensajes amigables.
  - [x] Endpoints `PATCH /api/appointments/{id}/status` y `GET /api/appointments/{id}/status-history` en `AppointmentsController`.
  - [x] Auditoría inmutable en `bitacora` (CU03) y registro secuencial en `cita_estado_historial`.
- [ ] **Frontend:**
  - [ ] Botones de cambio de estado rápido en el mostrador de recepción.
- [ ] **Fase de Pruebas:**
  - [ ] **P13.1:** Marcar asistencia presencial (*Confirmada*).
  - [ ] **P13.2:** Marcar *Inasistencia* al finalizar el turno.
  - [ ] **P13.3:** Rechazar transición ilegal.

### 📦 Paquete 4: Historial Clínico y Consultas (P4)

#### ✅ CU16: Registrar Consulta Médica (Extra)
- [x] **Backend:** Registro de motivo, triaje/signos vitales, diagnóstico CIE y conducta. Transición automática de cita a *Atendida*.
- [x] **Frontend:** Formulario clínico de atención para el médico (`ConsultaRegistroModal.jsx`).
- [x] **Fase de Pruebas:** Transición inmediata de cita a atendida tras guardar consulta médica.

#### ✅ CU17: Gestionar Antecedentes Médicos (Extra)
- [x] **Backend:** Catálogo y registro de antecedentes en 5 categorías (Patológicos, Quirúrgicos, Alérgicos, Familiares, Farmacológicos) con resiliencia de historia clínica, validación anti-duplicados, baja lógica (RN11), scoping RBAC/anti-IDOR y auditoría inmutable en `bitacora`.
- [x] **Frontend:** Servicio `antecedenteService.js`, modal de formulario `AntecedenteFormModal.jsx` con chips rápidos y 5 categorías, gestor integral `AntecedentesPatientModal.jsx` con filtrado por pestañas y baja lógica RN11, e integración reactiva con alertas alérgicas en `ConsultaRegistroModal.jsx`, `ConsultasManager.jsx` y `PatientsManager.jsx`.
- [x] **Fase de Pruebas:** Persistencia en ficha permanente del paciente, reactividad de advertencias de alergias en tiempo real, 10 casos de prueba documentados (`CN-CU17-01` a `CN-CU17-10`).

#### ✅ CU18: Gestionar Expediente Clínico Digital — Emisión de Recetas Médicas (Extra)
- [x] **Backend:**
  - [x] Modelos de dominio `Receta.php` y `RecetaDetalle.php` enriquecidos con constantes, scopes y relaciones Eloquent.
  - [x] Migración `2026_11_07_000001_add_motivo_anulacion_to_recetas_table.php` para auditoría de baja lógica (`motivo_anulacion`, `anulado_en`).
  - [x] FormRequests: `RecetaCreateRequest.php` (validación estricta de array no vacío de medicamentos, dosis, frecuencia y duración) y `RecetaAnularRequest.php` (motivo min:5).
  - [x] Servicio de dominio `RecetaService.php` con transacciones atómicas `DB::transaction()`, control Anti-IDOR para médicos asignados y auditoría inmutable en `Bitacora.php` (`EMITIR_RECETA`, `ANULAR_RECETA`).
  - [x] Controlador REST `RecetasController.php` y 5 rutas en `routes/api.php` bajo prefijo `medical-records` con control RBAC.
- [x] **Frontend:**
  - [x] Servicio API `recetaService.js` (`fetchRecetas`, `fetchRecetaById`, `fetchRecetasByConsulta`, `emitirReceta`, `anularReceta`).
  - [x] Modal reactivo de prescripción médica `RecetaPrescripcionModal.jsx` con renglones posológicos dinámicos, atajos rápidos de dosis/frecuencia/duración y alerta prominente de alergias de CU17.
  - [x] Visor oficial membretado `RecetaDetailModal.jsx` con formato institucional, RP (℞), datos del facultativo, CSS `@media print` para impresión directa y marca de agua en anuladas.
  - [x] Modal `RecetaAnularModal.jsx` para baja lógica permanente con motivo justificado (RN11).
  - [x] Gestor integral de prescripciones `RecetasManager.jsx` con 3 tarjetas KPI, buscador en vivo, filtros por estado y fecha, paginación e integración en `Sidebar.jsx` y `App.jsx`.
- [x] **Fase de Pruebas:**
  - [x] **P18.1:** Emisión de receta con 2 o más medicamentos vinculados a la consulta médica.
  - [x] **P18.2:** Rechazo de prescripción sin renglones posológicos (HTTP 422).
  - [x] **P18.3:** Bloqueo Anti-IDOR: médico no asignado a la consulta no puede recetar (HTTP 403).
  - [x] **P18.4:** Anulación lógica inmutable con motivo justificado (RN11).
  - [x] **P18.5:** Compilación limpia en Vite (`npm run build` en 22.45s, 0 errores).

#### ⏳ CU19: Consultar Expediente Médico y Antecedentes (3.4)
- [x] **Backend:** Endpoint con autorización estricta: paciente solo lee su expediente; médico lee el de sus pacientes (ExpedienteService + ExpedienteController).
- [x] **Frontend:** Vista de expediente en solo lectura para portal de pacientes y visor clínico integral para personal médico/admin (`ExpedienteClinicoView.jsx` con transiciones fluidas, timeline cronológico y `@media print`).
- [x] **Fase de Pruebas:** Scoping RBAC / Anti-IDOR validado (HTTP 403 Forbidden para pacientes consultando expedientes ajenos o recepcionistas) y compilación limpia en producción (`npm run build` en 27.44s, 0 errores).

#### ✅ CU25: Emitir Órdenes de Exámenes Auxiliares (Extra)
- [x] **Backend:**
  - [x] Migración `2026_11_07_000003_add_motivo_cancelacion_to_ordenes_examenes_table.php` (baja lógica RN11).
  - [x] Modelo `OrdenExamen.php` con constantes, métodos de negocio (`puedeCancelarse()`, `cancelar()`, `marcarConResultados()`) y relaciones.
  - [x] FormRequests: `OrdenExamenCreateRequest.php` y `OrdenExamenAnularRequest.php` (motivo min:5).
  - [x] Servicio transaccional `OrdenExamenService.php` con generador atómico `ORD-XXXX`, control Anti-IDOR y auditoría inmutable en `Bitacora.php`.
  - [x] Controlador REST `OrdenesExamenesController.php` con 6 endpoints en `routes/api.php` bajo `/api/medical-records/ordenes-examenes`.
  - [x] Integración en `ExpedienteService.php` para listado unificado y eventos en línea de tiempo (timeline).
- [x] **Frontend:**
  - [x] Servicio API `ordenExamenService.js` (`fetchOrdenes`, `fetchOrdenById`, `fetchOrdenesByConsulta`, `fetchOrdenesByHistoria`, `emitirOrden`, `anularOrden`).
  - [x] Modal interactivo `OrdenExamenFormModal.jsx` con diseño institucional Deep Aqua, chips de estudios predefinidos, atajos de preparación, scroll-lock y `createPortal`.
  - [x] Pestaña oficial "Órdenes de Exámenes" integrada en `ExpedienteClinicoView.jsx` con tarjetas informativas, badges de estado (`PENDIENTE`, `CON_RESULTADOS`, `CANCELADA`), modal de cancelación con motivo justificado (RN11) y conexión bidireccional hacia CU26 para subir resultados.
- [x] **Fase de Pruebas:**
  - [x] Emisión exitosa de orden con correlativo secuencial `ORD-0001` y validación de tipos válidos.
  - [x] Enlace relacional con la consulta médica, el médico y la historia clínica del paciente.
  - [x] Cancelación lógica con motivo obligatorio (RN11) bloqueando cancelaciones sobre órdenes ya procesadas.
  - [x] Compilación limpia de producción en React + Vite (`npm run build` sin errores en 2044 módulos).

#### ✅ CU26: Gestionar Documentos Clínicos Adjuntos (Extra)
- [x] **Backend:** Endpoint de subida segura de archivos (PDF, JPG, PNG, DICOM) con Cloudinary, Anti-IDOR y enlace opcional a órdenes auxiliares CU25 (DocumentoClinicoService + DocumentosClinicosController).
- [x] **Frontend:** `ClinicalDocumentsSection.jsx` y `documentoClinicoService.js` con soporte dual (autónomo / CU25), barra de progreso multipart, previsualización de imágenes/PDF y asistente para visor DICOM externo (`IMAIOS`).
- [x] **Fase de Pruebas:** Subida a Cloudinary, descarga segura, enlace con CU25 (`CON_RESULTADOS`), protección Anti-IDOR y registro inmutable en Bitácora (pruebas `CN-CU26-01` a `CN-CU26-08`).

---

### 📦 Paquete 5: Integraciones Externas y Pagos (P5)

#### ✅ CU20: Enviar Recordatorios y Notificaciones (3.4 / Cron)
- [x] **Backend:**
  - [x] Modelo `Notificacion.php` enriquecido con constantes de tipo (`RECORDATORIO_24H`, `CONFIRMACION`, `REPROGRAMACION`, `CANCELACION`, `PAGO_EXITOSO`), scopes (`noLeidas`, `paraUsuario`, `porTipo`) y método `marcarComoLeida()`.
  - [x] Relación `notificaciones()` registrada en el modelo `User.php`.
  - [x] `NotificationService.php`: Servicio orquestador central con métodos de emisión de notificaciones, resolución de cuentas de pacientes/médicos, idempotencia estricta en recordatorios 24h y registro de auditoría inmutable en `Bitacora.php`.
  - [x] Integración en ciclo de vida de citas:
    - `AppointmentBookingService.php`: Dispara notificación automática de confirmación a paciente y médico al reservar cita.
    - `AppointmentRescheduleService.php`: Dispara notificación automática de reprogramación a paciente y médico.
    - `AppointmentsController.php`: Dispara notificación automática de cancelación a paciente y médico.
    - `StripePaymentService.php`: Dispara comprobante de pago garantizado tras confirmación exitosa con Stripe.
  - [x] Comando de Consola Artisan `SendAppointmentRemindersCommand.php` (`php artisan appointments:send-reminders` con opciones `--force` y `--cita=ID`).
  - [x] Registro en `backend/routes/console.php` con programación `Schedule::command('appointments:send-reminders')->dailyAt('08:00');`.
  - [x] `NotificationsController.php`: Endpoints REST (`index`, `unreadCount`, `markAsRead`, `markAllAsRead`, `destroy`, `triggerReminders`).
  - [x] Rutas registradas en `routes/api.php` bajo `/api/notifications/` con control RBAC y middleware `web`.
- [x] **Frontend:**
  - [x] `notificationService.js`: Cliente API para consultas, marcas de lectura, eliminación y disparo forzado del planificador.
  - [x] `NotificationsDropdown.jsx`: Componente interactivo en cabecera con badge numérico en tiempo real, polling ligero cada 30s, pestañas ("Todas", "No leídas", "Recordatorios 24h"), iconos específicos por tipo de evento, marcas de lectura individual/colectiva y botón "Probar 24h Ahora" para demostración docente.
- [x] **Fase de Pruebas:**
  - [x] Verificación del comando `php artisan appointments:send-reminders` en terminal.
  - [x] Prueba end-to-end con script de prueba: recordatorios generados a paciente y médico con éxito, detección de idempotencia, y marcado como leído.
  - [x] Verificación de 0 errores en compilación de Frontend (`npm run build`).

#### ✅ CU21: Pagar Cita Médica con Stripe Sandbox (Extra)
- [x] **Backend:**
  - [x] Migración `2026_11_07_000004_add_details_to_pagos_and_citas_table.php` ejecutada (`codigo_pago`, `moneda`, `tarjeta_marca`, `tarjeta_ultimos4`, `descripcion`, `recibo_url` en `pagos`; `pagada`, `monto_pago` en `citas`).
  - [x] Configuración en `config/services.php` para credenciales Stripe (`key`, `secret`, `currency`).
  - [x] `Pago.php`: Modelo con constantes (`COMPLETADO`, `FALLIDO`, `REEMBOLSADO`, `PENDIENTE`), relaciones Eloquent foráneas y casts numéricos.
  - [x] `Cita.php`: Actualizado con campos `pagada`, `monto_pago` y relaciones `pagos()` y `pago()`.
  - [x] `StripePaymentService.php`: Correlativo atómico `PAG-XXXX`, integración REST nativa con Stripe API (`PaymentIntents`, `charges`), manejo seguro con tarjeta de pruebas `pm_card_visa`, confirmación transaccional `DB::transaction()` y auditoría inmutable en `Bitacora.php`.
  - [x] `ProcessPaymentRequest.php`: Validación estricta de monto, método de pago y correo electrónico.
  - [x] `PaymentsController.php`: Endpoints REST (`index`, `createIntent`, `process`, `receipt`).
  - [x] 4 rutas registradas en `routes/api.php` bajo `/api/payments`.
- [x] **Frontend:**
  - [x] `paymentService.js`: Cliente API para crear intenciones de pago, procesar transacciones y emitir comprobantes.
  - [x] `StripePaymentModal.jsx`: Modal interactivo en dos pasos (formulario de tarjeta con botón de auto-llenado demo `4242...` y pantalla de comprobante digital emitido con soporte de impresión).
  - [x] Integración en `AppointmentsManager.jsx`: Botón contextual "Pagar", badge de estado "Pagada" / "Pendiente de Pago" y visualización de estatus de cobro en modal de Ticket oficial.
- [x] **Fase de Pruebas:**
  - [x] Cobro exitoso con tarjeta de prueba en Stripe Sandbox (balance y cargo verificados contra API de Stripe).
  - [x] Actualización atómica de `citas.pagada = true` y creación de registro `PAG-XXXX` en PostgreSQL.
  - [x] Generación de comprobante digital de pago imprimible.

---

### 📦 Paquete 6: Reportes y Analítica (P6)

#### ✅ CU22: Generar Reportes con Filtros Dinámicos (RF13)
- [x] **Backend:**
  - [x] Reporte 1: Citas por fecha / rango de fechas cronológico con promedios diarios.
  - [x] Reporte 2: Citas por médico asignado con tasas individuales de atención y cancelaciones.
  - [x] Reporte 3: Citas por especialidad médica con porcentaje de participación y balance estimado.
  - [x] Reporte 4: Citas por estado (Programadas, Atendidas, Canceladas, Inasistencias) con desglose de motivos de anulación (RN09/RN11).
  - [x] Reporte 5: Pacientes registrados con segmentación etaria (Pediátricos <15, Adultos 15-59, Geriátricos 60+) y estado de cuentas web.
  - [x] Reporte 6: Balance consolidado y rendimiento operativo (ingresos, pagos Stripe completados, tasa de pérdida).
  - [x] Reporte 7: Agenda médica diaria por profesional con franja horaria configurada.
  - [x] Servicio transaccional `DynamicReportService.php` y controlador `ReportsController.php`.
  - [x] Exportación nativa Streamed CSV con codificación UTF-8 + BOM (`/export-csv`).
  - [x] 3 rutas protegidas registradas en `routes/api.php` bajo `/api/analytics/reports`.
  - [x] Auditoría inmutable en `Bitacora.php` (`GENERAR_REPORTE_DINAMICO`).
- [x] **Frontend:**
  - [x] Servicio `dynamicReportService.js` para consumo de catálogos, datos y descargas.
  - [x] Vista interactiva `DynamicReportsView.jsx` con selector de 7 pestañas, barra de filtros contextual (fechas, médico, especialidad, estado, grupo etario).
  - [x] Bloque de KPIs ejecutivos interactivos, desgloses visuales de distribución y tabla con buscador en vivo y paginación.
  - [x] Descarga de CSV y soporte oficial de impresión estructurada `@media print` con membrete del Centro Médico La Cruz.
  - [x] Integración en `Sidebar.jsx`, `App.jsx` e `InicioPanelView.jsx`.
- [x] **Fase de Pruebas:**
  - [x] Verificación de consistencia de los 7 reportes contra registros reales de PostgreSQL (`clinica_db`).
  - [x] Verificación de filtros etarios matemáticos y scoping por rol médico.
  - [x] Compilación limpia de frontend con Vite (0 errores).

#### ✅ CU23: Generar Reporte Personalizado por Voz con IA (Extra)
- [x] **Backend:**
  - [x] Motor híbrido de NLP determinístico en PHP (`VoiceCommandParserService.php`) con cálculo dinámico de fechas Carbon y soporte opcional a Gemini API.
  - [x] Servicio transaccional `VoiceReportService.php` con queries optimizadas Eloquent, métricas de asistencia y guardado en `reportes_ia`.
  - [x] Controlador REST `VoiceReportController.php` con endpoints `/api/analytics/voice-report`, `/voice-history` y `/voice-stats` bajo RBAC (`ADMIN`, `MEDICO`).
  - [x] Registro inmutable en `bitacora` (CU03) y prueba de caja negra automatizada `VoiceReportTest.php`.
- [x] **Frontend:**
  - [x] Servicio `analyticsService.js` con método de exportación a CSV.
  - [x] Vista interactiva `VoiceReportAssistant.jsx` con Web Speech API (`window.webkitSpeechRecognition`), animación de ondas de audio, transcripción en tiempo real y fallback manual.
  - [x] Tarjetas de métricas calculadas (Total, Atendidas, Canceladas, Tasa de Asistencia), badges de filtros detectados y tabla con buscador en vivo.
  - [x] Integración en `Sidebar.jsx` y `App.jsx` bajo el paquete "Reportes y Analítica (P6)".
- [x] **Fase de Pruebas:**
  - [x] Dictado: *"Citas canceladas de este mes"*, *"Atenciones de hoy"*, *"Balance de la semana pasada"* resolviendo fechas y filtros en PostgreSQL.
  - [x] Fallback de escritura manual cuando no hay permisos de micrófono.

#### ✅ CU24: Consultar Dashboard Administrativo y KPIs (Extra)
- [x] **Backend:** Endpoint de agregación analítica en tiempo real (`DashboardController.php` - `GET /api/analytics/dashboard-kpis`) con scoping por rol y filtros temporales (`hoy`, `7d`, `30d`, `mes`, custom).
- [x] **Frontend:** Panel visual ejecutivo (`ClinicalDashboardView.jsx` y `InicioPanelView.jsx`) con tarjetas KPI, selector de períodos, desglose de estados y operativo diario.
- [x] **Fase de Pruebas:** Verificación de consistencia entre los KPIs mostrados y los registros en PostgreSQL (`clinica_db`), compilación limpia con Vite.

#### 🟡 CU27-RES: Exportar Expediente Clínico y Receta en PDF (Reserva Condicional / Subfunción CU18-19)
- [ ] Generación de documentos descargables con membrete oficial e impresión.

#### 🟡 CU28-OPC: Diagnóstico Asistido por IA (Reserva Condicional)
- [ ] Módulo opcional de asistencia secundaria bajo solicitud explícita del médico.

---

## 🛠️ Convención de Calidad y Criterios "Definition of Done" (DoD)

Para marcar un Caso de Uso como completado `[x]`, debe cumplir sin excepción:
1. **Reglas de Negocio:** Aplica estrictamente las reglas RN01 a RN14 del examen.
2. **Baja Lógica (RN11):** No utiliza `DELETE` en tablas con historial clínico.
3. **Validación Dual:** Validación en cliente (React) y en servidor con FormRequest (Laravel).
4. **Seguridad y Auditoría:** Endpoints protegidos por middleware de rol y registrados en `Bitacora.php` (CU03).
5. **Diseño Responsivo:** Sin errores de consola, con barras de desplazamiento independientes y compatible con móviles.
6. **Compilación Limpia:** `npm run build` en frontend y pruebas exitosas en backend.

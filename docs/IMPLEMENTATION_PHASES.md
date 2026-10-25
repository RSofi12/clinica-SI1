# 📋 Fases de Implementación y Checklist de Pruebas
### Clínica Vida Salud — Centro Médico La Cruz
> **Metodología:** PUDS / RUP  
> **Alcance:** Examen Parcial II — Sistemas de Información I  
> **Estructura:** 23 Casos de Uso (+ 1 Reserva Opcional) en 2 Ciclos de Desarrollo

---

## 📌 Resumen General de Avance

| Ciclo | Total CUs | CUs Completados | CUs Pendientes | Estado de Entrega |
|:---|:---:|:---:|:---:|:---|
| **Ciclo 1: Base Operativa y Cita de Punta a Punta** | 13 | 13 | 0 | 🟢 **100% Completado** (Meta superada anticipadamente) |
| **Ciclo 2: Clínico, Pagos y Analítica** | 10 (+1) | 0 | 10 (+1) | ⚪ Planificado (Meta: Domingo 08/11/2026) |
| **TOTAL GENERAL** | **23 (+1)** | **13** | **10 (+1)** | **Progreso Global: 56.5% (13 de 23 CUs)** |

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

#### ⏳ CU13: Registrar Asistencia y Estado de Cita (RF10)
- [ ] **Backend:**
  - [ ] Máquina de estados: *Programada* → *Confirmada* → *Atendida* / *Inasistencia*.
  - [ ] Restricción de saltos ilegales (ej. de *Cancelada* a *Atendida* rechazada).
- [ ] **Frontend:**
  - [ ] Botones de cambio de estado rápido en el mostrador de recepción.
- [ ] **Fase de Pruebas:**
  - [ ] **P13.1:** Marcar asistencia presencial (*Confirmada*).
  - [ ] **P13.2:** Marcar *Inasistencia* al finalizar el turno.
  - [ ] **P13.3:** Rechazar transición ilegal.

### 📦 Paquete 4: Historial Clínico y Consultas (P4)

#### ⏳ CU16: Registrar Consulta Médica (Extra)
- [ ] **Backend:** Registro de motivo, triaje/signos vitales, diagnóstico CIE y conducta. Transición automática de cita a *Atendida*.
- [ ] **Frontend:** Formulario clínico de atención para el médico.
- [ ] **Fase de Pruebas:** Transición inmediata de cita a atendida tras guardar consulta médica.

#### ⏳ CU17: Gestionar Antecedentes Médicos (Extra)
- [ ] **Backend:** Catálogo y registro de antecedentes patológicos, quirúrgicos, alérgicos y farmacológicos.
- [ ] **Frontend:** Resumen clínico de alertas (ej. alergia a penicilina destacada en rojo).
- [ ] **Fase de Pruebas:** Persistencia en ficha permanente del paciente.

#### ⏳ CU18: Gestionar Expediente Clínico Digital (Extra)
- [ ] **Backend:** Notas de evolución médica, recetas estructuradas y órdenes de laboratorio.
- [ ] **Frontend:** Editor médico con firma digital simulada e impresión.
- [ ] **Fase de Pruebas:** Control de acceso estricto: solo el médico puede emitir recetas.

#### ⏳ CU19: Consultar Expediente Médico y Antecedentes (3.4)
- [ ] **Backend:** Endpoint con autorización estricta: paciente solo lee su expediente; médico lee el de sus pacientes.
- [ ] **Frontend:** Vista de expediente en solo lectura para el portal del paciente.
- [ ] **Fase de Pruebas:** Intentar consultar expediente de otro paciente por ID (HTTP 403 Forbidden).

---

### 📦 Paquete 5: Integraciones Externas y Pagos (P5)

#### ⏳ CU20: Enviar Recordatorios y Notificaciones (3.4 / Cron)
- [ ] **Backend:** Comando Laravel Schedule (`php artisan appointments:remind`) para avisos 24h antes.
- [ ] **Frontend:** Notificaciones en interfaz y panel de configuración de avisos.
- [ ] **Fase de Pruebas:** Ejecución de tarea programada sin duplicar recordatorios.

#### ⏳ CU21: Pagar Cita Médica con Stripe Sandbox (Extra)
- [ ] **Backend:** Integración con Stripe SDK (modo de pruebas con tarjetas demo `4242...`).
- [ ] **Frontend:** Formulario con Stripe Elements o Checkout simulado.
- [ ] **Fase de Pruebas:** Cobro exitoso y confirmación garantizada de cita.

---

### 📦 Paquete 6: Reportes y Analítica (P6)

#### ⏳ CU22: Generar Reportes con Filtros Dinámicos (RF13)
- [ ] **Backend:**
  - [ ] Reporte 1: Citas por fecha.
  - [ ] Reporte 2: Citas por médico.
  - [ ] Reporte 3: Citas por especialidad.
  - [ ] Reporte 4: Citas por estado (Programadas, Atendidas, Canceladas, Inasistencias).
  - [ ] Reporte 5: Pacientes registrados.
  - [ ] Reporte 6: Balance y totales en período.
  - [ ] Reporte 7: Agenda diaria por médico.
  - [ ] Exportación a formato CSV / PDF.
- [ ] **Frontend:** Módulo de analítica con gráficos, filtros de fecha y botón de exportación.
- [ ] **Fase de Pruebas:** Comparación de totales del reporte contra conteos reales en PostgreSQL.

#### ⏳ CU23: Generar Reporte Personalizado por Voz con IA (Extra)
- [ ] **Backend:** Integración API con servicio LLM (OpenAI / Gemini) para parsing de intención y parámetros SQL.
- [ ] **Frontend:** Botón de micrófono con Web Speech API en el navegador.
- [ ] **Fase de Pruebas:** Dictar: *"Muéstrame las citas canceladas del doctor Carlos esta semana"* y verificar filtros generados.

#### 🟡 CU24-OPC: Diagnóstico Asistido por IA (Reserva Condicional)
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

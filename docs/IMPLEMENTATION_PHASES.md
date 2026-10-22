# 📋 Fases de Implementación y Checklist de Pruebas
### Clínica Vida Salud — Centro Médico La Cruz
> **Metodología:** PUDS / RUP  
> **Alcance:** Examen Parcial II — Sistemas de Información I  
> **Estructura:** 23 Casos de Uso (+ 1 Reserva Opcional) en 2 Ciclos de Desarrollo

---

## 📌 Resumen General de Avance

| Ciclo | Total CUs | CUs Completados | CUs Pendientes | Estado de Entrega |
|:---|:---:|:---:|:---:|:---|
| **Ciclo 1: Base Operativa y Cita de Punta a Punta** | 13 | 7 | 6 | 🟡 En Desarrollo (Meta: Domingo 25/10/2026 — 53.8%) |
| **Ciclo 2: Clínico, Pagos y Analítica** | 10 (+1) | 0 | 10 (+1) | ⚪ Planificado (Meta: Domingo 08/11/2026) |
| **TOTAL GENERAL** | **23 (+1)** | **7** | **16 (+1)** | **Progreso Global: 30.4%** |

---

## 🧪 Matriz de las 10 Pruebas Mínimas del Examen Oficial

Estas 10 pruebas son de demostración obligatoria ante el docente:

| N.° | Prueba Exigida | Caso de Uso | Requisito | Estado | Criterio de Aceptación / Verificación |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | Registrar un paciente nuevo | **CU04** | RF02 | ✅ Superada | Paciente guardado con correlativo `HC-XXXX`, grupo etario y auditoría. |
| **2** | Registrar un paciente con CI duplicado | **CU04** | RF02 | ✅ Superada | Servidor rechaza con HTTP 422 y mensaje de unicidad de documento. |
| **3** | Programar una cita en horario disponible | **CU10** | RF06 / RF07 | ⏳ Pendiente | Cita queda guardada con correlativo único `CM-XXXX` y estado *Programada*. |
| **4** | Programar otra cita superpuesta para el mismo médico | **CU10** | RF07 / RN07 | ⏳ Pendiente | Servidor bloquea colisión atómicamente dentro de `DB::transaction()`. |
| **5** | Intentar reservar fuera del horario médico | **CU10** | RF05 / RN05 | ⏳ Pendiente | Servidor rechaza si no coincide con las franjas horarias del médico. |
| **6** | Cancelar una cita | **CU12** | RF09 / RN09 | ⏳ Pendiente | Pasa a estado *Cancelada* con motivo obligatorio, libera cupo y mantiene histórico. |
| **7** | Consultar el historial de un paciente | **CU15** | RF12 / RN10 | ⏳ Pendiente | Cronología completa de citas previas, atendidas y canceladas sin pérdida. |
| **8** | Buscar las citas de un médico por fecha | **CU14** | RF11 | ⏳ Pendiente | Vista de agenda médica filtrando por fecha, paciente, especialidad y estado. |
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
  - [x] Habilitada pestaña en `Sidebar.jsx` para roles `ADMIN` y `RECEPCIONISTA`.
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

#### ⏳ CU08: Gestionar Horarios de Atención Médica (RF05)
- [ ] **Backend:**
  - [ ] Migración `disponibilidades` y `bloqueos_horario`.
  - [ ] Validación de coherencia horaria (`hora_fin > hora_inicio`) y duración en minutos.
  - [ ] Bloqueo de feriados institucionales y licencias médicas.
- [ ] **Frontend:**
  - [ ] Configuración visual semanal por médico (días, franjas y duración de cita).
- [ ] **Fase de Pruebas:**
  - [ ] **P8.1:** Intentar guardar horario con hora fin menor o igual a hora inicio (rechazo).
  - [ ] **P8.2:** Asignación de días laborables (Lunes a Viernes / Sábado).
  - [ ] **P8.3:** Registro de bloqueo de feriado general de la clínica.

---

### 📦 Paquete 3: Gestión de Citas Médicas (P3)

#### ⏳ CU09: Consultar Disponibilidad de Horarios (RF05, RF06)
- [ ] **Backend:**
  - [ ] Algoritmo generador de slots libres según franja del médico menos citas ya reservadas y bloqueos.
  - [ ] Filtro automático de fechas pasadas (RN06) y médicos inactivos (RN04).
- [ ] **Frontend:**
  - [ ] Selector interactivo de médico, fecha y visualización en cuadrícula de horas disponibles.
- [ ] **Fase de Pruebas:**
  - [ ] **P9.1:** Cálculo de intervalos exactos según duración configurada (ej. 30 min).
  - [ ] **P9.2:** Descarte de horarios de citas ya confirmadas/programadas.
  - [ ] **P9.3:** Descarte de feriados o bloqueos de agenda.

#### ⏳ CU10: Programar Cita Médica (RF06, RF07)
- [ ] **Backend:**
  - [ ] Transacción `DB::transaction()` con `lockForUpdate()` para prevención anti-colisión.
  - [ ] Correlativo único `CM-XXXX`.
  - [ ] Validación de compatibilidad etaria paciente-especialidad.
- [ ] **Frontend:**
  - [ ] Flujo guiado de reserva de cita médica (Paciente → Especialidad → Médico → Horario → Confirmación).
- [ ] **Fase de Pruebas:**
  - [ ] **P10.1 (Prueba #3):** Programar cita en horario libre (éxito).
  - [ ] **P10.2 (Prueba #4):** Simular 2 solicitudes concurrentes para el mismo médico y hora (1 gana, la 2da es rechazada).
  - [ ] **P10.3 (Prueba #5):** Intentar forzar cita fuera del horario de atención del médico (rechazo).
  - [ ] **P10.4:** Advertencia o restricción de rango etario.

#### ⏳ CU12: Cancelar Cita Médica (RF09)
- [ ] **Backend:**
  - [ ] Transición a estado *Cancelada* con registro obligatorio del motivo.
  - [ ] Liberación instantánea del slot horario sin borrado físico (RN09, RN11).
- [ ] **Frontend:**
  - [ ] Modal de cancelación con campo obligatorio de motivo y feedback al usuario.
- [ ] **Fase de Pruebas:**
  - [ ] **P12.1 (Prueba #6):** Cancelar cita (cupo queda libre para nuevo paciente y cita permanece en base de datos).
  - [ ] **P12.2:** Intento de cancelación sin motivo (rechazado por validación).

#### ⏳ CU14: Consultar Agenda Médica Diaria (RF11)
- [ ] **Backend:**
  - [ ] Endpoint `/api/appointments/agenda` filtrable por médico, fecha y estado.
- [ ] **Frontend:**
  - [ ] Vista de agenda para el Médico y Recepcionista con visualización clara por horas y estados.
- [ ] **Fase de Pruebas:**
  - [ ] **P14.1 (Prueba #8):** Filtrar citas de un médico para una fecha específica (resultados precisos).
  - [ ] **P14.2:** Médico solo ve sus propias citas asignadas.

#### ⏳ CU15: Consultar Historial de Citas de Paciente (RF12)
- [ ] **Backend:**
  - [ ] Endpoint `/api/patients/{id}/appointments-history` ordenado cronológicamente.
- [ ] **Frontend:**
  - [ ] Pestaña en la ficha del paciente con citas atendidas, canceladas e inasistencias.
- [ ] **Fase de Pruebas:**
  - [ ] **P15.1 (Prueba #7):** Consultar paciente y verificar que figuren todas sus citas históricas.
  - [ ] **P15.2:** Acceso de solo lectura para el paciente autenticado.

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

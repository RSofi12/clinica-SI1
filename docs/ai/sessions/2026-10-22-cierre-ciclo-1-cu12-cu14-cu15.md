# Bitácora de Sesión: 2026-10-22 — Cierre del Ciclo 1 (CU12, CU14, CU15)
### Clínica Vida Salud — Centro Médico La Cruz
> **Metodología:** PUDS / RUP  
> **Alcance:** Examen Parcial II — Sistemas de Información I  
> **Grupo 14:** Raysa Rodriguez Laguna & Roberto Torrez Escalante  
> **Docente:** MSc. Ing. Angélica Garzón Cuéllar  

---

## 1. 🎯 Objetivo de la Sesión
Implementar y verificar el último lote de 3 Casos de Uso del **Ciclo 1**:
- **`CU12`**: Cancelar Cita Médica con motivo obligatorio y liberación inmediata de cupo (RF09 / Prueba #6).
- **`CU14`**: Consultar Agenda Médica Diaria por Médico y Fecha (RF11 / Prueba #8).
- **`CU15`**: Consultar Historial Cronológico de Citas del Paciente (RF12 / Prueba #7).

Con la finalización de este lote, el proyecto alcanza el **100% de ejecución del Ciclo 1 (13 de 13 Casos de Uso)** y supera de manera verificada las **10 de 10 pruebas mínimas exigidas por el examen oficial**.

---

## 2. 🛠️ Cambios en Backend (Laravel 13 / PHP 8.3 / PostgreSQL)

1. **FormRequest de Cancelación:**
   - [`AppointmentCancelRequest.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Requests/AppointmentCancelRequest.php):
     - `motivo_cancelacion`: Requerido, string, mín. 5 caracteres, máx. 500 caracteres (Prueba P12.2).

2. **Controlador de Citas ([`AppointmentsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AppointmentsController.php)):**
   - **`cancel(int $id, AppointmentCancelRequest $request)` (CU12 / RF09 / Prueba #6):**
     - Búsqueda de cita y validación de estados terminales (rechaza cancelar citas `ATENDIDA` o ya `CANCELADA` con HTTP 422).
     - Scoping RBAC: Pacientes solo cancelan sus propias citas; médicos cancelan citas de su propia agenda; personal de recepción y administradores pueden cancelar cualquier cita.
     - Transacción atómica ejecutando `$cita->cancelar($motivo, $idUsuario)`.
     - Liberación instantánea del slot horario: Dado que `Cita::scopeActivas()` excluye citas en estado `CANCELADA`, el motor en `AppointmentAvailabilityService` libera inmediatamente el cupo horario para nuevas reservas sin necesidad de borrado físico (RN09 / RN11).
     - Auditoría en `cita_estado_historial` y en `bitacora` inmutable (CU03).
   - **`doctorAgenda(Request $request)` (CU14 / RF11 / Prueba #8):**
     - Filtro por médico y fecha (`YYYY-MM-DD`).
     - Scoping RBAC: Médicos consultan exclusivamente su propia agenda médica; administradores y recepcionistas pueden consultar la agenda de cualquier médico del plantel.
     - Cálculo de 4 KPIs dinámicos de la jornada (total de citas, por atender, atendidas, canceladas).
     - Consulta de franjas horarias configuradas en `Disponibilidad` para el día de la semana (`dia_semana`).
     - Lista cronológica de citas del día con relaciones `paciente`, `especialidad` y `tipo_cita`.
   - **`patientHistory(int $pacienteId, Request $request)` (CU15 / RF12 / Prueba #7):**
     - Scoping RBAC: Pacientes autenticados solo pueden consultar su propia ficha médica en solo lectura; personal asistencial/administrativo puede consultar a cualquier paciente.
     - Cálculo de métricas globales: total de citas históricas, atendidas, canceladas, pendientes, tasa de asistencia (%) y fechas extremas (primera y última cita).
     - Cronología completa descendente (`fecha_hora_inicio DESC`) con motivos de consulta y cancelación (RN10 / RN11).

3. **Rutas de la API ([`backend/routes/api.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/routes/api.php)):**
   - `POST /api/appointments/{id}/cancel` -> `AppointmentsController@cancel`
   - `GET  /api/appointments/doctor-agenda` -> `AppointmentsController@doctorAgenda`
   - `GET  /api/appointments/patient-history/{id}` -> `AppointmentsController@patientHistory`

---

## 3. 🎨 Cambios en Frontend (React + JavaScript / Tailwind CSS)

1. **Servicio ([`appointmentService.js`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/services/appointmentService.js)):**
   - Métodos agregados: `cancelAppointment(id, motivo_cancelacion)`, `fetchDoctorAgenda(params)`, `fetchPatientHistory(patientId, params)`.

2. **Modal de Cancelación con Motivo Obligatorio ([`AppointmentCancelModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentCancelModal.jsx)):**
   - Resumen visual de la cita a cancelar (código, fecha, médico, paciente).
   - Alerta destacada sobre la liberación automática del turno horario.
   - Campo de texto con validación en vivo y contador de caracteres (mín. 5 caracteres).
   - Manejo de estados de carga, feedback de error y confirmación.

3. **Vista de Agenda Médica Diaria ([`DoctorAgendaView.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/DoctorAgendaView.jsx)):**
   - Selector dinámico de médico (para Admin y Recepción) o encabezado personalizado para el Médico autenticado.
   - Navegación rápida por fecha: Botón "Día anterior", selector tipo date picker, botón "Día siguiente" y atajo de un clic "Hoy".
   - Tarjeta informativa del médico con franja horaria configurada para el día.
   - 4 tarjetas KPIs de la jornada.
   - Timeline cronológico de citas del día con visualización de modalidad (Presencial / Teleconsulta), paciente, estado y acciones directas (Ticket, Cancelar).

4. **Modal de Historial Cronológico de Citas ([`PatientAppointmentHistoryModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/PatientAppointmentHistoryModal.jsx)):**
   - Ficha identificatoria del paciente con CI, N° de Historia (`HC-XXXX`) y teléfono.
   - 4 tarjetas de métricas históricas del paciente con tasa de asistencia porcentual.
   - Filtro interactivo por estado de cita y recarga rápida.
   - Listado cronológico de atenciones previas, vigentes y cancelaciones con motivo visible y scroll independiente.

5. **Integración en Panel Gestor ([`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx)):**
   - Incorporada pestaña *"Agenda Médica Diaria (CU14)"*.
   - Botón *"Ver Historial"* en la columna de paciente de la tabla de citas.
   - Botón *"Cancelar"* con icono `Ban` para citas en estado `PENDIENTE` o `CONFIRMADA`.
   - Modales de cancelación y de historial montados y sincronizados.

---

## 4. 🧪 Matriz de las 10 Pruebas Mínimas del Examen Oficial (100% Superadas)

| N.° | Prueba Exigida | Caso de Uso | Requisito | Estado | Verificación Realizada |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | Registrar un paciente nuevo | **CU04** | RF02 | ✅ Superada | Paciente guardado con correlativo `HC-XXXX`, grupo etario y auditoría. |
| **2** | Registrar un paciente con CI duplicado | **CU04** | RF02 | ✅ Superada | Servidor rechaza con HTTP 422 y mensaje de unicidad de documento. |
| **3** | Programar una cita en horario disponible | **CU10** | RF06 / RF07 | ✅ Superada | Cita guardada con correlativo único `CM-XXXX`, estado *Pendiente* y ticket oficial. |
| **4** | Programar otra cita superpuesta para el mismo médico | **CU10** | RF07 / RN07 | ✅ Superada | Servidor bloquea colisión atómicamente dentro de `DB::transaction()` con `lockForUpdate()`. |
| **5** | Intentar reservar fuera del horario médico | **CU10** | RF05 / RN05 | ✅ Superada | Servidor valida que el horario encaje en las franjas activas del médico (HTTP 422). |
| **6** | Cancelar una cita | **CU12** | RF09 / RN09 | ✅ Superada | Cita pasa a estado *Cancelada* con motivo obligatorio (mín. 5 chars), libera cupo y mantiene histórico en DB. |
| **7** | Consultar el historial de un paciente | **CU15** | RF12 / RN10 | ✅ Superada | Cronología completa de citas previas, atendidas y canceladas sin pérdida, con métricas de asistencia. |
| **8** | Buscar las citas de un médico por fecha | **CU14** | RF11 | ✅ Superada | Vista de agenda médica diaria filtrando por médico, fecha, atajos y KPIs de la jornada. |
| **9** | Ingresar a una página interna sin sesión válida | **CU01** | RF01 / RN12 | ✅ Superada | Middleware y cliente redirigen al login; API devuelve HTTP 401. |
| **10** | Ejecutar una operación con datos inválidos | Transversal | RF01-13 | ✅ Superada | FormRequests en Laravel devuelven HTTP 422 con array de errores tipados. |

---

## 5. 💻 Comandos a Ejecutar Tras Hacer Pull

Para cualquier compañero o evaluador que clone o actualice la rama `robert-dev`:

```powershell
# 1. En la carpeta backend/
cd backend
php artisan migrate
php artisan db:seed

# 2. En la carpeta frontend/
cd ../frontend
npm install
npm run build
```

---

## 6. 🛡️ Verificaciones de Calidad Realizadas

- **Sintaxis PHP (Backend):**
  - `php -l app/Packages/Appointments/Requests/AppointmentCancelRequest.php` -> `No syntax errors detected`
  - `php -l app/Packages/Appointments/Controllers/AppointmentsController.php` -> `No syntax errors detected`
  - `php -l routes/api.php` -> `No syntax errors detected`
- **Compilación Vite (Frontend):**
  - `npm run build` en `frontend/` ejecutado con éxito en 710ms (Código de salida: 0).
- **Git Hygiene:**
  - Scripts `.bat` excluidos mediante `.git/info/exclude`.
  - Sin archivos residuales ni modificaciones colaterales no deseadas.

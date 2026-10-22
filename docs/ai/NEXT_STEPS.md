# NEXT STEPS — CLÍNICA VIDA SALUD

> **Documento de Seguimiento Operativo:** Consulta [`docs/IMPLEMENTATION_PHASES.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/IMPLEMENTATION_PHASES.md) para el checklist exhaustivo de Casos de Uso, Fases de Prueba y Criterios de Aceptación por Ciclo.

## Ruta de Trabajo Inmediata — Ciclo 1 (Presentación 1: 25/Octubre/2026)

### Fase 1: Sincronización del Frontend (React + JavaScript)
- [x] Adaptar los archivos a `.jsx` (`App.jsx`, `HomePage.jsx`, `LoginPage.jsx`).
- [x] Frontend 100% JavaScript (ES6+) con Vite + Tailwind CSS.
- [x] Compilación limpia comprobada con `npm run build` en 0.7s sin errores.

### Fase 2: Diseño y Creación del Esquema de Base de Datos (PostgreSQL)
- [x] Script DDL y Migraciones Laravel para el **Ciclo 1**:
  - [x] `usuarios`, `roles`, `permisos`, `bitacora`, `configuracion_seguridad` (P1)
  - [x] `pacientes`, `contactos_emergencia`, `medicos`, `especialidades`, `medico_especialidad`, `disponibilidades`, `bloqueos_horario` (P2)
  - [x] `tipos_cita`, `citas`, `cita_estado_historial` con código único `CM-XXXX`, fechas, estados, motivo de consulta y motivo de cancelación (P3)
- [x] Variables de entorno `.env` en `/backend` para conexión a PostgreSQL 18 local (`clinica_db`).
- [x] Seeders completos ejecutados con datos base (Admin, Recepcionista, Médicos con especialidades y horarios semanales, Pacientes vinculados).

### Fase 3: Implementación de la Cita de Punta a Punta (Backend Laravel & React)
- [x] **P1 (Seguridad y Auditoría):** Autenticación con bloqueo por intentos, recuperación, RBAC y bitácora inmutable (CU01, CU02, CU03).
- [x] **P2 (Recursos Clínicos):** Padrón de Pacientes HC-XXXX (CU04), Portal Paciente CI (CU05), Plantel Médico y Especialidades (CU06, CU07) y Horarios de Atención Semanal y Feriados (CU08).
- [x] **P3 (Gestión de Citas Médicas):**
  - [x] **CU09:** Motor generador y consulta de disponibilidad de horarios libres por médico/fecha excluyendo citas y bloqueos (RF05, RF06).
  - [x] **CU10:** Servicio transaccional `AppointmentBookingService` con `DB::transaction()` + `lockForUpdate()`, código correlativo `CM-XXXX`, prevención anti-colisión transaccional, wizard asistido y emisión de ticket oficial (RF06, RF07).
  - [x] **CU12:** Cancelación de cita con motivo obligatorio y liberación de cupo (RF09 / Prueba #6).
  - [x] **CU14:** Consulta de agenda médica diaria por fecha y estado (RF11 / Prueba #8).
  - [x] **CU15:** Historial cronológico de citas del paciente (RF12 / Prueba #7).

### Fase 4: Pruebas Mínimas del Examen Oficial
- [x] **10 de 10 Pruebas Mínimas Superadas al 100%:**
  - [x] Prueba #1: Registrar paciente nuevo (CU04).
  - [x] Prueba #2: CI duplicado rechazado (CU04).
  - [x] Prueba #3: Programar cita con correlativo `CM-XXXX` (CU10).
  - [x] Prueba #4: Prevención de colisión concurrente con `lockForUpdate()` (CU10).
  - [x] Prueba #5: Intento fuera de horario rechazado con HTTP 422 (CU10).
  - [x] Prueba #6: Cancelar cita con motivo y liberación de cupo (CU12).
  - [x] Prueba #7: Consultar historial cronológico de paciente (CU15).
  - [x] Prueba #8: Consultar agenda médica por médico y fecha (CU14).
  - [x] Prueba #9: Bloqueo de acceso no autenticado HTTP 401 (CU01).
  - [x] Prueba #10: Validación de datos inválidos con FormRequest HTTP 422 (Transversal).

### Fase 5: Blindaje RBAC Global, Scoping Anti-IDOR y Homologación de Permisos (Ciclo 1)
- [x] Middleware `EnsureUserRole` implementado y registrado con alias `'role'`.
- [x] Protección perimetral de rutas en `routes/api.php` por grupos de roles.
- [x] Neutralización de IDOR en CU10 (`store()` fuerza `$data['id_paciente'] = $miPaciente->id_paciente`).
- [x] Scoping estricto de titularidad en `AppointmentsController` (`show()`, `cancel()`, `doctorAgenda()`, `patientHistory()`).
- [x] Bloqueo perimetral de `/api/patients` a pacientes para evitar fuga de padrón (CU04).
- [x] Alineación de CU06 y CU08 en Frontend (`Sidebar.jsx`, `App.jsx`) y Backend (`api.php`) al rol exclusivo `ADMIN`.
- [x] Asistente de reserva en frontend (`AppointmentBookingModal.jsx`) con auto-detección y bloqueo de ficha personal para pacientes.


---

## 🌟 Ruta de Trabajo para Ciclo 2 (Clínico, Pagos y Analítica)
1. **CU11:** Reprogramar Cita Médica (RF08) con nueva fecha/hora y liberación atómica del cupo anterior.
2. **CU13:** Registrar Asistencia y Estado de Cita (RF10 — *Programada* → *Confirmada* → *Atendida* / *Inasistencia*).
3. **CU16 - CU19:** Expediente Clínico Digital, Triaje, Recetas y Consultas Médicas.
4. **CU20 - CU23:** Notificaciones y Recordatorios automáticos, Pagos Stripe Sandbox y Reportes Gerenciales con Filtros Dinámicos (RF13).

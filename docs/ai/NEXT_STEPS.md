# NEXT STEPS — CLÍNICA VIDA SALUD

> **Documento de Seguimiento Operativo:** Consulta [`docs/IMPLEMENTATION_PHASES.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/IMPLEMENTATION_PHASES.md) para el checklist exhaustivo de Casos de Uso, Fases de Prueba y Criterios de Aceptación por Ciclo.

## Ruta de Trabajo Inmediata — Ciclo 1 (Presentación 1: 25/Octubre/2026)

### Fase 1: Sincronización del Frontend (React + JavaScript)
- [ ] Renombrar y adaptar los archivos `.tsx` a `.jsx` (`App.jsx`, `HomePage.jsx`, `LoginPage.jsx`).
- [ ] Eliminar referencias o dependencias de TypeScript si no son necesarias, asegurando compatibilidad nativa con Vite.
- [ ] Comprobar que `npm run dev` en `/frontend` levante limpiamente en modo JavaScript.

### Fase 2: Diseño y Creación del Esquema de Base de Datos (PostgreSQL)
- [ ] Diseñar el script DDL / Migraciones Laravel para el **Ciclo 1**:
  - `usuarios`, `roles`, `permisos` (P1)
  - `pacientes`, `medicos`, `especialidades`, `medico_especialidad`, `horarios_atencion` (P2)
  - `citas_medicas` con campos: código único, fechas, estados, motivo, motivo de cancelación (P3)
- [ ] Configurar variables de entorno `.env` en `/backend` para conexión a PostgreSQL.
- [ ] Crear Seeders iniciales con datos base (Admin, Recepcionista, Médicos con especialidades, horarios demo).

### Fase 3: Implementación de la Cita de Punta a Punta (Backend Laravel & React)
- [x] **P1 (Seguridad y Auditoría):** Autenticación con bloqueo por intentos, recuperación, RBAC y bitácora inmutable (CU01, CU02, CU03).
- [x] **P2 (Recursos Clínicos):** Padrón de Pacientes HC-XXXX (CU04), Portal Paciente CI (CU05), Plantel Médico y Especialidades (CU06, CU07) y Horarios de Atención Semanal y Feriados (CU08).
- [ ] **P3 (Gestión de Citas Médicas):**
  - [x] **CU09:** Motor generador y consulta de disponibilidad de horarios libres por médico/fecha excluyendo citas y bloqueos (RF05, RF06).
  - [x] **CU10:** Servicio transaccional `AppointmentBookingService` con `DB::transaction()` + `lockForUpdate()`, código correlativo `CM-XXXX`, prevención anti-colisión transaccional, wizard asistido y emisión de ticket oficial (RF06, RF07).
  - [ ] **CU12:** Cancelación de cita con motivo obligatorio y liberación de cupo (RF09 / Prueba #6).
  - [ ] **CU14:** Consulta de agenda médica diaria por fecha y estado (RF11 / Prueba #8).
  - [ ] **CU15:** Historial cronológico de citas del paciente (RF12 / Prueba #7).

### Fase 4: Pruebas Mínimas del Examen
- [ ] Ejecutar y verificar las **10 pruebas mínimas** requeridas por la docente para la entrega del Ciclo 1.

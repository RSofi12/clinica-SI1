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

### Fase 3: Implementación de la Cita de Punta a Punta (Backend Laravel)
- [ ] **P1 (Auth):** Controladores de Login, Logout y middleware de roles (CU01, CU02).
- [ ] **P2 (Recursos):** CRUD de Pacientes con validación de CI única (CU04), CRUD de Médicos y Especialidades (CU06, CU07) y Horarios (CU08).
- [ ] **P3 (Citas):**
  - Motor de cálculo de disponibilidad de horarios libres (CU09).
  - Servicio transaccional `AppointmentBookingService` con `DB::transaction()` anti-duplicados (CU10).
  - Reprogramación y Cancelación con liberación de cupo (CU11, CU12).
  - Máquina de estados y control de asistencia (CU13).
  - Agenda médica diaria (CU14) e historial de citas (CU15).

### Fase 4: Pruebas Mínimas del Examen
- [ ] Ejecutar y verificar las **10 pruebas mínimas** requeridas por la docente para la entrega del Ciclo 1.

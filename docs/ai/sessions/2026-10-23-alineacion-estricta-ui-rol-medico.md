# Sesión: Alineación Estricta de Interfaz y Permisos para el Rol Médico (CU14 / CU15)
**Fecha:** 2026-10-23  
**Autor:** Antigravity  
**Referencia:** Documento Oficial de Especificación de Casos de Uso (Google Doc / RUP / PUDS)

---

## 1. Contexto y Diagnóstico
Durante la auditoría visual realizada por el usuario con la cuenta del actor Médico (`doctor.perez`), se identificaron las siguientes inconsistencias de interfaz en relación con la matriz oficial de Casos de Uso del Ciclo 1:
1. **Pestaña Pacientes y Fichas (CU04):** Se mostraba en la barra lateral del Médico a pesar de que el CU04 corresponde exclusivamente a `Recepcionista` y `Administrador`. Al ingresar, el backend rechazaba la petición con `HTTP 403 Forbidden` (`Acceso denegado: su rol de usuario (MEDICO) no cuenta con los permisos requeridos`).
2. **Pestañas CU09 y CU10 en Citas:** Al ingresar a Citas, se mostraban las pestañas de `Citas Programadas (CU10)` y `Consultar Disponibilidad (CU09)`, las cuales pertenecen a `Recepcionista` y `Paciente`. Al Médico únicamente le corresponden en el Ciclo 1:
   - **CU14:** Consultar agenda médica diaria.
   - **CU15:** Consultar historial cronológico de citas del paciente.
3. **Panel General (Dashboard):** Las tarjetas de `CU04: Pacientes` y `CU08: Horarios` tenían botones activos `Gestionar →` que conducían a vistas denegadas.

---

## 2. Cambios Implementados

### Frontend

1. **[`frontend/src/components/Sidebar.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/components/Sidebar.jsx):**
   - Se removió `MEDICO` de `requiredRoles` en el ítem `patients` (`requiredRoles: ['ADMIN', 'RECEPCIONISTA']`). La pestaña ya no existe en el menú del médico.
   - Se especializó el ítem de citas para `MEDICO`:
     - Etiqueta: **"Mi Agenda Médica"**.
     - Subtítulo: *"Pacientes de la jornada e historial"*.
     - Tag: *"CU14 / CU15"*.
     - Icono: `Stethoscope`.

2. **[`frontend/src/apps/appointments/components/AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx):**
   - Para `role === 'MEDICO'`, se eliminaron por completo las pestañas de `Citas Programadas (CU10)` y `Consultar Disponibilidad (CU09)`.
   - Se renderiza de forma directa la vista **"Mi Agenda Médica Diaria (CU14)"** (`DoctorAgendaView`) junto al modal de historial (`PatientAppointmentHistoryModal`).

3. **[`frontend/src/apps/appointments/components/DoctorAgendaView.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/DoctorAgendaView.jsx):**
   - Se agregó el prop `onOpenPatientHistory`.
   - En cada fila de cita de la agenda, se incorporó el botón **`Ver Historial (CU15)`** para que el médico consulte directamente el historial cronológico y las métricas de asistencia del paciente.

4. **[`frontend/src/App.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/App.jsx):**
   - En `getSectionTitle()`, si el rol es `MEDICO`, la sección `appointments` se titula *"Mi Agenda Médica Diaria (CU14 / CU15)"*.
   - El renderizado de `PatientsManager` se restringió exclusivamente a `ADMIN` y `RECEPCIONISTA`.
   - En el Dashboard (`Panel General`), la tarjeta de `CU04: Pacientes` muestra la insignia inactiva `Recepción / Admin` para médicos, y la tarjeta principal de citas se transforma en **`CU14 / CU15: Mi Agenda`** con botón directo `Mi Agenda →`.

---

## 3. Verificaciones y Métricas
- **Compilación Frontend:** `npm run build` ejecutado en **483ms con 0 errores y 0 advertencias**.
- **Registro en Historial:** Documentado como `Registro 17` en [`docs/ai/DECISIONS_LOG.md`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/docs/ai/DECISIONS_LOG.md).

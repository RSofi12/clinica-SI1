# Sesión: Aislamiento Estricto de Roles y Casos de Uso por Actor (SoD y Cero Fugas de UI)
**Fecha:** 2026-10-23  
**Autor:** Antigravity  
**Referencia:** Documento Oficial de Especificación de Casos de Uso (Google Doc / RUP / PUDS / RF01-RF13)

---

## 1. Contexto y Requerimiento
A solicitud explícita del usuario (*"verificame para los otros casos de uso no quiero mas sorpresas, a cada actor le tiene que aparecer exclusivamente el cu que le pertenece"*), se llevó a cabo una auditoría integral, exhaustiva y cruzada entre la matriz oficial de Casos de Uso del PUDS y los componentes del frontend y backend.

El objetivo fue asegurar que **ningún actor visualice menús, pestañas, botones de acción ni tarjetas de Dashboard que no correspondan estrictamente a sus Casos de Uso asignados**.

---

## 2. Matriz Oficial de Casos de Uso por Actor (Ciclo 1)

| Actor | Rol en Sistema | Casos de Uso Exclusivos y Asignados | Elementos Prohibidos (Ocultos de Raíz) |
|:---|:---|:---|:---|
| **Administrador** | `ADMIN` | **CU01, CU02, CU03, CU04, CU06, CU07, CU08, CU14, CU15** | Tarjetas de autoservicio de paciente |
| **Recepcionista** | `RECEPCIONISTA` | **CU01, CU04, CU05** (Ventanilla), **CU09, CU10, CU12, CU14, CU15** | Usuarios (CU02), Bitácora (CU03), Médicos (CU06), Horarios (CU08) |
| **Médico** | `MEDICO` | **CU01, CU14** (Agenda médica diaria), **CU15** (Historial cronológico) | Usuarios (CU02), Bitácora (CU03), Padrón/Admisiones (CU04), Cuentas Web (CU05), Médicos (CU06), Horarios (CU08), Agendamiento libre (CU09/CU10), Cancelación (CU12) |
| **Paciente** | `PACIENTE` | **CU01, CU05** (Autoservicio perfil), **CU09, CU10** (Autocitas), **CU12** (Autocancelación), **CU15** (Autohistorial) | Usuarios (CU02), Bitácora (CU03), Padrón general (CU04), Médicos (CU06), Horarios (CU08), Agenda médica institucional (CU14) |

---

## 3. Cambios Implementados

### Frontend

1. **[`frontend/src/App.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/App.jsx):**
   - **Tarjetas del Dashboard (Overview):** Reescritas con renderizado estrictamente condicional por rol:
     - `MEDICO`: Únicamente visualiza `CU01` (Autenticación), `CU14` (Mi Agenda Médica) y `CU15` (Historial Clínico).
     - `PACIENTE`: Únicamente visualiza `CU01` (Autenticación), `CU05` (Mi Perfil de Paciente), `CU09 / CU10` (Mis Citas) y `CU15` (Mi Historial).
     - `RECEPCIONISTA`: Únicamente visualiza `CU01` (Autenticación), `CU04` (Pacientes), `CU05` (Cuentas Web en Ventanilla), `CU09/CU10/CU12` (Citas), `CU14` (Agendas Médicas) y `CU15` (Historial).
     - `ADMIN`: Visualiza el conjunto institucional completo de supervisión (`CU01-CU04, CU06-CU08, CU09-CU15`).
   - **Gating de Rutas y Títulos:** La ruta `'patient-profile'` y su breadcrumb se condicionaron estrictamente a `role === 'PACIENTE'`.

2. **[`frontend/src/apps/appointments/components/DoctorAgendaView.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/DoctorAgendaView.jsx):**
   - La acción de cancelar cita (CU12) se condicionó a `['PENDIENTE', 'CONFIRMADA'].includes(cita.estado) && role !== 'MEDICO'`, dado que en PUDS la cancelación es privativa de la Recepcionista y el Paciente.

3. **[`frontend/src/apps/clinical-resources/components/PatientsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/PatientsManager.jsx):**
   - Se añadió en las filas de la tabla el botón interactivo de habilitación web (`Globe`), permitiendo a la Recepcionista y al Administrador abrir directamente `PatientWebAccountModal` (CU05 §3.4) para crear o regenerar accesos de autoservicio a pacientes del padrón.

4. **[`frontend/src/apps/appointments/components/AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx):**
   - Para el rol `PACIENTE`, se incorporó la llamada automática a `patientProfileService.fetchMyProfile()` al montar el componente, garantizando que el botón *"Mi Historial (CU15)"* abra de inmediato su historial con su `id_paciente` real, incluso si el paciente es nuevo y aún tiene 0 citas en su grilla.

---

## 4. Verificaciones y Métricas
- **Compilación de Producción:** `npm run build` ejecutado exitosamente con **0 errores y 0 advertencias** (construcción en 425ms).
- **Control de Versiones:** Cambios confirmados en git bajo el commit `db31a72`: `"fix(rbac): aislar estrictamente modulos, tarjetas y acciones segun actor oficial PUDS"`.
- **Registro en Historial:** Documentado como `Registro 18` en [`docs/ai/DECISIONS_LOG.md`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/docs/ai/DECISIONS_LOG.md).

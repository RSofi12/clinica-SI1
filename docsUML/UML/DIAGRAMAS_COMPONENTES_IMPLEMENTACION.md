# Diagramas de Arquitectura de Implementación (Componentes y Subsistemas)
**Proyecto:** Clínica Vida Salud (Centro Médico La Cruz)  
**Metodología:** PUDS / RUP (Fase de Construcción / Vista de Implementación)  
**Estándar:** UML 2.5+ (Diagramas de Componentes)  
**Estado:** P1 y P2 Implementados, P3 Diseñado para Ejecución Inmediata

---

## 1. 📁 Archivos Draw.io Oficiales y Espejos

| Diagrama | Ubicación Oficial (`docs/UML/`) | Ubicación Documental (`documentationDocs/`) |
|---|---|---|
| **Arquitectura General del Sistema** | [**`docs/UML/Arquitectura_General_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/Arquitectura_General_Componentes.drawio) | [**`documentationDocs/.../Arquitectura_General_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/Arquitectura_General_Clinica_Componentes.drawio) |
| **Subsistema P1: Seguridad y Auditoría** | [**`docs/UML/P1_Seguridad_Auditoria_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P1_Seguridad_Auditoria_Componentes.drawio) | [**`documentationDocs/.../P1_Seguridad_Auditoria_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P1_Seguridad_Auditoria_Clinica_Componentes.drawio) |
| **Subsistema P2: Recursos Clínicos y Pacientes** | [**`docs/UML/P2_Recursos_Clinicos_Pacientes_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P2_Recursos_Clinicos_Pacientes_Componentes.drawio) | [**`documentationDocs/.../P2_Recursos_Clinicos_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P2_Recursos_Clinicos_Clinica_Componentes.drawio) |
| **Subsistema P3: Gestión de Citas Médicas** | [**`docs/UML/P3_Gestion_Citas_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P3_Gestion_Citas_Componentes.drawio) | [**`documentationDocs/.../P3_Gestion_Citas_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P3_Gestion_Citas_Clinica_Componentes.drawio) |

---

## 2. 🏛️ Estilo Visual y Formato Limpio de Componentes

Siguiendo el estándar acordado (sin descripciones verbales ni números de CU dentro de las cajas):
- **Capa Superior (`«FORM»`):** Relleno rosa (`#f8cecc`), borde `#b85450`, icono UML de componente en esquina superior derecha. Contenido: Estereotipo `<<FORM>>`, línea divisoria y nombre del archivo `.jsx`.
- **Conectores Intermedios:** Interfaces UML *ball-and-socket* (`halfCircle` para dependencias requeridas del formulario, `circle` para interfaces provistas por la clase/servicio).
- **Capa Intermedia (`«CLASS»`):** Relleno naranja (`#fad7ac`), borde `#b46504`, icono UML de componente. Contenido: Estereotipo `<<CLASS>>`, línea divisoria y nombre del servicio (`.js` o `.php`).
- **Capa Inferior (`«Table»`):** Relleno azul (`#dae8fc`), borde `#6c8ebf`, icono UML de componente. Conexiones discontinuas con flecha abierta `«use»` desde las clases.

---

## 3. 🛡️ Subsistema P1: Gestión de Seguridad y Auditoría

### Previa Mermaid
```mermaid
flowchart TD
    subgraph P1["pkg Gestión de Seguridad y Auditoría"]
        subgraph FORMS["Capa FORM"]
            F1["«FORM»<br/>LoginPage.jsx"]
            F2["«FORM»<br/>ForgotPasswordPage.jsx"]
            F3["«FORM»<br/>UsersManager.jsx"]
            F4["«FORM»<br/>UserFormModal.jsx"]
            F5["«FORM»<br/>AuditLogViewer.jsx"]
            F6["«FORM»<br/>SecurityPolicyModal.jsx"]
        end

        subgraph CLASSES["Capa CLASS"]
            C1["«CLASS»<br/>authService.js"]
            C2["«CLASS»<br/>AuthService.php"]
            C3["«CLASS»<br/>userService.js"]
            C4["«CLASS»<br/>UsersController.php"]
            C5["«CLASS»<br/>AuditService.php"]
            C6["«CLASS»<br/>SecurityConfig.php"]
        end

        subgraph TABLES["Capa Table"]
            T1[("usuarios")]
            T2[("roles")]
            T3[("permisos")]
            T4[("usuario_rol")]
            T5[("rol_permiso")]
            T6[("bitacora")]
            T7[("configuracion_seguridad")]
            T8[("tokens_recuperacion")]
        end

        F1 --- C1
        F2 --- C2
        F3 --- C3
        F4 --- C4
        F5 --- C5
        F6 --- C6

        C1 -.-> T1
        C2 -.-> T1
        C2 -.-> T8
        C3 -.-> T2
        C3 -.-> T4
        C4 -.-> T3
        C4 -.-> T5
        C5 -.-> T6
        C6 -.-> T7
    end
```

---

## 4. 🩺 Subsistema P2: Recursos Clínicos y Pacientes

### Previa Mermaid
```mermaid
flowchart TD
    subgraph P2["pkg Gestión de Recursos Clínicos y Pacientes"]
        subgraph FORMS2["Capa FORM"]
            PF1["«FORM»<br/>PatientsManager.jsx"]
            PF2["«FORM»<br/>PatientFormModal.jsx"]
            PF3["«FORM»<br/>PatientProfileView.jsx"]
            PF4["«FORM»<br/>ActivatePatientModal.jsx"]
            PF5["«FORM»<br/>DoctorsManager.jsx"]
            PF6["«FORM»<br/>DoctorFormModal.jsx"]
            PF7["«FORM»<br/>SpecialtiesManager.jsx"]
        end

        subgraph CLASSES2["Capa CLASS"]
            PC1["«CLASS»<br/>patientService.js"]
            PC2["«CLASS»<br/>patientProfileService.js"]
            PC3["«CLASS»<br/>doctorService.js"]
            PC4["«CLASS»<br/>specialtyService.js"]
            PC5["«CLASS»<br/>DoctorAvailabilityService.php"]
        end

        subgraph TABLES2["Capa Table"]
            PT1[("pacientes")]
            PT2[("contactos_emergencia")]
            PT3[("especialidades")]
            PT4[("medicos")]
            PT5[("medico_especialidad")]
            PT6[("disponibilidades")]
            PT7[("bloqueos_horario")]
        end

        PF1 --- PC1
        PF2 --- PC1
        PF3 --- PC2
        PF4 --- PC2
        PF5 --- PC3
        PF6 --- PC3
        PF7 --- PC4

        PC1 -.-> PT1
        PC1 -.-> PT2
        PC2 -.-> PT1
        PC3 -.-> PT4
        PC3 -.-> PT5
        PC4 -.-> PT3
        PC5 -.-> PT6
        PC5 -.-> PT7
    end
```

---

## 5. 📅 Subsistema P3: Gestión de Citas Médicas

Diseñado conforme a la especificación oficial de Casos de Uso (`CU09` a `CU15`) y al esquema DDL de PostgreSQL:

### Previa Mermaid
```mermaid
flowchart TD
    subgraph P3["pkg Gestión de Citas Médicas"]
        subgraph FORMS3["Capa FORM"]
            CF1["«FORM»<br/>AppointmentBookingModal.jsx"]
            CF2["«FORM»<br/>AppointmentCalendarView.jsx"]
            CF3["«FORM»<br/>AppointmentRescheduleModal.jsx"]
            CF4["«FORM»<br/>AppointmentCancelModal.jsx"]
            CF5["«FORM»<br/>AttendanceCheckinModal.jsx"]
            CF6["«FORM»<br/>DoctorAgendaView.jsx"]
            CF7["«FORM»<br/>PatientAppointmentsHistory.jsx"]
        end

        subgraph CLASSES3["Capa CLASS"]
            CC1["«CLASS»<br/>appointmentService.js"]
            CC2["«CLASS»<br/>AppointmentSchedulingService.php"]
            CC3["«CLASS»<br/>AppointmentStateMachineService.php"]
            CC4["«CLASS»<br/>doctorAgendaService.js"]
            CC5["«CLASS»<br/>DoctorAvailabilityService.php"]
        end

        subgraph TABLES3["Capa Table"]
            CT1[("tipos_cita")]
            CT2[("citas")]
            CT3[("cita_estado_historial")]
            CT4[("disponibilidades")]
            CT5[("bloqueos_horario")]
            CT6[("medicos")]
            CT7[("pacientes")]
        end

        CF1 --- CC1
        CF2 --- CC1
        CF3 --- CC2
        CF4 --- CC3
        CF5 --- CC3
        CF6 --- CC4
        CF7 --- CC5

        CC1 -.-> CT2
        CC1 -.-> CT1
        CC2 -.-> CT2
        CC2 -.-> CT6
        CC2 -.-> CT7
        CC3 -.-> CT2
        CC3 -.-> CT3
        CC4 -.-> CT2
        CC4 -.-> CT6
        CC5 -.-> CT4
        CC5 -.-> CT5
        CC5 -.-> CT2
    end
```

### Relación de Tablas y Reglas de Negocio en P3
1. **`citas`:** Entidad central con restricción anti-colisión `uq_cita_medico_hora_activa` para estados `PROGRAMADA` y `CONFIRMADA`.
2. **`cita_estado_historial`:** Auditoría de transición de estados (`PROGRAMADA` → `CONFIRMADA` → `ATENDIDA` / `INASISTENCIA` / `CANCELADA`).
3. **`tipos_cita`:** Catálogo de consulta (Primera consulta, Control, Reconsulta).
4. **`disponibilidades` y `bloqueos_horario`:** Detección de rangos laborales y licencias/feriados.
5. **`medicos` y `pacientes`:** Relación foránea directa con validación de edad y correlativo único (`CM-XXXX`).

# Diagramas de Arquitectura de Implementación (Componentes y Subsistemas)
**Proyecto:** Clínica Vida Salud (Centro Médico La Cruz)  
**Metodología:** PUDS / RUP (Fase de Construcción / Vista de Implementación)  
**Estándar:** UML 2.5+ (Diagramas de Componentes)  
**Estado:** P1 y P2 Implementados; P3, P4, P5 y P6 Modelados como Previa de Arquitectura de Implementación

---

## 1. 📁 Archivos Draw.io Oficiales y Espejos

| Diagrama | Ubicación Oficial (`docs/UML/`) | Ubicación Documental (`documentationDocs/`) |
|---|---|---|
| **Arquitectura General del Sistema** | [**`docs/UML/Arquitectura_General_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/Arquitectura_General_Componentes.drawio) | [**`documentationDocs/.../Arquitectura_General_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/Arquitectura_General_Clinica_Componentes.drawio) |
| **Subsistema P1: Seguridad y Auditoría** | [**`docs/UML/P1_Seguridad_Auditoria_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P1_Seguridad_Auditoria_Componentes.drawio) | [**`documentationDocs/.../P1_Seguridad_Auditoria_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P1_Seguridad_Auditoria_Clinica_Componentes.drawio) |
| **Subsistema P2: Recursos Clínicos y Pacientes** | [**`docs/UML/P2_Recursos_Clinicos_Pacientes_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P2_Recursos_Clinicos_Pacientes_Componentes.drawio) | [**`documentationDocs/.../P2_Recursos_Clinicos_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P2_Recursos_Clinicos_Clinica_Componentes.drawio) |
| **Subsistema P3: Gestión de Citas Médicas** | [**`docs/UML/P3_Gestion_Citas_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P3_Gestion_Citas_Componentes.drawio) | [**`documentationDocs/.../P3_Gestion_Citas_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P3_Gestion_Citas_Clinica_Componentes.drawio) |
| **Subsistema P4: Historial Clínico y Consultas** | [**`docs/UML/P4_Historial_Clinico_Consultas_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P4_Historial_Clinico_Consultas_Componentes.drawio) | [**`documentationDocs/.../P4_Historial_Clinico_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P4_Historial_Clinico_Clinica_Componentes.drawio) |
| **Subsistema P5: Integraciones y Pagos** | [**`docs/UML/P5_Integraciones_Pagos_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P5_Integraciones_Pagos_Componentes.drawio) | [**`documentationDocs/.../P5_Integraciones_Pagos_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P5_Integraciones_Pagos_Clinica_Componentes.drawio) |
| **Subsistema P6: Reportes y Analítica** | [**`docs/UML/P6_Reportes_Analitica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/P6_Reportes_Analitica_Componentes.drawio) | [**`documentationDocs/.../P6_Reportes_Analitica_Clinica_Componentes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/4DiagramsImplementacion/P6_Reportes_Analitica_Clinica_Componentes.drawio) |

---

## 2. 🏛️ Estándar Visual y Formato Limpio de Componentes

Siguiendo el estándar UML estricto (sin descripciones verbales ni números de CU dentro de los bloques):
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

---

## 6. 📝 Subsistema P4: Historial Clínico y Consultas

Diseñado según los Casos de Uso `CU16`–`CU19` y las tablas clínicas del DDL:

### Previa Mermaid
```mermaid
flowchart TD
    subgraph P4["pkg Historial Clínico y Consultas"]
        subgraph FORMS4["Capa FORM"]
            HF1["«FORM»<br/>MedicalConsultationForm.jsx"]
            HF2["«FORM»<br/>PatientMedicalRecordView.jsx"]
            HF3["«FORM»<br/>BackgroundManagerModal.jsx"]
            HF4["«FORM»<br/>PrescriptionFormModal.jsx"]
            HF5["«FORM»<br/>EvolutionNotesModal.jsx"]
            HF6["«FORM»<br/>ClinicalAnalysisView.jsx"]
        end

        subgraph CLASSES4["Capa CLASS"]
            HC1["«CLASS»<br/>consultationService.js"]
            HC2["«CLASS»<br/>medicalRecordService.js"]
            HC3["«CLASS»<br/>MedicalConsultationService.php"]
            HC4["«CLASS»<br/>MedicalRecordService.php"]
            HC5["«CLASS»<br/>ClinicalAiSummaryService.php"]
        end

        subgraph TABLES4["Capa Table"]
            HT1[("historias_clinicas")]
            HT2[("consultas_medicas")]
            HT3[("antecedentes")]
            HT4[("diagnosticos")]
            HT5[("evoluciones")]
            HT6[("recetas")]
            HT7[("receta_detalles")]
            HT8[("analisis_clinicos")]
        end

        HF1 --- HC1
        HF2 --- HC2
        HF3 --- HC2
        HF4 --- HC3
        HF5 --- HC3
        HF6 --- HC5

        HC1 -.-> HT2
        HC2 -.-> HT1
        HC2 -.-> HT3
        HC3 -.-> HT2
        HC3 -.-> HT4
        HC3 -.-> HT5
        HC4 -.-> HT6
        HC4 -.-> HT7
        HC5 -.-> HT8
    end
```

---

## 7. 💳 Subsistema P5: Integraciones y Pagos

Diseñado según los Casos de Uso `CU20` (Notificaciones Push/Email) y `CU21` (Pagos con Stripe):

### Previa Mermaid
```mermaid
flowchart TD
    subgraph P5["pkg Integraciones y Pagos"]
        subgraph FORMS5["Capa FORM"]
            IF1["«FORM»<br/>StripePaymentModal.jsx"]
            IF2["«FORM»<br/>PaymentReceiptView.jsx"]
            IF3["«FORM»<br/>NotificationCenterModal.jsx"]
            IF4["«FORM»<br/>NotificationPreferencesModal.jsx"]
            IF5["«FORM»<br/>PushSubscriptionHandler.jsx"]
        end

        subgraph CLASSES5["Capa CLASS"]
            IC1["«CLASS»<br/>paymentService.js"]
            IC2["«CLASS»<br/>StripePaymentService.php"]
            IC3["«CLASS»<br/>notificationService.js"]
            IC4["«CLASS»<br/>NotificationDispatcherService.php"]
            IC5["«CLASS»<br/>WebPushService.php"]
        end

        subgraph TABLES5["Capa Table"]
            IT1[("pagos")]
            IT2[("citas")]
            IT3[("notificaciones")]
            IT4[("push_suscripciones")]
            IT5[("usuarios")]
        end

        IF1 --- IC1
        IF2 --- IC2
        IF3 --- IC3
        IF4 --- IC4
        IF5 --- IC5

        IC1 -.-> IT1
        IC2 -.-> IT1
        IC2 -.-> IT2
        IC3 -.-> IT3
        IC4 -.-> IT3
        IC4 -.-> IT5
        IC5 -.-> IT4
        IC5 -.-> IT5
    end
```

---

## 8. 📊 Subsistema P6: Reportes y Analítica

Diseñado según los Casos de Uso `CU22` (7 Reportes del RF13 con filtros y exportación PDF/CSV) y `CU23` (Reporte por voz con IA):

### Previa Mermaid
```mermaid
flowchart TD
    subgraph P6["pkg Reportes y Analítica"]
        subgraph FORMS6["Capa FORM"]
            RF1["«FORM»<br/>DynamicReportsView.jsx"]
            RF2["«FORM»<br/>ReportFilterModal.jsx"]
            RF3["«FORM»<br/>VoiceReportModal.jsx"]
            RF4["«FORM»<br/>ReportExportModal.jsx"]
            RF5["«FORM»<br/>AiReportPreviewModal.jsx"]
        end

        subgraph CLASSES6["Capa CLASS"]
            RC1["«CLASS»<br/>reportService.js"]
            RC2["«CLASS»<br/>DynamicReportQueryService.php"]
            RC3["«CLASS»<br/>voiceReportService.js"]
            RC4["«CLASS»<br/>AiReportInterpreterService.php"]
            RC5["«CLASS»<br/>ReportExportService.php"]
        end

        subgraph TABLES6["Capa Table"]
            RT1[("reportes_ia")]
            RT2[("citas")]
            RT3[("medicos")]
            RT4[("pacientes")]
            RT5[("consultas_medicas")]
            RT6[("pagos")]
        end

        RF1 --- RC1
        RF2 --- RC2
        RF3 --- RC3
        RF4 --- RC5
        RF5 --- RC4

        RC1 -.-> RT2
        RC2 -.-> RT2
        RC2 -.-> RT3
        RC2 -.-> RT4
        RC4 -.-> RT1
        RC4 -.-> RT5
        RC5 -.-> RT6
        RC5 -.-> RT2
    end
```

---

## 9. 🚀 Cómo Abrir los Diagramas en Draw.io
1. Entra a **[draw.io](https://app.diagrams.net/)** o abre la aplicación local Draw.io Desktop.
2. Ve a **Archivo** > **Abrir desde** > **Dispositivo...**
3. Selecciona cualquiera de los archivos `.drawio` ubicados en `docs/UML/` o en `documentationDocs/4DiagramsImplementacion/`.
4. El diseño respeta fielmente la distribución de capas visuales:
   - **Capa Superior:** Formularios `«FORM»` en rosa (`#f8cecc`).
   - **Conexiones intermedias:** Ball-and-socket UML (`circle` provides / `halfCircle` requires).
   - **Capa Intermedia:** Servicios `«CLASS»` en naranja (`#fad7ac`).
   - **Capa Inferior:** Tablas `«Table»` en azul (`#dae8fc`) con dependencias discontinuas `«use»`.

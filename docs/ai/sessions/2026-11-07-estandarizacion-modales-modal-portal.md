# Bitácora de Sesión: Estandarización de Modales con ModalPortal, Viewport Lock y Cierre Universal

**Fecha:** 2026-11-07  
**Rama:** `prueba`  
**Autor:** Antigravity Agent  
**Objetivo:** Resolver definitivamente el desplazamiento de modales provocado por el scroll de contenedores internos (`<main overflow-y-auto>`), asegurando anclaje estricto al viewport, centrado responsivo, scroll-lock en body, y cierre en backdrop y tecla Escape en todos los modales del sistema.

---

## 1. Diagnóstico de Causa Raíz
- **Comportamiento Anómalo:** Al abrir modales como edición de paciente, cuenta web, ficha clínica o citas dentro del panel del dashboard, el modal se movía junto con el scrollbar interno del área de contenido (`<main className="flex-1 overflow-y-auto">`), el fondo se seguía desplazando y el modal no permanecía fijo ni centrado en pantalla.
- **Causa Técnica:** En la especificación CSS, un elemento con `position: fixed` queda atrapado dentro del bloque contenedor (*containing block*) de cualquier elemento ancestro que tenga propiedades como `overflow-y: auto`, `transform` o `filter`. Al estar declarados dentro del JSX anidado del árbol de componentes, los modales se desplazaban con el scroll del contenedor en lugar de fijarse al `window/viewport`.

---

## 2. Solución Arquitectural: `ModalPortal`
Se diseñó e implementó un componente maestro universal: [`frontend/src/components/ModalPortal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/ModalPortal.jsx).

### Características Principales:
1. **React Portal a `document.body` (`createPortal`):** Monta el marcado del modal directamente en la raíz del documento, garantizando que `fixed inset-0` cubra siempre el 100% de la ventana visible.
2. **Scroll-Lock Automático:** Al montarse con `isOpen={true}`, congela el desplazamiento del fondo (`document.body.style.overflow = 'hidden'`) y restaura el valor original de manera limpia al desmontarse o cerrarse.
3. **Manejador de Tecla `Escape`:** Listener global para cerrar el diálogo al presionar la tecla `Escape`.
4. **Cierre al Clic en Backdrop:** Detección de eventos con `e.target === e.currentTarget` en el fondo oscuro con desenfoque (`bg-slate-900/60 backdrop-blur-md`), evitando cierres accidentales al hacer clic dentro del panel.
5. **Centrado Vertical y Horizontal Responsivo:** Uso de `my-auto` en el contenedor del panel para mantenerlo centrado en cualquier resolución de pantalla.
6. **Animaciones Suaves:** Clases utilitarias `.animate-modal-backdrop` y `.animate-modal-panel` para una apertura y cierre fluidos sin parpadeos.

---

## 3. Componentes Migrados (20 Modales del Sistema)

### Recursos Clínicos y Padrón:
1. [`PatientFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/PatientFormModal.jsx) — Alta y edición de pacientes (RF02).
2. [`PatientDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/PatientDetailModal.jsx) — Consulta de ficha clínica institucional.
3. [`PatientWebAccountModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/PatientWebAccountModal.jsx) — Activación y gestión de cuenta web de autoservicio (CU05).
4. [`DoctorFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/DoctorFormModal.jsx) — Alta y edición de cuerpo médico y especialidades (RF03, RF04).
5. [`DoctorDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/DoctorDetailModal.jsx) — Ficha detallada de médico.
6. [`BlockModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/BlockModal.jsx) — Bloqueo de franjas y feriados institucionales (RF05).
7. [`ActivatePatientModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/ActivatePatientModal.jsx) — Activación rápida de paciente desde landing.

### Seguridad y Auditoría (P1):
8. [`UserFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/security/components/UserFormModal.jsx) — Gestión de operadores de sistema y roles RBAC (CU02 / RF01).
9. [`SecurityPolicyModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/security/components/SecurityPolicyModal.jsx) — Políticas de seguridad y bloqueo criptográfico (CU01).
10. [`AuditDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/security/components/AuditDetailModal.jsx) — Inspección forense de eventos en bitácora inmutable (CU03).

### Citas Médicas (P3):
11. [`AppointmentBookingModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx) — Programación de cita médica anti-colisión (CU10 / RF06, RF07).
12. [`AppointmentRescheduleModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentRescheduleModal.jsx) — Reprogramación transaccional con motivo justificado (CU11 / RF08).
13. [`AppointmentCancelModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentCancelModal.jsx) — Cancelación con motivo obligatorio (CU12 / RF09).
14. [`AppointmentStatusModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentStatusModal.jsx) — Máquina de estados y check-in presencial (CU13 / RF10).
15. [`PatientAppointmentHistoryModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/PatientAppointmentHistoryModal.jsx) — Historial cronológico de citas (CU15 / RF12).

### Historia Clínica y Consultas (P4):
16. [`ConsultaRegistroModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ConsultaRegistroModal.jsx) — Registro de consulta, triaje y signos vitales (CU16).
17. [`AntecedentesPatientModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedentesPatientModal.jsx) — Consulta y gestión de antecedentes patológicos (CU17).
18. [`AntecedenteFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedenteFormModal.jsx) — Formulario de alta/edición de antecedente.
19. [`RecetaPrescripcionModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/RecetaPrescripcionModal.jsx) — Prescripción estructurada de medicamentos (CU18).
20. [`RecetaDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/RecetaDetailModal.jsx) & [`RecetaAnularModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/RecetaAnularModal.jsx) — Visor/impresión y anulación lógica (RN11).
21. Modal de Reserva de Consulta Rápida en [`HomePage.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/pages/HomePage.jsx).

---

## 4. Pruebas y Verificación
- **Compilación de Producción:**
  - `npm --prefix frontend run build`: **0 errores** (2046 módulos transformados en 17.75s).
- **Verificación de Comportamiento:**
  - Los modales permanecen estables y centrados al mover la rueda del ratón o la barra de desplazamiento.
  - El fondo de la pantalla queda congelado sin scroll fantasma mientras cualquier modal esté abierto.
  - El cierre al hacer clic fuera y al presionar la tecla `Escape` funciona de forma homogénea en toda la plataforma.

# Sesión 08/11/2026 — Aislamiento Estricto de CU23 y CU18, Cierre Seguro de Modales por Backdrop y Corrección en Reprogramación (CU11)

**Autor / Responsable:** Roberto Torrez / Asistente AI  
**Fecha:** 08 de Noviembre de 2026  
**Rama:** `robert-dev` (Trabajo y validaciones locales)  

---

## 1. 🎯 Objetivos de la Sesión
1. **Aislamiento Estricto de Casos de Uso según Documentación Oficial:**
   - Restringir **CU23 (Reportes por Voz con IA)** exclusivamente para el rol `ADMIN`. Retirar de `MEDICO`.
   - Restringir **CU18 (Prescripciones y Recetas)** a `ADMIN` y `MEDICO`. Retirar de `PACIENTE`.
   - Asegurar que **CU09 y CU12** queden fuera de las opciones del actor `MEDICO`.
2. **Cierre Fluido y Seguro de Modales (Opción 1):**
   - Permitir cierre por clic en el fondo exterior (`backdrop`) y tecla `Escape` en todos los modales de consulta, inspección y fichas clínicas.
   - Proteger los modales de captura de datos y formularios extensos contra clics accidentales (`closeOnBackdrop={false}`).
   - Diagnosticar y corregir la causa raíz en `ModalPortal.jsx`.
3. **Corrección de Error en Reprogramación de Citas (CU11 / RF08):**
   - Resolver excepción `Call to undefined method Bitacora::registrarAccion()` al reprogramar citas.
4. **Retiro de Herramienta Temporal:**
   - Eliminar el componente flotante de ayuda `FloatingRoleCuTester` una vez concluidas satisfactoriamente las pruebas de auditoría del usuario.

---

## 2. 🛠️ Cambios Implementados

### Backend (Laravel 13)
* **[`backend/routes/api.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/routes/api.php):**
  - Restringido `/recetas` y `/recetas/{id}` a `role:ADMIN,MEDICO` (bloqueando acceso a `PACIENTE` y `RECEPCIONISTA`).
  - Restringido `/analytics/voice-report` y `/analytics/voice-history` exclusivamente a `role:ADMIN` (bloqueando a `MEDICO`).
* **[`backend/app/Packages/Appointments/Services/AppointmentRescheduleService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Services/AppointmentRescheduleService.php):**
  - Corregida la llamada a `Bitacora::registrarAccion(...)` por la firma canónica `Bitacora::registrar($idUsuario, 'Citas Médicas', 'REPROGRAMAR_CITA', 'citas', $cita->id_cita, ...)`.
* **[`backend/app/Packages/Security/Models/Bitacora.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Security/Models/Bitacora.php):**
  - Añadido método estático de retrocompatibilidad `registrarAccion(...)` para proteger el sistema contra llamadas similares.

### Frontend (React / Tailwind CSS)
* **[`frontend/src/components/ModalPortal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/components/ModalPortal.jsx):**
  - **Diagnóstico:** El `useEffect` que sincronizaba `isOpen` reaccionaba ante el cambio de `isClosing=true`, detectando `isOpen=true` en el padre y ejecutando `clearTimeout(closingTimeoutRef.current)` y `setIsClosing(false)`, lo que abortaba el cierre por clic exterior.
  - **Solución:** Se desacopló la bandera interna de cierre con `isClosingRef`, se añadieron los props `closeOnBackdrop` (default `true`) y `closeOnEscape` (default `true`), y se parametrizó el cursor (`cursor-pointer` vs `cursor-default`).
* **Modales Calibrados con Protección contra Clics Accidentales (`closeOnBackdrop={false}`):**
  - `PatientFormModal.jsx` (Admisión / Edición de Pacientes)
  - `PatientWebAccountModal.jsx` (Habilitación de Credenciales Web)
  - `DoctorFormModal.jsx` (Registro / Edición de Médicos)
  - `BlockModal.jsx` (Bloqueo de Horarios y Feriados)
  - `AppointmentBookingModal.jsx` (Wizard de Agendamiento)
  - `AppointmentCancelModal.jsx` (Cancelación con Motivo)
  - `AppointmentRescheduleModal.jsx` (Reprogramación de Citas)
  - `AppointmentStatusModal.jsx` (Transición de Estados y Check-in)
  - `ConsultaRegistroModal.jsx` (Consulta Médica, Triaje y CIE-10)
  - `RecetaPrescripcionModal.jsx` (Emisión de Recetas)
  - `RecetaAnularModal.jsx` (Anulación de Recetas)
  - `AntecedenteFormModal.jsx` (Antecedentes Clínicos)
  - `UserFormModal.jsx` (Operadores y Roles)
  - `ActivatePatientModal.jsx` (Autoservicio de Pacientes)
  - `SecurityPolicyModal.jsx` (Políticas de Bloqueo)
  - `OrdenExamenFormModal.jsx` (Órdenes Complementarias)
  - `StripePaymentModal.jsx` (Pasarela de Pago Tokenizada)
* **Modales con Cierre Inmediato por Clic Exterior y Escape (`closeOnBackdrop={true}`):**
  - `PatientDetailModal.jsx` (Ficha Clínica de Paciente)
  - `DoctorDetailModal.jsx` (Perfil de Médico)
  - `AppointmentTicketModal.jsx` (Ticket de Cita Imprimible)
  - `PatientAppointmentHistoryModal.jsx` (Historial de Citas)
  - `ConsultaDetailModal.jsx` (Detalle de Consulta)
  - `RecetaDetailModal.jsx` (Detalle de Receta)
  - `AntecedentesPatientModal.jsx` (Visor de Antecedentes)
  - `AuditDetailModal.jsx` (Detalle de Evento de Bitácora)
  - Previsualizadores DICOM y de Documentos Adjuntos
* **[`frontend/src/components/Sidebar.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/components/Sidebar.jsx) & [`frontend/src/App.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/App.jsx):**
  - Ajustados `requiredRoles` y protecciones para CU23 y CU18.
  - Eliminado el import y el renderizado de `FloatingRoleCuTester`.
* **Eliminación Física de Archivo:**
  - Se eliminó `frontend/src/components/FloatingRoleCuTester.jsx`.

---

## 3. 🧪 Verificaciones y Pruebas Realizadas
1. **Compilación Frontend:**
   - `npm --prefix frontend run build`: **0 errores**, compilación limpia en 476ms generando bundle de producción `index-vIic9u0U.js`.
2. **Sintaxis PHP:**
   - `php -l Bitacora.php` y `php -l AppointmentRescheduleService.php`: **Sintaxis 100% válida**.
3. **Pruebas de Reprogramación:**
   - El endpoint `/api/appointments/{id}/reschedule` procesa la reprogramación, libera el cupo anterior y registra en bitácora sin excepciones.
4. **Pruebas de Modales:**
   - Fichas y detalles cierran instantáneamente al hacer clic en el backdrop oscuro o con `Escape`.
   - Formularios largos permanecen abiertos si se hace clic afuera accidentalmente.

---

## 4. 📌 Estado de Git
* Cambios conservados estrictamente en local en la rama `robert-dev` según solicitud del usuario (sin `git push`).


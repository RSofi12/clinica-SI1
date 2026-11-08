# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 08/11/2026 (Saneamiento de Guiones y Caracteres Tipográficos en Generador PDF CU23)
- **Corrección de Carácter `?` en Encabezado de Reportes PDF ([`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js)):**
  - **Causa raíz:** En la función `buildPdfDocument`, el título institucional y el subtítulo utilizaban caracteres tipográficos no ASCII (em-dash `—` U+2014 y punto medio `·` U+00B7). La expresión regular de sanitización para fuentes estándar de PDF (`replace(/[^\x20-\x7E]/g, '?')`) transformaba cualquier carácter fuera del rango ASCII imprimible en un signo de interrogación `?`.
  - **Solución implementada:**
    - Se reemplazaron explícitamente las cadenas estáticas de título y subtítulo por guiones ASCII estándar `-` (`Centro Medico La Cruz - Clinica Vida Salud` y `Reporte Asistencial y Estadistico (CU23) - Tipo: ...`).
    - Se mejoró la función `sanitizePdfText` con un pre-mapeo universal de caracteres tipográficos extendidos (`[—–]` ➔ `-`, `[·•]` ➔ `-`, `[“”]` ➔ `"`, `[‘’]` ➔ `'`, `[º°]` ➔ `o`, `[ª]` ➔ `a`), sustituyendo cualquier remanente por espacio en lugar de `?`.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2m 16s).

---
- **Corrección de Error SQLSTATE[42703] Undefined column «nombres» ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php) y [`AntecedenteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/AntecedenteService.php)):**
  - **Causa raíz:** Se intentaba hacer eager loading de `registrador:id_usuario,username,nombres,apellidos,rol` sobre la tabla `usuarios`. En la base de datos de PostgreSQL, la tabla `usuarios` únicamente cuenta con `id_usuario`, `username`, `email`, `tipo_usuario` y `estado` (los nombres y apellidos de los médicos residen en la tabla relacional `medicos`).
  - **Solución implementada:** Se reestructuró la relación eager a `['registrador:id_usuario,username,tipo_usuario', 'registrador.medico:id_medico,id_usuario,nombres,apellidos']`.
  - **Frontend actualizado:** [`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx) formatea el registrador de forma segura: `Dr(a). ${a.registrador.medico.nombres} ...` si tiene médico vinculado o `@${a.registrador.username}` si es usuario administrador del sistema.
  - **Prueba de integración exitosa:** Ejecutado script de prueba en backend con el usuario `doctor.aguilera` cargando expedientes y antecedentes de pacientes sin ningún error SQL (100% de éxito).
- **Modelo de Permisos y Autorizaciones Oficiales (CU17 / CU19):**
  - **Médicos (`MEDICO`):** Tienen acceso de lectura y escritura para **cualquier paciente** en el sistema. Los antecedentes clínicos (alergias a fármacos, enfermedades crónicas, cirugías previas) forman parte de la historia clínica universal y permanente del centro médico, necesaria para cualquier acto médico asistencial seguro.
  - **Administrador (`ADMIN`):** Acceso total para supervisión y auditoría clínica.
  - **Pacientes (`PACIENTE`):** Acceso de **solo lectura estricta** (CU19 / §3.4) exclusivamente a su propio expediente (blindado por control Anti-IDOR).
  - **Recepcionistas (`RECEPCIONISTA`):** Bloqueo total con `HTTP 403 Forbidden` por secreto médico.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (transformados 2046 módulos en 40.91s).

---
- **Diagnóstico y Corrección en Backend ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php)):**
  - **Inconsistencia de Atributos Resuelta:** El servicio filtraba antecedentes con propiedades inexistentes (`$a->tipo`, `$a->nombre`, `$a->severidad`, `$a->observaciones`), provocando que las alertas de alergias en cabecera quedaran vacías y que la pestaña de antecedentes no desplegara información válida.
  - **Mapeo Estricto al Esquema Relacional de `antecedentes`:** Se corrigió a `tipo_antecedente`, `descripcion`, `fecha_registro`, `estado` y relación Eloquent `registrador:id_usuario,username,nombres,apellidos,rol` tanto en la síntesis clínica como en el timeline cronológico.
- **Transformación de Frontend en Pestaña de Antecedentes ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Barra de Herramientas y Acciones de CU17:**
    - Título descriptivo con badge de conteo total de antecedentes.
    - Botón de acción asistencial **`+ Registrar Antecedente`** (`Plus`) para médicos y administradores que abre [`AntecedenteFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedenteFormModal.jsx).
    - Barra de chips/filtros con iconos por categoría oficial (`Todos`, `Alérgicos`, `Patológicos`, `Quirúrgicos`, `Farmacológicos`, `Familiares`) con contadores en tiempo real.
    - Switch interactivo para auditar antecedentes dados de baja lógica (`Ver inactivos (RN11)`).
  - **Tarjetas Clínicas Enriquecidas por Antecedente:**
    - Identificación visual con iconos temáticos y paleta diferenciada (`AlertTriangle` en rose para alergias prioritarias, `Activity` en blue para patologías, `Scissors` en purple para cirugías, `Pill` en emerald para fármacos, `Users` en amber para antecedentes familiares).
    - Badge de vigencia (`ACTIVO` en verde / `INACTIVO` en gris con opacidad atenuada).
    - Descripción clínica completa y nítida (`a.descripcion`).
    - Pie de trazabilidad: fecha de registro (`Calendar`) y profesional que registró (`User`, `Dr(a). ...`).
    - Acciones asistenciales directas en cada tarjeta: botón **`Editar`** (`Edit2`) para abrir el formulario de actualización y botón **`Desactivar / Reactivar`** (`Power`) para alternar la baja lógica RN11 con recarga reactiva instantánea.
  - **Banner Superior de Alergias Corregido:** Ahora detecta y muestra de forma reactiva las alergias activas del paciente con texto de advertencia roja pulsante.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (20.66s).

---
- **Sustitución de Select Nativo por Search Combobox Flotante ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Diagnóstico del problema:** Al buscar un paciente en el expediente clínico (por nombre o CI), el filtro reducía las opciones a 1 solo elemento en un `<select>` HTML estándar; como el navegador lo dejaba seleccionado automáticamente por defecto en el índice 0, hacer clic en él no disparaba el evento `onChange`, dejando bloqueado el expediente anterior (ej. Rodrigo Alarcón) e impidiendo cargar al paciente buscado.
  - **Nuevo Buscador Unificado con Autocompletado y Popover Flotante:**
    - Campo de búsqueda interactivo con icono `Search`, botón de borrado rápido (`X`) y atajo de teclado (`Enter` para seleccionar el primer resultado, `Escape` para cerrar).
    - Desplegable flotante (`z-50`, backdrop blur, borde limpio y sombra elevada) con conteo de coincidencias en tiempo real.
    - Cada fila presenta avatar con iniciales, nombre y apellidos, número de cédula (CI), código de Historia Clínica (`HC-xxxx`), género y edad.
    - Clic directo en cualquier resultado invoca `handleSelectPatient`, actualiza inmediatamente el expediente del paciente seleccionado, cierra el menú y resalta el paciente activo.
    - Botón selector y pastilla en cabecera para ver el paciente cargado actualmente o abrir el catálogo rápidamente.
    - Listener exterior para cerrar automáticamente el desplegable al hacer clic fuera del componente (`handleClickOutside`).
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos transformados en 40.26s).

---
- **Corrección de Mojibake en [`DoctorAgendaView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/DoctorAgendaView.jsx):**
  - **Saneamiento integral de caracteres especiales:** Se corrigieron todas las cadenas con doble codificación/mojibake UTF-8 (`MatrÃ­cula:` ➔ `Matrícula:`, `â€¢` ➔ `•`, `Agenda MÃ©dica Personal` ➔ `Agenda Médica Personal`, `dÃ­a` ➔ `día`, `MiÃ©rcoles` ➔ `Miércoles`, `SÃ¡bado` ➔ `Sábado`, `Consulta MÃ©dica` ➔ `Consulta Médica`, etc.).
  - **Tratamiento inclusivo de médicos:** Estandarizado `Dr(a).` en títulos y cabeceras de médicos para dar cobertura coherente a doctoras y doctores del plantel.
  - **Auditoría global:** Verificado con escaneo recursivo que el 100% de los archivos `.jsx` y `.js` del frontend y `.php` del backend tienen 0 caracteres corruptos.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 16.43s).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 07/11/2026 (Transición Fluida de Salida en Modales y Descarga Directa de Reportes IA en PDF)
- **Transición Fluida de Salida en Modales ([`ModalPortal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/ModalPortal.jsx) y [`index.css`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/index.css)):**
  - **Animación no abrupta al cerrar:** Implementado estado interno `isClosing` de 200ms que aplica `@keyframes modalBackdropOut` y `@keyframes modalPanelOut` al presionar `Escape`, hacer clic en el backdrop exterior o pulsar el botón `X`/Cerrar.
  - El fondo se desvanece suavemente (`opacity 1 -> 0`, `backdrop-filter 8px -> 0px`) y el panel del modal se escala suavemente (`scale 1 -> 0.96`, `translateY 0 -> 10px`), eliminando cualquier desaparición brusca en todos los modales de la aplicación.
- **Descarga Directa de Reportes por IA sin Diálogo de Impresión ([`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js) y [`VoiceReportAssistant.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/VoiceReportAssistant.jsx)):**
  - **Eliminación del panel de impresión del navegador:** Se sustituyó la apertura de pestaña secundaria con `window.print()` por un generador nativo de documentos PDF estándar (`buildPdfDocument`).
  - **Descarga instantánea como archivo binario `.pdf`:** Se construye un PDF estándar (PDF-1.4 con membrete institucional Teal `#00687A`, tarjetas KPI formateadas, tablas zebra sanitizadas y paginación) que se descarga automáticamente a la carpeta de descargas del usuario mediante `Blob` y trigger `link.click()`.
  - Botón de exportación actualizado con icono `Download` e indicación visual de descarga directa.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 1m 28s).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 08/11/2026 (Saneamiento de Guiones y Caracteres Tipográficos en Generador PDF CU23)
- **Corrección de Carácter `?` en Encabezado de Reportes PDF ([`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js)):**
  - **Causa raíz:** En la función `buildPdfDocument`, el título institucional y el subtítulo utilizaban caracteres tipográficos no ASCII (em-dash `—` U+2014 y punto medio `·` U+00B7). La expresión regular de sanitización para fuentes estándar de PDF (`replace(/[^\x20-\x7E]/g, '?')`) transformaba cualquier carácter fuera del rango ASCII imprimible en un signo de interrogación `?`.
  - **Solución implementada:**
    - Se reemplazaron explícitamente las cadenas estáticas de título y subtítulo por guiones ASCII estándar `-` (`Centro Medico La Cruz - Clinica Vida Salud` y `Reporte Asistencial y Estadistico (CU23) - Tipo: ...`).
    - Se mejoró la función `sanitizePdfText` con un pre-mapeo universal de caracteres tipográficos extendidos (`[—–]` ➔ `-`, `[·•]` ➔ `-`, `[“”]` ➔ `"`, `[‘’]` ➔ `'`, `[º°]` ➔ `o`, `[ª]` ➔ `a`), sustituyendo cualquier remanente por espacio en lugar de `?`.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2m 16s).

---
- **Corrección de Error SQLSTATE[42703] Undefined column «nombres» ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php) y [`AntecedenteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/AntecedenteService.php)):**
  - **Causa raíz:** Se intentaba hacer eager loading de `registrador:id_usuario,username,nombres,apellidos,rol` sobre la tabla `usuarios`. En la base de datos de PostgreSQL, la tabla `usuarios` únicamente cuenta con `id_usuario`, `username`, `email`, `tipo_usuario` y `estado` (los nombres y apellidos de los médicos residen en la tabla relacional `medicos`).
  - **Solución implementada:** Se reestructuró la relación eager a `['registrador:id_usuario,username,tipo_usuario', 'registrador.medico:id_medico,id_usuario,nombres,apellidos']`.
  - **Frontend actualizado:** [`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx) formatea el registrador de forma segura: `Dr(a). ${a.registrador.medico.nombres} ...` si tiene médico vinculado o `@${a.registrador.username}` si es usuario administrador del sistema.
  - **Prueba de integración exitosa:** Ejecutado script de prueba en backend con el usuario `doctor.aguilera` cargando expedientes y antecedentes de pacientes sin ningún error SQL (100% de éxito).
- **Modelo de Permisos y Autorizaciones Oficiales (CU17 / CU19):**
  - **Médicos (`MEDICO`):** Tienen acceso de lectura y escritura para **cualquier paciente** en el sistema. Los antecedentes clínicos (alergias a fármacos, enfermedades crónicas, cirugías previas) forman parte de la historia clínica universal y permanente del centro médico, necesaria para cualquier acto médico asistencial seguro.
  - **Administrador (`ADMIN`):** Acceso total para supervisión y auditoría clínica.
  - **Pacientes (`PACIENTE`):** Acceso de **solo lectura estricta** (CU19 / §3.4) exclusivamente a su propio expediente (blindado por control Anti-IDOR).
  - **Recepcionistas (`RECEPCIONISTA`):** Bloqueo total con `HTTP 403 Forbidden` por secreto médico.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (transformados 2046 módulos en 40.91s).

---
- **Diagnóstico y Corrección en Backend ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php)):**
  - **Inconsistencia de Atributos Resuelta:** El servicio filtraba antecedentes con propiedades inexistentes (`$a->tipo`, `$a->nombre`, `$a->severidad`, `$a->observaciones`), provocando que las alertas de alergias en cabecera quedaran vacías y que la pestaña de antecedentes no desplegara información válida.
  - **Mapeo Estricto al Esquema Relacional de `antecedentes`:** Se corrigió a `tipo_antecedente`, `descripcion`, `fecha_registro`, `estado` y relación Eloquent `registrador:id_usuario,username,nombres,apellidos,rol` tanto en la síntesis clínica como en el timeline cronológico.
- **Transformación de Frontend en Pestaña de Antecedentes ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Barra de Herramientas y Acciones de CU17:**
    - Título descriptivo con badge de conteo total de antecedentes.
    - Botón de acción asistencial **`+ Registrar Antecedente`** (`Plus`) para médicos y administradores que abre [`AntecedenteFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedenteFormModal.jsx).
    - Barra de chips/filtros con iconos por categoría oficial (`Todos`, `Alérgicos`, `Patológicos`, `Quirúrgicos`, `Farmacológicos`, `Familiares`) con contadores en tiempo real.
    - Switch interactivo para auditar antecedentes dados de baja lógica (`Ver inactivos (RN11)`).
  - **Tarjetas Clínicas Enriquecidas por Antecedente:**
    - Identificación visual con iconos temáticos y paleta diferenciada (`AlertTriangle` en rose para alergias prioritarias, `Activity` en blue para patologías, `Scissors` en purple para cirugías, `Pill` en emerald para fármacos, `Users` en amber para antecedentes familiares).
    - Badge de vigencia (`ACTIVO` en verde / `INACTIVO` en gris con opacidad atenuada).
    - Descripción clínica completa y nítida (`a.descripcion`).
    - Pie de trazabilidad: fecha de registro (`Calendar`) y profesional que registró (`User`, `Dr(a). ...`).
    - Acciones asistenciales directas en cada tarjeta: botón **`Editar`** (`Edit2`) para abrir el formulario de actualización y botón **`Desactivar / Reactivar`** (`Power`) para alternar la baja lógica RN11 con recarga reactiva instantánea.
  - **Banner Superior de Alergias Corregido:** Ahora detecta y muestra de forma reactiva las alergias activas del paciente con texto de advertencia roja pulsante.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (20.66s).

---
- **Sustitución de Select Nativo por Search Combobox Flotante ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Diagnóstico del problema:** Al buscar un paciente en el expediente clínico (por nombre o CI), el filtro reducía las opciones a 1 solo elemento en un `<select>` HTML estándar; como el navegador lo dejaba seleccionado automáticamente por defecto en el índice 0, hacer clic en él no disparaba el evento `onChange`, dejando bloqueado el expediente anterior (ej. Rodrigo Alarcón) e impidiendo cargar al paciente buscado.
  - **Nuevo Buscador Unificado con Autocompletado y Popover Flotante:**
    - Campo de búsqueda interactivo con icono `Search`, botón de borrado rápido (`X`) y atajo de teclado (`Enter` para seleccionar el primer resultado, `Escape` para cerrar).
    - Desplegable flotante (`z-50`, backdrop blur, borde limpio y sombra elevada) con conteo de coincidencias en tiempo real.
    - Cada fila presenta avatar con iniciales, nombre y apellidos, número de cédula (CI), código de Historia Clínica (`HC-xxxx`), género y edad.
    - Clic directo en cualquier resultado invoca `handleSelectPatient`, actualiza inmediatamente el expediente del paciente seleccionado, cierra el menú y resalta el paciente activo.
    - Botón selector y pastilla en cabecera para ver el paciente cargado actualmente o abrir el catálogo rápidamente.
    - Listener exterior para cerrar automáticamente el desplegable al hacer clic fuera del componente (`handleClickOutside`).
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos transformados en 40.26s).

---
- **Corrección de Mojibake en [`DoctorAgendaView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/DoctorAgendaView.jsx):**
  - **Saneamiento integral de caracteres especiales:** Se corrigieron todas las cadenas con doble codificación/mojibake UTF-8 (`MatrÃ­cula:` ➔ `Matrícula:`, `â€¢` ➔ `•`, `Agenda MÃ©dica Personal` ➔ `Agenda Médica Personal`, `dÃ­a` ➔ `día`, `MiÃ©rcoles` ➔ `Miércoles`, `SÃ¡bado` ➔ `Sábado`, `Consulta MÃ©dica` ➔ `Consulta Médica`, etc.).
  - **Tratamiento inclusivo de médicos:** Estandarizado `Dr(a).` en títulos y cabeceras de médicos para dar cobertura coherente a doctoras y doctores del plantel.
  - **Auditoría global:** Verificado con escaneo recursivo que el 100% de los archivos `.jsx` y `.js` del frontend y `.php` del backend tienen 0 caracteres corruptos.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 16.43s).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 07/11/2026 (Estandarización Universal de Modales con ModalPortal, Viewport Lock y Centrado)
- **Estandarización de Todos los Modales de la Aplicación:**
  - **Componente Maestro [`ModalPortal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/ModalPortal.jsx):**
    - Se aisló la renderización de todos los modales mediante `createPortal(..., document.body)`, desacoplándolos de contenedores con `overflow-y-auto` y animaciones `transform` en `<main>` de `App.jsx`.
    - **Scroll-lock automático en body:** `document.body.style.overflow = 'hidden'` mientras el modal esté abierto, previniendo desplazamiento no deseado de la página de fondo.
    - **Cierre consistente:** Cierre al hacer clic en el backdrop exterior (`e.target === e.currentTarget`) y al presionar la tecla `Escape`.
    - **Centrado vertical responsivo:** Uso de `my-auto` en el panel principal para garantizar centrado óptimo en cualquier dispositivo.
  - **Modales Migrados a ModalPortal:**
    - Recursos Clínicos: [`PatientFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/PatientFormModal.jsx), [`PatientDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/PatientDetailModal.jsx), [`PatientWebAccountModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/PatientWebAccountModal.jsx), [`DoctorFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/DoctorFormModal.jsx), [`DoctorDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/DoctorDetailModal.jsx), [`BlockModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/BlockModal.jsx), [`ActivatePatientModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/ActivatePatientModal.jsx).
    - Seguridad: [`UserFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/security/components/UserFormModal.jsx), [`SecurityPolicyModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/security/components/SecurityPolicyModal.jsx), [`AuditDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/security/components/AuditDetailModal.jsx).
    - Citas Médicas: [`AppointmentBookingModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx), [`AppointmentRescheduleModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentRescheduleModal.jsx), [`AppointmentCancelModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentCancelModal.jsx), [`AppointmentStatusModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentStatusModal.jsx), [`PatientAppointmentHistoryModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/PatientAppointmentHistoryModal.jsx).
    - Historia Clínica: [`ConsultaRegistroModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ConsultaRegistroModal.jsx), [`AntecedentesPatientModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedentesPatientModal.jsx), [`AntecedenteFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedenteFormModal.jsx), [`RecetaPrescripcionModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/RecetaPrescripcionModal.jsx), [`RecetaDetailModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/RecetaDetailModal.jsx), [`RecetaAnularModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/RecetaAnularModal.jsx).
    - Landing Page: Modal de agendamiento rápido en [`HomePage.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/pages/HomePage.jsx).
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 17.75s).
- **Bitácora Registrada:** [`docs/ai/sessions/2026-11-07-estandarizacion-modales-modal-portal.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/sessions/2026-11-07-estandarizacion-modales-modal-portal.md).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 08/11/2026 (Saneamiento de Guiones y Caracteres Tipográficos en Generador PDF CU23)
- **Corrección de Carácter `?` en Encabezado de Reportes PDF ([`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js)):**
  - **Causa raíz:** En la función `buildPdfDocument`, el título institucional y el subtítulo utilizaban caracteres tipográficos no ASCII (em-dash `—` U+2014 y punto medio `·` U+00B7). La expresión regular de sanitización para fuentes estándar de PDF (`replace(/[^\x20-\x7E]/g, '?')`) transformaba cualquier carácter fuera del rango ASCII imprimible en un signo de interrogación `?`.
  - **Solución implementada:**
    - Se reemplazaron explícitamente las cadenas estáticas de título y subtítulo por guiones ASCII estándar `-` (`Centro Medico La Cruz - Clinica Vida Salud` y `Reporte Asistencial y Estadistico (CU23) - Tipo: ...`).
    - Se mejoró la función `sanitizePdfText` con un pre-mapeo universal de caracteres tipográficos extendidos (`[—–]` ➔ `-`, `[·•]` ➔ `-`, `[“”]` ➔ `"`, `[‘’]` ➔ `'`, `[º°]` ➔ `o`, `[ª]` ➔ `a`), sustituyendo cualquier remanente por espacio en lugar de `?`.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2m 16s).

---
- **Corrección de Error SQLSTATE[42703] Undefined column «nombres» ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php) y [`AntecedenteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/AntecedenteService.php)):**
  - **Causa raíz:** Se intentaba hacer eager loading de `registrador:id_usuario,username,nombres,apellidos,rol` sobre la tabla `usuarios`. En la base de datos de PostgreSQL, la tabla `usuarios` únicamente cuenta con `id_usuario`, `username`, `email`, `tipo_usuario` y `estado` (los nombres y apellidos de los médicos residen en la tabla relacional `medicos`).
  - **Solución implementada:** Se reestructuró la relación eager a `['registrador:id_usuario,username,tipo_usuario', 'registrador.medico:id_medico,id_usuario,nombres,apellidos']`.
  - **Frontend actualizado:** [`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx) formatea el registrador de forma segura: `Dr(a). ${a.registrador.medico.nombres} ...` si tiene médico vinculado o `@${a.registrador.username}` si es usuario administrador del sistema.
  - **Prueba de integración exitosa:** Ejecutado script de prueba en backend con el usuario `doctor.aguilera` cargando expedientes y antecedentes de pacientes sin ningún error SQL (100% de éxito).
- **Modelo de Permisos y Autorizaciones Oficiales (CU17 / CU19):**
  - **Médicos (`MEDICO`):** Tienen acceso de lectura y escritura para **cualquier paciente** en el sistema. Los antecedentes clínicos (alergias a fármacos, enfermedades crónicas, cirugías previas) forman parte de la historia clínica universal y permanente del centro médico, necesaria para cualquier acto médico asistencial seguro.
  - **Administrador (`ADMIN`):** Acceso total para supervisión y auditoría clínica.
  - **Pacientes (`PACIENTE`):** Acceso de **solo lectura estricta** (CU19 / §3.4) exclusivamente a su propio expediente (blindado por control Anti-IDOR).
  - **Recepcionistas (`RECEPCIONISTA`):** Bloqueo total con `HTTP 403 Forbidden` por secreto médico.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (transformados 2046 módulos en 40.91s).

---
- **Diagnóstico y Corrección en Backend ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php)):**
  - **Inconsistencia de Atributos Resuelta:** El servicio filtraba antecedentes con propiedades inexistentes (`$a->tipo`, `$a->nombre`, `$a->severidad`, `$a->observaciones`), provocando que las alertas de alergias en cabecera quedaran vacías y que la pestaña de antecedentes no desplegara información válida.
  - **Mapeo Estricto al Esquema Relacional de `antecedentes`:** Se corrigió a `tipo_antecedente`, `descripcion`, `fecha_registro`, `estado` y relación Eloquent `registrador:id_usuario,username,nombres,apellidos,rol` tanto en la síntesis clínica como en el timeline cronológico.
- **Transformación de Frontend en Pestaña de Antecedentes ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Barra de Herramientas y Acciones de CU17:**
    - Título descriptivo con badge de conteo total de antecedentes.
    - Botón de acción asistencial **`+ Registrar Antecedente`** (`Plus`) para médicos y administradores que abre [`AntecedenteFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedenteFormModal.jsx).
    - Barra de chips/filtros con iconos por categoría oficial (`Todos`, `Alérgicos`, `Patológicos`, `Quirúrgicos`, `Farmacológicos`, `Familiares`) con contadores en tiempo real.
    - Switch interactivo para auditar antecedentes dados de baja lógica (`Ver inactivos (RN11)`).
  - **Tarjetas Clínicas Enriquecidas por Antecedente:**
    - Identificación visual con iconos temáticos y paleta diferenciada (`AlertTriangle` en rose para alergias prioritarias, `Activity` en blue para patologías, `Scissors` en purple para cirugías, `Pill` en emerald para fármacos, `Users` en amber para antecedentes familiares).
    - Badge de vigencia (`ACTIVO` en verde / `INACTIVO` en gris con opacidad atenuada).
    - Descripción clínica completa y nítida (`a.descripcion`).
    - Pie de trazabilidad: fecha de registro (`Calendar`) y profesional que registró (`User`, `Dr(a). ...`).
    - Acciones asistenciales directas en cada tarjeta: botón **`Editar`** (`Edit2`) para abrir el formulario de actualización y botón **`Desactivar / Reactivar`** (`Power`) para alternar la baja lógica RN11 con recarga reactiva instantánea.
  - **Banner Superior de Alergias Corregido:** Ahora detecta y muestra de forma reactiva las alergias activas del paciente con texto de advertencia roja pulsante.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (20.66s).

---
- **Sustitución de Select Nativo por Search Combobox Flotante ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Diagnóstico del problema:** Al buscar un paciente en el expediente clínico (por nombre o CI), el filtro reducía las opciones a 1 solo elemento en un `<select>` HTML estándar; como el navegador lo dejaba seleccionado automáticamente por defecto en el índice 0, hacer clic en él no disparaba el evento `onChange`, dejando bloqueado el expediente anterior (ej. Rodrigo Alarcón) e impidiendo cargar al paciente buscado.
  - **Nuevo Buscador Unificado con Autocompletado y Popover Flotante:**
    - Campo de búsqueda interactivo con icono `Search`, botón de borrado rápido (`X`) y atajo de teclado (`Enter` para seleccionar el primer resultado, `Escape` para cerrar).
    - Desplegable flotante (`z-50`, backdrop blur, borde limpio y sombra elevada) con conteo de coincidencias en tiempo real.
    - Cada fila presenta avatar con iniciales, nombre y apellidos, número de cédula (CI), código de Historia Clínica (`HC-xxxx`), género y edad.
    - Clic directo en cualquier resultado invoca `handleSelectPatient`, actualiza inmediatamente el expediente del paciente seleccionado, cierra el menú y resalta el paciente activo.
    - Botón selector y pastilla en cabecera para ver el paciente cargado actualmente o abrir el catálogo rápidamente.
    - Listener exterior para cerrar automáticamente el desplegable al hacer clic fuera del componente (`handleClickOutside`).
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos transformados en 40.26s).

---
- **Corrección de Mojibake en [`DoctorAgendaView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/DoctorAgendaView.jsx):**
  - **Saneamiento integral de caracteres especiales:** Se corrigieron todas las cadenas con doble codificación/mojibake UTF-8 (`MatrÃ­cula:` ➔ `Matrícula:`, `â€¢` ➔ `•`, `Agenda MÃ©dica Personal` ➔ `Agenda Médica Personal`, `dÃ­a` ➔ `día`, `MiÃ©rcoles` ➔ `Miércoles`, `SÃ¡bado` ➔ `Sábado`, `Consulta MÃ©dica` ➔ `Consulta Médica`, etc.).
  - **Tratamiento inclusivo de médicos:** Estandarizado `Dr(a).` en títulos y cabeceras de médicos para dar cobertura coherente a doctoras y doctores del plantel.
  - **Auditoría global:** Verificado con escaneo recursivo que el 100% de los archivos `.jsx` y `.js` del frontend y `.php` del backend tienen 0 caracteres corruptos.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 16.43s).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 07/11/2026 (Transición Fluida de Salida en Modales y Descarga Directa de Reportes IA en PDF)
- **Transición Fluida de Salida en Modales ([`ModalPortal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/ModalPortal.jsx) y [`index.css`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/index.css)):**
  - **Animación no abrupta al cerrar:** Implementado estado interno `isClosing` de 200ms que aplica `@keyframes modalBackdropOut` y `@keyframes modalPanelOut` al presionar `Escape`, hacer clic en el backdrop exterior o pulsar el botón `X`/Cerrar.
  - El fondo se desvanece suavemente (`opacity 1 -> 0`, `backdrop-filter 8px -> 0px`) y el panel del modal se escala suavemente (`scale 1 -> 0.96`, `translateY 0 -> 10px`), eliminando cualquier desaparición brusca en todos los modales de la aplicación.
- **Descarga Directa de Reportes por IA sin Diálogo de Impresión ([`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js) y [`VoiceReportAssistant.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/VoiceReportAssistant.jsx)):**
  - **Eliminación del panel de impresión del navegador:** Se sustituyó la apertura de pestaña secundaria con `window.print()` por un generador nativo de documentos PDF estándar (`buildPdfDocument`).
  - **Descarga instantánea como archivo binario `.pdf`:** Se construye un PDF estándar (PDF-1.4 con membrete institucional Teal `#00687A`, tarjetas KPI formateadas, tablas zebra sanitizadas y paginación) que se descarga automáticamente a la carpeta de descargas del usuario mediante `Blob` y trigger `link.click()`.
  - Botón de exportación actualizado con icono `Download` e indicación visual de descarga directa.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 1m 28s).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 08/11/2026 (Saneamiento de Guiones y Caracteres Tipográficos en Generador PDF CU23)
- **Corrección de Carácter `?` en Encabezado de Reportes PDF ([`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js)):**
  - **Causa raíz:** En la función `buildPdfDocument`, el título institucional y el subtítulo utilizaban caracteres tipográficos no ASCII (em-dash `—` U+2014 y punto medio `·` U+00B7). La expresión regular de sanitización para fuentes estándar de PDF (`replace(/[^\x20-\x7E]/g, '?')`) transformaba cualquier carácter fuera del rango ASCII imprimible en un signo de interrogación `?`.
  - **Solución implementada:**
    - Se reemplazaron explícitamente las cadenas estáticas de título y subtítulo por guiones ASCII estándar `-` (`Centro Medico La Cruz - Clinica Vida Salud` y `Reporte Asistencial y Estadistico (CU23) - Tipo: ...`).
    - Se mejoró la función `sanitizePdfText` con un pre-mapeo universal de caracteres tipográficos extendidos (`[—–]` ➔ `-`, `[·•]` ➔ `-`, `[“”]` ➔ `"`, `[‘’]` ➔ `'`, `[º°]` ➔ `o`, `[ª]` ➔ `a`), sustituyendo cualquier remanente por espacio en lugar de `?`.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2m 16s).

---
- **Corrección de Error SQLSTATE[42703] Undefined column «nombres» ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php) y [`AntecedenteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/AntecedenteService.php)):**
  - **Causa raíz:** Se intentaba hacer eager loading de `registrador:id_usuario,username,nombres,apellidos,rol` sobre la tabla `usuarios`. En la base de datos de PostgreSQL, la tabla `usuarios` únicamente cuenta con `id_usuario`, `username`, `email`, `tipo_usuario` y `estado` (los nombres y apellidos de los médicos residen en la tabla relacional `medicos`).
  - **Solución implementada:** Se reestructuró la relación eager a `['registrador:id_usuario,username,tipo_usuario', 'registrador.medico:id_medico,id_usuario,nombres,apellidos']`.
  - **Frontend actualizado:** [`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx) formatea el registrador de forma segura: `Dr(a). ${a.registrador.medico.nombres} ...` si tiene médico vinculado o `@${a.registrador.username}` si es usuario administrador del sistema.
  - **Prueba de integración exitosa:** Ejecutado script de prueba en backend con el usuario `doctor.aguilera` cargando expedientes y antecedentes de pacientes sin ningún error SQL (100% de éxito).
- **Modelo de Permisos y Autorizaciones Oficiales (CU17 / CU19):**
  - **Médicos (`MEDICO`):** Tienen acceso de lectura y escritura para **cualquier paciente** en el sistema. Los antecedentes clínicos (alergias a fármacos, enfermedades crónicas, cirugías previas) forman parte de la historia clínica universal y permanente del centro médico, necesaria para cualquier acto médico asistencial seguro.
  - **Administrador (`ADMIN`):** Acceso total para supervisión y auditoría clínica.
  - **Pacientes (`PACIENTE`):** Acceso de **solo lectura estricta** (CU19 / §3.4) exclusivamente a su propio expediente (blindado por control Anti-IDOR).
  - **Recepcionistas (`RECEPCIONISTA`):** Bloqueo total con `HTTP 403 Forbidden` por secreto médico.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (transformados 2046 módulos en 40.91s).

---
- **Diagnóstico y Corrección en Backend ([`ExpedienteService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/ExpedienteService.php)):**
  - **Inconsistencia de Atributos Resuelta:** El servicio filtraba antecedentes con propiedades inexistentes (`$a->tipo`, `$a->nombre`, `$a->severidad`, `$a->observaciones`), provocando que las alertas de alergias en cabecera quedaran vacías y que la pestaña de antecedentes no desplegara información válida.
  - **Mapeo Estricto al Esquema Relacional de `antecedentes`:** Se corrigió a `tipo_antecedente`, `descripcion`, `fecha_registro`, `estado` y relación Eloquent `registrador:id_usuario,username,nombres,apellidos,rol` tanto en la síntesis clínica como en el timeline cronológico.
- **Transformación de Frontend en Pestaña de Antecedentes ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Barra de Herramientas y Acciones de CU17:**
    - Título descriptivo con badge de conteo total de antecedentes.
    - Botón de acción asistencial **`+ Registrar Antecedente`** (`Plus`) para médicos y administradores que abre [`AntecedenteFormModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/AntecedenteFormModal.jsx).
    - Barra de chips/filtros con iconos por categoría oficial (`Todos`, `Alérgicos`, `Patológicos`, `Quirúrgicos`, `Farmacológicos`, `Familiares`) con contadores en tiempo real.
    - Switch interactivo para auditar antecedentes dados de baja lógica (`Ver inactivos (RN11)`).
  - **Tarjetas Clínicas Enriquecidas por Antecedente:**
    - Identificación visual con iconos temáticos y paleta diferenciada (`AlertTriangle` en rose para alergias prioritarias, `Activity` en blue para patologías, `Scissors` en purple para cirugías, `Pill` en emerald para fármacos, `Users` en amber para antecedentes familiares).
    - Badge de vigencia (`ACTIVO` en verde / `INACTIVO` en gris con opacidad atenuada).
    - Descripción clínica completa y nítida (`a.descripcion`).
    - Pie de trazabilidad: fecha de registro (`Calendar`) y profesional que registró (`User`, `Dr(a). ...`).
    - Acciones asistenciales directas en cada tarjeta: botón **`Editar`** (`Edit2`) para abrir el formulario de actualización y botón **`Desactivar / Reactivar`** (`Power`) para alternar la baja lógica RN11 con recarga reactiva instantánea.
  - **Banner Superior de Alergias Corregido:** Ahora detecta y muestra de forma reactiva las alergias activas del paciente con texto de advertencia roja pulsante.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (20.66s).

---
- **Sustitución de Select Nativo por Search Combobox Flotante ([`ExpedienteClinicoView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ExpedienteClinicoView.jsx)):**
  - **Diagnóstico del problema:** Al buscar un paciente en el expediente clínico (por nombre o CI), el filtro reducía las opciones a 1 solo elemento en un `<select>` HTML estándar; como el navegador lo dejaba seleccionado automáticamente por defecto en el índice 0, hacer clic en él no disparaba el evento `onChange`, dejando bloqueado el expediente anterior (ej. Rodrigo Alarcón) e impidiendo cargar al paciente buscado.
  - **Nuevo Buscador Unificado con Autocompletado y Popover Flotante:**
    - Campo de búsqueda interactivo con icono `Search`, botón de borrado rápido (`X`) y atajo de teclado (`Enter` para seleccionar el primer resultado, `Escape` para cerrar).
    - Desplegable flotante (`z-50`, backdrop blur, borde limpio y sombra elevada) con conteo de coincidencias en tiempo real.
    - Cada fila presenta avatar con iniciales, nombre y apellidos, número de cédula (CI), código de Historia Clínica (`HC-xxxx`), género y edad.
    - Clic directo en cualquier resultado invoca `handleSelectPatient`, actualiza inmediatamente el expediente del paciente seleccionado, cierra el menú y resalta el paciente activo.
    - Botón selector y pastilla en cabecera para ver el paciente cargado actualmente o abrir el catálogo rápidamente.
    - Listener exterior para cerrar automáticamente el desplegable al hacer clic fuera del componente (`handleClickOutside`).
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos transformados en 40.26s).

---
- **Corrección de Mojibake en [`DoctorAgendaView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/DoctorAgendaView.jsx):**
  - **Saneamiento integral de caracteres especiales:** Se corrigieron todas las cadenas con doble codificación/mojibake UTF-8 (`MatrÃ­cula:` ➔ `Matrícula:`, `â€¢` ➔ `•`, `Agenda MÃ©dica Personal` ➔ `Agenda Médica Personal`, `dÃ­a` ➔ `día`, `MiÃ©rcoles` ➔ `Miércoles`, `SÃ¡bado` ➔ `Sábado`, `Consulta MÃ©dica` ➔ `Consulta Médica`, etc.).
  - **Tratamiento inclusivo de médicos:** Estandarizado `Dr(a).` en títulos y cabeceras de médicos para dar cobertura coherente a doctoras y doctores del plantel.
  - **Auditoría global:** Verificado con escaneo recursivo que el 100% de los archivos `.jsx` y `.js` del frontend y `.php` del backend tienen 0 caracteres corruptos.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2046 módulos, 16.43s).

---

# HANDOFF LATEST — CLÍNICA VIDA SALUD

## Estado de Relevo al 07/11/2026 (Refinamiento Full-Stack CU26: Selector Policlínico en Cascada, Visor SAGA DICOM y SSL Cloudinary)
- **Ajustes y Mejoras en CU26 (Documentos Clínicos Adjuntos & Visor DICOM):**
  - **Resolución de Error 500 en Subida a Cloudinary:** Se identificó falla de verificación SSL de cURL en entornos locales Windows (`cURL error 60`). Solucionado en [`CloudinaryStorageService.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/MedicalRecords/Services/CloudinaryStorageService.php) con `Http::withOptions(['verify' => app()->environment('production')])`.
  - **Selector Policlínico por Especialidad en Cascada:**
    - Creado catálogo exhaustivo clasificado por Especialidad o Área Clínica: *Diagnóstico por Imágenes (TAC, RMN, Rayos X, Ecografía, Mamografía)*, *Cardiología (ECG, Ecocardiograma, Holter, Prueba de Esfuerzo)*, *Laboratorio (Hemograma, Bioquímica, Examen de Orina, Cultivo, Biopsia)*, *Medicina General e Interna (Epicrisis, Consulta, Interconsulta)*, *Oftalmología (Fondo de ojo, Topografía corneal, OCT, Campo visual)* y *Legal / Administrativo (Consentimiento informado, Informe externo)*.
    - Implementado en [`ClinicalDocumentsSection.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/medical-records/components/ClinicalDocumentsSection.jsx) mediante selector en cascada (*Área / Especialidad* ➔ *Tipo de Estudio*).
    - **Cero impacto destructivo en base de datos:** El backend almacena la especialidad como metadato y clasificador estándar en título y observaciones sin requerir nuevas migraciones en `documentos_clinicos`.
  - **Soporte y Redirección al Visor DICOM SAGA:**
    - Integrado con la URL oficial de SAGA Viewer: `https://saga-it.com/dicom/viewer/app?datasources=idc`.
    - Lectura de variables `VITE_DICOM_VIEWER_URL` y fallback automático.
    - Badges específicos (`DCM` / `DICOM`) y botón de apertura en nueva pestaña para inspección radiológica en visor web profesional.
  - **Diagnóstico y Retroalimentación de Errores Transparente:**
    - Implementada función `extractErrorMessage()` para desglosar errores de validación de Laravel, límites de peso o excepciones con mensaje legible para el usuario en lugar de `Request failed with status code 500`.
  - **Limpieza de UI y Transiciones Fluidas:**
    - Acceso centralizado exclusivamente a través de "Expediente Clínico Digital" (eliminada ruta duplicada del Sidebar).
    - Paleta de colores institucional unificada en Teal médico (`#00687a`, `#003844`), eliminando tonos morados.
    - Animaciones de entrada suave (`animate-view-fade`) tanto en pestañas internas como en cambios de módulo del Sidebar.
  - **Variables de Entorno Precursoras:**
    - Registradas en `.env.example` y `.env` para Cloudinary, DICOM y Stripe Sandbox (`STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`).
- **Verificación de Calidad:**
  - `php -l`: 0 errores de sintaxis en todos los modelos, servicios y controladores.
  - `npm --prefix frontend run build`: 0 errores en 2045 módulos (15.02s).
- **Commits en Rama `prueba`:**
  - `3b1e5e5`: `chore(config): agregar variables de entorno para cloudinary en env.example`
  - `34d6421`: `fix(medical-records): corregir carga infinita de documentos, unificar paleta teal institucional y agregar transiciones fluidas`
  - `f987f51`: `feat(medical-records): catalogo policlinico por especialidad soporte visor saga dicom y resolucion ssl cloudinary`

---

## Estado de Relevo al 07/11/2026 (Fix: Modal Activar Paciente Fijo en Viewport con createPortal y Scroll-Lock)
- **Corrección en [`ActivatePatientModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/ActivatePatientModal.jsx) y [`App.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/App.jsx):**
  - **Eliminación del desplazamiento por scroll:** Se implementó `createPortal` hacia `document.body` y se desacopló el modal del contenedor con animación `transform` (`animate-view-fade`), eliminando el problema por el cual el modal se movía con el scroll vertical de la página de inicio.
  - **Bloqueo del scroll del body:** `document.body.style.overflow = 'hidden'` mientras el modal permanezca activo, restaurándose limpiamente al cerrarlo.
  - **Cierre por interacción exterior y teclado:** Se habilitó el cierre al hacer clic sobre el backdrop oscuro exterior (`e.target === e.currentTarget`) y al presionar la tecla `Escape`.
  - **Centrado vertical responsivo:** Uso de `my-auto` en el panel principal para garantizar que quede centrado en el viewport sin importar la resolución.
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2043 módulos, 11.8s).
- **Commit en Rama `prueba`:**
  - `5c4fe1b`: `fix(auth): corregir modal de activacion de paciente con createPortal, scroll-lock y cierre en backdrop`

---

## Estado de Relevo al 07/11/2026 (Sidebar Aqua Profundo, Acciones en 2 Filas y Notificaciones Push UI)
- **Rediseño Editorial del Sidebar con `/design-taste-frontend` ([`Sidebar.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/Sidebar.jsx)):**
  - **Color institucional unificado:** Se convirtió todo el sidebar a un fondo aqua profundo (`#003844` / deep teal médico) con borde sutil `#002830`, eliminando el fondo blanco plano anterior.
  - **Tipografía Serif en Secciones:** Las opciones de menú seleccionables ("Inicio", "Dashboard Clínico", "Usuarios y Roles", "Disponibilidad y Citas", etc.) ahora usan `.font-serif-clinical` con `text-sm font-medium`, mientras que los encabezados de grupo ("PRINCIPAL", "SEGURIDAD Y AUDITORÍA", etc.) se mantienen en su tipografía sans en mayúsculas pequeñas legibles (`text-cyan-200/50 font-bold text-[10px]`).
  - **Elemento Activo & Cápsula:** La opción activa se destaca con una cápsula en aqua brillante (`#00687a`) con borde de resplandor `ring-1 ring-cyan-300/30` y sombra sutil.
  - **Logo e Identidad:** Logo blanco oficial [`logo-full-white.svg`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/assets/logo-full-white.svg) en contenedor translúcido, con subtítulo en celeste hospitalario (`#70cbff`).
  - **Pie de Usuario:** Tarjeta de perfil y botones de comprimir/salir adaptados con efectos backdrop translúcidos sobre fondo oscuro.
- **Acciones de Tabla CU10 en 2 Filas ([`AppointmentsManager.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentsManager.jsx)):**
  - Botones apilados en dos niveles compactos a la derecha:
    - *Fila 1 (Operativo):* Check-in / Inasistencia, Ticket oficial de cita e Historial de máquina de estados.
    - *Fila 2 (Gestión):* Reprogramar cita (CU11) y Cancelar cita médica (CU12).
  - Ancho de columna reducido de 280px a 210px, otorgando mayor espacio a las columnas de paciente y médico.
- **Precursor UI para Notificaciones Push ([`NotificationsDropdown.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/NotificationsDropdown.jsx) y [`App.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/App.jsx)):**
  - Botón de campana `Bell` en la barra superior con indicador activo.
  - Panel flotante con estado vacío refinado: "Sin notificaciones pendientes" e informativo de capacidades para Ciclo 2 (CU20 / CU21).
- **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2043 módulos, 13.9s).
- **Commit en Rama `prueba`:**
  - `0eb2db7`: `feat(ui): rediseñar sidebar en aqua profundo con font serif, apilar acciones CU10 y agregar precursor de notificaciones`

---

## Estado de Relevo al 07/11/2026 (Rediseño de Tabla CU10 con /design-taste-frontend y Transiciones Fluidas)
- **Eliminación de Franja Condicional en Dashboard ([`ClinicalDashboardView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/ClinicalDashboardView.jsx)):**
  - Descartada por completo la franja de `CU27-RES` y `CU28-OPC` que aparecía al final de la matriz de casos de uso.
- **Rediseño Editorial de la Tabla de Citas CU10 ([`AppointmentsManager.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentsManager.jsx)):**
  - **Resolución del problema de compresión de columnas:** Se aplicó un ancho base de `min-w-[1080px]` con scroll horizontal responsivo suave, evitando que las columnas de datos clínicos se quiebren verticalmente.
  - **Columna Paciente:** Avatar redondeado con inicial del paciente, nombre completo destacado en seminegrita, línea horizontal con `Doc: {CI}` · `HC: {historia}` y botón estilizado de acceso directo a historial clínico (CU15).
  - **Columna Médico / Especialidad:** Nombre del profesional con icono de estetoscopio y badge estilizado `#00687a` para la especialidad médica.
  - **Columna Acciones:** Encabezado corregido a `Acciones` (reemplazando `Ticket`), agrupamiento ordenado de botones contextuales (`Check-in`, `Inasistencia`, `Ticket`, `Reprogramar`, `Cancelar`, `Historial`) con micro-interacciones suaves (`hover:shadow-xs`, `active:scale-95`).
- **Transiciones Fluidas en Todo el Módulo de Citas:**
  - Vistas con entrada suave `.animate-view-fade` en `AppointmentsManager.jsx`, `AppointmentAvailabilityViewer.jsx` y `DoctorAgendaView.jsx`.
  - Modales estandarizados con backdrop blur progresivo (`.animate-modal-backdrop`) y elevación sin saltos bruscos (`.animate-modal-panel`) en:
    - [`AppointmentBookingModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx)
    - [`AppointmentRescheduleModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentRescheduleModal.jsx)
    - [`AppointmentCancelModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentCancelModal.jsx)
    - [`AppointmentStatusModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/AppointmentStatusModal.jsx)
    - [`PatientAppointmentHistoryModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/appointments/components/PatientAppointmentHistoryModal.jsx)
    - Modal oficial de Ticket de Cita en `AppointmentsManager.jsx`.
- **Verificación Técnica:** `npm --prefix frontend run build` verificado exitosamente (11.59s, 0 errores, 2042 módulos).
- **Commits en Rama `prueba`:**
  - `eefa6be`: `refactor(analytics): eliminar seccion de casos de uso condicionales en dashboard clinico`
  - `a279ba8`: `feat(appointments): optimizar anchos de tabla de citas CU10 y agregar transiciones fluidas en modulo de citas`

---

## Estado de Relevo al 07/11/2026 (Perfeccionamiento de CU23 — Exportación PDF/Excel y Micrófono Móvil/Web Speech)
- **Mejoras en CU23: Asistente de Reportes por Voz con IA ([`VoiceReportAssistant.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/VoiceReportAssistant.jsx)):**
  - **Resolución de Reconocimiento de Voz (Web Speech API):**
    - Se solucionó el corte a los 2 segundos: se activó `continuous = true` con temporizador inteligente de silencio de 3.5 segundos para no abortar ante vacilaciones o pausas breves al hablar.
    - Se configuró el idioma universal `es-419` (Español Latinoamericano) con alta disponibilidad en todos los navegadores.
    - Solicitud explícita y transparente de permisos de hardware con `navigator.mediaDevices.getUserMedia({ audio: true })` antes de iniciar SpeechRecognition, asegurando que móviles (Chrome, Safari) y navegadores de escritorio muestren el diálogo nativo de permisos.
    - Detección de orígenes seguros (`isSecureContext`) para orientar a usuarios si acceden desde celular por red local HTTP.
  - **Trío Completo de Exportación en [`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js):**
    - 📄 **Exportar PDF:** Documento institucional apaisado con membrete del Centro Médico La Cruz, interpretación semántica, KPIs y tabla de registros formateada con `window.print()` nativo.
    - 📊 **Exportar Excel (`.xls`):** Hoja de cálculo con estilos, resumen de métricas y tabla de datos completa compatible con Microsoft Excel, LibreOffice y Google Sheets.
    - 📑 **Exportar CSV:** Descarga estándar con codificación UTF-8 y BOM para compatibilidad universal.
  - **Diseño y Micro-interacciones (`/design-taste-frontend`):**
    - Eliminados los saltos abruptos de maquetación: transiciones suaves de `300ms`, micro-elevación (`hover:-translate-y-0.5`), pulso de escucha activa y ondas de audio fluidas.
  - **Compilación Exitosa:** `npm --prefix frontend run build` verificado con **0 errores** (2042 módulos transformados).

---

## Estado de Relevo al 07/11/2026 (Pantalla de Inicio por Rol y Dashboard Clínico CU24)
- **Nueva Pantalla de Inicio del Panel ([`InicioPanelView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/InicioPanelView.jsx)):**
  - Saludo contextual según la hora, fecha actual en vivo en español y espacio de trabajo de la clínica.
  - Tarjeta *"Tu Cuenta"* con iniciales de usuario, rol, badge activo, identificador/correo y fecha del último acceso.
  - Matriz de *Accesos Rápidos* dinámica para cada actor (`ADMIN`, `MEDICO`, `RECEPCIONISTA`, `PACIENTE`) con enlaces directos a sus respectivos Casos de Uso.
- **Rediseño Ejecutivo del Dashboard Clínico ([`ClinicalDashboardView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/ClinicalDashboardView.jsx)):**
  - Eliminado el exceso de texto estático del panel anterior.
  - Barra de filtros temporales (`Hoy`, `7d`, `30d`, `Mes`) y rango personalizado `Desde` / `Hasta`.
  - 4 KPIs principales: *Pacientes Activos*, *Citas del Período* (% atención), *Atendidas* y *Tasa de Cancelación*.
  - Grilla de distribución mensual de estados de citas con badges de color.
  - Operativo de hoy con métricas del día y agenda de pacientes de la jornada.
  - Trazabilidad académica colapsable con los módulos y CUs del examen (CU01-CU24).
- **Backend Analytics (CU24):**
  - Controlador [`DashboardController.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/Analytics/Controllers/DashboardController.php) y ruta `GET /api/analytics/dashboard-kpis` con soporte multicriterio y scoping de rol.
- **Sidebar y Navegación:**
  - Grupo *Principal* en [`Sidebar.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/Sidebar.jsx) con **`Inicio`** (vista por defecto) y **`Dashboard Clínico`**.
  - `npm --prefix frontend run build` verificado exitosamente con **0 errores** (2042 módulos).

---

## Estado de Relevo al 07/11/2026 (Rediseño Editorial Frontend, Slider & Unificación Tipográfica)
- **Frontend Refactorizado y Modernizado:**
  - **Tipografía Editorial Unificada (`Fraunces` + `Plus Jakarta Sans`):**
    - Banner `"Bienvenido, {usuario}"` en `App.jsx`, cabeceras de sección (`{getSectionTitle()}`), cabecera del `Sidebar.jsx` ("Centro Médico") y modales ahora usan `.font-serif-clinical` con estilo sobrio y elegante.
    - Los 6 paquetes asistenciales (`src/apps/security/`, `src/apps/clinical-resources/`, `src/apps/appointments/`, `src/apps/medical-records/`, `src/apps/analytics/` y `ForgotPasswordPage.jsx`) actualizados al 100%: eliminada toda presencia de `font-montserrat` en favor de `font-serif-clinical` (títulos) y `font-sans-clinical` (métricas, botones, etiquetas).
    - Regla defensiva en [`index.css`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/index.css) con fallback para `.font-montserrat`.
  - **Hero Slider Autónomo & Deslizamiento Continuo:** 4 pantallas deslizantes con riel flex y avance automático cada **10 segundos**:
    1. *Cuerpo Médico:* Imagen exclusiva del plantel médico (`doctors-clinica.jpg`) con tira de acreditación sanitaria.
    2. *Especialidades & Familia:* Dúo visual de pediatría (`clinica-pediatria.png`) y medicina familiar/geriatría (`doctor-geriatric.jpg`).
    3. *Portal del Paciente:* Gestión digital de citas, historial y recetas con C.I.
    4. *Guardia 24/7 & Emergencias:* Comité clínico de guardia ininterrumpida en Equipetrol (`sesiones-clinicas.jpg`).
  - **Altura Uniforme & Responsive:** Todas las pantallas comparten contenedor `min-h-[480px] lg:min-h-[510px]` para eliminar saltos de maquetación (CLS).
  - **12 Especialidades Oficiales:** Actualizada la sección `#especialidades` en cuadrícula responsive sincronizada con los seeders de la base de datos.
  - **Flujo Estructural:** `Especialidades Médicas` reubicado inmediatamente debajo del Hero Slider y encima de `Servicios Rápidos para Pacientes`.
  - **Unificación de Activos Vectoriales:** Eliminados PNGs obsoletos; uso exclusivo de [`logo-color.svg`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/assets/logo-color.svg) y [`logo-full-white.svg`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/assets/logo-full-white.svg).
  - **Compilación Exitosa:** `npm --prefix frontend run build` verificado con 0 errores (Vite v8.3.4, 2040 módulos transformados).

---

## Estado de Relevo al 07/11/2026 (Población Integral de Base de Datos)
- **Seeder Maestro Implementado:** [ComprehensivePopulationSeeder.php](file:///c:/Users/PERSONAL/clinica-SI1/backend/database/seeders/ComprehensivePopulationSeeder.php), integrado en [DatabaseSeeder.php](file:///c:/Users/PERSONAL/clinica-SI1/backend/database/seeders/DatabaseSeeder.php).
- **Métricas Oficiales en PostgreSQL (clinica_db):**
  - **Usuarios Totales:** 51 (ADMIN: 1, RECEPCIONISTA: 3, MEDICO: 16, PACIENTE: 31 con cuenta web activa).
  - **Catálogo de Especialidades:** 12 especialidades oficiales (incorporadas Gastroenterología, Neurología, Otorrinolaringología y Endocrinología y Metabolismo).
  - **Plantel de Médicos:** 16 médicos activos, 7 de ellos con multiespecialidad formal en medico_especialidad.
  - **Disponibilidades Horarias:** 176 turnos semanales activos cubriendo lunes a sábado (mañanas y tardes).
  - **Padrón de Pacientes:** 40 pacientes registrados con sus respectivos contactos de emergencia (contactos_emergencia).
  - **Historias Clínicas:** 40 historias clínicas aperturadas (historias_clinicas), cubriendo el 100% de los pacientes.
  - **Antecedentes Médicos:** 10 pacientes con antecedentes patológicos, quirúrgicos, alérgicos y familiares en antecedentes.
  - **Citas Médicas:** 110 citas médicas distribuidas en las últimas 4 semanas y próximos 7 días:
    - 35 pacientes recurrentes con >= 3 citas cada uno.
    - 5 pacientes nuevos (IDs 36 al 40) con exactamente 1 cita cada uno.
    - Estados: 85 ATENDIDA, 7 PROGRAMADA, 6 CONFIRMADA, 3 PENDIENTE, 4 CANCELADA (con motivo y fecha), 4 NO_ASISTIO y 1 INASISTENCIA.
  - **Consultas Médicas y Expediente Digital:**
    - 83 consultas médicas con signos vitales y tratamiento registrado (consultas_medicas).
    - 83 diagnósticos clínicos con codificación CIE-10 (diagnosticos).
    - 83 notas de evolución médica (evoluciones).
    - 83 recetas médicas emitidas (recetas) con sus detalles farmacológicos (receta_detalles).
  - **Permisos RBAC:** 16 permisos granulares oficiales asignados.
  - **Secuencias PostgreSQL:** Sincronizadas al 100% mediante setval para evitar colisiones de IDs en mutaciones posteriores.

---

## Estado de Relevo al 22/10/2026

### 1. Avances Consolidados en esta Sesión
1. **Modelos en Español (PostgreSQL / DDL):**
   - Eliminados definitivamente los archivos residuales en inglés (`Doctor.php` y `Specialty.php`).
   - Modelos de dominio oficiales implementados en español: [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php) y [`Especialidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Especialidad.php).
   - Todos los controladores, seeders y requests actualizados para importar directamente `Medico` y `Especialidad`.

2. **CU06 (Gestionar Médicos — RF03) y CU07 (Especialidades — RF04) 100% Operativos:**
   - Backend: Migración de tablas `medicos`, `especialidades` y `medico_especialidad`.
   - Controladores `DoctorsController.php` y `SpecialtiesController.php`.
   - Seeders `DoctorSeeder.php` y `SpecialtySeeder.php`.
   - Frontend: `DoctorsManager.jsx`, `DoctorFormModal.jsx` y `DoctorDetailModal.jsx` restringidos exclusivamente a `ADMIN` en `Sidebar.jsx` y `App.jsx`.

3. **Perfeccionamiento de CU05 (Portal Paciente / Perfil de Pacientes):**
   - Resuelto el enlace de `id_usuario` en `PatientSeeder.php` y `DatabaseSeeder.php`.
   - Habilitado inicio de sesión directo con Cédula de Identidad (CI) en `AuthController.php`.
   - Implementado fallback de auto-vinculación resiliente en `PatientProfileController.php`.
   - Cuentas demo de pacientes (`paciente.carlos`, `paciente.mariana`, `paciente.valeria`, `paciente.fernando` con password `Admin123@`) vinculadas y verificadas.
   - Corregida la navegación hacia "¿Olvidaste tu contraseña?" (`ForgotPasswordPage`) desde cualquier ruta de acceso.

4. **CU08 (Gestionar Horarios de Atención Médica — RF05) 100% Operativo:**
   - Backend: Migración `2026_10_20_000005_create_paquete2_horarios_and_bloqueos_tables.php` (`disponibilidades` y `bloqueos_horario`).
   - Modelos Eloquent en español: [`Disponibilidad.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Disponibilidad.php) y [`BloqueoHorario.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/BloqueoHorario.php), con relaciones en [`Medico.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/ClinicalResources/Models/Medico.php).
   - FormRequests con validación P8.1 (`hora_fin > hora_inicio`): `ScheduleBatchRequest.php` y `BlockCreateRequest.php`.
   - Controlador: `SchedulesController.php` con auditoría inmutable en `bitacora` (CU03) y protección de rol `ADMIN`.
   - Frontend: [`SchedulesManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/SchedulesManager.jsx), [`BlockModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/clinical-resources/components/BlockModal.jsx) y `scheduleService.js`.
   - Navegación: Habilitado en `Sidebar.jsx` (icono `Clock`) y panel de `App.jsx` exclusivamente para rol `ADMIN`.

5. **CU09 (Consultar Disponibilidad de Horarios libres — RF05, RF06) 100% Operativo:**
   - Backend: Migración `2026_10_20_000006_create_paquete3_citas_tables.php` (`tipos_cita`, `citas`, `cita_estado_historial`).
   - Modelos Eloquent: [`Cita.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/Cita.php), [`TipoCita.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/TipoCita.php) y [`CitaEstadoHistorial.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Models/CitaEstadoHistorial.php).
   - Servicio de Dominio: [`AppointmentAvailabilityService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Services/AppointmentAvailabilityService.php) con descarte de citas activas (Prueba P9.2), feriados y licencias (Prueba P9.3), validación de médico activo (RN04) y fechas pasadas (RN06).
   - Controlador: [`AvailabilityController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AvailabilityController.php) y ruta `/api/appointments/availability`.
   - Frontend: [`AppointmentAvailabilityViewer.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentAvailabilityViewer.jsx) y `appointmentService.js`.

6. **CU10 (Programar Cita Médica con motor anti-colisión transaccional — RF06, RF07) 100% Operativo:**
   - Backend:
     - FormRequest: `AppointmentBookRequest.php` validando rangos, IDs y coherencia.
     - Servicio Transaccional: [`AppointmentBookingService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Services/AppointmentBookingService.php) con `DB::transaction()` y `lockForUpdate()` pesimista para resolver colisiones concurrentes (Prueba #4), generación de correlativo secuencial único `CM-XXXX`, validación etaria (RF04 / Prueba P10.4) y verificación de franja activa del médico (RF05 / Prueba #5).
     - Controlador: [`AppointmentsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Appointments/Controllers/AppointmentsController.php) con endpoints `store()`, `index()` con scoping RBAC (pacientes ven solo sus citas, médicos ven su agenda), `show()` y `getBookingFormData()`.
     - Auditoría: Trazabilidad en `cita_estado_historial` y `bitacora` inmutable (CU03).
   - Frontend:
     - Asistente Multipasos: [`AppointmentBookingModal.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentBookingModal.jsx) con 5 pasos interactivos y emisión de ticket oficial imprimible.
     - Panel Gestor: [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx) integrando citas programadas con visor de disponibilidad y modal de ticket.
     - Integración en `Sidebar.jsx` y `App.jsx` en pestaña `appointments`.

7. **CU12 (Cancelar Cita Médica con Motivo Obligatorio — RF09 / Prueba #6) 100% Operativo:**
   - Backend: `AppointmentCancelRequest.php` (min: 5 caracteres), `AppointmentsController::cancel()` con transacción atómica, método `$cita->cancelar()`, liberación inmediata del slot en `AppointmentAvailabilityService` sin borrado físico (RN09/RN11), registro inmutable en `bitacora` (CU03) y en `cita_estado_historial`.
   - Frontend: `appointmentService.cancelAppointment()`, modal interactivo `AppointmentCancelModal.jsx` y botón "Cancelar" condicional en `AppointmentsManager.jsx`, `DoctorAgendaView.jsx` y `PatientAppointmentHistoryModal.jsx`.

8. **CU14 (Consultar Agenda Médica Diaria — RF11 / Prueba #8) 100% Operativo:**
   - Backend: `AppointmentsController::doctorAgenda()` con filtrado por médico y fecha (`fecha` en `YYYY-MM-DD`), cálculo de 4 KPIs diarios, resolución de franja semanal activa en `Disponibilidad` y scoping RBAC (médicos solo ven su agenda; rechazo tajante a pacientes con HTTP 403).
   - Frontend: `DoctorAgendaView.jsx` con navegación rápida por fecha (día anterior, "Hoy", siguiente), selector de médico, tarjeta de franja horaria, 4 KPIs y timeline de citas con acciones (Ticket, Cancelar). Integrado como pestaña en `AppointmentsManager.jsx`.

9. **CU15 (Consultar Historial Cronológico de Citas del Paciente — RF12 / Prueba #7) 100% Operativo:**
   - Backend: `AppointmentsController::patientHistory()` con cronología descendente sin eliminación física (RN10/RN11), métricas globales (total, atendidas, canceladas, pendientes, tasa de asistencia % y fechas extremas) y scoping RBAC (pacientes solo leen su historia).
   - Frontend: `PatientAppointmentHistoryModal.jsx` con ficha del paciente, 4 métricas, filtro por estado y listado cronológico. Enlazado mediante botón "Ver Historial" en la columna de paciente de `AppointmentsManager.jsx`.

10. **Blindaje RBAC Global, Scoping Anti-IDOR y Homologación de Permisos (Auditoría Oficial):**
    - **Middleware `EnsureUserRole`:** Protege todas las rutas de `routes/api.php` verificando autenticación, estado `ACTIVO` y lista de roles autorizados.
    - **Anti-IDOR en CU10:** El backend fuerza la reserva al paciente autenticado (`$data['id_paciente'] = $miPaciente->id_paciente`), impidiendo la suplantación de identidades.
    - **Protección Perimetral en CU04, CU14, CU15:** Bloqueo de acceso al padrón de pacientes y a agendas médicas para el rol `PACIENTE`.
    - **Alineación de Permisos en UI:** Gestión de médicos (CU06) y horarios (CU08) restringidos exclusivamente a `ADMIN` en `Sidebar.jsx` y `App.jsx`.
    - **Autoservicio Guiado en Frontend:** `AppointmentBookingModal.jsx` detecta sesión de paciente y fija automáticamente su titularidad, mostrando badge *"Tu Ficha Personal (Verificada)"*.

11. **Homologación Arquitectónica con Sección 7.1 (Google Doc / RUP):**
    - **Axios en Frontend:** `frontend/src/services/api.js` configurado con `apiClient` e interceptores Bearer y withCredentials, envolviendo `apiFetch` con retrocompatibilidad absoluta.
    - **Dual Auth Sanctum Bearer Token:** Laravel Sanctum v4 emitiendo Bearer Tokens en `/auth/login`, soportado de forma híbrida en `EnsureUserRole` y almacenado en `localStorage` vía `AuthContext.jsx`.
    - **Atributo `motivo_breve`:** Mapeo bidireccional en `Cita.php` y soporte en `AppointmentBookRequest` / `AppointmentBookingService`.
    - **Estado `INASISTENCIA`:** Estandarización del 5to estado formal de cita en modelos, migraciones, seeders (CM-0010) y componentes frontend (`AppointmentsManager`, `DoctorAgendaView`, `PatientAppointmentHistoryModal`).
    - **Mailtrap Sandbox SMTP:** Parámetros configurados en `.env.example` y `.env`.

12. **Aislamiento Estricto de Roles y Casos de Uso por Actor (23/10/2026):**
    - **Médico (`MEDICO`):**
      - Módulo directo: *Mi Agenda Médica (CU14)* e *Historial de Pacientes (CU15)*.
      - Retirado del menú de admisiones/pacientes (CU04) y de la vista general de agendamiento (CU09/CU10).
      - Desactivada la acción de cancelación de cita (CU12) para médicos (privativa de Recepcionista y Paciente).
      - Tarjetas visibles en Dashboard: Únicamente `CU01` (Autenticación), `CU14` (Mi Agenda Médica) y `CU15` (Historial Clínico). Cero tarjetas extrañas.
    - **Recepcionista (`RECEPCIONISTA`):**
      - Menú y módulos autorizados: *Panel General*, *Pacientes y Fichas (CU04)*, *Habilitación de Cuentas Web en Ventanilla (CU05)* y *Disponibilidad y Citas (CU09, CU10, CU12, CU14, CU15)*.
      - Botón interactivo de habilitación web (`Globe`) integrado en la tabla del padrón para dar acceso o resetear credenciales de autoservicio (CU05 §3.4).
      - Tarjetas visibles en Dashboard: `CU01`, `CU04`, `CU05`, `CU09/CU10/CU12`, `CU14`, `CU15`.
      - Sin acceso a Usuarios (CU02), Bitácora (CU03), Médicos (CU06) ni Horarios (CU08).
    - **Paciente (`PACIENTE`):**
      - Módulos autorizados: *Mi Perfil de Paciente (CU05)* y *Mis Citas Médicas (CU09, CU10, CU12, CU15)*.
      - Botón *Mi Historial (CU15)* adaptado para cargar la ficha propia vía `patientProfileService.fetchMyProfile()`, funcionando de inmediato incluso para pacientes nuevos sin citas previas.
      - Tarjetas visibles en Dashboard: Únicamente `CU01`, `CU05`, `CU09/CU10` y `CU15`.
      - Sin acceso a agendas médicas de doctores (CU14), padrón general (CU04), bitácora (CU03) ni usuarios (CU02).
    - **Administrador (`ADMIN`):**
      - Visualiza la suite completa de control institucional (`CU01-CU04, CU06-CU08, CU09-CU15`).

13. **Métricas de Avance Consolidado (Cierre Histórico del Ciclo 1):**
    - **Ciclo 1:** 13 de 13 Casos de Uso completados (**100% de ejecución de Ciclo 1 blindado, auditado y homologado al 100% con la Sección 7.1 y aislamiento de roles**).
    - **Progreso Global del Proyecto:** 13 de 26 (+2) Casos de Uso completados (**50.0%**).
    - **10 Pruebas Mínimas del Examen Oficial Superadas:** **10 de 10 (100% de pruebas oficiales superadas)**:
      - Prueba #1 (Registrar paciente / CU04) ✅
      - Prueba #2 (CI duplicado / CU04) ✅
      - Prueba #3 (Programar cita CM-XXXX / CU10) ✅
      - Prueba #4 (Anti-colisión concurrente lockForUpdate / CU10) ✅
      - Prueba #5 (Forzar fuera de horario rechazada / CU10) ✅
      - Prueba #6 (Cancelar cita con motivo y liberación de cupo / CU12) ✅
      - Prueba #7 (Historial cronológico de paciente / CU15) ✅
      - Prueba #8 (Agenda médica por médico y fecha / CU14) ✅
      - Prueba #9 (Página sin sesión HTTP 401 / CU01) ✅
      - Prueba #10 (Operación inválida HTTP 422 tipado / Transversal) ✅

14. **Refinamiento de UX/UI y Responsividad en Cabecera de Citas (Portal Paciente / Citas):**
    - Corregida la colisión visual entre el botón `"Mi Historial (CU15)"` y el badge `"PORTAL PACIENTE"` en [`AppointmentsManager.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/appointments/components/AppointmentsManager.jsx).
    - Implementado `xl:flex-row`, `min-w-0 flex-1`, envoltura elástica (`flex-wrap`) en títulos y botones, y `overflow-x-auto` en la barra de pestañas para garantizar fluidez en todas las resoluciones.

15. **Dockerización Multi-Contenedor del Monorepo (05/11/2026):**
    - Configurado `docker-compose.yml` con 4 contenedores: `clinica_backend` (PHP 8.3 FPM), `clinica_nginx` (Proxy inverso), `clinica_postgres` (PostgreSQL 16) y `clinica_frontend` (React + Vite).
    - Inyección automática de `DB_HOST=postgres` en backend para asegurar compatibilidad transparente sin alterar `backend/.env`.
    - Documentación detallada de comandos Docker en `README.md`.

16. **Estructura Arquitectónica 100% Simétrica de los 6 Paquetes (05/11/2026):**
    - Incorporada formalmente la tabla `documentos_clinicos` (CU26) en [`docs/database/DDL_Database_Clinica_LaCruz.sql`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/DDL_Database_Clinica_LaCruz.sql), totalizando 31 tablas oficiales.
    - Scaffolded completo de los 3 paquetes restantes en Backend (`app/Packages/MedicalRecords/`, `Integrations/`, `Analytics/`) con subcarpetas `Controllers/`, `Models/`, `Requests/`, `Services/`.
    - Scaffolded completo de los 3 paquetes restantes en Frontend (`src/apps/medical-records/`, `payments/`, `analytics/`) con subcarpetas `components/`, `services/`.
    - Backend y Frontend cuentan ahora con los **6 paquetes arquitectónicos oficiales** listos para la implementación de los CUs del Ciclo 2.

17. **Declaración de Migraciones y Modelos de Dominio del Ciclo 2 (32 Tablas Totales — 05/11/2026):**
    - **Catálogo Oficial:** 26 Casos de Uso oficiales y 2 en reserva (`CU27-RES` y `CU28-OPC`).
    - **Migraciones creadas:** `2026_11_05_000002_create_paquete4_historial_clinico_tables.php` (10 tablas), `2026_11_05_000003_create_paquete5_pagos_notificaciones_tables.php` (3 tablas) y `2026_11_05_000004_create_paquete6_reportes_ia_tables.php` (1 tabla).
    - **14 Modelos Eloquent en Español:** Creados en `MedicalRecords/Models/` (10 modelos), `Integrations/Models/` (3 modelos) y `Analytics/Models/` (1 modelo) con relaciones tipadas, casts y fillables.
    - **Validación:** Sintaxis verificada al 100% con `php -l` (0 errores). Esquema listo para `php artisan migrate` y seeders clínicos.

18. **Implementación Integral de CU23 (Generar Reporte Personalizado por Voz con IA — 05/11/2026):**
    - **Backend (`app/Packages/Analytics/`):**
      - `VoiceCommandParserService.php`: Motor NLP determinístico en PHP con soporte opcional a Gemini API y fallback transparente. Reconoce intenciones, estados (`CANCELADA`, `ATENDIDA`, `PROGRAMADA`, `INASISTENCIA`), rangos de fechas dinámicos (`Carbon`) y nombres de médicos/especialidades.
      - `VoiceReportService.php`: Ejecución de consultas analíticas sobre `citas` y `pacientes`, métricas de asistencia, persistencia en `reportes_ia` y auditoría en `bitacora` (CU03).
      - `VoiceReportController.php`: Endpoints `/api/analytics/voice-report`, `/voice-history` y `/voice-stats` protegidos por middleware RBAC (`ADMIN` y `MEDICO`).
      - `VoiceReportTest.php`: Prueba automatizada de parsing semántico.
    - **Frontend (`src/apps/analytics/`):**
      - `analyticsService.js`: Conexión con endpoints y exportador a CSV.
      - `VoiceReportAssistant.jsx`: Componente interactivo con Web Speech API (`window.webkitSpeechRecognition`), animación de ondas sonoras, transcripción editable, fallback manual, chips de ejemplo, tarjetas de KPI, tabla de registros coincidentes y cajón de historial.
      - `Sidebar.jsx` y `App.jsx`: Pestaña "Reportes por Voz (IA)" agregada bajo el paquete "Reportes y Analítica (P6)".
      - Verificación de compilación: `npm run build` exitoso (0 errores).

### 2. Próxima Tarea Inmediata (Arranque del Ciclo 2)
- Planificación y ejecución del **Ciclo 2: Clínico, Pagos y Analítica**:
  - `CU11`: Reprogramar Cita Médica (RF08) con nueva fecha y liberación del horario anterior.
  - `CU13`: Registrar Asistencia y Estado de Cita Médica (RF10 — *Programada* → *Confirmada* → *Atendida* / *Inasistencia*).
  - `CU16-CU19`: Expediente Clínico Digital, Consultas, Diagnósticos CIE y Recetas.
  - `CU20-CU23`: Recordatorios, Pasarela de Pagos Stripe Sandbox y Reportes con Filtros Dinámicos (RF13).


### 10. CU13: Registrar Asistencia y Estado de Cita (RF10) — Backend Operativo (06/Noviembre/2026)
- **Backend:**
  - FormRequest: `AppointmentChangeStatusRequest.php` (`nuevo_estado`, `observacion`).
  - Dominio: Constantes de estado y matriz `TRANSICIONES_VALIDAS` en `Cita.php`.
  - Servicio: `AppointmentStatusService.php` transaccional con `lockForUpdate()`, validación temporal y scoping por rol.
  - Controlador: `AppointmentsController::updateStatus()` y `AppointmentsController::statusHistory()`.
  - Rutas: `PATCH /api/appointments/{id}/status` y `GET /api/appointments/{id}/status-history`.
  - Verificación: Sintaxis PHP 100% limpia comprobada con `php -l`.
- **Pendiente Inmediato Frontend:**
  - Integrar métodos en `appointmentService.js`.
  - Crear modal interactivo `AppointmentStatusModal.jsx` y botones de acción rápida en mostrador (`AppointmentsManager.jsx`) y agenda médica (`DoctorAgendaView.jsx`).

### 11. CU17: Gestionar Antecedentes Médicos (Extra / §3.4) — 100% Full-Stack Operativo (07/Noviembre/2026)
- **Backend:**
  - Modelo: `Antecedente.php` con 5 tipos formales y scopes.
  - Requests: `AntecedenteCreateRequest.php` y `AntecedenteUpdateRequest.php`.
  - Servicio: `AntecedenteService.php` con resiliencia de historia clínica, anti-duplicados, baja lógica (RN11) y auditoría inmutable.
  - Controlador: `AntecedentesController.php` (`indexByPatient`, `store`, `update`, `toggleStatus`).
  - Rutas:
    - `GET /api/medical-records/patients/{patientId}/antecedentes`
    - `POST /api/medical-records/patients/{patientId}/antecedentes`
    - `PUT /api/medical-records/antecedentes/{id}`
    - `PATCH /api/medical-records/antecedentes/{id}/toggle-status`
  - Verificación: Sintaxis PHP 100% limpia comprobada con `php -l`.
- **Frontend:**
  - Servicio API: `antecedenteService.js`.
  - Modales: `AntecedenteFormModal.jsx` (chips rápidos y categorías oficiales) y `AntecedentesPatientModal.jsx` (pestañas, alergias destacadas, baja lógica RN11).
  - Integraciones: `ConsultaRegistroModal.jsx` (gestión directa en consulta activa y recarga de alertas alérgicas), `ConsultasManager.jsx` y `PatientsManager.jsx`.
  - Verificación: Compilación de producción con `npm run build` exitosa (0 errores).
  - Pruebas: Casos `CN-CU17-01` a `CN-CU17-10` documentados en `docs/informes/PRUEBAS_CAJA_NEGRA.md`.

### 12. CU18: Gestionar Expediente Clínico Digital — Prescripción y Recetas Médicas — 100% Full-Stack Operativo (07/Noviembre/2026)
- **Backend:**
  - Modelos Eloquent: `Receta.php` y `RecetaDetalle.php` enriquecidos con constantes (`ESTADO_ACTIVO`, `ESTADO_ANULADO`), scopes (`scopeActivas`, `scopeDelMedico`) y relaciones completas.
  - Migración: `2026_11_07_000001_add_motivo_anulacion_to_recetas_table.php` (`motivo_anulacion`, `anulado_en`).
  - Requests: `RecetaCreateRequest.php` (validación estricta de renglones posológicos no vacíos) y `RecetaAnularRequest.php` (`motivo_anulacion` min:5).
  - Servicio: `RecetaService.php` con transacción atómica `DB::transaction()`, control Anti-IDOR para facultativos médicos, filtros inteligentes con KPIs y auditoría inmutable en `Bitacora.php` (`EMITIR_RECETA`, `ANULAR_RECETA`).
  - Controlador: `RecetasController.php` (`index`, `show`, `byConsulta`, `store`, `anular`).
  - Rutas protegidas en `backend/routes/api.php` con middleware `role`.
  - Verificación: Sintaxis PHP 100% limpia comprobada con `php -l` (0 errores).
- **Frontend:**
  - Servicio API: `recetaService.js` (`fetchRecetas`, `fetchRecetaById`, `fetchRecetasByConsulta`, `emitirReceta`, `anularReceta`).
  - Modales:
    - `RecetaPrescripcionModal.jsx`: Creador interactivo de prescripciones con renglones posológicos dinámicos, atajos rápidos de dosis/frecuencia/duración y advertencia destacada de antecedentes alérgicos (CU17).
    - `RecetaDetailModal.jsx`: Recetario institucional membretado con formato oficial, RP (℞), datos del facultativo, `@media print` para impresión y marca de agua en anuladas.
    - `RecetaAnularModal.jsx`: Diálogo de confirmación para baja lógica inmutable con motivo obligatorio (RN11).
  - Vistas y Navegación:
    - `RecetasManager.jsx`: Panel gestor con 3 tarjetas KPI (`Total`, `Activas`, `Anuladas`), buscador en vivo y filtros por estado/fecha.
    - `Sidebar.jsx`: Agrupador "Historial Clínico y Consultas (P4)" con accesos a `Consultas` y `Recetas`.
    - `App.jsx`: Pestaña `recetas` y tarjeta de acceso rápido en el dashboard.
  - Verificación: Compilación de producción con Vite (`npm run build` en 22.45s, 0 errores).
- **Próximo Paso Inmediato:**
  - Proceder con **CU22: Generar Reportes con Filtros Dinámicos (RF13)** para completar el último Requerimiento Funcional obligatorio del examen oficial.

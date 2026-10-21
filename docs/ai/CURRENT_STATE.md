# CURRENT STATE — CLÍNICA VIDA SALUD

## Estado Actual al 20/10/2026

### 1. Documentación Base y Especificación Aprobada
- ✅ Definición formal de los **23 Casos de Uso** oficiales del sistema en `docs/CU_ESPECIFICACION_SISTEMA.md`.
- ✅ Definición del caso condicional en reserva `CU24-OPC` para ser evaluado en el Ciclo 2.
- ✅ Alcance del proyecto (Sección 1.4) alineado a los 13 requerimientos funcionales del examen (`RF01` al `RF13`) y el perfil del paciente (§3.4).
- ✅ Unificación del actor **Médico** (se descarta duplicar con Especialista).
- ✅ **Aprobada la Arquitectura por Paquetes de Dominio:** Backend (`app/Packages/`) y Frontend (`src/apps/`) simétricos para los 6 paquetes documentada en `docs/ai/ARCHITECTURE.md`.
- ✅ Guía y directrices de contexto para agentes formalizadas en `AGENTS.md` y `docs/ai/MASTER_AGENT_PROMPT.md` con la regla de oro de guiarse por `DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml`.

### 2. Implementación de CU01 (Autenticar Usuario — RF01) y Políticas de Seguridad
- **Backend (`backend/app/Packages/Security/`):**
  - ✅ Migración creada: `2026_10_20_000001_create_paquete1_seguridad_tables.php` conteniendo las 7 tablas del Paquete 1 (`usuarios`, `roles`, `permisos`, `usuario_rol`, `rol_permiso`, `tokens_recuperacion`, `bitacora`).
  - ✅ Migración `2026_10_20_000002_add_bloqueado_hasta_and_configuracion_seguridad_table.php`: agrega `bloqueado_hasta` a `usuarios` y la tabla editable `configuracion_seguridad`.
  - ✅ Modelos de dominio: `User.php`, `Role.php`, `Permission.php`, `PasswordResetToken.php`, `Bitacora.php` (con alias retroactivo `AuditLog`), `SecurityConfig.php`.
  - ✅ Modelo `User.php`: métodos `estaBloqueadoTemporalmente()`, `segundosRestantesBloqueo()`, `bloquearAcceso($minutos)`, y autodesbloqueo al expirar el tiempo sin requerir acción manual.
  - ✅ Modelo `SecurityConfig.php`: persistencia y lectura de parámetros globales `max_intentos_login` (def: 3) y `minutos_bloqueo` (def: 5).
  - ✅ Request de validación: `LoginRequest.php`, `ResetPasswordRequest.php`.
  - ✅ Regla de contraseña segura: `StrongPasswordRule.php` (8+ caracteres, mayúscula, minúscula, número y símbolo).
  - ✅ Controlador de autenticación: `AuthController.php` (login, control dinámico de intentos fallidos, retorno de HTTP 423 con segundos restantes en bloqueo, recuperación con código de 6 dígitos en 15 min y auditoría en bitácora).
  - ✅ Controlador de políticas: `SecurityPolicyController.php` (`GET /api/security/policy` y `PUT /api/security/policy`) para consulta y actualización de parámetros por el Administrador con auditoría en bitácora.
- **Frontend (`frontend/src/`):**
  - ✅ Cliente HTTP centralizado con cookies/credenciales: `services/api.js`.
  - ✅ Servicio de autenticación y seguridad: `authService.js` y `usersService.js` (`fetchSecurityPolicy`, `updateSecurityPolicy`).
  - ✅ Estado global de sesión: `context/AuthContext.jsx`.
  - ✅ Componentes: `LoginForm.jsx` con temporizador regresivo dinámico en vivo (`⏳ Desbloqueo en: Xm Ys`) y deshabilitación durante el bloqueo; `LoginPage.jsx`, `ForgotPasswordPage.jsx`, `HomePage.jsx` y `App.jsx`.
  - ✅ Modal `SecurityPolicyModal.jsx` accesible tanto desde la tarjeta CU01 en el panel general como desde el botón "Políticas de Bloqueo" en el panel de usuarios.

### 3. Implementación de CU02 (Gestionar Usuarios, Roles y Permisos — RF01)
- **Backend (`backend/app/Packages/Security/`):**
  - ✅ `UsersController.php`: Endpoints CRUD completos (`GET /api/users`, `POST /api/users`, `GET /api/users/{id}`, `PUT /api/users/{id}`, `PATCH /api/users/{id}/toggle-status`, `POST /api/users/{id}/unlock`).
  - ✅ `RolesController.php`: Endpoint `GET /api/roles` para listar roles y permisos para selectores dinámicos.
  - ✅ `UserCreateRequest.php`: Validador de unicidad de username y email, rol y contraseña segura.
  - ✅ `UserUpdateRequest.php`: Validador de edición con regla de unicidad ignorando el ID actual.
  - ✅ Seeder actualizado: 4 pacientes (2 hombres, 2 mujeres) y 3 médicos (Medicina General, Cardiología [H], Pediatría [M]).
  - ✅ Trazabilidad en `bitacora` (CU03) para altas, modificaciones, bajas lógicas y desbloqueos.
  - ✅ Rutas registradas en `backend/routes/api.php` bajo middleware `web`.
- **Frontend (`frontend/src/apps/security/` y `frontend/src/components/`):**
  - ✅ `Sidebar.jsx`: Barra lateral a la izquierda responsiva y colapsable (modo expandido `w-64` y modo compacto `w-20` sólo iconos) con drawer móvil y fondo backdrop.
  - ✅ `usersService.js`: Capa de servicio conectada a endpoints de usuarios y roles.
  - ✅ `UserFormModal.jsx`: Modal interactivo para creación y edición con validador visual en tiempo real de políticas de contraseñas.
  - ✅ `UsersManager.jsx`: Panel de administración con buscador en vivo, filtros por rol y estado, badges colorizados, baja lógica y desbloqueo.
  - ✅ `App.jsx`: Header superior limpio con breadcrumb dinámico y toggle rápido, integrando la barra lateral para navegación fluida.

### 4. Implementación de CU03 (Gestionar Bitácora de Auditoría — Inmutable)
- **Backend (`backend/app/Packages/Security/`):**
  - ✅ `AuditController.php`:
    - `GET /api/audit`: Consulta paginada con filtros por término textual (`q`), módulo, acción, operador responsable y rango de fechas (`fecha_inicio` y `fecha_fin`).
    - `GET /api/audit/filters-data`: Catálogo dinámico de módulos, acciones y operadores para selectores.
    - `GET /api/audit/stats`: KPIs en tiempo real (eventos hoy, logins exitosos, intentos fallidos/bloqueos, operaciones admin).
    - Rutas registradas en `routes/api.php` bajo middleware `web`.
- **Frontend (`frontend/src/apps/security/`):**
  - ✅ `auditService.js`: Cliente API para consumo de `/api/audit`.
  - ✅ `AuditLogViewer.jsx`: Vista de auditoría con 4 tarjetas KPI, panel de filtros avanzados, tabla con badges de severidad (verde/ámbar/rojo) y paginador.
  - ✅ `AuditDetailModal.jsx`: Modal para inspección forense de IP, usuario, timestamps y descripción del suceso.
  - ✅ Habilitado en `Sidebar.jsx` y `App.jsx` para acceso directo del Administrador.

### 5. Implementación de CU04 (Gestionar Pacientes — RF02)
- **Backend (`backend/app/Packages/ClinicalResources/`):**
  - ✅ Migración creada: `2026_10_20_000003_create_paquete2_pacientes_tables.php` (`pacientes` y `contactos_emergencia`).
  - ✅ Modelos de dominio: `Patient.php` (cálculo dinámico de edad, grupo etario, sugerencia de especialidad según RF04, correlativo único `HC-XXXX` y scopes de búsqueda) y `EmergencyContact.php`.
  - ✅ Requests de validación: `PatientCreateRequest.php` (CI único obligatorio, fecha no futura) y `PatientUpdateRequest.php` (ignora ID actual para unicidad).
  - ✅ Controlador de pacientes: `PatientsController.php` (CRUD completo, `stats` con conteo de grupos etarios, búsqueda rápida `searchByCi`, baja lógica `toggleStatus` con preservación histórica RN11 y auditoría en bitácora inmutable CU03).
  - ✅ Rutas registradas en `routes/api.php` bajo `/api/patients`.
  - ✅ Población de datos: `docs/informes/poblacion_database_clinica.sql` y `PatientSeeder.php` con 15 pacientes reales con diversidad etaria (pediátricos, adultos, geriátricos) y sus contactos de emergencia vinculados.
- **Frontend (`frontend/src/apps/clinical-resources/`):**
  - ✅ Servicio API: `patientService.js`.
  - ✅ `PatientsManager.jsx`: Panel clínico diseñado según la skill `frontend-design` con 4 KPIs interactivos (Total, Activos, Pediátricos, Geriátricos), barra de filtros por grupo etario, sexo y estado, tabla con badges funcionales, avatar y acciones rápidas.
  - ✅ `PatientFormModal.jsx`: Formulario accesible con cálculo de edad en tiempo real, asistente de especialidad sugerida y sección de contacto de emergencia.
  - ✅ `PatientDetailModal.jsx`: Ficha clínica rápida con criterio institucional de atención médica y datos de contacto.
  - ✅ Habilitado en `Sidebar.jsx` (Recursos Clínicos) y en la tarjeta interactiva de `App.jsx` para roles `ADMIN`, `RECEPCIONISTA` y `MEDICO`.

### 6. Implementación de CU05 (Gestionar Cuenta y Perfil del Paciente — §3.4 / Autoservicio)
- **Backend (`backend/app/Packages/ClinicalResources/`):**
  - ✅ Requests: `ActivatePatientAccountRequest.php`, `UpdatePatientProfileRequest.php`, `ChangePatientPasswordRequest.php`.
  - ✅ Controlador `PatientProfileController.php`:
    - `POST /api/patient/check-ci`: Verificación de CI en el padrón para habilitar autoservicio.
    - `POST /api/patient/activate-account`: Creación transaccional de usuario con rol `PACIENTE`, hash bcrypt y vinculación con `pacientes.id_usuario`.
    - `GET /api/patient-profile/me`: Consulta de perfil completo con datos clínicos protegidos.
    - `PUT /api/patient-profile/me`: Edición de teléfono, correo, dirección, contacto de emergencia y preferencias de notificación.
    - `PUT /api/patient-profile/change-password`: Modificación segura de credenciales con validación de contraseña actual y reglas de complejidad.
  - ✅ Controlador `PatientsController.php`:
    - `POST /api/patients/{id}/enable-web-account`: Habilitación de acceso web al paciente desde ventanilla de recepción.
  - ✅ Trazabilidad inmutable en `Bitacora.php` (CU03) para todas las activaciones y actualizaciones.
  - ✅ Rutas registradas en `routes/api.php`.
- **Frontend (`frontend/src/apps/clinical-resources/` y Shell de Navegación):**
  - ✅ Servicio API: `patientProfileService.js`.
  - ✅ `ActivatePatientModal.jsx`: Modal de autoservicio de 3 pasos (verificación de CI, configuración de credenciales con checklist en vivo y confirmación) accesible desde `LoginPage.jsx` y `HomePage.jsx`.
  - ✅ `PatientWebAccountModal.jsx`: Modal asistido para que Recepción asigne acceso web a un paciente desde `PatientsManager.jsx`.
  - ✅ `PatientProfileView.jsx`: Pantalla de perfil del paciente con separación estricta entre datos legales protegidos (solo lectura) y canales de contacto / contacto de emergencia editables, más formulario de seguridad.
  - ✅ Layout y Navegación Responsiva:
    - Sidebar fija a la altura de la pantalla (`h-screen max-h-screen sticky top-0`) con scrollbar independiente interna para soportar el crecimiento de nuevos Casos de Uso.
    - Contenedor de contenido derecho con su propia barra de deslizamiento vertical independiente en la parte lateral derecha, permitiendo desplazarse libremente hacia abajo cuando existan múltiples datos o formularios extensos, sin distorsionar la sidebar.
    - Integración de "Mi Perfil de Paciente (CU05)" en `Sidebar.jsx` para rol `PACIENTE` y acceso directo desde el Overview de `App.jsx`.

### 7. Corrección de Pantalla Blanca y Resiliencia en Frontend
- ✅ **Resolución de pantalla en blanco al acceder a `/login` o recargar:**
  - **Causa Raíz Identificada:**
    1. En `Sidebar.jsx`, el icono `User` no había sido importado desde `lucide-react`, provocando una excepción no capturada `ReferenceError: User is not defined` al renderizar el menú lateral cuando existía una sesión en `localStorage`.
    2. En `App.jsx`, el estado inicial de vista estaba hardcodeado en `'home'` ignorando `window.location.pathname`, lo que impedía resolver la ruta `/login` al refrescar o escribir la URL directamente.
    3. Ausencia de control del estado `loading` de `useAuth()`, provocando renders prematuros antes de validar la sesión con Laravel.
  - **Acciones Realizadas:**
    1. Se corrigió la importación de `User` en `frontend/src/components/Sidebar.jsx`.
    2. Se implementó `getInitialView()`, sincronización con la URL vía `window.history.pushState` y escucha del evento `popstate` en `App.jsx`.
    3. Se implementó pantalla de carga limpia con spinner turquesa mientras se verifica la sesión.
    4. Se creó e implementó `frontend/src/components/ErrorBoundary.jsx` envolviendo `<App />` en `main.jsx` para capturar cualquier anomalía futura con interfaz hospitalaria informativa y botón de recuperación.
    5. Verificación de compilación exitosa con Vite (`built in 11.35s`, 0 errores).

### 8. Siguiente Bloque Inmediato de Trabajo
- Iniciar **CU06 (Gestionar Médicos — RF03)** y **CU07 (Gestionar Especialidades Médicas — RF04)**.

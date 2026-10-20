# CURRENT STATE — CLÍNICA VIDA SALUD

## Estado Actual al 20/10/2026

### 1. Documentación Base y Especificación Aprobada
- ✅ Definición formal de los **23 Casos de Uso** oficiales del sistema en `docs/CU_ESPECIFICACION_SISTEMA.md`.
- ✅ Definición del caso condicional en reserva `CU24-OPC` para ser evaluado en el Ciclo 2.
- ✅ Alcance del proyecto (Sección 1.4) alineado a los 13 requerimientos funcionales del examen (`RF01` al `RF13`) y el perfil del paciente (§3.4).
- ✅ Unificación del actor **Médico** (se descarta duplicar con Especialista).
- ✅ **Aprobada la Arquitectura por Paquetes de Dominio:** Backend (`app/Packages/`) y Frontend (`src/apps/`) simétricos para los 6 paquetes documentada en `docs/ai/ARCHITECTURE.md`.
- ✅ Guía y directrices de contexto para agentes formalizadas en `AGENTS.md` y `docs/ai/MASTER_AGENT_PROMPT.md` con la regla de oro de guiarse por `DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml`.

### 2. Implementación de CU01 (Autenticar Usuario — RF01)
- **Backend (`backend/app/Packages/Security/`):**
  - ✅ Migración creada: `2026_10_20_000001_create_paquete1_seguridad_tables.php` conteniendo las 7 tablas del Paquete 1 (`usuarios`, `roles`, `permisos`, `usuario_rol`, `rol_permiso`, `tokens_recuperacion`, `bitacora`).
  - ✅ Modelos de dominio creados: `User.php`, `Role.php`, `Permission.php`, `PasswordResetToken.php`, `AuditLog.php`.
  - ✅ Request de validación: `LoginRequest.php`, `ResetPasswordRequest.php`.
  - ✅ Regla de contraseña segura: `StrongPasswordRule.php` (8+ caracteres, mayúscula, minúscula, número y símbolo).
  - ✅ Controlador de autenticación: `AuthController.php` (login, control de 5 intentos fallidos, bloqueo de cuenta, recuperación con código de 6 dígitos en 15 min y auditoría en bitácora).
- **Frontend (`frontend/src/`):**
  - ✅ Cliente HTTP centralizado con cookies/credenciales: `services/api.js`.
  - ✅ Servicio de autenticación: `apps/security/services/authService.js`.
  - ✅ Estado global de sesión: `context/AuthContext.jsx`.
  - ✅ Componentes: `LoginForm.jsx`, `LoginPage.jsx`, `ForgotPasswordPage.jsx`, `HomePage.jsx` y `App.jsx`.

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

### 5. Siguiente Bloque Inmediato de Trabajo
- Iniciar el **Paquete 2: Gestión de Recursos Clínicos y Pacientes (CU04: Gestionar Pacientes — RF02)**.

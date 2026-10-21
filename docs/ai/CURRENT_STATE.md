# CURRENT STATE — CLÍNICA VIDA SALUD

## Estado Actual al 21/10/2026

### 1. Documentación Base y Especificación Aprobada
- ✅ Definición formal de los **23 Casos de Uso** oficiales del sistema en `docs/CU_ESPECIFICACION_SISTEMA.md`.
- ✅ Definición del caso condicional en reserva `CU24-OPC` para ser evaluado en el Ciclo 2.
- ✅ Alcance del proyecto (Sección 1.4) alineado a los 13 requerimientos funcionales del examen (`RF01` al `RF13`) y el perfil del paciente (§3.4).
- ✅ Unificación del actor **Médico** (se descarta duplicar con Especialista).
- ✅ Aprobada la Arquitectura por Paquetes de Dominio: Backend (`app/Packages/`) y Frontend (`src/apps/`) simétricos para los 6 paquetes documentada en `docs/ai/ARCHITECTURE.md`.
- ✅ Guía y directrices de contexto para agentes formalizadas en `AGENTS.md` y `docs/ai/MASTER_AGENT_PROMPT.md` con la regla de oro de guiarse por `DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml`.
- ✅ **Nombres de Modelos y Tablas en Español:** Tablas en español (`medicos`, `especialidades`, `pacientes`, `usuarios`, `bitacora`, etc.) y modelos de dominio primarios en español (`Medico.php`, `Especialidad.php`, `Bitacora.php`) con alias retroactivos para máxima compatibilidad.

### 2. Implementación de CU01 (Autenticar Usuario — RF01) y Políticas de Seguridad
- **Backend (`backend/app/Packages/Security/`):**
  - ✅ Migraciones completas: `2026_10_20_000001_create_paquete1_seguridad_tables.php` y `2026_10_20_000002_add_bloqueado_hasta_and_configuracion_seguridad_table.php`.
  - ✅ Modelos de dominio (`User.php`, `Role.php`, `Permission.php`, `PasswordResetToken.php`, `Bitacora.php`, `SecurityConfig.php`).
  - ✅ Bloqueo temporal configurable por Administrador (intentos fallidos y minutos de castigo) con autodesbloqueo al expirar.
  - ✅ Recuperación de contraseña con código de 6 dígitos (15 min) y `StrongPasswordRule.php`.
- **Frontend (`frontend/src/`):**
  - ✅ `LoginPage.jsx` con switcher para Personal Médico y Portal Paciente, temporizador de bloqueo en vivo.
  - ✅ `ForgotPasswordPage.jsx`, `SecurityPolicyModal.jsx` y `context/AuthContext.jsx`.
  - ✅ Enlace directo y navegación fluida hacia `ForgotPasswordPage` desde cualquier URL o estado inicial (`/dashboard` no autenticado o `/login`).

### 3. Implementación de CU02 (Gestionar Usuarios, Roles y Permisos — RF01)
- **Backend:** `UsersController.php` (CRUD paginado, filtros, baja lógica `toggle-status`, desbloqueo `unlock`) y `RolesController.php`.
- **Frontend:** `UsersManager.jsx` y `UserFormModal.jsx` con checklist de contraseña en tiempo real.

### 4. Implementación de CU03 (Gestionar Bitácora de Auditoría — Inmutable)
- **Backend:** `AuditController.php` con consulta paginada, filtros multicriterio, KPIs y modelo `Bitacora.php`.
- **Frontend:** `AuditLogViewer.jsx` y `AuditDetailModal.jsx`.

### 5. Implementación de CU04 (Gestionar Pacientes — RF02)
- **Backend:** `2026_10_20_000003_create_paquete2_pacientes_tables.php`, modelos `Patient.php` y `EmergencyContact.php` con correlativo `HC-XXXX` y sugerencia de especialidad según edad. `PatientsController.php` con filtros y baja lógica RN11.
- **Frontend:** `PatientsManager.jsx`, `PatientFormModal.jsx` y `PatientDetailModal.jsx`.

### 6. Implementación de CU05 (Gestionar Cuenta y Perfil del Paciente — §3.4)
- **Backend:** `PatientProfileController.php` con autoservicio `/check-ci`, `/activate-account`, `/me`, `/change-password` y `/enable-web-account`.
  - ✅ **Vinculación Resiliente y Automática:** En `me()` y `updateProfile()`, si la ficha no estaba asociada explícitamente, se auto-vincula por correo o número de documento (CI).
  - ✅ **Login con CI (CU01 / CU05):** `AuthController.php` permite iniciar sesión tanto con username, correo electrónico o Carnet de Identidad (CI) del paciente.
  - ✅ **Seeders de Pacientes Vinculados:** `DatabaseSeeder.php` y `PatientSeeder.php` vinculan automáticamente las cuentas demo con sus fichas clínicas.
- **Frontend:** `ActivatePatientModal.jsx`, `PatientWebAccountModal.jsx`, `PatientProfileView.jsx`, layout responsivo con sidebar fija y scroll vertical independiente en el margen derecho.
- **Resiliencia:** `ErrorBoundary.jsx` implementado en `main.jsx` y sincronización bidireccional de rutas (`/login`, `/dashboard`).

### 7. Implementación de CU06 (Gestionar Médicos — RF03) y CU07 (Especialidades — RF04)
- **Backend (`backend/app/Packages/ClinicalResources/`):**
  - ✅ Migración `2026_10_20_000004_create_paquete2_medicos_and_especialidades_tables.php` (`especialidades`, `medicos`, `medico_especialidad`).
  - ✅ Modelos de dominio oficiales en español: [`Medico.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/ClinicalResources/Models/Medico.php) (relaciones N:M, pivot `es_principal`, accessors `nombre_completo` y `especialidad_principal`) y [`Especialidad.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/ClinicalResources/Models/Especialidad.php) (evaluación etaria `esAptaParaEdad`). Se eliminaron definitivamente los archivos residuales en inglés (`Doctor.php` y `Specialty.php`).
  - ✅ FormRequests: `DoctorCreateRequest.php` y `DoctorUpdateRequest.php`.
  - ✅ Controladores: `DoctorsController.php` (usando exclusivamente `Medico` y `Especialidad`) y `SpecialtiesController.php`.
  - ✅ Seeders: `SpecialtySeeder.php` y `DoctorSeeder.php`.
  - ✅ Script SQL: `docs/informes/poblacion_database_clinica.sql`.
- **Frontend (`frontend/src/apps/clinical-resources/`):**
  - ✅ Servicios: `doctorService.js` y `specialtyService.js`.
  - ✅ Componentes: `DoctorsManager.jsx`, `DoctorFormModal.jsx`, `DoctorDetailModal.jsx`.
  - ✅ Habilitado en `Sidebar.jsx` para roles `ADMIN` y `RECEPCIONISTA`.

### 8. Siguiente Bloque Inmediato de Trabajo
- Iniciar **CU08 (Gestionar Horarios de Atención Médica — RF05)** para habilitar la disponibilidad horaria y motor de citas anti-colisión (CU09 y CU10).

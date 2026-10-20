# ARCHITECTURE — CLÍNICA VIDA SALUD

## 1. Visión General de la Arquitectura
Sistema de Información Web bajo arquitectura por capas, con diseño modular por **Paquetes de Dominio** (patrón Package-by-Feature / Domain Packages) y simetría total entre Backend y Frontend. Monorepo desacoplado:

```
[ Navegador Web ]
       │
       ▼ (HTTP / JSON)
[ Frontend SPA: React 19 + JavaScript (.jsx) + Tailwind CSS 4 ]
       │  ├── Shell de Vistas de Alto Nivel (HomePage, LoginPage, DashboardLayout)
       │  └── src/apps/ (Módulos desacoplados 1:1 con los Paquetes del Backend)
       │
       ▼ (API RESTful segura / Bearer Token o Sesión Laravel)
[ Backend: Laravel 13 (app/Packages/ organizados por Dominio Asistencial) ]
       │  ├── Controladores, FormRequests, Modelos Eloquent, Servicios, Middlewares
       │
       ├──────────────────────────────┬──────────────────────────────┐
       ▼                              ▼                              ▼
[ PostgreSQL ]            [ Stripe API Sandbox ]            [ Servicio de IA NLP ]
(Datos relacionales)      (Pagos de prueba)                 (Voz a filtros SQL)
```

---

## 2. Los 6 Paquetes Arquitectónicos Oficiales (Backend y Frontend Simétricos)

La lógica no se dispersa en carpetas monolíticas planas. Se organiza en **6 paquetes de dominio asistencial**:

| Paquete Oficial | Ubicación Backend (`backend/app/Packages/`) | Ubicación Frontend (`frontend/src/apps/`) | Casos de Uso | Tablas DDL Asociadas |
| :--- | :--- | :--- | :---: | :--- |
| **P1: Seguridad y Auditoría** | `app/Packages/Security/` | `src/apps/security/` | **CU01, CU02, CU03** | `usuarios`, `roles`, `permisos`, `usuario_rol`, `rol_permiso`, `tokens_recuperacion`, `bitacora` |
| **P2: Recursos Clínicos y Pacientes** | `app/Packages/ClinicalResources/` | `src/apps/clinical-resources/` | **CU04, CU05, CU06, CU07, CU08** | `pacientes`, `contactos_emergencia`, `especialidades`, `medicos`, `medico_especialidad`, `disponibilidades`, `bloqueos_horario` |
| **P3: Gestión de Citas Médicas** | `app/Packages/Appointments/` | `src/apps/appointments/` | **CU09, CU10, CU11, CU12, CU13, CU14, CU15** | `tipos_cita`, `citas`, `cita_estado_historial` (Índice único anti-solapamiento RF07) |
| **P4: Historial Clínico y Consultas** | `app/Packages/MedicalRecords/` | `src/apps/medical-records/` | **CU16, CU17, CU18, CU19** *(y `CU24-OPC`)* | `historias_clinicas`, `consultas_medicas`, `antecedentes`, `diagnosticos`, `evoluciones`, `recetas`, `receta_detalles` |
| **P5: Integraciones y Pagos** | `app/Packages/Integrations/` | `src/apps/payments/` | **CU20, CU21** | `pagos`, `notificaciones`, `push_suscripciones` |
| **P6: Reportes y Analítica** | `app/Packages/Analytics/` | `src/apps/analytics/` | **CU22, CU23** | `reportes_ia` (Consultas analíticas sobre citas, médicos y pacientes) |

---

## 3. Arquitectura del Backend: Estructura Interna de un Paquete (`app/Packages/*`)

Cada paquete en Laravel encapsula sus propios artefactos MVC + Services + Requests:

```text
backend/app/Packages/Security/
├── Controllers/
│   ├── AuthController.php            # CU01: login, me, logout, forgotPassword, resetPassword
│   ├── UsersController.php           # CU02: Gestión de operadores y asignación de roles
│   └── AuditController.php           # CU03: Consulta y filtros de bitácora
├── Requests/
│   ├── LoginRequest.php              # Validación de credenciales
│   └── ResetPasswordRequest.php      # Validación de tokens
├── Models/
│   ├── User.php                      # Tabla 'usuarios' (Guía: DDL / UML)
│   ├── Role.php                      # Tabla 'roles'
│   ├── Permission.php                # Tabla 'permisos'
│   ├── PasswordResetToken.php        # Tabla 'tokens_recuperacion'
│   └── AuditLog.php                  # Tabla 'bitacora'
├── Middleware/
│   ├── EnsureSessionValid.php        # Rechaza accesos sin sesión (Prueba 9 del examen)
│   └── CheckRole.php                 # Control RBAC por tipo_usuario
└── Services/
    ├── AuthService.php               # Lógica de verificación, intentos y sesiones
    └── AuditService.php              # Registro pasivo y desacoplado en bitácora
```

### Reglas Sagradas para el Backend:
1. **Modelos guiados por DDL y UML:** Las clases y campos de BD deben ceñirse a [`docs/database/diagrama_de_clases.puml`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/diagrama_de_clases.puml) y [`docs/database/DDL_Database_Clinica_LaCruz.sql`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/DDL_Database_Clinica_LaCruz.sql).
2. **Actor Médico Unificado:** Rol único `MEDICO`. Nunca crear un rol `ESPECIALISTA`.
3. **Transacciones Anti-Colisión (RF07):** Toda reserva/reprogramación corre dentro de `DB::transaction()`.
4. **Baja Lógica (RN11):** No se permite `DELETE` físico sobre pacientes, médicos o citas con histórico (`ON DELETE RESTRICT`).

---

## 4. Arquitectura del Frontend: Híbrida Jerárquica (`src/apps/*`)

El frontend combina un Shell de Navegación con módulos desacoplados por paquete de dominio:

```text
frontend/src/
├── assets/                          # Logos, imágenes clínicas e iconografía
├── components/                      # Componentes UI atómicos reutilizables (Button, Modal, Input, Table, Badge)
├── layouts/
│   ├── PublicLayout.jsx             # Shell para visitantes
│   └── DashboardLayout.jsx          # Shell administrativo con Sidebar dinámico según RBAC
├── context/
│   └── AuthContext.jsx              # Estado global: user, role, token, login(), logout()
├── services/
│   ├── api.js                       # Cliente HTTP (Axios) con interceptores y baseURL
│   └── errorHandler.js              # Manejo unificado de códigos 401, 403, 422, 500
├── apps/                            # SUB-APLICACIONES / MÓDULOS (1:1 con Backend)
│   ├── security/                    # Paquete 1: Login form, usuarios, visor de bitácora
│   ├── clinical-resources/          # Paquete 2: Pacientes, perfil §3.4, médicos y horarios
│   ├── appointments/                # Paquete 3: Reserva asistida, disponibilidad, reprogramación, agenda
│   ├── medical-records/             # Paquete 4: Consultas, triaje, antecedentes y expediente
│   ├── payments/                    # Paquete 5: Cobro con tarjeta de prueba en Stripe Elements
│   └── analytics/                   # Paquete 6: Los 7 reportes del RF13 y micrófono con IA
├── pages/
│   ├── HomePage.jsx                 # Portal institucional
│   └── LoginPage.jsx                # Formulario de inicio de sesión seguro (CU01)
├── App.jsx                          # Enrutador de vistas (Home / Login / Dashboard)
├── main.jsx                         # Punto de entrada ReactDOM
└── index.css                        # Tailwind CSS
```

---

## 5. Control de Acceso RBAC y Rutas Anidadas

### RBAC Declarativo en Frontend:
El Sidebar del `DashboardLayout.jsx` inspecciona el `tipo_usuario` del usuario autenticado para exponer únicamente los módulos autorizados:
* `ADMIN`: Acceso a `security`, `clinical-resources`, `appointments`, `analytics`.
* `RECEPCIONISTA`: Acceso a `clinical-resources` (pacientes), `appointments`, `analytics`.
* `MEDICO`: Acceso a `appointments` (agenda diaria), `medical-records` (consultas médicas), `analytics`.
* `PACIENTE`: Acceso a `appointments` (sus citas), `medical-records` (su propio expediente en solo lectura), `payments`.

### Rutas Anidadas en API REST (Seguridad y Privacidad Clínica):
* `GET  /api/pacientes/{id}/historial`
* `POST /api/historial-clinico/{id}/consultas`
* `GET  /api/historial-clinico/{id}/antecedentes`
* `POST /api/citas` ➔ Valida transaccionalmente en servidor contra solapamiento.

---

## 6. Configuración de Zona Horaria
* **Bolivia:** `America/La_Paz` (UTC-4).
* **Backend:** Configurado en `config/app.php`.
* **Frontend:** Formateado vía `Intl.DateTimeFormat`.

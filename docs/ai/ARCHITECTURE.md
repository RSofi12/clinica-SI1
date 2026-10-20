# ARCHITECTURE — CLÍNICA VIDA SALUD

## 1. Visión General de la Arquitectura
Sistema de Información Web bajo arquitectura por capas, modular por dominios asistenciales y simétrico entre Backend y Frontend. Monorepo desacoplado:

```
[ Navegador Web ]
       │
       ▼ (HTTP / JSON)
[ Frontend SPA: React 19 + JavaScript (.jsx) + Tailwind CSS 4 ]
       │  ├── Shell / Vistas de Alto Nivel (HomePage, LoginPage, DashboardLayout)
       │  └── apps/ (Módulos de Dominio alineados a los 6 Paquetes)
       │
       ▼ (API RESTful segura / JWT o Cookies de Sesión)
[ Backend: Laravel 13 (Controladores, Servicios Transaccionales, Policies, Observers) ]
       │
       ├──────────────────────────────┬──────────────────────────────┐
       ▼                              ▼                              ▼
[ PostgreSQL ]            [ Stripe API Sandbox ]            [ Servicio de IA NLP ]
(Datos relacionales)      (Pagos de prueba)                 (Voz a filtros SQL)
```

---

## 2. Los 6 Paquetes Arquitectónicos (Backend y Frontend Simétricos)

| Paquete | Responsabilidad en Backend (Laravel 13) | Módulo en Frontend (`frontend/src/apps/`) | Casos de Uso |
| :--- | :--- | :--- | :--- |
| **P1: Seguridad y Auditoría** | Modelos `User`, `Role`, `Permission`, `AuditLog`. Middlewares de rol y `AuditObserver`. | `apps/security/`<br/>(Gestión de usuarios/roles y visor de bitácora). | CU01, CU02, CU03 |
| **P2: Recursos Clínicos y Pacientes** | Modelos `Patient`, `Doctor`, `Specialty`, `Schedule`. Validación de CI único, rangos de edad. | `apps/clinical-resources/`<br/>(Padrón de pacientes, perfil §3.4, médicos y horarios). | CU04, CU05, CU06, CU07, CU08 |
| **P3: Gestión de Citas Médicas** | Modelo `Appointment`, `AppointmentBookingService` con `DB::transaction()` anti-colisión. | `apps/appointments/`<br/>(Reserva asistida, disponibilidad, reprogramación, agenda). | CU09, CU10, CU11, CU12, CU13, CU14, CU15 |
| **P4: Historial Clínico y Consultas** | Modelos `MedicalRecord`, `Consultation`, `MedicalBackground`, `Prescription`. Rutas anidadas. | `apps/medical-records/`<br/>(Formulario de triaje/consulta, antecedentes y expediente). | CU16, CU17, CU18, CU19 |
| **P5: Integraciones y Pagos** | Adaptador `StripeService` y despachador de notificaciones por eventos de cita. | `apps/payments/`<br/>(Modal de cobro con tarjeta de prueba en Stripe Elements). | CU20, CU21 |
| **P6: Reportes y Analítica** | Consultas agregadas Eloquent de solo lectura, exportador CSV/PDF y adaptador NLP voz. | `apps/analytics/`<br/>(Tablas de los 7 reportes del RF13 y botón de dictado con IA). | CU22, CU23 |

---

## 3. Arquitectura del Frontend: Híbrida Jerárquica

El frontend combina una experiencia de navegación fluida para el usuario con una organización modular rigurosa:

```text
frontend/src/
├── assets/                          # Logos, imágenes clínicas e iconografía
├── components/                      # Componentes UI reutilizables sin lógica de negocio
│   └── ui/                          # Button, Modal, Table, Badge, Input, Spinner
├── layouts/                         # Estructuras maestras envolventes
│   ├── PublicLayout.jsx             # Barra y navegación para visitantes
│   └── DashboardLayout.jsx          # Shell administrativo con Sidebar RBAC dinámico
├── context/
│   └── AuthContext.jsx              # Estado global: usuario autenticado, rol y token
├── services/
│   ├── api.js                       # Cliente HTTP (Axios) con interceptores y baseURL
│   └── errorHandler.js              # Captura unificada de errores 401, 403, 422, 500
├── apps/                            # Módulos por dominio de Casos de Uso (1:1 con Backend)
│   ├── security/                    # CU02, CU03
│   ├── clinical-resources/          # CU04 a CU08
│   ├── appointments/                # CU09 a CU15
│   ├── medical-records/             # CU16 a CU19
│   ├── payments/                    # CU21
│   └── analytics/                   # CU22, CU23
├── pages/                           # Vistas de Entrada Primarias
│   ├── HomePage.jsx                 # Portal institucional
│   └── LoginPage.jsx                # Formulario de inicio de sesión seguro (CU01)
├── App.jsx                          # Orquestador general (Home / Login / Dashboard)
├── main.jsx                         # Punto de entrada ReactDOM
└── index.css                        # Tailwind CSS
```

---

## 4. Control de Acceso Basado en Roles (RBAC en Frontend)

El `DashboardLayout.jsx` inspecciona el rol del usuario autenticado en el `AuthContext.jsx` para mostrar de forma declarativa solo los módulos autorizados:

* **Administrador:** Acceso a `security`, `clinical-resources`, `appointments`, `analytics`.
* **Recepcionista:** Acceso a `clinical-resources` (pacientes), `appointments`, `analytics`.
* **Médico:** Acceso a `appointments` (agenda diaria), `medical-records` (consultas), `analytics`.
* **Paciente:** Acceso a `appointments` (sus citas), `medical-records` (su propio expediente en solo lectura), `payments`.

---

## 5. Diseño de API REST y Enrutamiento Anidado

Para resguardar la confidencialidad de la información médica y evitar fugas o inyecciones de datos entre pacientes:

* **Rutas anidadas obligatorias para expedientes:**  
  `GET  /api/pacientes/{id}/historial`  
  `POST /api/historial-clinico/{id}/consultas`  
  `GET  /api/historial-clinico/{id}/antecedentes`
* **Transacciones en reserva de citas:**  
  `POST /api/citas` se procesa dentro de `DB::transaction()` con verificación de colisiones en el servidor (RF07).

---

## 6. Zona Horaria y Localización
* **Ubicación:** Bolivia (`America/La_Paz`, UTC-4).
* **Backend:** Configurado en `config/app.php` con `'timezone' => 'America/La_Paz'`.
* **Frontend:** Formateo de fechas mediante `Intl.DateTimeFormat` en la misma zona horaria.

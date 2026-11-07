# Bitácora de Sesión: Inicio del Panel por Rol y Dashboard Clínico Ejecutivo (CU24)

- **Fecha:** 2026-11-07
- **Área:** Fullstack (Backend Laravel + Frontend React)
- **Objetivo:** Creación de la nueva pantalla de "Inicio del panel" con accesos rápidos para cada actor/rol y modernización del "Dashboard Clínico" eliminando la saturación de texto estático, integrando KPIs en tiempo real, filtros temporales y desglose operativo diario (CU24).

---

## 1. Cambios en Backend (`backend/app/Packages/Analytics/`)

### 1.1. Nuevo Controlador y Endpoint de Métricas Ejecutivas (CU24)
- **Controlador:** [`DashboardController.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/Analytics/Controllers/DashboardController.php)
  - Método `getKpis(Request $request)` con soporte para filtros temporales (`hoy`, `7d`, `30d`, `mes` y rango personalizado `desde` / `hasta`).
  - Scoping de rol automático:
    - **`ADMIN` / `RECEPCIONISTA`:** Métricas consolidadas de toda la clínica.
    - **`MEDICO`:** Estadísticas y citas filtradas para su matrícula/perfil.
    - **`PACIENTE`:** Visión de sus propias citas y consultas.
  - Indicadores clave calculados:
    - `pacientes_activos`: Total de pacientes en estado `ACTIVO`.
    - `citas_periodo`: Volumen total en el rango.
    - `citas_atendidas` y `tasa_atencion`: Porcentaje de consultas concluidas.
    - `citas_canceladas` y `tasa_cancelacion`: Porcentaje de cancelaciones con motivo.
    - `citas_reprogramadas`: Citas con fecha u origen de reprogramación.
    - `distribucion_estados`: Agrupación por estado (`ATENDIDA`, `PROGRAMADA`, `CONFIRMADA`, `PENDIENTE`, `CANCELADA`, `NO_ASISTIO`, `INASISTENCIA`).
    - `operativo_hoy`: Resumen de la jornada actual y lista de citas con paciente, médico, hora y especialidad.
- **Ruta Registrada:** [`backend/routes/api.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/routes/api.php):
  - `GET /api/analytics/dashboard-kpis` protegido por middleware de roles (`role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE`).

---

## 2. Cambios en Frontend (`frontend/src/`)

### 2.1. Nueva Pantalla de Inicio del Panel ([`InicioPanelView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/InicioPanelView.jsx))
- **Saludo Contextual Dinámico:** Saludo automático según la hora en Bolivia ("Buenos días,", "Buenas tardes,", "Buenas noches,").
- **Fecha y Hora en Vivo:** Visualización en formato largo en español con ícono de reloj.
- **Tarjeta "Tu Cuenta":** Avatar con iniciales, rol asignado, estado activo con indicador verde, correo institucional y registro del último acceso.
- **Matriz de Accesos Rápidos Dinámica por Rol:**
  - `ADMIN`: Usuarios, Roles, Políticas de Bloqueo, Bitácora, Pacientes, Médicos, Horarios, Citas, Reportes IA y Dashboard.
  - `MEDICO`: Mi Agenda Diaria (CU14), Consultas Médicas (CU16), Expediente Digital (CU19), Recetas (CU18), Asistente IA (CU23) y Dashboard.
  - `RECEPCIONISTA`: Padrón de Pacientes (CU04), Programación de Citas (CU09/10), Cuentas Web CI (CU05), Recetario y Dashboard.
  - `PACIENTE`: Reservar Cita, Mis Citas, Mi Expediente, Mis Recetas y Mi Perfil.

### 2.2. Nuevo Dashboard Clínico Ejecutivo ([`ClinicalDashboardView.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/components/ClinicalDashboardView.jsx))
- **Eliminación de la Saturación de Texto:** Reemplazados los bloques estáticos por una interfaz visual, limpia y ejecutiva.
- **Barra de Filtros:** Selectores rápidos (`Hoy`, `7d`, `30d`, `Mes`) y formulario de fechas `Desde` / `Hasta`.
- **4 Tarjetas KPI:** Pacientes Activos, Citas del Período (con % de atención), Atendidas y Tasa de Cancelación.
- **Distribución de Estados:** Tabla limpia con badges de color y totales.
- **Operativo de Hoy:** Badges de resumen diario y listado de citas de la jornada.
- **Trazabilidad Académica Colapsable:** Desplegable inferior para consultar la correspondencia completa de los Casos de Uso del examen (CU01 a CU24) sin saturar la vista principal.

### 2.3. Integración en Sidebar y Navegación Principal
- [`Sidebar.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/components/Sidebar.jsx): En el grupo `Principal` ahora figuran tanto **`Inicio`** (ícono `Home`) como **`Dashboard Clínico`** (ícono `LayoutDashboard`).
- [`App.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/App.jsx): Estado inicial `dashboardTab = 'inicio'`, enrutador interno actualizado y migas de pan sincronizadas.
- [`analyticsService.js`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/analytics/services/analyticsService.js): Método `fetchDashboardKpis(params)`.

---

## 3. Verificaciones y Compilación
- `php -l`: Sintaxis PHP validada sin errores en controlador y rutas.
- `npm --prefix frontend run build`: Compilación en Vite exitosa con 0 errores (2042 módulos empaquetados).

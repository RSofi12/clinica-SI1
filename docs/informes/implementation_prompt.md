# 🩺 Prompt Estándar para Revisión General Previa a la Implementación de un Caso de Uso (CU)
### Sistema de Información Clínica — Centro Médico La Cruz / Clínica Vida Salud

> **Propósito:** Utiliza este prompt antes de comenzar a codificar cualquier Caso de Uso (`CUxx`) en el proyecto. Este prompt instruye al agente o desarrollador a generar una **Revisión General de Implementación de Alto Nivel** idéntica en rigor, estructura y profundidad técnica a la realizada para el CU06, garantizando total alineación con la metodología PUDS/RUP, los 13 Requerimientos Funcionales del Examen (`RF01-RF13`), las Reglas de Negocio (`RN01-RN14`) y la arquitectura por paquetes de dominio.

---

```markdown
Actúa como Arquitecto de Software Principal y Desarrollador Full-Stack Senior bajo la metodología PUDS / RUP en el proyecto de la Clínica Vida Salud (Centro Médico La Cruz).

Quiero que realices una **REVISIÓN GENERAL EXHAUSTIVA PREVIA A LA IMPLEMENTACIÓN** para el siguiente Caso de Uso:
👉 **[INSERTAR AQUÍ EL CÓDIGO Y NOMBRE DEL CASO DE USO, ej: CU06: Gestionar Médicos (RF03)]**

Antes de generar cualquier código o plan, debes consultar obligatoriamente como Fuentes de Verdad:
1. `docs/ai/MASTER_AGENT_PROMPT.md` y `AGENTS.md` (Mandamientos técnicos, actor médico unificado, no usar TypeScript, transacciones atómicas).
2. `docs/CU_ESPECIFICACION_SISTEMA.md` (Definición oficial del CU, ciclo PUDS asignado, actores y paquetes).
3. `docs/Ex_Parcial_2_sistemas-1.md` (Requisitos funcionales RF01-RF13, reglas de negocio RN01-RN14 y las 10 pruebas mínimas).
4. `docs/database/diagrama_de_clases.puml` y `docs/database/DDL_Database_Clinica_LaCruz.sql` (Esquema relacional y tipos de datos en PostgreSQL).
5. `docs/ai/ARCHITECTURE.md` (Estructura de paquetes en backend `app/Packages/` y frontend `src/apps/`).
6. `docs/IMPLEMENTATION_PHASES.md` (Checklist de avance y fases de prueba).

---

### ESTRUCTURA OBLIGATORIA DE LA RESPUESTA:

La revisión general debe estructurarse estrictamente en las siguientes 7 secciones:

#### 1. 🎯 Objetivo, Actores y Alcance
- **Objetivo funcional:** Explicación clara de qué resuelve este CU y con qué requerimiento funcional del examen (`RF01-RF13` o §3.4) se alinea.
- **Actores involucrados:** Definir actor gestor y actores participantes. Aplicar estrictamente la regla de **Actor Médico Unificado** (nunca crear un rol separado `ESPECIALISTA`, la especialidad es un atributo/relación del médico).
- **Alcance del ciclo:** Indicar a qué ciclo de entrega corresponde (Ciclo 1: Presentación 1 — Cita de Punta a Punta; Ciclo 2: Presentación 2 — Clínico, Integraciones y Analítica).

#### 2. 🗄️ Modelo de Datos y Tablas (PostgreSQL / DDL)
- **Diagrama Mermaid ER:** Diagrama entidad-relación representativo del CU con sus relaciones de cardinalidad (1:1, 1:N, N:M).
- **Especificación de Tablas y Columnas:** Nombres exactos de las tablas (en español según DDL), tipos de datos PostgreSQL (`bigserial`, `varchar`, `numeric`, `boolean`, `timestamptz`), llaves foráneas (`FK`), restricciones `CHECK` y valores `DEFAULT`.
- **Regla de Baja Lógica (RN11):** Identificar la columna de estado para borrado lógico (`estado_activo`, `estado_paciente`, etc.) asegurando que nunca se use `DELETE` en entidades con histórico.

#### 3. ⚙️ Arquitectura Backend (Laravel 13 - PHP 8.3)
Debe situarse en su paquete correspondiente (`app/Packages/Security/`, `ClinicalResources/`, `Appointments/`, `MedicalHistory/`, `Integrations/`, `Analytics/`).
- **Modelos de Dominio:** Nombres de las clases, relaciones Eloquent (`belongsTo`, `hasMany`, `belongsToMany`), Accessors calculados y Scopes de consulta (`scopeActivos`, `scopeBuscar`).
- **FormRequests y Validaciones:** Nombres de las clases Request, lista detallada de campos validados, reglas (`required`, `unique`, `regex`, reglas custom) y mensajes de error amigables.
- **Controlador y Nombres de Métodos:**
  - Listar métodos exactos: `index()`, `show()`, `store()`, `update()`, `toggleStatus()`, `stats()`, etc.
  - Endpoints REST con método HTTP y URI (`GET /api/...`, `POST /api/...`, `PATCH /api/...`).
  - Códigos de respuesta HTTP específicos (`200 OK`, `201 Created`, `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`, `423 Locked`).
- **Transacciones y Excepciones:** Indicar dónde se usa `DB::transaction()` con bloqueos (`lockForUpdate`), cómo se capturan excepciones (`ValidationException`, `ModelNotFoundException`, `QueryException`) y el registro automático en `Bitacora.php` (CU03).

#### 4. 🎨 Arquitectura Frontend (React + JavaScript `.jsx` con Tailwind CSS)
Debe situarse en su subdirectorio simétrico (`frontend/src/apps/[paquete]/`).
- **Convención:** JavaScript nativo (`.jsx` / ES6+), **NO TypeScript**.
- **Servicios API:** Nombres de archivos de servicio (`*Service.js`) y métodos asíncronos que consumen `apiFetch`.
- **Componentes y Vistas:**
  - Vista principal (`*Manager.jsx` o `*View.jsx`): Tarjetas KPI interactivas, barra de búsqueda en tiempo real, filtros dinámicos y tabla con badges estilizados y micro-interacciones.
  - Modales accesibles (`*FormModal.jsx`, `*DetailModal.jsx`): Campos, validación en tiempo real y asistencia visual al usuario.
- **Layout y Navegación:**
  - Habilitación del ítem correspondiente en `frontend/src/components/Sidebar.jsx`.
  - Respeto a las barras de deslizamiento independientes: la barra lateral fija con su propio scroll y el contenedor principal derecho con su scrollbar vertical independiente en el margen derecho sin distorsionar el menú.

#### 5. 🛡️ Reglas de Negocio Críticas y Casos Extremos (Edge Cases)
- Listar las reglas de negocio oficiales del examen (`RN01` a `RN14`) que impactan directamente al CU.
- Describir el tratamiento de validaciones complejas (ej. solapamientos horarios, validación de rangos etarios, formatos de carnet o matrícula profesional).
- Manejo de concurrencia y protección contra condiciones de carrera.

#### 6. 🧪 Plan y Matriz de Pruebas Específicas
- Tabla detallada con los casos de prueba obligatorios para este CU:
  - Pruebas de Camino Feliz (Happy Path).
  - Pruebas de Validación / Datos Inválidos (HTTP 422).
  - Pruebas de Seguridad y Control de Acceso (RBAC / HTTP 401 / HTTP 403).
  - Pruebas de Reglas de Negocio y Bajas Lógicas.
  - Vinculación con las **10 Pruebas Mínimas** del Examen oficial cuando corresponda.

#### 7. 📋 Documentos de Control a Actualizar al Finalizar
- `docs/IMPLEMENTATION_PHASES.md` (Marcar checkboxes `[x]`).
- `docs/ai/CURRENT_STATE.md` (Registrar hitos completados).
- `docs/ai/HANDOFF_LATEST.md` (Actualizar contexto para futuras sesiones).
- `docs/database/DDL_Database_Clinica_LaCruz.sql` y `diagrama_de_clases.puml` (Si surgen nuevas tablas o ajustes).
```

---

### 💡 Ejemplo de Uso

Para usar este prompt en el siguiente caso de uso, copia el bloque superior y reemplaza la línea destacada:

```markdown
Quiero que realices una REVISIÓN GENERAL EXHAUSTIVA PREVIA A LA IMPLEMENTACIÓN para el siguiente Caso de Uso:
👉 CU07: Gestionar Especialidades Médicas (RF04)
```

# GUÍA DE COMPORTAMIENTO Y CONTEXTO PARA AGENTES (AGENTS.md)
### Clínica Vida Salud — Centro Médico La Cruz

Este archivo define las reglas obligatorias de interacción, contexto y fuentes de verdad para cualquier agente o IA que trabaje en este repositorio.

---

## 1. 📖 Archivos de Consulta Obligatoria (Fuentes de Verdad)

Antes de responder, planificar o generar código, consulta estos documentos en orden de prioridad:

1. **[`docs/ai/README.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/README.md):** Guía del sistema de memoria persistente multi-agente del proyecto.
2. **[`docs/ai/MASTER_AGENT_PROMPT.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/MASTER_AGENT_PROMPT.md):** Mandamientos técnicos, reglas inviolables del sistema y principios PUDS.
3. **[`docs/ai/CURRENT_STATE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/CURRENT_STATE.md):** Qué está hecho hasta hoy y qué está pendiente.
4. **[`docs/ai/HANDOFF_LATEST.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/HANDOFF_LATEST.md):** Relevo operativo inmediato entre sesiones (tu brújula de partida).
5. **[`docs/ai/NEXT_STEPS.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/NEXT_STEPS.md):** La tarea inmediata a resolver.
6. **[`docs/IMPLEMENTATION_PHASES.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/IMPLEMENTATION_PHASES.md):** Checklist oficial de Casos de Uso por ciclos y fases de prueba.
7. **[`docs/CU_ESPECIFICACION_SISTEMA.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/CU_ESPECIFICACION_SISTEMA.md):** Los 23 Casos de Uso oficiales y su asignación por ciclo.
8. **[`docs/Ex_Parcial_2_sistemas-1.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/Ex_Parcial_2_sistemas-1.md):** Enunciado oficial del examen (requisitos funcionales RF01-RF13 y pruebas mínimas).
9. **[`docs/ARCHITECTURE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ARCHITECTURE.md):** Organización en los 6 paquetes y convenciones de rutas anidadas.
10. **[`docs/ai/DECISIONS_LOG.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/DECISIONS_LOG.md):** Histórico de decisiones ya acordadas que **NO** deben reabrirse sin justificación.
11. **[`docs/ai/sessions/*.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/sessions/):** Bitácoras de sesiones anteriores para mantener continuidad.

---

## 2. 🛡️ Reglas Sagradas del Proyecto (No Romper)

* **Stack Oficial:**
  - **Backend:** Laravel 13 (PHP 8.3) con servicios transaccionales y PostgreSQL.
  - **Frontend:** React + JavaScript (`.jsx` / ES6+) con Tailwind CSS. **NO usar TypeScript** en el código frontend (mantenerlo ágil y simple).
* **Guía de Base de Datos y Clases:**
  - Toda la implementación de modelos, tablas relacionales, llaves foráneas y tipos de datos **debe guiarse estrictamente de:**
    - [`docs/database/diagrama_de_clases.puml`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/diagrama_de_clases.puml)
    - [`docs/database/DDL_Database_Clinica_LaCruz.sql`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/DDL_Database_Clinica_LaCruz.sql)
  - **Convención de Idioma:** Los nombres de las tablas en PostgreSQL y los modelos de dominio de Eloquent deben escribirse en **español** (`medicos` -> `Medico.php`, `especialidades` -> `Especialidad.php`, `pacientes` -> `Paciente.php`, `bitacora` -> `Bitacora.php`, etc.), preservando alias de retrocompatibilidad si fuese necesario.
  - *(Nota: Si surge alguna necesidad de mejora técnica o requerimiento puntual del examen RF01-RF13, se pueden realizar modificaciones justificadas).*
* **Actor Médico Unificado:**  
  Existe un solo rol y actor `Médico` (`MEDICO`). Los especialistas (pediatra, geriatra, cardiólogo) son médicos con especialidades vinculadas desde el catálogo. **Nunca crear un rol separado `ESPECIALISTA`**.
* **Pacientes:**  
  Pueden ser registrados por la Recepcionista sin cuenta web, o pueden activar su cuenta de autoservicio ingresando con su **CI + contraseña**. Tienen acceso restringido: solo ven sus propias citas y su historial en modo de solo lectura.
* **Transacciones Anti-Colisión (RF07):**  
  Toda reserva o reprogramación de citas se valida en el servidor dentro de un bloque `DB::transaction()` para evitar duplicados o solapamientos para el mismo médico.
* **Baja Lógica (RN11):**  
  Los registros con historial (pacientes, médicos, citas) nunca se eliminan físicamente de la base de datos (`DELETE`); se desactivan lógicamente o se cancelan con motivo.

---

## 3. 💬 Cómo Debe Responder el Agente

* **Idioma:** Siempre en **Español**.
* **Tono:** Técnico, directo, profesional y enfocado en la metodología PUDS/RUP.
* **Código:** Limpio, modular, sin duplicación (DRY) y con comentarios explicativos cuando la regla de negocio sea crítica.
* **Links clicables:** Siempre utiliza enlaces Markdown con esquema `file://` para referenciar archivos o carpetas (ej. `[archivo.php](file:///c:/Users/PERSONAL/clinica-SI1/...)`).

---

## 4. 🧠 Sistema de Memoria Persistente y Registro de Sesiones (`docs/ai/sessions/`)

Inspirado en el flujo de continuidad multi-agente de referencia:

### Regla Obligatoria de Entrada:
- **Antes de hacer cambios:** Lee la memoria viva del proyecto (`CURRENT_STATE.md`, `HANDOFF_LATEST.md`, `NEXT_STEPS.md`).

### Regla Obligatoria de Salida:
- **Criterio Estricto para Crear Sessions y Registrar Contexto:**
  - **SÍ registrar session y contexto:** Únicamente cuando **se modifique código fuente**, se agreguen o perfeccionen funcionalidades, se creen/modifiquen migraciones o modelos de base de datos, o se apliquen cambios de lógica de negocio (Backend o Frontend).
  - **NO registrar session ni contexto:** **Jamás** se debe crear una bitácora en `docs/ai/sessions/` ni modificar los documentos de memoria (`CURRENT_STATE.md`, `HANDOFF_LATEST.md`, etc.) cuando la tarea consista exclusivamente en **crear, ajustar o documentar diagramas** basados en el código (diagramas UML, casos de uso, análisis, clases o comunicación en `.drawio`, `.puml`, imágenes, etc.).
- **Al haber modificado código o lógica:** Jamás cierres tu turno ni respondas "Tarea Finalizada" sin haber actualizado:
  1. [`docs/ai/CURRENT_STATE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/CURRENT_STATE.md) (Estado consolidado del proyecto).
  2. [`docs/ai/HANDOFF_LATEST.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/HANDOFF_LATEST.md) (Pase de posta operativo inmediato).
  3. [`docs/ai/NEXT_STEPS.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/NEXT_STEPS.md) (Próxima tarea a ejecutar).
  4. [`docs/ai/DECISIONS_LOG.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/DECISIONS_LOG.md) (Si se tomaron decisiones arquitectónicas o de modelo).
  5. [`docs/IMPLEMENTATION_PHASES.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/IMPLEMENTATION_PHASES.md) (Marcar los checkboxes `[x]` de avance y fases de prueba).
  6. **Crear una nueva bitácora de sesión en [`docs/ai/sessions/YYYY-MM-DD-autor-o-tarea.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/sessions/)** detallando:
     - Solicitud / Caso de uso implementado.
     - Cambios en Backend (migraciones, modelos en español, requests, controladores).
     - Cambios en Frontend (servicios, componentes, modales, vistas).
     - Comandos a ejecutar tras hacer pull (`php artisan migrate`, `php artisan db:seed`, `npm install`).
     - Verificaciones y pruebas realizadas (`php -l`, `npm run build`).

---

## 5. 📐 Reglas Estándar para Diagramas UML (Secuencia, Comunicación y Análisis de Clases)

> **Skill Oficial Asociada:** [`.agents/skills/uml-academic-diagrams/SKILL.md`](file:///c:/Users/PERSONAL/clinica-SI1/.agents/skills/uml-academic-diagrams/SKILL.md)  
> **Directorio de Artefactos:** `docsUML/CUsecuencia/`, `docsUML/CUcomunicacion/`, `docsUML/CUanalisisClase/`.

Al generar o corregir diagramas para cualquier Caso de Uso (`CUxx`), es obligatorio acatar las siguientes pautas:

### 5.1. Arquitectura BCE y Distribución Horizontal
* Distribución canónica de izquierda a derecha:  
  **`Actor` ➔ `Pantalla (Boundary)` ➔ `Controlador (Control)` ➔ `Entidades de Dominio (Entity)`**.
* **Actores:** Si dos actores realizan la misma interacción, unificarlos con barra (ej. `Recepcionista / Paciente`).
* **Lógica Centralizada:** Toda la lógica, orquestación y validaciones residen en el Controlador.
* **Aislamiento de Entidades:** Las entidades **NUNCA** se envían mensajes entre sí, ni devuelven respuestas a otras entidades, ni envían mensajes de regreso a los controladores.

### 5.2. Diagrama de Secuencia (JScript para Enterprise Architect)
* **Formato:** Script `.js` en `docsUML/CUsecuencia/CUxx_diagrama_secuencia_*.js`.
* **Participantes:** Cuadros rectangulares con el **color por defecto que otorga Enterprise Architect** (sin forzar estilos ni colores personalizados).
* **Sin icono de Base de Datos:** Las tablas/modelos se representan como rectángulos estándar con estereotipo `<<Entity>>` o `<<Database>>`.
* **Estereotipos visibles:** `<<Actor>>`, `<<Interface>>`, `<<Controller>>`, `<<Entity>>`.
* **Líneas de Vida (Lifelines):** Trazadas continuas desde cada componente (incluyendo el actor).
* **Mensajes:** Numerados jerárquicamente (`1`, `1.1`, `1.2`...). Nombres de funciones reales según el código del proyecto.
* **Convención de Parámetros:** `metodo()` sin parámetros o `metodo(parametro)` si solo usa uno; si usa más de uno en el código, **dejar los paréntesis vacíos `()`**.
* **Retornos:** Flechas discontinuas únicamente hacia el controlador o la pantalla, si el código tiene retorno explícito.
* **Fragmentos Combinados:** Máximo **3 fragmentos `alt`** para mantener legibilidad académica; usar `opt` para condicionales simples y `loop` para iteraciones. Sin fragmentos redundantes.

### 5.3. Diagrama de Comunicación (Draw.io / JScript)
* **Formato:** Archivo `.drawio` en `docsUML/CUcomunicacion/` (o `.js` para EA).
* **Coincidencia 1:1:** Mismos participantes, mismos nombres y mismos mensajes que el diagrama de secuencia.
* **Iconos BCE:** En este diagrama **SÍ se utilizan los iconos formales** (`boundary`, `control`, `entity`).
* **Nombres:** Sin prefijo de estereotipo en el texto visible, solo el nombre (`:AppointmentsController`, `:Cita`).
* **Líneas y Mensajes:** Cada mensaje cuenta con su **relación individual entre los componentes** (facilitando acomodar los mensajes con holgura), con una **flecha direccional señalando al componente destino**.
* **Paleta de Colores por Flujo:** Flujo 1 estrictamente negro (`#000000`), Flujo 2 verde bosque oscuro (`#005522`), Flujo 3 morado oscuro (`#4B0082`), Flujo 4 rojo óxido (`#8B0000`) o azul marino (`#003366`).
* **Mensajes entre Boundary y Controller:** Por convención académica UML 2.5+, se emplean los nombres de los métodos reales del Controller en el código (`index()`, `store()`, etc.) en lugar de endpoints de red HTTP.
* **Validaciones en Controlador:** Si el código contiene validaciones internas o verificaciones lógicas, se muestran explícitamente en el Controller como mensajes reflexivos hacia sí mismo (`self-call`).
* **Aislamiento:** Las entidades **no** retornan mensajes a los controladores ni se comunican entre sí.

### 5.4. Diagrama de Análisis de Clases (Draw.io)
* **Formato:** Archivo `.drawio` en `docsUML/CUanalisisClase/CUxx_*.drawio`.
* **Estructura:** Actor (`shape=umlActor`) ➔ `<<Interface>>` ➔ `<<Controller>>` ➔ `<<Entity>>`.
* **⚠️ REGLA DE ORO DE RELACIONES Y CARDINALIDADES (INVIOLABLE):**
  - Las relaciones formales UML (**composición, agregación, herencia / generalización, asociación**) y las cardinalidades (`1`, `0..1`, `0..*`, `1..*`) se diagraman **ÚNICAMENTE ENTRE ENTIDADES**.
  - Las conexiones entre `Actor ➔ Interface`, `Interface ➔ Controller` y `Controller ➔ Entities` se trazan con líneas simples de navegación/dependencia (`endArrow=none;endFill=0`), **SIN cardinalidades ni multiplicidades**.

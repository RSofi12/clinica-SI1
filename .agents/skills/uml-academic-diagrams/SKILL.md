---
name: uml-academic-diagrams
description: Guía y estándares obligatorios para la generación de Diagramas UML académicos (Secuencia en JScript/Enterprise Architect, Comunicación en Draw.io/JScript y Análisis de Clases en Draw.io) bajo arquitectura BCE y metodología PUDS/RUP.
---

# 📐 Estándar Oficial de Diagramas UML (PUDS / RUP / BCE)
### Clínica Vida Salud — Centro Médico La Cruz

Este documento define las reglas estrictas de modelado, diseño visual, nomenclatura y sintaxis técnica para generar diagramas de **Secuencia**, **Comunicación** y **Análisis de Clases** fieles al código fuente del sistema.

---

## 1. 🏛️ Arquitectura BCE y Distribución Canónica

Todos los diagramas de comportamiento y análisis deben respetar el patrón **BCE (Boundary - Control - Entity)** y ordenarse de izquierda a derecha en **distribución horizontal**:

```text
[Actor / Actores] ──► [Boundary / Pantalla] ──► [Controlador] ──► [Entidades de Dominio]
```

### Reglas Estructurales Obligatorias:
1. **Actor:** Humano iniciador (ej. `Administrador`, `Recepcionista`, `Médico`, `Paciente`). Si varios actores ejecutan exactamente la misma función en el CU, se separan con barra: `Recepcionista / Paciente`.
2. **Boundary (Interfaz/Pantalla):** Componente React o vista (`:NombreModal`, `:NombreView`, `[:NombreBoundary]`).
3. **Controller (Controlador):** Controlador de Laravel (`:NombreController`). Toda la lógica, bifurcaciones y validaciones se centralizan aquí.
4. **Entities (Entidades):** Modelos de dominio Eloquent / tablas PostgreSQL (`:Cita`, `:Medico`, `:Paciente`, `:Bitacora`, etc.).
5. **Aislamiento de Entidades:**
   - Las entidades **NUNCA** se envían mensajes entre ellas.
   - Las entidades **NUNCA** devuelven mensajes a otras entidades.
   - En el diagrama de comunicación, las entidades **NO** envían mensajes de regreso al controlador (las respuestas de datos las orquesta el controller).
6. **Validaciones en Controlador:** Si el código ejecuta validaciones internas (ej. verificar horarios, anti-colisión, reglas de negocio), se modelan como mensajes reflexivos hacia sí mismo (`self-call` en el Controller).

---

## 2. 🎬 Diagrama de Secuencia (JScript para Enterprise Architect)

* **Entorno:** Enterprise Architect 15.0+ (Motor JScript WSH).
* **Participantes (Lifelines):**
  - **Forma y Color:** Cuadros rectangulares con el **color por defecto que otorga Enterprise Architect** (sin forzar estilos ni colores personalizados).
  - **Sin icono de base de datos:** Las tablas o entidades persistentes se dibujan como cuadros rectangulares estándar con el estereotipo `<<Entity>>` o `<<Database>>`.
  - Estereotipos visibles: `<<Actor>>`, `<<Interface>>`, `<<Controller>>`, `<<Entity>>`.
  - Trazado de **línea de vida (lifeline)** visible y continua para cada componente, incluyendo el actor.
* **Mensajes y Funciones:**
  - Numeración jerárquica estricta: `1`, `1.1`, `1.2`, `1.2.1`, `2`, `2.1`, etc.
  - Nombres reales del código fuente (métodos de servicios, controladores, FormRequests, llamadas REST GET/POST y consultas Eloquent).
  - **Convención de Parámetros:** Funciones sin parámetros `metodo()` o con 1 parámetro `metodo(id)`. Si el método en el código recibe múltiples argumentos, **dejar los paréntesis vacíos `metodo()`**.
  - **Retornos:** Mostrar flechas de retorno discontinuas (`dash`) únicamente hacia el controlador o la pantalla si el código tiene una respuesta explícita.
* **Fragmentos Combinados (UML 2.5+):**
  - **`alt` (Bifurcaciones / Decisiones):** Máximo **3 fragmentos `alt`** por diagrama para mantenerlo limpio y legible. Añadir más solo si la lógica central del CU lo exige indispensablemente.
  - **`opt` (Opcionales):** Para pasos condicionales sin rama alternativa (ej. registrar auditoría si la configuración lo activa, enviar email opcional).
  - **`loop` (Iteraciones):** Para bucles de procesamiento (ej. generación de slots de turnos, iteración de detalles de receta).
  - Prohibido el uso de fragmentos redundantes o decorativos. Evitar cruces de líneas.

---

## 3. 💬 Diagrama de Comunicación (Draw.io / JScript)

* **Formato:** Archivo `.drawio` (XML estructurado) o Script `.js` para EA.
* **Correspondencia 1:1 con Secuencia:** Debe incluir exactamente los mismos participantes, mismos nombres de clases y mismo orden de mensajes que el diagrama de secuencia del mismo CU.
* **Iconos Canónicos:** A diferencia del de secuencia, en el diagrama de comunicación **SÍ se utilizan los iconos formales de estereotipos BCE**:
  - `Boundary`: Círculo con barra vertical a la izquierda.
  - `Control`: Círculo con flecha curva superior derecha.
  - `Entity`: Círculo con barra inferior horizontal.
* **Nombres:** Sin prefijo de estereotipo en el texto visible; solo el nombre del objeto (`:AppointmentsController`, `:Cita`).
* **Líneas y Mensajes:**
  - **Relación individual por mensaje:** Cada mensaje cuenta con su **relación individual entre los componentes** (facilitando acomodar y distribuir visualmente cada interacción con holgura), con una **flecha direccional señalando hacia el componente destino**.
  - Numeración secuencial y nombres de funciones fieles al código: `1.1: processVoiceCommand(request) ➔`.
  - **Validaciones en Controlador:** Si el código contiene validaciones internas o verificaciones lógicas, se muestran explícitamente en el Controller mediante mensajes reflexivos hacia sí mismo.
  - Las entidades **NO** envían mensajes de regreso a los controladores.

---

## 4. 📊 Diagrama de Análisis de Clases (Draw.io)

* **Formato:** Archivo `.drawio` en `docsUML/CUanalisisClase/CUxx_Nombre_CU.drawio`.
* **Participantes:**
  - `Actor`: `shape=umlActor`.
  - `<<Interface>> [Boundary]`: Atributos de estado (`isListening: Boolean`, `loading: Boolean`) y métodos de eventos (`handleSubmit(): void`).
  - `<<Controller>> [Controller]`: Métodos REST del controlador Laravel con su tipo de retorno (`process(): JsonResponse`).
  - `<<Entity>> [Modelos]`: Atributos reales con tipos PostgreSQL (`Long [PK]`, `String`, `DateTime`, `Boolean`, `Jsonb`) y relaciones Eloquent tipadas (`citas(): List`, `usuario(): User`).
* **⚠️ REGLA DE ORO DE RELACIONES Y CARDINALIDADES (INVIOLABLE):**
  - Las relaciones formales UML (**Composición**, **Agregación**, **Herencia / Generalización**, **Asociación**) y sus respectivas cardinalidades (`1`, `0..1`, `0..*`, `1..*`) se diagraman **ÚNICAMENTE ENTRE ENTIDADES**.
  - Las conexiones entre `Actor ➔ Interface`, `Interface ➔ Controller` y `Controller ➔ Entities` se trazan con líneas simples de navegación/dependencia (`endArrow=none;endFill=0`), **SIN cardinalidades ni multiplicidades**.

---

## 5. 🚫 Regla de Memoria Multi-Agente para Diagramas
Al trabajar exclusivamente en la generación o corrección de diagramas (`.drawio`, `.js` en `docsUML/`, `.puml`):
* **NO crear sesiones en `docs/ai/sessions/`.**
* **NO modificar los archivos de relevo (`CURRENT_STATE.md`, `HANDOFF_LATEST.md`, etc.).**
* La memoria viva se reserva exclusivamente para modificaciones en el código fuente o esquema de base de datos.

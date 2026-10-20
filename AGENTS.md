# GUÍA DE COMPORTAMIENTO Y CONTEXTO PARA AGENTES (AGENTS.md)
### Clínica Vida Salud — Centro Médico La Cruz

Este archivo define las reglas obligatorias de interacción, contexto y fuentes de verdad para cualquier agente o IA que trabaje en este repositorio.

---

## 1. 📖 Archivos de Consulta Obligatoria (Fuentes de Verdad)

Antes de responder, planificar o generar código, consulta estos documentos en orden de prioridad:

1. **[`docs/ai/MASTER_AGENT_PROMPT.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/MASTER_AGENT_PROMPT.md):** Mandamientos técnicos, reglas inviolables del sistema y principios PUDS.
2. **[`docs/ai/CURRENT_STATE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/CURRENT_STATE.md):** Qué está hecho hasta hoy y qué está pendiente.
3. **[`docs/ai/NEXT_STEPS.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/NEXT_STEPS.md):** La tarea inmediata a resolver (tu brújula de trabajo).
4. **[`docs/CU_ESPECIFICACION_SISTEMA.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/CU_ESPECIFICACION_SISTEMA.md):** Los 23 Casos de Uso oficiales y su asignación por ciclo.
5. **[`docs/Ex_Parcial_2_sistemas-1.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/Ex_Parcial_2_sistemas-1.md):** Enunciado oficial del examen (requisitos funcionales RF01-RF13 y pruebas mínimas).
6. **[`docs/ai/ARCHITECTURE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/ARCHITECTURE.md):** Organización en los 6 paquetes y convenciones de rutas anidadas.
7. **[`docs/ai/DECISIONS_LOG.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/DECISIONS_LOG.md):** Histórico de decisiones ya acordadas que **NO** deben reabrirse sin justificación.

---

## 2. 🛡️ Reglas Sagradas del Proyecto (No Romper)

* **Stack Oficial:**
  - **Backend:** Laravel 13 (PHP 8.3) con servicios transaccionales y PostgreSQL.
  - **Frontend:** React + JavaScript (`.jsx` / ES6+) con Tailwind CSS. **NO usar TypeScript** en el código frontend (mantenerlo ágil y simple).
* **Guía de Base de Datos y Clases:**
  - Toda la implementación de modelos, tablas relacionales, llaves foráneas y tipos de datos **debe guiarse estrictamente de:**
    - [`docs/database/diagrama_de_clases.puml`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/diagrama_de_clases.puml)
    - [`docs/database/DDL_Database_Clinica_LaCruz.sql`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/DDL_Database_Clinica_LaCruz.sql)
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
* **Actualización de Memoria:** Al finalizar cualquier tarea de implementación, debes actualizar `docs/ai/CURRENT_STATE.md` y `docs/ai/HANDOFF_LATEST.md` para preservar la continuidad de futuras sesiones.

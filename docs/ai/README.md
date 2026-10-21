# AI MEMORY SYSTEM (`docs/ai/`)
### Clínica Vida Salud — Centro Médico La Cruz

## ¿Para qué sirve esta carpeta?
Este directorio actúa como la **Memoria Persistente Multi-Agente y Registro de Continuidad** del proyecto **Clínica Vida Salud — Centro Médico La Cruz**.
Es el puente cognitivo para que desarrolladores, integrantes del equipo y agentes de Inteligencia Artificial puedan colaborar de manera armónica, ordenada y sin sobrescribir el trabajo previo ni perder el contexto de las decisiones arquitectónicas.

---

## 📖 Instrucciones y Orden Obligatorio de Lectura para Agentes y Desarrolladores

Antes de proponer soluciones, generar código o modificar la base de datos, debes leer en este orden estricto:

1. **[`MASTER_AGENT_PROMPT.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/MASTER_AGENT_PROMPT.md):** Reglas inviolables del sistema (Actor Médico Unificado, no usar TypeScript, transacciones atómicas anti-colisión, baja lógica RN11 y nombres en español).
2. **[`PROJECT_VISION.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/PROJECT_VISION.md):** Visión clínica institucional, alcance oficial de los 23 Casos de Uso y principios PUDS/RUP.
3. **[`ARCHITECTURE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/ARCHITECTURE.md):** Directrices de organización simétrica en los 6 paquetes de dominio (Backend `app/Packages/` y Frontend `src/apps/`).
4. **[`CURRENT_STATE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/CURRENT_STATE.md):** El estado consolidado y verificado hasta hoy.
5. **[`HANDOFF_LATEST.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/HANDOFF_LATEST.md):** Relevo operativo inmediato entre sesiones (tu brújula de partida).
6. **[`NEXT_STEPS.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/NEXT_STEPS.md):** Ruta priorizada de los siguientes Casos de Uso por implementar.
7. **[`DECISIONS_LOG.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/DECISIONS_LOG.md):** Historial de decisiones ya aprobadas que **NO** deben reabrirse sin justificación técnica.
8. **[`docs/ai/sessions/*.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/sessions/):** Bitácora histórica detallada de cada sesión de desarrollo.

---

## 🛡️ Regla Obligatoria al Finalizar Cualquier Sesión

> [!IMPORTANT]
> **Jamás des por terminada una tarea o indiques al operador "TAREA FINALIZADA" sin antes:**
> 1. Actualizar [`CURRENT_STATE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/CURRENT_STATE.md) con lo implementado.
> 2. Documentar el pase de relevo en [`HANDOFF_LATEST.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/HANDOFF_LATEST.md).
> 3. Ajustar [`NEXT_STEPS.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/NEXT_STEPS.md).
> 4. Si hubo decisiones arquitectónicas, registrarlas en [`DECISIONS_LOG.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/DECISIONS_LOG.md).
> 5. **Crear un nuevo archivo de sesión en [`docs/ai/sessions/YYYY-MM-DD-resumen-corto.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/sessions/)** detallando cambios en backend, frontend, comandos post-pull y verificaciones.

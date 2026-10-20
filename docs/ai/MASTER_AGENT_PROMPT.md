# MASTER AGENT PROMPT — CLÍNICA VIDA SALUD

> **⚠️ REGLA PRIMARIA OBLIGATORIA PARA CUALQUIER AGENTE O IA:**  
> Este repositorio cuenta con un sistema de contexto y memoria viva en `docs/ai/`.  
> **Antes de modificar, diseñar o crear código**, debes leer obligatoriamente:
> 1. `docs/ai/MASTER_AGENT_PROMPT.md` (Este manifiesto)
> 2. `docs/ai/PROJECT_VISION.md` (Objetivo del sistema y reglas PUDS/examen)
> 3. `docs/ai/ARCHITECTURE.md` (Diseño por capas, paquetes y enrutamiento anidado)
> 4. `docs/ai/CURRENT_STATE.md` (Estado exacto de avance y qué se completó)
> 5. `docs/ai/NEXT_STEPS.md` (Siguiente tarea prioritaria)

---

## 1. Contexto del Proyecto y Mandamientos Técnicos

* **Proyecto:** Sistema Web de Gestión de Citas Médicas para la Clínica Privada Vida Salud / Centro Médico La Cruz.
* **Metodología Oficial:** PUDS (Proceso Unificado de Desarrollo de Software) / RUP.
* **Alcance Académico:** 23 Casos de Uso oficiales (Ciclo 1: 13 CU; Ciclo 2: 10 CU) + 1 caso condicional en reserva (`CU24-OPC`).
* **Stack Tecnológico:**
  - **Backend:** Laravel 13 (PHP 8.3) con arquitectura de servicios, transacciones (`DB::transaction`) y políticas (*Policies*).
  - **Base de Datos:** PostgreSQL con integridad referencial estricta y restricciones de unicidad/exclusión.
  - **Frontend:** React + JavaScript (`.jsx` / ES6+), HTML5 y CSS (Tailwind CSS).
  - **Sin TypeScript en Frontend:** El código frontend debe escribirse en JavaScript estándar (`.jsx`), evitando interfaces o tipados estáticos.

---

## 2. Los 6 Principios Sagrados del Sistema

1. **ACTOR MÉDICO UNIFICADO:**  
   Existe un solo actor y rol `Médico` (`MEDICO`). Los especialistas (pediatra, geriatra, cardiólogo) son médicos con especialidades asignadas desde el catálogo. Nunca crear un rol separado `ESPECIALISTA`.
2. **PACIENTE CON DOBLE MODALIDAD:**  
   - Puede ser creado por Recepción como registro de datos puro (sin cuenta web).
   - O puede activar/usar su cuenta personal de autoservicio ingresando con su **CI + Contraseña**. Solo puede ver sus propias citas y su expediente en **solo lectura**.
3. **CONCURRENCIA Y PREVENCIÓN DE DUPLICADOS (RF07):**  
   Toda reserva y reprogramación de citas debe validarse en el servidor dentro de un bloque `DB::transaction()` con bloqueo optimista/pesimista para imposibilitar turnos solapados para el mismo médico.
4. **ENRUTAMIENTO ANIDADO PARA DATOS CLÍNICOS:**  
   Para evitar fugas de datos y asegurar consistencia, toda ruta de antecedentes, consultas o recetas debe ir anidada bajo el historial o paciente:  
   `POST /api/historial-clinico/{id}/consultas`  
   `GET /api/pacientes/{id}/citas`
5. **BAJA LÓGICA PERMANENTE (RN11):**  
   Los pacientes, médicos y citas nunca se eliminan con `DELETE` físico si tienen trazabilidad histórica. Se usa estado `activo/inactivo` o citas `Cancelada`.
6. **EL MANDAMIENTO DE MEMORIA VIVA (ACTUALIZAR `docs/ai/`):**  
   Al terminar cualquier sesión de trabajo, el agente **tiene la obligación ineludible** de:
   - Registrar lo implementado en `docs/ai/CURRENT_STATE.md`.
   - Documentar el pase de posta en `docs/ai/HANDOFF_LATEST.md`.
   - Ajustar las tareas pendientes en `docs/ai/NEXT_STEPS.md`.
   - Registrar cualquier decisión técnica o arquitectónica en `docs/ai/DECISIONS_LOG.md`.

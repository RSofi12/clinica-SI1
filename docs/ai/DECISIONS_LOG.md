# DECISIONS LOG — CLÍNICA VIDA SALUD

## Registro de Decisiones de Arquitectura y Negocio

### Registro 01: 2026-10-20
* **Decisión:** Unificación del actor **Médico** (eliminar la distinción como actor independiente de *Especialista*).
* **Motivo:** En UML, los actores modelan roles con interacciones propias. Tanto el médico general como los especialistas realizan idénticas funciones en el sistema (atender, diagnosticar, expedir recetas, ver su agenda). El examen (§3 y RF03) define a la especialidad como una propiedad relacional del médico, no como un rol de usuario distinto.
* **Impacto:** Un único rol `MEDICO` en la base de datos y RBAC de Laravel, simplificando controladores, middlewares y diagramas de casos de uso.

### Registro 02: 2026-10-20
* **Decisión:** Descarte del CU de análisis diagnóstico automatizado por IA en el alcance nuclear y fijación de 23 Casos de Uso oficiales.
* **Motivo:** Ética y responsabilidad médica legal: en un entorno clínico real, el diagnóstico y la conducta terapéutica son competencia exclusiva del médico humano. Se mantiene como caso de uso condicional en reserva (`CU24-OPC`) para ser evaluado en el Ciclo 2 si se desea como asistente secundario.
* **Impacto:** Mayor seriedad académica en la defensa; la IA se enfoca en el asistente de reportes por voz (CU23).

### Registro 03: 2026-10-20
* **Decisión:** Renombrar el paquete "Datos Maestros" a **"Gestión de Recursos Clínicos y Pacientes"**.
* **Motivo:** El término "Datos Maestros" es un tecnicismo genérico de ERP que no representa con precisión el dominio de la salud. El nuevo nombre refleja exactamente los activos clínicos y asistenciales de la clínica.
* **Impacto:** Mayor claridad y pertinencia conceptual en la documentación PUDS.

### Registro 04: 2026-10-20
* **Decisión:** Frontend desarrollado en **React + JavaScript (`.jsx`)** estándar, HTML5 y CSS (Tailwind CSS).
* **Motivo:** Apego a las especificaciones técnicas del examen (HTML, CSS y JavaScript para interacción de formularios) y reducción de la fricción y boilerplate de TypeScript durante el desarrollo ágil de 4 semanas.
* **Impacto:** Migración de componentes frontend de `.tsx` a `.jsx`.

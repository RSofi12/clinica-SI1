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

### Registro 05: 2026-10-21
* **Decisión:** Estandarización de modelos de dominio Eloquent en **español** (`Medico.php`, `Especialidad.php`, `Bitacora.php`) y eliminación de archivos residuales en inglés (`Doctor.php`, `Specialty.php`, `AuditLog.php`).
* **Motivo:** Consistencia estricta con el diseño físico relacional [`DDL_Database_Clinica_LaCruz.sql`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/DDL_Database_Clinica_LaCruz.sql) y el [`diagrama_de_clases.puml`](file:///c:/Users/PERSONAL/clinica-SI1/docs/database/diagrama_de_clases.puml), eliminando la duplicidad innecesaria de nombres en inglés.
* **Impacto:** Nomenclatura uniforme en controladores, seeders y modelos de dominio sin romper compatibilidad.

### Registro 06: 2026-10-21
* **Decisión:** Adopción obligatoria del sistema de sesiones en `docs/ai/sessions/` y del manifiesto de memoria persistente `docs/ai/README.md`.
* **Motivo:** Garantizar la continuidad operativa entre agentes y miembros del equipo de desarrollo, siguiendo las directrices de `Proyecto-SI1/agents.md`.
* **Impacto:** Registro inmutable de cada sesión (`YYYY-MM-DD-*.md`) con comandos post-pull y verificaciones de calidad.

### Registro 07: 2026-10-21
* **Decisión:** Reasignación formal de **CU03** (*Gestionar Bitácora de Auditoría*) y **CU05** (*Gestionar Cuenta y Perfil del Paciente*) al **Ciclo 1**.
* **Motivo:** Ambos módulos son pilares esenciales y transversales del sistema (seguridad inmutable y autoservicio de pacientes), se encuentran entre los primeros 5 Casos de Uso del flujo inicial, y ya fueron implementados y verificados al 100%.
* **Impacto:** Incorporación de CU03 y CU05 a la base nuclear del Ciclo 1.

### Registro 08: 2026-10-21
* **Decisión:** Reasignación de **CU11** (*Reprogramar Cita Médica — RF08*) y **CU13** (*Registrar Asistencia y Estado de Cita — RF10*) al **Ciclo 2**, manteniendo exactamente **13 Casos de Uso en el Ciclo 1** y **10 Casos de Uso (+ 1 Reserva) en el Ciclo 2**.
* **Motivo:**
  1. Para conservar la meta de 13 Casos de Uso en el Ciclo 1 con avance > 50% para la Presentación 1 (25/10/2026).
  2. Los casos CU10 (Programar), CU12 (Cancelar), CU14 (Agenda Médica) y CU15 (Historial del Paciente) son de demostración obligatoria en las 10 pruebas mínimas del examen (Pruebas #3, #4, #5, #6, #7 y #8).
  3. En contraste, **CU11** (reprogramar es sustituible operativamente por cancelar + nueva reserva) y **CU13** (transiciones avanzadas a confirmada/atendida se integran de forma natural con la consulta médica CU16) no comprometen ninguna de las 10 pruebas mínimas del examen.
* **Impacto:**
  - **Ciclo 1:** 13 Casos de Uso (`CU01, CU02, CU03, CU04, CU05, CU06, CU07, CU08, CU09, CU10, CU12, CU14, CU15`). Con 7 CUs ya completados, el avance del Ciclo 1 se sitúa en **53.8%**.
  - **Ciclo 2:** 10 Casos de Uso (`CU11, CU13, CU16, CU17, CU18, CU19, CU20, CU21, CU22, CU23`) + 1 Reserva Opcional (`CU24-OPC`).
  - Total general inalterado: 23 Casos de Uso oficiales (+ 1 condicional).

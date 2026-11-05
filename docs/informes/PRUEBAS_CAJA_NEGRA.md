# 🧪 Matriz General de Pruebas de Caja Negra (Black-Box Testing)
### Sistema de Información Clínica — Centro Médico La Cruz / Clínica Vida Salud
**Metodología:** PUDS / RUP (Proceso Unificado de Desarrollo de Software)

---

## 1. Fundamentación Metodológica (PUDS / RUP)
Bajo la metodología PUDS, la verificación y validación de los **Casos de Uso** en los informes académicos de ingeniería de software se realiza primordialmente mediante **Pruebas de Caja Negra (Black-Box Testing)**:
* **Enfoque de Actor:** Se evalúa el comportamiento observable del sistema desde los límites del Caso de Uso, sin depender de la implementación interna del código.
* **Técnicas Aplicadas:**
  1. **Partición de Equivalencia (EP):** Clases válidas (datos correctos) y clases inválidas (datos fuera de rango o formato erróneo).
  2. **Análisis de Valores Límite (BVA):** Pruebas en los extremos de duración, fechas y longitudes de texto.
  3. **Pruebas de Transición de Estados:** Verificación de la máquina de estados formal de la cita (`PROGRAMADA` / `CONFIRMADA` → `CANCELADA`, etc.).
  4. **Pruebas de Seguridad y Control de Acceso (RBAC / Anti-IDOR):** Garantizar que ningún actor ejecute acciones no autorizadas.

---

## 2. Casos de Prueba de Caja Negra: CU11 — Reprogramar Cita Médica (RF08)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU11-01** | Reprogramación exitosa en horario hábil disponible *(Camino Feliz)* | Partición Válida | Recepcionista / Paciente | `id_cita`: Cita `PROGRAMADA`, `fecha`: día hábil futuro, `hora_inicio`: horario libre dentro de jornada, `motivo_reprogramacion`: "Solicitud por viaje de trabajo" | Cita actualizada con nuevo horario, registro en `cita_estado_historial`, cupo previo liberado y trazabilidad en `bitacora`. | `200 OK` |
| **CN-CU11-02** | Rechazo por intento de reprogramar en fecha u hora pasada (RN06) | Valor Límite / Inválido | Recepcionista / Paciente | `fecha`: ayer o `hora_inicio`: hora transcurrida de hoy | Rechazo con mensaje: *"No es posible reprogramar una cita en un horario que ya ha transcurrido (RN06)"*. Cita intacta. | `422 Unprocessable` |
| **CN-CU11-03** | Rechazo por colisión concurrente con otra cita activa (RF07 / Prueba #4) | Partición Inválida (Colisión) | Recepcionista | `fecha` y `hora_inicio` coincidente con otra cita en estado `PROGRAMADA` del mismo médico | Bloqueo transaccional `lockForUpdate()`. Mensaje: *"Colisión de Horario (RF07): El médico ya tiene una cita activa..."*. | `409 Conflict` |
| **CN-CU11-04** | Rechazo de reprogramación fuera de la jornada semanal del médico (RN05 / Prueba #5) | Análisis Límite | Recepcionista | `fecha`: domingo (día no configurado en `disponibilidades`) o `hora_inicio`: 22:00 | Rechazo: *"Horario no válido (RN05): El horario se encuentra fuera de la jornada de atención del médico..."*. | `422 Unprocessable` |
| **CN-CU11-05** | Rechazo de reprogramación en día de feriado o licencia médica (Prueba P9.3) | Partición Inválida | Recepcionista | `fecha`: día registrado en `bloqueos_horario` (Feriado Nacional o Licencia) | Rechazo con detalle: *"No se puede reprogramar: Coincide con Feriado/Licencia ('Motivo')"*. | `422 Unprocessable` |
| **CN-CU11-06** | Rechazo por estado inmutable: Cita en estado `ATENDIDA` (RN10) | Transición de Estados | Recepcionista | `id_cita`: Cita en estado `ATENDIDA`, nueva fecha válida | Rechazo: *"Operación no permitida (RN10): No es posible reprogramar una cita en estado ATENDIDA"*. | `422 Unprocessable` |
| **CN-CU11-07** | Rechazo por estado inmutable: Cita en estado `CANCELADA` (RN10) | Transición de Estados | Recepcionista | `id_cita`: Cita en estado `CANCELADA` | Rechazo: *"Operación no permitida (RN10): No es posible reprogramar una cita en estado CANCELADA"*. | `422 Unprocessable` |
| **CN-CU11-08** | Rechazo por motivo de reprogramación demasiado corto (Validación FormRequest) | Valor Límite | Recepcionista / Paciente | `motivo_reprogramacion`: "abc" (3 caracteres, min: 5) | Validación rechazada con array de errores: *"El motivo de reprogramación debe contener al menos 5 caracteres"*. | `422 Unprocessable` |
| **CN-CU11-09** | Bloqueo Anti-IDOR: Paciente intentando reprogramar cita de otro paciente | Seguridad / RBAC | Paciente | Paciente A autenticado enviando `id_cita` perteneciente a Paciente B | Rechazo tajante: *"Acceso denegado: solo puede reprogramar sus propias citas médicas"*. | `403 Forbidden` |
| **CN-CU11-10** | Bloqueo de Rol: Médico intentando reprogramar citas directamente | Seguridad / RBAC | Médico | Médico autenticado enviando solicitud `PATCH /api/appointments/{id}/reschedule` | Rechazo: *"Los médicos no tienen autorización para reprogramar citas en el sistema (regla de negocio PUDS)"*. | `403 Forbidden` |
| **CN-CU11-11** | Petición sin autenticación / token inválido (RF01 / Prueba #9) | Seguridad | Anónimo | Solicitud sin cabecera `Authorization: Bearer` ni sesión activa | Rechazo HTTP 401: *"No autenticado"*. | `401 Unauthorized` |

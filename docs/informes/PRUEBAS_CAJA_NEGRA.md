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


---

## 3. Casos de Prueba de Caja Negra: CU16 — Registrar Consulta Médica (Historial Clínico y Triaje)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU16-01** | Registro exitoso de consulta con signos vitales y diagnóstico definitivo *(Camino Feliz)* | Partición Válida | Médico | `id_cita`: Cita `CONFIRMADA`, `motivo_consulta`: "Dolor abdominal persistente tras ingesta", `peso_kg`: 70.5, `talla_cm`: 172.0, `temperatura_c`: 36.8, `presion_arterial`: "120/80", `frecuencia_cardiaca`: 75, `plan_tratamiento`: "Dieta blanda y omeprazol 20mg", `diagnosticos`: `[{"descripcion": "Gastritis aguda", "codigo_cie10": "K29.1", "tipo": "DEFINITIVO"}]` | Consulta médica creada en `consultas_medicas`, cita pasa atómicamente a `ATENDIDA`, registro en `cita_estado_historial`, cálculo de IMC y auditoría inmutable en `bitacora`. | `201 Created` |
| **CN-CU16-02** | Rechazo por intento de registrar consulta en cita ya atendida (RN10 / Inmutabilidad) | Transición de Estados Inválida | Médico | `id_cita`: Cita en estado `ATENDIDA`, payload clínico completo | Bloqueo transaccional `lockForUpdate()`. Mensaje: *"Esta cita médica ya ha sido atendida y cuenta con una consulta registrada"*. Cita y consulta previa intactas. | `422 Unprocessable` |
| **CN-CU16-03** | Rechazo por intento de registrar consulta en cita cancelada o inasistencia (RN09 / RN10) | Transición de Estados Inválida | Médico | `id_cita`: Cita en estado `CANCELADA` o `INASISTENCIA`, payload clínico | Rechazo: *"No se puede registrar una consulta médica para una cita en estado CANCELADA/INASISTENCIA"*. Sin mutaciones en BD. | `422 Unprocessable` |
| **CN-CU16-04** | Bloqueo Anti-IDOR: Médico intentando registrar consulta en cita de otro colega | Seguridad / RBAC / Anti-IDOR | Médico | Médico A autenticado enviando `id_cita` perteneciente al Médico B | Rechazo tajante: *"No tiene autorización para gestionar o atender citas de otro médico"*. Bloqueo de seguridad registrado. | `403 Forbidden` |
| **CN-CU16-05** | Rechazo por omisión de diagnósticos médicos (Validación clínica obligatoria) | Análisis Límite / Partición Inválida | Médico | Payload clínico completo pero array `diagnosticos: []` vacío o ausente | Validación rechazada con array de errores HTTP 422: *"Debe incluir al menos un diagnóstico médico en la consulta"*. | `422 Unprocessable` |
| **CN-CU16-06** | Rechazo por temperatura corporal biológicamente imposible (Validación de Triaje) | Valores Límite | Médico | `temperatura_c`: 52.0 °C (Rango válido: 30.0 a 45.0 °C) | Rechazo por validación biológica: *"La temperatura debe encontrarse entre 30.0 y 45.0 °C"*. | `422 Unprocessable` |
| **CN-CU16-07** | Rechazo por motivo de consulta menor a 5 caracteres (Validación FormRequest) | Valores Límite | Médico | `motivo_consulta`: "Tos" (3 caracteres, mínimo exigido: 5) | Validación rechazada: *"El motivo de consulta debe tener al menos 5 caracteres"*. | `422 Unprocessable` |
| **CN-CU16-08** | Rechazo por peso corporal fuera de rango biológico (Validación de Triaje) | Valores Límite | Médico | `peso_kg`: 450.0 kg (Rango biológico permitido: 0.5 a 350.0 kg) | Rechazo por validación: *"El peso debe situarse entre 0.5 y 350 kg"*. | `422 Unprocessable` |
| **CN-CU16-09** | Rechazo por talla corporal fuera de rango biológico (Validación de Triaje) | Valores Límite | Médico | `talla_cm`: 10.0 cm (Rango biológico permitido: 20.0 a 260.0 cm) | Rechazo por validación: *"La talla debe situarse entre 20 y 260 cm"*. | `422 Unprocessable` |
| **CN-CU16-10** | Rechazo por tipo de diagnóstico no permitido (Regla de Dominio Clínico) | Partición Inválida | Médico | `diagnosticos`: `[{"descripcion": "Gripe", "tipo": "SOSPECHA"}]` (Permitidos: `PRESUNTIVO` o `DEFINITIVO`) | Validación rechazada: *"El tipo de diagnóstico debe ser PRESUNTIVO o DEFINITIVO"*. | `422 Unprocessable` |
| **CN-CU16-11** | Rechazo por plan de tratamiento ausente o menor a 5 caracteres | Valores Límite | Médico | `plan_tratamiento`: "Ok" (2 caracteres, mínimo 5) | Rechazo: *"El plan de tratamiento y conducta terapéutica es obligatorio"*. | `422 Unprocessable` |
| **CN-CU16-12** | Resiliencia de Expediente: Paciente sin historia clínica previa registrada | Transición de Estados / Resiliencia | Médico | Cita válida para paciente nuevo sin tupla en `historias_clinicas` | Creación automática de la `HistoriaClinica` (número `HC-XXXX`) dentro de la transacción, enlace con la consulta y transición de cita a `ATENDIDA`. | `201 Created` |
| **CN-CU16-13** | Bloqueo de Rol: Paciente o Recepcionista intentando registrar consulta médica | Seguridad / RBAC | Paciente / Recepcionista | Token de Paciente o Recepcionista enviando solicitud `POST /api/medical-records/consultas` | Rechazo por middleware de rol: *"No cuenta con los permisos asistenciales necesarios para acceder a la consulta médica"*. | `403 Forbidden` |
| **CN-CU16-14** | Petición sin autenticación / token inválido (RF01 / Prueba #9) | Seguridad | Anónimo | Solicitud sin cabecera de sesión ni token de acceso | Rechazo HTTP 401: *"No autenticado"*. | `401 Unauthorized` |


---

## 4. Casos de Prueba de Caja Negra: CU13 — Registrar Asistencia y Estado de Cita Médica (RF10)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU13-01** | Confirmación presencial en mostrador *(Check-in exitoso a sala de espera)* | Transición de Estados (Válida) | Recepcionista / Admin | `id_cita`: Cita en estado `PROGRAMADA`, `nuevo_estado`: `"CONFIRMADA"`, `observacion`: `"Paciente en sala de espera"` | Estado de la cita pasa a `CONFIRMADA` (*En Espera*), inserción de tupla en `cita_estado_historial` y auditoría inmutable en `bitacora`. | `200 OK` |
| **CN-CU13-02** | Conclusión de consulta médica *(Pase a estado terminal Atendida)* | Transición de Estados (Válida) | Médico titular | `id_cita`: Cita `CONFIRMADA`, `nuevo_estado`: `"ATENDIDA"`, `observacion`: `"Atención concluida en consultorio"` | Estado de la cita pasa a `ATENDIDA` (terminal), registro de trazabilidad con ID del médico y fin de ciclo asistencial. | `200 OK` |
| **CN-CU13-03** | Registro de inasistencia en cita expirada *(Marcación de abandono o no presentación)* | Transición de Estados / Temporal | Recepcionista / Médico | `id_cita`: Cita `PROGRAMADA` o `CONFIRMADA` con hora de inicio ya transcurrida (`now() >= fecha_hora_inicio`), `nuevo_estado`: `"INASISTENCIA"` | Cita transiciona a `INASISTENCIA` (estado terminal), registro en `cita_estado_historial` con justificación y auditoría. | `200 OK` |
| **CN-CU13-04** | Rechazo por intento de transición desde estado terminal `ATENDIDA` (RN10 / Inmutabilidad) | Transición Inválida | Recepcionista / Admin | `id_cita`: Cita en estado `ATENDIDA`, intento de mutar a `"PROGRAMADA"` o `"CONFIRMADA"` | Rechazo por regla de negocio RN10: *"Operación no permitida: La cita médica se encuentra en estado terminal 'ATENDIDA' y no admite modificaciones"*. | `422 Unprocessable` |
| **CN-CU13-05** | Rechazo por intento de revivir cita `CANCELADA` (RN10 / Inmutabilidad) | Transición Inválida | Recepcionista / Admin | `id_cita`: Cita en estado `CANCELADA`, intento de mutar a `"CONFIRMADA"` | Rechazo: *"Transición no permitida: No se puede cambiar la cita de 'CANCELADA' a 'CONFIRMADA'. Estados terminales no admiten modificaciones"*. | `422 Unprocessable` |
| **CN-CU13-06** | Rechazo de marcación de inasistencia para cita programada a futuro | Validación Temporal / Valor Límite | Recepcionista / Médico | `id_cita`: Cita de mañana o con hora futura, `nuevo_estado`: `"INASISTENCIA"` | Rechazo temporal: *"Validación temporal: No es posible registrar inasistencia para una cita programada a futuro"*. Sin alteración de estado. | `422 Unprocessable` |
| **CN-CU13-07** | Bloqueo Anti-IDOR: Médico intentando modificar estado de cita de otro colega | Seguridad / RBAC / Anti-IDOR | Médico | Médico A autenticado enviando `PATCH /api/appointments/{id}/status` de una cita asignada al Médico B | Rechazo tajante: *"Acceso denegado: solo el médico titular asignado a esta cita puede actualizar su estado asistencial"*. | `403 Forbidden` |
| **CN-CU13-08** | Bloqueo de Rol: Paciente intentando mutar estado asistencial de su cita | Seguridad / RBAC | Paciente | Paciente autenticado enviando `PATCH /api/appointments/{id}/status` con `nuevo_estado: "CONFIRMADA"` | Rechazo por política RBAC: *"Acceso denegado: los pacientes no tienen autorización para modificar el estado de las citas médicas"*. | `403 Forbidden` |
| **CN-CU13-09** | Concurrencia y prevención de carrera bajo bloqueo pesimista `lockForUpdate()` | Concurrencia | Recepcionista / Médico | Dos peticiones simultáneas sobre la misma cita (ej. confirmación vs cancelación) | La transacción que obtiene el lock primero completa el cambio; la segunda evalúa el nuevo estado y es rechazada si la transición ya no es válida. | `200 OK` / `422 Unprocessable` |
| **CN-CU13-10** | Consulta de trazabilidad histórica (`GET /api/appointments/{id}/status-history`) | Integridad de Datos / Consulta | Cualquier actor autorizado | `id_cita`: Cita con 2 transiciones previas (`PROGRAMADA` ➔ `CONFIRMADA` ➔ `ATENDIDA`) | Retorno de arreglo cronológico con cada cambio, usuario operador, rol, fecha/hora exacta y observación registrada. Paciente restringido a sus propias citas. | `200 OK` |


---

## 5. Casos de Prueba de Caja Negra: CU17 — Gestionar Antecedentes Médicos (Extra / §3.4)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU17-01** | Registro exitoso de antecedente alérgico *(Camino Feliz)* | Partición Válida | Médico | `patientId`: 1, `tipo_antecedente`: `"ALERGICO"`, `descripcion`: `"Alergia severa a Penicilina y beta-lactámicos"` | Antecedente creado en `antecedentes`, vinculado a la historia clínica del paciente y registrado en `bitacora`. | `201 Created` |
| **CN-CU17-02** | Resiliencia de Historia Clínica: Registro en paciente sin historia previa | Transición de Estados / Resiliencia | Médico | `patientId`: nuevo paciente sin tupla en `historias_clinicas` | Creación atómica de la historia clínica (`firstOrCreate`) y guardado del antecedente sin error. | `201 Created` |
| **CN-CU17-03** | Rechazo por tipo de antecedente no permitido | Partición Inválida | Médico | `tipo_antecedente`: `"DESCONOCIDO"`, `descripcion`: `"Texto descriptivo válido"` | Validación FormRequest rechazada: *"El tipo de antecedente seleccionado no es válido"*. | `422 Unprocessable` |
| **CN-CU17-04** | Rechazo por descripción menor a 3 caracteres | Valor Límite | Médico | `tipo_antecedente`: `"PATOLOGICO"`, `descripcion`: `"Ok"` (2 caracteres, min: 3) | Validación rechazada: *"La descripción del antecedente debe contener al menos 3 caracteres"*. | `422 Unprocessable` |
| **CN-CU17-05** | Prevención de duplicado idéntico activo para el mismo paciente | Partición Inválida | Médico | Mismo tipo y descripción idéntica (`"Alergia a Penicilina"`) ya activa para ese paciente | Rechazo de negocio: *"Ya existe un antecedente activo idéntico para este paciente bajo la categoría ALERGICO"*. | `422 Unprocessable` |
| **CN-CU17-06** | Baja lógica exitosa (Inactivación de antecedente - RN11) | Transición de Estados | Médico / Admin | `id_antecedente`: activo existente, `PATCH /toggle-status` | El campo `estado` muta a `'INACTIVO'`. Tupla permanece intacta en BD y se audita en `bitacora`. | `200 OK` |
| **CN-CU17-07** | Bloqueo de Rol: Recepcionista intentando registrar antecedente | Seguridad / RBAC | Recepcionista | Token de Recepcionista enviando solicitud `POST /patients/1/antecedentes` | Rechazo tajante: *"No tiene autorización asistencial para registrar antecedentes médicos en el sistema"*. | `403 Forbidden` |
| **CN-CU17-08** | Bloqueo Anti-IDOR: Paciente intentando consultar antecedentes de otro | Seguridad / Anti-IDOR | Paciente | Paciente A autenticado intentando consultar antecedentes del Paciente B | Rechazo tajante: *"Acceso denegado: solo puede consultar sus propios antecedentes médicos"*. | `403 Forbidden` |
| **CN-CU17-09** | Edición exitosa de antecedente existente | Partición Válida | Médico | `PUT /antecedentes/{id}` con descripción ampliada o nuevo tipo | Antecedente actualizado en BD y evento registrado en `bitacora`. | `200 OK` |
| **CN-CU17-10** | Solicitud sin autenticación / token inválido (RF01 / Prueba #9) | Seguridad | Anónimo | Solicitud sin credenciales ni sesión activa | Rechazo HTTP 401: *"No autenticado"*. | `401 Unauthorized` |


---

## 6. Casos de Prueba de Caja Negra: CU18 — Gestionar Expediente Clínico Digital - Emisión de Recetas Médicas (Extra)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU18-01** | Emisión exitosa de receta médica con posología estructurada *(Camino Feliz)* | Partición Válida | Médico | `id_consulta`: Consulta atendida por el médico, `medicamentos`: `[{"medicamento": "Amoxicilina 500mg", "dosis": "1 cápsula", "frecuencia": "Cada 8 horas", "duracion": "7 días"}]`, `diagnostico_cie10`: "J02.9" | Receta creada en `recetas` con estado `EMITIDA`, renglones posológicos en `receta_detalles`, vinculación con historia clínica y auditoría inmutable en `bitacora` (`EMITIR_RECETA`). | `201 Created` |
| **CN-CU18-02** | Rechazo por prescripción sin renglones farmacológicos (Validación de Array) | Análisis Límite | Médico | `id_consulta`: Válida, array de `medicamentos: []` vacío o ausente | Validación rechazada con HTTP 422: *"Debe prescribir al menos un medicamento con su posología"*. | `422 Unprocessable` |
| **CN-CU18-03** | Rechazo por medicamento sin dosis, frecuencia o duración requerida | Valores Límite | Médico | `medicamentos`: `[{"medicamento": "Paracetamol 500mg", "dosis": "", "frecuencia": "Cada 8 horas", "duracion": ""}]` | Validación FormRequest rechazada con lista de campos posológicos obligatorios faltantes. | `422 Unprocessable` |
| **CN-CU18-04** | Bloqueo Anti-IDOR: Médico intentando prescribir en consulta atendida por otro colega | Seguridad / RBAC / Anti-IDOR | Médico | Médico A autenticado intentando emitir receta sobre una consulta atendida por el Médico B | Rechazo tajante: *"No tiene autorización para prescribir recetas médicas en consultas atendidas por otro profesional"*. | `403 Forbidden` |
| **CN-CU18-05** | Anulación lógica exitosa con motivo justificado (RN11 / Inmutabilidad) | Transición de Estados | Médico / Admin | `PATCH /recetas/{id}/anular` con payload `{"motivo_anulacion": "Cambio de antibiótico por reacción adversa reportada"}` | El estado muta a `ANULADO`, se registran `motivo_anulacion` y `anulado_en`. La tupla no se elimina físicamente (RN11) y se audita en `bitacora`. | `200 OK` |
| **CN-CU18-06** | Rechazo de anulación con motivo ausente o menor a 5 caracteres | Valores Límite | Médico | `motivo_anulacion`: "Error" (5 caracteres justos permitidos, intento con 3 caracteres: "Mal") | Rechazo FormRequest: *"El motivo de anulación es obligatorio y debe tener al menos 5 caracteres"*. | `422 Unprocessable` |
| **CN-CU18-07** | Rechazo de re-anulación sobre receta previamente anulada (RN10 / Inmutabilidad) | Transición Inválida | Médico / Admin | `PATCH /recetas/{id}/anular` sobre receta con estado actual `ANULADO` | Rechazo de regla de negocio: *"La receta médica ya se encuentra anulada previamente"*. | `422 Unprocessable` |
| **CN-CU18-08** | Bloqueo de Rol: Paciente intentando emitir o anular receta médica | Seguridad / RBAC | Paciente | Token de Paciente enviando petición `POST /api/medical-records/recetas` | Rechazo por middleware de rol: *"No autorizado"*. | `403 Forbidden` |
| **CN-CU18-09** | Scoping Anti-IDOR: Paciente consultando recetas médicas | Seguridad / Anti-IDOR | Paciente | Paciente autenticado ejecutando `GET /api/medical-records/recetas` | El servidor filtra exclusivamente las recetas asociadas a su propia historia clínica; no ve recetas ajenas. | `200 OK` |
| **CN-CU18-10** | Solicitud sin autenticación / token inválido (RF01 / Prueba #9) | Seguridad | Anónimo | Petición sin credenciales de sesión activa | Rechazo HTTP 401: *"No autenticado"*. | `401 Unauthorized` |

---

## 7. Casos de Prueba de Caja Negra: CU19 — Consultar Expediente Médico y Antecedentes Clínicos (§3.4)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU19-01** | Consulta integral de expediente clínico por Médico o Administrador *(Camino Feliz)* | Partición Válida | Médico / Admin | `idPaciente`: 1 (paciente con consultas, antecedentes y recetas previas) | Retorno 200 OK con payload estructurado: `historia_clinica`, datos de `paciente` y contactos, síntesis de `alertas_alergicas` activas, último triaje con IMC, array de `antecedentes` (CU17), `consultas` con diagnósticos CIE-10 (CU16) y `recetas` (CU18). Auditoría registrada en `bitacora`. | `200 OK` |
| **CN-CU19-02** | Autoservicio: Paciente consultando su propio expediente vía endpoint seguro | Partición Válida | Paciente | Token de Paciente autenticado ejecutando `GET /api/medical-records/expediente/mi-expediente` | Resolución transparente del paciente en sesión; retorno en solo lectura de su expediente integral y prescripciones vigentes. | `200 OK` |
| **CN-CU19-03** | Bloqueo Anti-IDOR: Paciente intentando consultar expediente de otro paciente | Seguridad / Anti-IDOR | Paciente | Paciente A autenticado intentando forzar `GET /api/medical-records/expediente/paciente/2` (Paciente B) | Rechazo tajante: *"Acceso denegado: solo puedes consultar tu propio expediente clínico"*. Bloqueo registrado en seguridad. | `403 Forbidden` |
| **CN-CU19-04** | Bloqueo de Rol: Personal de recepción intentando acceder al expediente clínico | Seguridad / Secreto Médico | Recepcionista | Token de Recepcionista enviando solicitud `GET /api/medical-records/expediente/paciente/1` | Rechazo categórico por secreto profesional y confidencialidad asistencial: *"Acceso restringido: el personal de recepción no está autorizado para consultar expedientes médicos confidenciales"*. | `403 Forbidden` |
| **CN-CU19-05** | Resiliencia de Historia Clínica: Paciente nuevo sin atenciones previas | Transición de Estados / Resiliencia | Médico / Admin | `idPaciente`: Paciente registrado en padrón sin consultas previas registradas | Apertura automática (`firstOrCreate`) de `HistoriaClinica` (`estado: ACTIVO`), retorno de ficha vacía limpia sin excepciones ni error 500. | `200 OK` |
| **CN-CU19-06** | Consulta de expediente de paciente inexistente | Partición Inválida | Médico / Admin | `idPaciente`: 99999 (ID no registrado en base de datos) | Error HTTP 404: *"No se encontró el paciente solicitado"*. | `404 Not Found` |
| **CN-CU19-07** | Consulta de Línea de Tiempo Cronológica (`timeline`) | Integridad de Datos / Consulta | Médico / Paciente | `GET /api/medical-records/expediente/paciente/1/timeline` | Arreglo unificado cronológico descendente que entrelaza consultas presenciales, recetas emitidas y antecedentes registrados con iconos y metadatos específicos. | `200 OK` |
| **CN-CU19-08** | Solicitud sin autenticación / token inválido (RF01 / Prueba #9) | Seguridad | Anónimo | Solicitud sin sesión activa ni Bearer token | Rechazo HTTP 401: *"No autenticado"*. | `401 Unauthorized` |


---

## 8. Casos de Prueba de Caja Negra: CU23 — Generar Reportes Personalizados por Voz con IA (Extra)

| ID | Caso de Prueba | Técnica | Actor | Datos de Entrada (Payload / Parámetros) | Resultado Esperado | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CN-CU23-01** | Procesamiento exitoso de instrucción por voz en lenguaje natural *(Camino Feliz)* | Partición Válida | Administrador / Médico | `POST /api/analytics/voice-report` con `comando_texto: "Mostrar citas atendidas de esta semana"` | El parser semántico (`VoiceCommandParserService`) extrae filtros `{estado: "ATENDIDA", periodo: "semana_actual"}`, ejecuta la agregación en BD, retorna métricas y lista de citas, y persiste el reporte en `reportes_ia` con auditoría en `bitacora`. | `200 OK` |
| **CN-CU23-02** | Scoping RBAC / Anti-IDOR para rol Médico en consultas por voz | Seguridad / Anti-IDOR | Médico | Médico autenticado dictando: *"Cuántos pacientes atendí hoy?"* | El servicio inyecta de forma forzosa e inalterable el `id_medico` del facultativo en sesión; el reporte devuelve únicamente las citas del propio médico sin filtrar datos de colegas. | `200 OK` |
| **CN-CU23-03** | Rechazo por instrucción de voz vacía o menor a 2 caracteres (Validación FormRequest) | Valor Límite | Médico / Admin | `comando_texto: "a"` (1 caracter, mínimo requerido: 2) | Rechazo por validación FormRequest HTTP 422: *"El comando debe tener al menos 2 caracteres"*. | `422 Unprocessable` |
| **CN-CU23-04** | Rechazo por instrucción de voz que supera longitud máxima (500 caracteres) | Valor Límite | Médico / Admin | `comando_texto`: cadena de texto de 501 caracteres | Validación rechazada: *"El comando no puede exceder los 500 caracteres"*. | `422 Unprocessable` |
| **CN-CU23-05** | Consulta de historial de reportes solicitados por voz | Integridad de Datos / Consulta | Médico / Admin | `GET /api/analytics/voice-history` con sesión activa | Retorno del listado cronológico de reportes generados previamente por el usuario operador con sus filtros JSON y tipo de reporte asociado. | `200 OK` |
| **CN-CU23-06** | Consulta de estadísticas globales del asistente IA (Exclusivo Administrador) | Seguridad / RBAC | Administrador | `GET /api/analytics/voice-stats` autenticado como Administrador | Retorno de métricas consolidadas: total de reportes generados, solicitudes de hoy y desglose de tipos de consulta más frecuentes. | `200 OK` |
| **CN-CU23-07** | Bloqueo de Rol: Paciente o Recepcionista intentando procesar comandos por voz | Seguridad / RBAC | Paciente / Recepcionista | Token de Paciente o Recepcionista enviando `POST /api/analytics/voice-report` | Rechazo categórico por middleware de rol: *"No autorizado"*. La analítica por voz está reservada a personal médico y directivo. | `403 Forbidden` |
| **CN-CU23-08** | Solicitud sin autenticación / token inválido (RF01 / Prueba #9) | Seguridad | Anónimo | Solicitud sin credenciales ni sesión activa | Rechazo HTTP 401: *"No autenticado"*. | `401 Unauthorized` |

# Bitácora de Sesión: 2026-11-08 — Modal de Detalle Clínico de Consulta Médica y Triaje (CU16 / CU19)

## 1. Solicitud del Usuario / Observación
El usuario eligió la **Opción A (Recomendada)**: implementar una ventana modal médica completa (`ConsultaDetailModal`) que se abra inmediatamente en esa misma pantalla al pulsar el botón **"Ver Detalle"** de cualquier consulta médica (ej. consulta #76), mostrando todos sus signos vitales, triaje, diagnósticos CIE-10 y notas clínicas en lugar del `alert` del navegador.

## 2. Diagnóstico Técnico
1. En `ConsultasManager.jsx`, los botones de "Ver Detalle" en la tabla de escritorio y en las tarjetas móviles ejecutaban `onClick={() => alert(`Ver detalle de consulta #${c.id_consulta || c.id}`)}`.
2. El backend (`ConsultasController::show($id)`) ya contaba con el endpoint `GET /api/medical-records/consultas/{id}` completamente operativo, cargando citas, paciente, médico, diagnósticos CIE-10, receta farmacológica y órdenes de exámenes auxiliares.
3. El servicio frontend `consultaService.getConsulta(id)` ya estaba listo para su consumo.

## 3. Cambios Implementados

### Nuevo Componente: `ConsultaDetailModal.jsx` y Estilos de Impresión Oficial (@media print)
- **Ubicación:** `frontend/src/apps/medical-records/components/ConsultaDetailModal.jsx` y `frontend/src/index.css`.
- **Estructura y Capacidades:**
  - Integrado con `ModalPortal` (`maxWidth="max-w-3xl"`, scroll locking en body y cierre suave con Esc o clic en backdrop).
  - Cabecera clínica Deep Aqua con número correlativo de consulta, código de cita médica (`CM-XXXX`), modalidad y fecha/hora.
  - Tarjetas de identificación del paciente (nombre completo, CI, N° Historia Clínica `HC-XXXX`, edad calculada y sexo) y médico responsable con matrícula profesional.
  - Tablero de constantes vitales y triaje clínico:
    - Presión Arterial (`PA` en mmHg).
    - Frecuencia Cardíaca (`FC` en lpm).
    - Temperatura corporal (°C).
    - Peso (kg), Talla (cm) e Índice de Masa Corporal (IMC en kg/m²) con badge semántico OMS (Normal, Sobrepeso, Obesidad, Bajo peso).
  - Sección de Anamnesis: Motivo de consulta y observaciones/exploración clínica.
  - Sección de Diagnósticos CIE-10: Badges semánticos de Presuntivo / Definitivo, código CIE-10 y descripción de la patología.
  - Prescripción Farmacológica (CU18) y Órdenes de Exámenes (CU25) asociadas a la atención.
  - Acciones: Botón para imprimir la ficha médica completa y botón de cierre.
  - **Aislamiento de Impresión y Hoja Clínica Oficial:**
    - Se dividió el componente en dos capas: capa interactiva de pantalla (`print:hidden`) y capa de documento médico impreso (`hidden print:block`).
    - Al pulsar "Imprimir Ficha", se activa la clase `printing-modal` con retardo asíncrono de 80ms para garantizar el reflow del motor Chromium y captura del diálogo de impresión.
    - En `index.css`: `body.printing-modal #root, body:has([role="dialog"]) #root` oculta al 100% la tabla del sistema de fondo (`display: none !important; position: absolute; left: -9999px`), asegurando que Chrome/Edge imprima exclusivamente la Ficha Clínica Oficial con membrete, constantes, CIE-10, prescripción y líneas de firma/sello profesional.

### Actualización en `ConsultasManager.jsx` y `RecetaDetailModal.jsx`
- Importación de `ConsultaDetailModal`.
- Nuevo estado reactivo: `const [selectedConsulta, setSelectedConsulta] = useState(null)`.
- Sustitución de los `alert(...)` por `setSelectedConsulta(c)`.
- Renderizado condicional del modal al pie del componente.
- En `RecetaDetailModal.jsx`: sincronizada la clase `printing-modal` y `afterprint` para impresión aislada de prescripciones.
- **Corrección de Columna Paciente y Badges Diagnósticos en `ConsultasManager.jsx` y `ConsultaMedica.php`:**
  - En `ConsultaMedica.php`: agregado accesor `getPacienteAttribute` y appends `'paciente'` para exponer directamente el paciente vinculado (`historiaClinica.paciente` / `cita.paciente`).
  - En `ConsultasManager.jsx`:
    - Enriquecida la columna Paciente con avatar, nombre completo, CI y número de historia clínica (`HC-XXXX`).
    - Habilitado el botón interactivo de **"Antecedentes"** (CU17) que antes no se mostraba al no resolver el paciente directo.
    - Corregida lectura de tipo de diagnóstico (`d.tipo || d.tipo_diagnostico`), resolviendo el badge real (`Definitivo` / `Presuntivo`) y permitiendo que el KPI "Diagnósticos Definitivos" calcule el valor real.
    - Normalizado título del médico tratante a `Dr(a). Nombre Apellidos` con número de matrícula profesional visible.

## 4. Verificación y Pruebas
1. `npm --prefix frontend run build`: Compilación exitosa en 1.11s con **0 errores** (2051 módulos transformados).
2. Servidor Vite HMR: Actualización en caliente aplicada sin interrupciones en `http://localhost:5173`.
3. Verificación de flujo: Al hacer clic en "Ver Detalle" de cualquier consulta (incluyendo la #76), se despliega de inmediato la ficha médica completa sin alertas del navegador, y al pulsar "Imprimir Ficha" se genera la ficha clínica oficial sin la tabla de fondo.

## 5. Comandos a Ejecutar tras Pull
```bash
# Ninguna migración nueva requerida
npm --prefix frontend run build
```


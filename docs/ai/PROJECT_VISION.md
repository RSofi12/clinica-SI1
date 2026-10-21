# PROJECT VISION — CLÍNICA VIDA SALUD

## 1. Misión del Sistema
Desarrollar una aplicación web integral, moderna y segura para la administración de citas médicas, pacientes, expedientes ambulatorios y reportes gerenciales en la Clínica Privada Vida Salud (Centro Médico La Cruz), erradicando las colisiones de horarios, la duplicación de pacientes y la pérdida de trazabilidad asistencial.

## 2. Marco Académico y Metodológico
* **Materia:** Sistemas de Información I (Segundo Examen Parcial)
* **Docente:** MSc. Ing. Angélica Garzón Cuéllar
* **Metodología:** PUDS (Proceso Unificado de Desarrollo de Software) / RUP orientado a Casos de Uso.
* **Cronograma de Presentaciones:**
  - **Presentación 1:** Domingo 25/10/2026 23:59 (Avance obligatorio ≥ 50% — Ciclo 1: 13 Casos de Uso, cubriendo RF01 a RF12).
  - **Presentación 2:** Domingo 08/11/2026 23:59 (100% Funcional — Ciclo 2: 10 Casos de Uso, cubriendo reportes RF13, historial clínico, Stripe y voz con IA).
  - **Defensa Final:** Martes 10/11/2026.

## 3. Filosofía de Arquitectura
* **Backend Autoritativo:** Laravel 13 encapsula toda la lógica de negocio, validaciones transaccionales y seguridad. El frontend no decide ni confía en datos del cliente.
* **Separación de Responsabilidades:** Alta cohesión dentro de cada uno de los 6 paquetes y bajo acoplamiento mediante eventos de Laravel y middlewares.
* **Ética y Realismo Clínico:** La toma de decisiones clínicas y el diagnóstico son facultad humana exclusiva del médico tratante (se descarta el diagnóstico automático autónomo por IA).

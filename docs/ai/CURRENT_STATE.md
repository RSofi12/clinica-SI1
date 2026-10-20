# CURRENT STATE — CLÍNICA VIDA SALUD

## Estado Actual al 20/10/2026

### 1. Documentación Base y Especificación Aprobada
- ✅ Definición formal de los **23 Casos de Uso** oficiales del sistema en `docs/CU_ESPECIFICACION_SISTEMA.md`.
- ✅ Definición del caso condicional en reserva `CU24-OPC` para ser evaluado en el Ciclo 2.
- ✅ Alcance del proyecto (Sección 1.4) alineado a los 13 requerimientos funcionales del examen (`RF01` al `RF13`) y el perfil del paciente (§3.4).
- ✅ Unificación del actor **Médico** (se descarta duplicar con Especialista).
- ✅ Aprobada la arquitectura en **6 paquetes funcionales** con alta cohesión y bajo acoplamiento.
- ✅ **Aprobada la Arquitectura Frontend Híbrida Jerárquica** (Shell de Navegación + Módulos en `frontend/src/apps/` simétricos con el backend) documentada en `docs/ai/ARCHITECTURE.md`.
- ✅ Guía y directrices de contexto para agentes formalizadas en `AGENTS.md`.
- ✅ División de los 2 ciclos PUDS:
  - **Ciclo 1:** 13 CU (Cita de punta a punta, cubriendo RF01 a RF12).
  - **Ciclo 2:** 10 CU (Historial clínico, reportes RF13, Stripe y voz con IA).

### 2. Estado del Repositorio de Código
- **Backend (`/backend`):** Laravel 13 inicializado con PHP 8.3.
- **Frontend (`/frontend`):** Vite + React con Tailwind CSS. Código migrado a JavaScript estándar (`.jsx`).

### 3. Siguiente Bloque Inmediato de Trabajo
- Diseñar y crear el esquema de base de datos relacional PostgreSQL (tablas y migraciones para los 13 CU del Ciclo 1).
- Configurar variables de entorno y conexión con la base de datos PostgreSQL.
- Crear Seeders iniciales con roles, usuarios y catálogos demo para pruebas del Ciclo 1.

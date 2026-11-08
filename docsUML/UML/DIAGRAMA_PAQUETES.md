# Diagrama de Paquetes — Diseño Lógico de Arquitectura (4 Capas PUDS / RUP)
**Proyecto:** Clínica Vida Salud (Centro Médico La Cruz)  
**Metodología:** PUDS / RUP (Fase de Elaboración y Construcción / Vista Lógica)  
**Estándar:** UML 2.5+ (Diagrama de Paquetes — Formato Minimalista y Limpio)  
**Archivos Draw.io:** 
- [**`docs/UML/diagrama_paquetes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/diagrama_paquetes.drawio)
- [**`documentationDocs/3DiagramasDiseño/Diagrama_Logico_ClinicaVidaSalud.drawio.xml`**](file:///c:/Users/PERSONAL/clinica-SI1/documentationDocs/3DiagramasDiseño/Diagrama_Logico_ClinicaVidaSalud.drawio.xml)

---

## 1. 🏛️ Estructura Limpia de las 4 Capas Arquitectónicas

Se eliminaron los textos extensos, listas de controladores y códigos de casos de uso para mantener exclusivamente los nombres de las capas, los nombres de los componentes y sus estereotipos UML (`«form»`, `«controller»`, `«service»`, `«database»`, `«driver»`) separados por línea:

```
┌────────────────────────────────────────────────────────┐
│        CAPA DE SERVICIOS DE SOFTWARE / SOPORTE         │
└───────────────────────────┬────────────────────────────┘
                            │ «use»
                            ▼
┌────────────────────────────────────────────────────────┐
│           CAPA ESPECIFICA DE LA APLICACION             │
└───────────────────────────┬────────────────────────────┘
                            │ «use»
                            ▼
┌────────────────────────────────────────────────────────┐
│             CAPA DE APLICACION / DOMINIO               │
└───────────────────────────┬────────────────────────────┘
                            │ «access»
                            ▼
┌────────────────────────────────────────────────────────┐
│                CAPA DE INFRAESTRUCTURA                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. 🗺️ Previa del Diagrama Lógico en Mermaid

```mermaid
flowchart TD
    %% =========================================================================
    %% CAPA 1: C.S.S.
    %% =========================================================================
    subgraph CSS["<b>CAPA DE SERVICIOS DE SOFTWARE / SOPORTE</b>"]
        subgraph PortalPaciente["Portal Paciente Web SPA"]
            CSS_CitasP["«form»<br/><b>WebCitasPaciente</b>"]
            CSS_HistP["«form»<br/><b>WebExpedientePaciente</b>"]
            CSS_PagosP["«form»<br/><b>WebPagosOnline</b>"]
            CSS_ChatP["«form»<br/><b>WebChatbotTriaje</b>"]
            CSS_PerfP["«form»<br/><b>WebPerfilPaciente</b>"]
        end

        subgraph DashboardAdmin["Dashboard Clínico & Administrativo SPA"]
            CSS_Seg["«form»<br/><b>WebSeguridad</b>"]
            CSS_Rec["«form»<br/><b>WebRecursosClinicos</b>"]
            CSS_Age["«form»<br/><b>WebAgendaCitas</b>"]
            CSS_Con["«form»<br/><b>WebConsultasMedicas</b>"]
            CSS_Rep["«form»<br/><b>WebReportesAnalitica</b>"]
        end
    end

    %% =========================================================================
    %% CAPA 2: C.E.A.
    %% =========================================================================
    subgraph CEA["<b>CAPA ESPECIFICA DE LA APLICACION</b>"]
        CEA_P1["«controller»<br/><b>P1. Seguridad y Auditoría</b>"]
        CEA_P2["«controller»<br/><b>P2. Recursos Clínicos y Pacientes</b>"]
        CEA_P3["«controller»<br/><b>P3. Gestión de Citas Médicas</b>"]
        CEA_P4["«controller»<br/><b>P4. Historial Clínico y Consultas</b>"]
        CEA_P5["«controller»<br/><b>P5. Integraciones y Pagos</b>"]
        CEA_P6["«controller»<br/><b>P6. Reportes y Analítica</b>"]
    end

    %% =========================================================================
    %% CAPA 3: C.A.
    %% =========================================================================
    subgraph CA["<b>CAPA DE APLICACION / DOMINIO</b>"]
        CA_P1["«service»<br/><b>P1. Seguridad y Auditoría</b>"]
        CA_P2["«service»<br/><b>P2. Recursos Clínicos y Pacientes</b>"]
        CA_P3["«service»<br/><b>P3. Gestión de Citas Médicas</b>"]
        CA_P4["«service»<br/><b>P4. Historial Clínico y Consultas</b>"]
        CA_P5["«service»<br/><b>P5. Integraciones y Pagos</b>"]
        CA_P6["«service»<br/><b>P6. Reportes y Analítica</b>"]
    end

    %% =========================================================================
    %% CAPA 4: C.I.
    %% =========================================================================
    subgraph CI["<b>CAPA DE INFRAESTRUCTURA</b>"]
        subgraph CIPostgres["PostgreSQL 16 — Base de Datos Relacional"]
            DB_Engine["«database»<br/><b>PostgreSQL 16 Engine</b>"]
            DB_Schema["«schema»<br/><b>Esquema BD (clinica_db)</b>"]
        end

        subgraph CIGateways["Adaptadores & Gateways Cloud Externos"]
            GW_Stripe["«driver»<br/><b>Stripe Gateway</b>"]
            GW_Gemini["«client»<br/><b>Gemini 3.6 Client</b>"]
            GW_Speech["«adapter»<br/><b>Web Speech Adapter</b>"]
        end
    end

    %% =========================================================================
    %% RELACIONES ENTRE CAPAS
    %% =========================================================================
    CSS -->|"«use»"| CEA
    CEA -->|"«use»"| CA
    CA -->|"«access»"| CI

    %% =========================================================================
    %% RELACIONES ENTRE PAQUETES DE DOMINIO
    %% =========================================================================
    CA_P3 -.-> CA_P2
    CA_P3 -.-> CA_P1
    CA_P4 -.-> CA_P3
    CA_P5 -.-> CA_P3
    CA_P6 -.-> CA_P3
    CA_P6 -.-> CA_P4
```

---

## 3. 📦 Matriz de Elementos por Capa

| Capa | Sub-contenedor | Componentes Modelados | Estereotipo |
|---|---|---|:---:|
| **Capa de Servicios de Software / Soporte** | Portal Paciente Web SPA | `WebCitasPaciente`, `WebExpedientePaciente`, `WebPagosOnline`, `WebChatbotTriaje`, `WebPerfilPaciente` | `«form»` |
| **Capa de Servicios de Software / Soporte** | Dashboard Clínico & Admin SPA | `WebSeguridad`, `WebRecursosClinicos`, `WebAgendaCitas`, `WebConsultasMedicas`, `WebReportesAnalitica` | `«form»` |
| **Capa Específica de la Aplicación** | Paquetes P1 a P6 | `P1. Seguridad y Auditoría`<br>`P2. Recursos Clínicos y Pacientes`<br>`P3. Gestión de Citas Médicas`<br>`P4. Historial Clínico y Consultas`<br>`P5. Integraciones y Pagos`<br>`P6. Reportes y Analítica` | `«controller»` |
| **Capa de Aplicación / Dominio** | Paquetes P1 a P6 | `P1. Seguridad y Auditoría`<br>`P2. Recursos Clínicos y Pacientes`<br>`P3. Gestión de Citas Médicas`<br>`P4. Historial Clínico y Consultas`<br>`P5. Integraciones y Pagos`<br>`P6. Reportes y Analítica` | `«service»` |
| **Capa de Infraestructura** | PostgreSQL 16 | `PostgreSQL 16 Engine`<br>`Esquema BD (clinica_db)` | `«database»`<br>`«schema»` |
| **Capa de Infraestructura** | Gateways Cloud | `Stripe Gateway`<br>`Gemini 3.6 Client`<br>`Web Speech Adapter` | `«driver»`<br>`«client»`<br>`«adapter»` |

---

## 4. 🎨 Cómo Abrir en Draw.io
1. Abre **[draw.io](https://app.diagrams.net/)**.
2. Ve a **Archivo** > **Abrir desde** > **Dispositivo...** y carga [**`docs/UML/diagrama_paquetes.drawio`**](file:///c:/Users/PERSONAL/clinica-SI1/docs/UML/diagrama_paquetes.drawio).
3. Verás la vista depurada, con el texto centrado en cada carpeta, sin saturación de texto ni referencias a casos de uso, idéntico al estilo de tu imagen.

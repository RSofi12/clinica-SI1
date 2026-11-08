/* =================================================================================
 * PROYECTO: Clínica Vida Salud — Centro Médico La Cruz
 * DIAGRAMA: Diagrama de Despliegue (Deployment Diagram - Flujo Vertical UML 2.5 / PUDS)
 * DESCRIPCIÓN: Modelo de despliegue físico y lógico estructurado según metodología PUDS:
 *              - Capa 1 (Superior): Dispositivos Clientes (Verde Claro).
 *              - Capa 2: Red Internet (WAN / Telecomunicaciones públicas - Blanco).
 *              - Capa 3: Servidor Web Frontend (Render Cloud Platform - Blanco).
 *              - Capa 4: Servidor Backend (Render Cloud Platform - Blanco).
 *              - Capa 5 (Inferior): Servidor Base de Datos (Render Managed PostgreSQL 16 - Blanco).
 *              - Columna Lateral Derecha: Servicios Cloud Externos e IA (Blanco):
 *                  * Web Speech API (W3C Browser Standard - Dictado y reportes por voz).
 *                  * Google Gemini API 3.6 (Chatbot médico, triaje e interpretación de voz).
 *                  * Stripe API (Pasarela de pagos electrónicos para consultas y reservas).
 *              
 *              * Conectores con flecha direccional ("Source -> Destination") y etiqueta
 *                de protocolo/conexión, SIN el estereotipo «communication».
 *
 * ENTORNO: Enterprise Architect 15.0+ / 16.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "3. Diagramas de Diseño";
var DIAGRAM_NAME = "Diagrama de Despliegue - Clinica Vida Salud";

// Constantes de color BGR para Enterprise Architect
var COLOR_WHITE = 16777215;       // #FFFFFF (Blanco puro para nodos y servidores)
var COLOR_LIGHT_GREEN = 13954453;  // #D5E8D4 (Verde claro para dispositivos clientes)

function log(msg) {
    Session.Output("[Despliegue-Clinica] " + msg);
}

/**
 * Obtiene el paquete de destino en el Project Browser o lo crea si no existe.
 */
function getTargetPackage() {
    var selectedPkg = Repository.GetTreeSelectedPackage();
    if (selectedPkg != null) {
        log("Usando paquete seleccionado en Project Browser: " + selectedPkg.Name);
        return selectedPkg;
    }

    var roots = Repository.Models;
    var root = (roots.Count > 0) ? roots.GetAt(0) : null;
    if (root == null) {
        Session.Prompt("No se encontró ningún modelo raíz en Enterprise Architect.", 0);
        return null;
    }

    for (var i = 0; i < root.Packages.Count; i++) {
        var p = root.Packages.GetAt(i);
        if (p.Name == DEFAULT_PACKAGE_NAME) {
            return p;
        }
    }

    var newPkg = root.Packages.AddNew(DEFAULT_PACKAGE_NAME, "Package");
    newPkg.Update();
    root.Packages.Refresh();
    log("Paquete creado: " + DEFAULT_PACKAGE_NAME);
    return newPkg;
}

/**
 * Recrea el diagrama de despliegue limpio.
 */
function recreateDiagram(pkg) {
    for (var i = pkg.Diagrams.Count - 1; i >= 0; i--) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == DIAGRAM_NAME) {
            try {
                pkg.Diagrams.Delete(i);
                pkg.Diagrams.Refresh();
                log("Diagrama previo eliminado para regeneración limpia.");
            } catch (e) {
                log("Aviso al eliminar: " + e.message);
            }
            break;
        }
    }

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Deployment");
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Crea un Nodo UML (Device o Node) con color de fondo configurable y lo posiciona en el diagrama.
 */
function addNode(pkg, diagram, name, stereotype, notes, l, r, t, b, bgColor) {
    var el = pkg.Elements.AddNew(name, "Node");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    if (notes && notes.length > 0) {
        el.Notes = notes;
    }
    el.Update();
    pkg.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = el.ElementID;
    if (bgColor !== undefined && bgColor !== null) {
        dObj.BackgroundColor = bgColor;
        dObj.Style = "BCOL=" + bgColor + ";";
    }
    dObj.Update();

    return el;
}

/**
 * Crea un Artefacto UML como elemento hijo dentro de un Nodo y lo posiciona en el diagrama.
 */
function addArtifact(parentNode, diagram, name, stereotype, l, r, t, b) {
    var art = parentNode.Elements.AddNew(name, "Artifact");
    if (stereotype && stereotype.length > 0) {
        art.Stereotype = stereotype;
    }
    art.Update();
    parentNode.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = art.ElementID;
    dObj.Update();

    return art;
}

/**
 * Crea un Entorno de Ejecución (Execution Environment) dentro de un Nodo y lo posiciona en el diagrama.
 */
function addExecutionEnv(parentNode, diagram, name, stereotype, l, r, t, b) {
    var env = parentNode.Elements.AddNew(name, "ExecutionEnvironment");
    if (stereotype && stereotype.length > 0) {
        env.Stereotype = stereotype;
    }
    env.Update();
    parentNode.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = env.ElementID;
    dObj.Update();

    return env;
}

/**
 * Crea una vía de comunicación con flecha direccional y etiqueta de protocolo,
 * sin estereotipo «communication».
 */
function addCommunication(src, dst, protocolLabel) {
    var con = src.Connectors.AddNew(protocolLabel, "CommunicationPath");
    con.SupplierID = dst.ElementID;
    con.Direction = "Source -> Destination";
    con.Stereotype = ""; // Sin estereotipo visible «communication»
    con.Update();
    return con;
}

function main() {
    log("Iniciando generación del Diagrama de Despliegue con colores diferenciados...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* =========================================================================
     * 1. NIVEL 1: CAPA DE DISPOSITIVOS CLIENTES (Superior: Verde Claro)
     * ========================================================================= */
    // Dispositivo Paciente
    var nodoPaciente = addNode(
        pkg, diagram,
        "Dispositivo Paciente\n(PC / Smartphone / Tablet)",
        "device",
        "Dispositivo del paciente para agendamiento web, consulta de citas, pagos e historial.",
        60, 420, -40, -250,
        COLOR_LIGHT_GREEN
    );
    addArtifact(nodoPaciente, diagram, "Portal Paciente SPA\n(React + Tailwind CSS)", "artifact", 90, 390, -100, -165);
    addArtifact(nodoPaciente, diagram, "Navegador Web\n(Web Speech API Client)", "artifact", 90, 390, -180, -235);

    // Dispositivo Personal Médico / Admin
    var nodoPersonal = addNode(
        pkg, diagram,
        "Dispositivo Personal Médico / Admin\n(PC Escritorio / Estación Clínica)",
        "device",
        "Estación de trabajo para Recepcionistas, Médicos Especialistas y Administrador del sistema.",
        480, 840, -40, -250,
        COLOR_LIGHT_GREEN
    );
    addArtifact(nodoPersonal, diagram, "Dashboard Clínico & Admin\n(React SPA)", "artifact", 510, 810, -100, -165);
    addArtifact(nodoPersonal, diagram, "Navegador Web\n(Audio Capture & Synthesis)", "artifact", 510, 810, -180, -235);

    /* =========================================================================
     * 2. NIVEL 2: RED INTERNET (WAN / Tránsito Seguro: Blanco)
     * ========================================================================= */
    var nodoInternet = addNode(
        pkg, diagram,
        "Red Internet\n(WAN / Red Pública Segura)",
        "device",
        "Infraestructura de telecomunicaciones pública con cifrado punto a punto (TCP/IP - TLS 1.3).",
        270, 630, -300, -420,
        COLOR_WHITE
    );

    /* =========================================================================
     * 3. NIVEL 3: SERVIDOR WEB FRONTEND - RENDER STATIC SITE (Blanco)
     * ========================================================================= */
    var nodoFrontend = addNode(
        pkg, diagram,
        "Servidor Web Frontend\n(Render Cloud Platform)",
        "device",
        "Plataforma PaaS Cloud para hosting de sitios estáticos SPA con despliegue continuo (CI/CD GitHub) y CDN global.",
        250, 650, -480, -690,
        COLOR_WHITE
    );
    var envRenderStatic = addExecutionEnv(
        nodoFrontend, diagram,
        "Render Static Web Environment\n(Global Edge CDN & Nginx)",
        "executionEnvironment",
        280, 620, -540, -670
    );
    addArtifact(
        nodoFrontend, diagram,
        "Bundle React SPA\n(HTML5, JS ES6+, Tailwind CSS)",
        "artifact",
        300, 600, -590, -655
    );

    /* =========================================================================
     * 4. NIVEL 4: SERVIDOR BACKEND - RENDER WEB SERVICE (Blanco)
     * ========================================================================= */
    var nodoBackend = addNode(
        pkg, diagram,
        "Servidor Backend\n(Render Cloud Platform)",
        "device",
        "PaaS en la nube ejecutando contenedor administrado de Laravel 13 con escalado automático y SSL nativo.",
        250, 650, -750, -980,
        COLOR_WHITE
    );
    var envRenderBackend = addExecutionEnv(
        nodoBackend, diagram,
        "Render Web Service\n(PHP 8.3 / Laravel 13 Core & REST API)",
        "executionEnvironment",
        280, 620, -810, -960
    );
    addArtifact(
        nodoBackend, diagram,
        "Laravel 13 REST API\n(Controllers, Sanctum, Services, ORM)",
        "artifact",
        300, 600, -870, -945
    );

    /* =========================================================================
     * 5. NIVEL 5: SERVIDOR BASE DE DATOS - RENDER POSTGRESQL (Blanco)
     * ========================================================================= */
    var nodoDatabase = addNode(
        pkg, diagram,
        "Servidor Base de Datos\n(Render Managed PostgreSQL)",
        "device",
        "Instancia gestionada de PostgreSQL 16 con copias de seguridad diarias, cifrado en reposo y conexiones SSL/TLS.",
        250, 650, -1040, -1250,
        COLOR_WHITE
    );
    var envPostgres = addExecutionEnv(
        nodoDatabase, diagram,
        "PostgreSQL 16 DBMS Engine",
        "executionEnvironment",
        280, 620, -1100, -1230
    );
    addArtifact(
        nodoDatabase, diagram,
        "Esquema BD Relacional\n(Clinica_LaCruz_DB)",
        "artifact",
        300, 600, -1155, -1215
    );

    /* =========================================================================
     * 6. COLUMNA DERECHA: SERVICIOS CLOUD E IA EXTERNOS (Blanco)
     * ========================================================================= */
    // Servicio 1: Web Speech API (Browser / W3C Engine)
    var nodoWebSpeech = addNode(
        pkg, diagram,
        "Web Speech API Engine\n(SpeechRecognition & Synthesis)",
        "node",
        "API nativa del navegador para captura de dictado de consultas y reportes por voz (W3C Standard).",
        940, 1300, -40, -220,
        COLOR_WHITE
    );
    addArtifact(nodoWebSpeech, diagram, "SpeechRecognition API", "artifact", 970, 1270, -110, -190);

    // Servicio 2: Google Gemini AI 3.6
    var nodoGemini = addNode(
        pkg, diagram,
        "Google Cloud - Gemini AI\n(Gemini 3.6 Flash API)",
        "node",
        "Modelo fundacional de IA para chatbot de orientación clínica y generación de filtros de reportes por voz.",
        940, 1300, -380, -560,
        COLOR_WHITE
    );
    addArtifact(nodoGemini, diagram, "Gemini 3.6 Flash REST API", "artifact", 970, 1270, -450, -530);

    // Servicio 3: Pasarela Stripe
    var nodoStripe = addNode(
        pkg, diagram,
        "Pasarela de Pagos Stripe\n(Stripe Payments Cloud)",
        "node",
        "Infraestructura de cobro electrónico con tarjeta de crédito/débito certificada PCI-DSS Nivel 1.",
        940, 1300, -740, -920,
        COLOR_WHITE
    );
    addArtifact(nodoStripe, diagram, "Stripe Payments REST API", "artifact", 970, 1270, -810, -890);

    /* =========================================================================
     * 7. VÍAS DE COMUNICACIÓN (Direction: Source -> Destination, Sin «communication»)
     * ========================================================================= */
    // Flujo Vertical Principal
    addCommunication(nodoPaciente, nodoInternet, "HTTPS :443 (TLS 1.3)");
    addCommunication(nodoPersonal, nodoInternet, "HTTPS :443 (TLS 1.3)");
    addCommunication(nodoInternet, nodoFrontend, "HTTPS :443 (Global CDN)");
    addCommunication(nodoFrontend, nodoBackend, "HTTPS :443 (REST JSON / Sanctum)");
    addCommunication(nodoBackend, nodoDatabase, "PDO PostgreSQL :5432 (SSL Encrypted)");

    // Conexiones a Servicios Externos
    addCommunication(nodoPaciente, nodoWebSpeech, "JavaScript API Call (Local Browser Engine)");
    addCommunication(nodoPersonal, nodoWebSpeech, "JavaScript API Call (Local Browser Engine)");
    addCommunication(nodoBackend, nodoGemini, "HTTPS :443 (REST API / Bearer Token)");
    addCommunication(nodoBackend, nodoStripe, "HTTPS :443 (Payment Intents API)");
    addCommunication(nodoPaciente, nodoStripe, "HTTPS :443 (Stripe Elements Tokenize)");

    /* =========================================================================
     * 8. GUARDAR, REFRESCAR Y ABRIR DIAGRAMA
     * ========================================================================= */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama de despliegue actualizado exitosamente.");
    Session.Prompt("¡Diagrama de Despliegue actualizado (Flechas direccionales, sin estereotipo, dispositivos verde claro y nodos blancos)!", 0);
}

main();

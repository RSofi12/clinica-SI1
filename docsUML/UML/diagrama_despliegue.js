/* =================================================================================
 * PROYECTO: Clínica Vida Salud — Centro Médico La Cruz
 * DIAGRAMA: Diagrama de Despliegue (Deployment Diagram - Flujo UML 2.5 / PUDS)
 * DESCRIPCIÓN: Modelo de despliegue físico y lógico estructurado exactamente según
 *              el patrón visual arquitectónico de referencia:
 *              - Columna Izquierda (Flujo Principal de Infraestructura):
 *                  * Red Internet (WAN / Red Pública).
 *                  * Servidor Web Frontend (Vercel Cloud Platform - React SPA).
 *                  * Servidor Backend (Railway Cloud Platform - Laravel 13 / PHP 8.3).
 *                  * Servidor Base de Datos (Cloud PostgreSQL - Railway / PostgreSQL 16).
 *              - Columna Central (Servicios Externos Cloud / IA):
 *                  * Servicio Web Speech API (Dictado y reportes médicos por voz).
 *                  * Google Cloud - Gemini AI (Gemini 3.6 Flash/Pro - Chatbot triaje).
 *                  * Pasarela de Pago (Stripe Payments REST API).
 *              - Columna Derecha (Dispositivos de Acceso Clientes):
 *                  * Dispositivo Sucursal / Admin (PC Consultorio / Terminal POS).
 *                  * Dispositivo Cliente / Paciente (PC / Laptop / Smartphone).
 *
 * ENTORNO: Enterprise Architect 15.0+ / 16.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "3. Diagramas de Diseño";
var DIAGRAM_NAME = "Diagrama de Despliegue - Clinica Vida Salud";

// Paleta de colores exactos para DiagramObjects en Enterprise Architect (RGB -> Integer)
function getRgbColor(r, g, b) {
    return r + (g * 256) + (b * 65536);
}

var COLOR_DEVICE_BLUE = getRgbColor(218, 238, 255);    // Azul claro estándar («device»)
var COLOR_SERVICE_YELLOW = getRgbColor(255, 255, 204); // Amarillo pastel («Node» externo)
var COLOR_DB_PINK = getRgbColor(255, 204, 204);        // Rosa/Coral pastel para PostgreSQL

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
 * Crea un Nodo UML (Device o Node) y lo posiciona en el diagrama con color opcional.
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
    if (bgColor != null) {
        try {
            dObj.BackgroundColor = bgColor;
        } catch (ex) {}
    }
    dObj.Update();

    return el;
}

/**
 * Crea un Artefacto UML como elemento hijo dentro de un Nodo y lo posiciona en el diagrama.
 */
function addArtifact(parentNode, diagram, name, stereotype, l, r, t, b, bgColor) {
    var art = parentNode.Elements.AddNew(name, "Artifact");
    if (stereotype && stereotype.length > 0) {
        art.Stereotype = stereotype;
    }
    art.Update();
    parentNode.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = art.ElementID;
    if (bgColor != null) {
        try {
            dObj.BackgroundColor = bgColor;
        } catch (ex) {}
    }
    dObj.Update();

    return art;
}

/**
 * Crea un Entorno de Ejecución (Execution Environment) dentro de un Nodo y lo posiciona en el diagrama.
 */
function addExecutionEnv(parentNode, diagram, name, stereotype, l, r, t, b, bgColor) {
    var env = parentNode.Elements.AddNew(name, "ExecutionEnvironment");
    if (stereotype && stereotype.length > 0) {
        env.Stereotype = stereotype;
    }
    env.Update();
    parentNode.Elements.Refresh();

    var dObj = diagram.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    dObj.ElementID = env.ElementID;
    if (bgColor != null) {
        try {
            dObj.BackgroundColor = bgColor;
        } catch (ex) {}
    }
    dObj.Update();

    return env;
}

/**
 * Crea una vía de comunicación (CommunicationPath) con etiqueta de protocolo y estereotipo.
 */
function addCommunication(src, dst, protocolLabel, stereotype) {
    var con = src.Connectors.AddNew(protocolLabel, "CommunicationPath");
    con.SupplierID = dst.ElementID;
    if (stereotype && stereotype.length > 0) {
        con.Stereotype = stereotype;
    }
    con.Update();
    return con;
}

function main() {
    log("Iniciando generación del Diagrama de Despliegue (Layout Fiel a Referencia)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* =========================================================================
     * 1. COLUMNA IZQUIERDA: FLUJO PRINCIPAL DE INFRAESTRUCTURA
     * ========================================================================= */
    
    // 1.1 Red Internet (WAN / Red Pública) - Superior Izquierda
    var nodoInternet = addNode(
        pkg, diagram,
        "Red Internet\n(WAN / Red Pública)",
        "device",
        "Infraestructura pública de telecomunicaciones segura con protocolos TCP/IP, HTTPS y WSS.",
        140, 360, -30, -120,
        COLOR_DEVICE_BLUE
    );

    // 1.2 Servidor Web Frontend (Vercel Cloud Platform)
    var nodoFrontend = addNode(
        pkg, diagram,
        "Servidor Web Frontend\n(Vercel Cloud Platform)",
        "device",
        "Plataforma Serverless Edge y CDN de alta velocidad para alojamiento y caché global del frontend SPA.",
        80, 420, -170, -440,
        COLOR_DEVICE_BLUE
    );
    var envVercel = addExecutionEnv(
        nodoFrontend, diagram,
        "Vercel Edge Runtime\n(Node.js Engine)",
        "executionEnvironment",
        105, 395, -245, -415,
        COLOR_DEVICE_BLUE
    );
    addArtifact(
        nodoFrontend, diagram,
        "ClinicaVidaSalud Web\nBundle\n(React.js / Vite)",
        "artifact",
        125, 375, -315, -390,
        null
    );

    // 1.3 Servidor Backend (Railway Cloud Platform)
    var nodoBackend = addNode(
        pkg, diagram,
        "Servidor Backend\n(Railway Cloud Platform)",
        "device",
        "Servidor PaaS en contenedor Docker para lógica de negocio REST API, autenticación Sanctum y transacciones ACID.",
        80, 420, -500, -780,
        COLOR_DEVICE_BLUE
    );
    var envRailway = addExecutionEnv(
        nodoBackend, diagram,
        "Docker Container\n(PHP 8.3 + Laravel 13)",
        "executionEnvironment",
        105, 395, -575, -755,
        COLOR_DEVICE_BLUE
    );
    addArtifact(
        nodoBackend, diagram,
        "ClinicaVidaSalud REST\nAPI\n(Laravel 13 / Eloquent)",
        "artifact",
        125, 375, -645, -730,
        null
    );

    // 1.4 Servidor Base de Datos (Cloud PostgreSQL - Railway) - Inferior Izquierda
    var nodoDatabase = addNode(
        pkg, diagram,
        "Servidor Base de Datos\n(Cloud PostgreSQL - Railway)",
        "device",
        "Servicio de base de datos relacional administrada en Railway con transacciones ACID, integridad referencial y copias de seguridad.",
        80, 420, -840, -1120,
        COLOR_DEVICE_BLUE
    );
    var envPostgres = addExecutionEnv(
        nodoDatabase, diagram,
        "PostgreSQL 16 DBMS Engine",
        "executionEnvironment",
        105, 395, -915, -1095,
        COLOR_DB_PINK
    );
    addArtifact(
        nodoDatabase, diagram,
        "Esquema BD\nRelacional\n(clinica_db)",
        "artifact",
        125, 375, -985, -1070,
        COLOR_DB_PINK
    );

    /* =========================================================================
     * 2. COLUMNA CENTRAL: SERVICIOS CLOUD E IA EXTERNOS («Node» Amarillo)
     * ========================================================================= */

    // 2.1 Servicio Web Speech API (Dictado y reportes médicos por voz)
    var nodoSpeech = addNode(
        pkg, diagram,
        "Servicio Web Speech API\n(Dictado & Reportes por Voz)",
        "Node",
        "Servicio de reconocimiento de voz (Speech-to-Text) y síntesis auditiva (Text-to-Speech) para reportes clínicos.",
        530, 800, -270, -430,
        COLOR_SERVICE_YELLOW
    );
    addArtifact(
        nodoSpeech, diagram,
        "Web Speech Audio\nProcessing Engine\n(STT & TTS API)",
        "artifact",
        550, 780, -340, -410,
        null
    );

    // 2.2 Google Cloud - Gemini AI (Asistente Inteligente & Triaje)
    var nodoGemini = addNode(
        pkg, diagram,
        "Google Cloud - Gemini AI\n(Asistente Inteligente & IA)",
        "Node",
        "Modelos fundacionales multimodales de Google (Gemini 3.6 Flash/Pro) para chatbot de triaje médico y orientación al paciente.",
        530, 800, -510, -670,
        COLOR_SERVICE_YELLOW
    );
    addArtifact(
        nodoGemini, diagram,
        "Gemini 3.6 API\n(Chatbot de Triaje)",
        "artifact",
        550, 780, -580, -650,
        null
    );

    // 2.3 Pasarela de Pago (Stripe Payments)
    var nodoStripe = addNode(
        pkg, diagram,
        "Pasarela de Pago\n(Stripe Payments)",
        "Node",
        "Infraestructura de pagos digitales y cobros de consultas médicas con certificación PCI-DSS Nivel 1.",
        530, 800, -750, -910,
        COLOR_SERVICE_YELLOW
    );
    addArtifact(
        nodoStripe, diagram,
        "Stripe Payments\nREST API",
        "artifact",
        550, 780, -820, -890,
        null
    );

    /* =========================================================================
     * 3. COLUMNA DERECHA: DISPOSITIVOS DE USUARIOS / CLIENTES
     * ========================================================================= */

    // 3.1 Dispositivo Sucursal / Admin (PC Consultorio / Terminal Clínico) - Superior Derecha
    var nodoAdmin = addNode(
        pkg, diagram,
        "Dispositivo Sucursal / Admin\n(PC Consultorio / Terminal POS)",
        "device",
        "Estación de trabajo clínica y administrativa utilizada por médicos, recepcionistas y directores.",
        880, 1180, -10, -180,
        COLOR_DEVICE_BLUE
    );
    addArtifact(
        nodoAdmin, diagram,
        "Admin Dashboard\nSPA\n(React Web App)",
        "artifact",
        905, 1155, -80, -155,
        null
    );

    // 3.2 Dispositivo Cliente (PC / Laptop / Smartphone) - Medio Derecha
    var nodoCliente = addNode(
        pkg, diagram,
        "Dispositivo Cliente\n(PC / Laptop / Smartphone)",
        "device",
        "Dispositivo del paciente para agendamiento de citas, consulta de historial clínico, pagos y chat de triaje.",
        880, 1180, -240, -480,
        COLOR_DEVICE_BLUE
    );
    addArtifact(
        nodoCliente, diagram,
        "Portal Paciente SPA\n(React Web App)",
        "artifact",
        905, 1155, -310, -380,
        null
    );
    addArtifact(
        nodoCliente, diagram,
        "Módulo Dictado por Voz\n(Web Speech Client)",
        "artifact",
        905, 1155, -395, -465,
        null
    );

    /* =========================================================================
     * 4. VÍAS DE COMUNICACIÓN Y PROTOCOLOS (Communication Paths)
     * ========================================================================= */

    // 4.1 Clientes hacia Red Internet
    addCommunication(nodoAdmin, nodoInternet, "HTTPS :443\n(TLS 1.3)", "communication");
    addCommunication(nodoCliente, nodoInternet, "HTTPS :443\n(WSS/TLS 1.3)", "communication");

    // 4.2 Flujo Vertical de Infraestructura
    addCommunication(nodoInternet, nodoFrontend, "HTTPS :443\n(CDN / HTTP/2)", "communication");
    addCommunication(nodoFrontend, nodoBackend, "HTTPS / REST JSON\n(API Calls)", "communication");
    addCommunication(nodoBackend, nodoDatabase, "PDO_PGSQL / TCP :5432\n[SSL Encrypted]", "communication");

    // 4.3 Conexiones a Servicios Externos (Web Speech, Gemini, Stripe)
    addCommunication(nodoCliente, nodoSpeech, "HTTPS :443\n(Audio Stream / Dictado)", "communication");
    addCommunication(nodoBackend, nodoSpeech, "HTTPS :443\n(Speech Engine API)", "communication");
    addCommunication(nodoBackend, nodoGemini, "HTTPS :443\n(REST API)", "communication");
    addCommunication(nodoBackend, nodoStripe, "HTTPS :443\n(Payment Intents)", "communication");
    addCommunication(nodoCliente, nodoStripe, "HTTPS :443\n(Stripe Elements / Card Token)", "communication");

    /* =========================================================================
     * 5. GUARDAR, REFRESCAR Y ABRIR DIAGRAMA
     * ========================================================================= */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama vertical '" + DIAGRAM_NAME + "' generado exitosamente con el diseño idéntico al de referencia.");
    Session.Prompt("¡Diagrama de Despliegue con PostgreSQL y Servicios Externos generado con éxito en Enterprise Architect!", 0);
}

main();

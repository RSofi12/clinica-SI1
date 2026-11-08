/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU23 - Generar Reporte Personalizado por Voz con IA (RF13 / Ciclo 2)
 * DESCRIPCION: Diagrama de Comunicacion en Enterprise Architect 15.0+
 *              Alineado 1:1 con el Diagrama de Secuencia y el codigo fuente:
 *              Captura por voz Web Speech API, analisis semantico en VoiceReportService,
 *              consultas relacionales a Citas y Pacientes, persistencia transaccional
 *              en reportes_ia y auditoria en bitacora, mas exportacion Excel/PDF/CSV.
 * ACTORES: Administrador / Medico
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (UML 2.5+, arquitectura BCE)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU23 - Generar Reporte por Voz con IA (Comunicacion)";

function log(msg) {
    Session.Output("[CU23-Comunicacion] " + msg);
}

/**
 * Obtiene el paquete de destino en el Project Browser.
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
        Session.Prompt("No se encontro ningun modelo raiz en Enterprise Architect.", 0);
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
 * Recrea el diagrama limpio de tipo Collaboration / Communication con ShowRobustness=1.
 */
function crearDiagramaLimpio(pkg, name) {
    for (var i = pkg.Diagrams.Count - 1; i >= 0; i--) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == name) {
            try {
                pkg.Diagrams.Delete(i);
                pkg.Diagrams.Refresh();
                log("Diagrama previo eliminado para regeneracion limpia.");
            } catch (e) {
                log("Aviso al eliminar diagrama previo: " + e.message);
            }
            break;
        }
    }

    var diagram = pkg.Diagrams.AddNew(name, "Collaboration");
    try {
        diagram.StyleEx = "ShowRobustness=1;";
    } catch (e) { }
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Crea u obtiene un elemento con su tipo y estereotipo.
 */
function crearElementoConEsterotipo(pkg, name, tipo, estereotipo) {
    for (var i = 0; i < pkg.Elements.Count; i++) {
        var el = pkg.Elements.GetAt(i);
        if (el.Name == name && el.Type == tipo) {
            if (estereotipo && el.Stereotype != estereotipo) {
                el.Stereotype = estereotipo;
                el.Update();
            }
            return el;
        }
    }
    var newEl = pkg.Elements.AddNew(name, tipo);
    if (estereotipo && estereotipo.length > 0) {
        newEl.Stereotype = estereotipo;
    }
    newEl.Update();
    pkg.Elements.Refresh();
    return newEl;
}

/**
 * Elimina conectores antiguos para evitar relaciones residuales.
 */
function limpiarConectores(el) {
    for (var i = el.Connectors.Count - 1; i >= 0; i--) {
        try {
            el.Connectors.Delete(i);
        } catch (e) { }
    }
    el.Connectors.Refresh();
}

/**
 * Posiciona el elemento en el diagrama con coordenadas compactas.
 */
function colocarElemento(diagram, elemento, left, right, top, bottom) {
    var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom + ";", "");
    dObj.ElementID = elemento.ElementID;
    dObj.Update();
    return dObj;
}

/**
 * Crea un conector de llamada hacia adelante (Forward).
 */
function crearConectorLlamadas(origen, destino, listaMensajes) {
    var con = origen.Connectors.AddNew(listaMensajes.join("\r\n"), "Communication");
    con.SupplierID = destino.ElementID;
    con.Direction = "Source -> Destination";
    con.Update();
    return con;
}

/**
 * Crea un conector de retorno hacia atras (Return).
 */
function crearConectorRetornos(receptor, emisor, listaMensajes) {
    var con = receptor.Connectors.AddNew(listaMensajes.join("\r\n"), "Communication");
    con.SupplierID = emisor.ElementID;
    con.Direction = "Source -> Destination";
    con.Stereotype = "return";
    con.Update();
    return con;
}

function main() {
    log("Iniciando generacion de Diagrama de Comunicacion limpio para CU23 (BCE)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = crearDiagramaLimpio(pkg, DIAGRAM_NAME);

    /* -------------------------------------------------------------
     * 1. Elementos BCE (Actor, Boundary, Control, 4 Entities)
     * ------------------------------------------------------------- */
    var actorUsuario    = crearElementoConEsterotipo(pkg, "Administrador / Medico", "Actor", "");
    var uiVoiceReport   = crearElementoConEsterotipo(pkg, ":VoiceReportAssistant", "Object", "boundary");
    var ctrlVoiceReport = crearElementoConEsterotipo(pkg, ":VoiceReportController", "Object", "control");
    var entReporteIa    = crearElementoConEsterotipo(pkg, ":ReporteIa", "Object", "entity");
    var entCita         = crearElementoConEsterotipo(pkg, ":Cita", "Object", "entity");
    var entPaciente     = crearElementoConEsterotipo(pkg, ":Paciente", "Object", "entity");
    var entBitacora     = crearElementoConEsterotipo(pkg, ":Bitacora", "Object", "entity");

    limpiarConectores(actorUsuario);
    limpiarConectores(uiVoiceReport);
    limpiarConectores(ctrlVoiceReport);
    limpiarConectores(entReporteIa);
    limpiarConectores(entCita);
    limpiarConectores(entPaciente);
    limpiarConectores(entBitacora);

    /* -------------------------------------------------------------
     * 2. Posicionamiento canónico:
     *    Actor -> Boundary -> Control en linea horizontal central;
     *    Entidades en abanico a la derecha sin cruces.
     * ------------------------------------------------------------- */
    colocarElemento(diagram, actorUsuario,    "40",  "110", "-150", "-230");
    colocarElemento(diagram, uiVoiceReport,   "240", "320", "-150", "-230");
    colocarElemento(diagram, ctrlVoiceReport, "480", "560", "-150", "-230");
    colocarElemento(diagram, entReporteIa,    "760", "840", "60",   "-20");
    colocarElemento(diagram, entCita,         "760", "840", "-60",  "-140");
    colocarElemento(diagram, entPaciente,     "760", "840", "-180", "-260");
    colocarElemento(diagram, entBitacora,     "760", "840", "-300", "-380");

    /* -------------------------------------------------------------
     * 3. Conectores y Mensajes (Separacion en Forward y Return)
     * ------------------------------------------------------------- */

    // Conector 1A (Actor -> Boundary): Invocaciones de usuario
    var msgActUI = [
        "1: clickMicrofono() →",
        "2: dictarComando(audio) →",
        "3: clickConsultar() →",
        "4: clickExportarExcel() →",
        "5: clickExportarPdf() →",
        "6: clickExportarCsv() →"
    ];
    crearConectorLlamadas(actorUsuario, uiVoiceReport, msgActUI);

    // Conector 1B (Boundary -> Actor): Retornos hacia el usuario
    var msgUIRetAct = [
        "← 3.15: renderizarReporte()",
        "← 4.1: exportToExcel()",
        "← 5.1: exportToPdf()",
        "← 6.1: exportToCsv()"
    ];
    crearConectorRetornos(uiVoiceReport, actorUsuario, msgUIRetAct);

    // Conector 2A (Boundary -> Controller): Peticiones REST
    var msgUICtrl = [
        "3.1: processVoiceCommand(request) →"
    ];
    crearConectorLlamadas(uiVoiceReport, ctrlVoiceReport, msgUICtrl);

    // Conector 2B (Controller -> Boundary): Respuesta JSON 200 OK
    var msgCtrlRetUI = [
        "← 3.14: 200 OK (datos, metricas)"
    ];
    crearConectorRetornos(ctrlVoiceReport, uiVoiceReport, msgCtrlRetUI);

    // Conector 3 (Controller -> ReporteIa): Creacion de reporte persistido
    var msgCtrlRep = [
        "3.11: create(reporte) →"
    ];
    crearConectorLlamadas(ctrlVoiceReport, entReporteIa, msgCtrlRep);

    // Conector 4 (Controller -> Cita): Consulta de citas y filtros
    var msgCtrlCit = [
        "3.8: consultarCitas(filtros) →"
    ];
    crearConectorLlamadas(ctrlVoiceReport, entCita, msgCtrlCit);

    // Conector 5 (Controller -> Paciente): Consulta de pacientes
    var msgCtrlPac = [
        "3.6: consultarPacientes(filtros) →"
    ];
    crearConectorLlamadas(ctrlVoiceReport, entPaciente, msgCtrlPac);

    // Conector 6 (Controller -> Bitacora): Registro de auditoria
    var msgCtrlBit = [
        "3.13: registrar(evento) →"
    ];
    crearConectorLlamadas(ctrlVoiceReport, entBitacora, msgCtrlBit);

    /* -------------------------------------------------------------
     * 4. Guardar, refrescar y abrir el diagrama
     * ------------------------------------------------------------- */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Comunicacion CU23 generado con separacion estricta de conectores, 1:1 con Secuencia!", 0);
}

main();
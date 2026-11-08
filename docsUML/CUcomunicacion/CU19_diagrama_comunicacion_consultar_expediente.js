/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU19 - Consultar Expediente Medico y Antecedentes
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (Enterprise Architect JScript)
 * ARQUITECTURA: BCE Canonica (1 Boundary, 1 Control, 6 Entities)
 * PARTICIPANTES:
 *   - Actor: Medico / Paciente
 *   - Boundary: :ExpedienteClinicoView
 *   - Controller: :ExpedienteController
 *   - Entities: :Paciente, :HistoriaClinica, :Antecedente, :ConsultaMedica, :Receta, :Bitacora
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU19 - Comunicacion Expediente Medico";

function log(msg) {
    Session.Output("[CU19-Comunicacion] " + msg);
}

function getTargetPackage() {
    var selectedPkg = Repository.GetTreeSelectedPackage();
    if (selectedPkg != null) return selectedPkg;

    var roots = Repository.Models;
    var root = (roots.Count > 0) ? roots.GetAt(0) : null;
    if (root == null) return null;

    for (var i = 0; i < root.Packages.Count; i++) {
        var p = root.Packages.GetAt(i);
        if (p.Name == DEFAULT_PACKAGE_NAME) return p;
    }

    var newPkg = root.Packages.AddNew(DEFAULT_PACKAGE_NAME, "Package");
    newPkg.Update();
    root.Packages.Refresh();
    return newPkg;
}

function recreateDiagram(pkg) {
    for (var i = pkg.Diagrams.Count - 1; i >= 0; i--) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == DIAGRAM_NAME) {
            pkg.Diagrams.Delete(i);
            pkg.Diagrams.Refresh();
            break;
        }
    }
    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Communication");
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

function addNode(pkg, diagram, name, stereotype, x, y, w, h) {
    var el = pkg.Elements.AddNew(name, "Object");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var dObj = diagram.DiagramObjects.AddNew("l=" + x + ";r=" + (x + w) + ";t=" + y + ";b=" + (y + h) + ";", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

function addLink(src, dst, msgLabel, isReturn) {
    if (!msgLabel || msgLabel.length === 0) return null;
    var con = src.Connectors.AddNew(msgLabel, "Communication");
    con.SupplierID = dst.ElementID;
    con.Direction = "Source -> Destination";
    con.Name = msgLabel;
    if (isReturn) {
        con.Stereotype = "return";
    }
    con.Update();
    return con;
}

function main() {
    Repository.EnsureOutputVisible("Script");
    log("Generando Diagrama de Comunicacion CU19 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. NODOS BCE (1 Actor -> 1 Boundary -> 1 Controller -> 6 Entities)
    // =========================================================================
    var actMed = addNode(pkg, diagram, "Medico / Paciente", "Actor", 50, -280, 80, 70);
    var bndExp = addNode(pkg, diagram, ":ExpedienteClinicoView", "Boundary", 250, -280, 150, 70);
    var ctrlExp = addNode(pkg, diagram, ":ExpedienteController", "Control", 510, -280, 140, 70);

    // Entidades en abanico ordenado a la derecha
    var entPac = addNode(pkg, diagram, ":Paciente", "Entity", 850, -60, 100, 55);
    var entHis = addNode(pkg, diagram, ":HistoriaClinica", "Entity", 850, -145, 110, 55);
    var entAnt = addNode(pkg, diagram, ":Antecedente", "Entity", 850, -230, 100, 55);
    var entCon = addNode(pkg, diagram, ":ConsultaMedica", "Entity", 850, -315, 110, 55);
    var entRec = addNode(pkg, diagram, ":Receta", "Entity", 850, -400, 100, 55);
    var entBit = addNode(pkg, diagram, ":Bitacora", "Entity", 850, -485, 100, 55);

    // =========================================================================
    // 2. ENLACES Y MENSAJES (Coincidencia 1:1 con Secuencia)
    // =========================================================================

    // Actor -> Boundary
    addLink(actMed, bndExp, "1: abrirExpediente(paciente) ->", false);
    addLink(bndExp, actMed, "<- 1.15: renderizarExpedienteYMetricas()", true);

    addLink(actMed, bndExp, "2: seleccionarPestanaTimeline() ->", false);
    addLink(bndExp, actMed, "<- 2.4: renderizarTimelineCronologico()", true);

    addLink(actMed, bndExp, "3: consultarMiExpediente() ->", false);
    addLink(bndExp, actMed, "<- 3.4: renderizarVistaSoloLectura()", true);

    // Boundary -> Controller
    addLink(bndExp, ctrlExp, "1.1: showByPatient(idPaciente) ->", false);
    addLink(ctrlExp, bndExp, "<- 1.14: 200 OK (expedienteIntegral)", true);

    addLink(bndExp, ctrlExp, "2.1: timeline(idPaciente) ->", false);
    addLink(ctrlExp, bndExp, "<- 2.3: 200 OK (timeline)", true);

    addLink(bndExp, ctrlExp, "3.1: miExpediente() ->", false);
    addLink(ctrlExp, bndExp, "<- 3.3: 200 OK (miExpediente)", true);

    // Controller reflexivo
    addLink(ctrlExp, ctrlExp, "1.2: validarAcceso(), 2.2: obtenerTimeline(), 3.2: validarIdentidadPaciente()", false);

    // Controller -> Entities (Unidireccional: entidades no responden al controller)
    addLink(ctrlExp, entPac, "1.3: findOrFail(idPaciente) ->", false);
    addLink(ctrlExp, entHis, "1.5: firstOrCreate(idPaciente) ->", false);
    addLink(ctrlExp, entAnt, "1.7: where('id_historia', id) ->", false);
    addLink(ctrlExp, entCon, "1.9: where('id_historia', id) ->", false);
    addLink(ctrlExp, entRec, "1.11: where('id_historia', id) ->", false);
    addLink(ctrlExp, entBit, "1.13: registrar(CONSULTAR_EXP) ->", false);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Comunicacion CU19 generado exitosamente.");
}

main();

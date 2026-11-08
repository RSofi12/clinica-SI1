/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU18 - Gestionar Expediente Clinico Digital (Prescripciones y Recetas)
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (Enterprise Architect JScript)
 * ARQUITECTURA: BCE Canonica (1 Boundary, 1 Control, 5 Entities)
 * PARTICIPANTES:
 *   - Actor: Medico / Administrador
 *   - Boundary: :RecetaPrescripcionModal
 *   - Controller: :RecetasController
 *   - Entities: :ConsultaMedica, :HistoriaClinica, :Receta, :RecetaDetalle, :Bitacora
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU18 - Comunicacion Expediente Clinico Digital";

function log(msg) {
    Session.Output("[CU18-Comunicacion] " + msg);
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
    log("Generando Diagrama de Comunicacion CU18 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. NODOS BCE (1 Actor -> 1 Boundary -> 1 Controller -> 5 Entities)
    // =========================================================================
    var actMed = addNode(pkg, diagram, "Medico / Administrador", "Actor", 50, -280, 80, 70);
    var bndRec = addNode(pkg, diagram, ":RecetaPrescripcionModal", "Boundary", 250, -280, 150, 70);
    var ctrlRec = addNode(pkg, diagram, ":RecetasController", "Control", 510, -280, 140, 70);

    // Entidades en abanico ordenado a la derecha
    var entCon = addNode(pkg, diagram, ":ConsultaMedica", "Entity", 850, -100, 110, 60);
    var entHis = addNode(pkg, diagram, ":HistoriaClinica", "Entity", 850, -190, 110, 60);
    var entRec = addNode(pkg, diagram, ":Receta", "Entity", 850, -280, 100, 60);
    var entDet = addNode(pkg, diagram, ":RecetaDetalle", "Entity", 850, -370, 110, 60);
    var entBit = addNode(pkg, diagram, ":Bitacora", "Entity", 850, -460, 100, 60);

    // =========================================================================
    // 2. ENLACES Y MENSAJES (Coincidencia 1:1 con Secuencia)
    // =========================================================================

    // Actor -> Boundary
    addLink(actMed, bndRec, "1: abrirModuloRecetas(idConsulta) ->", false);
    addLink(bndRec, actMed, "<- 1.7: renderizarListadoRecetas()", true);

    addLink(actMed, bndRec, "2: enviarPrescripcion(payload) ->", false);
    addLink(bndRec, actMed, "<- 2.11: notificarEmisionExitosa()", true);

    addLink(actMed, bndRec, "3: solicitarAnulacion(id, motivo) ->", false);
    addLink(bndRec, actMed, "<- 3.9: reflejarEstadoAnulado()", true);

    // Boundary -> Controller
    addLink(bndRec, ctrlRec, "1.1: byConsulta(idConsulta) ->", false);
    addLink(ctrlRec, bndRec, "<- 1.6: 200 OK (recetas)", true);

    addLink(bndRec, ctrlRec, "2.1: store(payload) ->", false);
    addLink(ctrlRec, bndRec, "<- 2.10: 201 Created (receta)", true);

    addLink(bndRec, ctrlRec, "3.1: anular(id, motivo) ->", false);
    addLink(ctrlRec, bndRec, "<- 3.8: 200 OK (anulada)", true);

    // Controller reflexivo
    addLink(ctrlRec, ctrlRec, "2.2: validate(), 2.3: validarAccesoMedico(), 2.4: DB::transaction(), 3.2: validate(AnularRequest)", false);

    // Controller -> Entities (Unidireccional: entidades no responden al controller)
    addLink(ctrlRec, entCon, "1.2: find(idConsulta) ->", false);

    addLink(ctrlRec, entRec, "1.4: where('id_consulta', id) ->", false);
    addLink(ctrlRec, entRec, "2.5: create(datosReceta) ->", false);
    addLink(ctrlRec, entRec, "3.3: find(idReceta) ->", false);
    addLink(ctrlRec, entRec, "3.5: update('ANULADO') ->", false);

    addLink(ctrlRec, entDet, "2.7: create(detalleFarmaco) ->", false);

    addLink(ctrlRec, entBit, "2.9: registrar(EMITIR_RECETA) ->", false);
    addLink(ctrlRec, entBit, "3.7: registrar(ANULAR_RECETA) ->", false);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Comunicacion CU18 generado exitosamente.");
}

main();

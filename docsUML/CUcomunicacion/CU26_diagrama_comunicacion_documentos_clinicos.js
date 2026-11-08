/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU26 - Gestionar Documentos Clinicos Adjuntos y Visor DICOM
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (Enterprise Architect JScript)
 * ARQUITECTURA: BCE Canonica (1 Boundary, 1 Control, 4 Entities)
 * PARTICIPANTES:
 *   - Actor: Medico / Administrador
 *   - Boundary: :ClinicalDocumentsSection
 *   - Controller: :DocumentosClinicosController
 *   - Entities: :HistoriaClinica, :DocumentoClinico, :OrdenExamen, :Bitacora
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU26 - Comunicacion Documentos Clinicos Adjuntos";

function log(msg) {
    Session.Output("[CU26-Comunicacion] " + msg);
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

/**
 * Agrega un enlace de comunicacion unidireccional con flecha visible.
 */
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
    log("Generando Diagrama de Comunicacion CU26 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. NODOS BCE (1 Actor -> 1 Boundary -> 1 Controller -> 4 Entities)
    // =========================================================================
    var actMed = addNode(pkg, diagram, "Medico / Administrador", "Actor", 50, -280, 80, 70);
    var bndDoc = addNode(pkg, diagram, ":ClinicalDocumentsSection", "Boundary", 260, -280, 150, 70);
    var ctrlDoc = addNode(pkg, diagram, ":DocumentosClinicosController", "Control", 530, -280, 150, 70);

    // Entidades en abanico ordenado a la derecha
    var entHis = addNode(pkg, diagram, ":HistoriaClinica", "Entity", 870, -140, 110, 60);
    var entDoc = addNode(pkg, diagram, ":DocumentoClinico", "Entity", 870, -240, 110, 60);
    var entOrd = addNode(pkg, diagram, ":OrdenExamen", "Entity", 870, -340, 110, 60);
    var entBit = addNode(pkg, diagram, ":Bitacora", "Entity", 870, -440, 100, 60);

    // =========================================================================
    // 2. ENLACES Y MENSAJES (Coincidencia 1:1 con Secuencia)
    // =========================================================================

    // Actor -> Boundary
    addLink(actMed, bndDoc, "1: abrirPestanaDocumentos() ->", false);
    addLink(bndDoc, actMed, "<- 1.8: renderizarListadoYMetricas()", true);

    addLink(actMed, bndDoc, "2: abrirFormularioAdjuntar() ->", false);
    addLink(bndDoc, actMed, "<- 2.5: poblarSelectorOrdenes()", true);

    addLink(actMed, bndDoc, "3: enviarFormulario() ->", false);
    addLink(bndDoc, actMed, "<- 3.11: notificarExitoYActualizar()", true);

    addLink(actMed, bndDoc, "4: clickAbrirVisorDicom() ->", false);

    addLink(actMed, bndDoc, "5: solicitarEliminacion() ->", false);
    addLink(bndDoc, actMed, "<- 5.8: reflejarBajaLogicaEnVista()", true);

    // Boundary -> Controller
    addLink(bndDoc, ctrlDoc, "1.1: index(idHistoria) ->", false);
    addLink(ctrlDoc, bndDoc, "<- 1.7: 200 OK (documentos, metricas)", true);

    addLink(bndDoc, ctrlDoc, "2.1: ordenesPendientes(idHistoria) ->", false);
    addLink(ctrlDoc, bndDoc, "<- 2.4: 200 OK (ordenes)", true);

    addLink(bndDoc, ctrlDoc, "3.1: store(idHistoria) ->", false);
    addLink(ctrlDoc, bndDoc, "<- 3.10: 201 Created (documento)", true);

    addLink(bndDoc, ctrlDoc, "5.1: destroy(idDocumento) ->", false);
    addLink(ctrlDoc, bndDoc, "<- 5.7: 200 OK (eliminado)", true);

    // Controller reflexivo
    addLink(ctrlDoc, ctrlDoc, "1.2: validarAcceso(), 3.2: validate(), 3.3: subirACloudinaryApi(), 3.4: DB::transaction(), 5.2: validarAutorizacion(), 5.3: eliminarDeCloudinaryApi()", false);

    // Controller -> Entities (Unidireccional: entidades no responden a controller)
    addLink(ctrlDoc, entHis, "1.3: findOrFail(idHistoria) ->", false);

    addLink(ctrlDoc, entDoc, "1.5: where('id_historia', id) ->", false);
    addLink(ctrlDoc, entDoc, "3.7: create(datosDocumento) ->", false);
    addLink(ctrlDoc, entDoc, "5.4: update('estado', 'INACTIVO') ->", false);

    addLink(ctrlDoc, entOrd, "2.2: where('estado', 'PENDIENTE') ->", false);
    addLink(ctrlDoc, entOrd, "3.5: update('CON_RESULTADOS') ->", false);

    addLink(ctrlDoc, entBit, "3.9: registrar(ADJUNTAR_DOC) ->", false);
    addLink(ctrlDoc, entBit, "5.6: registrar(ELIMINAR_DOC) ->", false);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Comunicacion CU26 generado exitosamente.");
}

main();

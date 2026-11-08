/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU16 - Registrar Consulta Medica y Triaje Clinico
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (Enterprise Architect JScript)
 * ARQUITECTURA: BCE Canonica (1 Boundary, 1 Control, 6 Entities)
 * PARTICIPANTES:
 *   - Actor: Medico
 *   - Boundary: :ConsultaRegistroModal
 *   - Controller: :ConsultasController
 *   - Entities: :Cita, :HistoriaClinica, :ConsultaMedica, :Diagnostico, :CitaEstadoHistorial, :Bitacora
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU16 - Comunicacion Registrar Consulta Medica";

function log(msg) {
    Session.Output("[CU16-Comunicacion] " + msg);
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
    log("Generando Diagrama de Comunicacion CU16 (1 Boundary, 1 Controller, enlaces con flechas)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. NODOS BCE (1 Actor -> 1 Boundary -> 1 Controller -> 6 Entities)
    // =========================================================================
    var actMed = addNode(pkg, diagram, "Medico", "Actor", 50, -250, 70, 70);
    var bndReg = addNode(pkg, diagram, ":ConsultaRegistroModal", "Boundary", 240, -250, 130, 70);
    var ctrlCon = addNode(pkg, diagram, ":ConsultasController", "Control", 480, -250, 120, 70);

    // Entidades en abanico ordenado a la derecha
    var entCit = addNode(pkg, diagram, ":Cita", "Entity", 780, -100, 90, 60);
    var entHis = addNode(pkg, diagram, ":HistoriaClinica", "Entity", 780, -180, 100, 60);
    var entCon = addNode(pkg, diagram, ":ConsultaMedica", "Entity", 780, -260, 100, 60);
    var entDia = addNode(pkg, diagram, ":Diagnostico", "Entity", 780, -340, 90, 60);
    var entEst = addNode(pkg, diagram, ":CitaEstadoHistorial", "Entity", 780, -420, 110, 60);
    var entBit = addNode(pkg, diagram, ":Bitacora", "Entity", 780, -500, 80, 60);

    diagram.Update();

    // =========================================================================
    // 2. ENLACES BICOMUNICACION: Conector 1 (Llamadas →) y Conector 2 (Retornos ←)
    // =========================================================================

    // Relacion 1: Actor <---> Boundary (:ConsultaRegistroModal)
    // Conector 1 (Llamadas Actor -> Boundary):
    addLink(actMed, bndReg, "1: abrirConsulta(cita)→\r\n2: ingresarSignosVitales()→\r\n3: ingresarDiagnosticosYTratamiento()→\r\n4: clickGuardarConsulta()→", false);
    // Conector 2 (Retornos Boundary -> Actor):
    addLink(bndReg, actMed, "← 1.5: mostrarFormulario()\r\n← 5.15: notificarExitoYConfirmar()\r\n← 6.1: mostrarAlertaError()", true);

    // Auto-llamada en Boundary (calculo reactivo de IMC en cliente)
    addLink(bndReg, bndReg, "2.1: calcularIMC()⟲", false);

    // Relacion 2: Boundary (:ConsultaRegistroModal) <---> Controller (:ConsultasController)
    // Conector 1 (Llamadas Boundary -> Controller):
    addLink(bndReg, ctrlCon, "1.1: GET /citas/{id}/preparar→\r\n5: POST /consultas (payload)→", false);
    // Conector 2 (Retornos Controller -> Boundary):
    addLink(ctrlCon, bndReg, "← 1.4: 200 OK (datosFicha)\r\n← 5.14: 201 Created (consulta)\r\n← 6: 422 Unprocessable / 403 Forbidden", true);

    // Auto-llamadas reflexivas en Controller (Validaciones y Transaccion)
    addLink(ctrlCon, ctrlCon, "5.1: validate(ConsultaCreateRequest)⟲\r\n5.2: DB::transaction()⟲\r\n5.5: validarAccesoMedico(cita)⟲", false);

    // =========================================================================
    // 3. ENLACES UNIDIRECCIONALES CONTROLLER -> ENTITIES (Solo llamadas →)
    // =========================================================================
    addLink(ctrlCon, entCit, "1.2: with(paciente,antecedentes)→\r\n5.3: lockForUpdate(idCita)→\r\n5.11: update(['estado' => 'ATENDIDA'])→", false);
    addLink(ctrlCon, entHis, "5.6: firstOrCreate(id_paciente)→", false);
    addLink(ctrlCon, entCon, "5.8: create(datosTriaje)→", false);
    addLink(ctrlCon, entDia, "5.10: create(diagnostico)→", false);
    addLink(ctrlCon, entEst, "5.12: create(historialEstado)→", false);
    addLink(ctrlCon, entBit, "5.13: registrar(REGISTRAR_CONSULTA)→", false);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Comunicacion CU16 generado exitosamente con 8 participantes (1 Boundary, 1 Controller).");
}

main();

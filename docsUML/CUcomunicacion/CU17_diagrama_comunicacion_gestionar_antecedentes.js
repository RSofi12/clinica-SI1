/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU17 - Gestionar Antecedentes Medicos
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (Enterprise Architect JScript)
 * ARQUITECTURA: BCE Canonica (1 Boundary, 1 Control, 4 Entities)
 * PARTICIPANTES:
 *   - Actor: Medico / Administrador
 *   - Boundary: :AntecedentesPatientModal
 *   - Controller: :AntecedentesController
 *   - Entities: :Paciente, :HistoriaClinica, :Antecedente, :Bitacora
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU17 - Comunicacion Gestionar Antecedentes";

function log(msg) {
    Session.Output("[CU17-Comunicacion] " + msg);
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
    log("Generando Diagrama de Comunicacion CU17 (1 Boundary, 1 Controller, enlaces con flechas)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. NODOS BCE (1 Actor -> 1 Boundary -> 1 Controller -> 4 Entities)
    // =========================================================================
    var actMed = addNode(pkg, diagram, "Medico / Administrador", "Actor", 50, -250, 80, 70);
    var bndAnt = addNode(pkg, diagram, ":AntecedentesPatientModal", "Boundary", 250, -250, 140, 70);
    var ctrlAnt = addNode(pkg, diagram, ":AntecedentesController", "Control", 500, -250, 130, 70);

    // Entidades en abanico ordenado a la derecha
    var entPac = addNode(pkg, diagram, ":Paciente", "Entity", 820, -120, 90, 60);
    var entHis = addNode(pkg, diagram, ":HistoriaClinica", "Entity", 820, -210, 100, 60);
    var entAnt = addNode(pkg, diagram, ":Antecedente", "Entity", 820, -300, 95, 60);
    var entBit = addNode(pkg, diagram, ":Bitacora", "Entity", 820, -390, 85, 60);

    diagram.Update();

    // =========================================================================
    // 2. ENLACES BICOMUNICACION: Conector 1 (Llamadas →) y Conector 2 (Retornos ←)
    // =========================================================================

    // Relacion 1: Actor <---> Boundary (:AntecedentesPatientModal)
    // Conector 1 (Llamadas Actor -> Boundary):
    addLink(actMed, bndAnt, "1: abrirGestionAntecedentes(paciente)→\r\n2: ingresarAntecedente(tipo, descripcion)→\r\n3: editarAntecedente(id, datos)→\r\n4: toggleEstado(idAntecedente)→", false);
    // Conector 2 (Retornos Boundary -> Actor):
    addLink(bndAnt, actMed, "← 1.10: renderizarPestanasYAlertas()\r\n← 2.12: actualizarListaYAlerta()\r\n← 2.14: notificarErrorDuplicado()\r\n← 3.7: reflejarCambioEnVista()\r\n← 4.6: notificarCambioEstado()", true);

    // Relacion 2: Boundary (:AntecedentesPatientModal) <---> Controller (:AntecedentesController)
    // Conector 1 (Llamadas Boundary -> Controller):
    addLink(bndAnt, ctrlAnt, "1.1: indexByPatient(idPaciente)→\r\n2.1: store(payload)→\r\n3.1: update(id)→\r\n4.1: toggleStatus(id)→", false);
    // Conector 2 (Retornos Controller -> Boundary):
    addLink(ctrlAnt, bndAnt, "← 1.9: return antecedentes\r\n← 2.11: return antecedente\r\n← 2.13: 422 Unprocessable (duplicado activo)\r\n← 3.6: return antecedenteActualizado\r\n← 4.5: return nuevoEstado", true);

    // Auto-llamadas reflexivas en Controller (Validaciones y Transaccion)
    addLink(ctrlAnt, ctrlAnt, "1.2: validarAccesoRBAC()⟲\r\n2.2: validate(AntecedenteCreateRequest)⟲\r\n2.3: DB::transaction()⟲\r\n3.2: validate(AntecedenteUpdateRequest)⟲", false);

    // =========================================================================
    // 3. ENLACES UNIDIRECCIONALES CONTROLLER -> ENTITIES (Solo llamadas →)
    // =========================================================================
    addLink(ctrlAnt, entPac, "1.3: findOrFail(idPaciente)→", false);
    addLink(ctrlAnt, entHis, "1.5: where('id_paciente', id)→\r\n2.4: firstOrCreate(idPaciente)→", false);
    addLink(ctrlAnt, entAnt, "1.7: scopePorPaciente(idHistoria)→\r\n2.6: verificarDuplicadoActivo()→\r\n2.8: create(datosAntecedente)→\r\n3.3: update(datos)→\r\n4.2: findOrFail(id) / save()→", false);
    addLink(ctrlAnt, entBit, "2.10: registrar(CREAR_ANTECEDENTE)→\r\n3.5: registrar(EDITAR_ANTECEDENTE)→\r\n4.4: registrar(BAJA_LOGICA_ANTECEDENTE)→", false);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Comunicacion CU17 generado exitosamente con 7 participantes (1 Boundary, 1 Controller).");
}

main();

/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU19 - Consultar Expediente Medico y Antecedentes (Ciclo 2 / P4)
 * DESCRIPCION: Consulta protegida del historial clinico completo del paciente:
 *              antecedentes clinicos (CU17), consultas y triaje con CIE-10 (CU16),
 *              recetas y prescripciones (CU18), timeline cronologico,
 *              scoping Anti-IDOR (medicos acceso asistencial, pacientes solo lectura de
 *              su propio expediente, recepcionistas bloqueados) y auditoria en Bitacora.
 * ACTOR: Medico / Paciente
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE canonica: 1 Boundary y 1 Controller)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO REAL:
 * - Boundary: :ExpedienteClinicoView (interfaz integral y timeline)
 * - Controller: :ExpedienteController (orquestador REST y agregador de dominio)
 * - Entities: :Paciente, :HistoriaClinica, :Antecedente, :ConsultaMedica, :Receta, :Bitacora
 * - Convencion de funciones () o maximo 1 parametro.
 * - Sin cruces de mensajes entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmentos ALT con comentario de rango de mensajes.
 * - Recuadros rectangulares con colores por defecto de Enterprise Architect.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU19 - Consultar Expediente Medico y Antecedentes";

function log(msg) {
    Session.Output("[CU19-Secuencia] " + msg);
}

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

function recreateDiagram(pkg) {
    for (var i = pkg.Diagrams.Count - 1; i >= 0; i--) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == DIAGRAM_NAME) {
            try {
                pkg.Diagrams.Delete(i);
                pkg.Diagrams.Refresh();
                log("Diagrama previo eliminado para regeneracion limpia.");
            } catch (e) {
                log("Aviso al eliminar: " + e.message);
            }
            break;
        }
    }

    var diagram = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Sequence");
    try {
        diagram.StyleEx = "ShowRobustness=0;SequenceCustomArt=0;";
    } catch (e) { }
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

function addActorParticipant(pkg, diagram, name, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Actor");
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2400;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

function addParticipant(pkg, diagram, name, stereotype, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2300;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

function addEntityParticipant(pkg, diagram, name, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    el.Stereotype = "Entity" + String.fromCharCode(160);
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2300;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

function addMessage(src, dst, label, isReturn, sequenceNo) {
    var con = src.Connectors.AddNew(label, "Sequence");
    con.SupplierID = dst.ElementID;
    if (isReturn) {
        con.Stereotype = "return";
    }
    if (sequenceNo) {
        try {
            con.SequenceNo = sequenceNo;
        } catch (e) { }
    }
    con.Update();
    return con;
}

function addCombinedFragment(pkg, diagram, type, guardLabel, left, right, top, bottom) {
    try {
        var frag = pkg.Elements.AddNew(guardLabel, "InteractionFragment");
        frag.Stereotype = type;
        frag.Update();

        var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom + ";", "");
        dObj.ElementID = frag.ElementID;
        dObj.Update();
        return frag;
    } catch (e) {
        log("No se pudo agregar fragmento " + type + ": " + e.message);
        return null;
    }
}

function main() {
    Repository.EnsureOutputVisible("Script");
    log("Iniciando generacion del Diagrama de Secuencia CU19 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. PARTICIPANTES (BCE: 1 Actor -> 1 Boundary -> 1 Controller -> 6 Entities)
    // =========================================================================
    var actMed = addActorParticipant(pkg, diagram, "Medico / Paciente", 30, 90);
    var bndExp = addParticipant(pkg, diagram, ":ExpedienteClinicoView", "Interface", 180, 180);
    var ctrlExp = addParticipant(pkg, diagram, ":ExpedienteController", "Controller", 430, 170);
    var entPac = addEntityParticipant(pkg, diagram, ":Paciente", 670, 90);
    var entHis = addEntityParticipant(pkg, diagram, ":HistoriaClinica", 820, 110);
    var entAnt = addEntityParticipant(pkg, diagram, ":Antecedente", 980, 100);
    var entCon = addEntityParticipant(pkg, diagram, ":ConsultaMedica", 1130, 110);
    var entRec = addEntityParticipant(pkg, diagram, ":Receta", 1290, 80);
    var entBit = addEntityParticipant(pkg, diagram, ":Bitacora", 1420, 80);

    diagram.Update();
    pkg.Diagrams.Refresh();

    // =========================================================================
    // 2. MENSAJES Y LLAMADAS
    // =========================================================================

    // FASE 1: Consulta de Expediente Clinico Integral (Scoping Anti-IDOR)
    addMessage(actMed, bndExp, "1: abrirExpediente(paciente)", false, 1);
    addMessage(bndExp, ctrlExp, "1.1: showByPatient(idPaciente)", false, 2);
    addMessage(ctrlExp, ctrlExp, "1.2: validarAcceso(idPaciente)", false, 3);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Acceso autorizado]: Mensajes 1.3 a 1.15
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[usuario autorizado: medico o paciente propio]", 410, 1530, -960, -1720);

    addMessage(ctrlExp, entPac, "1.3: findOrFail(idPaciente)", false, 4);
    addMessage(entPac, ctrlExp, "1.4: return paciente", true, 5);
    addMessage(ctrlExp, entHis, "1.5: firstOrCreate(idPaciente)", false, 6);
    addMessage(entHis, ctrlExp, "1.6: return historiaClinica", true, 7);
    addMessage(ctrlExp, entAnt, "1.7: where('id_historia', id)", false, 8);
    addMessage(entAnt, ctrlExp, "1.8: return antecedentes", true, 9);
    addMessage(ctrlExp, entCon, "1.9: where('id_historia', id)", false, 10);
    addMessage(entCon, ctrlExp, "1.10: return consultasYTriaje", true, 11);
    addMessage(ctrlExp, entRec, "1.11: where('id_historia', id)", false, 12);
    addMessage(entRec, ctrlExp, "1.12: return recetasYDetalles", true, 13);
    addMessage(ctrlExp, entBit, "1.13: registrar(CONSULTAR_EXPEDIENTE)", false, 14);
    addMessage(ctrlExp, bndExp, "1.14: return 200 OK (expedienteIntegral)", true, 15);
    addMessage(bndExp, actMed, "1.15: renderizarExpedienteYMetricas()", true, 16);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Acceso denegado / Recepcionista]: Mensajes 1.16 a 1.17
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[recepcionista o paciente ajeno]", 410, 1530, -1740, -1900);
    addMessage(ctrlExp, bndExp, "1.16: return 403 Forbidden (secretoMedico)", true, 17);
    addMessage(bndExp, actMed, "1.17: mostrarAlertaAccesoRestringido()", true, 18);

    // FASE 2: Consulta del Timeline Cronologico Unificado
    addMessage(actMed, bndExp, "2: seleccionarPestanaTimeline()", false, 19);
    addMessage(bndExp, ctrlExp, "2.1: timeline(idPaciente)", false, 20);
    addMessage(ctrlExp, ctrlExp, "2.2: obtenerTimeline(idPaciente)", false, 21);
    addMessage(ctrlExp, bndExp, "2.3: return 200 OK (eventosOrdenados)", true, 22);
    addMessage(bndExp, actMed, "2.4: renderizarTimelineCronologico()", true, 23);

    // FASE 3: Modo Autoservicio del Paciente (Solo Lectura)
    addMessage(actMed, bndExp, "3: consultarMiExpediente()", false, 24);
    addMessage(bndExp, ctrlExp, "3.1: miExpediente()", false, 25);
    addMessage(ctrlExp, ctrlExp, "3.2: validarIdentidadPaciente()", false, 26);
    addMessage(ctrlExp, bndExp, "3.3: return 200 OK (miExpediente)", true, 27);
    addMessage(bndExp, actMed, "3.4: renderizarVistaSoloLectura()", true, 28);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Secuencia CU19 generado exitosamente con 9 participantes (1 Boundary, 1 Controller).");
}

main();

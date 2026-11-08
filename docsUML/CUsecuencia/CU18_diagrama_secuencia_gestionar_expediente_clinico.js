/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU18 - Gestionar Expediente Clinico Digital (Prescripciones y Recetas)
 * DESCRIPCION: Modulo asistencial exclusivo para medicos: emision de recetas estructuradas,
 *              detalle de posologia de farmacos, consulta de historial prescriptivo,
 *              politica Anti-IDOR del facultativo tratante, baja logica (RN11) y auditoria inmutable.
 * ACTOR: Medico / Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE canonica: 1 Boundary y 1 Controller)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO REAL:
 * - Boundary: :RecetaPrescripcionModal (formulario de prescripcion y gestion)
 * - Controller: :RecetasController (orquestador REST, validacion y transacciones)
 * - Entities: :ConsultaMedica, :HistoriaClinica, :Receta, :RecetaDetalle, :Bitacora
 * - Convencion de funciones () o maximo 1 parametro.
 * - Sin cruces de mensajes entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmentos ALT y LOOP con comentario de rango de mensajes.
 * - Recuadros rectangulares con colores por defecto de Enterprise Architect.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU18 - Gestionar Expediente Clinico Digital";

function log(msg) {
    Session.Output("[CU18-Secuencia] " + msg);
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
    log("Iniciando generacion del Diagrama de Secuencia CU18 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. PARTICIPANTES (BCE: 1 Actor -> 1 Boundary -> 1 Controller -> 5 Entities)
    // =========================================================================
    var actMed = addActorParticipant(pkg, diagram, "Medico / Administrador", 30, 90);
    var bndRec = addParticipant(pkg, diagram, ":RecetaPrescripcionModal", "Interface", 190, 180);
    var ctrlRec = addParticipant(pkg, diagram, ":RecetasController", "Controller", 450, 170);
    var entCon = addEntityParticipant(pkg, diagram, ":ConsultaMedica", 700, 110);
    var entHis = addEntityParticipant(pkg, diagram, ":HistoriaClinica", 870, 110);
    var entRec = addEntityParticipant(pkg, diagram, ":Receta", 1040, 90);
    var entDet = addEntityParticipant(pkg, diagram, ":RecetaDetalle", 1190, 100);
    var entBit = addEntityParticipant(pkg, diagram, ":Bitacora", 1340, 90);

    diagram.Update();
    pkg.Diagrams.Refresh();

    // =========================================================================
    // 2. MENSAJES Y LLAMADAS
    // =========================================================================

    // FASE 1: Consulta de Recetas Previas de la Consulta Medica
    addMessage(actMed, bndRec, "1: abrirModuloRecetas(idConsulta)", false, 1);
    addMessage(bndRec, ctrlRec, "1.1: byConsulta(idConsulta)", false, 2);
    addMessage(ctrlRec, entCon, "1.2: find(idConsulta)", false, 3);
    addMessage(entCon, ctrlRec, "1.3: return consultaMedica", true, 4);
    addMessage(ctrlRec, entRec, "1.4: where('id_consulta', id)", false, 5);
    addMessage(entRec, ctrlRec, "1.5: return recetasConDetalles", true, 6);
    addMessage(ctrlRec, bndRec, "1.6: return 200 OK (recetas)", true, 7);
    addMessage(bndRec, actMed, "1.7: renderizarListadoRecetas()", true, 8);

    // FASE 2: Emision de Nueva Receta Medica Estructurada (RF08)
    addMessage(actMed, bndRec, "2: enviarPrescripcion(payload)", false, 9);
    addMessage(bndRec, ctrlRec, "2.1: store(payload)", false, 10);
    addMessage(ctrlRec, ctrlRec, "2.2: validate(RecetaCreateRequest)", false, 11);
    addMessage(ctrlRec, ctrlRec, "2.3: validarAccesoMedico()", false, 12);
    addMessage(ctrlRec, ctrlRec, "2.4: DB::transaction()", false, 13);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Prescripcion valida con farmacos]: Mensajes 2.5 a 2.11
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[al menos 1 medicamento especificado]", 420, 1450, -1000, -1500);

    addMessage(ctrlRec, entRec, "2.5: create(datosReceta)", false, 14);
    addMessage(entRec, ctrlRec, "2.6: return nuevaReceta", true, 15);

    // =========================================================================
    // FRAGMENTO LOOP [Iteracion: Por cada medicamento en detalles]: Mensajes 2.7 a 2.8
    // =========================================================================
    addCombinedFragment(pkg, diagram, "loop", "[por cada farmaco en detalles]", 430, 1310, -1170, -1330);
    addMessage(ctrlRec, entDet, "2.7: create(detalleFarmaco)", false, 16);
    addMessage(entDet, ctrlRec, "2.8: return detalleCreado", true, 17);

    addMessage(ctrlRec, entBit, "2.9: registrar(EMITIR_RECETA)", false, 18);
    addMessage(ctrlRec, bndRec, "2.10: return 201 Created (receta)", true, 19);
    addMessage(bndRec, actMed, "2.11: notificarEmisionExitosa()", true, 20);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Faltan farmacos o datos invalidos]: Mensajes 2.12 a 2.13
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[detalles vacios o sin medicamentos]", 420, 1450, -1520, -1680);
    addMessage(ctrlRec, bndRec, "2.12: return 422 Unprocessable (error)", true, 21);
    addMessage(bndRec, actMed, "2.13: mostrarErrorValidacion()", true, 22);

    // FASE 3: Anulacion Logica de Receta Medica (RN11)
    addMessage(actMed, bndRec, "3: solicitarAnulacion(idReceta, motivo)", false, 23);
    addMessage(bndRec, ctrlRec, "3.1: anular(id, motivo)", false, 24);
    addMessage(ctrlRec, ctrlRec, "3.2: validate(RecetaAnularRequest)", false, 25);
    addMessage(ctrlRec, entRec, "3.3: find(idReceta)", false, 26);
    addMessage(entRec, ctrlRec, "3.4: return receta", true, 27);
    addMessage(ctrlRec, entRec, "3.5: update('estado', 'ANULADO')", false, 28);
    addMessage(entRec, ctrlRec, "3.6: return recetaAnulada", true, 29);
    addMessage(ctrlRec, entBit, "3.7: registrar(ANULAR_RECETA)", false, 30);
    addMessage(ctrlRec, bndRec, "3.8: return 200 OK (anulada)", true, 31);
    addMessage(bndRec, actMed, "3.9: reflejarEstadoAnulado()", true, 32);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Secuencia CU18 generado exitosamente con 8 participantes (1 Boundary, 1 Controller).");
}

main();

/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU16 - Registrar Consulta Medica y Triaje Clinico (Ciclo 2 / P4)
 * DESCRIPCION: Registro del acto clinico (motivo, triaje, constantes vitales, calculo
 *              de IMC, diagnosticos CIE-10 y plan de tratamiento) con transicion
 *              atomica de la cita a estado ATENDIDA, registro en historial de cita,
 *              resiliencia de historia clinica y bitacora inmutable (CU03).
 * ACTOR: Medico (Actor Medico Unificado)
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE canonica: 1 Boundary y 1 Controller)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO:
 * - Boundary: :ConsultaRegistroModal (formulario clinico reactivo)
 * - Controller: :ConsultasController (orquestador REST del caso de uso)
 * - Entities: :Cita, :HistoriaClinica, :ConsultaMedica, :Diagnostico, :CitaEstadoHistorial, :Bitacora
 * - Metodos fieles con convencion () o maximo 1 parametro.
 * - Sin cruces de mensajes entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmento ALT para validaciones de cita y negocio [Cita Valida para Atencion / Ya Atendida o Invalida].
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU16 - Registrar Consulta Medica";

function log(msg) {
    Session.Output("[CU16-Secuencia] " + msg);
}

/**
 * Obtiene o crea el paquete de destino en el Project Browser.
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
 * Recrea el diagrama limpio de tipo Sequence.
 */
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

/**
 * Agrega el Actor con su icono estandar UML.
 */
function addActorParticipant(pkg, diagram, name, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Actor");
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2000;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega participante con encabezado RECTANGULAR (Boundary, Controller).
 */
function addParticipant(pkg, diagram, name, stereotype, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    if (stereotype && stereotype.length > 0) {
        el.Stereotype = stereotype;
    }
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1900;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega participantes Entidades en RECUADRO RECTANGULAR estandar.
 */
function addEntityParticipant(pkg, diagram, name, leftX, width) {
    var el = pkg.Elements.AddNew(name, "Sequence");
    el.Stereotype = "Entity" + String.fromCharCode(160);
    el.Update();

    var rightX = leftX + width;
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1900;", "");
    dObj.ElementID = el.ElementID;
    dObj.Style = "usecustomart=0;HideIcon=1;";
    dObj.Update();
    return el;
}

/**
 * Agrega mensaje de secuencia. isReturn = true crea la flecha discontinua de retorno.
 */
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

/**
 * Agrega fragmentos combinados (alt, opt, loop).
 */
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

/**
 * Funcion Principal
 */
function main() {
    Repository.EnsureOutputVisible("Script");
    log("Iniciando generacion del Diagrama de Secuencia CU16 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. PARTICIPANTES (BCE: 1 Actor -> 1 Boundary -> 1 Controller -> 6 Entities)
    // =========================================================================
    var actMed = addActorParticipant(pkg, diagram, "Medico", 40, 70);
    var bndReg = addParticipant(pkg, diagram, ":ConsultaRegistroModal", "Interface", 170, 160);
    var ctrlCon = addParticipant(pkg, diagram, ":ConsultasController", "Controller", 400, 150);
    var entCit = addEntityParticipant(pkg, diagram, ":Cita", 620, 100);
    var entHis = addEntityParticipant(pkg, diagram, ":HistoriaClinica", 770, 110);
    var entCon = addEntityParticipant(pkg, diagram, ":ConsultaMedica", 930, 120);
    var entDia = addEntityParticipant(pkg, diagram, ":Diagnostico", 1100, 100);
    var entEst = addEntityParticipant(pkg, diagram, ":CitaEstadoHistorial", 1250, 130);
    var entBit = addEntityParticipant(pkg, diagram, ":Bitacora", 1430, 90);

    diagram.Update();
    pkg.Diagrams.Refresh();

    // =========================================================================
    // 2. MENSAJES Y LLAMADAS
    // =========================================================================

    // FASE 1: Apertura y Preparacion de la Consulta
    addMessage(actMed, bndReg, "1: abrirConsulta(cita)", false, 1);
    addMessage(bndReg, ctrlCon, "1.1: GET /citas/{id}/preparar", false, 2);
    addMessage(ctrlCon, entCit, "1.2: with(paciente,antecedentes)", false, 3);
    addMessage(entCit, ctrlCon, "1.3: return datosPaciente", true, 4);
    addMessage(ctrlCon, bndReg, "1.4: 200 OK (datosFicha)", true, 5);
    addMessage(bndReg, actMed, "1.5: mostrarFormulario()", true, 6);

    // FASE 2: Captura Clinica y Calculo reactivo
    addMessage(actMed, bndReg, "2: ingresarSignosVitales()", false, 7);
    addMessage(bndReg, bndReg, "2.1: calcularIMC()", false, 8);
    addMessage(actMed, bndReg, "3: ingresarDiagnosticosYTratamiento()", false, 9);
    addMessage(actMed, bndReg, "4: clickGuardarConsulta()", false, 10);

    // FASE 3: Envio y Orquestacion Transaccional
    addMessage(bndReg, ctrlCon, "5: POST /consultas (payload)", false, 11);
    addMessage(ctrlCon, ctrlCon, "5.1: validate(ConsultaCreateRequest)", false, 12);
    addMessage(ctrlCon, ctrlCon, "5.2: DB::transaction()", false, 13);
    addMessage(ctrlCon, entCit, "5.3: lockForUpdate(idCita)", false, 14);
    addMessage(entCit, ctrlCon, "5.4: return citaBloqueada", true, 15);
    addMessage(ctrlCon, ctrlCon, "5.5: validarAccesoMedico(cita)", false, 16);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Cita valida y activa]: Abarca desde Mensaje 5.6 hasta 5.15
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[cita.estado en 'PROGRAMADA'|'CONFIRMADA' y pertenece al medico]", 370, 1530, -780, -1450);

    // Rama Exitosa (Mensajes 5.6 a 5.15):
    addMessage(ctrlCon, entHis, "5.6: firstOrCreate(id_paciente)", false, 17);
    addMessage(entHis, ctrlCon, "5.7: return historiaClinica", true, 18);

    addMessage(ctrlCon, entCon, "5.8: create(datosTriaje)", false, 19);
    addMessage(entCon, ctrlCon, "5.9: return consulta", true, 20);

    // FRAGMENTO LOOP [Iteracion: Diagnosticos CIE-10 del payload]: Abarca Mensaje 5.10
    addCombinedFragment(pkg, diagram, "loop", "[por cada diagnostico en payload]", 390, 1220, -1000, -1120);
    addMessage(ctrlCon, entDia, "5.10: create(diagnostico)", false, 21);

    addMessage(ctrlCon, entCit, "5.11: update(['estado' => 'ATENDIDA'])", false, 22);
    addMessage(ctrlCon, entEst, "5.12: create(historialEstado)", false, 23);
    addMessage(ctrlCon, entBit, "5.13: registrar(REGISTRAR_CONSULTA)", false, 24);

    addMessage(ctrlCon, bndReg, "5.14: 201 Created (consulta)", true, 25);
    addMessage(bndReg, actMed, "5.15: notificarExitoYConfirmar()", true, 26);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Cita ya ATENDIDA o no autorizada (Anti-IDOR)]: Abarca desde Mensaje 6 hasta 6.1
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[cita ya ATENDIDA o no autorizada (Anti-IDOR)]", 370, 1530, -1470, -1680);
    addMessage(ctrlCon, bndReg, "6: 422 Unprocessable / 403 Forbidden", true, 27);
    addMessage(bndReg, actMed, "6.1: mostrarAlertaError()", true, 28);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Secuencia CU16 generado exitosamente con 8 participantes (1 Boundary, 1 Controller).");
}

main();

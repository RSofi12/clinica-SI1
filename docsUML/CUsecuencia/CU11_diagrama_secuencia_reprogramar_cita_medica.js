/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU11 - Reprogramar Cita Medica (RF08 / Ciclo 2)
 * DESCRIPCION: Modificacion de fecha y hora para citas en estado PROGRAMADA o CONFIRMADA
 *              con validacion transaccional anti-colision (RF07), verificacion de 
 *              horarios/bloqueos del profesional y registro inmutable en bitacora (CU03).
 * ACTORES: Recepcionista / Paciente (y Administrador)
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO:
 * - 2 Boundaries: :AppointmentsManager (listado/accion) y :AppointmentRescheduleModal (dialogo reactivo)
 * - 2 Controllers: :AppointmentsController (HTTP/Anti-IDOR) y :AppointmentRescheduleService (transaccion/dominio)
 * - Funciones sin parametros () o maximo 1 parametro segun directriz de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmento ALT para decisiones [Horario Libre y Cita Reprogramable / Conflicto o Estado Invalido].
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU11 - Reprogramar Cita Medica";

function log(msg) {
    Session.Output("[CU11-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2400;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2300;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2300;", "");
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
    } catch (err) {
        log("Nota al crear fragmento (" + type + "): " + err.message);
        return null;
    }
}

/**
 * Re-fija los bounds del DiagramObject del actor para que su lifeline llegue hasta el final.
 */
function stretchActorLifeline(diagram, actorEl) {
    for (var i = 0; i < diagram.DiagramObjects.Count; i++) {
        var dObj = diagram.DiagramObjects.GetAt(i);
        if (dObj.ElementID == actorEl.ElementID) {
            dObj.Top = -20;
            dObj.Bottom = -2400;
            dObj.Update();
            return;
        }
    }
}

function main() {
    log("Iniciando generacion de CU11 fiel al codigo (2 Boundaries y 2 Controllers)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Actor -> :AppointmentsManager -> :AppointmentRescheduleModal
     *       -> :AppointmentsController -> :AppointmentRescheduleService
     *       -> :Cita, :Medico, :Disponibilidad, :BloqueoHorario, :CitaEstadoHistorial, :Bitacora
     * ------------------------------------------------------------------------- */
    var actorUsuario       = addActorParticipant(pkg, diagram, "Recepcionista / Paciente", 40, 110);
    var uiManager          = addParticipant(pkg, diagram, ":AppointmentsManager", "Interface", 180, 190);
    var uiModal            = addParticipant(pkg, diagram, ":AppointmentRescheduleModal", "Interface", 400, 210);
    var ctrlAppt           = addParticipant(pkg, diagram, ":AppointmentsController", "Controller", 640, 200);
    var ctrlService        = addParticipant(pkg, diagram, ":AppointmentRescheduleService", "Controller", 870, 220);

    var entCita            = addEntityParticipant(pkg, diagram, ":Cita", 1120, 130);
    var entMedico          = addEntityParticipant(pkg, diagram, ":Medico", 1280, 130);
    var entDisponib        = addEntityParticipant(pkg, diagram, ":Disponibilidad", 1440, 150);
    var entBloqueo         = addEntityParticipant(pkg, diagram, ":BloqueoHorario", 1620, 150);
    var entHistorial       = addEntityParticipant(pkg, diagram, ":CitaEstadoHistorial", 1800, 170);
    var entBitacora        = addEntityParticipant(pkg, diagram, ":Bitacora", 2000, 140);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO INICIAL: APERTURA Y CONSULTA DE DISPONIBILIDAD (CU09)
     * ------------------------------------------------------------------------- */
    addMessage(actorUsuario, uiManager,
        "1: seleccionarCita(id_cita)", false, step++);

    addMessage(uiManager, uiModal,
        "1.1: abrirModal(cita)", false, step++);

    addMessage(actorUsuario, uiModal,
        "1.2: seleccionarNuevaFecha(fecha)", false, step++);

    // Autollamada en Interface 2: validacion cliente de fecha (>= hoy)
    addMessage(uiModal, uiModal,
        "1.3: validarFechaFutura()", false, step++);

    addMessage(uiModal, ctrlAppt,
        "1.4: fetchAvailability(query)", false, step++);

    addMessage(ctrlAppt, entMedico,
        "1.5: findOrFail(id_medico)", false, step++);

    addMessage(entMedico, ctrlAppt,
        "1.6: return()", true, step++);

    addMessage(ctrlAppt, entDisponib,
        "1.7: where(dia_semana)", false, step++);

    addMessage(entDisponib, ctrlAppt,
        "1.8: return()", true, step++);

    addMessage(ctrlAppt, entBloqueo,
        "1.9: where(fecha)", false, step++);

    addMessage(entBloqueo, ctrlAppt,
        "1.10: return()", true, step++);

    addMessage(ctrlAppt, entCita,
        "1.11: where(fecha)", false, step++);

    addMessage(entCita, ctrlAppt,
        "1.12: return()", true, step++);

    addMessage(ctrlAppt, uiModal,
        "1.13: return(slots)", true, step++);

    addMessage(uiModal, actorUsuario,
        "1.14: renderSlotsDisponibles()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO PRINCIPAL: CONFIRMAR REPROGRAMACION TRANSACCIONAL
     * ------------------------------------------------------------------------- */
    addMessage(actorUsuario, uiModal,
        "2: confirmarReprogramacion(datos)", false, step++);

    // Autollamada en Interface 2: validacion de motivo obligatorio (>= 5 caracteres)
    addMessage(uiModal, uiModal,
        "2.1: validarFormulario()", false, step++);

    addMessage(uiModal, ctrlAppt,
        "2.2: reschedule(request)", false, step++);

    // Validacion HTTP en Controller 1 (FormRequest, regla PUDS y Scoping Anti-IDOR)
    addMessage(ctrlAppt, ctrlAppt,
        "2.3: validate(rules)", false, step++);

    addMessage(ctrlAppt, ctrlAppt,
        "2.4: verificarReglaPudsMedico()", false, step++);

    addMessage(ctrlAppt, ctrlAppt,
        "2.5: verificarScopingAntiIdor()", false, step++);

    // Delegacion de la ejecucion al servicio de dominio transaccional
    addMessage(ctrlAppt, ctrlService,
        "2.6: reprogramar(id_cita)", false, step++);

    // Inicio de transaccion de base de datos en Controller 2
    addMessage(ctrlService, ctrlService,
        "2.7: transaction()", false, step++);

    // Bloqueo pesimista de fila en Cita
    addMessage(ctrlService, entCita,
        "2.8: lockForUpdate(id_cita)", false, step++);

    addMessage(entCita, ctrlService,
        "2.9: return(cita)", true, step++);

    // Validacion de estado reprogramable (PROGRAMADA o CONFIRMADA)
    addMessage(ctrlService, entCita,
        "2.10: puedeReprogramarse()", false, step++);

    addMessage(entCita, ctrlService,
        "2.11: return(puede_reprogramar)", true, step++);

    // Validacion de vigencia activa del medico (RN04)
    addMessage(ctrlService, entMedico,
        "2.12: estaActivo()", false, step++);

    addMessage(entMedico, ctrlService,
        "2.13: return(activo)", true, step++);

    // Validacion de jornada semanal configurada (RN05)
    addMessage(ctrlService, entDisponib,
        "2.14: verificarHorario(dia)", false, step++);

    addMessage(entDisponib, ctrlService,
        "2.15: return(disponible)", true, step++);

    // Validacion de ausencia de feriados o bloqueos
    addMessage(ctrlService, entBloqueo,
        "2.16: verificarBloqueo(fecha)", false, step++);

    addMessage(entBloqueo, ctrlService,
        "2.17: return(sin_bloqueo)", true, step++);

    // Validacion anti-colision excluyendo la propia cita (RF07)
    addMessage(ctrlService, entCita,
        "2.18: verificarAntiColision(slot)", false, step++);

    addMessage(entCita, ctrlService,
        "2.19: return(sin_colision)", true, step++);

    /* =========================================================================
     * FRAGMENTO ALT: Decision de Reprogramacion Transaccional
     * ========================================================================= */

    // FRAGMENTO ALT [Horario Libre y Cita Reprogramable]: Abarca desde Mensaje 2.20 hasta 2.29
    addCombinedFragment(pkg, diagram, "alt", "[Horario Libre y Cita Reprogramable]", 620, 2160, -1140, -1650);

    addMessage(ctrlService, entCita,
        "2.20: reprogramar(nuevo_horario)", false, step++);

    addMessage(entCita, ctrlService,
        "2.21: return(cita_actualizada)", true, step++);

    addMessage(ctrlService, entHistorial,
        "2.22: registrarCambio(motivo)", false, step++);

    addMessage(entHistorial, ctrlService,
        "2.23: return()", true, step++);

    addMessage(ctrlService, entBitacora,
        "2.24: registrarAccion(evento)", false, step++);

    addMessage(entBitacora, ctrlService,
        "2.25: return()", true, step++);

    addMessage(ctrlService, ctrlAppt,
        "2.26: return(cita_actualizada)", true, step++);

    addMessage(ctrlAppt, uiModal,
        "2.27: return(response_200)", true, step++);

    addMessage(uiModal, uiManager,
        "2.28: onAppointmentRescheduled()", false, step++);

    addMessage(uiManager, actorUsuario,
        "2.29: notificarExito()", true, step++);

    // FRAGMENTO ALT [Conflicto Horario o Estado Invalido]: Abarca desde Mensaje 2.30 hasta 2.33
    addCombinedFragment(pkg, diagram, "alt", "[Conflicto Horario o Estado Invalido]", 620, 2160, -1670, -2020);

    // Autollamada en Service: rollback de transaccion
    addMessage(ctrlService, ctrlService,
        "2.30: rollBack()", false, step++);

    addMessage(ctrlService, ctrlAppt,
        "2.31: throwException()", true, step++);

    addMessage(ctrlAppt, uiModal,
        "2.32: return(error_409_o_422)", true, step++);

    addMessage(uiModal, actorUsuario,
        "2.33: renderError()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorUsuario);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Secuencia CU11 actualizado con 2 Boundaries y 2 Controllers con exito!", 0);
}

main();

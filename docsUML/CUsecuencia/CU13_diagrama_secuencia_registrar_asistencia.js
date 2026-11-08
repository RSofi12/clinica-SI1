/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU13 - Registrar Asistencia y Cambio de Estado de Cita Medica (RF10 / Ciclo 2)
 * DESCRIPCION: Maquina formal de estados y control de ciclo de vida de citas (PROGRAMADA -> 
 *              CONFIRMADA / EN SALA -> ATENDIDA / INASISTENCIA) con bloqueo pesimista 
 *              (lockForUpdate), verificacion RBAC por rol, registro cronologico de trazabilidad 
 *              en CitaEstadoHistorial y auditoria inmutable en Bitacora (CU03).
 * ACTORES: Recepcionista / Medico (y Administrador)
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO:
 * - 2 Boundaries: :AppointmentsManager (o :DoctorAgendaView) y :AppointmentStatusModal (dialogo interactivo)
 * - 2 Controllers: :AppointmentsController (HTTP/Anti-IDOR) y :AppointmentStatusService (transaccion/dominio)
 * - 4 Entities: :Cita, :Medico, :CitaEstadoHistorial, :Bitacora
 * - Funciones sin parametros () o maximo 1 parametro segun directriz de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmento ALT para decisiones [Transicion Valida / Transicion Ilegal o Conflicto RBAC].
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU13 - Registrar Asistencia y Cambio de Estado";

function log(msg) {
    Session.Output("[CU13-Secuencia] " + msg);
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
    log("Iniciando generacion de CU13 fiel al codigo (2 Boundaries y 2 Controllers)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Actor -> :AppointmentsManager -> :AppointmentStatusModal
     *       -> :AppointmentsController -> :AppointmentStatusService
     *       -> :Cita, :Medico, :CitaEstadoHistorial, :Bitacora
     * ------------------------------------------------------------------------- */
    var actorUsuario = addActorParticipant(pkg, diagram, "Recepcionista / Medico", 30, 80);
    var uiManager    = addParticipant(pkg, diagram, ":AppointmentsManager", "boundary", 170, 140);
    var uiModal      = addParticipant(pkg, diagram, ":AppointmentStatusModal", "boundary", 350, 140);
    var ctrlAppt     = addParticipant(pkg, diagram, ":AppointmentsController", "control", 530, 140);
    var ctrlService  = addParticipant(pkg, diagram, ":AppointmentStatusService", "control", 710, 150);

    var entCita      = addEntityParticipant(pkg, diagram, ":Cita", 900, 100);
    var entMedico    = addEntityParticipant(pkg, diagram, ":Medico", 1040, 100);
    var entHistorial = addEntityParticipant(pkg, diagram, ":CitaEstadoHistorial", 1180, 120);
    var entBitacora  = addEntityParticipant(pkg, diagram, ":Bitacora", 1340, 100);

    var step = 1;

    /* =========================================================================
     * FASE 1: APERTURA DEL DIALOGO DE ESTADO / ASISTENCIA
     * ========================================================================= */
    addMessage(actorUsuario, uiManager,
        "1: seleccionarCita(id_cita)", false, step++);

    addMessage(uiManager, uiModal,
        "1.1: abrirModal(cita)", false, step++);

    addMessage(uiModal, actorUsuario,
        "1.2: mostrarOpcionesTransicion()", true, step++);

    /* =========================================================================
     * FASE 2: SOLICITUD DE CAMBIO DE ESTADO Y VALIDACION DE DOMINIO
     * ========================================================================= */
    addMessage(actorUsuario, uiModal,
        "2: confirmarCambioEstado(datos)", false, step++);

    addMessage(uiModal, ctrlAppt,
        "2.1: updateStatus(id_cita)", false, step++);

    // Delegacion de la transaccion de estado al Service
    addMessage(ctrlAppt, ctrlService,
        "2.2: cambiarEstado(id_cita)", false, step++);

    // 1. Bloqueo pesimista sobre la cita
    addMessage(ctrlService, entCita,
        "2.3: lockForUpdate(id_cita)", false, step++);

    addMessage(entCita, ctrlService,
        "2.4: return(cita)", true, step++);

    // 2. Control RBAC (si es Medico, verificar que sea el profesional asignado)
    addMessage(ctrlService, entMedico,
        "2.5: verificarMedicoTitular(id_medico)", false, step++);

    addMessage(entMedico, ctrlService,
        "2.6: return(es_titular)", true, step++);

    // 3. Validacion de estado terminal (RN10)
    addMessage(ctrlService, entCita,
        "2.7: esEstadoTerminal()", false, step++);

    addMessage(entCita, ctrlService,
        "2.8: return(es_terminal)", true, step++);

    // 4. Validacion de maquina de estados permitidos (RF10 / RN10)
    addMessage(ctrlService, entCita,
        "2.9: puedeTransicionarA(nuevo_estado)", false, step++);

    addMessage(entCita, ctrlService,
        "2.10: return(puede_transicionar)", true, step++);

    // 5. Validacion de coherencia temporal (fecha pasada/futura)
    addMessage(ctrlService, entCita,
        "2.11: validarCoherenciaTemporal()", false, step++);

    addMessage(entCita, ctrlService,
        "2.12: return(es_coherente)", true, step++);

    /* =========================================================================
     * FRAGMENTO ALT: Transicion Formal vs Transicion Ilegal
     * ========================================================================= */

    // FRAGMENTO ALT [Transicion Valida segun Maquina de Estados]: Abarca desde Mensaje 2.13 hasta 2.22
    addCombinedFragment(pkg, diagram, "alt", "[Transicion Valida segun Maquina de Estados]", 620, 1460, -960, -1450);

    // 6. Aplicar la transicion
    addMessage(ctrlService, entCita,
        "2.13: cambiarEstado(nuevo_estado)", false, step++);

    addMessage(entCita, ctrlService,
        "2.14: return(cita_actualizada)", true, step++);

    // 7. Registro de trazabilidad en historial
    addMessage(ctrlService, entHistorial,
        "2.15: registrarCambio(motivo)", false, step++);

    addMessage(entHistorial, ctrlService,
        "2.16: return()", true, step++);

    // 8. Registro en bitacora inmutable (CU03)
    addMessage(ctrlService, entBitacora,
        "2.17: registrarAccion(evento)", false, step++);

    addMessage(entBitacora, ctrlService,
        "2.18: return()", true, step++);

    // Respuestas de exito en cadena
    addMessage(ctrlService, ctrlAppt,
        "2.19: return(cita_actualizada)", true, step++);

    addMessage(ctrlAppt, uiModal,
        "2.20: return(response_200)", true, step++);

    addMessage(uiModal, uiManager,
        "2.21: onStatusUpdated()", false, step++);

    addMessage(uiManager, actorUsuario,
        "2.22: notificarExito()", true, step++);

    // FRAGMENTO ALT [Transicion Ilegal o Conflicto RBAC]: Abarca desde Mensaje 2.23 hasta 2.26
    addCombinedFragment(pkg, diagram, "alt", "[Transicion Ilegal o Conflicto RBAC]", 620, 1460, -1470, -1800);

    // Autollamada en Service: rollback de transaccion
    addMessage(ctrlService, ctrlService,
        "2.23: rollBack()", false, step++);

    addMessage(ctrlService, ctrlAppt,
        "2.24: throwException()", true, step++);

    addMessage(ctrlAppt, uiModal,
        "2.25: return(error_422_o_403)", true, step++);

    addMessage(uiModal, actorUsuario,
        "2.26: renderError()", true, step++);

    /* =========================================================================
     * FASE 3: CONSULTA DEL TIMELINE / HISTORIAL DE ESTADOS (PESTANA HISTORIAL)
     * ========================================================================= */
    addMessage(actorUsuario, uiModal,
        "3: verPestanaHistorial()", false, step++);

    addMessage(uiModal, ctrlAppt,
        "3.1: statusHistory(id_cita)", false, step++);

    addMessage(ctrlAppt, entHistorial,
        "3.2: getHistorialCita(id_cita)", false, step++);

    addMessage(entHistorial, ctrlAppt,
        "3.3: return(historial_lista)", true, step++);

    addMessage(ctrlAppt, uiModal,
        "3.4: return(response_historial)", true, step++);

    addMessage(uiModal, actorUsuario,
        "3.5: renderTimelineEstados()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorUsuario);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Secuencia CU13 generado con 2 Boundaries y 2 Controllers con exito!", 0);
}

main();
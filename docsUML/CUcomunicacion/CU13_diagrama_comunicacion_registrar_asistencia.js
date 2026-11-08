/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU13 - Registrar Asistencia y Cambio de Estado de Cita Medica (RF10 / Ciclo 2)
 * DESCRIPCION: Maquina formal de estados y control de ciclo de vida de citas (PROGRAMADA -> 
 *              CONFIRMADA / EN SALA -> ATENDIDA / INASISTENCIA) con bloqueo pesimista 
 *              (lockForUpdate), verificacion RBAC por rol, registro cronologico de trazabilidad 
 *              en CitaEstadoHistorial y auditoria inmutable en Bitacora (CU03).
 * ACTORES: Recepcionista / Medico (y Administrador)
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (UML 2.5+, arquitectura BCE enriquecida)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO:
 * - 2 Boundaries: :AppointmentsManager (listado/accion) y :AppointmentStatusModal (dialogo interactivo)
 * - 2 Controllers: :AppointmentsController (HTTP/Anti-IDOR) y :AppointmentStatusService (transaccion/dominio)
 * - Separacion obligatoria en 2 conectores entre componentes bidireccionales:
 *   1. Conector de llamadas: Direction = "Source -> Destination"
 *   2. Conector de retornos: Direction = "Source -> Destination", Stereotype = "return"
 * - Entidades reciben unicamente llamadas unidireccionales desde los controladores.
 * - Funciones() reales sin parametros o con maximo 1 parametro segun directriz de catedra.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU13 - Registrar Asistencia y Cambio de Estado (Comunicacion)";

function log(msg) {
    Session.Output("[CU13-Comunicacion] " + msg);
}

/**
 * Obtiene el paquete de destino en el Project Browser.
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
 * Recrea el diagrama limpio de tipo Collaboration / Communication con ShowRobustness=1.
 */
function crearDiagramaLimpio(pkg, name) {
    for (var i = pkg.Diagrams.Count - 1; i >= 0; i--) {
        var d = pkg.Diagrams.GetAt(i);
        if (d.Name == name) {
            try {
                pkg.Diagrams.Delete(i);
                pkg.Diagrams.Refresh();
                log("Diagrama previo eliminado para regeneracion limpia.");
            } catch (e) {
                log("Aviso al eliminar diagrama previo: " + e.message);
            }
            break;
        }
    }

    var diagram = pkg.Diagrams.AddNew(name, "Collaboration");
    try {
        diagram.StyleEx = "ShowRobustness=1;";
    } catch (e) { }
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Crea u obtiene un elemento con su tipo y estereotipo.
 */
function crearElementoConEsterotipo(pkg, name, tipo, estereotipo) {
    for (var i = 0; i < pkg.Elements.Count; i++) {
        var el = pkg.Elements.GetAt(i);
        if (el.Name == name && el.Type == tipo) {
            if (estereotipo && el.Stereotype != estereotipo) {
                el.Stereotype = estereotipo;
                el.Update();
            }
            return el;
        }
    }

    var newEl = pkg.Elements.AddNew(name, tipo);
    if (estereotipo && estereotipo.length > 0) {
        newEl.Stereotype = estereotipo;
    }
    newEl.Update();
    pkg.Elements.Refresh();
    return newEl;
}

/**
 * Elimina conectores antiguos para evitar relaciones residuales.
 */
function limpiarConectores(el) {
    for (var i = el.Connectors.Count - 1; i >= 0; i--) {
        try {
            el.Connectors.Delete(i);
        } catch (e) { }
    }
    el.Connectors.Refresh();
}

/**
 * Posiciona el elemento en el diagrama con coordenadas compactas.
 */
function colocarElemento(diagram, elemento, left, right, top, bottom) {
    var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + right + ";t=" + top + ";b=" + bottom + ";", "");
    dObj.ElementID = elemento.ElementID;
    dObj.Update();
    return dObj;
}

/**
 * Crea una relacion unidireccional entre dos elementos con flecha explicita Source -> Destination
 * y su lista de mensajes.
 */
function crearConectorComunicacion(origen, destino, listaMensajes, esRetorno) {
    if (!listaMensajes || listaMensajes.length === 0) return null;
    var textoCompleto = listaMensajes.join("\r\n");

    var con = origen.Connectors.AddNew(textoCompleto, "Communication");
    con.SupplierID = destino.ElementID;
    con.Direction = "Source -> Destination";
    con.Name = textoCompleto;
    if (esRetorno) {
        con.Stereotype = "return";
    }
    con.Update();
    return con;
}

/**
 * Crea dos conectores separados entre dos elementos:
 * 1. Conector de Llamadas: Origen -> Destino (Direction = "Source -> Destination")
 * 2. Conector de Retorno: Destino -> Origen (Direction = "Source -> Destination", Stereotype = "return")
 */
function crearRelacionesBicomunicacion(origen, destino, mensajesLlamada, mensajesRetorno) {
    if (mensajesLlamada && mensajesLlamada.length > 0) {
        crearConectorComunicacion(origen, destino, mensajesLlamada, false);
    }
    if (mensajesRetorno && mensajesRetorno.length > 0) {
        crearConectorComunicacion(destino, origen, mensajesRetorno, true);
    }
}

function main() {
    log("Iniciando generacion de Diagrama de Comunicacion fiel al codigo para CU13...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = crearDiagramaLimpio(pkg, DIAGRAM_NAME);

    /* -------------------------------------------------------------
     * 1. Elementos BCE (Actor, 2 Boundaries, 2 Controls, 4 Entities)
     * ------------------------------------------------------------- */
    var actorUsuario     = crearElementoConEsterotipo(pkg, "Recepcionista / Medico", "Actor", "");
    var uiManager        = crearElementoConEsterotipo(pkg, ":AppointmentsManager", "Object", "boundary");
    var uiModal          = crearElementoConEsterotipo(pkg, ":AppointmentStatusModal", "Object", "boundary");
    var ctrlAppt         = crearElementoConEsterotipo(pkg, ":AppointmentsController", "Object", "control");
    var ctrlService      = crearElementoConEsterotipo(pkg, ":AppointmentStatusService", "Object", "control");

    var entCita          = crearElementoConEsterotipo(pkg, ":Cita", "Object", "entity");
    var entMedico        = crearElementoConEsterotipo(pkg, ":Medico", "Object", "entity");
    var entHistorial     = crearElementoConEsterotipo(pkg, ":CitaEstadoHistorial", "Object", "entity");
    var entBitacora      = crearElementoConEsterotipo(pkg, ":Bitacora", "Object", "entity");

    // Limpiar conectores previos
    limpiarConectores(actorUsuario);
    limpiarConectores(uiManager);
    limpiarConectores(uiModal);
    limpiarConectores(ctrlAppt);
    limpiarConectores(ctrlService);
    limpiarConectores(entCita);
    limpiarConectores(entMedico);
    limpiarConectores(entHistorial);
    limpiarConectores(entBitacora);

    /* -------------------------------------------------------------
     * 2. Posicionamiento en abanico limpio:
     *    Actor -> Boundary 1 -> Boundary 2 -> Control 1 -> Control 2;
     *    Entidades ordenadas verticalmente a la derecha sin cruces.
     * ------------------------------------------------------------- */
    colocarElemento(diagram, actorUsuario, "30",   "100",  "-90",  "-170");
    colocarElemento(diagram, uiManager,    "180",  "270",  "-90",  "-170");
    colocarElemento(diagram, uiModal,      "350",  "450",  "-90",  "-170");
    colocarElemento(diagram, ctrlAppt,     "530",  "630",  "-90",  "-170");
    colocarElemento(diagram, ctrlService,  "710",  "820",  "-90",  "-170");

    colocarElemento(diagram, entCita,      "990",  "1080", "100",  "20");
    colocarElemento(diagram, entMedico,    "990",  "1080", "-20",  "-100");
    colocarElemento(diagram, entHistorial, "990",  "1080", "-140", "-220");
    colocarElemento(diagram, entBitacora,  "990",  "1080", "-260", "-340");

    /* -------------------------------------------------------------
     * 3. Relaciones con conectores separados (Llamadas vs Retornos)
     * ------------------------------------------------------------- */

    // Relacion 1: Actor <---> Boundary 1 (:AppointmentsManager)
    var llamadasActorManager = [
        "1: seleccionarCita(id_cita)"
    ];
    var retornosActorManager = [
        "2.22: notificarExito()"
    ];
    crearRelacionesBicomunicacion(actorUsuario, uiManager, llamadasActorManager, retornosActorManager);

    // Relacion 2: Boundary 1 (:AppointmentsManager) <---> Boundary 2 (:AppointmentStatusModal)
    var llamadasManagerModal = [
        "1.1: abrirModal(cita)"
    ];
    var retornosManagerModal = [
        "2.21: onStatusUpdated()"
    ];
    crearRelacionesBicomunicacion(uiManager, uiModal, llamadasManagerModal, retornosManagerModal);

    // Relacion 2b: Actor <---> Boundary 2 (Interaccion en Modal y Pestaña Historial)
    var llamadasActorModal = [
        "2: confirmarCambioEstado(datos)",
        "3: verPestanaHistorial()"
    ];
    var retornosActorModal = [
        "1.2: mostrarOpcionesTransicion()",
        "3.5: renderTimelineEstados()"
    ];
    crearRelacionesBicomunicacion(actorUsuario, uiModal, llamadasActorModal, retornosActorModal);

    // Relacion 3: Boundary 2 (:AppointmentStatusModal) <---> Control 1 (:AppointmentsController)
    var llamadasModalController = [
        "2.1: updateStatus(id_cita)",
        "3.1: statusHistory(id_cita)"
    ];
    var retornosModalController = [
        "2.20: return(response_200)",
        "3.4: return(response_historial)"
    ];
    crearRelacionesBicomunicacion(uiModal, ctrlAppt, llamadasModalController, retornosModalController);

    // Relacion 4: Control 1 (:AppointmentsController) <---> Control 2 (:AppointmentStatusService)
    var llamadasControllerService = [
        "2.2: cambiarEstado(id_cita)"
    ];
    var retornosControllerService = [
        "2.19: return(cita_actualizada)"
    ];
    crearRelacionesBicomunicacion(ctrlAppt, ctrlService, llamadasControllerService, retornosControllerService);

    // Relacion 5: Control 2 (:AppointmentStatusService) <---> Entity :Cita
    var mensajesServiceCita = [
        "2.3: lockForUpdate(id_cita)",
        "2.7: esEstadoTerminal()",
        "2.9: puedeTransicionarA(nuevo_estado)",
        "2.11: validarCoherenciaTemporal()",
        "2.13: cambiarEstado(nuevo_estado)"
    ];
    crearConectorComunicacion(ctrlService, entCita, mensajesServiceCita, false);

    // Relacion 6: Control 2 (:AppointmentStatusService) <---> Entity :Medico
    var mensajesServiceMedico = [
        "2.5: verificarMedicoTitular(id_medico)"
    ];
    crearConectorComunicacion(ctrlService, entMedico, mensajesServiceMedico, false);

    // Relacion 7: Control 2 (:AppointmentStatusService) <---> Entity :CitaEstadoHistorial
    var mensajesServiceHistorial = [
        "2.15: registrarCambio(motivo)"
    ];
    crearConectorComunicacion(ctrlService, entHistorial, mensajesServiceHistorial, false);

    // Relacion 7b: Control 1 (:AppointmentsController) <---> Entity :CitaEstadoHistorial (Consulta timeline)
    var mensajesControllerHistorial = [
        "3.2: getHistorialCita(id_cita)"
    ];
    crearConectorComunicacion(ctrlAppt, entHistorial, mensajesControllerHistorial, false);

    // Relacion 8: Control 2 (:AppointmentStatusService) <---> Entity :Bitacora
    var mensajesServiceBitacora = [
        "2.17: registrarAccion(evento)"
    ];
    crearConectorComunicacion(ctrlService, entBitacora, mensajesServiceBitacora, false);

    /* -------------------------------------------------------------
     * 4. Guardar, refrescar y abrir el diagrama
     * ------------------------------------------------------------- */
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama de Comunicacion CU13 generado con 2 Boundaries y 2 Controllers con exito!", 0);
}

main();
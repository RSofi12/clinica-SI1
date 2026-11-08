/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU11 - Reprogramar Cita Medica (RF08 / Ciclo 2)
 * DESCRIPCION: Modificacion de fecha y hora para citas en estado PROGRAMADA o CONFIRMADA
 *              con validacion transaccional anti-colision (RF07), verificacion de 
 *              horarios/bloqueos y registro de auditoria inmutable en bitacora (CU03).
 * ACTORES: Recepcionista / Paciente (y Administrador)
 * TIPO DE DIAGRAMA: Diagrama de Comunicacion (UML 2.5+, arquitectura BCE enriquecida)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO:
 * - 2 Boundaries: :AppointmentsManager (listado/accion) y :AppointmentRescheduleModal (dialogo interactivo)
 * - 2 Controllers: :AppointmentsController (HTTP/Anti-IDOR) y :AppointmentRescheduleService (transaccion/dominio)
 * - Una UNICA linea de relacion (Association) por cada par de componentes,
 *   sin flechas (Direction = "Unspecified"), formato canonico del proyecto.
 * - Mensajes apilados (\r\n) con numeracion jerarquica y funciones() reales
 *   sin parametros o con maximo 1 parametro segun directriz de catedra.
 * - Distribucion en abanico limpio para las entidades sin cruces de lineas.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU11 - Reprogramar Cita Medica (Comunicacion)";

function log(msg) {
    Session.Output("[CU11-Comunicacion] " + msg);
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
    log("Iniciando generacion de Diagrama de Comunicacion fiel al codigo para CU11...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = crearDiagramaLimpio(pkg, DIAGRAM_NAME);

    /* -------------------------------------------------------------
     * 1. Elementos BCE (Actor, 2 Boundaries, 2 Controls, Entities)
     * ------------------------------------------------------------- */
    var actorUsuario     = crearElementoConEsterotipo(pkg, "Recepcionista / Paciente", "Actor", "");
    var uiManager        = crearElementoConEsterotipo(pkg, ":AppointmentsManager", "Object", "boundary");
    var uiModal          = crearElementoConEsterotipo(pkg, ":AppointmentRescheduleModal", "Object", "boundary");
    var ctrlAppt         = crearElementoConEsterotipo(pkg, ":AppointmentsController", "Object", "control");
    var ctrlService      = crearElementoConEsterotipo(pkg, ":AppointmentRescheduleService", "Object", "control");

    var entCita          = crearElementoConEsterotipo(pkg, ":Cita", "Object", "entity");
    var entMedico        = crearElementoConEsterotipo(pkg, ":Medico", "Object", "entity");
    var entDisponib      = crearElementoConEsterotipo(pkg, ":Disponibilidad", "Object", "entity");
    var entBloqueo       = crearElementoConEsterotipo(pkg, ":BloqueoHorario", "Object", "entity");
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
    limpiarConectores(entDisponib);
    limpiarConectores(entBloqueo);
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

    colocarElemento(diagram, entCita,      "990",  "1080", "120",  "40");
    colocarElemento(diagram, entMedico,    "990",  "1080", "20",   "-60");
    colocarElemento(diagram, entDisponib,  "990",  "1080", "-80",  "-160");
    colocarElemento(diagram, entBloqueo,   "990",  "1080", "-180", "-260");
    colocarElemento(diagram, entHistorial, "990",  "1080", "-280", "-360");
    colocarElemento(diagram, entBitacora,  "990",  "1080", "-380", "-460");

    /* -------------------------------------------------------------
     * 3. Relaciones con conectores separados (Llamadas vs Retornos)
     * ------------------------------------------------------------- */

    // Relacion 1: Actor <---> Boundary 1 (:AppointmentsManager)
    var llamadasActorManager = [
        "1: seleccionarCita(id_cita)",
        "1.1: solicitarReprogramacion()"
    ];
    var retornosActorManager = [
        "1.21: notificarExito()"
    ];
    crearRelacionesBicomunicacion(actorUsuario, uiManager, llamadasActorManager, retornosActorManager);

    // Relacion 2: Boundary 1 (:AppointmentsManager) <---> Boundary 2 (:AppointmentRescheduleModal)
    var llamadasManagerModal = [
        "1.2: abrirModal(cita)",
        "1.3: seleccionarNuevaFecha(fecha)",
        "1.4: confirmarReprogramacion(datos)"
    ];
    var retornosManagerModal = [
        "1.20: cerrarModal()"
    ];
    crearRelacionesBicomunicacion(uiManager, uiModal, llamadasManagerModal, retornosManagerModal);

    // Relacion 3: Boundary 2 (:AppointmentRescheduleModal) <---> Control 1 (:AppointmentsController)
    var llamadasModalController = [
        "1.5: reschedule(request)"
    ];
    var retornosModalController = [
        "1.19: _to_response()"
    ];
    crearRelacionesBicomunicacion(uiModal, ctrlAppt, llamadasModalController, retornosModalController);

    // Relacion 4: Control 1 (:AppointmentsController) <---> Control 2 (:AppointmentRescheduleService)
    var llamadasControllerService = [
        "1.6: reprogramar(id_cita)"
    ];
    var retornosControllerService = [
        "1.18: return(cita_actualizada)"
    ];
    crearRelacionesBicomunicacion(ctrlAppt, ctrlService, llamadasControllerService, retornosControllerService);

    // Relacion 5: Control 2 (:AppointmentRescheduleService) <---> Entity :Cita
    var mensajesServiceCita = [
        "1.7: lockForUpdate(id_cita)",
        "1.8: puedeReprogramarse()",
        "1.12: verificarAntiColision(slot)",
        "1.13: reprogramar(nuevo_horario)"
    ];
    crearConectorComunicacion(ctrlService, entCita, mensajesServiceCita, false);

    // Relacion 6: Control 2 (:AppointmentRescheduleService) <---> Entity :Medico
    var mensajesServiceMedico = [
        "1.9: estaActivo()"
    ];
    crearConectorComunicacion(ctrlService, entMedico, mensajesServiceMedico, false);

    // Relacion 7: Control 2 (:AppointmentRescheduleService) <---> Entity :Disponibilidad
    var mensajesServiceDisponib = [
        "1.10: verificarHorario(dia)"
    ];
    crearConectorComunicacion(ctrlService, entDisponib, mensajesServiceDisponib, false);

    // Relacion 8: Control 2 (:AppointmentRescheduleService) <---> Entity :BloqueoHorario
    var mensajesServiceBloqueo = [
        "1.11: verificarBloqueo(fecha)"
    ];
    crearConectorComunicacion(ctrlService, entBloqueo, mensajesServiceBloqueo, false);

    // Relacion 9: Control 2 (:AppointmentRescheduleService) <---> Entity :CitaEstadoHistorial
    var mensajesServiceHistorial = [
        "1.14: registrarCambio(motivo)"
    ];
    crearConectorComunicacion(ctrlService, entHistorial, mensajesServiceHistorial, false);

    // Relacion 10: Control 2 (:AppointmentRescheduleService) <---> Entity :Bitacora
    var mensajesServiceBitacora = [
        "1.15: registrarAccion(evento)"
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
    Session.Prompt("¡Diagrama de Comunicacion CU11 actualizado con 2 Boundaries y 2 Controllers con exito!", 0);
}

main();

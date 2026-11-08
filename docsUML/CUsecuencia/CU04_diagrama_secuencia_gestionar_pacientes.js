/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU04 - Gestionar Pacientes (RF02 / Paquete 2: Recursos Clinicos)
 * DESCRIPCION: Administracion integral del padron de pacientes: estadisticas y KPIs 
 *              demograficos, listado paginado con filtros etarios (pediatrico, adulto, 
 *              geriatrico), alta con generacion automatica de numero de historia clinica 
 *              y contacto de emergencia, edicion y baja logica institucional (RN11).
 * ACTOR: Recepcionista / Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NORMAS Y PAUTAS APLICADAS:
 * - Funciones sin parametros () segun directriz UML de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Sin fragmentos alt/opt innecesarios: flujos directos y limpios.
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU04 - Gestionar Pacientes";

function log(msg) {
    Session.Output("[CU04-Secuencia] " + msg);
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
 * Recrea el diagrama limpio.
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-2200;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2100;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-2100;", "");
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
 * Re-fija los bounds del DiagramObject del actor para que su lifeline llegue hasta el final.
 */
function stretchActorLifeline(diagram, actorEl) {
    for (var i = 0; i < diagram.DiagramObjects.Count; i++) {
        var dObj = diagram.DiagramObjects.GetAt(i);
        if (dObj.ElementID == actorEl.ElementID) {
            dObj.Top = -20;
            dObj.Bottom = -2200;
            dObj.Update();
            return;
        }
    }
}

function main() {
    log("Iniciando generacion de CU04 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Recepcionista / Administrador -> :PatientsManager (Boundary) -> :PatientsController (Controller)
     * -> :Patient, :EmergencyContact, :Bitacora (Entities)
     * ------------------------------------------------------------------------- */
    var actorStaff        = addActorParticipant(pkg, diagram, "Recepcionista / Administrador", 40, 150);
    var uiPatients        = addParticipant(pkg, diagram, ":PatientsManager", "Interface", 240, 200);
    var ctrlPatients      = addParticipant(pkg, diagram, ":PatientsController", "Controller", 490, 210);

    var entPatient        = addEntityParticipant(pkg, diagram, ":Patient",          750, 140);
    var entEmergContact   = addEntityParticipant(pkg, diagram, ":EmergencyContact", 940, 160);
    var entBitacora       = addEntityParticipant(pkg, diagram, ":Bitacora",         1150, 140);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: LISTADO Y KPIS DEMOGRAFICOS (GET /api/patients/stats y GET /api/patients)
     * ------------------------------------------------------------------------- */
    addMessage(actorStaff, uiPatients,
        "1: solicitarListadoPacientes()", false, step++);

    addMessage(uiPatients, ctrlPatients,
        "1.1: stats()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "1.2: count()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "1.3: return()", true, step++);

    addMessage(ctrlPatients, uiPatients,
        "1.4: return()", true, step++);

    addMessage(uiPatients, ctrlPatients,
        "1.5: index()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "1.6: with()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "1.7: buscar()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "1.8: paginate()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "1.9: return()", true, step++);

    addMessage(ctrlPatients, uiPatients,
        "1.10: return()", true, step++);

    addMessage(uiPatients, actorStaff,
        "1.11: renderizarPacientes()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: REGISTRAR PACIENTE Y CONTACTO (POST /api/patients)
     * ------------------------------------------------------------------------- */
    addMessage(actorStaff, uiPatients,
        "2: registrarPaciente()", false, step++);

    // Autollamada en Interface: validacion cliente del formulario de alta
    addMessage(uiPatients, uiPatients,
        "2.1: validarFormulario()", false, step++);

    addMessage(uiPatients, ctrlPatients,
        "2.2: store()", false, step++);

    // Autollamada en Controller: validacion de reglas del PatientCreateRequest
    addMessage(ctrlPatients, ctrlPatients,
        "2.3: validate()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "2.4: generarNumeroHistoria()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "2.5: return()", true, step++);

    addMessage(ctrlPatients, entPatient,
        "2.6: create()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "2.7: return()", true, step++);

    /* Fragmento OPT: Registro condicional de contacto de emergencia */
    addCombinedFragment(pkg, diagram, "opt", "[Si incluye contacto de emergencia]", 470, 1100, -780, -870);

    addMessage(ctrlPatients, entEmergContact,
        "2.8: create()", false, step++);

    addMessage(entEmergContact, ctrlPatients,
        "2.9: return()", true, step++);

    addMessage(ctrlPatients, entBitacora,
        "2.10: registrar()", false, step++);

    addMessage(entBitacora, ctrlPatients,
        "2.11: return()", true, step++);

    addMessage(ctrlPatients, uiPatients,
        "2.12: return()", true, step++);

    addMessage(uiPatients, actorStaff,
        "2.13: notificarRegistroExitoso()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 3: MODIFICAR DATOS DEL PACIENTE (PUT /api/patients/{id})
     * ------------------------------------------------------------------------- */
    addMessage(actorStaff, uiPatients,
        "3: modificarPaciente()", false, step++);

    // Autollamada en Interface: validacion cliente de datos modificados
    addMessage(uiPatients, uiPatients,
        "3.1: validarFormulario()", false, step++);

    addMessage(uiPatients, ctrlPatients,
        "3.2: update()", false, step++);

    // Autollamada en Controller: validacion de servidor
    addMessage(ctrlPatients, ctrlPatients,
        "3.3: validate()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "3.4: find()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "3.5: return()", true, step++);

    addMessage(ctrlPatients, entPatient,
        "3.6: update()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "3.7: return()", true, step++);

    /* Fragmento OPT: Actualizacion condicional de contacto de emergencia */
    addCombinedFragment(pkg, diagram, "opt", "[Si actualiza contacto de emergencia]", 470, 1100, -1210, -1300);

    addMessage(ctrlPatients, entEmergContact,
        "3.8: update()", false, step++);

    addMessage(entEmergContact, ctrlPatients,
        "3.9: return()", true, step++);

    addMessage(ctrlPatients, entBitacora,
        "3.10: registrar()", false, step++);

    addMessage(entBitacora, ctrlPatients,
        "3.11: return()", true, step++);

    addMessage(ctrlPatients, uiPatients,
        "3.12: return()", true, step++);

    addMessage(uiPatients, actorStaff,
        "3.13: notificarActualizacionExitosa()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO 4: CONMUTAR ESTADO / BAJA LOGICA RN11 (PATCH /api/patients/{id}/toggle-status)
     * ------------------------------------------------------------------------- */
    addMessage(actorStaff, uiPatients,
        "4: cambiarEstadoPaciente()", false, step++);

    addMessage(uiPatients, ctrlPatients,
        "4.1: toggleStatus()", false, step++);

    addMessage(ctrlPatients, entPatient,
        "4.2: find()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "4.3: return()", true, step++);

    addMessage(ctrlPatients, entPatient,
        "4.4: save()", false, step++);

    addMessage(entPatient, ctrlPatients,
        "4.5: return()", true, step++);

    addMessage(ctrlPatients, entBitacora,
        "4.6: registrar()", false, step++);

    addMessage(entBitacora, ctrlPatients,
        "4.7: return()", true, step++);

    addMessage(ctrlPatients, uiPatients,
        "4.8: return()", true, step++);

    addMessage(uiPatients, actorStaff,
        "4.9: notificarEstadoActualizado()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorStaff);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU04 generado con exito!", 0);
}

main();

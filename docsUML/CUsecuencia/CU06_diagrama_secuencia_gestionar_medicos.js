/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU06 - Gestionar Medicos (RF03 / Paquete 2: Recursos Clinicos)
 * DESCRIPCION: Administracion integral del cuerpo medico institucional bajo el modelo 
 *              de Actor Medico Unificado: consulta con filtros por especialidad y estado, 
 *              alta medica con creacion automatica de cuenta web y asociacion de 
 *              especialidades, modificacion de datos y baja logica (RN11).
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NORMAS Y PAUTAS APLICADAS:
 * - Funciones sin parametros () segun directriz UML de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Sin fragmentos alt/opt innecesarios: flujos directos del Administrador.
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU06 - Gestionar Medicos";

function log(msg) {
    Session.Output("[CU06-Secuencia] " + msg);
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
    log("Iniciando generacion de CU06 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Administrador -> :DoctorsManager (Boundary) -> :DoctorsController (Controller)
     * -> :Medico, :Especialidad, :User, :Role, :Bitacora (Entities)
     * ------------------------------------------------------------------------- */
    var actorAdmin      = addActorParticipant(pkg, diagram, "Administrador", 40, 100);
    var uiDoctors       = addParticipant(pkg, diagram, ":DoctorsManager", "Interface", 200, 200);
    var ctrlDoctors     = addParticipant(pkg, diagram, ":DoctorsController", "Controller", 450, 210);

    var entMedico       = addEntityParticipant(pkg, diagram, ":Medico",        720, 130);
    var entEspecialidad = addEntityParticipant(pkg, diagram, ":Especialidad", 890, 150);
    var entUser         = addEntityParticipant(pkg, diagram, ":User",         1080, 130);
    var entRole         = addEntityParticipant(pkg, diagram, ":Role",         1250, 130);
    var entBitacora     = addEntityParticipant(pkg, diagram, ":Bitacora",     1420, 140);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: LISTADO DE MEDICOS CON FILTROS (GET /api/doctors)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiDoctors,
        "1: solicitarListadoMedicos()", false, step++);

    addMessage(uiDoctors, ctrlDoctors,
        "1.1: index()", false, step++);

    addMessage(ctrlDoctors, entMedico,
        "1.2: with()", false, step++);

    addMessage(ctrlDoctors, entMedico,
        "1.3: buscar()", false, step++);

    addMessage(ctrlDoctors, entMedico,
        "1.4: paginate()", false, step++);

    addMessage(entMedico, ctrlDoctors,
        "1.5: return()", true, step++);

    addMessage(ctrlDoctors, uiDoctors,
        "1.6: return()", true, step++);

    addMessage(uiDoctors, actorAdmin,
        "1.7: renderizarMedicos()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: REGISTRAR NUEVO MEDICO (POST /api/doctors)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiDoctors,
        "2: registrarMedico()", false, step++);

    // Autollamada en Interface: validacion cliente del formulario
    addMessage(uiDoctors, uiDoctors,
        "2.1: validarFormulario()", false, step++);

    addMessage(uiDoctors, ctrlDoctors,
        "2.2: store()", false, step++);

    // Autollamada en Controller: validacion de reglas del DoctorCreateRequest
    addMessage(ctrlDoctors, ctrlDoctors,
        "2.3: validate()", false, step++);

    /* Fragmento OPT: Creacion condicional de cuenta web institucional */
    addCombinedFragment(pkg, diagram, "opt", "[Si solicita cuenta web]", 430, 1390, -780, -960);

    addMessage(ctrlDoctors, entRole,
        "2.4: firstOrCreate()", false, step++);

    addMessage(entRole, ctrlDoctors,
        "2.5: return()", true, step++);

    addMessage(ctrlDoctors, entUser,
        "2.6: create()", false, step++);

    addMessage(entUser, ctrlDoctors,
        "2.7: return()", true, step++);

    addMessage(ctrlDoctors, entUser,
        "2.8: syncWithoutDetaching()", false, step++);

    addMessage(entUser, ctrlDoctors,
        "2.9: return()", true, step++);

    addMessage(ctrlDoctors, entMedico,
        "2.10: create()", false, step++);

    addMessage(entMedico, ctrlDoctors,
        "2.11: return()", true, step++);

    /* Fragmento LOOP: Vinculacion y marcacion de especialidad principal */
    addCombinedFragment(pkg, diagram, "loop", "[Por cada especialidad asignada]", 430, 1050, -1040, -1130);

    addMessage(ctrlDoctors, entEspecialidad,
        "2.12: sync()", false, step++);

    addMessage(entEspecialidad, ctrlDoctors,
        "2.13: return()", true, step++);

    addMessage(ctrlDoctors, entBitacora,
        "2.14: registrar()", false, step++);

    addMessage(entBitacora, ctrlDoctors,
        "2.15: return()", true, step++);

    addMessage(ctrlDoctors, uiDoctors,
        "2.16: return()", true, step++);

    addMessage(uiDoctors, actorAdmin,
        "2.17: notificarRegistroExitoso()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 3: MODIFICAR DATOS DEL MEDICO (PUT /api/doctors/{id})
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiDoctors,
        "3: modificarMedico()", false, step++);

    // Autollamada en Interface: validacion cliente de matricula y datos
    addMessage(uiDoctors, uiDoctors,
        "3.1: validarFormulario()", false, step++);

    addMessage(uiDoctors, ctrlDoctors,
        "3.2: update()", false, step++);

    // Autollamada en Controller: validacion de servidor
    addMessage(ctrlDoctors, ctrlDoctors,
        "3.3: validate()", false, step++);

    addMessage(ctrlDoctors, entMedico,
        "3.4: find()", false, step++);

    addMessage(entMedico, ctrlDoctors,
        "3.5: return()", true, step++);

    addMessage(ctrlDoctors, entMedico,
        "3.6: update()", false, step++);

    addMessage(entMedico, ctrlDoctors,
        "3.7: return()", true, step++);

    /* Fragmento LOOP: Sincronizacion del catalogo de especialidades */
    addCombinedFragment(pkg, diagram, "loop", "[Por cada especialidad modificada]", 430, 1050, -1560, -1650);

    addMessage(ctrlDoctors, entEspecialidad,
        "3.8: sync()", false, step++);

    addMessage(entEspecialidad, ctrlDoctors,
        "3.9: return()", true, step++);

    addMessage(ctrlDoctors, entBitacora,
        "3.10: registrar()", false, step++);

    addMessage(entBitacora, ctrlDoctors,
        "3.11: return()", true, step++);

    addMessage(ctrlDoctors, uiDoctors,
        "3.12: return()", true, step++);

    addMessage(uiDoctors, actorAdmin,
        "3.13: notificarActualizacionExitosa()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO 4: CONMUTAR ESTADO / BAJA LOGICA RN11 (PATCH /api/doctors/{id}/toggle-status)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiDoctors,
        "4: cambiarEstadoMedico()", false, step++);

    addMessage(uiDoctors, ctrlDoctors,
        "4.1: toggleStatus()", false, step++);

    addMessage(ctrlDoctors, entMedico,
        "4.2: find()", false, step++);

    addMessage(entMedico, ctrlDoctors,
        "4.3: return()", true, step++);

    addMessage(ctrlDoctors, entMedico,
        "4.4: save()", false, step++);

    addMessage(entMedico, ctrlDoctors,
        "4.5: return()", true, step++);

    addMessage(ctrlDoctors, entBitacora,
        "4.6: registrar()", false, step++);

    addMessage(entBitacora, ctrlDoctors,
        "4.7: return()", true, step++);

    addMessage(ctrlDoctors, uiDoctors,
        "4.8: return()", true, step++);

    addMessage(uiDoctors, actorAdmin,
        "4.9: notificarEstadoActualizado()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorAdmin);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU06 generado con exito!", 0);
}

main();

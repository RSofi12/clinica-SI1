/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU07 - Gestionar Especialidades Medicas (RF04 / Paquete 2: Recursos Clinicos)
 * DESCRIPCION: Administracion del catalogo de especialidades medicas: listado y filtros 
 *              avanzados por rango etario (pediatria, geriatria, etc.), registro con 
 *              validaciones estrictas de reglas de negocio (slug normalizado, rango de edad, 
 *              precio de consulta), vinculacion con cuerpo medico y auditoria inmutable.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NORMAS Y PAUTAS APLICADAS:
 * - Funciones sin parametros () segun directriz UML formal.
 * - Autollamadas reflexivas (src === dst) para validaciones de formulario y reglas del controller.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU07 - Gestionar Especialidades Medicas";

function log(msg) {
    Session.Output("[CU07-Secuencia] " + msg);
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
 * Agrega mensaje de secuencia. 
 * isReturn = true crea la flecha discontinua de retorno.
 * Si src === dst crea la autollamada reflexiva sobre la misma linea de vida.
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
    log("Iniciando generacion de CU07 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Administrador -> :SpecialtiesManager (Boundary) -> :SpecialtiesController (Controller)
     * -> :Especialidad, :Medico, :Bitacora (Entities)
     * ------------------------------------------------------------------------- */
    var actorAdmin      = addActorParticipant(pkg, diagram, "Administrador", 40, 100);
    var uiSpecialties   = addParticipant(pkg, diagram, ":SpecialtiesManager", "Interface", 200, 200);
    var ctrlSpecialties = addParticipant(pkg, diagram, ":SpecialtiesController", "Controller", 460, 210);

    var entEspecialidad = addEntityParticipant(pkg, diagram, ":Especialidad", 740, 150);
    var entMedico       = addEntityParticipant(pkg, diagram, ":Medico",       940, 140);
    var entBitacora     = addEntityParticipant(pkg, diagram, ":Bitacora",     1130, 140);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: CARGA Y FILTRADO DEL CATALOGO (GET /api/specialties)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiSpecialties,
        "1: solicitarCatalogoEspecialidades()", false, step++);

    // Autollamada en Interface: preparacion y reseteo de filtros
    addMessage(uiSpecialties, uiSpecialties,
        "1.1: resetFiltros()", false, step++);

    addMessage(uiSpecialties, ctrlSpecialties,
        "1.2: index()", false, step++);

    addMessage(ctrlSpecialties, entEspecialidad,
        "1.3: query()", false, step++);

    addMessage(ctrlSpecialties, entEspecialidad,
        "1.4: activas()", false, step++);

    addMessage(ctrlSpecialties, entEspecialidad,
        "1.5: buscar()", false, step++);

    // Filtro especifico RF04 (edad minima y maxima)
    addMessage(ctrlSpecialties, entEspecialidad,
        "1.6: where()", false, step++);

    addMessage(ctrlSpecialties, entMedico,
        "1.7: withCount()", false, step++);

    addMessage(ctrlSpecialties, entEspecialidad,
        "1.8: get()", false, step++);

    addMessage(entEspecialidad, ctrlSpecialties,
        "1.9: return()", true, step++);

    addMessage(ctrlSpecialties, uiSpecialties,
        "1.10: return()", true, step++);

    addMessage(uiSpecialties, actorAdmin,
        "1.11: renderizarEspecialidades()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: REGISTRAR NUEVA ESPECIALIDAD CON VALIDACIONES (POST /api/specialties)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiSpecialties,
        "2: enviarRegistroEspecialidad()", false, step++);

    // Autollamada en Boundary: validacion inicial del formulario cliente
    addMessage(uiSpecialties, uiSpecialties,
        "2.1: validarFormulario()", false, step++);

    addMessage(uiSpecialties, ctrlSpecialties,
        "2.2: store()", false, step++);

    // Autollamadas en Controller: validacion de servidor, normalizacion y chequeo de rangos
    addMessage(ctrlSpecialties, ctrlSpecialties,
        "2.3: validate()", false, step++);

    addMessage(ctrlSpecialties, ctrlSpecialties,
        "2.4: slug()", false, step++);

    addMessage(ctrlSpecialties, ctrlSpecialties,
        "2.5: validarRangoEdad()", false, step++);

    // Verificacion de unicidad contra entidad
    addMessage(ctrlSpecialties, entEspecialidad,
        "2.6: where()", false, step++);

    addMessage(ctrlSpecialties, entEspecialidad,
        "2.7: exists()", false, step++);

    addMessage(entEspecialidad, ctrlSpecialties,
        "2.8: return()", true, step++);

    // Creacion persistente de la especialidad
    addMessage(ctrlSpecialties, entEspecialidad,
        "2.9: create()", false, step++);

    addMessage(entEspecialidad, ctrlSpecialties,
        "2.10: return()", true, step++);

    // Auditoria inmutable obligatoria (CU03)
    addMessage(ctrlSpecialties, entBitacora,
        "2.11: registrar()", false, step++);

    addMessage(entBitacora, ctrlSpecialties,
        "2.12: return()", true, step++);

    addMessage(ctrlSpecialties, uiSpecialties,
        "2.13: return()", true, step++);

    addMessage(uiSpecialties, actorAdmin,
        "2.14: notificarRegistroExitoso()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorAdmin);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU07 generado con exito!", 0);
}

main();

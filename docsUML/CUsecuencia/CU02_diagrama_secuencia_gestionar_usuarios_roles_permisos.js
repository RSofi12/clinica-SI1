/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU02 - Gestionar Usuarios, Roles y Permisos (RF01 / Paquete 1: Seguridad y Auditoria)
 * DESCRIPCION: Administracion integral de usuarios del sistema clinico: listado paginado 
 *              con filtros, creacion de cuentas con asignacion de roles y permisos, 
 *              modificacion de datos, conmutacion de estado (baja logica RN11) y 
 *              desbloqueo de cuentas con registro en bitacora.
 * ACTOR: Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NORMAS Y PAUTAS APLICADAS:
 * - Funciones sin parametros () segun directriz UML de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Sin fragmentos alt/opt innecesarios: el Administrador ejecuta los flujos directos.
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU02 - Gestionar Usuarios, Roles y Permisos";

function log(msg) {
    Session.Output("[CU02-Secuencia] " + msg);
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
    log("Iniciando generacion de CU02 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Administrador -> :UsersManager (Boundary) -> :UsersController (Controller)
     * -> :User, :Role, :Permission, :Bitacora (Entities)
     * ------------------------------------------------------------------------- */
    var actorAdmin      = addActorParticipant(pkg, diagram, "Administrador", 40, 100);
    var uiUsers         = addParticipant(pkg, diagram, ":UsersManager", "Interface", 200, 200);
    var ctrlUsers       = addParticipant(pkg, diagram, ":UsersController", "Controller", 460, 210);

    var entUser         = addEntityParticipant(pkg, diagram, ":User", 730, 140);
    var entRole         = addEntityParticipant(pkg, diagram, ":Role", 920, 140);
    var entPermission   = addEntityParticipant(pkg, diagram, ":Permission", 1100, 150);
    var entBitacora     = addEntityParticipant(pkg, diagram, ":Bitacora", 1290, 140);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: LISTAR USUARIOS (GET /api/users)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiUsers,
        "1: solicitarListadoUsuarios()", false, step++);

    addMessage(uiUsers, ctrlUsers,
        "1.1: index()", false, step++);

    addMessage(ctrlUsers, entUser,
        "1.2: with()", false, step++);

    addMessage(entUser, ctrlUsers,
        "1.3: return()", true, step++);

    addMessage(ctrlUsers, entRole,
        "1.4: with()", false, step++);

    addMessage(entRole, ctrlUsers,
        "1.5: return()", true, step++);

    addMessage(ctrlUsers, entPermission,
        "1.6: get()", false, step++);

    addMessage(entPermission, ctrlUsers,
        "1.7: return()", true, step++);

    addMessage(ctrlUsers, entUser,
        "1.8: paginate()", false, step++);

    addMessage(entUser, ctrlUsers,
        "1.9: return()", true, step++);

    addMessage(ctrlUsers, uiUsers,
        "1.10: return()", true, step++);

    addMessage(uiUsers, actorAdmin,
        "1.11: renderizarUsuarios()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: CREAR USUARIO Y ASIGNAR ROL (POST /api/users)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiUsers,
        "2: registrarUsuario()", false, step++);

    // Autollamada en Interface: validacion cliente del formulario
    addMessage(uiUsers, uiUsers,
        "2.1: validarFormulario()", false, step++);

    addMessage(uiUsers, ctrlUsers,
        "2.2: store()", false, step++);

    // Autollamadas en Controller: validacion de reglas y generacion de hash
    addMessage(ctrlUsers, ctrlUsers,
        "2.3: validate()", false, step++);

    addMessage(ctrlUsers, ctrlUsers,
        "2.4: makeHash()", false, step++);

    addMessage(ctrlUsers, entUser,
        "2.5: create()", false, step++);

    addMessage(entUser, ctrlUsers,
        "2.6: return()", true, step++);

    addMessage(ctrlUsers, entRole,
        "2.7: where()", false, step++);

    addMessage(entRole, ctrlUsers,
        "2.8: return()", true, step++);

    addMessage(ctrlUsers, entUser,
        "2.9: sync()", false, step++);

    addMessage(entUser, ctrlUsers,
        "2.10: return()", true, step++);

    addMessage(ctrlUsers, entBitacora,
        "2.11: registrar()", false, step++);

    addMessage(entBitacora, ctrlUsers,
        "2.12: return()", true, step++);

    addMessage(ctrlUsers, uiUsers,
        "2.13: return()", true, step++);

    addMessage(uiUsers, actorAdmin,
        "2.14: notificarRegistroExitoso()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 3: MODIFICAR USUARIO (PUT /api/users/{id})
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiUsers,
        "3: modificarUsuario()", false, step++);

    // Autollamada en Interface: validacion cliente de datos actualizados
    addMessage(uiUsers, uiUsers,
        "3.1: validarFormulario()", false, step++);

    addMessage(uiUsers, ctrlUsers,
        "3.2: update()", false, step++);

    // Autollamada en Controller: validacion de servidor
    addMessage(ctrlUsers, ctrlUsers,
        "3.3: validate()", false, step++);

    addMessage(ctrlUsers, entUser,
        "3.4: find()", false, step++);

    addMessage(entUser, ctrlUsers,
        "3.5: return()", true, step++);

    /* Fragmento OPT: Cifrado condicional si se envio password nueva */
    addCombinedFragment(pkg, diagram, "opt", "[Si envio nueva contrasena]", 440, 710, -960, -1040);

    addMessage(ctrlUsers, ctrlUsers,
        "3.6: makeHash()", false, step++);

    addMessage(ctrlUsers, entUser,
        "3.7: save()", false, step++);

    addMessage(entUser, ctrlUsers,
        "3.8: return()", true, step++);

    addMessage(ctrlUsers, entRole,
        "3.9: where()", false, step++);

    addMessage(entRole, ctrlUsers,
        "3.10: return()", true, step++);

    addMessage(ctrlUsers, entUser,
        "3.11: sync()", false, step++);

    addMessage(entUser, ctrlUsers,
        "3.12: return()", true, step++);

    addMessage(ctrlUsers, entBitacora,
        "3.13: registrar()", false, step++);

    addMessage(entBitacora, ctrlUsers,
        "3.14: return()", true, step++);

    addMessage(ctrlUsers, uiUsers,
        "3.15: return()", true, step++);

    addMessage(uiUsers, actorAdmin,
        "3.16: notificarActualizacionExitosa()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO 4: CONMUTAR ESTADO / BAJA LOGICA (PATCH /api/users/{id}/toggle-status)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiUsers,
        "4: cambiarEstadoUsuario()", false, step++);

    addMessage(uiUsers, ctrlUsers,
        "4.1: toggleStatus()", false, step++);

    // Autollamada en Controller: regla RN11 de seguridad contra auto-inhabilitacion
    addMessage(ctrlUsers, ctrlUsers,
        "4.2: validarNoAutoInhabilitacion()", false, step++);

    addMessage(ctrlUsers, entUser,
        "4.3: find()", false, step++);

    addMessage(entUser, ctrlUsers,
        "4.4: return()", true, step++);

    addMessage(ctrlUsers, entUser,
        "4.5: save()", false, step++);

    addMessage(entUser, ctrlUsers,
        "4.6: return()", true, step++);

    addMessage(ctrlUsers, entBitacora,
        "4.7: registrar()", false, step++);

    addMessage(entBitacora, ctrlUsers,
        "4.8: return()", true, step++);

    addMessage(ctrlUsers, uiUsers,
        "4.9: return()", true, step++);

    addMessage(uiUsers, actorAdmin,
        "4.10: notificarEstadoActualizado()", true, step++);

    /* -------------------------------------------------------------------------
     * 6. FLUJO 5: DESBLOQUEAR CUENTA (POST /api/users/{id}/unlock)
     * ------------------------------------------------------------------------- */
    addMessage(actorAdmin, uiUsers,
        "5: desbloquearUsuario()", false, step++);

    addMessage(uiUsers, ctrlUsers,
        "5.1: unlock()", false, step++);

    addMessage(ctrlUsers, entUser,
        "5.2: find()", false, step++);

    addMessage(entUser, ctrlUsers,
        "5.3: return()", true, step++);

    addMessage(ctrlUsers, entUser,
        "5.4: desbloquear()", false, step++);

    addMessage(entUser, ctrlUsers,
        "5.5: return()", true, step++);

    addMessage(ctrlUsers, entBitacora,
        "5.6: registrar()", false, step++);

    addMessage(entBitacora, ctrlUsers,
        "5.7: return()", true, step++);

    addMessage(ctrlUsers, uiUsers,
        "5.8: return()", true, step++);

    addMessage(uiUsers, actorAdmin,
        "5.9: notificarDesbloqueoExitoso()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorAdmin);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU02 generado con exito!", 0);
}

main();

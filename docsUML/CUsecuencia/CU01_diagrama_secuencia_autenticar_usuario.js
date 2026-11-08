/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU01 - Autenticar Usuario (RF01 / Paquete 1: Seguridad y Auditoria)
 * DESCRIPCION: Autenticacion de usuarios en el sistema, validacion de politicas de 
 *              bloqueo temporal por intentos fallidos, auditoria de accesos y 
 *              recuperacion de contrasena mediante tokens.
 * ACTOR: Usuario
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NORMAS Y PAUTAS APLICADAS:
 * - Funciones sin parametros () segun directriz UML de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmento alt para decisiones [Credenciales Validas / Credenciales Invalidas].
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU01 - Autenticar Usuario";

function log(msg) {
    Session.Output("[CU01-Secuencia] " + msg);
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-20;b=-1800;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1700;", "");
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
    var dObj = diagram.DiagramObjects.AddNew("l=" + leftX + ";r=" + rightX + ";t=-30;b=-1700;", "");
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
            dObj.Bottom = -1800;
            dObj.Update();
            return;
        }
    }
}

function main() {
    log("Iniciando generacion de CU01 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Actor -> :LoginPage (Boundary) -> :AuthController (Controller)
     * -> :User, :SecurityConfig, :Bitacora, :PasswordResetToken (Entities)
     * ------------------------------------------------------------------------- */
    var actorUsuario     = addActorParticipant(pkg, diagram, "Usuario", 40, 100);
    var uiLogin          = addParticipant(pkg, diagram, ":LoginPage", "Interface", 200, 200);
    var ctrlAuth         = addParticipant(pkg, diagram, ":AuthController", "Controller", 460, 210);

    var entUser          = addEntityParticipant(pkg, diagram, ":User", 730, 140);
    var entSecurityConf  = addEntityParticipant(pkg, diagram, ":SecurityConfig", 920, 170);
    var entBitacora      = addEntityParticipant(pkg, diagram, ":Bitacora", 1140, 140);
    var entResetToken    = addEntityParticipant(pkg, diagram, ":PasswordResetToken", 1330, 190);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: INICIAR SESION (POST /api/auth/login)
     * ------------------------------------------------------------------------- */
    addMessage(actorUsuario, uiLogin,
        "1: ingresarCredenciales()", false, step++);

    // Autollamada en Interface: validacion cliente de credenciales
    addMessage(uiLogin, uiLogin,
        "1.1: validarCredenciales()", false, step++);

    addMessage(uiLogin, ctrlAuth,
        "1.2: login()", false, step++);

    // Autollamada en Controller: validacion formal del LoginRequest
    addMessage(ctrlAuth, ctrlAuth,
        "1.3: validate()", false, step++);

    addMessage(ctrlAuth, entUser,
        "1.4: where()", false, step++);

    addMessage(entUser, ctrlAuth,
        "1.5: return()", true, step++);

    addMessage(ctrlAuth, entSecurityConf,
        "1.6: obtenerPoliticaActiva()", false, step++);

    addMessage(entSecurityConf, ctrlAuth,
        "1.7: return()", true, step++);

    /* Fragmento ALT: Decision de Autenticacion */
    addCombinedFragment(pkg, diagram, "alt", "[Credenciales Validas]", 440, 1270, -320, -610);

    addMessage(ctrlAuth, entUser,
        "1.8: autenticar()", false, step++);

    addMessage(entUser, ctrlAuth,
        "1.9: return()", true, step++);

    addMessage(ctrlAuth, entUser,
        "1.10: actualizarUltimoAcceso()", false, step++);

    addMessage(ctrlAuth, entUser,
        "1.11: load()", false, step++);

    addMessage(entUser, ctrlAuth,
        "1.12: return()", true, step++);

    addMessage(ctrlAuth, entBitacora,
        "1.13: registrar()", false, step++);

    addMessage(entBitacora, ctrlAuth,
        "1.14: return()", true, step++);

    addMessage(ctrlAuth, uiLogin,
        "1.15: return()", true, step++);

    addMessage(uiLogin, actorUsuario,
        "1.16: renderDashboard()", true, step++);

    /* Sub-bloque ELSE: Credenciales Invalidas */
    addCombinedFragment(pkg, diagram, "alt", "[Credenciales Invalidas]", 440, 1270, -620, -840);

    addMessage(ctrlAuth, entUser,
        "1.17: registrarIntentoFallido()", false, step++);

    addMessage(entUser, ctrlAuth,
        "1.18: return()", true, step++);

    addMessage(ctrlAuth, entBitacora,
        "1.19: registrar()", false, step++);

    addMessage(entBitacora, ctrlAuth,
        "1.20: return()", true, step++);

    addMessage(ctrlAuth, uiLogin,
        "1.21: return()", true, step++);

    addMessage(uiLogin, actorUsuario,
        "1.22: renderError()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: SOLICITAR RECUPERACION (POST /api/auth/forgot-password)
     * ------------------------------------------------------------------------- */
    addMessage(actorUsuario, uiLogin,
        "2: solicitarRecuperacion()", false, step++);

    // Autollamada en Interface: validacion cliente de formato de email
    addMessage(uiLogin, uiLogin,
        "2.1: validarEmail()", false, step++);

    addMessage(uiLogin, ctrlAuth,
        "2.2: forgotPassword()", false, step++);

    // Autollamada en Controller: validacion de servidor
    addMessage(ctrlAuth, ctrlAuth,
        "2.3: validate()", false, step++);

    addMessage(ctrlAuth, entUser,
        "2.4: where()", false, step++);

    addMessage(entUser, ctrlAuth,
        "2.5: return()", true, step++);

    addMessage(ctrlAuth, entResetToken,
        "2.6: create()", false, step++);

    addMessage(entResetToken, ctrlAuth,
        "2.7: return()", true, step++);

    addMessage(ctrlAuth, entBitacora,
        "2.8: registrar()", false, step++);

    addMessage(entBitacora, ctrlAuth,
        "2.9: return()", true, step++);

    addMessage(ctrlAuth, uiLogin,
        "2.10: return()", true, step++);

    addMessage(uiLogin, actorUsuario,
        "2.11: renderNotificacionEnvio()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 3: RESTABLECER CONTRASENA (POST /api/auth/reset-password)
     * ------------------------------------------------------------------------- */
    addMessage(actorUsuario, uiLogin,
        "3: ingresarNuevaContrasena()", false, step++);

    // Autollamada en Interface: validacion de coincidencia de contrasenas
    addMessage(uiLogin, uiLogin,
        "3.1: validarFormulario()", false, step++);

    addMessage(uiLogin, ctrlAuth,
        "3.2: resetPassword()", false, step++);

    // Autollamada en Controller: validacion de token y password
    addMessage(ctrlAuth, ctrlAuth,
        "3.3: validate()", false, step++);

    addMessage(ctrlAuth, entResetToken,
        "3.4: where()", false, step++);

    addMessage(entResetToken, ctrlAuth,
        "3.5: return()", true, step++);

    addMessage(ctrlAuth, entUser,
        "3.6: update()", false, step++);

    addMessage(entUser, ctrlAuth,
        "3.7: return()", true, step++);

    addMessage(ctrlAuth, entBitacora,
        "3.8: registrar()", false, step++);

    addMessage(entBitacora, ctrlAuth,
        "3.9: return()", true, step++);

    addMessage(ctrlAuth, uiLogin,
        "3.10: return()", true, step++);

    addMessage(uiLogin, actorUsuario,
        "3.11: renderConfirmacionReset()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorUsuario);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU01 generado con exito!", 0);
}

main();

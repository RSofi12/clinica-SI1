/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU05 - Gestionar Cuenta y Perfil del Paciente (Autoservicio / RF03)
 * DESCRIPCION: Modulo de autoservicio para pacientes: activacion de cuenta web mediante 
 *              verificacion de cedula (CI), asignacion de credenciales y rol PACIENTE, 
 *              consulta de perfil clinico personal, actualizacion de canales de 
 *              contacto y cambio de contrasena con auditoria inmutable.
 * ACTOR: Paciente
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE pura: Actor-Boundary-Control-Entity)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * NORMAS Y PAUTAS APLICADAS:
 * - Funciones sin parametros () segun directriz UML de catedra.
 * - Sin cruces horizontales entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Sin fragmentos alt/opt innecesarios: flujos directos de autoservicio.
 * - Recuadros estandar rectangulares <<Actor>>, <<Interface>>, <<Controller>>, <<Entity>>.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU05 - Gestionar Cuenta y Perfil del Paciente";

function log(msg) {
    Session.Output("[CU05-Secuencia] " + msg);
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
    log("Iniciando generacion de CU05 con flujo actor-interface-controller-entities...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    /* -------------------------------------------------------------------------
     * 1. PARTICIPANTES BCE
     * Paciente -> :PatientProfileView (Boundary) -> :PatientProfileController (Controller)
     * -> :Patient, :EmergencyContact, :User, :Role, :Bitacora (Entities)
     * ------------------------------------------------------------------------- */
    var actorPatient     = addActorParticipant(pkg, diagram, "Paciente", 40, 100);
    var uiProfile        = addParticipant(pkg, diagram, ":PatientProfileView", "Interface", 200, 200);
    var ctrlProfile      = addParticipant(pkg, diagram, ":PatientProfileController", "Controller", 450, 220);

    var entPatient       = addEntityParticipant(pkg, diagram, ":Patient",          720, 140);
    var entEmergContact  = addEntityParticipant(pkg, diagram, ":EmergencyContact", 900, 160);
    var entUser          = addEntityParticipant(pkg, diagram, ":User",             1090, 130);
    var entRole          = addEntityParticipant(pkg, diagram, ":Role",             1250, 130);
    var entBitacora      = addEntityParticipant(pkg, diagram, ":Bitacora",         1410, 140);

    var step = 1;

    /* -------------------------------------------------------------------------
     * 2. FLUJO 1: ACTIVACION DE CUENTA DE AUTOSERVICIO (POST /api/patient-profile/activate)
     * ------------------------------------------------------------------------- */
    addMessage(actorPatient, uiProfile,
        "1: ingresarDatosActivacion()", false, step++);

    // Autollamada en Interface: validacion cliente del formulario
    addMessage(uiProfile, uiProfile,
        "1.1: validarFormulario()", false, step++);

    addMessage(uiProfile, ctrlProfile,
        "1.2: activateAccount()", false, step++);

    // Autollamada en Controller: validacion de reglas del ActivatePatientAccountRequest
    addMessage(ctrlProfile, ctrlProfile,
        "1.3: validate()", false, step++);

    addMessage(ctrlProfile, entPatient,
        "1.4: where()", false, step++);

    addMessage(entPatient, ctrlProfile,
        "1.5: return()", true, step++);

    // Autollamada en Controller: cifrado de la nueva password
    addMessage(ctrlProfile, ctrlProfile,
        "1.6: makeHash()", false, step++);

    addMessage(ctrlProfile, entUser,
        "1.7: create()", false, step++);

    addMessage(entUser, ctrlProfile,
        "1.8: return()", true, step++);

    addMessage(ctrlProfile, entRole,
        "1.9: where()", false, step++);

    addMessage(entRole, ctrlProfile,
        "1.10: return()", true, step++);

    addMessage(ctrlProfile, entUser,
        "1.11: syncWithoutDetaching()", false, step++);

    addMessage(entUser, ctrlProfile,
        "1.12: return()", true, step++);

    addMessage(ctrlProfile, entPatient,
        "1.13: save()", false, step++);

    addMessage(entPatient, ctrlProfile,
        "1.14: return()", true, step++);

    addMessage(ctrlProfile, entBitacora,
        "1.15: registrar()", false, step++);

    addMessage(entBitacora, ctrlProfile,
        "1.16: return()", true, step++);

    addMessage(ctrlProfile, uiProfile,
        "1.17: return()", true, step++);

    addMessage(uiProfile, actorPatient,
        "1.18: notificarCuentaActivada()", true, step++);

    /* -------------------------------------------------------------------------
     * 3. FLUJO 2: CONSULTAR PERFIL PERSONAL (GET /api/patient-profile/me)
     * ------------------------------------------------------------------------- */
    addMessage(actorPatient, uiProfile,
        "2: solicitarPerfil()", false, step++);

    addMessage(uiProfile, ctrlProfile,
        "2.1: me()", false, step++);

    addMessage(ctrlProfile, entPatient,
        "2.2: with()", false, step++);

    addMessage(entPatient, ctrlProfile,
        "2.3: return()", true, step++);

    addMessage(ctrlProfile, uiProfile,
        "2.4: return()", true, step++);

    addMessage(uiProfile, actorPatient,
        "2.5: renderizarPerfil()", true, step++);

    /* -------------------------------------------------------------------------
     * 4. FLUJO 3: ACTUALIZAR CANALES DE CONTACTO (PUT /api/patient-profile/me)
     * ------------------------------------------------------------------------- */
    addMessage(actorPatient, uiProfile,
        "3: actualizarDatosPerfil()", false, step++);

    // Autollamada en Interface: validacion cliente de formatos de contacto
    addMessage(uiProfile, uiProfile,
        "3.1: validarFormulario()", false, step++);

    addMessage(uiProfile, ctrlProfile,
        "3.2: updateProfile()", false, step++);

    // Autollamada en Controller: validacion de servidor
    addMessage(ctrlProfile, ctrlProfile,
        "3.3: validate()", false, step++);

    addMessage(ctrlProfile, entPatient,
        "3.4: save()", false, step++);

    addMessage(entPatient, ctrlProfile,
        "3.5: return()", true, step++);

    /* Fragmento OPT: Actualizacion condicional de contacto de emergencia */
    addCombinedFragment(pkg, diagram, "opt", "[Si actualiza contacto de emergencia]", 430, 1070, -1140, -1230);

    addMessage(ctrlProfile, entEmergContact,
        "3.6: update()", false, step++);

    addMessage(entEmergContact, ctrlProfile,
        "3.7: return()", true, step++);

    addMessage(ctrlProfile, entBitacora,
        "3.8: registrar()", false, step++);

    addMessage(entBitacora, ctrlProfile,
        "3.9: return()", true, step++);

    addMessage(ctrlProfile, uiProfile,
        "3.10: return()", true, step++);

    addMessage(uiProfile, actorPatient,
        "3.11: notificarPerfilActualizado()", true, step++);

    /* -------------------------------------------------------------------------
     * 5. FLUJO 4: CAMBIO DE CONTRASENA (POST /api/patient-profile/change-password)
     * ------------------------------------------------------------------------- */
    addMessage(actorPatient, uiProfile,
        "4: cambiarContrasena()", false, step++);

    // Autollamada en Interface: validacion cliente de coincidencia
    addMessage(uiProfile, uiProfile,
        "4.1: validarFormulario()", false, step++);

    addMessage(uiProfile, ctrlProfile,
        "4.2: changePassword()", false, step++);

    // Autollamadas en Controller: validacion y verificacion de hash previo
    addMessage(ctrlProfile, ctrlProfile,
        "4.3: validate()", false, step++);

    addMessage(ctrlProfile, ctrlProfile,
        "4.4: verificarPasswordActual()", false, step++);

    addMessage(ctrlProfile, entUser,
        "4.5: update()", false, step++);

    addMessage(entUser, ctrlProfile,
        "4.6: return()", true, step++);

    addMessage(ctrlProfile, entBitacora,
        "4.7: registrar()", false, step++);

    addMessage(entBitacora, ctrlProfile,
        "4.8: return()", true, step++);

    addMessage(ctrlProfile, uiProfile,
        "4.9: return()", true, step++);

    addMessage(uiProfile, actorPatient,
        "4.10: notificarContrasenaModificada()", true, step++);

    addMessage(uiProfile, actorPatient,
        "4.7: notificarContrasenaModificada()", true, step++);

    /* Guardar y abrir diagrama de forma segura */
    stretchActorLifeline(diagram, actorPatient);
    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama '" + DIAGRAM_NAME + "' generado y abierto correctamente.");
    Session.Prompt("¡Diagrama CU05 generado con exito!", 0);
}

main();

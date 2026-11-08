/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU26 - Gestionar Documentos Clinicos Adjuntos y Visor DICOM (Ciclo 2 / P4)
 * DESCRIPCION: Almacenamiento cloud (Cloudinary), clasificacion policlinica por
 *              especialidades en cascada, soporte e integracion de visor DICOM SAGA,
 *              vinculacion opcional con ordenes de examenes auxiliares (CU25 -> CU26),
 *              politica Anti-IDOR, baja logica inmutable (RN11) y auditoria en Bitacora.
 * ACTOR: Medico / Administrador
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE canonica: 1 Boundary y 1 Controller)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO REAL:
 * - Boundary: :ClinicalDocumentsSection (gestor documental y previsualizacion)
 * - Controller: :DocumentosClinicosController (orquestador REST, validacion y transacciones)
 * - Entities: :HistoriaClinica, :DocumentoClinico, :OrdenExamen, :Bitacora
 * - Convencion de funciones () o maximo 1 parametro.
 * - Sin cruces de mensajes entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmentos ALT y OPT con comentario de rango de mensajes.
 * - Recuadros rectangulares con colores por defecto de Enterprise Architect.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU26 - Gestionar Documentos Clinicos Adjuntos";

function log(msg) {
    Session.Output("[CU26-Secuencia] " + msg);
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
 * Agrega el Actor con su forma estandar UML.
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
 * Agrega participantes Entidades en RECUADRO RECTANGULAR estandar con color por defecto.
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
    } catch (e) {
        log("No se pudo agregar fragmento " + type + ": " + e.message);
        return null;
    }
}

/**
 * Funcion Principal
 */
function main() {
    Repository.EnsureOutputVisible("Script");
    log("Iniciando generacion del Diagrama de Secuencia CU26 (1 Boundary, 1 Controller)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. PARTICIPANTES (BCE: 1 Actor -> 1 Boundary -> 1 Controller -> 4 Entities)
    // =========================================================================
    var actMed = addActorParticipant(pkg, diagram, "Medico / Administrador", 30, 90);
    var bndDoc = addParticipant(pkg, diagram, ":ClinicalDocumentsSection", "Interface", 190, 180);
    var ctrlDoc = addParticipant(pkg, diagram, ":DocumentosClinicosController", "Controller", 450, 190);
    var entHis = addEntityParticipant(pkg, diagram, ":HistoriaClinica", 720, 110);
    var entDoc = addEntityParticipant(pkg, diagram, ":DocumentoClinico", 900, 120);
    var entOrd = addEntityParticipant(pkg, diagram, ":OrdenExamen", 1090, 110);
    var entBit = addEntityParticipant(pkg, diagram, ":Bitacora", 1260, 90);

    diagram.Update();
    pkg.Diagrams.Refresh();

    // =========================================================================
    // 2. MENSAJES Y LLAMADAS
    // =========================================================================

    // FASE 1: Consulta y Listado de Documentos del Expediente
    addMessage(actMed, bndDoc, "1: abrirPestanaDocumentos(historia)", false, 1);
    addMessage(bndDoc, ctrlDoc, "1.1: index(idHistoria)", false, 2);
    addMessage(ctrlDoc, ctrlDoc, "1.2: validarAcceso(historia)", false, 3);
    addMessage(ctrlDoc, entHis, "1.3: findOrFail(idHistoria)", false, 4);
    addMessage(entHis, ctrlDoc, "1.4: return historiaClinica", true, 5);
    addMessage(ctrlDoc, entDoc, "1.5: where('id_historia_clinica', id)", false, 6);
    addMessage(entDoc, ctrlDoc, "1.6: return documentosYEstadisticas", true, 7);
    addMessage(ctrlDoc, bndDoc, "1.7: return 200 OK (documentos, metricas)", true, 8);
    addMessage(bndDoc, actMed, "1.8: renderizarListadoYMetricas()", true, 9);

    // FASE 2: Consulta de Ordenes de Examen Pendientes (CU25 -> CU26)
    addMessage(actMed, bndDoc, "2: abrirFormularioAdjuntar()", false, 10);
    addMessage(bndDoc, ctrlDoc, "2.1: ordenesPendientes(idHistoria)", false, 11);
    addMessage(ctrlDoc, entOrd, "2.2: where('estado', 'PENDIENTE')", false, 12);
    addMessage(entOrd, ctrlDoc, "2.3: return ordenesPendientes", true, 13);
    addMessage(ctrlDoc, bndDoc, "2.4: return 200 OK (ordenes)", true, 14);
    addMessage(bndDoc, actMed, "2.5: poblarSelectorOrdenes()", true, 15);

    // FASE 3: Subida, Enlace Cloudinary y Persistencia Transaccional
    addMessage(actMed, bndDoc, "3: enviarFormulario(archivo, categoria, orden)", false, 16);
    addMessage(bndDoc, ctrlDoc, "3.1: store(idHistoria)", false, 17);
    addMessage(ctrlDoc, ctrlDoc, "3.2: validate(DocumentoClinicoUploadRequest)", false, 18);
    addMessage(ctrlDoc, ctrlDoc, "3.3: subirACloudinaryApi(archivo, formato)", false, 19);
    addMessage(ctrlDoc, ctrlDoc, "3.4: DB::transaction()", false, 20);

    // =========================================================================
    // FRAGMENTO OPT [Vinculacion con CU25]: Abarca Mensaje 3.5 hasta 3.6
    // =========================================================================
    addCombinedFragment(pkg, diagram, "opt", "[si se selecciono orden de examen CU25]", 420, 1380, -1090, -1220);
    addMessage(ctrlDoc, entOrd, "3.5: update('estado', 'CON_RESULTADOS')", false, 21);
    addMessage(entOrd, ctrlDoc, "3.6: return ordenActualizada", true, 22);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Subida y Persistencia Exitosa]: Abarca Mensaje 3.7 hasta 3.11
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[subida exitosa a Cloudinary y archivo valido <= 15MB]", 420, 1380, -1240, -1540);
    addMessage(ctrlDoc, entDoc, "3.7: create(datosDocumento)", false, 23);
    addMessage(entDoc, ctrlDoc, "3.8: return documentoCreado", true, 24);
    addMessage(ctrlDoc, entBit, "3.9: registrar(ADJUNTAR_DOCUMENTO_CLINICO)", false, 25);
    addMessage(ctrlDoc, bndDoc, "3.10: return 201 Created (documento)", true, 26);
    addMessage(bndDoc, actMed, "3.11: notificarExitoYActualizar()", true, 27);

    // =========================================================================
    // FRAGMENTO ALT [Guardia: Falla de Validacion o Limite Excedido]: Abarca Mensaje 3.12 hasta 3.13
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[archivo invalido o peso > 15MB]", 420, 1380, -1560, -1720);
    addMessage(ctrlDoc, bndDoc, "3.12: return 422 Unprocessable (errorValidacion)", true, 28);
    addMessage(bndDoc, actMed, "3.13: extractErrorMessage(error)", true, 29);

    // FASE 4: Inspeccion de Estudio Radiologico en Visor DICOM SAGA
    addMessage(actMed, bndDoc, "4: clickAbrirVisorDicom(documento)", false, 30);
    addMessage(bndDoc, bndDoc, "4.1: redirigirVisorSaga(urlCloudinary)", false, 31);
    addMessage(bndDoc, actMed, "4.2: abrirVentanaVisorExterno()", true, 32);

    // FASE 5: Baja Logica de Documento y Limpieza en Cloudinary (RN11)
    addMessage(actMed, bndDoc, "5: solicitarEliminacion(idDocumento)", false, 33);
    addMessage(bndDoc, ctrlDoc, "5.1: destroy(idDocumento)", false, 34);
    addMessage(ctrlDoc, ctrlDoc, "5.2: validarAutorizacionEliminar()", false, 35);
    addMessage(ctrlDoc, ctrlDoc, "5.3: eliminarDeCloudinaryApi(publicId)", false, 36);
    addMessage(ctrlDoc, entDoc, "5.4: update('estado', 'INACTIVO')", false, 37);
    addMessage(entDoc, ctrlDoc, "5.5: return documentoInactivo", true, 38);
    addMessage(ctrlDoc, entBit, "5.6: registrar(ELIMINAR_DOCUMENTO_CLINICO)", false, 39);
    addMessage(ctrlDoc, bndDoc, "5.7: return 200 OK (eliminado)", true, 40);
    addMessage(bndDoc, actMed, "5.8: reflejarBajaLogicaEnVista()", true, 41);

    diagram.Update();
    Repository.ReloadDiagram(diagram.DiagramID);
    log("Diagrama de Secuencia CU26 generado exitosamente con 7 participantes (1 Boundary, 1 Controller).");
}

main();

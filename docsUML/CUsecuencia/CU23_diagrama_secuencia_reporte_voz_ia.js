/* =================================================================================
 * PROYECTO: Clinica Vida Salud - Centro Medico La Cruz
 * CASO DE USO: CU23 - Generar Reporte Personalizado por Voz con IA (Ciclo 2 / P6)
 * DESCRIPCION: Captura de comandos por voz mediante Web Speech API, analisis semantico
 *              hibrido (Motor Determinístico + Enriquecimiento Gemini opcional),
 *              resolucion de parametros, consultas a PostgreSQL (Citas/Pacientes),
 *              calculo de KPIs, persistencia en reportes_ia, auditoria en bitacora (CU03)
 *              y exportacion multidestino a Excel, PDF y CSV.
 * ACTORES: Administrador / Medico
 * TIPO DE DIAGRAMA: Diagrama de Secuencia (Arquitectura BCE canonica: 1 Boundary y 1 Controller)
 * ENTORNO: Enterprise Architect 15.0+
 * LENGUAJE: JScript (Motor nativo WSH en Enterprise Architect)
 *
 * ESPECIFICACION DE DISENO FIEL AL CODIGO:
 * - Boundary: :VoiceReportAssistant (consola interactiva de voz y reportes)
 * - Controller: :VoiceReportController (orquestador REST de analitica)
 * - Entities: :ReporteIa, :Cita, :Paciente, :Bitacora
 * - Metodos fieles con convencion () o maximo 1 parametro.
 * - Sin cruces de mensajes entre entidades (comunicacion exclusiva Controller -> Entity).
 * - Retornos unicamente hacia el Controller o la Interface.
 * - Fragmentos ALT para branching de consultas [Citas / Pacientes] y exportacion [Excel / PDF / CSV].
 * - Fragmento OPT para enriquecimiento opcional con Gemini API.
 * ================================================================================= */

var DEFAULT_PACKAGE_NAME = "CUdiagrams";
var DIAGRAM_NAME = "CU23 - Generar Reporte por Voz con IA";

function log(msg) {
    Session.Output("[CU23-Secuencia] " + msg);
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
    diagram.Update();
    pkg.Diagrams.Refresh();
    return diagram;
}

/**
 * Agrega participante actor.
 */
function addActorParticipant(pkg, diagram, name, left, width) {
    var el = pkg.Elements.AddNew(name, "Actor");
    el.Update();
    var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + (left + width) + ";t=-50;b=-900;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega participante estandar (Boundary, Controller).
 */
function addParticipant(pkg, diagram, name, stereotype, left, width) {
    var el = pkg.Elements.AddNew(name, "Object");
    if (stereotype) {
        el.Stereotype = stereotype;
    }
    el.Update();
    var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + (left + width) + ";t=-50;b=-900;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega participante Entity (recuadro rectangular estandar sin icono de BD).
 */
function addEntityParticipant(pkg, diagram, name, left, width) {
    var el = pkg.Elements.AddNew(name, "Object");
    el.Stereotype = "entity";
    el.Update();
    var dObj = diagram.DiagramObjects.AddNew("l=" + left + ";r=" + (left + width) + ";t=-50;b=-900;", "");
    dObj.ElementID = el.ElementID;
    dObj.Update();
    return el;
}

/**
 * Agrega mensaje de secuencia.
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
    log("Iniciando generacion del Diagrama de Secuencia CU23 (BCE canonico)...");

    var pkg = getTargetPackage();
    if (pkg == null) return;

    var diagram = recreateDiagram(pkg);

    // =========================================================================
    // 1. PARTICIPANTES (BCE: 1 Actor -> 1 Boundary -> 1 Controller -> 4 Entities)
    // =========================================================================
    var actUser   = addActorParticipant(pkg, diagram, "Administrador / Medico", 40, 100);
    var bndVoice  = addParticipant(pkg, diagram, ":VoiceReportAssistant", "Interface", 200, 160);
    var ctrlVoice = addParticipant(pkg, diagram, ":VoiceReportController", "Controller", 430, 160);
    var entRep    = addEntityParticipant(pkg, diagram, ":ReporteIa", 670, 110);
    var entCit    = addEntityParticipant(pkg, diagram, ":Cita", 840, 100);
    var entPac    = addEntityParticipant(pkg, diagram, ":Paciente", 1000, 100);
    var entBit    = addEntityParticipant(pkg, diagram, ":Bitacora", 1160, 100);

    diagram.Update();
    pkg.Diagrams.Refresh();

    // =========================================================================
    // 2. MENSAJES Y LLAMADAS
    // =========================================================================

    // FASE 1: Captura de Voz y Permisos en el Navegador
    addMessage(actUser, bndVoice, "1: clickMicrofono()", false, 1);
    addMessage(bndVoice, bndVoice, "1.1: getUserMedia({audio:true})", false, 2);
    addMessage(bndVoice, bndVoice, "1.2: SpeechRecognition.start()", false, 3);
    addMessage(actUser, bndVoice, "2: dictarComando(audio)", false, 4);
    addMessage(bndVoice, bndVoice, "2.1: onresult(transcript)", false, 5);
    addMessage(actUser, bndVoice, "3: clickConsultar()", false, 6);

    // FASE 2: Envio al Backend y Validacion REST
    addMessage(bndVoice, ctrlVoice, "3.1: processVoiceCommand(request)", false, 7);
    addMessage(ctrlVoice, ctrlVoice, "3.2: validate(ProcessVoiceReportRequest)", false, 8);
    addMessage(ctrlVoice, ctrlVoice, "3.3: parse(comando_texto)", false, 9);

    // =========================================================================
    // FRAGMENTO OPT [Enriquecimiento Gemini]: Abarca Mensaje 3.4
    // =========================================================================
    addCombinedFragment(pkg, diagram, "opt", "[GEMINI_API_KEY configurada & baja confianza deterministica]", 400, 620, -380, -430);
    addMessage(ctrlVoice, ctrlVoice, "3.4: consultarGeminiApi()", false, 10);

    // FASE 3: Scoping de Seguridad y Consultas a Base de Datos
    addMessage(ctrlVoice, ctrlVoice, "3.5: aplicarScopingRBAC(usuario)", false, 11);

    // =========================================================================
    // FRAGMENTO ALT [Tipo de Reporte]: Abarca Mensajes 3.6 a 3.9
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[tipo_reporte == 'PACIENTES_REGISTRADOS' | 'CITAS_*']", 400, 1120, -470, -600);

    // Rama 1: Consultar Pacientes
    addMessage(ctrlVoice, entPac, "3.6: consultarPacientes(filtros)", false, 12);
    addMessage(entPac, ctrlVoice, "3.7: return datosPacientes", true, 13);

    // Rama 2: Consultar Citas con Relaciones
    addMessage(ctrlVoice, entCit, "3.8: consultarCitas(filtros)", false, 14);
    addMessage(entCit, ctrlVoice, "3.9: return datosCitas", true, 15);

    // FASE 4: Persistencia Transaccional y Auditoria
    addMessage(ctrlVoice, ctrlVoice, "3.10: DB::transaction()", false, 16);
    addMessage(ctrlVoice, entRep, "3.11: create(reporte)", false, 17);
    addMessage(entRep, ctrlVoice, "3.12: return reporteGuardado", true, 18);
    addMessage(ctrlVoice, entBit, "3.13: registrar(evento)", false, 19);
    addMessage(ctrlVoice, bndVoice, "3.14: 200 OK (datos, metricas, registros)", true, 20);
    addMessage(bndVoice, actUser, "3.15: renderizarReporte()", true, 21);

    // =========================================================================
    // FRAGMENTO ALT [Exportacion de Reporte]: Abarca Mensajes 4, 5 y 6
    // =========================================================================
    addCombinedFragment(pkg, diagram, "alt", "[Actor selecciona formato: Excel | PDF | CSV]", 30, 390, -740, -880);

    // Rama Excel
    addMessage(actUser, bndVoice, "4: clickExportarExcel()", false, 22);
    addMessage(bndVoice, actUser, "4.1: exportToExcel(reportData)", true, 23);

    // Rama PDF
    addMessage(actUser, bndVoice, "5: clickExportarPdf()", false, 24);
    addMessage(bndVoice, actUser, "5.1: exportToPdf(reportData)", true, 25);

    // Rama CSV
    addMessage(actUser, bndVoice, "6: clickExportarCsv()", false, 26);
    addMessage(bndVoice, actUser, "6.1: exportToCsv(registros)", true, 27);

    diagram.Update();
    Repository.SaveDiagram(diagram.DiagramID);
    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    log("Diagrama de Secuencia CU23 generado con exito.");
    Session.Prompt("¡Diagrama de Secuencia CU23 generado exitosamente con arquitectura BCE y flujo fiel al codigo!", 0);
}

main();

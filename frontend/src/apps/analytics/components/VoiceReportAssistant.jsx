import { useState, useEffect, useRef } from 'react';
import { analyticsService } from '../services/analyticsService';
import {
  Mic,
  MicOff,
  Sparkles,
  Download,
  Calendar,
  User,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ArrowRight,
  Filter,
} from 'lucide-react';

export function VoiceReportAssistant() {
  // Estados de Voz y Reconocimiento
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados de Reporte y Datos
  const [reportData, setReportData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const recognitionRef = useRef(null);

  // Inicializar Web Speech API al montar el componente
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-BO';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Error de reconocimiento de voz:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMessage('Acceso al micrófono denegado. Conceda permisos o utilice el campo de texto.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('No se detectó audio. Por favor, vuelva a intentar.');
      } else {
        setErrorMessage(`Error en el reconocimiento: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cargar historial reciente
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await analyticsService.fetchVoiceHistory();
      if (res && res.data) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.warn('No se pudo cargar el historial de voz:', err);
    }
  };

  const toggleListening = () => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setErrorMessage('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Error al iniciar micrófono:', e);
      }
    }
  };

  const handleExecuteVoiceCommand = async (textoAProcesar) => {
    const comandoFinal = (textoAProcesar || transcript).trim();
    if (!comandoFinal) {
      setErrorMessage('Por favor, dicte o ingrese una consulta antes de generar el reporte.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const response = await analyticsService.processVoiceCommand(comandoFinal);
      if (response && response.success) {
        setReportData(response.data);
        loadHistory();
      } else {
        setErrorMessage(response.message || 'No se pudo interpretar el comando.');
      }
    } catch (err) {
      console.error('Error procesando reporte por voz:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error de conexión con el servicio de analítica.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const sugerencias = [
    'Citas canceladas de este mes',
    'Reporte de citas atendidas de hoy',
    'Balance de atenciones de la semana pasada',
    'Padrón de pacientes registrados este año',
    'Citas programadas en octubre',
  ];

  const getStatusBadge = (estado) => {
    const styles = {
      ATENDIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CANCELADA: 'bg-rose-50 text-rose-700 border-rose-200',
      PROGRAMADA: 'bg-sky-50 text-sky-700 border-sky-200',
      CONFIRMADA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      INASISTENCIA: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return styles[estado] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const filteredRegistros = (reportData?.registros || []).filter((r) => {
    if (!tableSearch) return true;
    const term = tableSearch.toLowerCase();
    const codigo = (r.codigo_cita || '').toLowerCase();
    const paciente = (r.paciente?.nombre_completo || '').toLowerCase();
    const medico = (r.medico?.nombre_completo || '').toLowerCase();
    const esp = (r.especialidad?.nombre || '').toLowerCase();
    const est = (r.estado || '').toLowerCase();
    return codigo.includes(term) || paciente.includes(term) || medico.includes(term) || esp.includes(term) || est.includes(term);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header con Título y Botón de Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#00687a] uppercase tracking-wider bg-[#00687a]/10 px-2 py-0.5 rounded-md">
              Paquete 6: Reportes y Analítica
            </span>
            <span className="text-[11px] font-semibold text-slate-500">CU23 / Examen Parcial II</span>
          </div>
          <h1 className="font-montserrat font-bold text-2xl sm:text-3xl text-slate-900 mt-1">
            Asistente de Reportes por Voz con IA
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Dicte consultas gerenciales y clínicas en lenguaje natural para generar métricas y tablas dinámicas en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setIsHistoryDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <History className="w-4 h-4 text-[#00687a]" />
          <span>Consultas Recientes ({historyList.length})</span>
        </button>
      </div>

      {/* 2. Hero Card: Consola de Dictado por Voz */}
      <div className="bg-gradient-to-br from-white via-slate-50/50 to-slate-100/60 rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Botón de Micrófono con Ondas Animadas */}
          <div className="relative mb-4">
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
                <span className="absolute -inset-3 rounded-full bg-[#00687a]/20 animate-pulse" />
              </>
            )}
            <button
              onClick={toggleListening}
              disabled={!speechSupported || isProcessing}
              title={isListening ? 'Detener micrófono' : 'Presionar para dictar reporte'}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-500/30 scale-105'
                  : 'bg-gradient-to-tr from-[#004d5a] to-[#008b9e] text-white hover:scale-105 shadow-[#00687a]/25'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          {/* Estado de Escucha y Ondas de Audio */}
          <div className="flex items-center gap-2 text-xs font-semibold mb-2">
            {isListening ? (
              <div className="flex items-center gap-2 text-rose-600 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Escuchando... hable con naturalidad</span>
                <div className="flex items-end gap-1 h-3 ml-2">
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: '450ms' }} />
                </div>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-[#00687a]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Interpretando consulta semántica y extrayendo filtros...</span>
              </div>
            ) : (
              <span className="text-slate-500">
                Haga clic en el micrófono para dictar su consulta o elija un ejemplo
              </span>
            )}
          </div>

          {/* Campo de Texto para Transcripción o Escritura Manual */}
          <div className="w-full mt-3">
            <div className="relative">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteVoiceCommand()}
                placeholder={
                  speechSupported
                    ? 'Ej: "Citas canceladas de pediatría en octubre" o dicte directamente...'
                    : 'Escriba su consulta en lenguaje natural...'
                }
                className="w-full pl-4 pr-28 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] shadow-xs transition"
              />
              <button
                onClick={() => handleExecuteVoiceCommand()}
                disabled={isProcessing || !transcript.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#00687a] hover:bg-[#004d5a] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Consultar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Advertencia si no hay soporte Web Speech */}
          {!speechSupported && (
            <p className="text-[11px] text-amber-600 mt-2">
              Su navegador no soporta Web Speech API nativa. Puede escribir su consulta en el campo superior sin problemas.
            </p>
          )}

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="w-full mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Chips con Consultas de Ejemplo */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00687a]" /> Ejemplos:
            </span>
            {sugerencias.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(sug);
                  handleExecuteVoiceCommand(sug);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#00687a] hover:bg-cyan-50/50 text-slate-600 hover:text-[#00687a] transition shadow-2xs cursor-pointer"
              >
                "{sug}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Panel de Historial Desplegable */}
      {isHistoryDrawerOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-montserrat font-bold text-sm text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-[#00687a]" />
              Consultas por voz registradas en PostgreSQL (`reportes_ia`)
            </h3>
            <button
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {historyList.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No hay consultas registradas todavía en esta sesión.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {historyList.map((item) => (
                <div
                  key={item.id_reporte}
                  onClick={() => {
                    setTranscript(item.comando_texto);
                    handleExecuteVoiceCommand(item.comando_texto);
                  }}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/40 border border-slate-200 hover:border-[#00687a]/40 transition cursor-pointer flex flex-col justify-between"
                >
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2">"{item.comando_texto}"</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span className="font-mono">{item.tipo_reporte}</span>
                    <span>{new Date(item.fecha_generacion).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Resultados del Reporte Generado */}
      {reportData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Cabecera del Reporte: Interpretación y Filtros Detectados */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md uppercase">
                  Interpretación Semántica
                </span>
                <h2 className="font-montserrat font-bold text-lg sm:text-xl text-slate-900 mt-1">
                  {reportData.interpretacion_legible}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comando procesado: <span className="font-semibold text-slate-700">"{reportData.comando_texto}"</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => analyticsService.exportToCsv(reportData.registros, reportData.tipo_reporte)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Badges de Filtros Detectados */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtros aplicados:
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Tipo: <strong className="font-semibold">{reportData.tipo_reporte}</strong>
              </span>
              {reportData.filtros_detectados?.estado && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                  Estado: <strong>{reportData.filtros_detectados.estado}</strong>
                </span>
              )}
              {reportData.filtros_detectados?.especialidad_nombre && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                  Especialidad: <strong>{reportData.filtros_detectados.especialidad_nombre}</strong>
                </span>
              )}
              {reportData.filtros_detectados?.medico_nombre && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  Médico: <strong>{reportData.filtros_detectados.medico_nombre}</strong>
                </span>
              )}
              {reportData.filtros_detectados?.fecha_inicio && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Rango: <strong>{reportData.filtros_detectados.fecha_inicio}</strong> a{' '}
                  <strong>{reportData.filtros_detectados.fecha_fin}</strong>
                </span>
              )}
              <span className="text-[10px] ml-auto px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
                Motor: {reportData.motor} ({Math.round((reportData.confianza || 1) * 100)}% conf.)
              </span>
            </div>
          </div>

          {/* Tarjetas KPI de Métricas Calculadas */}
          {reportData.metricas && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Total Coincidentes</span>
                <p className="text-2xl font-montserrat font-bold text-slate-900 mt-1">
                  {reportData.metricas.total_citas ?? reportData.metricas.total_pacientes ?? 0}
                </p>
                <span className="text-[10px] text-slate-400">Registros evaluados</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-emerald-600 font-medium">Atendidas / Asistidas</span>
                <p className="text-2xl font-montserrat font-bold text-emerald-700 mt-1">
                  {reportData.metricas.atendidas ?? reportData.metricas.activos ?? 0}
                </p>
                <span className="text-[10px] text-emerald-600">Completadas con éxito</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-rose-600 font-medium">Canceladas</span>
                <p className="text-2xl font-montserrat font-bold text-rose-700 mt-1">
                  {reportData.metricas.canceladas ?? reportData.metricas.inactivos ?? 0}
                </p>
                <span className="text-[10px] text-rose-500">Con motivo registrado</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-[#00687a] font-medium">Tasa de Asistencia</span>
                <p className="text-2xl font-montserrat font-bold text-[#00687a] mt-1">
                  {reportData.metricas.tasa_asistencia !== undefined ? `${reportData.metricas.tasa_asistencia}%` : 'N/A'}
                </p>
                <span className="text-[10px] text-slate-400">Efectividad asistencial</span>
              </div>
            </div>
          )}

          {/* Tabla de Detalle con Buscador Integrado */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-montserrat font-bold text-sm text-slate-800">
                  Detalle de Registros Coincidentes ({filteredRegistros.length})
                </h3>
                <p className="text-xs text-slate-400">Información extraída de PostgreSQL para el período solicitado.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filtrar en tabla..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00687a]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Especialidad</th>
                    <th className="py-3 px-4">Médico</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Motivo / Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRegistros.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No se encontraron registros coincidentes para la consulta.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistros.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#00687a]">
                          {item.codigo_cita || `REG-${item.id_paciente || idx + 1}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{item.fecha_formateada || item.fecha_registro}</div>
                          {item.hora_formateada && (
                            <div className="text-[11px] text-slate-400">{item.hora_formateada}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              item.estado || item.estado_paciente
                            )}`}
                          >
                            {item.estado || item.estado_paciente}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {item.especialidad?.nombre || 'General'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.medico?.nombre_completo || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {item.paciente?.nombre_completo || item.nombre_completo}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            CI: {item.paciente?.numero_documento || item.numero_documento || 'S/D'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={item.motivo_consulta || item.motivo_cancelacion}>
                          {item.motivo_consulta || item.motivo_cancelacion || 'Consulta de rutina'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

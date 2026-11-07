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
  FileText,
  Printer,
  RefreshCw,
  Search,
  ArrowRight,
  Filter,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';

export function VoiceReportAssistant() {
  // Estados de Voz y Reconocimiento
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [micPermissionGranted, setMicPermissionGranted] = useState(null); // null, true, false
  const [isSecureOrigin, setIsSecureOrigin] = useState(true);

  // Estados de Reporte y Datos
  const [reportData, setReportData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  // Comprobar soporte y entorno seguro al montar
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    // Verificar si el contexto es seguro (HTTPS o localhost)
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const secure = window.isSecureContext || isLocalhost;
    setIsSecureOrigin(secure);

    loadHistory();

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
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

  /**
   * Solicitar permisos explícitos de micrófono e iniciar reconocimiento de voz
   * Diseñado con resiliencia para navegadores de escritorio y móviles (Chrome, Safari, Edge)
   */
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage(
        'Este navegador no soporta Web Speech API nativa. Puede escribir su consulta en el campo de texto inferior.'
      );
      return;
    }

    setErrorMessage('');

    // 1. En dispositivos móviles por HTTP sobre IP local, advertir contexto seguro
    if (!isSecureOrigin) {
      setErrorMessage(
        'Aviso para celulares: Los navegadores móviles bloquean el micrófono en conexiones HTTP por red local. Use localhost o active HTTPS en su servidor de desarrollo.'
      );
    }

    // 2. Pedir permiso explícito al navegador mediante getUserMedia antes de inicializar SpeechRecognition
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Liberar el stream de inmediato para no acaparar el dispositivo de audio
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionGranted(true);
      }
    } catch (permErr) {
      console.warn('Permiso de micrófono no concedido mediante getUserMedia:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setMicPermissionGranted(false);
        setErrorMessage(
          'Permiso de micrófono denegado. Toque el candado o icono de configuración en la barra del navegador y active el permiso de micrófono.'
        );
        return;
      }
    }

    // 3. Configurar SpeechRecognition
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      // continuous = true evita que el micrófono se apague de inmediato a los 2 segundos por un silencio breve
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // Usar 'es-419' (Español Latinoamericano universal) con fallback a 'es-ES'
      recognition.lang = 'es-419';

      let accumulatedFinal = '';

      const restartSilenceWatchdog = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        // Si hay una pausa de 3.5 segundos luego de que el usuario ya habló, detener suavemente la escucha
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 3500);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const textoCompleto = (accumulatedFinal + (interim ? ' ' + interim : '')).trim();
        if (textoCompleto) {
          setTranscript(textoCompleto);
          restartSilenceWatchdog();
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error === 'no-speech') {
          // Un silencio temporal no es fatal mientras siga escuchando
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono bloqueado. Por favor, habilite el acceso al micrófono en su navegador.');
        } else if (event.error === 'network') {
          setErrorMessage('Aviso: Compruebe su conexión a internet para el reconocimiento de voz en la nube.');
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Aviso del micrófono: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error al inicializar SpeechRecognition:', err);
      setErrorMessage('No se pudo iniciar el servicio de voz. Intente nuevamente o escriba su consulta.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleExecuteVoiceCommand = async (textoAProcesar) => {
    const comandoFinal = (textoAProcesar || transcript).trim();
    if (!comandoFinal) {
      setErrorMessage('Por favor, dicte o ingrese una consulta antes de generar el reporte.');
      return;
    }

    if (isListening) {
      stopListening();
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
    const paciente = (r.paciente?.nombre_completo || r.nombre_completo || '').toLowerCase();
    const medico = (r.medico?.nombre_completo || '').toLowerCase();
    const esp = (r.especialidad?.nombre || '').toLowerCase();
    const est = (r.estado || r.estado_paciente || '').toLowerCase();
    return codigo.includes(term) || paciente.includes(term) || medico.includes(term) || esp.includes(term) || est.includes(term);
  });

  return (
    <div className="space-y-6 pb-12 transition-all duration-300 ease-out">
      {/* 1. Header con Título y Botón de Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#00687a] uppercase tracking-wider bg-[#00687a]/10 px-2.5 py-0.5 rounded-md">
              Paquete 6: Reportes y Analítica
            </span>
            <span className="text-[11px] font-semibold text-slate-500">CU23 / Examen Parcial II</span>
          </div>
          <h1 className="font-serif-clinical font-normal tracking-tight text-2xl sm:text-3xl text-slate-900 mt-1">
            Asistente de Reportes por Voz con IA
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Dicte consultas gerenciales y clínicas en lenguaje natural para generar métricas, filtros y tablas dinámicas en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setIsHistoryDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <History className="w-4 h-4 text-[#00687a]" />
          <span>Consultas Recientes ({historyList.length})</span>
        </button>
      </div>

      {/* 2. Hero Card: Consola de Dictado por Voz */}
      <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/70 rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all duration-300">
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Botón de Micrófono con Ondas Animadas */}
          <div className="relative mb-4">
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping duration-1000" />
                <span className="absolute -inset-3 rounded-full bg-[#00687a]/20 animate-pulse duration-700" />
              </>
            )}
            <button
              onClick={toggleListening}
              disabled={!speechSupported || isProcessing}
              title={isListening ? 'Detener micrófono' : 'Presionar para hablar y dictar reporte'}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105 ring-4 ring-rose-200'
                  : 'bg-gradient-to-tr from-[#004d5a] to-[#008b9e] text-white hover:scale-105 shadow-[#00687a]/25 hover:shadow-xl'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          {/* Estado de Escucha y Ondas de Audio */}
          <div className="flex items-center gap-2 text-xs font-semibold mb-2 transition-all duration-200 min-h-[22px]">
            {isListening ? (
              <div className="flex items-center gap-2 text-rose-600 animate-in fade-in duration-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Escuchando... hable con naturalidad</span>
                <div className="flex items-end gap-1 h-3 ml-2">
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: '450ms' }} />
                </div>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 text-[#00687a] animate-in fade-in duration-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Interpretando consulta semántica y procesando en PostgreSQL...</span>
              </div>
            ) : (
              <span className="text-slate-500 transition-colors">
                Haga clic en el micrófono para dictar su consulta o elija un ejemplo abajo
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
                    ? 'Ej: "Citas canceladas de pediatría en octubre" o dicte con el micrófono...'
                    : 'Escriba su consulta analítica en lenguaje natural...'
                }
                className="w-full pl-4 pr-28 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] shadow-xs transition-all duration-200"
              />
              <button
                onClick={() => handleExecuteVoiceCommand()}
                disabled={isProcessing || !transcript.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#00687a] hover:bg-[#004d5a] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
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
            <p className="text-[11px] text-amber-600 mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Su navegador no soporta Web Speech API nativa. Puede escribir su consulta en el campo superior sin problemas.
            </p>
          )}

          {/* Mensaje de Error / Asistencia de Permisos */}
          {errorMessage && (
            <div className="w-full mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="flex-1">{errorMessage}</span>
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
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#00687a] hover:bg-cyan-50/50 text-slate-600 hover:text-[#00687a] transition-all duration-150 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                "{sug}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Panel de Historial Desplegable con Transición Suave */}
      {isHistoryDrawerOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all duration-300 animate-in fade-in-50 slide-in-from-top-3">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-serif-clinical font-normal tracking-tight text-sm text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-[#00687a]" />
              Consultas por voz registradas en PostgreSQL (`reportes_ia`)
            </h3>
            <button
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
                  className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/40 border border-slate-200 hover:border-[#00687a]/40 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between"
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

      {/* 4. Resultados del Reporte Generado con Transición Fluida */}
      {reportData && (
        <div className="space-y-6 transition-all duration-500 ease-out animate-in fade-in-50 slide-in-from-bottom-2">
          {/* Cabecera del Reporte: Interpretación y Filtros Detectados */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#00687a] bg-[#00687a]/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Interpretación Semántica
                </span>
                <h2 className="font-serif-clinical font-normal tracking-tight text-lg sm:text-xl text-slate-900 mt-1">
                  {reportData.interpretacion_legible}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comando procesado: <span className="font-semibold text-slate-700">"{reportData.comando_texto}"</span>
                </p>
              </div>

              {/* Botones de Exportación: Excel, PDF y CSV */}
              <div className="flex items-center flex-wrap gap-2">
                {/* 1. Exportar Excel */}
                <button
                  onClick={() => analyticsService.exportToExcel(reportData, reportData.tipo_reporte)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer"
                  title="Descargar hoja de cálculo en formato Excel (.xls)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel</span>
                </button>

                {/* 2. Exportar PDF */}
                <button
                  onClick={() => analyticsService.exportToPdf(reportData)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer"
                  title="Generar e imprimir documento formal en formato PDF"
                >
                  <Printer className="w-4 h-4 text-cyan-300" />
                  <span>PDF</span>
                </button>

                {/* 3. Exportar CSV */}
                <button
                  onClick={() => analyticsService.exportToCsv(reportData.registros, reportData.tipo_reporte)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer"
                  title="Descargar archivo de texto separado por comas (.csv)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Badges de Filtros Detectados */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#00687a]" /> Filtros aplicados:
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
              <span className="text-[10px] ml-auto px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono border border-slate-200">
                Motor: {reportData.motor} ({Math.round((reportData.confianza || 1) * 100)}% conf.)
              </span>
            </div>
          </div>

          {/* Tarjetas KPI de Métricas Calculadas con Micro-interacciones */}
          {reportData.metricas && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-[#00687a]/40 hover:-translate-y-0.5 transition-all duration-200">
                <span className="text-xs text-slate-500 font-medium">Total Coincidentes</span>
                <p className="text-2xl font-sans-clinical font-bold text-slate-900 mt-1">
                  {reportData.metricas.total_citas ?? reportData.metricas.total_pacientes ?? 0}
                </p>
                <span className="text-[10px] text-slate-400">Registros evaluados</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200">
                <span className="text-xs text-emerald-600 font-medium">Atendidas / Asistidas</span>
                <p className="text-2xl font-sans-clinical font-bold text-emerald-700 mt-1">
                  {reportData.metricas.atendidas ?? reportData.metricas.activos ?? 0}
                </p>
                <span className="text-[10px] text-emerald-600">Completadas con éxito</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-200">
                <span className="text-xs text-rose-600 font-medium">Canceladas</span>
                <p className="text-2xl font-sans-clinical font-bold text-rose-700 mt-1">
                  {reportData.metricas.canceladas ?? reportData.metricas.inactivos ?? 0}
                </p>
                <span className="text-[10px] text-rose-500">Con motivo registrado</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 hover:-translate-y-0.5 transition-all duration-200">
                <span className="text-xs text-[#00687a] font-medium">Tasa de Asistencia</span>
                <p className="text-2xl font-sans-clinical font-bold text-[#00687a] mt-1">
                  {reportData.metricas.tasa_asistencia !== undefined ? `${reportData.metricas.tasa_asistencia}%` : 'N/A'}
                </p>
                <span className="text-[10px] text-slate-400">Efectividad asistencial</span>
              </div>
            </div>
          )}

          {/* Tabla de Detalle con Buscador Integrado y Transición en Filas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-clinical font-normal tracking-tight text-sm text-slate-800">
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
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] transition-all duration-200"
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
                      <tr key={idx} className="hover:bg-slate-50/90 transition-colors duration-150">
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

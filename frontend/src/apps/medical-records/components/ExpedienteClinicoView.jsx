import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  AlertTriangle,
  HeartPulse,
  Stethoscope,
  Pill,
  Clock,
  Printer,
  Search,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Activity,
  Calendar,
  Phone,
  Droplet,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Info,
  CheckCircle2,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { expedienteService } from '../services/expedienteService';
import { patientService } from '../../clinical-resources/services/patientService';
import { useAuth } from '../../../context/AuthContext';
import RecetaDetailModal from './RecetaDetailModal';
import { AntecedentesPatientModal } from './AntecedentesPatientModal';
import ClinicalDocumentsSection from './ClinicalDocumentsSection';

/**
 * Vista Integral de Expediente Clínico Digital y Línea de Tiempo (CU19)
 * Paquete 4: Historial Clínico y Consultas
 * Estándar de Diseño: /frontend-design — Metodología PUDS / RUP
 */
export function ExpedienteClinicoView({ initialPatientId = null, defaultTab = 'timeline' }) {
  const { user } = useAuth();
  const role = (user?.rol || user?.tipo_usuario || '').toUpperCase();
  const isPatient = role === 'PACIENTE';
  const isStaff = ['ADMIN', 'MEDICO', 'ADMINISTRADOR'].includes(role);

  // Estados de consulta y datos
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [patientsList, setPatientsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos del expediente
  const [expediente, setExpediente] = useState(null);
  const [timeline, setTimeline] = useState([]);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState(defaultTab); // 'timeline' | 'consultas' | 'recetas' | 'antecedentes' | 'documentos' | 'contactos'
  const [expandedConsultas, setExpandedConsultas] = useState({});
  const [docsCount, setDocsCount] = useState(0);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Modales secundarios de detalle
  const [selectedReceta, setSelectedReceta] = useState(null);
  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);
  const [isAntecedentesModalOpen, setIsAntecedentesModalOpen] = useState(false);

  // 1. Cargar lista de pacientes si es Personal Médico / Admin
  useEffect(() => {
    if (isStaff) {
      loadPatientsList();
    }
  }, [isStaff]);

  const loadPatientsList = async () => {
    try {
      const res = await patientService.fetchPatients({ per_page: 100, estado: 'ACTIVO' });
      if (res?.data) {
        setPatientsList(res.data);
        if (!selectedPatientId && res.data.length > 0) {
          setSelectedPatientId(res.data[0].id_paciente);
        }
      }
    } catch (err) {
      console.error('Error cargando padrón de pacientes:', err);
    }
  };

  // 2. Cargar expediente clínico
  useEffect(() => {
    loadExpedienteData();
  }, [selectedPatientId, isPatient]);

  const loadExpedienteData = async () => {
    setLoading(true);
    setError(null);
    try {
      let dataExp = null;
      let dataTime = [];

      if (isPatient) {
        const res = await expedienteService.fetchMiExpediente();
        dataExp = res?.data || null;
        if (dataExp?.paciente?.id_paciente) {
          const resTime = await expedienteService.fetchTimeline(dataExp.paciente.id_paciente);
          dataTime = resTime?.data || [];
        }
      } else if (selectedPatientId) {
        const [resExp, resTime] = await Promise.all([
          expedienteService.fetchExpedienteByPaciente(selectedPatientId),
          expedienteService.fetchTimeline(selectedPatientId),
        ]);
        dataExp = resExp?.data || null;
        dataTime = resTime?.data || [];
      }

      setExpediente(dataExp);
      setTimeline(dataTime);
    } catch (err) {
      console.error('Error al cargar expediente:', err);
      setError(err?.message || 'No se pudo cargar el expediente clínico.');
      setExpediente(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  const paciente = expediente?.paciente;
  const historiaClinica = expediente?.historia_clinica;
  const resumen = expediente?.resumen_clinico || {};
  const antecedentes = expediente?.antecedentes || [];
  const consultas = expediente?.consultas || [];
  const recetas = expediente?.recetas || [];

  // Toggle acordeón de consultas
  const toggleConsulta = (id) => {
    setExpandedConsultas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Lista de pacientes filtrados para el selector
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patientsList;
    const term = searchTerm.toLowerCase();
    return patientsList.filter(
      (p) =>
        p.nombres?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.numero_documento?.includes(term) ||
        p.numero_historia?.toLowerCase().includes(term)
    );
  }, [patientsList, searchTerm]);

  // Manejo de impresión
  const handlePrint = () => {
    window.print();
  };

  // Semáforo para IMC
  const getImcBadge = (imc) => {
    if (!imc) return null;
    const val = parseFloat(imc);
    if (val < 18.5) return { label: 'Bajo Peso', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (val < 25.0) return { label: 'Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (val < 30.0) return { label: 'Sobrepeso', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    return { label: 'Obesidad', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* CABECERA PRINCIPAL Y SELECTOR DE PACIENTE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100 print:border-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif-clinical font-normal text-slate-900 tracking-tight">
                  {isPatient ? 'Mi Expediente Clínico Digital' : 'Expediente Clínico y Antecedentes'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {isPatient
                    ? 'Acceso confidencial de solo lectura a su historial médico, diagnósticos y recetas (CU19).'
                    : 'Visor clínico integral de historia digital, antecedentes, consultas y recetas (CU19).'}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={loadExpedienteData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={handlePrint}
              disabled={!paciente}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition shadow-xs disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Expediente
            </button>
          </div>
        </div>

        {/* SELECTOR PARA PERSONAL MÉDICO / ADMIN */}
        {isStaff && (
          <div className="mt-4 pt-2 print:hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre, CI o N° Historia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition"
                />
              </div>

              <select
                value={selectedPatientId || ''}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-medium text-slate-800 shadow-xs"
              >
                {filteredPatients.map((p) => (
                  <option key={p.id_paciente} value={p.id_paciente}>
                    {p.apellidos}, {p.nombres} — CI: {p.numero_documento} ({p.numero_historia})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* FICHA RESUMEN DEL PACIENTE */}
        {paciente && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-50 border border-slate-200/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Identidad */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                  {paciente.nombres?.charAt(0)}
                  {paciente.apellidos?.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      {paciente.nombres} {paciente.apellidos}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                      {paciente.numero_historia || `HC-${paciente.id_paciente}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/80 text-slate-700">
                      CI: {paciente.numero_documento}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 mt-2 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{paciente.edad} años ({paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : paciente.sexo})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      <span>Grupo: <strong className="text-slate-800">{paciente.tipo_sangre || 'No registrado'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{paciente.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-emerald-700 font-semibold">{paciente.estado_paciente || 'ACTIVO'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón rápido para gestionar antecedentes (Médico / Admin) */}
              {isStaff && (
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => setIsAntecedentesModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-100/70 border border-teal-300 rounded-xl hover:bg-teal-100 transition shadow-2xs"
                  >
                    <FolderOpen className="w-4 h-4 text-teal-700" />
                    Editar Antecedentes
                  </button>
                </div>
              )}
            </div>

            {/* ALERTAS CRÍTICAS DE ALERGIAS Y CRÓNICOS */}
            <div className="mt-4 pt-4 border-t border-slate-200/60">
              {resumen.alertas_alergicas && resumen.alertas_alergicas.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                      ¡Alerta Médica de Alergias Activas!
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {resumen.alertas_alergicas.map((alergia) => (
                        <span
                          key={alergia.id_antecedente}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-rose-700 border border-rose-300 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          {alergia.nombre}
                          <span className="text-[10px] font-medium text-rose-500">
                            ({alergia.severidad || 'ALTA'})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-2 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sin alergias activas registradas en la historia clínica.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ESTADO DE CARGA / ERROR */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Cargando expediente clínico integral...</p>
          <p className="text-xs text-slate-500">Unificando consultas, antecedentes y prescripciones.</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Acceso o Consulta Denegada</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL DEL EXPEDIENTE */}
      {!loading && !error && paciente && (
        <>
          {/* TARJETAS DE SIGNOS VITALES Y RESUMEN CLÍNICO */}
          {resumen.ultimo_triaje && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Último Triaje y Signos Vitales
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Registrado el {resumen.ultimo_triaje.fecha})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Presión Arterial</span>
                  <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {resumen.ultimo_triaje.presion_arterial || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Frec. Cardíaca</span>
                  <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {resumen.ultimo_triaje.frecuencia_cardiaca || '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">lpm</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Temperatura</span>
                  <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {resumen.ultimo_triaje.temperatura ? `${resumen.ultimo_triaje.temperatura} °C` : '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Axilar</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Saturación O₂</span>
                  <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {resumen.ultimo_triaje.saturacion_oxigeno ? `${resumen.ultimo_triaje.saturacion_oxigeno} %` : '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">SpO₂</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Peso & Altura</span>
                  <p className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                    {resumen.ultimo_triaje.peso ? `${resumen.ultimo_triaje.peso} kg` : '—'} /{' '}
                    {resumen.ultimo_triaje.altura ? `${resumen.ultimo_triaje.altura} cm` : '—'}
                  </p>
                  <span className="text-[10px] text-slate-400">Antropometría</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Índice Masa (IMC)</span>
                  <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
                    {resumen.ultimo_triaje.imc || '—'}
                  </p>
                  {resumen.ultimo_triaje.imc && (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border mt-0.5 ${
                        getImcBadge(resumen.ultimo_triaje.imc)?.color
                      }`}
                    >
                      {getImcBadge(resumen.ultimo_triaje.imc)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BARRA DE PESTAÑAS CON TRANSICIONES SUAVES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
            <div className="flex items-center overflow-x-auto border-b border-slate-100 px-4 pt-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'timeline'
                    ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Activity className="w-4 h-4" />
                Línea de Tiempo ({timeline.length})
              </button>

              <button
                onClick={() => setActiveTab('consultas')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'consultas'
                    ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Consultas Médicas ({consultas.length})
              </button>

              <button
                onClick={() => setActiveTab('recetas')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'recetas'
                    ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Pill className="w-4 h-4" />
                Prescripciones y Recetas ({recetas.length})
              </button>

              <button
                onClick={() => setActiveTab('antecedentes')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'antecedentes'
                    ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Antecedentes ({antecedentes.length})
              </button>

              <button
                onClick={() => setActiveTab('documentos')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'documentos'
                    ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Paperclip className="w-4 h-4" />
                Documentos Adjuntos {docsCount > 0 ? `(${docsCount})` : ''}
              </button>

              <button
                onClick={() => setActiveTab('contactos')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'contactos'
                    ? 'border-teal-700 text-teal-800 bg-teal-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <User className="w-4 h-4" />
                Contactos de Emergencia ({paciente.contactos_emergencia?.length || 0})
              </button>
            </div>

            {/* CUERPO DE LAS PESTAÑAS */}
            <div className="p-6">
              <div key={activeTab} className="animate-view-fade">
                {/* 1. LÍNEA DE TIEMPO (TIMELINE) */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {timeline.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium">No hay eventos cronológicos registrados aún.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {timeline.map((evt, idx) => {
                        const isConsulta = evt.tipo === 'CONSULTA';
                        const isReceta = evt.tipo === 'RECETA';
                        const isAntecedente = evt.tipo === 'ANTECEDENTE';

                        return (
                          <div key={idx} className="relative pb-6 last:pb-0">
                            {/* Icono del nodo */}
                            <div
                              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs ${
                                isConsulta
                                  ? 'bg-teal-600'
                                  : isReceta
                                  ? 'bg-purple-600'
                                  : 'bg-amber-600'
                              }`}
                            >
                              {isConsulta && <Stethoscope className="w-2.5 h-2.5" />}
                              {isReceta && <Pill className="w-2.5 h-2.5" />}
                              {isAntecedente && <FolderOpen className="w-2.5 h-2.5" />}
                            </div>

                            {/* Contenedor del evento */}
                            <div className="bg-slate-50 hover:bg-slate-100/70 transition p-4 rounded-xl border border-slate-200/70">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {evt.titulo}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {evt.fecha || 'Fecha no registrada'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 font-medium mb-2">
                                {evt.subtitulo}
                              </p>

                              {evt.descripcion && (
                                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                                  {evt.descripcion}
                                </p>
                              )}

                              {/* Badges complementarios */}
                              {isConsulta && evt.detalles?.diagnosticos?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {evt.detalles.diagnosticos.map((d, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200"
                                    >
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {isReceta && evt.detalles?.medicamentos?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {evt.detalles.medicamentos.map((m, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PESTAÑA: CONSULTAS MÉDICAS */}
              {activeTab === 'consultas' && (
                <div className="space-y-4">
                  {consultas.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium">No se han registrado consultas médicas presenciales aún.</p>
                    </div>
                  ) : (
                    consultas.map((c) => {
                      const isExpanded = !!expandedConsultas[c.id_consulta];
                      return (
                        <div
                          key={c.id_consulta}
                          className="border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs"
                        >
                          {/* Barra cabecera de la consulta */}
                          <div
                            onClick={() => toggleConsulta(c.id_consulta)}
                            className="p-4 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                                #{c.id_consulta}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  Consulta Médica — {c.fecha_consulta || 'Sin fecha'}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Facultativo: Dr(a). {c.medico?.usuario?.name || 'Médico Asignado'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {c.diagnosticos && c.diagnosticos.length > 0 && (
                                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80">
                                  {c.diagnosticos.length} diagnóstico(s)
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Cuerpo expandible */}
                          {isExpanded && (
                            <div className="p-5 bg-white border-t border-slate-100 space-y-4 text-xs animate-in fade-in duration-200">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  Motivo de Consulta
                                </span>
                                <p className="text-slate-800 font-medium mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                                  {c.motivo_consulta}
                                </p>
                              </div>

                              {c.enfermedad_actual && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Enfermedad Actual
                                  </span>
                                  <p className="text-slate-700 mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                                    {c.enfermedad_actual}
                                  </p>
                                </div>
                              )}

                              {/* Diagnósticos CIE-10 */}
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  Diagnósticos Clínicos (CIE-10)
                                </span>
                                <div className="mt-1.5 space-y-1.5">
                                  {c.diagnosticos && c.diagnosticos.length > 0 ? (
                                    c.diagnosticos.map((diag) => (
                                      <div
                                        key={diag.id_diagnostico}
                                        className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200/60 flex items-start gap-2"
                                      >
                                        <span className="px-1.5 py-0.5 rounded bg-teal-200/70 text-teal-900 font-mono text-[10px] font-bold shrink-0">
                                          {diag.codigo_cie10}
                                        </span>
                                        <div className="flex-1">
                                          <p className="font-semibold text-slate-900">
                                            {diag.descripcion_cie10}
                                          </p>
                                          {diag.observaciones && (
                                            <p className="text-[11px] text-slate-600 mt-0.5">
                                              {diag.observaciones}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-slate-400 italic">Sin diagnósticos específicos registrados.</p>
                                  )}
                                </div>
                              </div>

                              {/* Plan de Tratamiento */}
                              {c.plan_tratamiento && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Plan de Tratamiento y Recomendaciones
                                  </span>
                                  <p className="text-slate-800 mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 leading-relaxed">
                                    {c.plan_tratamiento}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 3. PESTAÑA: PRESCRIPCIONES Y RECETAS */}
              {activeTab === 'recetas' && (
                <div className="space-y-4">
                  {recetas.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium">No hay recetas emitidas para este paciente aún.</p>
                    </div>
                  ) : (
                    recetas.map((r) => (
                      <div
                        key={r.id_receta}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">
                                Receta Médica #{r.id_receta}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  r.estado === 'EMITIDA'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {r.estado}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Emitida el {r.fecha_emision} por Dr(a). {r.medico?.usuario?.name || 'Médico'}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedReceta(r);
                              setIsRecetaModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Ver Recetario Membretado
                          </button>
                        </div>

                        {/* Listado de Medicamentos */}
                        <div className="mt-3">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                            Fármacos y Posología (℞)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {r.detalles?.map((det, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                              >
                                <p className="font-bold text-slate-900">{det.medicamento}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  <strong>Dosis:</strong> {det.dosis} • <strong>Frecuencia:</strong> {det.frecuencia}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  <strong>Duración:</strong> {det.duracion}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. PESTAÑA: ANTECEDENTES MÉDICOS */}
              {activeTab === 'antecedentes' && (
                <div className="space-y-4">
                  {antecedentes.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium">No se han registrado antecedentes clínicos todavía.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {antecedentes.map((a) => (
                        <div
                          key={a.id_antecedente}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{a.nombre}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                a.tipo === 'ALERGICO'
                                  ? 'bg-rose-100 text-rose-800'
                                  : a.tipo === 'PATOLOGICO'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {a.tipo}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                            <p>
                              <strong>Severidad:</strong> {a.severidad || 'No especificada'} •{' '}
                              <strong>Estado:</strong> {a.estado || 'ACTIVO'}
                            </p>
                            {a.observaciones && (
                              <p className="text-slate-500 text-[11px] italic mt-1">
                                {a.observaciones}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. PESTAÑA: DOCUMENTOS CLÍNICOS ADJUNTOS (CU26) */}
              {activeTab === 'documentos' && (
                <ClinicalDocumentsSection
                  historialId={historiaClinica?.id_historia_clinica || historiaClinica?.id_historia}
                  historialEstado={historiaClinica?.estado || 'ACTIVO'}
                  onDocumentChange={(docs) => setDocsCount(docs.length)}
                />
              )}

              {/* 5. PESTAÑA: CONTACTOS DE EMERGENCIA */}
              {activeTab === 'contactos' && (
                <div className="space-y-4">
                  {(!paciente.contactos_emergencia || paciente.contactos_emergencia.length === 0) ? (
                    <div className="py-12 text-center text-slate-500">
                      <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium">No se registraron contactos de emergencia para este paciente.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {paciente.contactos_emergencia.map((c, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                        >
                          <p className="font-bold text-slate-900 text-sm">{c.nombre_completo || c.nombres}</p>
                          <p className="text-slate-600">
                            <strong>Parentesco:</strong> {c.relacion_parentesco || c.parentesco || 'Familiar'}
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5 mt-1 font-mono font-semibold">
                            <Phone className="w-3.5 h-3.5 text-teal-600" />
                            {c.telefono || 'Sin número'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL DETALLE DE RECETA MEMBRETADA */}
      <RecetaDetailModal
        receta={selectedReceta}
        isOpen={isRecetaModalOpen}
        onClose={() => {
          setIsRecetaModalOpen(false);
          setSelectedReceta(null);
        }}
      />

      {/* MODAL GESTOR DE ANTECEDENTES */}
      <AntecedentesPatientModal
        isOpen={isAntecedentesModalOpen}
        onClose={() => setIsAntecedentesModalOpen(false)}
        patient={paciente}
        onUpdated={() => loadExpedienteData()}
      />
    </div>
  );
}

export default ExpedienteClinicoView;

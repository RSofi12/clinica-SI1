import { useState, useEffect, useMemo, useRef } from 'react';
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
  Paperclip,
  X,
  Check,
  Edit2,
  Plus,
  Power,
  Scissors,
  Users
} from 'lucide-react';
import { expedienteService } from '../services/expedienteService';
import { antecedenteService } from '../services/antecedenteService';
import { patientService } from '../../clinical-resources/services/patientService';
import { useAuth } from '../../../context/AuthContext';
import RecetaDetailModal from './RecetaDetailModal';
import { AntecedentesPatientModal } from './AntecedentesPatientModal';
import { AntecedenteFormModal } from './AntecedenteFormModal';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
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

  // Estados de Gestión de Antecedentes Médicos (CU17)
  const [isAntecedenteFormOpen, setIsAntecedenteFormOpen] = useState(false);
  const [antecedenteToEdit, setAntecedenteToEdit] = useState(null);
  const [antecedenteFilterType, setAntecedenteFilterType] = useState('TODOS');
  const [showInactiveAntecedentes, setShowInactiveAntecedentes] = useState(false);
  const [isTogglingAntecedente, setIsTogglingAntecedente] = useState({});

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

  // Configuración de Categorías de Antecedentes (CU17)
  const CATEGORIA_CONFIG = useMemo(() => ({
    ALERGICO: {
      label: 'Alérgico',
      icon: AlertTriangle,
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      borderCard: 'border-l-4 border-l-rose-500',
    },
    PATOLOGICO: {
      label: 'Patológico',
      icon: Activity,
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
      borderCard: 'border-l-4 border-l-blue-500',
    },
    QUIRURGICO: {
      label: 'Quirúrgico',
      icon: Scissors,
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/80',
      borderCard: 'border-l-4 border-l-purple-500',
    },
    FARMACOLOGICO: {
      label: 'Farmacológico',
      icon: Pill,
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      borderCard: 'border-l-4 border-l-emerald-500',
    },
    FAMILIAR: {
      label: 'Familiar',
      icon: Users,
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      borderCard: 'border-l-4 border-l-amber-500',
    },
  }), []);

  // Filtrado de Antecedentes por Tipo y Estado (CU17)
  const visibleAntecedentes = useMemo(() => {
    return antecedentes.filter((a) => {
      const tipo = (a.tipo_antecedente || a.tipo || '').toUpperCase();
      if (antecedenteFilterType !== 'TODOS' && tipo !== antecedenteFilterType) {
        return false;
      }
      if (!showInactiveAntecedentes && a.estado === 'INACTIVO') {
        return false;
      }
      return true;
    });
  }, [antecedentes, antecedenteFilterType, showInactiveAntecedentes]);

  // Contadores de antecedentes por tipo
  const conteosAntecedentes = useMemo(() => {
    const counts = { TODOS: antecedentes.length, ALERGICO: 0, PATOLOGICO: 0, QUIRURGICO: 0, FARMACOLOGICO: 0, FAMILIAR: 0, INACTIVOS: 0 };
    antecedentes.forEach((a) => {
      const tipo = (a.tipo_antecedente || a.tipo || '').toUpperCase();
      if (counts[tipo] !== undefined) counts[tipo]++;
      if (a.estado === 'INACTIVO') counts.INACTIVOS++;
    });
    return counts;
  }, [antecedentes]);

  // Handlers de Antecedentes (CU17)
  const handleCreateAntecedente = () => {
    setAntecedenteToEdit(null);
    setIsAntecedenteFormOpen(true);
  };

  const handleEditAntecedente = (a) => {
    setAntecedenteToEdit(a);
    setIsAntecedenteFormOpen(true);
  };

  const handleToggleAntecedenteStatus = async (a) => {
    try {
      setIsTogglingAntecedente((prev) => ({ ...prev, [a.id_antecedente]: true }));
      const res = await antecedenteService.toggleAntecedenteStatus(a.id_antecedente);
      if (res && res.success) {
        await loadExpedienteData();
      }
    } catch (err) {
      console.error('Error al alternar estado de antecedente:', err);
    } finally {
      setIsTogglingAntecedente((prev) => ({ ...prev, [a.id_antecedente]: false }));
    }
  };

  const handleAntecedenteSaved = async () => {
    setIsAntecedenteFormOpen(false);
    setAntecedenteToEdit(null);
    await loadExpedienteData();
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

  // Paciente seleccionado actualmente
  const currentSelectedPatient = useMemo(() => {
    return patientsList.find((p) => p.id_paciente === selectedPatientId) || null;
  }, [patientsList, selectedPatientId]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Seleccionar paciente
  const handleSelectPatient = (p) => {
    setSelectedPatientId(p.id_paciente);
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  // Manejo de teclado (Enter para seleccionar el primer resultado, Esc para cerrar)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPatients.length > 0) {
        handleSelectPatient(filteredPatients[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

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

        {/* SELECTOR PARA PERSONAL MÉDICO / ADMIN (BUSCADOR INTELIGENTE CON AUTOCOMPLETADO) */}
        {isStaff && (
          <div className="mt-4 pt-2 print:hidden" ref={searchContainerRef}>
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50/80 p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
                {/* Input de Búsqueda */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por apellido, nombre, CI o N° Historia..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!isSearchOpen) setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-9 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition shadow-2xs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Paciente Activo Badge / Botón Selector Rápido */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="inline-flex items-center justify-between sm:justify-start gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs shrink-0"
                  title="Cambiar paciente seleccionado"
                >
                  <div className="flex items-center gap-2 truncate max-w-[240px] sm:max-w-[280px]">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                    <span className="text-slate-400 text-[11px] font-normal">Expediente:</span>
                    <span className="font-semibold text-slate-900 truncate">
                      {currentSelectedPatient
                        ? `${currentSelectedPatient.apellidos}, ${currentSelectedPatient.nombres}`
                        : 'Seleccionar paciente...'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isSearchOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown flotante con Autocompletado */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-98 duration-150">
                  <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>
                      {filteredPatients.length} paciente{filteredPatients.length === 1 ? '' : 's'} encontrado{filteredPatients.length === 1 ? '' : 's'}
                      {searchTerm ? ` para "${searchTerm}"` : ' en el padrón activo'}
                    </span>
                    <span className="text-[10px] text-slate-400">Clic o Enter para cargar expediente</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">No se encontraron pacientes</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          No hay coincidencias para "{searchTerm}". Intente con otro término o CI.
                        </p>
                      </div>
                    ) : (
                      filteredPatients.map((p) => {
                        const isSelected = p.id_paciente === selectedPatientId;
                        return (
                          <button
                            key={p.id_paciente}
                            type="button"
                            onClick={() => handleSelectPatient(p)}
                            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                              isSelected
                                ? 'bg-teal-50/90 text-teal-950 font-medium'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar */}
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isSelected
                                    ? 'bg-teal-700 text-white shadow-2xs'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {p.nombres?.charAt(0)}
                                {p.apellidos?.charAt(0)}
                              </div>

                              {/* Datos del Paciente */}
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-900 truncate">
                                    {p.apellidos}, {p.nombres}
                                  </span>
                                  {isSelected && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-200/80 text-teal-800">
                                      Cargado
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                  <span className="font-mono text-slate-600">CI: {p.numero_documento}</span>
                                  <span>•</span>
                                  <span className="font-mono text-teal-700 font-semibold">{p.numero_historia || `HC-${p.id_paciente}`}</span>
                                  {p.fecha_nacimiento && (
                                    <>
                                      <span>•</span>
                                      <span>{p.sexo_biologico || p.sexo || ''}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Checkmark a la derecha si está seleccionado */}
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-slate-400 hover:text-teal-600 shrink-0">
                                Seleccionar
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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
                          {alergia.descripcion || alergia.nombre}
                          <span className="text-[10px] font-medium text-rose-500">
                            (ALERTA MÉDICA)
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

              {/* 4. PESTAÑA: GESTIÓN DE ANTECEDENTES MÉDICOS (CU17) */}
              {activeTab === 'antecedentes' && (
                <div className="space-y-6">
                  {/* BARRA DE HERRAMIENTAS Y ACCIONES DE CU17 */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            Antecedentes Clínicos del Paciente
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            {antecedentes.length} {antecedentes.length === 1 ? 'registro' : 'registros'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Trazabilidad de alergias, patologías crónicas, intervenciones quirúrgicas y medicación habitual (CU17).
                        </p>
                      </div>

                      {isStaff && (
                        <button
                          type="button"
                          onClick={handleCreateAntecedente}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition shadow-xs shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          Registrar Antecedente
                        </button>
                      )}
                    </div>

                    {/* FILTROS POR TIPO Y SWITCH DE INACTIVOS */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAntecedenteFilterType('TODOS')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            antecedenteFilterType === 'TODOS'
                              ? 'bg-slate-800 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          Todos ({conteosAntecedentes.TODOS})
                        </button>

                        {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => {
                          const Icon = config.icon;
                          const isActive = antecedenteFilterType === key;
                          const count = conteosAntecedentes[key] || 0;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setAntecedenteFilterType(key)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                                isActive
                                  ? `${config.badge} font-bold ring-2 ring-teal-600/20`
                                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{config.label}</span>
                              <span className="text-[10px] opacity-75 font-mono">({count})</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Switch de Inactivos (Baja lógica RN11) */}
                      {conteosAntecedentes.INACTIVOS > 0 && (
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 transition select-none">
                          <input
                            type="checkbox"
                            checked={showInactiveAntecedentes}
                            onChange={(e) => setShowInactiveAntecedentes(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                          />
                          <span>Mostrar inactivos ({conteosAntecedentes.INACTIVOS})</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* LISTADO DE ANTECEDENTES */}
                  {visibleAntecedentes.length === 0 ? (
                    <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                      <h4 className="text-sm font-bold text-slate-800">
                        {antecedenteFilterType !== 'TODOS'
                          ? `Sin antecedentes de tipo ${CATEGORIA_CONFIG[antecedenteFilterType]?.label || antecedenteFilterType}`
                          : 'No se han registrado antecedentes clínicos todavía'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {isStaff
                          ? 'Agregue antecedentes para construir el perfil clínico preventivo y de seguridad del paciente.'
                          : 'No figuran registros en esta categoría.'}
                      </p>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={handleCreateAntecedente}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Registrar antecedente ahora
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleAntecedentes.map((a) => {
                        const tipo = (a.tipo_antecedente || a.tipo || 'PATOLOGICO').toUpperCase();
                        const config = CATEGORIA_CONFIG[tipo] || CATEGORIA_CONFIG.PATOLOGICO;
                        const Icon = config.icon;
                        const isActivo = a.estado === 'ACTIVO';
                        const isToggling = Boolean(isTogglingAntecedente[a.id_antecedente]);

                        // Formateo de fecha de registro
                        const fechaStr = a.fecha_registro
                          ? new Date(a.fecha_registro).toLocaleDateString('es-BO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : (a.created_at ? new Date(a.created_at).toLocaleDateString('es-BO') : 'Fecha no registrada');

                        const registradorNombre = a.registrador
                          ? (a.registrador.medico
                              ? `Dr(a). ${a.registrador.medico.nombres} ${a.registrador.medico.apellidos || ''}`.trim()
                              : (a.registrador.nombres
                                  ? `Dr(a). ${a.registrador.nombres} ${a.registrador.apellidos || ''}`.trim()
                                  : `@${a.registrador.username}`))
                          : 'Personal Clínico';

                        return (
                          <div
                            key={a.id_antecedente}
                            className={`p-4 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-xs bg-white ${
                              isActivo
                                ? `${config.borderCard} border-slate-200/90`
                                : 'border-slate-200 bg-slate-50/70 opacity-75 border-l-4 border-l-slate-300'
                            }`}
                          >
                            {/* Cabecera de la Tarjeta */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${config.iconBg}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${config.badge}`}>
                                      {config.label}
                                    </span>
                                    {tipo === 'ALERGICO' && isActivo && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                        Alerta Prioritaria
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Badge de Estado */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${
                                  isActivo
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {isActivo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </div>

                            {/* Descripción Clínica */}
                            <p className="mt-3 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                              {a.descripcion || 'Sin descripción clínica registrada'}
                            </p>

                            {/* Pie de Auditoría y Acciones */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium truncate">
                                <div className="flex items-center gap-1 shrink-0">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{fechaStr}</span>
                                </div>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-1 truncate" title={registradorNombre}>
                                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{registradorNombre}</span>
                                </div>
                              </div>

                              {/* Acciones para Personal Médico / Admin */}
                              {isStaff && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleEditAntecedente(a)}
                                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                                    title="Editar antecedente"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={() => handleToggleAntecedenteStatus(a)}
                                    className={`p-1.5 rounded-lg transition ${
                                      isActivo
                                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                    title={isActivo ? 'Desactivar antecedente (baja lógica RN11)' : 'Reactivar antecedente'}
                                  >
                                    <Power className={`w-3.5 h-3.5 ${isToggling ? 'animate-spin' : ''}`} />
                                  </button>
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

      {/* MODAL DE REGISTRO / EDICIÓN DE ANTECEDENTE (CU17) */}
      <AntecedenteFormModal
        isOpen={isAntecedenteFormOpen}
        onClose={() => {
          setIsAntecedenteFormOpen(false);
          setAntecedenteToEdit(null);
        }}
        patientId={paciente?.id_paciente}
        patientName={`${paciente?.nombres || ''} ${paciente?.apellidos || ''}`.trim()}
        antecedenteToEdit={antecedenteToEdit}
        onAntecedenteSaved={handleAntecedenteSaved}
      />
    </div>
  );
}

export default ExpedienteClinicoView;

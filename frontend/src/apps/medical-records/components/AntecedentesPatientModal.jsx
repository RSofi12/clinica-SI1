import { useState, useEffect, useCallback } from 'react';
import { ModalPortal } from '../../../components/ModalPortal';
import {
  X,
  AlertTriangle,
  Activity,
  Scissors,
  Pill,
  Users,
  Plus,
  RefreshCw,
  Edit2,
  Power,
  ShieldAlert,
  Loader2,
  Calendar,
  User,
  History,
  CheckCircle2,
} from 'lucide-react';
import { antecedenteService } from '../services/antecedenteService';
import { AntecedenteFormModal } from './AntecedenteFormModal';
import { useAuth } from '../../../context/AuthContext';

const TABS = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'ALERGICO', label: 'Alérgicos', icon: AlertTriangle, color: 'text-rose-600' },
  { id: 'PATOLOGICO', label: 'Patológicos', icon: Activity, color: 'text-blue-600' },
  { id: 'QUIRURGICO', label: 'Quirúrgicos', icon: Scissors, color: 'text-purple-600' },
  { id: 'FARMACOLOGICO', label: 'Farmacológicos', icon: Pill, color: 'text-emerald-600' },
  { id: 'FAMILIAR', label: 'Familiares', icon: Users, color: 'text-amber-600' },
];

/**
 * Modal Integral de Consulta y Gestión de Antecedentes Médicos (CU17 / §3.4)
 */
export function AntecedentesPatientModal({
  isOpen,
  onClose,
  patient,
  onUpdated,
}) {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('TODOS');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [dataResponse, setDataResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modales secundarios
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [antecedenteToEdit, setAntecedenteToEdit] = useState(null);

  const canEdit = ['ADMIN', 'MEDICO'].includes(role);

  const loadAntecedentes = useCallback(async () => {
    if (!patient?.id_paciente) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await antecedenteService.fetchPatientAntecedentes(patient.id_paciente, {
        tipo: activeTab !== 'TODOS' ? activeTab : undefined,
        incluir_inactivos: incluirInactivos ? true : undefined,
      });

      if (res && res.success && res.data) {
        setDataResponse(res.data);
      } else {
        setErrorMsg(res?.message || 'Error al cargar antecedentes.');
      }
    } catch (err) {
      console.error('Error al cargar antecedentes del paciente:', err);
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [patient?.id_paciente, activeTab, incluirInactivos]);

  useEffect(() => {
    if (isOpen && patient?.id_paciente) {
      loadAntecedentes();
    }
  }, [isOpen, patient?.id_paciente, loadAntecedentes]);

  if (!isOpen || !patient) return null;

  // Toggle status de baja lógica (RN11)
  const handleToggleStatus = async (item) => {
    try {
      const res = await antecedenteService.toggleAntecedenteStatus(item.id_antecedente);
      if (res && res.success) {
        const accion = item.estado === 'ACTIVO' ? 'desactivado' : 'reactivado';
        setSuccessToast(`Antecedente ${accion} correctamente (RN11).`);
        setTimeout(() => setSuccessToast(''), 3500);
        loadAntecedentes();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error('Error al alternar estado del antecedente:', err);
      setErrorMsg(err.message || 'Error al modificar estado del antecedente.');
    }
  };

  const antecedentes = dataResponse?.antecedentes || [];
  const tieneAlergias = dataResponse?.tiene_alergias;
  const alergiasActivas = antecedentes.filter(
    (a) => a.tipo_antecedente === 'ALERGICO' && a.estado === 'ACTIVO'
  );

  const getCategoryConfig = (tipo) => {
    switch (tipo) {
      case 'ALERGICO':
        return {
          label: 'Alérgico',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500',
          icon: AlertTriangle,
        };
      case 'PATOLOGICO':
        return {
          label: 'Patológico',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          dotClass: 'bg-blue-500',
          icon: Activity,
        };
      case 'QUIRURGICO':
        return {
          label: 'Quirúrgico',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
          dotClass: 'bg-purple-500',
          icon: Scissors,
        };
      case 'FARMACOLOGICO':
        return {
          label: 'Farmacológico',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500',
          icon: Pill,
        };
      case 'FAMILIAR':
        return {
          label: 'Familiar',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
          icon: Users,
        };
      default:
        return {
          label: tipo,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-500',
          icon: Activity,
        };
    }
  };

  return (
    <>
      <ModalPortal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-3xl"
        panelClassName="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-modal-panel flex flex-col max-h-[92vh]"
      >
        {/* Header institucional */}
        <div className="bg-gradient-to-r from-[#003d47] via-[#005a69] to-[#00687a] p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <ShieldAlert className="w-6 h-6 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono tracking-widest text-cyan-200 uppercase font-semibold">
                    Expediente Clínico Digital • CU17
                  </span>
                  {patient.numero_historia && (
                    <span className="font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                      HC: {patient.numero_historia}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold font-serif-clinical font-normal tracking-tight text-white mt-0.5">
                  Antecedentes Médicos del Paciente
                </h3>
                <span className="text-xs text-cyan-100 block">
                  {patient.nombres} {patient.apellidos} · Doc: {patient.numero_documento || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setAntecedenteToEdit(null);
                    setIsFormOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-[#005a69] hover:bg-cyan-50 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner crítico si existen alergias activas */}
          {tieneAlergias && alergiasActivas.length > 0 && (
            <div className="mt-4 p-3 bg-rose-500/20 border border-rose-300/40 rounded-2xl flex items-center gap-3 text-xs text-rose-100 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <strong className="block text-white font-bold leading-tight">
                  Alerta Asistencial: Paciente con {alergiasActivas.length} alergia(s) registradas
                </strong>
                <span className="text-[11px] text-rose-200 truncate block">
                  Revisar contraindicaciones antes de recetar o administrar medicamentos.
                </span>
              </div>
            </div>
          )}

          {/* Toast de éxito temporal */}
          {successToast && (
            <div className="mt-2 p-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Pestañas de Filtrado por Categoría */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/15 pt-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#005a69] shadow-sm'
                      : 'bg-white/10 hover:bg-white/15 text-white/90'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar de filtros e indicadores */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              {antecedentes.length} {antecedentes.length === 1 ? 'antecedente' : 'antecedentes'} en lista
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-600">
              <input
                type="checkbox"
                checked={incluirInactivos}
                onChange={(e) => setIncluirInactivos(e.target.checked)}
                className="rounded border-slate-300 text-[#005a69] focus:ring-[#005a69] w-3.5 h-3.5"
              />
              <span>Mostrar inactivos / resueltos (RN11)</span>
            </label>

            <button
              type="button"
              onClick={loadAntecedentes}
              disabled={isLoading}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              title="Recargar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con lista de antecedentes */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-[#00687a] animate-spin" />
              <span className="text-xs">Consultando expediente clínico...</span>
            </div>
          ) : antecedentes.length === 0 ? (
            <div className="py-14 text-center text-slate-400 space-y-2 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Sin antecedentes registrados</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {activeTab === 'ALERGICO'
                  ? 'No se registran alergias activas para este paciente (NKDA - No Known Drug Allergies).'
                  : `No hay antecedentes registrados en la categoría ${activeTab.toLowerCase()}.`}
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setAntecedenteToEdit(null);
                    setIsFormOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#005a69] hover:bg-[#004d5a] text-white font-bold rounded-xl transition text-xs shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar primer antecedente</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {antecedentes.map((item) => {
                const cfg = getCategoryConfig(item.tipo_antecedente);
                const Icon = cfg.icon;
                const isInactivo = item.estado === 'INACTIVO';
                const fechaStr = item.fecha_registro
                  ? new Date(item.fecha_registro).toLocaleDateString('es-BO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <div
                    key={item.id_antecedente}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                      isInactivo
                        ? 'bg-slate-50/70 border-slate-200/70 opacity-60'
                        : item.tipo_antecedente === 'ALERGICO'
                        ? 'bg-rose-50/40 border-rose-200/90 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isInactivo
                            ? 'bg-slate-200 text-slate-500'
                            : item.tipo_antecedente === 'ALERGICO'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-[#005a69]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                            {cfg.label}
                          </span>

                          {isInactivo ? (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-semibold">
                              Inactivo / Resuelto
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                              Activo
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {fechaStr}
                          </span>
                        </div>

                        <p className={`text-xs font-semibold leading-relaxed ${isInactivo ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {item.descripcion}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>
                            Registrado por:{' '}
                            <strong className="text-slate-600">
                              {item.registrador?.nombres ? `Dr(a). ${item.registrador.nombres} ${item.registrador.apellidos || ''}` : item.registrador?.username || 'Personal Médico'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones para Médicos / Admin */}
                    {canEdit && (
                      <div className="flex items-center gap-1.5 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setAntecedenteToEdit(item);
                            setIsFormOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-[#005a69] hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Editar descripción del antecedente"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                            isInactivo
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                          title={isInactivo ? 'Reactivar antecedente clínico' : 'Desactivar antecedente (Baja lógica RN11)'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isInactivo ? 'Reactivar' : 'Desactivar'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500 italic">
            * Conforme a la regla RN11, las modificaciones quedan preservadas cronológicamente para auditoría médica legal.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </ModalPortal>

      {/* Modal Secundario de Alta / Edición */}
      <AntecedenteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setAntecedenteToEdit(null);
        }}
        patientId={patient.id_paciente}
        patientName={`${patient.nombres} ${patient.apellidos}`}
        antecedenteToEdit={antecedenteToEdit}
        onAntecedenteSaved={() => {
          loadAntecedentes();
          if (onUpdated) onUpdated();
        }}
      />
    </>
  );
}

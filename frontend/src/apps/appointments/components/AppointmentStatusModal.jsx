import { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  ArrowRight,
  History,
  User,
  Stethoscope,
  Building2,
  Calendar,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';

/**
 * Modal de Registro de Asistencia y Máquina de Estados de Citas Médicas (CU13 / RF10)
 * Paquete 3: Gestión de Citas Médicas
 * 
 * Permite a Recepcionistas, Médicos y Administradores transicionar el ciclo de vida
 * de la cita (Confirmación de asistencia, llamado a atención o inasistencia)
 * con validación atómica, registro cronológico de trazabilidad y auditoría.
 */
export function AppointmentStatusModal({
  isOpen,
  onClose,
  appointment,
  initialAction = null, // 'CONFIRMADA' | 'ATENDIDA' | 'INASISTENCIA' | 'HISTORIAL'
  onStatusUpdated,
  currentRole = 'RECEPCIONISTA',
}) {
  const [targetStatus, setTargetStatus] = useState('');
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pestañas: 'transicion' | 'historial'
  const [activeTab, setActiveTab] = useState('transicion');
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Mapeo semántico de estados oficiales (CU13)
  const STATUS_CONFIG = {
    PROGRAMADA: {
      label: 'Programada',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      dotClass: 'bg-sky-500',
      description: 'Cita agendada, esperando arribo del paciente a la clínica.',
    },
    PENDIENTE: {
      label: 'Pendiente',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      dotClass: 'bg-sky-500',
      description: 'Cita en espera de confirmación presencial.',
    },
    CONFIRMADA: {
      label: 'En Sala de Espera',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
      description: 'Paciente presente en mostrador, esperando llamado a consultorio.',
    },
    ATENDIDA: {
      label: 'Atendida',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotClass: 'bg-emerald-500',
      description: 'Consulta médica completada satisfactoriamente (Estado terminal).',
    },
    CANCELADA: {
      label: 'Cancelada',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
      description: 'Cita cancelada con motivo registrado y cupo liberado.',
    },
    INASISTENCIA: {
      label: 'Inasistencia',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      dotClass: 'bg-rose-500',
      description: 'El paciente no acudió a su turno en el horario programado (Estado terminal).',
    },
  };

  // Cargar historial de cambios de estado (CU13 / RF10)
  const loadHistory = useCallback(async (citaId) => {
    if (!citaId) return;
    setIsLoadingHistory(true);
    try {
      const res = await appointmentService.fetchStatusHistory(citaId);
      if (res && res.success && res.data) {
        setHistoryList(res.data.historial || []);
      }
    } catch (err) {
      console.error('Error al cargar historial de estados:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      setErrorMsg('');
      setObservacion('');

      // Determinar acción inicial
      if (initialAction === 'HISTORIAL') {
        setActiveTab('historial');
        setTargetStatus('');
      } else if (initialAction && ['CONFIRMADA', 'ATENDIDA', 'INASISTENCIA'].includes(initialAction)) {
        setActiveTab('transicion');
        setTargetStatus(initialAction);
      } else {
        setActiveTab('transicion');
        // Sugerir la transición más lógica según estado actual
        if (['PROGRAMADA', 'PENDIENTE'].includes(appointment.estado)) {
          setTargetStatus('CONFIRMADA');
        } else if (appointment.estado === 'CONFIRMADA') {
          setTargetStatus(currentRole === 'MEDICO' ? 'ATENDIDA' : 'INASISTENCIA');
        } else {
          setTargetStatus('');
        }
      }

      loadHistory(appointment.id_cita);
    }
  }, [isOpen, appointment, initialAction, currentRole, loadHistory]);

  if (!isOpen || !appointment) return null;

  const estadoActual = appointment.estado || 'PROGRAMADA';
  const esTerminal = ['ATENDIDA', 'CANCELADA', 'INASISTENCIA'].includes(estadoActual);

  // Transiciones legales según la máquina de estados del backend
  const availableTransitions = [];
  if (['PROGRAMADA', 'PENDIENTE'].includes(estadoActual)) {
    if (currentRole !== 'MEDICO') {
      availableTransitions.push({
        id: 'CONFIRMADA',
        title: 'Confirmar Asistencia (Check-in)',
        subtitle: 'El paciente llegó a la clínica y pasa a sala de espera',
        icon: UserCheck,
        color: 'amber',
        btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      });
    }
    availableTransitions.push({
      id: 'INASISTENCIA',
      title: 'Marcar Inasistencia',
      subtitle: 'El paciente no se presentó al turno programado',
      icon: UserX,
      color: 'rose',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    });
  } else if (estadoActual === 'CONFIRMADA') {
    if (['ADMIN', 'MEDICO'].includes(currentRole)) {
      availableTransitions.push({
        id: 'ATENDIDA',
        title: 'Completar Atención Médica',
        subtitle: 'El paciente ingresó y fue atendido en consulta',
        icon: CheckCircle2,
        color: 'emerald',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      });
    }
    availableTransitions.push({
      id: 'INASISTENCIA',
      title: 'Marcar Abandono / Inasistencia',
      subtitle: 'El paciente se retiró antes del llamado',
      icon: UserX,
      color: 'rose',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    });
  }

  // Manejar el submit de transición
  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    if (!targetStatus) {
      setErrorMsg('Por favor seleccione el nuevo estado para la cita médica.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        nuevo_estado: targetStatus,
        observacion: observacion.trim() || null,
      };

      const res = await appointmentService.updateStatus(appointment.id_cita, payload);

      if (res && res.success) {
        if (onStatusUpdated) {
          onStatusUpdated(res.data);
        }
        onClose();
      } else {
        setErrorMsg(res?.message || 'No fue posible actualizar el estado de la cita.');
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setErrorMsg(err.message || 'Error de conexión al procesar el cambio de estado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCfg = STATUS_CONFIG[estadoActual] || STATUS_CONFIG.PROGRAMADA;
  const targetCfg = targetStatus ? STATUS_CONFIG[targetStatus] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Encabezado con estética clínica formal */}
        <div className="bg-gradient-to-r from-[#003d47] via-[#005a69] to-[#00687a] p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Clock className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono tracking-widest text-cyan-200 uppercase font-semibold">
                    Control de Ciclo de Vida • RF10
                  </span>
                  <span className="font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                    {appointment.codigo_cita}
                  </span>
                </div>
                <h3 className="text-lg font-bold font-montserrat text-white mt-0.5">
                  Gestión de Asistencia y Estado
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ficha Resumida del Paciente y Cita */}
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-50">
              <User className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="truncate font-semibold">
                {appointment.paciente?.nombres} {appointment.paciente?.apellidos}
              </span>
            </div>
            <div className="flex items-center gap-2 text-cyan-50">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="truncate">
                Dr. {appointment.medico?.apellidos || 'Médico'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-cyan-50 col-span-2 sm:col-span-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="font-mono text-[11px]">
                {appointment.hora_inicio_formateada || appointment.fecha_hora_inicio?.substring(11, 16)}
              </span>
            </div>
          </div>

          {/* Selector de Pestañas (Transición vs Historial) */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('transicion')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'transicion'
                  ? 'bg-white text-[#005a69] shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-white/90'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Transición de Estado</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-white text-[#005a69] shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-white/90'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial de Trazabilidad ({historyList.length})</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con scroll independiente */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 text-xs">
                <strong className="block font-bold">Operación rechazada</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {activeTab === 'transicion' ? (
            esTerminal ? (
              <div className="text-center py-8 space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-slate-600" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">
                  Estado Terminal Alcanzado: {currentCfg.label}
                </h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Esta cita médica se encuentra en estado <strong>{estadoActual}</strong>. De acuerdo con las reglas de negocio de la máquina de estados (RF10 / RN10), los estados terminales son inmutables y no admiten transiciones adicionales.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('historial')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  <History className="w-3.5 h-3.5 text-[#00687a]" />
                  <span>Ver registro cronológico de la cita</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitStatus} className="space-y-5">
                {/* Comparativa Visual: Antes ➔ Después */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <span className="text-slate-400 font-medium text-[11px] block">Actual:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${currentCfg.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${currentCfg.dotClass}`} />
                      {currentCfg.label}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <span className="text-slate-400 font-medium text-[11px] block">Nuevo:</span>
                    {targetCfg ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${targetCfg.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${targetCfg.dotClass}`} />
                        {targetCfg.label}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Seleccione estado</span>
                    )}
                  </div>
                </div>

                {/* Opciones de Transición Disponibles */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Seleccione la acción a registrar:
                  </label>

                  {availableTransitions.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      No hay transiciones manuales disponibles para su rol ({currentRole}) en este estado.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {availableTransitions.map((trans) => {
                        const Icon = trans.icon;
                        const isSelected = targetStatus === trans.id;
                        return (
                          <button
                            key={trans.id}
                            type="button"
                            onClick={() => setTargetStatus(trans.id)}
                            className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-[#005a69]/5 border-[#005a69] shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-[#005a69] text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className={`font-bold block text-xs ${isSelected ? 'text-[#005a69]' : 'text-slate-800'}`}>
                                  {trans.title}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  {trans.subtitle}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-[#005a69] bg-[#005a69] text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Campo de Observación */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="observacion-estado" className="block text-xs font-bold text-slate-800">
                      Observación / Motivo del cambio
                      {targetStatus === 'INASISTENCIA' && (
                        <span className="text-rose-600 font-bold ml-1">(Recomendado)</span>
                      )}
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {observacion.length} / 255
                    </span>
                  </div>
                  <textarea
                    id="observacion-estado"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    maxLength={255}
                    rows={2}
                    placeholder={
                      targetStatus === 'INASISTENCIA'
                        ? 'Indique motivo de inasistencia (ej. paciente no respondió al llamado de recepción)...'
                        : targetStatus === 'CONFIRMADA'
                        ? 'Ej. Paciente ingresó a recepción, turno en orden...'
                        : 'Observaciones clínicas o administrativas opcionales...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005a69] text-xs resize-none bg-white transition"
                  />
                </div>

                {/* Botones de Acción */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !targetStatus}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#005a69] to-[#007b8f] hover:brightness-105 text-white font-bold text-xs shadow-md shadow-[#005a69]/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar Transición</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Pestaña de Historial de Estados (Trazabilidad RUP/PUDS) */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium text-xs">
                  Registro cronológico de auditoría y máquina de estados
                </span>
                <span className="font-mono text-[11px] text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md font-bold">
                  {historyList.length} eventos
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#00687a] animate-spin" />
                  <span className="text-xs">Cargando trazabilidad...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-1">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-xs">Sin cambios de estado previos</p>
                  <p className="text-[11px] text-slate-500">
                    Esta cita mantiene su estado inicial desde la creación.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {historyList.map((item, idx) => {
                    const cfgNuevo = STATUS_CONFIG[item.estado_nuevo] || STATUS_CONFIG.PROGRAMADA;
                    const cfgAnt = item.estado_anterior ? STATUS_CONFIG[item.estado_anterior] || STATUS_CONFIG.PROGRAMADA : null;
                    const fechaStr = item.fecha_cambio ? new Date(item.fecha_cambio).toLocaleString('es-BO') : '—';

                    return (
                      <div key={item.id_historial || idx} className="relative group">
                        {/* Nodo del timeline */}
                        <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${cfgNuevo.dotClass}`} />

                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {cfgAnt && (
                                <>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfgAnt.badgeClass}`}>
                                    {cfgAnt.label}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-slate-400" />
                                </>
                              )}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfgNuevo.badgeClass}`}>
                                {cfgNuevo.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {fechaStr}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              Por: <strong>{item.usuario?.nombres ? `${item.usuario.nombres} ${item.usuario.apellidos || ''}` : item.usuario?.username || 'Sistema'}</strong> ({item.usuario?.rol || 'OPERADOR'})
                            </span>
                          </div>

                          {item.observacion && (
                            <p className="mt-1.5 text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200/60 italic">
                              "{item.observacion}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

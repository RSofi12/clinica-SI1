import { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  Ban,
  FileText,
  Printer,
  RefreshCw,
  Video,
  Sparkles,
  Phone,
  HeartPulse,
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import { AppointmentCancelModal } from './AppointmentCancelModal';

/**
 * Modal de Historial Cronológico de Citas del Paciente (CU15 / RF12 / Prueba #7)
 * Paquete 3: Gestión de Citas Médicas
 */
export function PatientAppointmentHistoryModal({
  isOpen,
  onClose,
  patientId,
  patientInitial = null,
  onOpenTicket = null,
}) {
  const [patientData, setPatientData] = useState(patientInitial);
  const [metrics, setMetrics] = useState({
    total_citas: 0,
    atendidas: 0,
    canceladas: 0,
    pendientes: 0,
    tasa_asistencia: 0,
    primera_cita_fecha: null,
    ultima_cita_fecha: null,
  });
  const [citasList, setCitasList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cancelación directa (CU12)
  const [cancellingAppointment, setCancellingAppointment] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!patientId && !patientInitial?.id_paciente) return;
    const targetId = patientId || patientInitial?.id_paciente;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await appointmentService.fetchPatientHistory(targetId, {
        estado: filterStatus !== 'TODOS' ? filterStatus : undefined,
      });

      if (res?.success && res.data) {
        setPatientData(res.data.paciente);
        setMetrics(res.data.metrics || {});
        setCitasList(res.data.citas || []);
      } else {
        setErrorMsg(res?.message || 'Error al obtener el historial médico del paciente.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al comunicarse con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, patientInitial, filterStatus]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  if (!isOpen) return null;

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTimeDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Programada
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Confirmada
          </span>
        );
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <BadgeCheck className="w-3 h-3 text-cyan-600" />
            Atendida
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3 h-3 text-rose-500" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-cyan-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-montserrat">Historial de Citas Médicas</h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-md uppercase">
                  CU15 / RF12
                </span>
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                Cronología completa de atenciones previas, vigentes y cancelaciones sin pérdida de datos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-cyan-200 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha Resumida del Paciente y KPIs */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00687a]/10 text-[#00687a] font-bold flex items-center justify-center text-sm shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {patientData?.nombres} {patientData?.apellidos}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">Doc: {patientData?.numero_documento || '—'}</span>
                  {patientData?.numero_historia && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-bold text-[#00687a]">
                        HC: {patientData.numero_historia}
                      </span>
                    </>
                  )}
                  {patientData?.telefono && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {patientData.telefono}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Filtro por Estado */}
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] text-slate-700 cursor-pointer shadow-xs"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ATENDIDA">Atendidas</option>
                <option value="PENDIENTE">Programadas</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>

              <button
                type="button"
                onClick={loadHistory}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer shadow-xs"
                title="Recargar historial"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00687a]' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 Métricas de Historial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Histórico
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {metrics.total_citas} citas
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/20 shadow-2xs">
              <span className="text-[10px] font-bold text-[#00687a] uppercase tracking-wider block">
                Atendidas (% Éxito)
              </span>
              <span className="text-base font-extrabold text-[#00687a] mt-0.5 block">
                {metrics.atendidas} ({metrics.tasa_asistencia}%)
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Por Atender
              </span>
              <span className="text-base font-extrabold text-amber-800 mt-0.5 block">
                {metrics.pendientes}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                Canceladas
              </span>
              <span className="text-base font-extrabold text-rose-700 mt-0.5 block">
                {metrics.canceladas}
              </span>
            </div>
          </div>
        </div>

        {/* Lista Cronológica con Scroll Independiente */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin" />
              <span className="text-xs">Cargando cronología de citas...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center text-rose-600 text-xs">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <span>{errorMsg}</span>
            </div>
          ) : citasList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <History className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-slate-700 text-sm">Sin historial de citas</p>
              <p className="text-xs text-slate-500">
                El paciente no registra citas médicas bajo el filtro seleccionado.
              </p>
            </div>
          ) : (
            citasList.map((cita) => {
              const puedeCancelar = ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado);

              return (
                <div
                  key={cita.id_cita}
                  className={`p-4 rounded-xl border transition space-y-2.5 ${
                    cita.estado === 'CANCELADA'
                      ? 'bg-slate-50 border-slate-200/80 opacity-80'
                      : 'bg-white border-slate-200/90 shadow-2xs hover:border-[#00687a]/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md border border-[#00687a]/20">
                        {cita.codigo_cita}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateDisplay(cita.fecha_hora_inicio)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {formatTimeDisplay(cita.fecha_hora_inicio)} - {formatTimeDisplay(cita.fecha_hora_fin)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div>{getStatusBadge(cita.estado)}</div>
                      {onOpenTicket && (
                        <button
                          type="button"
                          onClick={() => onOpenTicket(cita)}
                          className="p-1 text-slate-500 hover:text-[#00687a] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Ver Ticket de Cita"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {puedeCancelar && (
                        <button
                          type="button"
                          onClick={() => setCancellingAppointment(cita)}
                          className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition cursor-pointer flex items-center gap-1"
                          title="Cancelar cita médica (libera cupo)"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Stethoscope className="w-3.5 h-3.5 text-[#00687a] shrink-0" />
                      <span className="font-semibold">
                        Dr. {cita.medico?.nombres} {cita.medico?.apellidos}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cita.especialidad?.nombre || 'Medicina General'}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-medium">
                        {cita.tipo_cita?.nombre || 'Consulta'}
                      </span>
                    </div>
                  </div>

                  {/* Motivo de Consulta */}
                  {cita.motivo_consulta && (
                    <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Motivo de consulta:</strong> "{cita.motivo_consulta}"
                    </div>
                  )}

                  {/* Motivo de Cancelación Obligatorio (RF09 / RN09) */}
                  {cita.estado === 'CANCELADA' && (
                    <div className="text-[11px] text-rose-800 bg-rose-50/70 border border-rose-200 p-2 rounded-lg flex items-start gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Motivo de Cancelación:</span>{' '}
                        <span>{cita.motivo_cancelacion || 'No especificado'}</span>
                        {cita.cancelada_en && (
                          <span className="text-[10px] text-rose-500 block font-mono mt-0.5">
                            Cancelada el: {formatDateDisplay(cita.cancelada_en)} a las{' '}
                            {formatTimeDisplay(cita.cancelada_en)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cerrar Historial
          </button>
        </div>
      </div>

      {/* Modal de Cancelación (CU12) */}
      <AppointmentCancelModal
        isOpen={Boolean(cancellingAppointment)}
        onClose={() => setCancellingAppointment(null)}
        appointment={cancellingAppointment}
        onAppointmentCancelled={() => {
          setCancellingAppointment(null);
          loadHistory();
        }}
      />
    </div>
  );
}

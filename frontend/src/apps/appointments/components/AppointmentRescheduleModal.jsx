import { useState, useEffect, useCallback } from 'react';
import {
  X,
  CalendarClock,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Info,
  CalendarX,
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';

/**
 * Modal de Reprogramación de Cita Médica (CU11 / RF08)
 * Paquete 3: Gestión de Citas Médicas
 * 
 * Permite a Recepcionistas, Administradores y Pacientes cambiar la fecha/hora
 * de una cita confirmada o programada, validando disponibilidad anti-colisión
 * en tiempo real y registrando auditoría con motivo justificado.
 */
export function AppointmentRescheduleModal({
  isOpen,
  onClose,
  appointment,
  onAppointmentRescheduled,
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [availabilitySummary, setAvailabilitySummary] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [motivo, setMotivo] = useState('');

  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fecha mínima: Hoy en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Inicializar fecha cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      setErrorMsg('');
      setMotivo('');
      setSelectedSlot(null);

      // Si la fecha original es hoy o posterior, sugerimos la fecha actual de la cita o hoy
      const citaFecha = appointment.fecha_hora_inicio
        ? appointment.fecha_hora_inicio.substring(0, 10)
        : todayStr;
      
      const initialDate = citaFecha >= todayStr ? citaFecha : todayStr;
      setSelectedDate(initialDate);
    }
  }, [isOpen, appointment, todayStr]);

  // Cargar disponibilidad de turnos para el médico en la nueva fecha (CU09)
  const loadSlots = useCallback(async () => {
    if (!appointment?.id_medico || !selectedDate) return;

    setIsLoadingSlots(true);
    setErrorMsg('');
    try {
      const res = await appointmentService.fetchAvailability({
        medico_id: appointment.id_medico,
        fecha: selectedDate,
        especialidad_id: appointment.id_especialidad || undefined,
      });

      if (res?.success) {
        setAvailabilitySummary(res.data || null);
        setAvailabilitySlots(res.data?.slots || []);
        // Si el slot seleccionado previamente ya no existe o no está libre, deseleccionar
        if (selectedSlot) {
          const match = (res.data?.slots || []).find(
            (s) => s.hora_inicio === selectedSlot.hora_inicio && s.disponible
          );
          if (!match) setSelectedSlot(null);
        }
      } else {
        setAvailabilitySlots([]);
        setAvailabilitySummary(null);
        setErrorMsg(res?.message || 'No fue posible consultar los horarios del profesional.');
      }
    } catch (err) {
      setAvailabilitySlots([]);
      setAvailabilitySummary(null);
      setErrorMsg(err.message || 'Error de comunicación al consultar disponibilidad.');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [appointment?.id_medico, appointment?.id_especialidad, selectedDate, selectedSlot]);

  // Recargar turnos cada vez que cambia la fecha seleccionada
  useEffect(() => {
    if (isOpen && appointment?.id_medico && selectedDate) {
      loadSlots();
    }
  }, [isOpen, appointment?.id_medico, selectedDate, loadSlots]);

  if (!isOpen || !appointment) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMsg('');
    setSelectedSlot(null);
    setMotivo('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMotivo = motivo.trim();

    if (!selectedDate) {
      setErrorMsg('Debe seleccionar una nueva fecha para la cita.');
      return;
    }

    if (!selectedSlot) {
      setErrorMsg('Por favor seleccione un turno disponible de la lista.');
      return;
    }

    if (!cleanMotivo || cleanMotivo.length < 5) {
      setErrorMsg('El motivo de reprogramación es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        fecha: selectedDate,
        hora_inicio: selectedSlot.hora_inicio,
        duracion_minutos: selectedSlot.duracion_minutos || appointment.duracion_minutos || 30,
        motivo_reprogramacion: cleanMotivo,
      };

      const res = await appointmentService.rescheduleAppointment(appointment.id_cita, payload);

      if (res?.success) {
        if (onAppointmentRescheduled) {
          onAppointmentRescheduled(res.data || appointment);
        }
        handleClose();
      } else {
        setErrorMsg(res?.message || 'No fue posible reprogramar la cita médica.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error del servidor al procesar la reprogramación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formateadores de fecha y hora
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

  const formatSelectedDateHuman = (isoDate) => {
    if (!isoDate) return '';
    try {
      const [year, month, day] = isoDate.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return isoDate;
    }
  };

  const isFormValid =
    Boolean(selectedDate) &&
    Boolean(selectedSlot) &&
    motivo.trim().length >= 5 &&
    !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Cabecera con degradado distintivo de la clínica */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-[#70cbff] shadow-inner">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-montserrat tracking-tight">
                  Reprogramar Cita Médica
                </h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  CU11 / RF08
                </span>
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">
                Código de Cita: <span className="font-mono font-bold text-white">{appointment.codigo_cita}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-40"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll fluido */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* Alerta de Error si ocurre */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Ficha Resumen de la Cita Actual */}
          <div className="p-3.5 rounded-xl bg-[#e8f7f9]/50 border border-[#00687a]/15 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <div className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
                <User className="w-3.5 h-3.5 text-[#00687a]" />
                <span>Paciente</span>
              </div>
              <div className="font-bold text-slate-900 truncate">
                {appointment.paciente?.nombres} {appointment.paciente?.apellidos}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Doc: {appointment.paciente?.numero_documento || '—'}
                {appointment.paciente?.numero_historia && (
                  <span className="ml-2 text-[#00687a]">HC: {appointment.paciente?.numero_historia}</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-500 flex items-center gap-1.5 text-[11px] font-medium">
                <Stethoscope className="w-3.5 h-3.5 text-[#00687a]" />
                <span>Médico y Especialidad</span>
              </div>
              <div className="font-bold text-slate-900 truncate">
                Dr. {appointment.medico?.nombres} {appointment.medico?.apellidos}
              </div>
              <div className="text-[11px] text-[#00687a] font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{appointment.especialidad?.nombre || 'Medicina General'}</span>
              </div>
            </div>
          </div>

          {/* Comparativa Visual de Fechas (Diff Actual ➔ Nueva) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Transformación de Turno
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Horario Anterior */}
              <div className="flex-1 p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[10px] text-slate-400 font-semibold mb-1">HORARIO ACTUAL</div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateDisplay(appointment.fecha_hora_inicio)}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    {formatTimeDisplay(appointment.fecha_hora_inicio)} - {formatTimeDisplay(appointment.fecha_hora_fin)}
                  </span>
                </div>
              </div>

              {/* Indicador de Transición */}
              <div className="flex items-center justify-center text-[#00687a] py-1 sm:py-0">
                <div className="w-7 h-7 rounded-full bg-[#00687a]/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Horario Nuevo Propuesto */}
              <div
                className={`flex-1 p-2.5 rounded-lg border transition ${
                  selectedSlot
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-white border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-semibold mb-1 text-emerald-700">NUEVO HORARIO ELEGIDO</div>
                {selectedSlot ? (
                  <>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="capitalize">{formatSelectedDateHuman(selectedDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 font-mono mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>
                        {selectedSlot.hora_inicio} - {selectedSlot.hora_fin} ({selectedSlot.duracion_minutos || 30} min)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] italic py-1">Selecciona fecha y turno abajo...</div>
                )}
              </div>
            </div>
          </div>

          {/* Selector de Nueva Fecha y Estado de la Agenda */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Seleccione la Nueva Fecha <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className="text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a] focus:bg-white transition cursor-pointer font-medium"
                />
              </div>

              {availabilitySummary && !isLoadingSlots && (
                <div className="flex items-center gap-2 self-start sm:self-end text-xs text-slate-500 pb-1">
                  <span className="font-semibold capitalize">{availabilitySummary.dia_nombre}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {availabilitySummary.resumen?.disponibles || 0} turnos libres
                  </span>
                </div>
              )}
            </div>

            {/* Selector de Turnos / Slots */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                2. Seleccione un Turno Libre (CU09 / RF05) <span className="text-rose-500">*</span>
              </label>

              {isLoadingSlots ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
                  <Loader2 className="w-6 h-6 text-[#00687a] animate-spin mx-auto mb-2" />
                  <span>Consultando agenda y bloqueos del profesional en tiempo real...</span>
                </div>
              ) : availabilitySummary?.bloqueado_todo_el_dia ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
                  <CalendarX className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  <strong>Día Bloqueado:</strong> {availabilitySummary.motivo_bloqueo || 'El médico tiene un bloqueo registrado.'}
                </div>
              ) : !availabilitySummary?.es_laborable ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800">
                  <Info className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <strong>Día No Laborable:</strong> {availabilitySummary?.motivo_bloqueo || 'El profesional no atiende en el día seleccionado.'}
                </div>
              ) : availabilitySlots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No se encontraron franjas horarias configuradas para esta fecha.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {availabilitySlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.hora_inicio === slot.hora_inicio;

                    if (slot.disponible) {
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-center transition flex flex-col items-center gap-1 cursor-pointer transform active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 ring-offset-1'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 hover:border-emerald-300'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                          <span className="font-mono">{slot.hora_inicio} - {slot.hora_fin}</span>
                          <span className="text-[10px] font-normal opacity-90">Disponible</span>
                        </button>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border bg-slate-100/70 border-slate-200 text-slate-400 text-center flex flex-col items-center gap-1 opacity-60 cursor-not-allowed select-none"
                        title={slot.motivo || 'Horario ocupado o no disponible'}
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs line-through">{slot.hora_inicio} - {slot.hora_fin}</span>
                        <span className="text-[10px] truncate max-w-full">{slot.motivo || 'Ocupado'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Motivo Obligatorio de Reprogramación */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="motivo_reprogramacion" className="block text-xs font-bold text-slate-700">
                3. Motivo de la Reprogramación <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono font-medium ${
                  motivo.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {motivo.trim().length}/500 caracteres (mín. 5)
              </span>
            </div>
            <textarea
              id="motivo_reprogramacion"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Indique con claridad el motivo justificado (ej. Solicitud expresa del paciente por viaje, reasignación de turno, etc.)..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a] focus:bg-white transition resize-none leading-relaxed"
            />
          </div>
        </form>

        {/* Pie del modal con acciones */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Auditoría inmutable registrada en bitácora (CU03)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!isFormValid}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 active:brightness-95 rounded-xl shadow-md shadow-[#00687a]/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reprogramando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Reprogramación</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

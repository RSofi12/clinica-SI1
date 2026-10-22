import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  FileText,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';

/**
 * Modal de Cancelación de Cita Médica con Motivo Obligatorio (CU12 / RF09 / Prueba #6)
 * Paquete 3: Gestión de Citas Médicas
 */
export function AppointmentCancelModal({
  isOpen,
  onClose,
  appointment,
  onAppointmentCancelled,
}) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !appointment) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setMotivo('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMotivo = motivo.trim();

    if (!cleanMotivo || cleanMotivo.length < 5) {
      setErrorMsg('Debe ingresar un motivo de cancelación con al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await appointmentService.cancelAppointment(appointment.id_cita, cleanMotivo);
      if (res?.success) {
        setMotivo('');
        onAppointmentCancelled(res.data || appointment);
        onClose();
      } else {
        setErrorMsg(res?.message || 'Error al cancelar la cita médica.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200/80 overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-200" />
            <h3 className="font-bold text-base font-montserrat">Cancelar Cita Médica</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-rose-200 hover:text-white rounded-lg transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          {/* Banner de Advertencia de Baja Lógica (RF09 / RN09) */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Liberación inmediata de cupo horario:</span> Al cancelar la cita, el turno quedará inmediatamente disponible para otros pacientes en el visor de disponibilidad. El registro no se eliminará físicamente y se mantendrá en el historial médico (RF09 / Prueba #6).
            </div>
          </div>

          {/* Tarjeta de Resumen de la Cita */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-mono font-bold text-xs text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md border border-[#00687a]/20">
                {appointment.codigo_cita}
              </span>
              <span className="font-semibold text-slate-700 text-[11px]">
                {appointment.tipo_cita?.nombre || 'Consulta'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold">
                {appointment.paciente?.nombres} {appointment.paciente?.apellidos}
              </span>
              {appointment.paciente?.numero_documento && (
                <span className="text-slate-500 font-mono text-[10px]">
                  (CI: {appointment.paciente.numero_documento})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Stethoscope className="w-3.5 h-3.5 text-[#00687a] shrink-0" />
              <span>
                Dr. {appointment.medico?.nombres} {appointment.medico?.apellidos}
              </span>
              <span className="text-slate-500">• {appointment.especialidad?.nombre || 'Medicina General'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-800 font-semibold pt-0.5">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatDateDisplay(appointment.fecha_hora_inicio)}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[#00687a]">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {formatTimeDisplay(appointment.fecha_hora_inicio)} - {formatTimeDisplay(appointment.fecha_hora_fin)}
                </span>
              </div>
            </div>
          </div>

          {/* Campo Motivo de Cancelación Obligatorio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="motivo_cancelacion" className="font-bold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Motivo de Cancelación (Obligatorio)</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {motivo.length}/500 caracteres (mín. 5)
              </span>
            </div>
            <textarea
              id="motivo_cancelacion"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Paciente solicitó postergación por motivos laborales / Viaje imprevisto..."
              maxLength={500}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white transition text-xs text-slate-800 resize-none"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || motivo.trim().length < 5}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 hover:brightness-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Confirmar Cancelación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

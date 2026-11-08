import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { ModalPortal } from '../../../components/ModalPortal';

/**
 * Modal de Visualización e Impresión de Ticket Oficial de Cita Médica (CU09/CU10)
 * Metodología PUDS / RUP — Centro Médico La Cruz / Clínica Vida Salud
 */
export function AppointmentTicketModal({ isOpen, appointment, onClose }) {
  const [cachedAppointment, setCachedAppointment] = useState(appointment);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (appointment) {
      setCachedAppointment(appointment);
    }
  }, [appointment]);

  const activeAppt = appointment || cachedAppointment;

  if (!isOpen && !activeAppt) return null;

  const handleCopyCode = () => {
    if (activeAppt?.codigo_cita) {
      navigator.clipboard.writeText(activeAppt.codigo_cita);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Fecha no definida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'PROGRAMADA':
      case 'CONFIRMADA':
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {estado === 'PENDIENTE' ? 'En Espera' : estado}
          </span>
        );
      case 'ATENDIDA':
      case 'COMPLETADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Atendida
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {estado || 'Registrada'}
          </span>
        );
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      className="print:p-0 print:bg-white print:static"
      panelClassName="relative w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-modal-panel print:border-none print:shadow-none print:max-w-none print:my-0 print:rounded-none"
    >
      {/* Cabecera del Ticket */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#003844] via-[#004d5a] to-[#00687a] text-white flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/10 text-cyan-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-clinical font-bold text-sm tracking-tight text-white">
              Ticket de Cita Médica
            </h3>
            <p className="text-[11px] text-cyan-100/80">
              Comprobante oficial de turno y atención
            </p>
          </div>
        </div>
        <button
          type="button"
          data-modal-close="true"
          onClick={onClose}
          className="p-1.5 text-cyan-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cuerpo del Ticket Estilo Ficha Clínica / Impresión */}
      <div className="p-6 sm:p-7 space-y-5 text-xs text-slate-800">
        {/* Membrete Institucional */}
        <div className="text-center pb-4 border-b border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#00687a]/10 text-[#00687a] font-bold text-sm mb-2">
            +
          </div>
          <h4 className="font-extrabold text-base text-slate-900 tracking-tight font-serif-clinical uppercase">
            Centro Médico La Cruz
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Clínica Vida Salud · Santa Cruz, Bolivia
          </p>

          {/* Código de Cita en Destaque */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00687a]/10 border border-[#00687a]/20 rounded-xl">
            <span className="font-mono font-extrabold text-base text-[#00687a] tracking-wider">
              {activeAppt?.codigo_cita || 'CM-0000'}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-[#00687a] hover:text-[#004d5a] rounded transition print:hidden cursor-pointer"
              title="Copiar código de cita"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[10.5px] text-slate-400 mt-1">
            Comprobante de Programación (CU09 / CU10)
          </div>
        </div>

        {/* Ficha de Información de la Cita */}
        <div className="space-y-3 font-sans">
          <div className="flex items-start justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Paciente:
            </span>
            <span className="font-bold text-slate-900 text-right max-w-[210px]">
              {activeAppt?.paciente
                ? `${activeAppt.paciente.nombres} ${activeAppt.paciente.apellidos}`
                : 'Paciente no asignado'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Documento CI:</span>
            <span className="font-mono font-medium text-slate-800">
              {activeAppt?.paciente?.numero_documento || '—'}
            </span>
          </div>

          <div className="flex items-start justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              Médico Tratante:
            </span>
            <span className="font-bold text-slate-900 text-right max-w-[210px]">
              Dr(a). {activeAppt?.medico ? `${activeAppt.medico.nombres} ${activeAppt.medico.apellidos}` : 'Médico General'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Especialidad:</span>
            <span className="font-semibold text-[#00687a]">
              {activeAppt?.especialidad?.nombre || 'Medicina General'}
            </span>
          </div>

          <div className="flex items-start justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fecha y Hora:
            </span>
            <div className="text-right">
              <div className="font-bold text-slate-900 capitalize">
                {formatDateDisplay(activeAppt?.fecha_hora_inicio)}
              </div>
              <div className="text-[11px] text-[#00687a] font-mono font-semibold">
                {formatTimeDisplay(activeAppt?.fecha_hora_inicio)} – {formatTimeDisplay(activeAppt?.fecha_hora_fin)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Modalidad:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
              {activeAppt?.modalidad || 'PRESENCIAL'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Estado:</span>
            <div>{getStatusBadge(activeAppt?.estado)}</div>
          </div>

          {activeAppt?.motivo_consulta && (
            <div className="pt-1.5">
              <span className="text-slate-500 font-medium block mb-1">
                Motivo de Consulta:
              </span>
              <p className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 text-slate-700 italic leading-relaxed text-[11px]">
                "{activeAppt.motivo_consulta}"
              </p>
            </div>
          )}
        </div>

        {/* Nota Institucional al Paciente */}
        <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[10.5px] text-teal-900 leading-normal">
          <p className="font-semibold text-teal-950 mb-0.5">Indicación Importante:</p>
          Preséntese en recepción 15 minutos antes de su turno programado con su documento de identidad.
        </div>

        {/* Botones de Acción (Ocultos en impresión) */}
        <div className="pt-2 flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            type="button"
            data-modal-close="true"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
export default AppointmentTicketModal;

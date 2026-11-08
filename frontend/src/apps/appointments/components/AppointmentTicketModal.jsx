import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  CheckCircle2,
  FileText,
  ShieldCheck,
  CreditCard,
  Phone,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { ModalPortal } from '../../../components/ModalPortal';

/**
 * Modal y Documento Oficial de Ticket de Cita Médica (CU10 / CU14 / CU15)
 * Implementa diseño dual:
 *  1. Vista interactiva en pantalla con gradiente institucional y controles rápidos.
 *  2. Formato formal de impresión y exportación a PDF (@media print) con aislamiento
 *     estricto (oculta la aplicación de fondo y formatea un voucher institucional limpio en 1 página).
 */
export function AppointmentTicketModal({
  appointment = null,
  isOpen = false,
  onClose = () => {},
}) {
  const [cachedAppointment, setCachedAppointment] = useState(appointment);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (appointment) {
      setCachedAppointment(appointment);
    }
  }, [appointment]);

  // Limpieza defensiva de clases de impresión en document.body
  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('printing-modal');
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      cleanup();
    };
  }, []);

  const activeAppt = appointment || cachedAppointment;

  if (!isOpen || !activeAppt) return null;

  const handleCopyCode = () => {
    const code = activeAppt?.codigo_cita || activeAppt?.codigo;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing-modal');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  // Formateadores seguros de fecha y hora
  const formatDateFull = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeRange = (startStr, endStr) => {
    if (!startStr) return '';
    try {
      const s = new Date(startStr);
      const startFmt = s.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      if (!endStr) return startFmt;
      const e = new Date(endStr);
      const endFmt = e.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${startFmt} - ${endFmt}`;
    } catch {
      return '';
    }
  };

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paciente = activeAppt.paciente || activeAppt.patient || {};
  const medico = activeAppt.medico || activeAppt.doctor || {};
  const especialidad = activeAppt.especialidad?.nombre || 'Medicina General';
  const codigoCita = activeAppt.codigo_cita || activeAppt.codigo || `CM-${activeAppt.id_cita || ''}`;
  const modalidad = activeAppt.modalidad || 'PRESENCIAL';
  const estado = activeAppt.estado || 'PROGRAMADA';
  const estaPagada = Boolean(activeAppt.pagada);

  // Tarifa referencial de consulta si no viene especificada
  const tarifaConsulta = activeAppt.tarifa || activeAppt.monto || '130.00';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Ticket de Cita Médica ${codigoCita}`}
      maxWidth="max-w-xl"
      panelClassName="p-0 overflow-hidden bg-transparent shadow-none border-none"
    >
      <div className="w-full">
        {/* =========================================================================
            SECCIÓN 1: VISTA EN PANTALLA (Interactivo con Tailwind, oculto al imprimir)
            ========================================================================= */}
        <div className="print:hidden bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
          {/* Cabecera Deep Aqua con Gradiente */}
          <div className="bg-gradient-to-r from-[#003844] via-[#004d5a] to-[#00687a] px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-cyan-200 shadow-inner">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-clinical text-lg font-bold tracking-tight text-white leading-tight">
                  Ticket de Cita Médica
                </h3>
                <p className="text-xs text-cyan-100/80 font-medium">
                  Comprobante Oficial de Reserva • Centro Médico La Cruz
                </p>
              </div>
            </div>

            <button
              type="button"
              data-modal-close="true"
              onClick={onClose}
              className="p-2 text-cyan-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo del Voucher en Pantalla */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Banner Destacado del Código de Cita y Estado */}
            <div className="p-4 bg-gradient-to-br from-teal-50/80 via-slate-50 to-cyan-50/50 rounded-2xl border border-teal-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                  Código Correlativo Oficial
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-2xl text-[#004d5a] tracking-wide">
                    {codigoCita}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 text-[#00687a] hover:text-[#004d5a] hover:bg-teal-100/60 rounded-lg transition cursor-pointer"
                    title="Copiar código de cita"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  {estado}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    estaPagada
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {estaPagada ? 'Pagada' : 'Pendiente de Pago'}
                </span>
              </div>
            </div>

            {/* Rejilla de Información Asistencial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paciente */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-[#004d5a] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Paciente
                  </span>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {paciente.nombres} {paciente.apellidos}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    CI: {paciente.numero_documento || '—'}
                  </p>
                </div>
              </div>

              {/* Médico Tratante */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Médico Responsable
                  </span>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    Dr(a). {medico.nombres} {medico.apellidos}
                  </p>
                  <p className="text-xs text-[#00687a] font-semibold">
                    {especialidad}
                  </p>
                </div>
              </div>

              {/* Fecha Asignada */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Fecha de Atención
                  </span>
                  <p className="font-bold text-slate-800 text-sm capitalize">
                    {formatDateFull(activeAppt.fecha_hora_inicio)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Modalidad: <strong>{modalidad}</strong>
                  </p>
                </div>
              </div>

              {/* Horario y Duración */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Turno y Horario
                  </span>
                  <p className="font-bold font-mono text-slate-900 text-sm">
                    {formatTimeRange(activeAppt.fecha_hora_inicio, activeAppt.fecha_hora_fin)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Duración estimada: 30 minutos
                  </p>
                </div>
              </div>
            </div>

            {/* Motivo de Consulta si existe */}
            {activeAppt.motivo_consulta && (
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-500 block mb-0.5">Motivo Registrado:</span>
                <p className="text-slate-700 italic">"{activeAppt.motivo_consulta}"</p>
              </div>
            )}

            {/* Aviso de Presentación y Puntualidad */}
            <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-cyan-100 text-xs text-cyan-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#00687a] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#003844] font-semibold">Indicación Asistencial:</strong>
                Por favor preséntese en recepción 15 minutos antes de su turno programado con su documento de identidad (CI).
              </div>
            </div>

            {/* Botones de Acción en Pantalla */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-5 bg-gradient-to-r from-[#003844] via-[#004d5a] to-[#00687a] hover:brightness-110 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECCIÓN 2: DOCUMENTO CLÍNICO OFICIAL DE IMPRESIÓN Y PDF (@media print)
            Visible ÚNICAMENTE al imprimir o exportar a PDF (window.print())
            Ocupa exactamente 1 hoja limpia, sin menús ni dashboard de fondo
            ========================================================================= */}
        <div className="hidden print:block text-slate-900 bg-white p-6 max-w-[600px] mx-auto border-2 border-slate-800 rounded-xl font-sans break-inside-avoid">
          {/* Membrete Oficial */}
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#003844] text-white font-bold text-lg mb-2">
              +
            </div>
            <h1 className="text-lg font-bold font-serif-clinical tracking-tight text-slate-900 leading-snug">
              CENTRO MÉDICO LA CRUZ — VIDA SALUD
            </h1>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Clínica de Atención Primaria Integral • Acreditación Sanitaria Departamental
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Av. Principal Los Próceres #124 • Santa Cruz de la Sierra, Bolivia • Tel: +591 (3) 345-6789
            </p>
          </div>

          {/* Título de Voucher y Código Correlativo */}
          <div className="my-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              COMPROBANTE OFICIAL DE RESERVA DE CITA
            </span>
            <span className="font-mono font-extrabold text-2xl text-slate-900 tracking-wider block my-1">
              {codigoCita}
            </span>
            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-600">
              <span>Modalidad: <strong>{modalidad}</strong></span>
              <span>•</span>
              <span>Estado: <strong>{estado}</strong></span>
              <span>•</span>
              <span>
                Pago:{' '}
                <strong className={estaPagada ? 'text-emerald-700' : 'text-amber-700'}>
                  {estaPagada ? `PAGADA (Bs. ${tarifaConsulta})` : `PENDIENTE (Bs. ${tarifaConsulta})`}
                </strong>
              </span>
            </div>
          </div>

          {/* Datos del Paciente y la Cita */}
          <div className="space-y-2.5 text-xs border-y border-slate-200 py-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Paciente:</span>
              <span className="col-span-2 font-bold text-slate-900 text-sm">
                {paciente.nombres} {paciente.apellidos}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Cédula de Identidad:</span>
              <span className="col-span-2 font-mono font-bold text-slate-800">
                {paciente.numero_documento || '—'}
                {paciente.numero_historia && ` (Historia: ${paciente.numero_historia})`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Médico Tratante:</span>
              <span className="col-span-2 font-bold text-slate-900">
                Dr(a). {medico.nombres} {medico.apellidos}
                {medico.codigo_profesional && (
                  <span className="font-mono text-[10px] text-slate-500 ml-1.5 font-normal">
                    [Mat: {medico.codigo_profesional}]
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Especialidad:</span>
              <span className="col-span-2 font-semibold text-[#00687a]">
                {especialidad}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Fecha Asignada:</span>
              <span className="col-span-2 font-bold text-slate-900 capitalize">
                {formatDateFull(activeAppt.fecha_hora_inicio)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Horario de Atención:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900 text-sm">
                {formatTimeRange(activeAppt.fecha_hora_inicio, activeAppt.fecha_hora_fin)}
              </span>
            </div>

            {activeAppt.motivo_consulta && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Motivo Registrado:</span>
                <span className="col-span-2 italic text-slate-700 text-[11px]">
                  "{activeAppt.motivo_consulta}"
                </span>
              </div>
            )}
          </div>

          {/* Indicaciones para el Paciente */}
          <div className="my-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 uppercase tracking-wide">
              Instrucciones Importantes para el Paciente:
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Presentarse en ventanilla de Recepción con <strong>15 minutos de anticipación</strong> portando su Cédula de Identidad física.</li>
              <li>Si su consulta es presencial, anuncie su llegada para el registro de asistencia (Check-in / Sala de espera).</li>
              <li>En caso de reprogramación o anulación, realizarla con al menos 2 horas de anticipación desde el portal web o por teléfono.</li>
            </ul>
          </div>

          {/* Firmas y Sellos */}
          <div className="pt-4 grid grid-cols-2 gap-6 text-center border-t border-slate-300">
            <div className="pt-6 border-t border-slate-400">
              <p className="text-[11px] font-bold text-slate-800">{paciente.nombres} {paciente.apellidos}</p>
              <p className="text-[9px] text-slate-500">Firma del Paciente / Tutor</p>
            </div>
            <div className="pt-6 border-t border-slate-400">
              <p className="text-[11px] font-bold text-slate-800">Centro Médico La Cruz</p>
              <p className="text-[9px] text-slate-500">Sello / Admisión y Caja</p>
            </div>
          </div>

          {/* Pie de ticket */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
            <span>Ticket emitido por Sistema Clínico Vida Salud (CU10 / RF06)</span>
            <span>Fecha de emisión: {fechaHoy}</span>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default AppointmentTicketModal;

import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { ModalPortal } from '../../../components/ModalPortal';

/**
 * Modal y Documento Oficial de Ticket de Cita Médica (CU10 / CU14 / CU15)
 * Implementa diseño dual:
 *  1. Vista interactiva en pantalla con gradiente institucional y controles rápidos.
 *  2. Formato formal de impresión y exportación a PDF (@media print) con aislamiento
 *     estricto (oculta la aplicación de fondo y formatea un voucher institucional limpio).
 */
export function AppointmentTicketModal({
  appointment = null,
  isOpen = false,
  onClose = () => {},
}) {
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

  if (!isOpen || !appointment) return null;

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

  const paciente = appointment.paciente || appointment.patient || {};
  const medico = appointment.medico || appointment.doctor || {};
  const especialidad = appointment.especialidad?.nombre || 'Medicina General';
  const codigoCita = appointment.codigo_cita || appointment.codigo || `CM-${appointment.id_cita || ''}`;
  const modalidad = appointment.modalidad || 'PRESENCIAL';
  const estado = appointment.estado || 'PROGRAMADA';
  const estaPagada = Boolean(appointment.pagada);

  // Tarifa referencial de consulta si no viene especificada
  const tarifaConsulta = appointment.tarifa || appointment.monto || '130.00';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      className="print:p-0 print:bg-white print:static"
      panelClassName="relative w-full max-w-md my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-panel print:border-none print:shadow-none print:max-w-none print:my-0 print:rounded-none"
    >
      <div>
        {/* =========================================================================
            SECCIÓN 1: VISTA INTERACTIVA EN PANTALLA (OCULTA AL IMPRIMIR)
            ========================================================================= */}
        <div className="print:hidden">
          {/* Cabecera Deep Teal */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#003844] via-[#004d5a] to-[#00687a] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-white/10 text-cyan-200 border border-white/10">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm font-serif-clinical tracking-tight">
                  Ticket Oficial de Cita Médica
                </h3>
                <p className="text-[10px] text-cyan-100 font-mono">
                  {codigoCita} • {modalidad}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 text-cyan-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Imprimir ticket en papel o exportar a PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-cyan-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo del Ticket en Pantalla */}
          <div className="p-6 space-y-4 text-xs font-sans">
            {/* Membrete Institucional y Código Prominente */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="font-bold text-sm text-slate-900 tracking-tight font-serif-clinical">
                CENTRO MÉDICO LA CRUZ — VIDA SALUD
              </h4>
              <p className="text-[11px] text-slate-500">Clínica de Atención Primaria • Santa Cruz, Bolivia</p>
              <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00687a]/10 border border-[#00687a]/20 rounded-xl">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">CÓDIGO:</span>
                <span className="font-mono font-extrabold text-base text-[#00687a] tracking-wider">
                  {codigoCita}
                </span>
              </div>
            </div>

            {/* Cuadrícula de Datos Clave */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Paciente:
                </span>
                <span className="font-bold text-slate-900 text-right">
                  {paciente.nombres} {paciente.apellidos}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Documento CI:</span>
                <span className="font-mono font-medium text-slate-700">
                  {paciente.numero_documento || '—'}
                  {paciente.numero_historia && (
                    <span className="ml-1 text-[#00687a] font-bold">({paciente.numero_historia})</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  Médico Tratante:
                </span>
                <span className="font-bold text-slate-900 text-right">
                  Dr(a). {medico.nombres} {medico.apellidos}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Especialidad:</span>
                <span className="font-semibold text-[#00687a]">{especialidad}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha:
                </span>
                <span className="font-bold text-slate-900 capitalize">
                  {formatDateFull(appointment.fecha_hora_inicio)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Horario de Atención:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatTimeRange(appointment.fecha_hora_inicio, appointment.fecha_hora_fin)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Modalidad:</span>
                <span className="font-semibold text-slate-700 uppercase">{modalidad}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Estado de Cita:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {estado}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-1.5 items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Estado de Pago:
                </span>
                <div>
                  {estaPagada ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      PAGADA (Bs. {tarifaConsulta})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      PENDIENTE DE PAGO (Bs. {tarifaConsulta})
                    </span>
                  )}
                </div>
              </div>

              {appointment.motivo_consulta && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Motivo de Consulta:</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 italic text-[11px]">
                    "{appointment.motivo_consulta}"
                  </p>
                </div>
              )}
            </div>

            {/* Botones de Acción en Pantalla */}
            <div className="pt-3 flex gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#00687a] to-[#008b9e] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 hover:brightness-105 cursor-pointer text-xs"
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
                {formatDateFull(appointment.fecha_hora_inicio)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Horario de Atención:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900 text-sm">
                {formatTimeRange(appointment.fecha_hora_inicio, appointment.fecha_hora_fin)}
              </span>
            </div>

            {appointment.motivo_consulta && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Motivo Registrado:</span>
                <span className="col-span-2 italic text-slate-700 text-[11px]">
                  "{appointment.motivo_consulta}"
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


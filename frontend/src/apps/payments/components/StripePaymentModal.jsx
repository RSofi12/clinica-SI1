import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Printer,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  ExternalLink
} from 'lucide-react';
import { paymentService } from '../services/paymentService';

/**
 * Modal de Pasarela de Pagos Stripe Sandbox (CU21)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
export default function StripePaymentModal({
  cita,
  isOpen,
  onClose,
  onSuccess
}) {
  const [step, setStep] = useState('FORM'); // 'FORM' | 'SUCCESS'
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Datos de la transacción
  const [intentData, setIntentData] = useState(null);
  const [pagoExitoso, setPagoExitoso] = useState(null);

  // Formulario de tarjeta
  const [titular, setTitular] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [cvc, setCvc] = useState('');
  const [marcaTarjeta, setMarcaTarjeta] = useState('visa');

  // Scroll-lock y tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  // Inicializar PaymentIntent al abrir el modal
  useEffect(() => {
    if (isOpen && cita?.id_cita) {
      iniciarIntentoPago(cita.id_cita);
      setStep('FORM');
      setError(null);
      setPagoExitoso(null);
      
      const nombrePaciente = cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : '';
      setTitular(nombrePaciente);
      setNumeroTarjeta('');
      setExpiracion('');
      setCvc('');
      setMarcaTarjeta('visa');
    }
  }, [isOpen, cita]);

  const iniciarIntentoPago = async (idCita) => {
    try {
      setLoadingIntent(true);
      setError(null);
      const res = await paymentService.createPaymentIntent(idCita);
      if (res?.success) {
        setIntentData(res.data);
      } else {
        setError(res?.message || 'No se pudo inicializar la pasarela de Stripe.');
      }
    } catch (err) {
      console.error('Error al inicializar Stripe PaymentIntent:', err);
      setError(err?.message || 'Error al conectar con el servicio de pagos.');
    } finally {
      setLoadingIntent(false);
    }
  };

  // Autollenar con tarjeta demo oficial de Stripe
  const handleUsarTarjetaDemo = () => {
    setNumeroTarjeta('4242 4242 4242 4242');
    setExpiracion('12/28');
    setCvc('123');
    setMarcaTarjeta('visa');
    if (!titular && cita?.paciente) {
      setTitular(`${cita.paciente.nombres} ${cita.paciente.apellidos}`);
    }
  };

  // Formateador de número de tarjeta con espacios
  const handleNumeroTarjetaChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setNumeroTarjeta(formatted);

    // Detección automática de marca
    if (raw.startsWith('4')) setMarcaTarjeta('visa');
    else if (raw.startsWith('5')) setMarcaTarjeta('mastercard');
    else if (raw.startsWith('34') || raw.startsWith('37')) setMarcaTarjeta('amex');
    else setMarcaTarjeta('visa');
  };

  // Formateador de fecha MM/YY
  const handleExpiracionChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiracion(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiracion(raw);
    }
  };

  const handleSubmitPago = async (e) => {
    e.preventDefault();
    if (!cita?.id_cita) return;

    const rawNum = numeroTarjeta.replace(/\s/g, '');
    if (rawNum.length < 15) {
      setError('Por favor ingrese un número de tarjeta válido (15 o 16 dígitos).');
      return;
    }
    if (expiracion.length < 5) {
      setError('Por favor ingrese la fecha de expiración completa (MM/AA).');
      return;
    }
    if (cvc.length < 3) {
      setError('El código de seguridad CVC debe tener al menos 3 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        id_cita: cita.id_cita,
        payment_intent_id: intentData?.payment_intent_id || null,
        tarjeta_numero: rawNum,
        tarjeta_marca: marcaTarjeta,
        tarjeta_exp: expiracion,
        tarjeta_cvc: cvc,
      };

      const res = await paymentService.processPayment(payload);
      if (res?.success) {
        setPagoExitoso(res.data);
        setStep('SUCCESS');
        if (onSuccess) onSuccess(res.data);
      } else {
        setError(res?.message || 'El pago fue declinado por la pasarela de prueba.');
      }
    } catch (err) {
      console.error('Error al procesar cobro:', err);
      setError(err?.message || 'Ocurrió un error inesperado al procesar el pago en Stripe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImprimirComprobante = () => {
    window.print();
  };

  if (!isOpen) return null;

  const montoMostrar = intentData?.monto || cita?.especialidad?.precio_consulta || 70.00;
  const codigoCita = cita?.codigo_cita || 'CM-XXXX';
  const especialidadNombre = cita?.especialidad?.nombre || 'Medicina General';
  const medicoNombre = cita?.medico ? `Dr(a). ${cita.medico.nombres} ${cita.medico.apellidos}` : 'Médico General';

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md overflow-y-auto animate-modal-backdrop cursor-default"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg my-auto overflow-hidden transition-all animate-modal-panel cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Deep Aqua */}
        <div className="bg-gradient-to-r from-[#003844] to-[#005566] text-white p-5 sm:p-6 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-300/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-300" />
                Stripe Sandbox · CU21
              </span>
              <span className="text-[11px] text-cyan-100/70 font-sans">
                Modo de Prueba
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-clinical tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-300" />
              {step === 'SUCCESS' ? '¡Pago Realizado con Éxito!' : 'Pagar Cita Médica'}
            </h2>
            <p className="text-xs text-cyan-100/80 mt-1 max-w-sm">
              {step === 'SUCCESS'
                ? 'El cobro ha sido confirmado en Stripe y la cita médica quedó garantizada.'
                : 'Procesamiento de tarjeta tokenizada y confirmación de reserva médica.'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-cyan-200/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO PASO 1: FORMULARIO DE COBRO */}
        {step === 'FORM' && (
          <div className="p-6 space-y-5">
            {/* Resumen de la Cita Médica */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Resumen de la Cita
                </span>
                <span className="font-mono font-bold text-xs text-[#003844] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {codigoCita}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {especialidadNombre}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                    {medicoNombre}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-[#003844] tracking-tight">
                    Bs. {Number(montoMostrar).toFixed(2)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Bs · Tarifa Consulta
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {cita?.fecha_formateada || 'Fecha de atención'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {cita?.hora_inicio_formateada || 'Hora programada'}
                </span>
              </div>
            </div>

            {/* Botón de Relleno Rápido de Prueba */}
            <button
              type="button"
              onClick={handleUsarTarjetaDemo}
              className="w-full py-2 px-3 rounded-xl bg-cyan-50/80 hover:bg-cyan-100/90 border border-cyan-200 text-cyan-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>Usar Tarjeta de Prueba Stripe (4242 4242 4242 4242)</span>
            </button>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Formulario de Pago */}
            <form onSubmit={handleSubmitPago} className="space-y-4">
              {/* Titular */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Titular de la Tarjeta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    placeholder="Como figura en el plástico"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] text-slate-800 font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Número de Tarjeta */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Número de Tarjeta <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {marcaTarjeta.toUpperCase()}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={numeroTarjeta}
                    onChange={handleNumeroTarjetaChange}
                    placeholder="4242 •••• •••• 4242"
                    maxLength={19}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] font-mono font-semibold tracking-wider text-slate-800"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Vencimiento y CVC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expiración <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={expiracion}
                    onChange={handleExpiracionChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] font-mono text-center font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CVC / CVV <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      maxLength={4}
                      required
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] font-mono text-center font-semibold text-slate-800"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Aviso de Seguridad */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cifrado SSL de 256 bits a través de la infraestructura Sandbox de Stripe.</span>
              </div>

              {/* Botón de Pagar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingIntent}
                  className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#003844] to-[#00687a] hover:from-[#002b34] hover:to-[#005564] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                      Procesando Pago con Stripe...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-cyan-300" />
                      Pagar Bs. {Number(montoMostrar).toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CUERPO PASO 2: RECIBO EXITOSO */}
        {step === 'SUCCESS' && pagoExitoso && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wide uppercase inline-flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ¡Pago Realizado con Éxito!
              </span>
              <h3 className="text-xl font-bold font-serif-clinical text-slate-900 mt-2">
                Cita Médica Pagada y Garantizada
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                El cobro por <strong className="text-slate-800">Bs. {Number(pagoExitoso.monto || montoMostrar).toFixed(2)}</strong> fue procesado satisfactoriamente vía Stripe Sandbox. Se emitió el comprobante electrónico oficial.
              </p>
            </div>

            {/* Ficha de Recibo Oficial */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-[#00687a]" />
                  Centro Médico La Cruz
                </div>
                <span className="font-mono font-bold text-[#003844] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {pagoExitoso.codigo_pago}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cita Médica</span>
                  <span className="font-bold text-slate-800">{codigoCita}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Cobrado</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    Bs. {Number(pagoExitoso.monto).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Método / Tarjeta</span>
                  <span className="font-medium text-slate-800">
                    {pagoExitoso.tarjeta_marca?.toUpperCase()} •••• {pagoExitoso.tarjeta_ultimos4 || '4242'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha y Hora</span>
                  <span className="font-mono text-slate-800 text-[11px]">
                    {pagoExitoso.fecha_pago ? new Date(pagoExitoso.fecha_pago).toLocaleString('es-ES') : 'Hoy'}
                  </span>
                </div>
              </div>

              {pagoExitoso.stripe_payment_intent_id && (
                <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Stripe ID: {pagoExitoso.stripe_payment_intent_id}</span>
                  <a
                    href={`https://dashboard.stripe.com/test/payments/${pagoExitoso.stripe_payment_intent_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00687a] hover:underline flex items-center gap-1 font-semibold"
                  >
                    Ver en Stripe <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleImprimirComprobante}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003844] to-[#00687a] hover:from-[#002b34] hover:to-[#005564] text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                <span>Aceptar y Finalizar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}


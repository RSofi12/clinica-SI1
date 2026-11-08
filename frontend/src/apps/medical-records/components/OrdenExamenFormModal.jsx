import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FlaskConical, 
  Scan, 
  HeartPulse, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Clock, 
  FileText,
  User,
  Stethoscope
} from 'lucide-react';
import { ordenExamenService } from '../services/ordenExamenService';

const ESTUDIOS_PREDEFINIDOS = {
  LABORATORIO: [
    'Hemograma Completo',
    'Perfil Lipídico',
    'Glucosa en Ayunas',
    'Examen General de Orina (EGO)',
    'Creatinina y Urea en Sangre',
    'Perfil Hepático (TGO/TGP)',
    'Electrolitos Séricos (Na, K, Cl)',
    'Ácido Úrico'
  ],
  IMAGENOLOGIA: [
    'Radiografía de Tórax PA',
    'Radiografía de Columna Lumbar',
    'Ecografía Abdominal Completa',
    'Ecografía Renal y Vesical',
    'Tomografía Axial Computarizada (TAC) de Cráneo',
    'Resonancia Magnética Nuclear (RMN)'
  ],
  CARDIOLOGIA: [
    'Electrocardiograma (ECG)',
    'Ecocardiograma Doppler Color',
    'Prueba de Esfuerzo (Ergometría)',
    'Monitoreo Holter 24 Horas'
  ],
  OTROS: [
    'Espirometría Computarizada',
    'Endoscopía Digestiva Alta',
    'Biopsia por Aspiración',
    'Audiometría Tonal'
  ]
};

const PREPARACIONES_RAPIDAS = [
  'Ayuno estricto de 8 a 12 horas.',
  'Vejiga llena: ingerir 1 litro de agua 1 hora antes.',
  'Retirar objetos metálicos y joyas antes del estudio.',
  'Reposo físico previo de 15 a 20 minutos.',
  'No ingerir medicamentos anticoagulantes previo aviso.',
  'Presentarse con ropa cómoda de dos piezas.'
];

/**
 * Modal para Emisión de Órdenes de Exámenes Auxiliares (CU25)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
export default function OrdenExamenFormModal({
  consulta,
  isOpen,
  onClose,
  onSuccess
}) {
  const [tipoEstudio, setTipoEstudio] = useState('LABORATORIO');
  const [nombreEstudio, setNombreEstudio] = useState('');
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState('');
  const [indicacionesPreparacion, setIndicacionesPreparacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Manejo de scroll-lock y tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Pre-llenar diagnóstico presuntivo con el motivo o diagnóstico de la consulta
  useEffect(() => {
    if (consulta && isOpen) {
      const diagnosticoPrevio = consulta.diagnostico_principal || consulta.motivo_consulta || '';
      setDiagnosticoPresuntivo(diagnosticoPrevio);
      setNombreEstudio('');
      setIndicacionesPreparacion('');
      setError(null);
    }
  }, [consulta, isOpen]);

  if (!isOpen) return null;

  const paciente = consulta?.historia_clinica?.paciente || consulta?.cita?.paciente;
  const medico = consulta?.medico || consulta?.cita?.medico;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consulta?.id_consulta) {
      setError('No se identificó la consulta médica asociada.');
      return;
    }

    if (!nombreEstudio.trim()) {
      setError('Debe especificar el nombre del estudio médico.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        id_consulta: consulta.id_consulta,
        tipo_estudio: tipoEstudio,
        nombre_estudio: nombreEstudio.trim(),
        diagnostico_presuntivo: diagnosticoPresuntivo.trim() || null,
        indicaciones_preparacion: indicacionesPreparacion.trim() || null,
      };

      const res = await ordenExamenService.emitirOrden(payload);
      if (res?.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res?.message || 'No se pudo emitir la orden médica.');
      }
    } catch (err) {
      console.error('Error al emitir orden de examen:', err);
      setError(err?.message || 'Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgregarPreparacion = (texto) => {
    if (!indicacionesPreparacion) {
      setIndicacionesPreparacion(texto);
    } else if (!indicacionesPreparacion.includes(texto)) {
      setIndicacionesPreparacion(prev => `${prev} ${texto}`);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-modal-backdrop cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl my-auto overflow-hidden transition-all animate-modal-panel cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Editorial Deep Aqua */}
        <div className="bg-gradient-to-r from-[#003844] to-[#005264] text-white p-5 sm:p-6 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                CU25 — Exámenes Auxiliares
              </span>
              <span className="text-xs text-cyan-100/70 font-sans">
                Prescripción Diagnóstica
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-clinical tracking-tight flex items-center gap-2.5">
              <FlaskConical className="w-6 h-6 text-cyan-300" />
              Nueva Orden de Examen
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100/80 mt-1 max-w-md">
              Emite órdenes diagnósticas para laboratorio o imagenología con trazabilidad e integración a resultados en Cloudinary (CU26).
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-cyan-200/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha Resumen del Paciente y Consulta */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#00687a]" />
            <span className="font-semibold text-slate-800">
              {paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'Paciente no especificado'}
            </span>
            {paciente?.numero_documento && (
              <span className="text-slate-400">· CI: {paciente.numero_documento}</span>
            )}
            {paciente?.numero_historia && (
              <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[11px] border border-teal-200">
                HC: {paciente.numero_historia}
              </span>
            )}
          </div>
          {medico && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
              <span>Dr. {medico.nombres} {medico.apellidos}</span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Selector de Tipo de Estudio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Examen Auxiliar <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'LABORATORIO', label: 'Laboratorio', icon: FlaskConical, color: 'text-amber-600' },
                { id: 'IMAGENOLOGIA', label: 'Imagenología', icon: Scan, color: 'text-cyan-600' },
                { id: 'CARDIOLOGIA', label: 'Cardiología', icon: HeartPulse, color: 'text-rose-600' },
                { id: 'OTROS', label: 'Otros Estudios', icon: Layers, color: 'text-indigo-600' },
              ].map(item => {
                const IconComponent = item.icon;
                const isSelected = tipoEstudio === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTipoEstudio(item.id);
                      setNombreEstudio('');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#003844] text-white border-[#003844] shadow-sm ring-2 ring-cyan-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-cyan-300' : item.color}`} />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre del Estudio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre Específico del Estudio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombreEstudio}
              onChange={(e) => setNombreEstudio(e.target.value)}
              placeholder="Ej: Hemograma Completo, Radiografía de Tórax PA..."
              maxLength={150}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] transition-all font-medium text-slate-800 placeholder-slate-400"
            />

            {/* Sugerencias Rápidas por Tipo */}
            <div className="mt-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3 text-[#00687a]" />
                Estudios Frecuentes ({tipoEstudio}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ESTUDIOS_PREDEFINIDOS[tipoEstudio]?.map((estudio, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNombreEstudio(estudio)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                      nombreEstudio === estudio
                        ? 'bg-[#00687a] text-white border-[#00687a]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    {estudio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnóstico Presuntivo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Diagnóstico Presuntivo / Justificación Clínica
            </label>
            <input
              type="text"
              value={diagnosticoPresuntivo}
              onChange={(e) => setDiagnosticoPresuntivo(e.target.value)}
              placeholder="Ej: Sospecha de proceso infeccioso respiratorio, dolor precordial..."
              maxLength={255}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Indicaciones y Preparación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Indicaciones y Preparación Especial</span>
              <span className="text-[11px] text-slate-400 font-normal">Opcional</span>
            </label>
            <textarea
              rows={3}
              value={indicacionesPreparacion}
              onChange={(e) => setIndicacionesPreparacion(e.target.value)}
              placeholder="Instrucciones previas para el paciente (ayuno, medicamentos, líquidos, vestimenta)..."
              maxLength={1000}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] transition-all text-slate-800 placeholder-slate-400 resize-none"
            />

            {/* Chips Rápidos de Preparación */}
            <div className="mt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Clock className="w-3 h-3 text-[#00687a]" />
                Atajos de preparación:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PREPARACIONES_RAPIDAS.map((prep, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAgregarPreparacion(prep)}
                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200/80 transition-colors"
                  >
                    + {prep}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#003844] to-[#00687a] hover:from-[#002d37] hover:to-[#005564] shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  Emitiendo Orden...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  Emitir Orden Médica
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}


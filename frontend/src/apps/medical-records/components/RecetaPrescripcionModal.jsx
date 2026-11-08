import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Pill, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  Clock, 
  Sparkles,
  Info
} from 'lucide-react';
import { recetaService } from '../services/recetaService';
import { antecedenteService } from '../services/antecedenteService';
import { ModalPortal } from '../../../components/ModalPortal';

const ATRIBUTOS_DOSIS = ['500 mg', '1 g', '250 mg', '10 ml', '1 tableta', '1 cápsula', '2 puffs'];
const ATRIBUTOS_FRECUENCIA = ['Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'En ayunas', 'Antes de dormir', 'PRN / Si hay dolor'];
const ATRIBUTOS_DURACION = ['Por 3 días', 'Por 5 días', 'Por 7 días', 'Por 10 días', 'Por 14 días', 'Tratamiento continuo'];

/**
 * Modal Interactivo de Prescripción Médica y Receta Digital (CU18)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
export default function RecetaPrescripcionModal({ 
  consulta, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [detalles, setDetalles] = useState([
    { medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }
  ]);
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [antecedentesAlergicos, setAntecedentesAlergicos] = useState([]);
  const [isLoadingAntecedentes, setIsLoadingAntecedentes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const paciente = consulta?.historia_clinica?.paciente || consulta?.cita?.paciente;
  const pacienteId = paciente?.id_paciente;

  // Cargar antecedentes alérgicos de alerta del paciente (Integración con CU17)
  useEffect(() => {
    if (isOpen && pacienteId) {
      cargarAntecedentesAlergicos(pacienteId);
    }
  }, [isOpen, pacienteId]);

  const cargarAntecedentesAlergicos = async (id) => {
    try {
      setIsLoadingAntecedentes(true);
      const res = await antecedenteService.fetchPatientAntecedentes(id, { tipo: 'ALERGICO' });
      const lista = res?.data?.antecedentes || res?.antecedentes || [];
      const activas = lista.filter(a => a.estado === 'ACTIVO');
      setAntecedentesAlergicos(activas);
    } catch (err) {
      console.warn('No se pudieron cargar antecedentes alérgicos:', err);
    } finally {
      setIsLoadingAntecedentes(false);
    }
  };

  const agregarMedicamento = () => {
    setDetalles([
      ...detalles,
      { medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }
    ]);
  };

  const eliminarMedicamento = (index) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarDetalle = (index, campo, valor) => {
    const nuevos = [...detalles];
    nuevos[index][campo] = valor;
    setDetalles(nuevos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación de campos obligatorios por cada renglón
    for (let i = 0; i < detalles.length; i++) {
      const d = detalles[i];
      if (!d.medicamento.trim() || !d.dosis.trim() || !d.frecuencia.trim() || !d.duracion.trim()) {
        setError(`El medicamento #${i + 1} debe tener nombre, dosis, frecuencia y duración completos.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        id_consulta: consulta.id_consulta,
        indicaciones_generales: indicacionesGenerales.trim() || null,
        detalles: detalles.map(d => ({
          medicamento: d.medicamento.trim(),
          dosis: d.dosis.trim(),
          frecuencia: d.frecuencia.trim(),
          duracion: d.duracion.trim(),
          indicaciones: d.indicaciones?.trim() || null,
        })),
      };

      const res = await recetaService.emitirReceta(payload);
      if (onSuccess) {
        onSuccess(res.data || res);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al emitir la receta médica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !consulta) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" closeOnBackdrop={false}>
      {/* ENCABEZADO */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-teal-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Emitir Prescripción Médica (Receta Oficial)
              </h3>
              <p className="text-xs text-slate-500">
                Consulta #{consulta.id_consulta} · Paciente: {paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'No especificado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* BANNER DE ALERTAS ALÉRGICAS DEL PACIENTE (CU17) */}
          {antecedentesAlergicos.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-rose-700">
                  ⚠️ Advertencia Farmacológica — Antecedentes Alérgicos Detectados:
                </span>
                <p className="text-rose-800">
                  {antecedentesAlergicos.map(a => a.descripcion).join(' · ')}
                </p>
                <p className="text-[11px] text-rose-600">
                  Verifique que los fármacos prescritos a continuación no generen reactividad alérgica con estos antecedentes.
                </p>
              </div>
            </div>
          )}

          {/* RESUMEN DE LA CONSULTA Y DIAGNÓSTICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Motivo de Consulta:</span>
              <p className="text-slate-800 font-medium">{consulta.motivo_consulta || 'Atención médica general'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Diagnósticos Emitidos (CIE-10):</span>
              <p className="text-teal-800 font-medium">
                {consulta.diagnosticos?.length > 0
                  ? consulta.diagnosticos.map(d => `${d.descripcion} (${d.tipo})`).join(', ')
                  : 'Sin diagnóstico formal codificado'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LISTA DINÁMICA DE MEDICAMENTOS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-serif italic font-bold text-xl text-teal-700">℞</span>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Medicamentos Prescritos ({detalles.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={agregarMedicamento}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Medicamento</span>
              </button>
            </div>

            <div className="space-y-4">
              {detalles.map((item, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      Medicamento #{index + 1}
                    </span>
                    {detalles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarMedicamento(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                        title="Eliminar este medicamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Nombre del Fármaco */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Nombre del Medicamento / Principio Activo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.medicamento}
                        onChange={(e) => actualizarDetalle(index, 'medicamento', e.target.value)}
                        placeholder="Ej. Amoxicilina 500mg, Paracetamol, Ibuprofeno..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        required
                      />
                    </div>

                    {/* Dosis */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Dosis <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.dosis}
                        onChange={(e) => actualizarDetalle(index, 'dosis', e.target.value)}
                        placeholder="Ej. 500 mg, 1 tableta..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        required
                      />
                      {/* Atajos de dosis */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ATRIBUTOS_DOSIS.slice(0, 4).map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => actualizarDetalle(index, 'dosis', d)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition border border-slate-200"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frecuencia */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Frecuencia <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.frecuencia}
                        onChange={(e) => actualizarDetalle(index, 'frecuencia', e.target.value)}
                        placeholder="Ej. Cada 8 horas..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        required
                      />
                      {/* Atajos de frecuencia */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ATRIBUTOS_FRECUENCIA.slice(0, 3).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => actualizarDetalle(index, 'frecuencia', f)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition border border-slate-200"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Duración */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Duración del Tratamiento <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.duracion}
                        onChange={(e) => actualizarDetalle(index, 'duracion', e.target.value)}
                        placeholder="Ej. Por 7 días..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                        required
                      />
                      {/* Atajos de duración */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {ATRIBUTOS_DURACION.slice(0, 4).map(du => (
                          <button
                            key={du}
                            type="button"
                            onClick={() => actualizarDetalle(index, 'duracion', du)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition border border-slate-200"
                          >
                            {du}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Indicaciones específicas del fármaco */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Indicaciones Específicas del Fármaco (Opcional)
                      </label>
                      <input
                        type="text"
                        value={item.indicaciones}
                        onChange={(e) => actualizarDetalle(index, 'indicaciones', e.target.value)}
                        placeholder="Ej. Tomar después del desayuno con abundante agua..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INDICACIONES GENERALES / HIGIÉNICO-DIETÉTICAS */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Recomendaciones Generales e Higiénico-Dietéticas</span>
              <span className="text-[11px] text-slate-400 font-normal">Opcional</span>
            </label>
            <textarea
              rows={3}
              value={indicacionesGenerales}
              onChange={(e) => setIndicacionesGenerales(e.target.value)}
              placeholder="Ej. Mantener reposo relativo, hidratación de 2 litros diarios, evitar consumo de grasas e irritantes, acudir a urgencias si la fiebre supera 38.5°C..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition leading-relaxed"
            />
          </div>

          {/* ACCIONES */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={agregarMedicamento}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir otro medicamento</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Emitiendo Receta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Emitir Receta Oficial</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
    </ModalPortal>
  );
}

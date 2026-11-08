import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Ban, Loader2 } from 'lucide-react';
import { ModalPortal } from '../../../components/ModalPortal';

/**
 * Modal de Anulación Lógica de Receta Médica (RN11 / CU18)
 */
export default function RecetaAnularModal({ receta, isOpen, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !receta) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const motivoLimpio = motivo.trim();

    if (motivoLimpio.length < 5) {
      setError('El motivo de anulación debe tener al menos 5 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(receta.id_receta, motivoLimpio);
      setMotivo('');
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al anular la receta médica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const caracteresMinimos = 5;
  const faltan = Math.max(0, caracteresMinimos - motivo.trim().length);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Anular Receta Médica #{receta.id_receta}</h3>
              <p className="text-xs text-rose-600">Baja lógica permanente (RN11)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Esta acción marcará la prescripción como <strong className="font-semibold">ANULADA</strong> en el expediente clínico y registrará el motivo en la bitácora de auditoría inmutable. No se borrará físicamente el registro.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="motivo_anulacion" className="text-xs font-semibold text-slate-700">
                Motivo de anulación <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${faltan > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                {faltan > 0 ? `Faltan ${faltan} caracteres` : `${motivo.length} caracteres`}
              </span>
            </div>
            <textarea
              id="motivo_anulacion"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Error en posología de amoxicilina, se emite nueva receta corregida..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              disabled={isSubmitting || motivo.trim().length < 5}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Anulando...</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Confirmar Anulación</span>
                </>
              )}
            </button>
          </div>
        </form>
    </ModalPortal>
  );
}

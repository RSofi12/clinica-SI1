import { useState, useEffect } from 'react';
import { usersService } from '../services/usersService';
import { X, Shield, Lock, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Modal para configuración administrativa de políticas de bloqueo temporal (CU01 / CU02)
 */
export function SecurityPolicyModal({ isOpen, onClose, onPolicyUpdated }) {
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [lockMinutes, setLockMinutes] = useState(5);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPolicy();
    }
  }, [isOpen]);

  const loadPolicy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersService.fetchSecurityPolicy();
      if (res.data) {
        setMaxAttempts(res.data.max_intentos_fallidos || 3);
        setLockMinutes(res.data.minutos_bloqueo || 5);
      }
    } catch (err) {
      setError('Error al cargar la política actual.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await usersService.updateSecurityPolicy({
        max_intentos_fallidos: Number(maxAttempts),
        minutos_bloqueo: Number(lockMinutes),
      });

      setSuccess('Política de seguridad actualizada con éxito.');
      if (onPolicyUpdated) {
        onPolicyUpdated(res.data);
      }
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al actualizar la política.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 text-base">
                Políticas de Bloqueo de Cuentas
              </h3>
              <p className="text-xs text-slate-500">Protección contra ataques de fuerza bruta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00687a]" />
              <span>Cargando configuración vigente...</span>
            </div>
          ) : (
            <>
              {/* Límite de Intentos Fallidos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Intentos Fallidos Consecutivos Permitidos
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-24 px-3 py-2 text-sm font-bold text-center rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    required
                  />
                  <span className="text-slate-500 text-[11px]">
                    intentos fallidos antes de aplicar el bloqueo (Recomendado: 3)
                  </span>
                </div>
              </div>

              {/* Tiempo de Penalización Temporal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Tiempo de Espera tras Bloqueo (Penalización)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={lockMinutes}
                    onChange={(e) => setLockMinutes(e.target.value)}
                    className="w-24 px-3 py-2 text-sm font-bold text-center rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    required
                  />
                  <span className="text-slate-500 text-[11px]">
                    minutos de bloqueo temporal (Recomendado: 5)
                  </span>
                </div>
              </div>

              {/* Explicación de Comportamiento */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                <p className="font-semibold text-slate-800">Comportamiento en la clínica:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Al fallar <strong>{maxAttempts} veces</strong>, la cuenta queda temporalmente suspendida durante <strong>{lockMinutes} minutos</strong>.</li>
                  <li>Al expirar los {lockMinutes} minutos, el sistema <strong>auto-desbloquea</strong> la cuenta automáticamente sin necesidad de llamar al soporte.</li>
                  <li>Cada bloqueo temporal se registra de inmediato en la <strong>Bitácora (CU03)</strong> para trazabilidad.</li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Política</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import { scheduleService } from '../services/scheduleService';

/**
 * Modal para Registrar Bloqueo de Horario o Feriado Institucional (CU08 / RF05 / P8.3)
 */
export function BlockModal({ isOpen, onClose, doctors = [], onBlockCreated, defaultDoctorId = null }) {
  const [formData, setFormData] = useState({
    id_medico: defaultDoctorId || '',
    fecha: new Date().toISOString().split('T')[0],
    es_dia_completo: true,
    hora_inicio: '08:00',
    hora_fin: '12:00',
    motivo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fecha) {
      setErrorMsg('Debe seleccionar la fecha del bloqueo o feriado.');
      return;
    }

    if (!formData.motivo.trim()) {
      setErrorMsg('Debe ingresar el motivo del bloqueo.');
      return;
    }

    if (!formData.es_dia_completo) {
      if (!formData.hora_inicio || !formData.hora_fin) {
        setErrorMsg('Debe indicar la hora de inicio y de fin.');
        return;
      }
      if (formData.hora_fin <= formData.hora_inicio) {
        setErrorMsg('La hora de fin debe ser posterior a la hora de inicio.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id_medico: formData.id_medico ? parseInt(formData.id_medico, 10) : null,
        fecha: formData.fecha,
        hora_inicio: formData.es_dia_completo ? null : formData.hora_inicio,
        hora_fin: formData.es_dia_completo ? null : formData.hora_fin,
        motivo: formData.motivo.trim(),
      };

      await scheduleService.createBlock(payload);
      onBlockCreated?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el bloqueo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004d5a] to-[#00687a] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base leading-tight">
                Registrar Bloqueo o Feriado
              </h3>
              <p className="text-xs text-cyan-100/80">
                CU08 / RF05 — Prevención de reservas en fechas no laborales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selección de Alcance: Institucional vs Médico Particular */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alcance del Bloqueo <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, id_medico: '' }))}
                className={`py-2 px-3 text-xs rounded-xl font-medium border text-center transition flex items-center justify-center gap-1.5 ${
                  formData.id_medico === ''
                    ? 'bg-cyan-50 border-[#00687a] text-[#00687a] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Feriado Institucional</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (doctors.length > 0 && !formData.id_medico) {
                    setFormData((prev) => ({ ...prev, id_medico: String(doctors[0].id_medico) }));
                  }
                }}
                className={`py-2 px-3 text-xs rounded-xl font-medium border text-center transition flex items-center justify-center gap-1.5 ${
                  formData.id_medico !== ''
                    ? 'bg-cyan-50 border-[#00687a] text-[#00687a] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Licencia Médica</span>
              </button>
            </div>

            {formData.id_medico !== '' && (
              <select
                value={formData.id_medico}
                onChange={(e) => setFormData((prev) => ({ ...prev, id_medico: e.target.value }))}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
              >
                {doctors.map((doc) => (
                  <option key={doc.id_medico} value={doc.id_medico}>
                    {doc.nombre_completo || `Dr(a). ${doc.nombres} ${doc.apellidos}`} — {doc.codigo_profesional}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {formData.id_medico === ''
                ? 'El bloqueo aplicará para toda la clínica (feriados nacionales, asuetos).'
                : 'El bloqueo aplicará únicamente para el médico seleccionado (licencia, congreso, vacaciones).'}
            </p>
          </div>

          {/* Fecha del Bloqueo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Aplicación <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
              className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
              required
            />
          </div>

          {/* Tipo de jornada: Día completo o Franja específica */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Duración del Bloqueo</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.es_dia_completo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, es_dia_completo: e.target.checked }))
                  }
                  className="rounded text-[#00687a] focus:ring-[#00687a] h-4 w-4"
                />
                <span className="text-xs text-slate-600 font-medium">Bloquear todo el día</span>
              </label>
            </div>

            {!formData.es_dia_completo && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Hora Inicio <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hora_inicio: e.target.value }))
                    }
                    className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Hora Fin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hora_fin: e.target.value }))}
                    className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo o Justificación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Feriado Nacional de Todos Santos / Asueto administrativo / Congreso"
              value={formData.motivo}
              onChange={(e) => setFormData((prev) => ({ ...prev, motivo: e.target.value }))}
              maxLength={255}
              className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
              required
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirmar Bloqueo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { patientProfileService } from '../services/patientProfileService';
import {
  X,
  Globe,
  User,
  Mail,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export function PatientWebAccountModal({ isOpen, onClose, patient, onCreated }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patient) {
      const defaultUser = `paciente.${patient.numero_documento}`;
      setFormData({
        username: defaultUser,
        email: patient.correo || '',
        password: '',
      });
      setError(null);
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      await patientProfileService.enableWebAccount(patient.id_paciente, formData);
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al habilitar la cuenta web.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md my-8 overflow-hidden transition-all animate-in fade-in zoom-in-95">
        {/* Cabecera */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00687a]/10 text-[#00687a]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 text-base">
                Habilitar Acceso Web
              </h3>
              <p className="text-xs text-slate-500">
                Asignación de credenciales en ventanilla (CU05)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resumen del Paciente */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-700 block">
              {patient.nombre_completo}
            </span>
            <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
              CI: {patient.numero_documento} • Historia: {patient.numero_historia}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de Usuario *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="paciente@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña Inicial *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]"
                required
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Habilitando...</span>
                </>
              ) : (
                <span>Habilitar Acceso Web</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

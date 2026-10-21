import { useState } from 'react';
import { patientProfileService } from '../services/patientProfileService';
import {
  X,
  CreditCard,
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function ActivatePatientModal({ isOpen, onClose, onActivated }) {
  const [step, setStep] = useState(1); // 1: Verificar CI, 2: Configurar Credenciales, 3: Éxito
  const [ci, setCi] = useState('');
  const [verifiedPatient, setVerifiedPatient] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setCi('');
    setVerifiedPatient(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
    });
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Paso 1: Verificar CI
  const handleCheckCi = async (e) => {
    e.preventDefault();
    if (!ci.trim()) {
      setError('Por favor ingrese su número de Cédula de Identidad (CI).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await patientProfileService.checkCi(ci);
      setVerifiedPatient(res.patient);
      setFormData((prev) => ({
        ...prev,
        email: res.patient.correo_sugerido || '',
        username: res.patient.numero_documento, // Sugerir su CI como usuario inicial
      }));
      setStep(2);
    } catch (err) {
      setError(err.message || 'No se pudo verificar la CI en el padrón.');
    } finally {
      setLoading(false);
    }
  };

  // Validación en tiempo real de contraseña
  const p = formData.password;
  const passwordChecks = {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    symbol: /[@$!%*?&#^_{}-]/.test(p),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Paso 2: Activar cuenta
  const handleActivate = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('La contraseña debe cumplir con todos los requisitos de seguridad.');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await patientProfileService.activateAccount({
        numero_documento: ci,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Error al activar la cuenta web.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg my-8 overflow-hidden transition-all animate-in fade-in zoom-in-95">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00687a]/10 text-[#00687a]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 text-lg">
                Activar Acceso de Paciente
              </h3>
              <p className="text-xs text-slate-500">
                Portal de autoservicio para pacientes registrados en la clínica (CU05 / §3.4)
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* PASO 1: Ingreso y Validación de CI */}
        {step === 1 && (
          <form onSubmit={handleCheckCi} className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-100 text-xs text-cyan-950 space-y-1">
              <p className="font-semibold text-[#00687a]">
                ¿Ya visitó la clínica o fue registrado en recepción?
              </p>
              <p className="text-slate-600">
                Ingrese su número de cédula de identidad para verificar su historia clínica y activar su cuenta digital.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Número de Cédula de Identidad (CI) *
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Ej. 12458901"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a] font-mono font-medium"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando CI...</span>
                  </>
                ) : (
                  <>
                    <span>Verificar en Padrón</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* PASO 2: Configuración de Credenciales */}
        {step === 2 && verifiedPatient && (
          <form onSubmit={handleActivate} className="p-6 space-y-4">
            {/* Confirmación del Paciente Verificado */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-950">
                  {verifiedPatient.nombre_completo}
                </p>
                <p className="text-emerald-700 font-mono text-[11px]">
                  Historia: {verifiedPatient.numero_historia} • CI: {verifiedPatient.numero_documento}
                </p>
              </div>
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
                  placeholder="usuario.paciente o su CI"
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
                Contraseña Segura *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]"
                  required
                />
              </div>
            </div>

            {/* Checklist de Contraseña Segura */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Criterios de Seguridad
              </span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <span className={`flex items-center gap-1 ${passwordChecks.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> 8+ caracteres
                </span>
                <span className={`flex items-center gap-1 ${passwordChecks.upper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> Mayúscula (A-Z)
                </span>
                <span className={`flex items-center gap-1 ${passwordChecks.lower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> Minúscula (a-z)
                </span>
                <span className={`flex items-center gap-1 ${passwordChecks.number ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> Un número (0-9)
                </span>
                <span className={`flex items-center gap-1 col-span-2 ${passwordChecks.symbol ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <Check className="w-3 h-3" /> Símbolo especial (@$!%*?&#)
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                ← Cambiar CI
              </button>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activando...</span>
                  </>
                ) : (
                  <span>Activar mi Cuenta</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* PASO 3: Éxito */}
        {step === 3 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-montserrat font-bold text-slate-900 text-lg">
                ¡Cuenta Activada Satisfactoriamente!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Su ficha médica ha sido vinculada a su cuenta de autoservicio. Ahora puede iniciar sesión con su usuario o correo y gestionar sus citas y datos.
              </p>
            </div>

            <button
              onClick={() => {
                handleClose();
                if (onActivated) onActivated();
              }}
              className="w-full bg-[#00687a] hover:bg-[#004d5a] text-white font-montserrat font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-md shadow-[#00687a]/20 cursor-pointer"
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

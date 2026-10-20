import { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  KeyRound,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import { BackgroundGlow } from '../components/BackgroundGlow';
import { authService } from '../apps/security/services/authService';

export const ForgotPasswordPage = ({ onNavigateLogin }) => {
  const [step, setStep] = useState(1); // 1: Pedir email, 2: Ingresar código y nueva clave
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Paso 1: Enviar solicitud de código al correo real
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setSuccessMsg(response.message || 'Código enviado exitosamente a tu bandeja de entrada.');
      setToken(''); // Campo limpio por seguridad
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Error al solicitar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Restablecer contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token || !password || !confirmPassword) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(email, token, password);
      setSuccessMsg(response.message || 'Contraseña actualizada.');
      setTimeout(() => {
        onNavigateLogin();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'El código es inválido o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#70cbff] selection:text-[#01171d] font-montserrat overflow-hidden">
      <BackgroundGlow />

      {/* Botón flotante para volver al Login */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-cyan-100/90 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 cursor-pointer shadow-xs active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-[#70cbff]" />
          <span>Volver al Login</span>
        </button>
      </div>

      {/* Tarjeta de Recuperación */}
      <div className="relative z-10 max-w-md w-full mx-auto">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/40 shadow-2xl shadow-cyan-950/40 text-slate-800 animate-fade-up">
          
          {/* Logo y Encabezado */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#00687a]/10 border border-[#00687a]/20 p-2.5 flex items-center justify-center">
              <img src={logoColorSvg} alt="Centro Médico La Cruz" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-montserrat font-bold text-lg text-slate-900 leading-tight">
                Centro Médico La Cruz
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#00687a]" />
                Recuperación de Contraseña
              </p>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="font-montserrat font-bold text-xl text-slate-900 tracking-tight">
              {step === 1 ? '¿Olvidaste tu contraseña?' : 'Nueva Contraseña'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {step === 1
                ? 'Ingresa el correo electrónico asociado a tu cuenta institucional o de paciente para enviarte un código de seguridad.'
                : `Ingresa el código de 6 dígitos enviado a ${email} y define tu nueva contraseña.`}
            </p>
          </div>

          {/* Mensajes de Feedback */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Paso 1: Formulario para ingresar el correo */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico Registrado
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00687a] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. admin@clinicalacruz.com o tu correo"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl font-montserrat font-bold text-sm text-white bg-gradient-to-r from-[#00687a] via-[#007b90] to-[#008b9e] hover:from-[#005564] hover:to-[#007485] shadow-lg shadow-[#00687a]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando código...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Paso 2: Formulario para ingresar el código y nueva contraseña */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Código de Verificación (6 dígitos)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00687a] transition-colors">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00687a] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 8 caracteres (1 Mayús, 1 Núm, 1 Especial)"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00687a] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-[#00687a] underline cursor-pointer"
                >
                  Cambiar correo
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl font-montserrat font-bold text-sm text-white bg-gradient-to-r from-[#00687a] via-[#007b90] to-[#008b9e] hover:from-[#005564] hover:to-[#007485] shadow-lg shadow-[#00687a]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Actualizando contraseña...</span>
                  </>
                ) : (
                  <span>Guardar Nueva Contraseña</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Proceso auditado y protegido con tokens temporales</span>
          </div>

        </div>
      </div>
    </div>
  );
};

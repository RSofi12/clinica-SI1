import { useState } from 'react';
import {
  Shield,
  LayoutGrid,
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Stethoscope,
  UserCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import { BackgroundGlow } from '../components/BackgroundGlow';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ onNavigateHome, onLoginSuccess, onNavigateForgotPassword, onOpenActivatePatient }) => {
  const { login } = useAuth();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRole, setSelectedRole] = useState('personal'); // 'personal' | 'paciente'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailOrUser || !password) {
      setErrorMsg('Por favor ingresa usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      await login(emailOrUser, password);
      setIsSuccess(true);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#70cbff] selection:text-[#01171d] font-montserrat overflow-hidden">
      <BackgroundGlow />

      {/* Botón flotante para volver en esquina superior */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-cyan-100/90 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5 cursor-pointer shadow-xs active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-[#70cbff]" />
          <span>Volver al inicio</span>
        </button>
      </div>

      {/* Contenedor Principal Centrado (2 columnas) */}
      <div className="relative z-10 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center animate-fade-up pt-12 lg:pt-0">
        
        {/* Columna Izquierda: Logo con resplandor turquesa e identidad de la clínica */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          
          <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
            <div className="relative group shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-[#70cbff]/35 blur-xl pointer-events-none animate-pulse-glow" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5 border border-[#70cbff]/40 bg-gradient-to-br from-[#003844]/90 via-[#00222a]/95 to-[#00171d] backdrop-blur-xl shadow-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logoColorSvg}
                  alt="Centro Médico La Cruz"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(112,203,255,0.45)]"
                />
              </div>
            </div>

            <div className="text-left">
              <h1 className="font-montserrat font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                Centro Médico <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#70cbff]">
                  La Cruz
                </span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-[#70cbff] font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#70cbff]" />
                <span>Portal Clínico Unificado</span>
              </div>
            </div>
          </div>

          <p className="text-cyan-100/80 text-xs sm:text-sm leading-relaxed mb-6 max-w-md">
            Acceso seguro y centralizado para personal médico, recepción, administración y pacientes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-8">
            <div className="group p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.07] hover:border-[#70cbff]/40 transition-all duration-300 text-left">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white mb-1">
                <div className="p-1.5 rounded-lg bg-[#00687a]/40 text-[#70cbff] border border-[#70cbff]/20">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span>Agenda en Tiempo Real</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-normal pl-8">
                Visualización de citas, turnos y disponibilidad médica inmediata.
              </p>
            </div>

            <div className="group p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.07] hover:border-[#70cbff]/40 transition-all duration-300 text-left">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white mb-1">
                <div className="p-1.5 rounded-lg bg-[#00687a]/40 text-[#70cbff] border border-[#70cbff]/20">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span>Historial Protegido</span>
              </div>
              <p className="text-[11px] text-cyan-100/70 leading-normal pl-8">
                Expedientes y datos de salud resguardados con cifrado seguro.
              </p>
            </div>
          </div>

          {/* Tarjeta de estado de conectividad */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-md text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Servidor Clínico Operativo (Laravel + Postgres)</span>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Login Flotante */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/40 shadow-2xl shadow-cyan-950/40 text-slate-800">
            
            {/* Selector de Pestañas: Personal de la Clínica vs Paciente */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('personal');
                  setEmailOrUser('admin');
                  setPassword('Admin123@');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'personal'
                    ? 'bg-white text-[#00687a] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Personal Médico</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('paciente');
                  setEmailOrUser('paciente.carlos');
                  setPassword('Admin123@');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'paciente'
                    ? 'bg-white text-[#00687a] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Portal Paciente</span>
              </button>
            </div>

            <div className="mb-5">
              <h2 className="font-montserrat font-bold text-xl text-slate-900 tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {selectedRole === 'personal'
                  ? 'Ingresa tus credenciales de funcionario médico o administrativo.'
                  : 'Ingresa con tu documento de identidad (CI) y contraseña.'}
              </p>
            </div>

            {/* Mensaje de Error */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: Usuario / CI / Correo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {selectedRole === 'personal' ? 'Usuario o Correo Institucional' : 'Carnet de Identidad (CI) o Correo'}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00687a] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    placeholder={
                      selectedRole === 'personal'
                        ? 'Ej. admin o doctor@clinicalacruz.com'
                        : 'Ej. paciente.carlos o correo@gmail.com'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Campo: Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contraseña
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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Opciones: Recordarme / Olvidaste contraseña */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#00687a] focus:ring-[#00687a] accent-[#00687a] transition"
                  />
                  <span className="text-xs text-slate-600 font-medium">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateForgotPassword) {
                      onNavigateForgotPassword();
                    }
                  }}
                  className="text-xs font-semibold text-[#00687a] hover:text-[#004d5a] hover:underline transition cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="w-full mt-2 py-3.5 px-4 rounded-xl font-montserrat font-bold text-sm text-white bg-gradient-to-r from-[#00687a] via-[#007b90] to-[#008b9e] hover:from-[#005564] hover:to-[#007485] shadow-lg shadow-[#00687a]/20 hover:shadow-xl hover:shadow-[#00687a]/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validando credenciales...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-scale" />
                    <span>¡Acceso autorizado!</span>
                  </>
                ) : (
                  <span>
                    {selectedRole === 'personal' ? 'Ingresar al Sistema Clínico' : 'Acceder al Portal del Paciente'}
                  </span>
                )}
              </button>
            </form>

            {/* Acceso para Pacientes sin Cuenta Web (CU05) */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onOpenActivatePatient}
                className="text-xs font-semibold text-[#00687a] hover:text-[#004d5a] hover:underline transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>¿Es paciente y aún no tiene acceso? Activar con CI →</span>
              </button>
            </div>

            {/* Aviso de seguridad institucional al pie */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Conexión cifrada de nivel hospitalario</span>
            </div>

            {/* Guía rápida de credenciales de prueba */}
            <div className="mt-3 text-center">
              <span className="text-[11px] text-slate-400">
                Clave demo para todos los roles: <strong className="text-slate-600">Admin123@</strong>
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

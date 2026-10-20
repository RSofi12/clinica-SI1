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
} from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import { BackgroundGlow } from '../components/BackgroundGlow';

export const LoginPage = ({ onNavigateHome, onLoginSuccess }) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState('personal'); // 'personal' | 'paciente'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailOrUser || !password) return;

    setIsLoading(true);
    // Simulación con micro-interacción de éxito y transición suave
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    }, 700);
  };

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#70cbff] selection:text-[#01171d] font-montserrat overflow-hidden">
      <BackgroundGlow />

      {/* Botón flotante para volver en esquina superior en móviles/escritorio */}
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
        
        {/* ─────────────────────────────────────────────────────────────
            Columna Izquierda (1era mitad de la página):
            - Logo con resplandor fluido
            - Identidad y propuesta de valor
            - Pilares de seguridad y gestión clínica
        ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          
          {/* Logo SVG con animación suave de resplandor */}
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

          {/* Tarjetas informativas con hover interactivo sutil */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            <div className="group flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#70cbff]/40 backdrop-blur-md shadow-xs transition-all duration-300 hover:translate-x-1">
              <div className="p-2.5 rounded-xl bg-[#00687a]/40 text-[#70cbff] border border-[#70cbff]/25 shrink-0 group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Acceso seguro y verificado
                </div>
                <div className="text-[11px] text-cyan-200/70">
                  Protección estricta de historias clínicas y confidencialidad médica
                </div>
              </div>
            </div>

            <div className="group flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#70cbff]/40 backdrop-blur-md shadow-xs transition-all duration-300 hover:translate-x-1">
              <div className="p-2.5 rounded-xl bg-[#00687a]/40 text-[#70cbff] border border-[#70cbff]/25 shrink-0 group-hover:scale-110 transition-transform">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Gestión integral por roles
                </div>
                <div className="text-[11px] text-cyan-200/70">
                  Módulos específicos para doctores, recepción, admisiones y pacientes
                </div>
              </div>
            </div>

            <div className="group flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#70cbff]/40 backdrop-blur-md shadow-xs transition-all duration-300 hover:translate-x-1">
              <div className="p-2.5 rounded-xl bg-[#00687a]/40 text-[#70cbff] border border-[#70cbff]/25 shrink-0 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Monitoreo de agenda en tiempo real
                </div>
                <div className="text-[11px] text-cyan-200/70">
                  Control de citas, salas de espera y reportes administrativos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Columna Derecha: Tarjeta de Iniciar Sesión (Blanca, nítida)
        ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="bg-white text-slate-800 rounded-3xl sm:rounded-[32px] p-6 sm:p-10 shadow-2xl shadow-cyan-950/60 w-full max-w-md border border-white/90 relative">
            
            {/* Cabecera de la tarjeta con badge dinámico */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-montserrat font-bold text-2xl text-[#003844] tracking-tight">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedRole === 'personal'
                    ? 'Acceso a la plataforma administrativa y médica'
                    : 'Acceso para consulta y reserva de citas'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#00687a]/10 p-2 flex items-center justify-center border border-[#00687a]/15 shadow-xs">
                <img src={logoColorSvg} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Selector de rol con pestaña deslizante */}
            <div className="relative p-1 bg-slate-100/90 rounded-2xl mb-6 text-xs font-semibold grid grid-cols-2 gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setSelectedRole('personal')}
                className={`relative z-10 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'personal'
                    ? 'bg-white text-[#00687a] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Stethoscope className={`w-4 h-4 transition-transform ${selectedRole === 'personal' ? 'scale-110 text-[#00687a]' : 'text-slate-400'}`} />
                <span>Personal Clínico</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('paciente')}
                className={`relative z-10 py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'paciente'
                    ? 'bg-white text-[#00687a] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className={`w-4 h-4 transition-transform ${selectedRole === 'paciente' ? 'scale-110 text-[#00687a]' : 'text-slate-400'}`} />
                <span>Portal Paciente</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: Usuario o correo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {selectedRole === 'personal' ? 'Usuario o correo institucional' : 'Cédula de Identidad o Correo'}
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
                        ? 'admin o doctor@clinicalacruz.bo'
                        : 'Ej. 7654321 o paciente@correo.com'
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
                <a
                  href="#recuperar"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Función de recuperación: se enviará un enlace de verificación a tu correo registrado.');
                  }}
                  className="text-xs font-semibold text-[#00687a] hover:text-[#004d5a] hover:underline transition"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón de Enviar con micro-estados */}
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

            {/* Aviso de seguridad institucional al pie */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Conexión cifrada de nivel hospitalario</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

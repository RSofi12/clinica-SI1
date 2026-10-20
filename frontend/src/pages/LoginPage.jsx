import { useState } from 'react';
import { Shield, LayoutGrid, Activity, Mail, Lock, Eye, EyeOff, ChevronLeft, Stethoscope, UserCheck } from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import { BackgroundGlow } from '../components/BackgroundGlow';

export const LoginPage = ({ onNavigateHome, onLoginSuccess }) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('personal');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulación temporal para feedback visual del botón
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 700);
  };

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#70cbff] selection:text-[#01171d] font-montserrat">
      <BackgroundGlow />

      {/* Contenedor Principal Centrado (2 columnas) */}
      <div className="relative z-10 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* ─────────────────────────────────────────────────────────────
            Columna Izquierda (1era mitad de la página):
            - Logo SVG con el Título de la clínica a su derecha
            - Subtítulo y acreditación institucional
            - Tarjetas de seguridad y gestión por roles
        ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          
          {/* Logo SVG a la izquierda con el título de la clínica a su derecha */}
          <div className="flex items-center gap-4 sm:gap-5 mb-8">
            <div className="relative group shrink-0">
              {/* Resplandor sutil del logo */}
              <div className="absolute inset-0 rounded-2xl bg-[#70cbff]/30 blur-xl pointer-events-none" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5 border border-[#70cbff]/40 bg-gradient-to-br from-[#003844]/80 via-[#00222a]/90 to-[#00171d] backdrop-blur-xl shadow-2xl flex items-center justify-center">
                <img
                  src={logoColorSvg}
                  alt="Centro Médico La Cruz"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(112,203,255,0.4)]"
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
              <p className="text-xs sm:text-sm text-[#70cbff] font-medium tracking-wide mt-0.5">
                Clínica de Atención Primaria
              </p>
            </div>
          </div>

          {/* Subtítulo descriptivo institucional */}
          <p className="text-cyan-100/75 text-xs sm:text-sm leading-relaxed mb-6 max-w-md">
            Plataforma unificada para personal médico, especialistas, recepción, administración y pacientes.
          </p>

          {/* Lista de Seguridad / Rol con Iconos */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-xl bg-[#00687a]/30 text-[#70cbff] border border-[#70cbff]/20 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Acceso seguro y controlado
                </div>
                <div className="text-[11px] text-cyan-200/70">
                  Protección de historias clínicas y confidencialidad médica
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-xl bg-[#00687a]/30 text-[#70cbff] border border-[#70cbff]/20 shrink-0">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Gestión integral por roles
                </div>
                <div className="text-[11px] text-cyan-200/70">
                  Médicos, especialistas, recepción, admin y pacientes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-xl bg-[#00687a]/30 text-[#70cbff] border border-[#70cbff]/20 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Historiales y consultas en vivo
                </div>
                <div className="text-[11px] text-cyan-200/70">
                  Citas, recetas electrónicas y resultados de laboratorio
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Columna Derecha: Tarjeta de Iniciar Sesión (Blanca, nítida)
        ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="bg-white text-slate-800 rounded-[28px] sm:rounded-[32px] p-7 sm:p-10 shadow-2xl shadow-cyan-950/50 w-full max-w-md border border-white/90">
            
            {/* Cabecera de la tarjeta */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-montserrat font-bold text-2xl text-[#003844] tracking-tight">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa tus credenciales para acceder al sistema
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#00687a]/10 p-1.5 flex items-center justify-center border border-[#00687a]/15">
                <img src={logoColorSvg} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Selector de tipo de acceso (Personal / Paciente) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedRole('personal')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'personal'
                    ? 'bg-white text-[#00687a] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Personal Clínico</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('paciente')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'paciente'
                    ? 'bg-white text-[#00687a] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Paciente</span>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: Usuario o correo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {selectedRole === 'personal' ? 'Usuario o correo institucional' : 'Cédula de Identidad o Correo'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:bg-white focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Campo: Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:bg-white focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Opciones: Recordarme / Olvidaste contraseña */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#00687a] focus:ring-[#00687a] accent-[#00687a]"
                  />
                  <span className="text-xs text-slate-600 font-medium">Recordarme</span>
                </label>
                <a
                  href="#recuperar"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Función de recuperación: se enviará un enlace seguro a tu correo registrado.');
                  }}
                  className="text-xs font-semibold text-[#00687a] hover:text-[#004e5b] hover:underline transition"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl font-montserrat font-bold text-sm text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:from-[#005564] hover:to-[#007485] shadow-lg shadow-[#00687a]/25 hover:shadow-cyan-900/30 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>
                    {selectedRole === 'personal' ? 'Ingresar al Sistema Clínico' : 'Acceder al Portal del Paciente'}
                  </span>
                )}
              </button>
            </form>

            {/* Enlace de regreso al Inicio */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#00687a] transition group cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Volver a la página de inicio</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

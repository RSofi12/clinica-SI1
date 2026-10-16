import React, { useState } from 'react';
import { Shield, LayoutGrid, Activity, Mail, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import logoColor from '../assets/logo-clinica-color.png';
import { BackgroundGlow } from '../components/BackgroundGlow';

interface LoginPageProps {
  onNavigateHome: () => void;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateHome, onLoginSuccess }) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulación temporal para feedback visual del botón
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-[#70cbff] selection:text-[#01171d]">
      <BackgroundGlow />

      {/* Contenedor Principal Centrado (2 columnas) */}
      <div className="relative z-10 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* Columna Izquierda: Logo, Marca y Características de Seguridad */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
          
          {/* Esfera / Contenedor Circular con Logo */}
          <div className="relative mb-6">
            {/* Glow de la esfera */}
            <div className="absolute inset-0 rounded-full bg-[#00687a]/50 blur-2xl pointer-events-none" />

            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full p-2 border border-cyan-400/25 bg-gradient-to-br from-[#003844]/70 via-[#00222a]/80 to-[#00171d]/90 backdrop-blur-xl shadow-2xl shadow-black/60 flex items-center justify-center group">
              {/* Anillos interiores */}
              <div className="absolute inset-3 rounded-full border border-[#70cbff]/15" />
              <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center p-2">
                <img
                  src={logoColor}
                  alt="Centro Médico La Cruz"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(112,203,255,0.45)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Punto de destello superior */}
              <div className="absolute top-6 right-8 w-2.5 h-2.5 rounded-full bg-[#70cbff] blur-[0.5px] shadow-[0_0_10px_#70cbff]" />
            </div>
          </div>

          {/* Nombre de la Clínica */}
          <h2 className="font-montserrat font-bold text-2xl sm:text-3xl text-white mb-8 tracking-tight">
            Centro Médico La Cruz
          </h2>

          {/* Lista de Seguridad / Rol con Iconos */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-xl bg-[#00687a]/30 text-[#70cbff] border border-[#70cbff]/20">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-cyan-100/85">
                Acceso seguro y controlado
              </span>
            </div>

            <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-xl bg-[#00687a]/30 text-[#70cbff] border border-[#70cbff]/20">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-cyan-100/85">
                Gestión de equipo y responsabilidades
              </span>
            </div>

            <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-xl bg-[#00687a]/30 text-[#70cbff] border border-[#70cbff]/20">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-cyan-100/85">
                Registro de actividad relevante
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Iniciar Sesión */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="bg-white text-slate-800 rounded-[28px] sm:rounded-[32px] p-7 sm:p-10 shadow-2xl shadow-cyan-950/50 w-full max-w-md border border-white/90">
            
            {/* Título de la tarjeta */}
            <h3 className="font-montserrat font-bold text-2xl text-slate-900 tracking-tight">
              Iniciar Sesión
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Ingresa tus credenciales para acceder al sistema
            </p>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: Usuario o correo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Usuario o correo
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
                    placeholder="admin o correo@dominio.com"
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
                    alert('Función de recuperación: conectaremos este flujo al backend.');
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
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
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
                <span>Volver al inicio</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

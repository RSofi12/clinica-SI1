import React from 'react';
import { Shield, LogIn, LayoutGrid } from 'lucide-react';
import logoColor from '../assets/logo-clinica-color.png';
import { BackgroundGlow } from '../components/BackgroundGlow';

interface HomePageProps {
  onNavigateLogin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateLogin }) => {
  return (
    <div className="relative min-h-screen text-white flex flex-col justify-between selection:bg-[#70cbff] selection:text-[#01171d]">
      <BackgroundGlow />

      {/* Barra de navegación superior */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Marca / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00687a]/30 border border-[#70cbff]/30 p-2 flex items-center justify-center backdrop-blur-md shadow-sm shadow-[#00687a]/20">
            <img src={logoColor} alt="Logo Centro Médico La Cruz" className="w-full h-full object-contain filter drop-shadow" />
          </div>
          <span className="font-montserrat font-bold text-lg sm:text-xl tracking-tight text-white">
            Centro Médico La Cruz
          </span>
        </div>

        {/* Botón de acceso superior */}
        <button
          onClick={onNavigateLogin}
          className="group flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#70cbff]/50 text-sm font-medium text-white transition-all duration-200 backdrop-blur-sm cursor-pointer shadow-sm hover:shadow-[#70cbff]/10"
        >
          <LogIn className="w-4 h-4 text-[#70cbff] group-hover:translate-x-0.5 transition-transform" />
          <span>Iniciar Sesión</span>
        </button>
      </header>

      {/* Sección Hero Principal */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 py-12 lg:py-16 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          
          {/* Columna Izquierda: Información y Acceso */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            {/* Badge de Acceso Interno */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-cyan-200/90 font-medium mb-8 backdrop-blur-md shadow-inner">
              <Shield className="w-4 h-4 text-[#70cbff]" />
              <span>Acceso interno</span>
            </div>

            {/* Título Principal en Montserrat Bold */}
            <h1 className="font-montserrat font-bold text-4xl sm:text-6xl xl:text-7xl leading-[1.08] tracking-tight text-white mb-6">
              Administración <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#70cbff]">
                interna
              </span>
            </h1>

            {/* Párrafo descriptivo */}
            <p className="text-cyan-100/75 text-base sm:text-lg leading-relaxed max-w-xl mb-10 font-normal">
              Espacio reservado al personal de la clínica para administrar accesos, consultas, agenda médica y conservar un registro claro de la actividad cuando haga falta revisarla.
            </p>

            {/* Botón de Iniciar Sesión (Pill Button con resplandor) */}
            <button
              onClick={onNavigateLogin}
              className="group flex items-center gap-3 bg-white hover:bg-[#70cbff] text-[#004d5a] hover:text-[#002730] px-8 py-3.5 rounded-full font-montserrat font-bold text-base transition-all duration-300 shadow-xl shadow-cyan-950/60 hover:shadow-cyan-400/30 hover:scale-[1.02] cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-[#00687a] group-hover:text-[#002730] group-hover:translate-x-1 transition-all" />
              <span>Iniciar sesión</span>
            </button>

            {/* Puntos clave al pie del hero */}
            <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-5 sm:gap-8 text-xs sm:text-sm text-cyan-100/70">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-[#70cbff] shrink-0" />
                <span>Un solo panel para la gestión del día a día</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#70cbff] shrink-0" />
                <span>Accesos alineados con el rol de cada persona en la clínica</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Ilustración Circular Central con Logo */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            
            {/* Resplandor de fondo de la esfera */}
            <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#00687a]/40 blur-[80px] pointer-events-none" />

            {/* Esfera / Contenedor Circular */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full p-2 border border-cyan-400/20 bg-gradient-to-br from-[#003844]/60 via-[#00222a]/80 to-[#00171d]/90 backdrop-blur-xl shadow-2xl shadow-black/60 flex items-center justify-center group">
              
              {/* Anillos orbitales sutiles */}
              <div className="absolute inset-4 rounded-full border border-[#70cbff]/15 border-dashed animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-10 rounded-full border border-cyan-300/10" />

              {/* Logo con brillo central */}
              <div className="relative z-10 w-44 sm:w-56 md:w-64 h-44 sm:h-56 md:h-64 flex items-center justify-center p-4">
                <img
                  src={logoColor}
                  alt="Centro Médico La Cruz"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(112,203,255,0.4)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Punto de luz brillante en el borde */}
              <div className="absolute top-10 right-14 w-3 h-3 rounded-full bg-[#70cbff] blur-[1px] shadow-[0_0_12px_#70cbff]" />
            </div>

          </div>

        </div>
      </main>

      {/* Footer sutil */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-10 py-6 text-center text-xs text-cyan-200/40">
        © {new Date().getFullYear()} Centro Médico La Cruz · Todos los derechos reservados
      </footer>
    </div>
  );
};

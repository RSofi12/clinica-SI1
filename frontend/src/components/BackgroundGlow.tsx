import React from 'react';

export const BackgroundGlow: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Fondo base gradiente turquesa oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#01171d] via-[#002b35] to-[#00414d]" />

      {/* Luces radiales de ambiente (Glows turquesa y cyan) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00687a]/30 blur-[120px]" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00505e]/25 blur-[150px]" />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-[#007f96]/20 blur-[160px]" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[#70cbff]/10 blur-[140px]" />

      {/* Partículas / puntos sutiles flotantes */}
      <div className="absolute top-[18%] left-[12%] w-1.5 h-1.5 rounded-full bg-[#70cbff]/40 blur-[0.5px] animate-pulse" />
      <div className="absolute top-[28%] right-[35%] w-1 h-1 rounded-full bg-[#70cbff]/30 blur-[0.5px]" />
      <div className="absolute top-[65%] left-[8%] w-2 h-2 rounded-full bg-[#70cbff]/25 blur-[1px] animate-pulse" />
      <div className="absolute bottom-[22%] left-[32%] w-1.5 h-1.5 rounded-full bg-[#70cbff]/35 blur-[0.5px]" />
      <div className="absolute top-[42%] right-[15%] w-1 h-1 rounded-full bg-[#70cbff]/30 blur-[0.5px]" />
      <div className="absolute bottom-[15%] right-[25%] w-2 h-2 rounded-full bg-[#70cbff]/20 blur-[1px] animate-pulse" />
    </div>
  );
};

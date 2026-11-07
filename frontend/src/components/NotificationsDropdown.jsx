import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Sparkles, X, ShieldAlert } from 'lucide-react';

/**
 * Componente de Notificaciones del Sistema (Precursor UI para CU20 / CU21 - Notificaciones Push)
 * Diseñado con estética editorial clínica limpia y transiciones fluidas.
 */
export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de Campana */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
          isOpen
            ? 'bg-[#00687a]/10 text-[#00687a] border-[#00687a]/30 shadow-xs'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'
        }`}
        title="Notificaciones del sistema"
        aria-label="Abrir panel de notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {/* Dot indicador sutil */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00687a] ring-2 ring-white" />
      </button>

      {/* Panel Flotante de Notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-modal-panel">
          {/* Cabecera */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif-clinical font-semibold text-slate-900 text-sm">
                Notificaciones
              </span>
              <span className="text-[10px] font-bold text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-full border border-[#00687a]/20">
                0 nuevas
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cuerpo: Estado Vacío Elegante */}
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#00687a]/10 text-[#00687a] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Bell className="w-6 h-6 stroke-[1.75]" />
            </div>

            <h4 className="font-serif-clinical font-semibold text-slate-900 text-sm">
              Sin notificaciones pendientes
            </h4>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Por el momento no tienes avisos ni recordatorios sin leer. Aquí recibirás alertas de citas, cambios de estado y avisos institucionales.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2 text-left">
              <Sparkles className="w-4 h-4 text-[#00687a] shrink-0 mt-0.5" />
              <span>
                <strong>Próximamente (CU20 / CU21):</strong> Notificaciones push automáticas, recordatorios SMS/Email y confirmaciones de pago con Stripe.
              </span>
            </div>
          </div>

          {/* Footer Informativo */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Servicio activo
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Centro Médico La Cruz
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

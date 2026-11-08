import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Contenedor Maestro de Modales en Portal con Bloqueo de Scroll,
 * Cierre en Backdrop y Transición Fluida de Entrada y Salida
 * Garantiza que todo modal se fije al viewport y sea inmune al scroll de contenedores internos.
 */
export function ModalPortal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  panelClassName = '',
  duration = 200,
}) {
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
    } else if (prevIsOpen.current && !isOpen) {
      // Activar animación fluida de salida
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, duration]);

  useEffect(() => {
    if (!mounted) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isClosing) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mounted, isClosing, onClose]);

  if (!mounted) return null;

  const defaultPanelClass = `bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full ${maxWidth} my-auto overflow-hidden cursor-default ${
    isClosing ? 'animate-modal-panel-out' : 'animate-modal-panel'
  }`;

  let resolvedPanelClass = panelClassName;
  if (!resolvedPanelClass) {
    resolvedPanelClass = defaultPanelClass;
  } else {
    if (isClosing) {
      resolvedPanelClass = resolvedPanelClass.replace(
        /\banimate-modal-panel\b/g,
        'animate-modal-panel-out'
      );
      if (!resolvedPanelClass.includes('animate-modal-panel-out')) {
        resolvedPanelClass += ' animate-modal-panel-out';
      }
    } else if (!resolvedPanelClass.includes('animate-modal-panel')) {
      resolvedPanelClass += ' animate-modal-panel';
    }
  }

  const backdropAnimClass = isClosing
    ? 'animate-modal-backdrop-out'
    : 'animate-modal-backdrop';

  const modalMarkup = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isClosing) {
          onClose?.();
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto cursor-pointer ${backdropAnimClass} ${className}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={resolvedPanelClass}
      >
        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalMarkup, document.body)
    : modalMarkup;
}

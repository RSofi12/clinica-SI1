import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

export const ModalCloseContext = createContext(null);

export function useModalClose() {
  return useContext(ModalCloseContext);
}

/**
 * Contenedor Maestro de Modales en Portal con Bloqueo de Scroll,
 * Cierre en Backdrop y Transición Fluida de Entrada y Salida.
 * Garantiza que todo modal se fije al viewport y sea inmune al scroll de contenedores internos.
 */
export function ModalPortal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  panelClassName = '',
  duration = 220,
}) {
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const prevIsOpen = useRef(isOpen);
  const closingTimeoutRef = useRef(null);

  const handleRequestClose = () => {
    if (isClosing || !mounted) return;
    setIsClosing(true);
    if (closingTimeoutRef.current) clearTimeout(closingTimeoutRef.current);
    closingTimeoutRef.current = setTimeout(() => {
      onClose?.();
      setMounted(false);
      setIsClosing(false);
      closingTimeoutRef.current = null;
    }, duration);
  };

  useEffect(() => {
    if (isOpen) {
      if (closingTimeoutRef.current) {
        clearTimeout(closingTimeoutRef.current);
        closingTimeoutRef.current = null;
      }
      setMounted(true);
      setIsClosing(false);
    } else if (prevIsOpen.current && !isOpen && mounted && !isClosing) {
      // Si el padre puso isOpen en false externamente, animar salida fluida antes de desmontar
      setIsClosing(true);
      closingTimeoutRef.current = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
        closingTimeoutRef.current = null;
      }, duration);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, mounted, isClosing, duration]);

  useEffect(() => {
    return () => {
      if (closingTimeoutRef.current) {
        clearTimeout(closingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mounted, isClosing]);

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
    } else {
      resolvedPanelClass = resolvedPanelClass.replace(
        /\banimate-modal-panel-out\b/g,
        'animate-modal-panel'
      );
      if (!resolvedPanelClass.includes('animate-modal-panel')) {
        resolvedPanelClass += ' animate-modal-panel';
      }
    }
  }

  const backdropAnimClass = isClosing
    ? 'animate-modal-backdrop-out'
    : 'animate-modal-backdrop';

  const modalMarkup = (
    <ModalCloseContext.Provider value={handleRequestClose}>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleRequestClose();
          }
        }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto cursor-pointer ${backdropAnimClass} ${className}`}
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            // Interceptar elementos con data-modal-close="true" para salida fluida
            const closeTrigger = e.target.closest('[data-modal-close="true"]');
            if (closeTrigger) {
              e.preventDefault();
              handleRequestClose();
            }
          }}
          className={resolvedPanelClass}
        >
          {typeof children === 'function'
            ? children({ requestClose: handleRequestClose, isClosing })
            : children}
        </div>
      </div>
    </ModalCloseContext.Provider>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalMarkup, document.body)
    : modalMarkup;
}

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Contenedor Maestro de Modales en Portal con Bloqueo de Scroll y Cierre en Backdrop
 * Garantiza que todo modal se fije al viewport y sea inmune al scroll de contenedores internos.
 */
export function ModalPortal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  panelClassName = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultPanelClass = `bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full ${maxWidth} my-auto overflow-hidden animate-modal-panel cursor-default`;
  const resolvedPanelClass = panelClassName || defaultPanelClass;

  const modalMarkup = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-modal-backdrop cursor-pointer ${className}`}
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

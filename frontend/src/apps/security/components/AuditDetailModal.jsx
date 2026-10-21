import { X, Shield, Clock, Globe, Database, FileText, User as UserIcon, AlertCircle } from 'lucide-react';

/**
 * Modal para inspección a detalle de un evento de bitácora (CU03)
 */
export function AuditDetailModal({ isOpen, onClose, log }) {
  if (!isOpen || !log) return null;

  const getActionBadge = (accion) => {
    if (accion.includes('EXITOSO') || accion.includes('CREAR')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (accion.includes('FALLIDO') || accion.includes('BLOQUEADO')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (accion.includes('CAMBIO') || accion.includes('DESBLOQUEO') || accion.includes('MODIFICAR')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00687a]/10 text-[#00687a]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 text-base">
                Detalle de Evento #{log.id_bitacora}
              </h3>
              <p className="text-xs text-slate-500">CU03: Registro Inmutable de Auditoría</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 text-xs">
          {/* Módulo y Acción */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Módulo</span>
              <span className="font-semibold text-slate-800 text-sm">{log.modulo}</span>
            </div>
            <div>
              <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg border ${getActionBadge(log.accion)}`}>
                {log.accion}
              </span>
            </div>
          </div>

          {/* Operador Responsable */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Operador Responsable
            </span>
            {log.usuario ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{log.usuario.username}</p>
                  <p className="text-slate-500 text-[11px]">{log.usuario.email}</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#00687a]/10 text-[#00687a] uppercase">
                  {log.usuario.tipo_usuario}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 italic">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Sistema / Intento de Acceso Anónimo (Sin sesión activa)</span>
              </div>
            )}
          </div>

          {/* Descripción del Suceso */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Descripción del Evento
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-mono text-[11px]">
              {log.descripcion || 'Sin descripción adicional registrada.'}
            </div>
          </div>

          {/* Metadatos Técnicos (IP, Tabla, Entidad, Fecha) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                <Globe className="w-3 h-3 text-slate-400" /> IP de Origen
              </span>
              <span className="font-mono text-slate-800 font-semibold">{log.ip_origen || '127.0.0.1'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                <Database className="w-3 h-3 text-slate-400" /> Tabla / Registro
              </span>
              <span className="font-mono text-slate-800">
                {log.tabla_afectada ? `${log.tabla_afectada} #${log.id_registro || 'N/A'}` : 'Sin entidad directa'}
              </span>
            </div>

            <div className="col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Fecha y Hora Oficial
              </span>
              <span className="font-medium text-slate-700">
                {new Date(log.fecha_registro).toLocaleString('es-BO', { dateStyle: 'full', timeStyle: 'medium' })}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl transition cursor-pointer"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

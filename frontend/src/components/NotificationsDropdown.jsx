import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Calendar,
  CalendarClock,
  CalendarX,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { notificationService } from '../apps/integrations/services/notificationService';
import { useAuth } from '../context/AuthContext';

/**
 * Componente de Notificaciones y Recordatorios en Tiempo Real (CU20 / Paquete 5)
 * Metodología PUDS / RUP — Centro Médico La Cruz
 */
export function NotificationsDropdown() {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('todas'); // 'todas' | 'no_leidas' | 'recordatorios'
  const [triggering, setTriggering] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const dropdownRef = useRef(null);

  const canTriggerReminders = role === 'ADMIN' || role === 'RECEPCIONISTA';

  // Mostrar aviso efímero tipo toast
  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Cargar conteo rápido de no leídas
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.fetchUnreadCount();
      if (res && res.success) {
        setUnreadCount(res.unread_count || 0);
      }
    } catch {
      // Silencioso en background polling
    }
  }, []);

  // Cargar listado completo de notificaciones
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 25 };
      if (activeTab === 'no_leidas') {
        params.no_leidas = true;
      } else if (activeTab === 'recordatorios') {
        params.tipo = 'RECORDATORIO_24H';
      }

      const res = await notificationService.fetchNotifications(params);
      if (res && res.success) {
        const items = res.data?.data || res.data || [];
        setNotifications(items);
        if (typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        }
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Polling de unreadCount cada 30 segundos
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Cargar datos cuando se abre el panel o cambia de pestaña
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Cerrar al hacer clic fuera
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

  // Marcar una como leída
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id_notificacion === id ? { ...n, leida: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      showToast('No se pudo marcar la notificación', true);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      setUnreadCount(0);
      showToast('Todas las notificaciones marcadas como leídas');
    } catch {
      showToast('Error al marcar notificaciones', true);
    }
  };

  // Eliminar notificación
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = notifications.find((n) => n.id_notificacion === id);
      if (target && !target.leida) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id_notificacion !== id));
    } catch {
      showToast('Error al eliminar notificación', true);
    }
  };

  // Disparar planificador de recordatorios 24h
  const handleTriggerReminders = async () => {
    setTriggering(true);
    try {
      const res = await notificationService.triggerReminders({ force: true });
      if (res && res.success) {
        const enviados = res.data?.recordatorios_enviados || 0;
        showToast(`Recordatorios CU20 ejecutados: ${enviados} emitidos`);
        loadNotifications();
        loadUnreadCount();
      } else {
        showToast(res?.message || 'Error ejecutando recordatorios', true);
      }
    } catch (err) {
      showToast(err.message || 'Error al ejecutar recordatorios 24h', true);
    } finally {
      setTriggering(false);
    }
  };

  // Icono y estilos por tipo de notificación
  const getNotificationStyle = (tipo) => {
    switch (tipo) {
      case 'RECORDATORIO_24H':
        return {
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          badgeText: 'Recordatorio 24h',
        };
      case 'CONFIRMACION':
        return {
          icon: <Calendar className="w-4 h-4 text-[#00687a]" />,
          bg: 'bg-[#00687a]/10 text-[#00687a] border-[#00687a]/20',
          badgeText: 'Confirmación',
        };
      case 'REPROGRAMACION':
        return {
          icon: <CalendarClock className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          badgeText: 'Reprogramada',
        };
      case 'CANCELACION':
        return {
          icon: <CalendarX className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          badgeText: 'Cancelación',
        };
      case 'PAGO_EXITOSO':
        return {
          icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          badgeText: 'Pago Stripe',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          badgeText: 'Aviso',
        };
    }
  };

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
        title="Notificaciones y Recordatorios de Citas (CU20)"
        aria-label="Abrir panel de notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Badge numérico de no leídas */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {/* Panel Flotante de Notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-modal-panel">
          {/* Cabecera Principal */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif-clinical font-semibold text-slate-900 text-sm">
                Notificaciones y Recordatorios
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-[#00687a] rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toast Efímero Informativo */}
          {toastMessage && (
            <div
              className={`px-3 py-1.5 text-xs text-center border-b transition-all ${
                toastMessage.isError
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {toastMessage.text}
            </div>
          )}

          {/* Selector de Pestañas */}
          <div className="px-3 pt-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'todas'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('no_leidas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'no_leidas'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>No leídas</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recordatorios')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'recordatorios'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Recordatorios 24h
            </button>
          </div>

          {/* Listado con Scroll Independiente */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00687a]" />
                <span className="text-xs">Sincronizando notificaciones...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#00687a]/10 text-[#00687a] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h4 className="font-serif-clinical font-semibold text-slate-900 text-sm">
                  {activeTab === 'no_leidas'
                    ? '¡Al día! Sin avisos pendientes'
                    : 'Sin notificaciones en esta sección'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                  Aquí verás avisos de confirmación, cancelaciones, reprogramaciones y recordatorios preventivos de 24 horas.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const style = getNotificationStyle(item.tipo);
                return (
                  <div
                    key={item.id_notificacion}
                    onClick={() => !item.leida && handleMarkAsRead(item.id_notificacion)}
                    className={`p-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer group relative ${
                      !item.leida ? 'bg-cyan-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono temático */}
                      <div className={`p-2 rounded-xl border shrink-0 ${style.bg}`}>
                        {style.icon}
                      </div>

                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono shrink-0 bg-white border-slate-200 text-slate-600">
                            {style.badgeText}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {item.tiempo_relativo || 'Reciente'}
                          </span>
                        </div>

                        <h5
                          className={`text-xs font-semibold leading-snug line-clamp-1 ${
                            !item.leida ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {item.titulo}
                        </h5>

                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {item.mensaje}
                        </p>

                        {/* Pie de la tarjeta con acciones */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate">
                            Canal: <strong className="text-slate-600">{item.canal || 'IN_APP'}</strong>
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!item.leida && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(item.id_notificacion, e)}
                                className="px-1.5 py-0.5 rounded hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition"
                                title="Marcar como leída"
                              >
                                Leída
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDelete(item.id_notificacion, e)}
                              className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                              title="Eliminar notificación"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dot azul para no leídas */}
                      {!item.leida && (
                        <span className="w-2 h-2 rounded-full bg-[#00687a] shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Informativo y Disparador de Prueba */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CU20 Cron 08:00</span>
            </span>

            {/* Disparador Manual de Recordatorios (Prueba del Examen) */}
            {canTriggerReminders && (
              <button
                type="button"
                onClick={handleTriggerReminders}
                disabled={triggering}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00687a] text-white hover:bg-[#005260] transition text-[11px] font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                title="Ejecutar el planificador de recordatorios 24h inmediatamente para demostrar el CU20"
              >
                {triggering ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3" />
                )}
                <span>{triggering ? 'Enviando...' : 'Probar 24h Ahora'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

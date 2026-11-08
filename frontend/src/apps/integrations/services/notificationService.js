import { apiFetch } from '../../../services/api';

/**
 * Servicio de Notificaciones y Recordatorios de Citas (CU20)
 * Paquete 5: Integraciones Externas y Pagos
 * Metodología PUDS / RUP — Clínica Vida Salud / Centro Médico La Cruz
 */
export const notificationService = {
  /**
   * Obtiene la bandeja de notificaciones con métricas y paginación
   * @param {object} params - { no_leidas, tipo, limit, page, alcance }
   */
  async fetchNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.no_leidas !== undefined) query.append('no_leidas', params.no_leidas);
    if (params.tipo) query.append('tipo', params.tipo);
    if (params.limit) query.append('limit', params.limit);
    if (params.page) query.append('page', params.page);
    if (params.alcance) query.append('alcance', params.alcance);

    const queryString = query.toString();
    return await apiFetch(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtiene el conteo rápido de notificaciones sin leer para el badge
   */
  async fetchUnreadCount() {
    return await apiFetch('/notifications/unread-count');
  },

  /**
   * Marca una notificación individual como leída
   * @param {number|string} idNotificacion
   */
  async markAsRead(idNotificacion) {
    return await apiFetch(`/notifications/${idNotificacion}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Marca todas las notificaciones pendientes del usuario como leídas
   */
  async markAllAsRead() {
    return await apiFetch('/notifications/read-all', {
      method: 'POST',
    });
  },

  /**
   * Elimina una notificación de la bandeja
   * @param {number|string} idNotificacion
   */
  async deleteNotification(idNotificacion) {
    return await apiFetch(`/notifications/${idNotificacion}`, {
      method: 'DELETE',
    });
  },

  /**
   * Disparador manual para emitir recordatorios 24h (para demostración de examen)
   * @param {object} options - { force: boolean, id_cita?: number }
   */
  async triggerReminders(options = {}) {
    return await apiFetch('/notifications/trigger-reminders', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },
};

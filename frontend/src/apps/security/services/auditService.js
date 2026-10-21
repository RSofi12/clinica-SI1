import { apiFetch } from '../../../services/api';

/**
 * Servicio API para Gestión de Bitácora de Auditoría (CU03)
 * Paquete: P1 - Seguridad y Auditoría
 */
export const auditService = {
  /**
   * Obtiene eventos de bitácora con filtros y paginación
   */
  async fetchLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.modulo) query.append('modulo', params.modulo);
    if (params.accion) query.append('accion', params.accion);
    if (params.id_usuario) query.append('id_usuario', params.id_usuario);
    if (params.fecha_inicio) query.append('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) query.append('fecha_fin', params.fecha_fin);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    const endpoint = queryString ? `/audit?${queryString}` : '/audit';
    return await apiFetch(endpoint);
  },

  /**
   * Catálogo de opciones dinámicas para filtros
   */
  async fetchFiltersData() {
    return await apiFetch('/audit/filters-data');
  },

  /**
   * Métricas y KPIs resumidos del día
   */
  async fetchStats() {
    return await apiFetch('/audit/stats');
  },
};

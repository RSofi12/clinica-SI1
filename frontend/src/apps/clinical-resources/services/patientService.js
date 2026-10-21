import { apiFetch } from '../../../services/api';

/**
 * Servicio de Gestión de Pacientes — CU04 (RF02)
 * Paquete 2: Gestión de Recursos Clínicos y Pacientes
 */
export const patientService = {
  /**
   * Listar pacientes con paginación y filtros de búsqueda
   */
  async fetchPatients(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.estado) query.append('estado', params.estado);
    if (params.sexo) query.append('sexo', params.sexo);
    if (params.grupo_etario) query.append('grupo_etario', params.grupo_etario);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    const endpoint = queryString ? `/patients?${queryString}` : '/patients';
    return await apiFetch(endpoint, { method: 'GET' });
  },

  /**
   * Obtener KPIs y estadísticas de pacientes
   */
  async fetchStats() {
    return await apiFetch('/patients/stats', { method: 'GET' });
  },

  /**
   * Consultar detalle completo de un paciente por ID
   */
  async fetchPatientById(id) {
    return await apiFetch(`/patients/${id}`, { method: 'GET' });
  },

  /**
   * Búsqueda rápida por número de documento / CI
   */
  async searchByCi(ci) {
    return await apiFetch(`/patients/search-ci/${encodeURIComponent(ci)}`, { method: 'GET' });
  },

  /**
   * Registrar nuevo paciente con contacto de emergencia
   */
  async createPatient(payload) {
    return await apiFetch('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Actualizar datos demográficos y de contacto del paciente
   */
  async updatePatient(id, payload) {
    return await apiFetch(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Conmutar estado ACTIVO/INACTIVO (Baja Lógica RN11)
   */
  async toggleStatus(id) {
    return await apiFetch(`/patients/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },
};

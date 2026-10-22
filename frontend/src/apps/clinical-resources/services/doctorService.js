import { apiFetch } from '../../../services/api';

/**
 * Servicio de Médicos y Especialistas (CU06 / RF03 - Actor Médico Unificado)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
export const doctorService = {
  /**
   * Obtener listado paginado con filtros
   */
  async fetchDoctors(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.q) query.append('q', params.q);
    if (params.especialidad_id) query.append('especialidad_id', params.especialidad_id);
    if (params.estado) query.append('estado', params.estado);

    const queryString = query.toString();
    return await apiFetch(`/doctors${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtener detalle de un médico por su ID
   */
  async fetchDoctorById(id) {
    return await apiFetch(`/doctors/${id}`);
  },

  /**
   * Registrar nuevo médico con especialidades asignadas
   */
  async createDoctor(doctorData) {
    return await apiFetch('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  },

  /**
   * Actualizar datos y especialidades del médico
   */
  async updateDoctor(id, doctorData) {
    return await apiFetch(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    });
  },

  /**
   * Alternar estado de baja lógica (RN04 y RN11)
   */
  async toggleDoctorStatus(id) {
    return await apiFetch(`/doctors/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  /**
   * Obtener KPIs y estadísticas del plantel médico
   */
  async fetchDoctorStats() {
    return await apiFetch('/doctors/stats');
  },
};

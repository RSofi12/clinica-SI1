import { apiFetch } from '../../../services/api';

/**
 * Servicio de Especialidades Médicas (CU07 / RF04)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
export const specialtyService = {
  /**
   * Obtener catálogo de especialidades
   */
  async fetchSpecialties(params = {}) {
    const query = new URLSearchParams();
    if (params.estado) query.append('estado', params.estado);
    if (params.q) query.append('q', params.q);
    if (params.edad !== undefined && params.edad !== null) query.append('edad', params.edad);
    if (params.incluir_inactivas) query.append('incluir_inactivas', 'true');

    const queryString = query.toString();
    return await apiFetch(`/specialties${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Crear nueva especialidad médica
   */
  async createSpecialty(data) {
    return await apiFetch('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

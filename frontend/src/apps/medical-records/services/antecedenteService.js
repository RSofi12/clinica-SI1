import { apiFetch } from '../../../services/api';

/**
 * Servicio de Gestión de Antecedentes Médicos (CU17 / §3.4)
 * Paquete 4: Historial Clínico y Consultas
 */
export const antecedenteService = {
  /**
   * Consulta los antecedentes de un paciente (con filtros de tipo y estado)
   */
  async fetchPatientAntecedentes(patientId, params = {}) {
    const query = new URLSearchParams();
    if (params.tipo) query.append('tipo', params.tipo);
    if (params.incluir_inactivos) query.append('incluir_inactivos', params.incluir_inactivos);

    const queryString = query.toString();
    return await apiFetch(`/medical-records/patients/${patientId}/antecedentes${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Registra un nuevo antecedente clínico para el paciente (CU17)
   */
  async createAntecedente(patientId, data) {
    return await apiFetch(`/medical-records/patients/${patientId}/antecedentes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualiza la descripción o tipo de un antecedente existente
   */
  async updateAntecedente(id, data) {
    return await apiFetch(`/medical-records/antecedentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Alterna la baja lógica (ACTIVO / INACTIVO) de un antecedente (RN11)
   */
  async toggleAntecedenteStatus(id) {
    return await apiFetch(`/medical-records/antecedentes/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },
};

import { apiFetch } from '../../../services/api';

/**
 * Servicio de API para el módulo de Consultas Médicas (CU16)
 * Paquete 4: Historial Clínico
 */
export const consultaService = {
  /**
   * Lista consultas médicas con filtros opcionales.
   * @param {object} params - { buscar, search, fecha, page, per_page }
   */
  getConsultas(params = {}) {
    const formattedParams = {
      ...params,
      buscar: params.buscar || params.search || '',
    };
    return apiFetch('/medical-records/consultas', { params: formattedParams });
  },

  /**
   * Obtiene el detalle de una consulta médica.
   * @param {number|string} id
   */
  getConsulta(id) {
    return apiFetch(`/medical-records/consultas/${id}`);
  },

  /**
   * Carga los datos contextuales previos a la consulta (antecedentes, últimas consultas).
   * @param {number|string} idCita
   */
  prepararConsulta(idCita) {
    return apiFetch(`/medical-records/citas/${idCita}/preparar`);
  },

  /**
   * Crea una nueva consulta médica (triaje + anamnesis + diagnósticos + plan).
   * @param {object} payload
   */
  createConsulta(payload) {
    return apiFetch('/medical-records/consultas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

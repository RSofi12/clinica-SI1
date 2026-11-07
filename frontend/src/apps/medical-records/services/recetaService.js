import { apiFetch } from '../../../services/api';

/**
 * Servicio de Prescripciones Médicas y Recetas Digitales (CU18)
 * Paquete 4: Historial Clínico y Consultas
 */
export const recetaService = {
  /**
   * Lista recetas médicas con paginación, filtros y métricas
   * @param {object} params - { buscar, estado, fecha, id_consulta, id_paciente, page, per_page }
   */
  async fetchRecetas(params = {}) {
    const query = new URLSearchParams();
    if (params.buscar) query.append('buscar', params.buscar);
    if (params.estado) query.append('estado', params.estado);
    if (params.fecha) query.append('fecha', params.fecha);
    if (params.id_consulta) query.append('id_consulta', params.id_consulta);
    if (params.id_paciente) query.append('id_paciente', params.id_paciente);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    return await apiFetch(`/medical-records/recetas${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtiene el detalle completo de una receta médica con sus fármacos
   * @param {number|string} id
   */
  async fetchRecetaById(id) {
    return await apiFetch(`/medical-records/recetas/${id}`);
  },

  /**
   * Consulta las recetas emitidas en una consulta médica específica
   * @param {number|string} idConsulta
   */
  async fetchRecetasByConsulta(idConsulta) {
    return await apiFetch(`/medical-records/consultas/${idConsulta}/recetas`);
  },

  /**
   * Emite una nueva receta médica estructurada (RF08)
   * @param {object} payload - { id_consulta, indicaciones_generales, detalles: [{ medicamento, dosis, frecuencia, duracion, indicaciones }] }
   */
  async emitirReceta(payload) {
    return await apiFetch('/medical-records/recetas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Anula lógicamente una receta médica justificando el motivo (RN11)
   * @param {number|string} id
   * @param {string} motivo
   */
  async anularReceta(id, motivo) {
    return await apiFetch(`/medical-records/recetas/${id}/anular`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo_anulacion: motivo }),
    });
  },
};

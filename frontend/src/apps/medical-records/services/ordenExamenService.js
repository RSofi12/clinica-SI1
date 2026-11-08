import { apiFetch } from '../../../services/api';

/**
 * Servicio de Órdenes de Exámenes Auxiliares (CU25)
 * Paquete 4: Historial Clínico y Consultas
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
export const ordenExamenService = {
  /**
   * Lista órdenes de exámenes auxiliares con paginación, filtros y métricas
   * @param {object} params - { buscar, estado, tipo_estudio, id_historia_clinica, id_consulta, fecha_desde, fecha_hasta, page, per_page }
   */
  async fetchOrdenes(params = {}) {
    const query = new URLSearchParams();
    if (params.buscar) query.append('buscar', params.buscar);
    if (params.estado) query.append('estado', params.estado);
    if (params.tipo_estudio) query.append('tipo_estudio', params.tipo_estudio);
    if (params.id_historia_clinica) query.append('id_historia_clinica', params.id_historia_clinica);
    if (params.id_consulta) query.append('id_consulta', params.id_consulta);
    if (params.fecha_desde) query.append('fecha_desde', params.fecha_desde);
    if (params.fecha_hasta) query.append('fecha_hasta', params.fecha_hasta);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    return await apiFetch(`/medical-records/ordenes-examenes${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtiene el detalle completo de una orden de examen auxiliar
   * @param {number|string} id
   */
  async fetchOrdenById(id) {
    return await apiFetch(`/medical-records/ordenes-examenes/${id}`);
  },

  /**
   * Consulta las órdenes emitidas para una consulta médica específica
   * @param {number|string} idConsulta
   */
  async fetchOrdenesByConsulta(idConsulta) {
    return await apiFetch(`/medical-records/consultas/${idConsulta}/ordenes-examenes`);
  },

  /**
   * Consulta las órdenes de una historia clínica
   * @param {number|string} idHistoria
   * @param {object} params
   */
  async fetchOrdenesByHistoria(idHistoria, params = {}) {
    const query = new URLSearchParams();
    if (params.estado) query.append('estado', params.estado);
    if (params.page) query.append('page', params.page);
    const queryString = query.toString();
    return await apiFetch(`/medical-records/historias/${idHistoria}/ordenes-examenes${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Emite una nueva orden de examen auxiliar (CU25)
   * @param {object} payload - { id_consulta, tipo_estudio, nombre_estudio, indicaciones_preparacion, diagnostico_presuntivo }
   */
  async emitirOrden(payload) {
    return await apiFetch('/medical-records/ordenes-examenes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Anula lógicamente una orden médica justificando el motivo (RN11)
   * @param {number|string} id
   * @param {string} motivoCancelacion
   */
  async anularOrden(id, motivoCancelacion) {
    return await apiFetch(`/medical-records/ordenes-examenes/${id}/anular`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo_cancelacion: motivoCancelacion }),
    });
  },
};


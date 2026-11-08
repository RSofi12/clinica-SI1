import { apiFetch } from '../../../services/api';

/**
 * Servicio API para Consulta y Línea de Tiempo del Expediente Clínico Digital (CU19)
 * Paquete 4: Historial Clínico y Consultas
 */
export const expedienteService = {
  /**
   * Consulta el expediente propio del paciente autenticado (Autoservicio)
   */
  async fetchMiExpediente() {
    return await apiFetch('/medical-records/expediente/mi-expediente');
  },

  /**
   * Consulta el expediente completo de un paciente por su ID (Médicos / Administradores)
   * @param {number|string} idPaciente
   */
  async fetchExpedienteByPaciente(idPaciente) {
    return await apiFetch(`/medical-records/expediente/paciente/${idPaciente}`);
  },

  /**
   * Obtiene la cronología completa de atenciones, recetas y antecedentes
   * @param {number|string} idPaciente
   */
  async fetchTimeline(idPaciente) {
    return await apiFetch(`/medical-records/expediente/paciente/${idPaciente}/timeline`);
  },
};

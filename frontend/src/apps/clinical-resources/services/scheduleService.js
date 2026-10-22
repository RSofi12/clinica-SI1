import { apiFetch } from '../../../services/api';

/**
 * Servicio de Gestión de Horarios de Atención y Bloqueos (CU08 / RF05)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
export const scheduleService = {
  /**
   * Obtener horarios semanales y bloqueos de un médico
   */
  async fetchDoctorSchedule(doctorId) {
    return await apiFetch(`/schedules/doctors/${doctorId}`);
  },

  /**
   * Guardar / actualizar en lote los horarios semanales del médico
   */
  async saveDoctorSchedule(doctorId, horarios) {
    return await apiFetch(`/schedules/doctors/${doctorId}`, {
      method: 'POST',
      body: JSON.stringify({ horarios }),
    });
  },

  /**
   * Obtener listado de feriados institucionales y licencias
   */
  async fetchBlocks(params = {}) {
    const query = new URLSearchParams();
    if (params.desde) query.append('desde', params.desde);
    if (params.id_medico) query.append('id_medico', params.id_medico);
    if (params.solo_generales) query.append('solo_generales', '1');

    const queryString = query.toString();
    return await apiFetch(`/schedules/blocks${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Registrar un nuevo feriado institucional o licencia médica
   */
  async createBlock(blockData) {
    return await apiFetch('/schedules/blocks', {
      method: 'POST',
      body: JSON.stringify(blockData),
    });
  },

  /**
   * Eliminar un bloqueo o feriado
   */
  async deleteBlock(blockId) {
    return await apiFetch(`/schedules/blocks/${blockId}`, {
      method: 'DELETE',
    });
  },
};

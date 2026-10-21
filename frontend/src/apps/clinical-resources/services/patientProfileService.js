import { apiFetch } from '../../../services/api';

/**
 * Servicio de Autoservicio y Perfil del Paciente — CU05 (§3.4)
 * Paquete 2: Gestión de Recursos Clínicos y Pacientes
 */
export const patientProfileService = {
  /**
   * Verificar si la CI existe en el padrón y está disponible para activación
   */
  async checkCi(numero_documento) {
    return await apiFetch('/patient/check-ci', {
      method: 'POST',
      body: JSON.stringify({ numero_documento }),
    });
  },

  /**
   * Activar cuenta web de autoservicio para el paciente
   */
  async activateAccount(payload) {
    return await apiFetch('/patient/activate-account', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Obtener ficha y perfil completo del paciente en sesión (Rol PACIENTE)
   */
  async fetchMyProfile() {
    return await apiFetch('/patient-profile/me', {
      method: 'GET',
    });
  },

  /**
   * Actualizar canales de contacto, contacto de emergencia y preferencias
   */
  async updateMyProfile(payload) {
    return await apiFetch('/patient-profile/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cambiar contraseña desde el perfil de autoservicio
   */
  async changeMyPassword(payload) {
    return await apiFetch('/patient-profile/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Habilitar cuenta web a un paciente desde ventanilla (Recepcionista / Admin)
   */
  async enableWebAccount(patientId, payload) {
    return await apiFetch(`/patients/${patientId}/enable-web-account`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

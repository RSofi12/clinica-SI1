import { apiFetch } from '../../../services/api';

/**
 * Servicio de Autenticación - CU01 (Frontend)
 * Paquete 1: Seguridad y Auditoría
 */
export const authService = {
  /**
   * Iniciar sesión con login y contraseña
   */
  async login(login, password) {
    return await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
  },

  /**
   * Solicitar código de recuperación de contraseña
   */
  async forgotPassword(email) {
    return await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Restablecer contraseña con código de verificación
   */
  async resetPassword(email, token, password) {
    return await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password }),
    });
  },

  /**
   * Obtener usuario en sesión actual
   */
  async fetchCurrentUser() {
    return await apiFetch('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    return await apiFetch('/auth/logout', {
      method: 'POST',
    });
  },
};

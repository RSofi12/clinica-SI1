import { apiFetch } from '../../../services/api';

/**
 * Servicio API para Gestión de Usuarios y Roles (CU02 - RF01)
 * Paquete: P1 - Seguridad y Auditoría
 */
export const usersService = {
  /**
   * Obtiene la lista de usuarios con filtros y paginación
   */
  async fetchUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.tipo_usuario) query.append('tipo_usuario', params.tipo_usuario);
    if (params.estado) query.append('estado', params.estado);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return await apiFetch(endpoint);
  },

  /**
   * Obtiene el detalle de un usuario por ID
   */
  async getUser(id) {
    return await apiFetch(`/users/${id}`);
  },

  /**
   * Registra un nuevo operador
   */
  async createUser(userData) {
    return await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Actualiza los datos de un operador existente
   */
  async updateUser(id, userData) {
    return await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Conmuta el estado del usuario (ACTIVO <-> INACTIVO) - Baja Lógica RN11
   */
  async toggleUserStatus(id) {
    return await apiFetch(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  /**
   * Desbloquea una cuenta bloqueada por intentos fallidos
   */
  async unlockUser(id) {
    return await apiFetch(`/users/${id}/unlock`, {
      method: 'POST',
    });
  },

  /**
   * Catálogo de roles disponibles
   */
  async fetchRoles() {
    return await apiFetch('/roles');
  },
};

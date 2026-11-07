import { apiClient, apiFetch } from '../../../services/api';

/**
 * Servicio API para Gestión de Documentos Clínicos Adjuntos (CU26)
 * Integrado con Cloudinary y soporte dual (autónomo y conectado a CU25)
 * Paquete 4: Historial Clínico y Consultas
 */
export const documentoClinicoService = {
  /**
   * Obtiene todos los documentos clínicos adjuntos a una Historia Clínica
   * @param {number|string} idHistoria
   */
  async fetchDocumentos(idHistoria) {
    return await apiFetch(`/medical-records/historias/${idHistoria}/documentos`);
  },

  /**
   * Obtiene la lista de órdenes de exámenes auxiliares en estado PENDIENTE (CU25)
   * para permitir la vinculación opcional en el formulario de carga
   * @param {number|string} idHistoria
   */
  async fetchOrdenesPendientes(idHistoria) {
    return await apiFetch(`/medical-records/historias/${idHistoria}/ordenes-pendientes`);
  },

  /**
   * Carga un nuevo documento clínico con seguimiento de progreso multipart/form-data
   * @param {number|string} idHistoria
   * @param {FormData} formData
   * @param {Function} [onUploadProgress]
   */
  async uploadDocumento(idHistoria, formData, onUploadProgress) {
    const response = await apiClient.post(
      `/medical-records/historias/${idHistoria}/documentos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    );
    return response.data;
  },

  /**
   * Elimina lógicamente un documento clínico (y su archivo remoto en Cloudinary)
   * @param {number|string} idDocumento
   */
  async deleteDocumento(idDocumento) {
    return await apiFetch(`/medical-records/documentos/${idDocumento}`, {
      method: 'DELETE',
    });
  },
};

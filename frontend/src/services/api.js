import axios from 'axios';

/**
 * Cliente HTTP Axios centralizado (Sección 7.1 de la Especificación Oficial)
 * Maneja interceptores para el envío automático de cabeceras de autorización
 * (Authorization: Bearer <token>), cookies con withCredentials, y manejo centralizado de errores.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Para cookies de sesión en Laravel
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de Solicitud: Inyecta Bearer Token si existe en storage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Manejo unificado de errores y respuestas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.warn('Sesión no autorizada o expirada (HTTP 401)');
    }
    return Promise.reject(error);
  }
);

/**
 * Función helper apiFetch basada en Axios para compatibilidad total con los servicios existentes
 */
export async function apiFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = endpoint;
  
  try {
    let bodyData = options.body;
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch {
        // Mantener como string si no es JSON válido
      }
    }

    const response = await apiClient.request({
      url,
      method,
      data: bodyData,
      params: options.params,
      headers: options.headers,
    });

    return response.data;
  } catch (error) {
    const err = new Error(error.response?.data?.message || error.message || 'Error en la solicitud al servidor');
    err.status = error.response?.status || 500;
    err.data = error.response?.data || null;
    throw err;
  }
}

export default apiClient;

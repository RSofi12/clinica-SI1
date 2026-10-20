/**
 * Cliente HTTP centralizado para conexión con la API de Laravel
 * Soporta credenciales de sesión / cookies y URLs relativas o absolutas
 */
const BASE_URL = '/api';

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Para cookies de sesión en Laravel
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Error en la solicitud al servidor');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

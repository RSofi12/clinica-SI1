import { apiFetch } from '../../../services/api';

/**
 * Servicio API para Generación y Exportación de Reportes con Filtros Dinámicos (CU22 - RF13)
 * Paquete 6: Reportes y Analítica
 * Metodología PUDS / RUP — Centro Médico La Cruz
 */
export const dynamicReportService = {
  /**
   * Catálogos para poblar selectores de filtros (médicos, especialidades, estados, grupos etarios)
   */
  async fetchReportCatalogs() {
    return await apiFetch('/analytics/reports/catalogs');
  },

  /**
   * Generar reporte dinámico en tiempo real según tipo y filtros
   */
  async fetchDynamicReport(tipo = 'citas-fecha', filtros = {}) {
    const params = new URLSearchParams();
    params.append('tipo', tipo);

    Object.entries(filtros).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'TODOS') {
        params.append(key, val);
      }
    });

    return await apiFetch(`/analytics/reports/dynamic?${params.toString()}`);
  },

  /**
   * Exportar reporte a CSV nativo del backend
   */
  async downloadReportCsv(tipo = 'citas-fecha', filtros = {}) {
    const params = new URLSearchParams();
    params.append('tipo', tipo);

    Object.entries(filtros).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'TODOS') {
        params.append(key, val);
      }
    });

    const url = `/api/analytics/reports/export-csv?${params.toString()}`;
    const token = localStorage.getItem('token');

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Error al descargar el archivo CSV del servidor.');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `reporte_${tipo}_${fecha}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Disparar vista de impresión estructurada con membrete oficial del Centro Médico La Cruz
   */
  printReport() {
    window.print();
  },
};

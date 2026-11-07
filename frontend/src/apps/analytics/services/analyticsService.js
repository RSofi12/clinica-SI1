import { apiFetch } from '../../../services/api';

/**
 * Servicio de Analítica y Reportes por Voz con IA (CU23 / CU22)
 * Paquete 6: Reportes y Analítica
 */
export const analyticsService = {
  /**
   * Enviar comando de voz transcrito para procesamiento semántico y generación de reporte
   */
  async processVoiceCommand(comandoTexto, contexto = {}) {
    return await apiFetch('/analytics/voice-report', {
      method: 'POST',
      body: JSON.stringify({
        comando_texto: comandoTexto,
        contexto: contexto,
      }),
    });
  },

  /**
   * Consultar historial de reportes por voz del usuario actual
   */
  async fetchVoiceHistory() {
    return await apiFetch('/analytics/voice-history');
  },

  /**
   * Consultar métricas y estadísticas del asistente de voz
   */
  async fetchVoiceStats() {
    return await apiFetch('/analytics/voice-stats');
  },

  /**
   * Exportar registros analíticos generados a formato CSV estándar
   */
  exportToCsv(registros = [], tituloReporte = 'reporte_clinica') {
    if (!registros || registros.length === 0) {
      alert('No hay registros disponibles para exportar.');
      return;
    }

    const headers = ['Código Cita', 'Fecha', 'Hora', 'Estado', 'Especialidad', 'Médico', 'Paciente', 'Documento'];
    const rows = registros.map((r) => [
      r.codigo_cita || 'N/A',
      r.fecha_formateada || 'N/A',
      r.hora_formateada || 'N/A',
      r.estado || 'N/A',
      `"${r.especialidad?.nombre || 'N/A'}"`,
      `"${r.medico?.nombre_completo || 'N/A'}"`,
      `"${r.paciente?.nombre_completo || 'N/A'}"`,
      r.paciente?.numero_documento || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${tituloReporte.toLowerCase().replace(/\s+/g, '_')}_${fechaActual}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

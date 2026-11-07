import { apiFetch } from '../../../services/api';

/**
 * Servicio de Analítica y Reportes por Voz con IA (CU23 / CU22 / CU24)
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
   * Consultar KPIs y métricas operativas del Dashboard Clínico (CU24)
   */
  async fetchDashboardKpis(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/analytics/dashboard-kpis?${query}` : '/analytics/dashboard-kpis';
    return await apiFetch(endpoint);
  },

  /**
   * Exportar registros analíticos generados a formato CSV estándar con BOM UTF-8
   */
  exportToCsv(registros = [], tituloReporte = 'reporte_clinica') {
    if (!registros || registros.length === 0) {
      alert('No hay registros disponibles para exportar.');
      return;
    }

    const headers = ['Código Cita', 'Fecha', 'Hora', 'Estado', 'Especialidad', 'Médico', 'Paciente', 'Documento CI', 'Motivo / Detalle'];
    const rows = registros.map((r) => [
      `"${r.codigo_cita || 'N/A'}"`,
      `"${r.fecha_formateada || r.fecha_registro || 'N/A'}"`,
      `"${r.hora_formateada || 'N/A'}"`,
      `"${r.estado || r.estado_paciente || 'N/A'}"`,
      `"${(r.especialidad?.nombre || 'General').replace(/"/g, '""')}"`,
      `"${(r.medico?.nombre_completo || 'N/A').replace(/"/g, '""')}"`,
      `"${(r.paciente?.nombre_completo || r.nombre_completo || 'N/A').replace(/"/g, '""')}"`,
      `"${r.paciente?.numero_documento || r.numero_documento || 'S/D'}"`,
      `"${(r.motivo_consulta || r.motivo_cancelacion || '').replace(/"/g, '""')}"`,
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

  /**
   * Exportar reporte completo a Microsoft Excel (.xls) compatible con hojas de cálculo
   */
  exportToExcel(reportData, tituloReporte = 'reporte_clinica') {
    const registros = reportData?.registros || [];
    if (registros.length === 0) {
      alert('No hay registros disponibles para exportar a Excel.');
      return;
    }

    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const metricas = reportData.metricas || {};
    const filtros = reportData.filtros_detectados || {};

    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1E293B; }
          .title { font-size: 16pt; font-weight: bold; color: #00687A; text-align: left; }
          .subtitle { font-size: 11pt; color: #64748B; margin-bottom: 12px; }
          .section-header { font-size: 12pt; font-weight: bold; background-color: #E2E8F0; padding: 6px; }
          .kpi-table { margin-bottom: 20px; border-collapse: collapse; }
          .kpi-table td { padding: 8px 12px; border: 1px solid #CBD5E1; }
          .kpi-label { font-size: 9pt; color: #64748B; font-weight: bold; text-transform: uppercase; }
          .kpi-value { font-size: 14pt; font-weight: bold; }
          .data-table { border-collapse: collapse; width: 100%; margin-top: 15px; }
          .data-table th { background-color: #00687A; color: #FFFFFF; font-weight: bold; border: 1px solid #004D5A; padding: 8px; text-align: left; }
          .data-table td { border: 1px solid #E2E8F0; padding: 6px 8px; vertical-align: middle; }
          .zebra { background-color: #F8FAFC; }
          .badge-atendida { background-color: #D1FAE5; color: #065F46; font-weight: bold; }
          .badge-cancelada { background-color: #FFE4E6; color: #9F1239; font-weight: bold; }
          .badge-programada { background-color: #E0F2FE; color: #0369A1; font-weight: bold; }
          .footer { font-size: 9pt; color: #94A3B8; margin-top: 25px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="title">Centro Médico La Cruz — Clínica Vida Salud</div>
        <div class="subtitle">Reporte Asistencial Generado por Inteligencia Artificial (CU23 / CU22)</div>
        <p><strong>Comando dictado:</strong> "${reportData.comando_texto || 'Consulta analítica'}"</p>
        <p><strong>Interpretación Semántica:</strong> ${reportData.interpretacion_legible || 'N/A'}</p>
        <p><strong>Fecha y hora de emisión:</strong> ${fechaActual}</p>

        <table class="kpi-table">
          <tr>
            <td>
              <div class="kpi-label">Total Coincidentes</div>
              <div class="kpi-value">${metricas.total_citas ?? metricas.total_pacientes ?? registros.length}</div>
            </td>
            <td>
              <div class="kpi-label">Atendidas / Asistidas</div>
              <div class="kpi-value" style="color: #059669;">${metricas.atendidas ?? metricas.activos ?? 0}</div>
            </td>
            <td>
              <div class="kpi-label">Canceladas</div>
              <div class="kpi-value" style="color: #E11D48;">${metricas.canceladas ?? metricas.inactivos ?? 0}</div>
            </td>
            <td>
              <div class="kpi-label">Tasa de Asistencia</div>
              <div class="kpi-value" style="color: #00687A;">${metricas.tasa_asistencia !== undefined ? metricas.tasa_asistencia + '%' : 'N/A'}</div>
            </td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Especialidad</th>
              <th>Médico Asignado</th>
              <th>Paciente</th>
              <th>Documento CI</th>
              <th>Motivo / Diagnóstico / Detalle</th>
            </tr>
          </thead>
          <tbody>
    `;

    registros.forEach((item, index) => {
      const isZebra = index % 2 === 1 ? ' class="zebra"' : '';
      excelHtml += `
        <tr${isZebra}>
          <td style="font-family: Consolas, monospace; font-weight: bold; color: #00687A;">${item.codigo_cita || 'REG-' + (item.id_paciente || index + 1)}</td>
          <td>${item.fecha_formateada || item.fecha_registro || 'N/A'}</td>
          <td>${item.hora_formateada || '—'}</td>
          <td>${item.estado || item.estado_paciente || 'N/A'}</td>
          <td>${item.especialidad?.nombre || 'General'}</td>
          <td>${item.medico?.nombre_completo || 'N/A'}</td>
          <td>${item.paciente?.nombre_completo || item.nombre_completo || 'N/A'}</td>
          <td>${item.paciente?.numero_documento || item.numero_documento || 'S/D'}</td>
          <td>${item.motivo_consulta || item.motivo_cancelacion || 'Consulta de rutina'}</td>
        </tr>
      `;
    });

    excelHtml += `
          </tbody>
        </table>
        <div class="footer">Sistema de Información Clínica Vida Salud — Centro Médico La Cruz. Documento analítico oficial.</div>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const isoDate = new Date().toISOString().split('T')[0];
    link.download = `${tituloReporte.toLowerCase().replace(/\s+/g, '_')}_${isoDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Exportar reporte formal a PDF con membrete institucional listo para imprimir / guardar
   */
  exportToPdf(reportData) {
    const registros = reportData?.registros || [];
    if (registros.length === 0) {
      alert('No hay registros disponibles para exportar a PDF.');
      return;
    }

    const fechaHora = new Date().toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const metricas = reportData.metricas || {};
    const filtros = reportData.filtros_detectados || {};

    const rowsHtml = registros
      .map(
        (item, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
          <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #00687A; border-bottom: 1px solid #E2E8F0;">
            ${item.codigo_cita || 'REG-' + (item.id_paciente || idx + 1)}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">
            ${item.fecha_formateada || item.fecha_registro || 'N/A'}
            ${item.hora_formateada ? `<br><small style="color: #64748B;">${item.hora_formateada}</small>` : ''}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">
            <span style="display: inline-block; padding: 2px 6px; font-size: 9px; font-weight: bold; border-radius: 4px; border: 1px solid #CBD5E1; text-transform: uppercase;">
              ${item.estado || item.estado_paciente || 'N/A'}
            </span>
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-weight: 500;">
            ${item.especialidad?.nombre || 'General'}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; color: #334155;">
            ${item.medico?.nombre_completo || 'N/A'}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">
            <strong>${item.paciente?.nombre_completo || item.nombre_completo || 'N/A'}</strong>
            <br><small style="color: #64748B;">CI: ${item.paciente?.numero_documento || item.numero_documento || 'S/D'}</small>
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 10px;">
            ${item.motivo_consulta || item.motivo_cancelacion || 'Consulta de rutina'}
          </td>
        </tr>
      `
      )
      .join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes en su navegador para imprimir o guardar como PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte Oficial — Clínica Vida Salud</title>
        <style>
          @page { size: A4 landscape; margin: 12mm 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #1E293B; line-height: 1.4; margin: 0; }
          .header { border-bottom: 2px solid #00687A; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .brand h1 { margin: 0; font-size: 18px; color: #004D5A; font-weight: 700; letter-spacing: -0.5px; }
          .brand p { margin: 2px 0 0; font-size: 11px; color: #64748B; }
          .badge { display: inline-block; background-color: #E6F4F6; color: #00687A; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
          .meta-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; margin-bottom: 15px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 10px; }
          .kpis { display: flex; gap: 12px; margin-bottom: 15px; }
          .kpi-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; background: #FFFFFF; }
          .kpi-card .lbl { font-size: 9px; color: #64748B; font-weight: bold; text-transform: uppercase; }
          .kpi-card .val { font-size: 16px; font-weight: bold; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background-color: #F1F5F9; color: #475569; font-weight: bold; text-align: left; padding: 8px; border-bottom: 2px solid #CBD5E1; text-transform: uppercase; font-size: 9px; }
          .footer { margin-top: 25px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 9px; color: #94A3B8; display: flex; justify-content: space-between; align-items: center; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div>
              <span class="badge">Centro Médico La Cruz — Clínica Vida Salud</span>
              <h1>Reporte Asistencial y Estadístico (CU23 / CU22)</h1>
              <p>Módulo de Inteligencia de Negocios y Procesamiento de Lenguaje Natural (NLP)</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748B;">
            <strong>Emisión:</strong> ${fechaHora}<br>
            <strong>Registros:</strong> ${registros.length} encontrados
          </div>
        </div>

        <div class="meta-box">
          <div>
            <strong>Comando Procesado:</strong> "${reportData.comando_texto || 'Consulta General'}"<br>
            <strong>Interpretación Semántica:</strong> ${reportData.interpretacion_legible || 'N/A'}
          </div>
          <div style="text-align: right;">
            <strong>Tipo de Reporte:</strong> ${reportData.tipo_reporte || 'CITAS'}<br>
            <strong>Motor:</strong> ${reportData.motor || 'DETERMINISTIC_NLP'} (${Math.round((reportData.confianza || 1) * 100)}% conf.)
          </div>
        </div>

        <div class="kpis">
          <div class="kpi-card">
            <div class="lbl">Total Evaluados</div>
            <div class="val" style="color: #1E293B;">${metricas.total_citas ?? metricas.total_pacientes ?? registros.length}</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">Atendidas / Asistidas</div>
            <div class="val" style="color: #059669;">${metricas.atendidas ?? metricas.activos ?? 0}</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">Canceladas</div>
            <div class="val" style="color: #E11D48;">${metricas.canceladas ?? metricas.inactivos ?? 0}</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">Tasa de Efectividad</div>
            <div class="val" style="color: #00687A;">${metricas.tasa_asistencia !== undefined ? metricas.tasa_asistencia + '%' : 'N/A'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 10%;">Código</th>
              <th style="width: 12%;">Fecha / Hora</th>
              <th style="width: 11%;">Estado</th>
              <th style="width: 14%;">Especialidad</th>
              <th style="width: 18%;">Médico</th>
              <th style="width: 18%;">Paciente</th>
              <th style="width: 17%;">Motivo / Detalle</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Clínica Vida Salud — Sistema de Información Médica Integral (PUDS / RUP)</span>
          <span>Página 1 de 1 — Documento confidencial para uso clínico institucional</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  },
};

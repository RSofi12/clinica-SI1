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
   * Exportar reporte formal a PDF con membrete institucional mediante descarga directa
   */
  exportToPdf(reportData) {
    const registros = reportData?.registros || [];
    if (registros.length === 0) {
      alert('No hay registros disponibles para exportar a PDF.');
      return;
    }

    const tipoReporte = reportData.tipo_reporte || 'CITAS';
    const isoDate = new Date().toISOString().split('T')[0];
    const fechaHora = new Date().toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const metricas = reportData.metricas || {};
    const kpis = [
      {
        label: 'TOTAL EVALUADOS',
        value: String(metricas.total_citas ?? metricas.total_pacientes ?? registros.length),
      },
      {
        label: 'ATENDIDAS / ACTIVOS',
        value: String(metricas.atendidas ?? metricas.activos ?? 0),
      },
      {
        label: 'CANCELADAS / INACTIVOS',
        value: String(metricas.canceladas ?? metricas.inactivos ?? 0),
      },
      {
        label: 'TASA DE EFECTIVIDAD',
        value: metricas.tasa_asistencia !== undefined ? `${metricas.tasa_asistencia}%` : 'N/A',
      },
    ];

    const headers = ['CODIGO', 'FECHA / HORA', 'ESTADO', 'ESPECIALIDAD', 'MEDICO', 'PACIENTE / CI', 'MOTIVO / DETALLE'];
    const rows = registros.map((item, idx) => {
      const codigo = item.codigo_cita || `REG-${item.id_paciente || idx + 1}`;
      const fecha = `${item.fecha_formateada || item.fecha_registro || 'N/A'}${item.hora_formateada ? ' ' + item.hora_formateada : ''}`;
      const estado = item.estado || item.estado_paciente || 'N/A';
      const esp = item.especialidad?.nombre || 'General';
      const med = item.medico?.nombre_completo || 'N/A';
      const pac = `${item.paciente?.nombre_completo || item.nombre_completo || 'N/A'}${item.paciente?.numero_documento || item.numero_documento ? ' (CI: ' + (item.paciente?.numero_documento || item.numero_documento) + ')' : ''}`;
      const mot = item.motivo_consulta || item.motivo_cancelacion || 'Consulta de rutina';
      return [codigo, fecha, estado, esp, med, pac, mot];
    });

    const pdfContent = buildPdfDocument({
      title: 'Centro Medico La Cruz — Clinica Vida Salud',
      subtitle: `Reporte Asistencial y Estadistico (CU23) · Tipo: ${tipoReporte}`,
      date: fechaHora,
      kpis,
      headers,
      rows,
    });

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_${tipoReporte.toLowerCase()}_${isoDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

/**
 * Generador nativo de documentos PDF estándar (sin dependencias externas pesadas)
 * Produce un archivo binario PDF válido que se descarga directamente sin panel de impresión.
 */
function buildPdfDocument({ title, subtitle, date, kpis, headers, rows }) {
  const pages = [];
  const pageWidth = 842; // A4 horizontal
  const pageHeight = 595;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 770 pt

  let stream = [];
  let y = pageHeight - margin;

  function sanitizePdfText(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, '?');
  }

  function startNewPage() {
    if (stream.length > 0) {
      pages.push(stream.join('\n'));
      stream = [];
    }
    y = pageHeight - margin;

    // Barra superior institucional en tono Teal (#00687A)
    stream.push('0.0 0.41 0.48 rg');
    stream.push(`${margin} ${pageHeight - 24} ${contentWidth} 4 re f`);

    // Título institucional
    stream.push('BT');
    stream.push('/F2 15 Tf');
    stream.push('0.0 0.22 0.27 rg'); // #003844
    stream.push(`${margin} ${pageHeight - 46} Td (${sanitizePdfText(title)}) Tj`);
    stream.push('ET');

    // Subtítulo y fecha de emisión
    stream.push('BT');
    stream.push('/F1 9 Tf');
    stream.push('0.35 0.42 0.48 rg');
    stream.push(`${margin} ${pageHeight - 60} Td (${sanitizePdfText(subtitle)}) Tj`);
    stream.push(`${pageWidth - margin - 170} ${pageHeight - 46} Td (Emision: ${sanitizePdfText(date)}) Tj`);
    stream.push('ET');

    y = pageHeight - 82;
  }

  startNewPage();

  // Tarjetas de Métricas y KPIs
  if (kpis && kpis.length > 0) {
    const kpiGap = 8;
    const kpiWidth = (contentWidth - (kpis.length - 1) * kpiGap) / kpis.length;
    kpis.forEach((kpi, idx) => {
      const kpiX = margin + idx * (kpiWidth + kpiGap);
      // Fondo de tarjeta y borde suave
      stream.push('0.97 0.98 0.99 rg');
      stream.push('0.85 0.90 0.92 RG');
      stream.push('0.75 w');
      stream.push(`${kpiX} ${y - 36} ${kpiWidth} 36 re b`);

      // Label del KPI
      stream.push('BT');
      stream.push('/F1 7.5 Tf');
      stream.push('0.4 0.48 0.55 rg');
      stream.push(`${kpiX + 8} ${y - 14} Td (${sanitizePdfText(kpi.label)}) Tj`);
      stream.push('ET');

      // Valor del KPI
      stream.push('BT');
      stream.push('/F2 13 Tf');
      stream.push('0.0 0.25 0.32 rg');
      stream.push(`${kpiX + 8} ${y - 30} Td (${sanitizePdfText(kpi.value)}) Tj`);
      stream.push('ET');
    });
    y -= 48;
  }

  // Columnas de la tabla (Suma = 770)
  const colWidths = [65, 85, 70, 95, 125, 150, 180];

  function drawTableHeader() {
    stream.push('0.0 0.22 0.27 rg'); // Cabecera oscura #003844
    stream.push(`${margin} ${y - 20} ${contentWidth} 20 re f`);

    let curX = margin;
    headers.forEach((h, i) => {
      stream.push('BT');
      stream.push('/F2 8 Tf');
      stream.push('1 1 1 rg');
      stream.push(`${curX + 5} ${y - 14} Td (${sanitizePdfText(h)}) Tj`);
      stream.push('ET');
      curX += colWidths[i];
    });
    y -= 22;
  }

  drawTableHeader();

  // Filas de datos
  rows.forEach((row, rIdx) => {
    if (y < 45) {
      startNewPage();
      drawTableHeader();
    }

    const rowBg = rIdx % 2 === 0 ? '1 1 1 rg' : '0.97 0.98 0.99 rg';
    stream.push(rowBg);
    stream.push(`${margin} ${y - 17} ${contentWidth} 17 re f`);

    // Separador inferior sutil
    stream.push('0.91 0.93 0.95 RG');
    stream.push('0.5 w');
    stream.push(`${margin} ${y - 17} m ${pageWidth - margin} ${y - 17} l S`);

    let curX = margin;
    row.forEach((cell, cIdx) => {
      const text = sanitizePdfText(String(cell || '—'));
      const maxLen = cIdx === 6 ? 38 : cIdx === 5 ? 30 : 25;
      const truncated = text.length > maxLen ? text.substring(0, maxLen - 2) + '..' : text;

      stream.push('BT');
      if (cIdx === 0) {
        stream.push('/F2 8 Tf');
        stream.push('0.0 0.41 0.48 rg'); // Código en Teal
      } else {
        stream.push('/F1 7.5 Tf');
        stream.push('0.15 0.20 0.25 rg');
      }
      stream.push(`${curX + 5} ${y - 12} Td (${truncated}) Tj`);
      stream.push('ET');
      curX += colWidths[cIdx];
    });

    y -= 17;
  });

  pages.push(stream.join('\n'));

  // Construcción de la estructura interna del PDF (PDF-1.4)
  const encoder = new TextEncoder();
  const pageObjIds = [];
  const contentObjIds = [];
  const objects = [];

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  pages.forEach((pageContent, idx) => {
    const pageId = 5 + idx * 2;
    const contentId = 5 + idx * 2 + 1;
    pageObjIds.push(pageId);
    contentObjIds.push(contentId);

    const streamLen = encoder.encode(pageContent).length;
    objects.push(`${contentId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${pageContent}\nendstream\nendobj`);
    objects.push(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj`);
  });

  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >>\nendobj`);

  let output = '%PDF-1.4\n';
  const offsets = [];

  objects.sort((a, b) => {
    const idA = parseInt(a.split(' ')[0], 10);
    const idB = parseInt(b.split(' ')[0], 10);
    return idA - idB;
  });

  objects.forEach((obj) => {
    const id = parseInt(obj.split(' ')[0], 10);
    offsets[id] = encoder.encode(output).length;
    output += obj + '\n';
  });

  const startXref = encoder.encode(output).length;
  const maxObjId = Math.max(...objects.map((o) => parseInt(o.split(' ')[0], 10)));

  output += `xref\n0 ${maxObjId + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObjId; i++) {
    const off = offsets[i] || 0;
    output += String(off).padStart(10, '0') + ' 00000 n \n';
  }

  output += `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return output;
}

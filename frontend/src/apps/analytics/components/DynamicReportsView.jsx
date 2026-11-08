import { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  UserCheck,
  Stethoscope,
  Activity,
  Users,
  DollarSign,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileDown,
  Building2,
} from 'lucide-react';
import { dynamicReportService } from '../services/dynamicReportService';
import { useAuth } from '../../../context/AuthContext';

/**
 * Vista de Generación de Reportes con Filtros Dinámicos (CU22 - RF13)
 * Paquete 6: Reportes y Analítica
 * Metodología PUDS / RUP — Centro Médico La Cruz
 */
export function DynamicReportsView() {
  const { user } = useAuth();
  const role = user?.roles?.[0]?.nombre_rol || 'PACIENTE';
  const isDoctor = role === 'MEDICO';

  // Catálogos
  const [catalogs, setCatalogs] = useState({
    especialidades: [],
    medicos: [],
    estados_cita: ['TODOS'],
    grupos_etarios: ['TODOS'],
  });

  // Reporte Activo (1 al 7)
  const [tipoReporte, setTipoReporte] = useState('citas-fecha');

  // Filtros Dinámicos
  const [periodoPreset, setPeriodoPreset] = useState('mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [fechaAgenda, setFechaAgenda] = useState(new Date().toISOString().split('T')[0]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('TODOS');
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('TODOS');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('TODOS');
  const [grupoEtarioSeleccionado, setGrupoEtarioSeleccionado] = useState('TODOS');

  // Estado del Reporte
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Buscador y Paginación en Tabla
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Definición de las 7 Pestañas de Reportes
  const tabsReporte = [
    { id: 'citas-fecha', label: '1. Citas por Fecha', icon: Calendar, desc: 'Rango de fechas y tendencias' },
    { id: 'citas-medico', label: '2. Citas por Médico', icon: UserCheck, desc: 'Carga de trabajo y atenciones' },
    { id: 'citas-especialidad', label: '3. Por Especialidad', icon: Stethoscope, desc: 'Demanda clínica y volumen' },
    { id: 'citas-estado', label: '4. Por Estado', icon: Activity, desc: 'Efectividad y cancelaciones' },
    { id: 'pacientes', label: '5. Pacientes Registrados', icon: Users, desc: 'Padrón y grupos etarios' },
    { id: 'balance', label: '6. Balance y Totales', icon: DollarSign, desc: 'Rendimiento y pagos' },
    { id: 'agenda-diaria', label: '7. Agenda Diaria', icon: Clock, desc: 'Cronograma diario por médico' },
  ];

  // Cargar Catálogos Iniciales
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const res = await dynamicReportService.fetchReportCatalogs();
        if (res.success && res.data) {
          setCatalogs(res.data);
          if (isDoctor && res.data.medicos?.length > 0) {
            setMedicoSeleccionado(res.data.medicos[0].id_medico);
          }
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    }
    loadCatalogs();
  }, [isDoctor]);

  // Cargar Reporte Dinámico
  const handleFetchReport = async (overrideTipo = null) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const tipo = overrideTipo || tipoReporte;
      const filtros = {
        periodo: periodoPreset,
        desde: periodoPreset === 'custom' ? fechaDesde : undefined,
        hasta: periodoPreset === 'custom' ? fechaHasta : undefined,
        id_medico: medicoSeleccionado !== 'TODOS' ? medicoSeleccionado : undefined,
        id_especialidad: especialidadSeleccionada !== 'TODOS' ? especialidadSeleccionada : undefined,
        estado: estadoSeleccionado !== 'TODOS' ? estadoSeleccionado : undefined,
        grupo_etario: grupoEtarioSeleccionado !== 'TODOS' ? grupoEtarioSeleccionado : undefined,
        fecha: tipo === 'agenda-diaria' ? fechaAgenda : undefined,
      };

      const res = await dynamicReportService.fetchDynamicReport(tipo, filtros);
      if (res.success && res.data) {
        setReportData(res.data);
        setCurrentPage(1);
      } else {
        setErrorMsg(res.message || 'No se pudieron recuperar los datos del reporte.');
      }
    } catch (err) {
      console.error('Error generando reporte:', err);
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Disparar carga cuando cambia el tipo de reporte
  useEffect(() => {
    handleFetchReport(tipoReporte);
  }, [tipoReporte]);

  // Cambiar preset de fechas
  const handlePresetChange = (preset) => {
    setPeriodoPreset(preset);
    if (preset !== 'custom') {
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  // Limpiar filtros
  const handleResetFilters = () => {
    setPeriodoPreset('mes');
    setFechaDesde('');
    setFechaHasta('');
    setFechaAgenda(new Date().toISOString().split('T')[0]);
    if (!isDoctor) setMedicoSeleccionado('TODOS');
    setEspecialidadSeleccionada('TODOS');
    setEstadoSeleccionado('TODOS');
    setGrupoEtarioSeleccionado('TODOS');
    setSearchTerm('');
  };

  // Exportar a CSV
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const filtros = {
        periodo: periodoPreset,
        desde: periodoPreset === 'custom' ? fechaDesde : undefined,
        hasta: periodoPreset === 'custom' ? fechaHasta : undefined,
        id_medico: medicoSeleccionado !== 'TODOS' ? medicoSeleccionado : undefined,
        id_especialidad: especialidadSeleccionada !== 'TODOS' ? especialidadSeleccionada : undefined,
        estado: estadoSeleccionado !== 'TODOS' ? estadoSeleccionado : undefined,
        grupo_etario: grupoEtarioSeleccionado !== 'TODOS' ? grupoEtarioSeleccionado : undefined,
        fecha: tipoReporte === 'agenda-diaria' ? fechaAgenda : undefined,
      };
      await dynamicReportService.downloadReportCsv(tipoReporte, filtros);
    } catch (err) {
      alert(err.message || 'Error al exportar el archivo CSV.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Imprimir reporte con estilos limpios
  const handlePrint = () => {
    window.print();
  };

  // Filtrado de registros en cliente por búsqueda
  const filteredRegistros = useMemo(() => {
    const list = reportData?.registros || [];
    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((r) => {
      const nombre = (r.paciente || r.nombre_completo || '').toLowerCase();
      const doc = (r.numero_documento || '').toLowerCase();
      const cod = (r.codigo_cita || r.codigo_historia || '').toLowerCase();
      const med = (r.medico || '').toLowerCase();
      const esp = (r.especialidad || '').toLowerCase();
      return (
        nombre.includes(term) ||
        doc.includes(term) ||
        cod.includes(term) ||
        med.includes(term) ||
        esp.includes(term)
      );
    });
  }, [reportData?.registros, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredRegistros.length / pageSize) || 1;
  const paginatedRegistros = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistros.slice(start, start + pageSize);
  }, [filteredRegistros, currentPage, pageSize]);

  // Helper para badge de estado
  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Atendida
          </span>
        );
      case 'PROGRAMADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Programada
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
            <CheckCircle2 className="w-3 h-3 text-cyan-600" /> Confirmada
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Cancelada
          </span>
        );
      case 'INASISTENCIA':
      case 'NO_ASISTIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Inasistencia
          </span>
        );
      case 'ACTIVO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Activo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {estado || 'N/A'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-view-fade">
      {/* 1. Cabecera Institucional */}
      <div className="bg-gradient-to-r from-[#003844] via-[#004e5f] to-[#00687a] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-400/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-300/20 border border-cyan-200/30 text-cyan-100 text-xs font-medium tracking-wide">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              PAQUETE 6: REPORTES Y ANALÍTICA • CU22 (RF13)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clinical tracking-tight">
              Generador de Reportes con Filtros Dinámicos
            </h1>
            <p className="text-cyan-100/80 text-sm max-w-2xl">
              Consulte y exporte los 7 reportes gerenciales del examen con filtros en tiempo real,
              métricas de ocupación, balance de citas y padrón poblacional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-sm border border-white/20 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Descargar archivo CSV"
            >
              <FileDown className={`w-4 h-4 ${exportingCsv ? 'animate-bounce' : ''}`} />
              <span>{exportingCsv ? 'Exportando...' : 'Exportar CSV'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#003844] font-semibold text-sm shadow-md transition-all active:scale-95"
              title="Imprimir o guardar en PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Selector de los 7 Reportes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {tabsReporte.map((tab) => {
            const Icon = tab.icon;
            const active = tipoReporte === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTipoReporte(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#003844] text-white shadow-md font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Panel de Filtros Dinámicos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Filter className="w-4 h-4 text-[#00687a]" />
            <span>Filtros Dinámicos Aplicables</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => handleFetchReport()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00687a] hover:bg-[#005563] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* Controles de Filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Preset o Fecha de Agenda */}
          {tipoReporte === 'agenda-diaria' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Fecha de Agenda</label>
              <input
                type="date"
                value={fechaAgenda}
                onChange={(e) => setFechaAgenda(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a]"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Período de Tiempo</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'hoy', label: 'Hoy' },
                  { id: '7d', label: '7 días' },
                  { id: 'mes', label: 'Mes' },
                  { id: 'custom', label: 'Fechas' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    className={`text-xs py-1 rounded-lg font-medium transition-all ${
                      periodoPreset === p.id
                        ? 'bg-white text-[#003844] shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rango Personalizado si está activo */}
          {periodoPreset === 'custom' && tipoReporte !== 'agenda-diaria' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Fecha Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Fecha Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a]"
                />
              </div>
            </>
          )}

          {/* Selector de Médico (para reportes de citas y agenda) */}
          {tipoReporte !== 'pacientes' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Médico Responsable</label>
              <select
                value={medicoSeleccionado}
                onChange={(e) => setMedicoSeleccionado(e.target.value)}
                disabled={isDoctor}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] disabled:bg-slate-50 disabled:text-slate-500"
              >
                {tipoReporte !== 'agenda-diaria' && <option value="TODOS">Todos los Médicos</option>}
                {catalogs.medicos?.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>
                    {m.nombre_completo} ({m.especialidad_principal})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Especialidad */}
          {tipoReporte !== 'pacientes' && tipoReporte !== 'agenda-diaria' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Especialidad Médica</label>
              <select
                value={especialidadSeleccionada}
                onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a]"
              >
                <option value="TODOS">Todas las Especialidades</option>
                {catalogs.especialidades?.map((esp) => (
                  <option key={esp.id_especialidad} value={esp.id_especialidad}>
                    {esp.nombre} (Bs. {Number(esp.precio_consulta || 70).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Estado de Cita */}
          {tipoReporte !== 'pacientes' && tipoReporte !== 'agenda-diaria' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Estado de Cita</label>
              <select
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a]"
              >
                {catalogs.estados_cita?.map((est) => (
                  <option key={est} value={est}>
                    {est === 'TODOS' ? 'Todos los Estados' : est}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Grupo Etario (solo para padrón de pacientes) */}
          {tipoReporte === 'pacientes' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Grupo Etario</label>
              <select
                value={grupoEtarioSeleccionado}
                onChange={(e) => setGrupoEtarioSeleccionado(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a]"
              >
                <option value="TODOS">Todos los Grupos Etarios</option>
                <option value="PEDIATRICO">Pediátrico (0 - 12 años)</option>
                <option value="ADULTO">Adulto (13 - 59 años)</option>
                <option value="GERIATRICO">Geriátrico (60+ años)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Tarjetas de Métricas Ejecutivas (KPIs) */}
      {reportData?.metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(reportData.metricas).map(([clave, valor]) => {
            const labelLimpio = clave
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());

            const esPorcentaje = clave.includes('tasa') || clave.includes('porcentaje');
            const esDinero = clave.includes('ingresos') || clave.includes('ticket');

            return (
              <div
                key={clave}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {labelLimpio}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold font-sans-clinical text-slate-900">
                    {esDinero ? `Bs. ${Number(valor).toFixed(2)}` : valor}
                  </span>
                  {esPorcentaje && <span className="text-xs font-semibold text-[#00687a]">%</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Desgloses Visuales Específicos por Tipo de Reporte */}
      {/* 5.1 Desglose de Especialidades (Reporte 3) */}
      {tipoReporte === 'citas-especialidad' && reportData?.resumen_agrupado && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#00687a]" />
            Distribución de Demanda y Facturación Estimada por Especialidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportData.resumen_agrupado.map((item) => (
              <div key={item.id_especialidad} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{item.especialidad}</span>
                  <span className="text-[#00687a]">{item.participacion_porcentaje}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#00687a] h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.participacion_porcentaje}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>{item.total_citas} citas ({item.atendidas} atendidas)</span>
                  <span className="font-semibold text-slate-700">Bs. {Number(item.ingresos_estimados).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5.2 Desglose de Estados (Reporte 4) */}
      {tipoReporte === 'citas-estado' && reportData?.distribucion_estados && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00687a]" />
            Distribución Porcentual del Ciclo de Vida de Citas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {reportData.distribucion_estados.map((item) => (
              <div key={item.estado} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold text-slate-700 block">{item.nombre_visible}</span>
                <span className="text-lg font-bold block mt-1" style={{ color: item.color }}>
                  {item.conteo}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{item.porcentaje}% del total</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5.3 Desglose por Grupos Etarios (Reporte 5) */}
      {tipoReporte === 'pacientes' && reportData?.distribucion_etaria && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00687a]" />
            Segmentación Poblacional por Grupos Etarios (RF04)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {reportData.distribucion_etaria.map((g) => (
              <div key={g.grupo} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{g.grupo}</span>
                  <span className="text-[#00687a]">{g.porcentaje}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${g.porcentaje}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">{g.conteo} pacientes registrados</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5.4 Tarjeta de Médico en Agenda Diaria (Reporte 7) */}
      {tipoReporte === 'agenda-diaria' && reportData?.medico && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#003844] text-cyan-200 flex items-center justify-center font-bold text-lg">
              {reportData.medico.nombre_completo.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{reportData.medico.nombre_completo}</h4>
              <p className="text-xs text-slate-500">
                Matrícula: {reportData.medico.matricula} • Especialidad: {reportData.medico.especialidad}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-[#00687a]" />
            <span>Franja Horaria: {reportData.medico.franja_horaria}</span>
          </div>
        </div>
      )}

      {/* 6. Tabla de Registros Detallados */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Cabecera de Tabla */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              {reportData?.titulo || 'Detalle de Registros'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {reportData?.descripcion || 'Listado tabular de registros que coinciden con los filtros aplicados.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en tabla..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 focus:border-[#00687a] w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                {tipoReporte === 'pacientes' ? (
                  <>
                    <th className="px-4 py-3">Código HC</th>
                    <th className="px-4 py-3">Paciente</th>
                    <th className="px-4 py-3">C.I. / Documento</th>
                    <th className="px-4 py-3">Edad / Grupo</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Portal Web</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Registro</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Paciente</th>
                    <th className="px-4 py-3">Médico</th>
                    <th className="px-4 py-3">Especialidad</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00687a] mb-2" />
                    <span>Cargando datos del reporte dinámico...</span>
                  </td>
                </tr>
              ) : paginatedRegistros.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No se encontraron registros</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Intente ajustando el rango de fechas o los filtros seleccionados.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRegistros.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    {tipoReporte === 'pacientes' ? (
                      <>
                        <td className="px-4 py-3 font-semibold text-[#00687a]">{row.codigo_historia}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.nombre_completo}</td>
                        <td className="px-4 py-3">{row.numero_documento}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">{row.edad} años</span>{' '}
                          <span className="text-[10px] text-slate-400">({row.grupo_etario})</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[11px]">{row.telefono}</div>
                          <div className="text-[10px] text-slate-400">{row.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {row.cuenta_web_activa ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Activa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                              Sin cuenta
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{renderEstadoBadge(row.estado)}</td>
                        <td className="px-4 py-3 text-right text-slate-400 text-[11px]">{row.fecha_registro}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-semibold text-[#00687a]">{row.codigo_cita}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <div>{row.fecha}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {row.hora_inicio} - {row.hora_fin}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{row.paciente}</div>
                          <div className="text-[10px] text-slate-400">Doc: {row.numero_documento}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{row.medico}</div>
                          <div className="text-[10px] text-slate-400">Mat: {row.matricula}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.especialidad}</td>
                        <td className="px-4 py-3">{renderEstadoBadge(row.estado)}</td>
                        <td className="px-4 py-3">
                          {row.pagada ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Pagada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          Bs. {Number(row.monto_pago || 70).toFixed(2)}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador */}
        <div className="p-3 sm:p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando registros del{' '}
            <span className="font-semibold text-slate-700">
              {filteredRegistros.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            al{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * pageSize, filteredRegistros.length)}
            </span>{' '}
            de un total de{' '}
            <span className="font-semibold text-slate-700">{filteredRegistros.length}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Vista Oculta para Impresión Oficial en PDF (@media print) */}
      <div id="print-official-container" className="hidden print:block text-slate-900 bg-white p-4">
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-serif-clinical">CENTRO MÉDICO LA CRUZ</h1>
            <p className="text-xs text-slate-600">Sistema Integral de Atención Primaria • Clínica Vida Salud</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">{reportData?.titulo}</p>
            <p className="text-slate-500">Emisión: {reportData?.generado_en}</p>
            <p className="text-slate-500">Emisor: {reportData?.generado_por}</p>
          </div>
        </div>

        {reportData?.metricas && (
          <div className="grid grid-cols-4 gap-2 mb-4 border border-slate-200 p-2 text-xs">
            {Object.entries(reportData.metricas).slice(0, 4).map(([k, v]) => (
              <div key={k}>
                <span className="text-[10px] text-slate-500 uppercase">{k.replace(/_/g, ' ')}:</span>
                <p className="font-bold text-sm">{v}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between text-xs text-slate-500">
          <div>Reporte Oficial generado bajo norma PUDS / RUP • Examen Parcial II (RF13)</div>
          <div>Firma / Sello de Auditoría: _________________________</div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList,
  Search,
  Calendar,
  RefreshCw,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Stethoscope,
  User,
} from 'lucide-react';
import { consultaService } from '../services/consultaService';
import { useAuth } from '../../../context/AuthContext';

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, colorClass = 'text-[#00687a]', borderClass = 'border-slate-200/80' }) {
  return (
    <div className={`bg-white p-4 rounded-xl border ${borderClass} shadow-xs flex items-center gap-3`}>
      <div className={`p-2.5 rounded-xl bg-slate-100 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
        <span className={`text-2xl font-extrabold ${colorClass} leading-none mt-0.5 block`}>{value}</span>
      </div>
    </div>
  );
}

// ─── Badge de tipo de diagnóstico ────────────────────────────────────────────

function DiagnosticoBadge({ tipo }) {
  if (tipo === 'DEFINITIVO') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Definitivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-2.5 h-2.5" />
      Presuntivo
    </span>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Vista principal del módulo de Consultas Médicas (CU16)
 * Paquete 4: Historial Clínico
 */
export function ConsultasManager() {
  const { role } = useAuth();

  const [consultas, setConsultas] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [fecha, setFecha] = useState('');
  const [page, setPage] = useState(1);

  const debounceRef = useRef(null);

  // Cargar consultas
  const loadConsultas = useCallback(async (params = {}) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await consultaService.getConsultas({
        search: params.search ?? search,
        fecha: params.fecha ?? fecha,
        page: params.page ?? page,
        per_page: 10,
      });

      // Soporta respuesta { data: [...], meta: {...} } o { consultas: [...] }
      const list = res?.data ?? res?.consultas ?? [];
      const metaData = res?.meta ?? { current_page: 1, last_page: 1, total: list.length };
      setConsultas(Array.isArray(list) ? list : []);
      setMeta(metaData);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar las consultas médicas.');
      setConsultas([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, fecha, page]);

  useEffect(() => {
    loadConsultas();
  }, [loadConsultas]);

  // Debounce en búsqueda
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadConsultas({ search: value, page: 1 });
    }, 400);
  };

  const handleFechaChange = (value) => {
    setFecha(value);
    setPage(1);
    loadConsultas({ fecha: value, page: 1 });
  };

  const handlePage = (newPage) => {
    setPage(newPage);
    loadConsultas({ page: newPage });
  };

  // KPIs locales calculados desde los datos en memoria
  const totalConsultas = meta.total ?? consultas.length;
  const hoy = new Date().toISOString().split('T')[0];
  const atendidashoy = consultas.filter((c) => {
    const fechaC = c.fecha_consulta?.slice(0, 10) || c.created_at?.slice(0, 10) || '';
    return fechaC === hoy;
  }).length;
  const definitivos = consultas.filter((c) =>
    c.diagnosticos?.some((d) => d.tipo_diagnostico === 'DEFINITIVO')
  ).length;

  // Obtener diagnóstico principal de una consulta
  const diagPrincipal = (consulta) => {
    const diags = consulta.diagnosticos || [];
    return diags[0] || null;
  };

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-[#004d5a] to-[#006677] text-white rounded-xl shadow">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg font-montserrat leading-tight">
            Consultas Médicas
          </h1>
          <span className="text-xs text-slate-400">Paquete 4 — Historial Clínico · CU16</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Total Consultas"
          value={totalConsultas}
          icon={ClipboardList}
          colorClass="text-[#00687a]"
          borderClass="border-cyan-200/60"
        />
        <KpiCard
          label="Atendidas Hoy"
          value={atendidashoy}
          icon={Clock}
          colorClass="text-emerald-700"
          borderClass="border-emerald-200/60"
        />
        <KpiCard
          label="Diagnósticos Definitivos"
          value={definitivos}
          icon={CheckCircle2}
          colorClass="text-indigo-700"
          borderClass="border-indigo-200/60"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por paciente, CI o código de cita..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
          />
        </div>

        {/* Filtro por fecha */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-[#00687a]" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => handleFechaChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          />
          {fecha && (
            <button
              type="button"
              onClick={() => handleFechaChange('')}
              className="text-slate-400 hover:text-slate-700 transition text-[10px] font-bold cursor-pointer"
              title="Limpiar filtro de fecha"
            >
              ✕
            </button>
          )}
        </div>

        {/* Recargar */}
        <button
          type="button"
          onClick={() => loadConsultas()}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
          title="Recargar"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00687a]' : ''}`} />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#00687a]" />
            <h2 className="font-bold text-slate-900 text-sm font-montserrat">
              Registro de Consultas
            </h2>
          </div>
          {!isLoading && (
            <span className="text-xs text-slate-400">
              {meta.total ?? consultas.length} consulta(s) encontrada(s)
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-7 h-7 border-[3px] border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin" />
            <span className="text-xs">Cargando consultas médicas...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-rose-600 text-xs flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            {errorMsg}
          </div>
        ) : consultas.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 max-w-sm mx-auto text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-700 text-sm">Sin consultas registradas</p>
            <p className="text-xs text-slate-500">
              {search || fecha
                ? 'No se encontraron consultas con los filtros aplicados.'
                : 'Las consultas médicas registradas aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Código Cita</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Paciente</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Médico</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Diagnóstico Principal</th>
                    <th className="px-5 py-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consultas.map((c) => {
                    const diag = diagPrincipal(c);
                    const fechaConsulta = c.fecha_consulta || c.created_at;
                    return (
                      <tr key={c.id_consulta || c.id} className="hover:bg-slate-50/60 transition">
                        {/* Fecha */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-slate-700">
                            {fechaConsulta
                              ? new Date(fechaConsulta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              : '—'}
                          </span>
                          {fechaConsulta && (
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(fechaConsulta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>

                        {/* Código cita */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-[#00687a] bg-[#00687a]/10 border border-[#00687a]/20 rounded-md px-2 py-0.5">
                            {c.cita?.codigo_cita || c.codigo_cita || '—'}
                          </span>
                        </td>

                        {/* Paciente */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900">
                                {c.paciente?.nombres} {c.paciente?.apellidos}
                              </span>
                              {c.paciente?.numero_documento && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  CI: {c.paciente.numero_documento}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Médico */}
                        <td className="px-5 py-3.5">
                          <span className="text-slate-700 font-medium">
                            {c.medico
                              ? `Dr. ${c.medico.apellidos} ${c.medico.nombres}`
                              : '—'}
                          </span>
                          {c.especialidad?.nombre && (
                            <span className="text-[10px] text-slate-400 block">{c.especialidad.nombre}</span>
                          )}
                        </td>

                        {/* Diagnóstico principal */}
                        <td className="px-5 py-3.5">
                          {diag ? (
                            <div className="space-y-1">
                              <DiagnosticoBadge tipo={diag.tipo_diagnostico} />
                              <p className="text-slate-700 max-w-[200px] truncate" title={diag.descripcion}>
                                {diag.descripcion}
                              </p>
                              {diag.codigo_cie10 && (
                                <span className="font-mono text-[10px] text-slate-400">{diag.codigo_cie10}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Ver detalle de consulta #${c.id_consulta || c.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-lg transition cursor-pointer"
                            title="Ver detalle de la consulta"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {consultas.map((c) => {
                const diag = diagPrincipal(c);
                return (
                  <div key={c.id_consulta || c.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {c.paciente?.nombres} {c.paciente?.apellidos}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          CI: {c.paciente?.numero_documento || '—'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#00687a] bg-[#00687a]/10 border border-[#00687a]/20 rounded-md px-2 py-0.5">
                        {c.cita?.codigo_cita || c.codigo_cita || '—'}
                      </span>
                    </div>
                    {diag && (
                      <div className="flex items-center gap-2">
                        <DiagnosticoBadge tipo={diag.tipo_diagnostico} />
                        <span className="text-xs text-slate-700 truncate">{diag.descripcion}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => alert(`Ver detalle de consulta #${c.id_consulta || c.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Detalle
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {meta.last_page > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Página {meta.current_page} de {meta.last_page}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePage(meta.current_page - 1)}
                    disabled={meta.current_page <= 1}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePage(meta.current_page + 1)}
                    disabled={meta.current_page >= meta.last_page}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/auditService';
import { AuditDetailModal } from './AuditDetailModal';
import {
  History,
  Search,
  Filter,
  Calendar,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Globe,
  Clock,
  Eye,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

export function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ modulos: [], acciones: [], usuarios: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [paginationMeta, setPaginationMeta] = useState(null);

  // Modal de detalle
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Cargar datos de selectores y estadísticas al montar
  useEffect(() => {
    async function initMetadata() {
      try {
        const [filtersRes, statsRes] = await Promise.all([
          auditService.fetchFiltersData(),
          auditService.fetchStats(),
        ]);
        if (filtersRes.data) setFilterOptions(filtersRes.data);
        if (statsRes.data) setStats(statsRes.data);
      } catch (err) {
        console.error('Error cargando metadatos de auditoría:', err);
      }
    }
    initMetadata();
  }, []);

  // Carga de eventos con debounce
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await auditService.fetchLogs({
        q: searchTerm,
        modulo: selectedModule,
        accion: selectedAction,
        id_usuario: selectedUser,
        fecha_inicio: startDate,
        fecha_fin: endDate,
        page: currentPage,
        per_page: perPage,
      });

      setLogs(response.data || []);
      setPaginationMeta(response.pagination || null);
    } catch (err) {
      setError(err.message || 'Error al consultar la bitácora de auditoría.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedModule, selectedAction, selectedUser, startDate, endDate, currentPage, perPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedModule('');
    setSelectedAction('');
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const getActionBadge = (accion) => {
    if (accion.includes('EXITOSO') || accion.includes('CREAR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {accion}
        </span>
      );
    }
    if (accion.includes('FALLIDO') || accion.includes('BLOQUEADO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {accion}
        </span>
      );
    }
    if (accion.includes('CAMBIO') || accion.includes('DESBLOQUEO') || accion.includes('MODIFICAR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          <Shield className="w-3 h-3 text-amber-600" />
          {accion}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 text-slate-700 border border-slate-200">
        {accion}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. KPIs / Tarjetas de Resumen Diario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Eventos Totales Hoy</p>
            <p className="text-2xl font-bold font-montserrat text-slate-900 mt-0.5">
              {stats?.total_hoy ?? '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#00687a]/10 text-[#00687a]">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inicios Exitosos</p>
            <p className="text-2xl font-bold font-montserrat text-emerald-700 mt-0.5">
              {stats?.logins_exitosos_hoy ?? '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Intentos Fallidos / Bloqueos</p>
            <p className="text-2xl font-bold font-montserrat text-rose-600 mt-0.5">
              {stats?.intentos_fallidos_hoy ?? '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cambios Administrativos</p>
            <p className="text-2xl font-bold font-montserrat text-sky-700 mt-0.5">
              {stats?.operaciones_admin_hoy ?? '—'}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Barra Superior Informativa */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00687a]/10 text-[#00687a]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-montserrat font-bold text-slate-900 text-lg">
              Bitácora de Auditoría del Sistema (CU03)
            </h2>
            <p className="text-xs text-slate-500">
              Registro inmutable de acciones, inicios de sesión y modificaciones de datos
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer shrink-0"
          title="Actualizar eventos recientes"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refrescar</span>
        </button>
      </div>

      {/* 3. Panel de Filtros Multidimensionales */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Buscador libre */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por usuario, IP o detalle..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 transition"
            />
          </div>

          {/* Selector de Módulo */}
          <div className="sm:col-span-2">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
            >
              <option value="">Todos los Módulos</option>
              {filterOptions.modulos.map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          {/* Selector de Acción */}
          <div className="sm:col-span-3">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
            >
              <option value="">Todas las Acciones</option>
              {filterOptions.acciones.map((acc) => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Selector de Operador */}
          <div className="sm:col-span-3">
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
            >
              <option value="">Todos los Operadores</option>
              {filterOptions.usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.username} ({u.tipo_usuario})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila de Fechas y Botón Limpiar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-[11px] font-semibold">Rango de Fechas:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00687a]"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00687a]"
            />
          </div>

          {(searchTerm || selectedModule || selectedAction || selectedUser || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#00687a] hover:text-[#004d5a] font-semibold hover:underline cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabla de Eventos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">ID / Fecha</th>
                <th className="py-3.5 px-4">Operador</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Acción</th>
                <th className="py-3.5 px-4">Descripción del Suceso</th>
                <th className="py-3.5 px-4">IP Origen</th>
                <th className="py-3.5 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00687a]" />
                    <span>Consultando bitácora de auditoría...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-slate-600">No se encontraron eventos</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Intenta ajustar los criterios de búsqueda o el rango de fechas.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id_bitacora} className="hover:bg-slate-50/60 transition">
                    {/* ID y Fecha */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-400 text-[10px] block">#{log.id_bitacora}</span>
                      <span className="font-medium text-slate-700 whitespace-nowrap text-[11px]">
                        {new Date(log.fecha_registro).toLocaleString('es-BO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </td>

                    {/* Operador */}
                    <td className="py-3 px-4">
                      {log.usuario ? (
                        <div>
                          <span className="font-semibold text-slate-900 block">{log.usuario.username}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{log.usuario.tipo_usuario}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sistema / Anónimo</span>
                      )}
                    </td>

                    {/* Módulo */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.modulo}
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4">
                      {getActionBadge(log.accion)}
                    </td>

                    {/* Descripción */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.descripcion}>
                      {log.descripcion}
                    </td>

                    {/* IP Origen */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ip_origen || '127.0.0.1'}
                    </td>

                    {/* Botón Ver Detalle */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#00687a] hover:border-[#00687a]/30 hover:bg-[#00687a]/5 transition cursor-pointer"
                        title="Ver detalle completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Controles de Paginación */}
        {paginationMeta && paginationMeta.total > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <span>Mostrando página </span>
              <span className="font-bold text-slate-900">{paginationMeta.current_page}</span>
              <span> de </span>
              <span className="font-bold text-slate-900">{paginationMeta.last_page}</span>
              <span> ({paginationMeta.total} eventos registrados)</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value={10}>10 por pág.</option>
                <option value={15}>15 por pág.</option>
                <option value={25}>25 por pág.</option>
                <option value={50}>50 por pág.</option>
              </select>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(paginationMeta.last_page, p + 1))}
                disabled={currentPage >= paginationMeta.last_page || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal de Detalle */}
      <AuditDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}

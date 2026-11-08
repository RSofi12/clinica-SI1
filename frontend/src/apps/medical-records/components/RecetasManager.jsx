import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Stethoscope, 
  Printer, 
  Ban, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Pill, 
  RefreshCw, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { recetaService } from '../services/recetaService';
import { useAuth } from '../../../context/AuthContext';
import RecetaDetailModal from './RecetaDetailModal';
import RecetaAnularModal from './RecetaAnularModal';

/**
 * Gestor Integral de Prescripciones y Recetas Médicas (CU18)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
export function RecetasManager({ currentUser }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const [recetas, setRecetas] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, activas: 0, anuladas: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modales
  const [selectedReceta, setSelectedReceta] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [recetaToAnular, setRecetaToAnular] = useState(null);
  const [isAnularOpen, setIsAnularOpen] = useState(false);

  const rol = currentUser?.tipo_usuario || currentUser?.rol;

  useEffect(() => {
    cargarRecetas();
  }, [searchTerm, filtroEstado, filtroFecha, page]);

  const cargarRecetas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await recetaService.fetchRecetas({
        buscar: searchTerm,
        estado: filtroEstado,
        fecha: filtroFecha,
        page,
        per_page: 15,
      });

      const paginador = res?.data || res?.paginador || {};
      setRecetas(paginador?.data || []);
      setTotalPages(paginador?.last_page || 1);
      
      if (res?.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar las recetas médicas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerDetalle = (receta) => {
    setSelectedReceta(receta);
    setIsDetailOpen(true);
  };

  const handleSolicitarAnular = (receta) => {
    setRecetaToAnular(receta);
    setIsAnularOpen(true);
  };

  const handleConfirmarAnular = async (idReceta, motivo) => {
    await recetaService.anularReceta(idReceta, motivo);
    await cargarRecetas();
    if (selectedReceta && selectedReceta.id_receta === idReceta) {
      setSelectedReceta(prev => ({
        ...prev,
        estado: 'ANULADO',
        motivo_anulacion: motivo,
        anulado_en: new Date().toISOString(),
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif-clinical font-normal tracking-tight text-slate-900">
                Prescripciones y Recetas Médicas
              </h1>
              <p className="text-xs text-slate-500">
                Expediente clínico digital · Emisión estructurada, posología y archivo legal (CU18)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarRecetas()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Recargar listado"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Recetas</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
            <span className="text-[11px] text-slate-400">Registradas en el sistema</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Recetas Activas</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.activas}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Vigentes para retiro</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Recetas Anuladas</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.anuladas}</p>
            <span className="text-[11px] text-rose-600 font-medium">Bajas lógicas inmutables</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por paciente, CI, médico o fármaco..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Solo Activas (Vigentes)</option>
              <option value="ANULADO">Solo Anuladas</option>
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => {
                setFiltroFecha(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TABLA DE RECETAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nº Receta</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Médico Prescriptor</th>
                <th className="py-3 px-4">Medicamentos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                    Cargando prescripciones médicas...
                  </td>
                </tr>
              ) : recetas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Pill className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No se encontraron recetas médicas</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste los filtros o registre una prescripción en la consulta médica.</p>
                  </td>
                </tr>
              ) : (
                recetas.map((r) => {
                  const paciente = r.historia_clinica?.paciente;
                  const medico = r.medico;
                  const esActiva = r.estado === 'ACTIVO';
                  const detalles = r.detalles || [];

                  return (
                    <tr key={r.id_receta} className="hover:bg-slate-50/70 transition">
                      {/* Nº Receta */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(r)}
                          className="font-mono font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
                          title="Ver detalle completo de la receta"
                        >
                          #{String(r.id_receta).padStart(5, '0')}
                        </button>
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(r.fecha_emision).toLocaleDateString('es-ES')}
                        <span className="block text-[11px] text-slate-400">
                          {new Date(r.fecha_emision).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Paciente */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'No disponible'}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          CI: {paciente?.numero_documento || 'S/D'} · HC: {paciente?.numero_historia || 'S/N'}
                        </span>
                      </td>

                      {/* Médico */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          Dr(a). {medico ? `${medico.nombres} ${medico.apellidos}` : 'Médico General'}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Mat: {medico?.codigo_profesional || 'S/M'}
                        </span>
                      </td>

                      {/* Fármacos */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {detalles.slice(0, 2).map((d, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 truncate max-w-[120px]"
                              title={`${d.medicamento} (${d.dosis})`}
                            >
                              {d.medicamento}
                            </span>
                          ))}
                          {detalles.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-semibold">
                              +{detalles.length - 2} más
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {esActiva ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200" title={r.motivo_anulacion}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Anulada
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVerDetalle(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Ver prescripción médica y posología"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-700" />
                            <span>Ver Receta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleVerDetalle(r)}
                            className="p-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Imprimir receta oficial membretada"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-700" />
                          </button>

                          {esActiva && (rol === 'ADMIN' || (rol === 'MEDICO' && currentUser?.medico?.id_medico === r.id_medico)) && (
                            <button
                              type="button"
                              onClick={() => handleSolicitarAnular(r)}
                              className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition shadow-2xs cursor-pointer active:scale-95"
                              title="Anular receta médica (Baja Lógica RN11)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs">
            <span className="text-slate-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLE E IMPRESIÓN */}
      <RecetaDetailModal
        receta={selectedReceta}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
        }}
        onAnular={(rec) => {
          setIsDetailOpen(false);
          handleSolicitarAnular(rec);
        }}
        currentUser={currentUser}
      />

      {/* MODAL ANULAR RECETA */}
      <RecetaAnularModal
        receta={recetaToAnular}
        isOpen={isAnularOpen}
        onClose={() => {
          setIsAnularOpen(false);
        }}
        onConfirm={handleConfirmarAnular}
      />
    </div>
  );
}

export default RecetasManager;

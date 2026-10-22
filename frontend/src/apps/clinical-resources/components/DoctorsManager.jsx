import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Star,
  Award,
  Users,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { specialtyService } from '../services/specialtyService';
import { DoctorFormModal } from './DoctorFormModal';
import { DoctorDetailModal } from './DoctorDetailModal';

export function DoctorsManager() {
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, por_especialidad: [] });
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('activo'); // 'todos' | 'activo' | 'inactivo'
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorToEdit, setDoctorToEdit] = useState(null);

  // Cargar estadísticas y catálogo de especialidades
  const loadStatsAndCatalogs = useCallback(async () => {
    try {
      const [statsRes, espRes] = await Promise.all([
        doctorService.fetchDoctorStats(),
        specialtyService.fetchSpecialties({ estado: 'ACTIVO' }),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (espRes?.data) setSpecialties(espRes.data);
    } catch (err) {
      console.error('Error al cargar datos auxiliares:', err);
    }
  }, []);

  // Cargar lista de médicos
  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await doctorService.fetchDoctors({
        page: currentPage,
        per_page: 10,
        q: searchTerm,
        especialidad_id: selectedSpecialty,
        estado: selectedStatus === 'todos' ? '' : selectedStatus,
      });

      if (response?.data) {
        setDoctors(response.data);
        if (response.meta) {
          setPagination(response.meta);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener la lista de médicos.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedSpecialty, selectedStatus]);

  useEffect(() => {
    loadStatsAndCatalogs();
  }, [loadStatsAndCatalogs]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Manejar baja lógica (RN04 y RN11)
  const handleToggleStatus = async (id, currentStatus) => {
    const accion = currentStatus ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${accion} a este médico?`)) return;

    try {
      await doctorService.toggleDoctorStatus(id);
      await Promise.all([loadDoctors(), loadStatsAndCatalogs()]);
    } catch (err) {
      alert(err.message || 'Error al cambiar estado del médico.');
    }
  };

  const handleOpenCreate = () => {
    setDoctorToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (doctor) => {
    setDoctorToEdit(doctor);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* 1. Encabezado con Título y Botón Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00687a]/10 text-[#00687a]">
              <Stethoscope className="w-5 h-5 text-[#00687a]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-montserrat font-bold text-slate-900 tracking-tight">
              Gestión de Médicos y Especialidades
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">
            Plantel institucional, asignación de especialidades médicas y control de matrículas (CU06 / RF03).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#007b90] hover:from-[#005564] hover:to-[#006a7c] shadow-md shadow-[#00687a]/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Médico</span>
        </button>
      </div>

      {/* 2. Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Plantel</span>
            <Users className="w-4 h-4 text-[#00687a]" />
          </div>
          <div className="text-2xl font-montserrat font-bold text-slate-900">
            {stats.total || 0}
          </div>
          <span className="text-[11px] text-slate-400">Médicos registrados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">En Servicio</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-montserrat font-bold text-emerald-700">
            {stats.activos || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Habilitados para citas (RN04)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Bajas Lógicas</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-montserrat font-bold text-slate-700">
            {stats.inactivos || 0}
          </div>
          <span className="text-[11px] text-slate-400">Histórico preservado (RN11)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-cyan-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Especialidades</span>
            <Award className="w-4 h-4 text-[#00687a]" />
          </div>
          <div className="text-2xl font-montserrat font-bold text-[#00687a]">
            {specialties.length || 0}
          </div>
          <span className="text-[11px] text-[#00687a]/80 font-medium">Catálogo activo (CU07)</span>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nombre, apellido, matrícula profesional o especialidad..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Especialidad */}
          <select
            value={selectedSpecialty}
            onChange={(e) => {
              setSelectedSpecialty(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:bg-white cursor-pointer"
          >
            <option value="">Todas las Especialidades</option>
            {specialties.map((esp) => (
              <option key={esp.id_especialidad} value={esp.id_especialidad}>
                {esp.nombre}
              </option>
            ))}
          </select>

          {/* Selector de Estado */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:bg-white cursor-pointer"
          >
            <option value="activo">Solo Activos</option>
            <option value="inactivo">Solo Inactivos</option>
            <option value="todos">Todos los Estados</option>
          </select>

          <button
            type="button"
            onClick={() => {
              loadDoctors();
              loadStatsAndCatalogs();
            }}
            title="Refrescar listado"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Tabla de Médicos */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin mx-auto mb-3" />
            <span>Cargando plantel médico institucional...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-xs text-rose-600 bg-rose-50/50">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No se encontraron médicos</p>
            <p className="mt-1">Intenta ajustando los términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Profesional</th>
                  <th className="py-3.5 px-4">Especialidades</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Acceso Sistema</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {doctors.map((doctor) => {
                  const principal =
                    doctor.specialties?.find((s) => s.pivot?.es_principal) ||
                    doctor.specialties?.[0];
                  const secundarias =
                    doctor.specialties?.filter(
                      (s) => s.id_especialidad !== principal?.id_especialidad
                    ) || [];

                  return (
                    <tr
                      key={doctor.id_medico}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Profesional: Avatar, Nombres y Matrícula */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004d5a] to-[#00687a] text-[#70cbff] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {doctor.nombres?.[0]}
                            {doctor.apellidos?.[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {doctor.nombre_completo || `${doctor.nombres} ${doctor.apellidos}`}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Matrícula: {doctor.codigo_profesional}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Especialidades */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {principal && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00687a]/10 text-[#00687a] border border-[#00687a]/20">
                              <Star className="w-3 h-3 fill-[#00687a] text-[#00687a]" />
                              {principal.nombre}
                            </span>
                          )}
                          {secundarias.map((sec) => (
                            <span
                              key={sec.id_especialidad}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              {sec.nombre}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-4 text-[11px]">
                        <div className="space-y-0.5">
                          {doctor.telefono_contacto && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{doctor.telefono_contacto}</span>
                            </div>
                          )}
                          {doctor.correo_profesional && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{doctor.correo_profesional}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Usuario vinculado */}
                      <td className="py-3 px-4">
                        {doctor.user ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            @{doctor.user.username}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Sin cuenta</span>
                        )}
                      </td>

                      {/* Estado con switch de baja lógica (RN11) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(doctor.id_medico, doctor.estado_activo)}
                          title={doctor.estado_activo ? 'Desactivar médico' : 'Activar médico'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                            doctor.estado_activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              doctor.estado_activo ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{doctor.estado_activo ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(doctor)}
                            title="Ver Ficha Detallada"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00687a] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(doctor)}
                            title="Editar Médico"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Paginación */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Mostrando página {pagination.current_page} de {pagination.last_page} ({pagination.total} médicos)
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPage >= pagination.last_page}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <DoctorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        doctorToEdit={doctorToEdit}
        onSaved={async () => {
          setIsFormOpen(false);
          await Promise.all([loadDoctors(), loadStatsAndCatalogs()]);
        }}
      />

      <DoctorDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        doctor={selectedDoctor}
        onEdit={(doc) => {
          setIsDetailOpen(false);
          handleOpenEdit(doc);
        }}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { patientService } from '../services/patientService';
import { PatientFormModal } from './PatientFormModal';
import { PatientDetailModal } from './PatientDetailModal';
import { PatientWebAccountModal } from './PatientWebAccountModal';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  HeartPulse,
  Eye,
  Edit2,
  Power,
  RotateCcw,
  Loader2,
  Calendar,
  Sparkles,
  Phone,
  Baby,
  Activity,
  HeartHandshake,
  Globe,
} from 'lucide-react';

export function PatientsManager() {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'RECEPCIONISTA';

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWebAccountOpen, setIsWebAccountOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [webAccountPatient, setWebAccountPatient] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        patientService.fetchPatients({
          q: searchTerm,
          estado: statusFilter,
          sexo: genderFilter,
          grupo_etario: ageGroupFilter,
          page,
          per_page: 10,
        }),
        patientService.fetchStats(),
      ]);

      setPatients(listRes.data || []);
      setPagination(listRes.pagination || { total: 0, current_page: 1, last_page: 1 });
      setStats(statsRes.stats || null);
    } catch (err) {
      setError(err.message || 'Error al cargar el padrón de pacientes.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, genderFilter, ageGroupFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleOpenDetailModal = (patient) => {
    setSelectedPatient(patient);
    setIsDetailOpen(true);
  };

  const handleOpenWebAccountModal = (patient) => {
    setWebAccountPatient(patient);
    setIsWebAccountOpen(true);
  };

  const handleSavePatient = async (formData, patientId) => {
    if (patientId) {
      const res = await patientService.updatePatient(patientId, formData);
      showSuccess(res.message || 'Datos del paciente actualizados con éxito.');
    } else {
      const res = await patientService.createPatient(formData);
      showSuccess(res.message || 'Nuevo paciente registrado satisfactoriamente.');
    }
    loadData();
  };

  const handleToggleStatus = async (patient) => {
    const isActivo = patient.estado_paciente === 'ACTIVO';
    const actionText = isActivo ? 'desactivar (Baja Lógica)' : 'reactivar';
    if (!window.confirm(`¿Está seguro de ${actionText} al paciente '${patient.nombre_completo}'?`)) {
      return;
    }

    setActionLoadingId(patient.id_paciente);
    try {
      const res = await patientService.toggleStatus(patient.id_paciente);
      showSuccess(res.message);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al cambiar estado del paciente.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFilterByGroup = (group) => {
    if (ageGroupFilter === group) {
      setAgeGroupFilter('');
    } else {
      setAgeGroupFilter(group);
      setPage(1);
    }
  };

  const getGrupoBadge = (grupo) => {
    if (grupo?.includes('Pediátrico')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-sky-50 text-sky-800 border border-sky-200">
          <Baby className="w-3 h-3 text-sky-600" />
          Pediátrico
        </span>
      );
    }
    if (grupo?.includes('Geriátrico')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
          <HeartHandshake className="w-3 h-3 text-indigo-600" />
          Geriátrico
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Activity className="w-3 h-3 text-emerald-600" />
        Adulto
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Éxito */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-medium shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra Superior con Título y Botón Principal */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00687a]/10 text-[#00687a]">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-slate-900 text-lg">
                Gestión de Pacientes (CU04)
              </h2>
              <p className="text-xs text-slate-500">
                Padrón clínico con cálculo de edad, grupo etario institucional y baja lógica (RF02 / RN11)
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs hover:shadow-md transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Paciente</span>
          </button>
        )}
      </div>

      {/* 4 Tarjetas Métricas KPI con interactividad para filtrar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => { setStatusFilter(''); setAgeGroupFilter(''); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              !statusFilter && !ageGroupFilter
                ? 'bg-[#00687a]/5 border-[#00687a]/30 shadow-xs ring-1 ring-[#00687a]/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pacientes
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-montserrat font-bold text-2xl text-slate-900">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-400">en padrón</span>
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter(statusFilter === 'ACTIVO' ? '' : 'ACTIVO'); setPage(1); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'ACTIVO'
                ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                : 'bg-white border-slate-200/80 hover:border-emerald-200'
            }`}
          >
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Pacientes Activos
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-montserrat font-bold text-2xl text-emerald-800">
                {stats.activos}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">aptos para citas</span>
            </div>
          </div>

          <div
            onClick={() => handleFilterByGroup('pediatrico')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              ageGroupFilter === 'pediatrico'
                ? 'bg-sky-50 border-sky-300 shadow-xs ring-1 ring-sky-200'
                : 'bg-white border-slate-200/80 hover:border-sky-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider block">
                Pediátricos (&lt;15a)
              </span>
              <Baby className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-montserrat font-bold text-2xl text-sky-900">
                {stats.pediatricos}
              </span>
              <span className="text-[10px] text-sky-600 font-medium">Pediatría</span>
            </div>
          </div>

          <div
            onClick={() => handleFilterByGroup('geriatrico')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              ageGroupFilter === 'geriatrico'
                ? 'bg-indigo-50 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                : 'bg-white border-slate-200/80 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                Geriátricos (≥60a)
              </span>
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-montserrat font-bold text-2xl text-indigo-900">
                {stats.geriatricos}
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">Geriatría</span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Buscador de texto en vivo */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Buscar por CI, Historia Clínica o Nombre..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 transition"
          />
        </div>

        {/* Filtro por Grupo Etario */}
        <div className="sm:col-span-3">
          <select
            value={ageGroupFilter}
            onChange={(e) => { setAgeGroupFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
          >
            <option value="">Todos los Grupos Etarios</option>
            <option value="pediatrico">Pediátrico (&lt;15 años)</option>
            <option value="adulto">Adulto (15-59 años)</option>
            <option value="geriatrico">Geriátrico (≥60 años)</option>
          </select>
        </div>

        {/* Filtro por Sexo */}
        <div className="sm:col-span-2">
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
          >
            <option value="">Sexo: Todos</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </div>

        {/* Filtro por Estado */}
        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 text-slate-700 font-medium transition"
          >
            <option value="">Estado: Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Paciente</th>
                <th className="py-3.5 px-4">Historia / CI</th>
                <th className="py-3.5 px-4">Edad y Grupo</th>
                <th className="py-3.5 px-4">Grupo Sanguíneo</th>
                <th className="py-3.5 px-4">Contacto / Emergencia</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00687a] mb-2" />
                    <span>Cargando padrón de pacientes...</span>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <HeartPulse className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">
                      No se encontraron pacientes
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {searchTerm || statusFilter || ageGroupFilter
                        ? 'Pruebe modificando los filtros de búsqueda.'
                        : 'Comience registrando el primer paciente institucional.'}
                    </p>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => {
                  const isActionBusy = actionLoadingId === patient.id_paciente;
                  const contacto = patient.contactos_emergencia?.[0];

                  return (
                    <tr
                      key={patient.id_paciente}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Avatar y Nombre Completo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00687a]/10 text-[#00687a] flex items-center justify-center font-bold text-xs shrink-0 font-montserrat">
                            {patient.nombres?.[0]}
                            {patient.apellidos?.[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block group-hover:text-[#00687a] transition">
                              {patient.nombre_completo || `${patient.nombres} ${patient.apellidos}`}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {patient.sexo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Historia Clínica y Documento CI */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-[#00687a] bg-[#00687a]/5 px-2 py-0.5 rounded-md text-[11px]">
                          {patient.numero_historia}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          CI: <span className="font-semibold text-slate-700">{patient.numero_documento}</span>
                        </div>
                        <div className="mt-1">
                          {patient.id_usuario ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <Globe className="w-2.5 h-2.5 text-emerald-600" />
                              Web Activa
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenWebAccountModal(patient)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-[#00687a] bg-slate-100 hover:bg-[#00687a]/10 border border-slate-200 hover:border-[#00687a]/30 px-1.5 py-0.5 rounded transition cursor-pointer"
                              title="Habilitar acceso web para este paciente"
                            >
                              <Globe className="w-2.5 h-2.5 text-slate-400" />
                              + Habilitar Web
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Edad y Grupo Etario */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {patient.edad} {patient.edad === 1 ? 'año' : 'años'}
                        </div>
                        <div className="mt-1">
                          {getGrupoBadge(patient.grupo_etario)}
                        </div>
                      </td>

                      {/* Grupo Sanguíneo */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {patient.tipo_sangre || '—'}
                        </span>
                      </td>

                      {/* Teléfono y Contacto de Emergencia */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{patient.telefono || 'Sin teléfono'}</span>
                        </div>
                        {contacto && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                            Emergencia: <span className="text-slate-600 font-medium">{contacto.nombre}</span>
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        {patient.estado_paciente === 'ACTIVO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Ficha Detallada */}
                          <button
                            onClick={() => handleOpenDetailModal(patient)}
                            title="Consultar ficha clínica completa"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#00687a] hover:border-[#00687a]/30 hover:bg-[#00687a]/5 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar Paciente (Solo Administrador y Recepcionista) */}
                          {canManage && (
                            <button
                              onClick={() => handleOpenEditModal(patient)}
                              title="Editar datos del paciente"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#00687a] hover:border-[#00687a]/30 hover:bg-[#00687a]/5 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Baja Lógica RN11 / Reactivación (Solo Administrador y Recepcionista) */}
                          {canManage && (
                            <button
                              onClick={() => handleToggleStatus(patient)}
                              disabled={isActionBusy}
                              title={
                                patient.estado_paciente === 'ACTIVO'
                                  ? 'Desactivar paciente (Baja Lógica RN11)'
                                  : 'Reactivar paciente'
                              }
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                patient.estado_paciente === 'ACTIVO'
                                  ? 'border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
                                  : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
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

        {/* Paginador */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando página <strong>{pagination.current_page}</strong> de <strong>{pagination.last_page}</strong> ({pagination.total} pacientes)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSavePatient}
        initialPatient={selectedPatient}
      />

      {/* Modal de Ficha Detallada */}
      <PatientDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        patient={selectedPatient}
      />

      {/* Modal para Habilitar Cuenta Web (CU05) */}
      <PatientWebAccountModal
        isOpen={isWebAccountOpen}
        onClose={() => setIsWebAccountOpen(false)}
        patient={webAccountPatient}
        onCreated={() => {
          showSuccess(`Acceso web habilitado satisfactoriamente para '${webAccountPatient?.nombre_completo}'.`);
          loadData();
        }}
      />
    </div>
  );
}

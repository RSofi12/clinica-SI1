import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  User,
  Stethoscope,
  Building2,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  X,
  BadgeCheck,
  Video,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../../clinical-resources/services/doctorService';
import { AppointmentAvailabilityViewer } from './AppointmentAvailabilityViewer';
import { AppointmentBookingModal } from './AppointmentBookingModal';

/**
 * Gestor Integral de Citas Médicas y Agenda (CU09 / CU10 / RF05, RF06, RF07)
 * Paquete 3: Gestión de Citas Médicas
 */
export function AppointmentsManager() {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('citas'); // 'citas' | 'disponibilidad'

  // Estados de listado de citas
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);

  // Modales
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState(null);
  const [ticketModalAppointment, setTicketModalAppointment] = useState(null);

  // Cargar lista de médicos para filtro
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await doctorService.fetchDoctors({ per_page: 100, estado: 'activo' });
        if (res?.data) {
          setDoctorsList(res.data);
        }
      } catch (err) {
        console.error('Error al cargar médicos para filtro:', err);
      }
    }
    loadDoctors();
  }, []);

  // Cargar citas desde el backend
  const loadAppointments = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await appointmentService.fetchAppointments({
        page,
        per_page: 10,
        q: searchTerm || undefined,
        fecha: filterDate || undefined,
        estado: filterStatus !== 'TODOS' ? filterStatus : undefined,
        medico_id: filterDoctorId || undefined,
      });

      if (res?.data) {
        setAppointments(res.data);
        if (res.meta) {
          setPagination({
            current_page: res.meta.current_page,
            last_page: res.meta.last_page,
            per_page: res.meta.per_page,
            total: res.meta.total,
          });
        }
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterDate, filterStatus, filterDoctorId]);

  // Cargar citas al cambiar filtros o pestaña
  useEffect(() => {
    if (activeTab === 'citas') {
      const timer = setTimeout(() => {
        loadAppointments(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loadAppointments]);

  // Callback cuando se hace clic en "Programar Cita (CU10)" desde el visor de disponibilidad
  const handleSelectSlotForBooking = (slotInfo) => {
    setBookingInitialData(slotInfo);
    setIsBookingModalOpen(true);
  };

  // Callback al completar una reserva exitosa
  const handleAppointmentBooked = () => {
    loadAppointments(1);
    setActiveTab('citas');
  };

  // Formateador de fechas
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Formateador de horas
  const formatTimeDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  // Badge de estado
  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendiente
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Confirmada
          </span>
        );
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <BadgeCheck className="w-3.5 h-3.5 text-cyan-600" />
            Atendida
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Cancelada
          </span>
        );
      case 'REPROGRAMADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Reprogramada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00687a] to-[#008b9e] text-white flex items-center justify-center shadow-md shadow-[#00687a]/20 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-montserrat text-slate-900 tracking-tight">
                Gestión de Citas Médicas y Agenda
              </h1>
              <span className="text-[11px] font-bold bg-[#00687a]/10 text-[#00687a] px-2 py-0.5 rounded-md uppercase tracking-wider">
                CU09 / CU10
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prevención anti-colisión transaccional (RF07), auditoría inmutable en bitácora y consulta de turnos libres.
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
          {role !== 'PACIENTE' && (
            <button
              type="button"
              onClick={() => {
                setBookingInitialData(null);
                setIsBookingModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md shadow-[#00687a]/20 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Cita (CU10)</span>
            </button>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación: Citas vs Disponibilidad */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('citas')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === 'citas'
              ? 'border-[#00687a] text-[#00687a]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Citas Programadas</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
            {pagination.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disponibilidad')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === 'disponibilidad'
              ? 'border-[#00687a] text-[#00687a]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Consultar Disponibilidad de Horarios (CU09)</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'disponibilidad' ? (
        <AppointmentAvailabilityViewer onSelectSlotForBooking={handleSelectSlotForBooking} />
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Buscador textual */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por código (CM-XXXX), paciente, CI, o médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition"
              />
            </div>

            {/* Filtros desplegables */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Fecha */}
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-slate-700"
              />

              {/* Filtro Estado */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-slate-700"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="CONFIRMADA">Confirmadas</option>
                <option value="ATENDIDA">Atendidas</option>
                <option value="CANCELADA">Canceladas</option>
                <option value="REPROGRAMADA">Reprogramadas</option>
              </select>

              {/* Filtro Médico (si no es médico) */}
              {role !== 'MEDICO' && doctorsList.length > 0 && (
                <select
                  value={filterDoctorId}
                  onChange={(e) => setFilterDoctorId(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-slate-700 max-w-[180px] truncate"
                >
                  <option value="">Todos los médicos</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id_medico} value={doc.id_medico}>
                      Dr. {doc.apellidos} {doc.nombres}
                    </option>
                  ))}
                </select>
              )}

              {/* Limpiar / Refrescar */}
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('');
                  setFilterStatus('TODOS');
                  setFilterDoctorId('');
                  loadAppointments(1);
                }}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Limpiar filtros y recargar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00687a]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabla de Citas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Código / Fecha</th>
                    <th className="px-5 py-3.5">Paciente</th>
                    <th className="px-5 py-3.5">Médico / Especialidad</th>
                    <th className="px-5 py-3.5">Tipo / Modalidad</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-7 h-7 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin" />
                          <span className="text-xs">Cargando agenda de citas...</span>
                        </div>
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <CalendarCheck className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <p className="font-bold text-slate-700 text-sm">No se encontraron citas</p>
                          <p className="text-xs text-slate-500">
                            No hay citas médicas registradas que coincidan con los criterios de búsqueda aplicados.
                          </p>
                          {role !== 'PACIENTE' && (
                            <button
                              type="button"
                              onClick={() => {
                                setBookingInitialData(null);
                                setIsBookingModalOpen(true);
                              }}
                              className="mt-2 px-4 py-2 bg-[#00687a]/10 hover:bg-[#00687a]/20 text-[#00687a] rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              + Programar Nueva Cita
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((cita) => {
                      const horaInicioStr = formatTimeDisplay(cita.fecha_hora_inicio);
                      const horaFinStr = formatTimeDisplay(cita.fecha_hora_fin);

                      return (
                        <tr key={cita.id_cita} className="hover:bg-slate-50/70 transition">
                          {/* Código y Fecha */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md border border-[#00687a]/20">
                                {cita.codigo_cita}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-slate-900 font-bold">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDateDisplay(cita.fecha_hora_inicio)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {horaInicioStr} - {horaFinStr}
                              </span>
                            </div>
                          </td>

                          {/* Paciente */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {cita.paciente?.nombres} {cita.paciente?.apellidos}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Doc: {cita.paciente?.numero_documento || '—'}
                              {cita.paciente?.numero_historia && (
                                <span className="ml-2 font-mono text-[#00687a]">
                                  HC: {cita.paciente?.numero_historia}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Médico y Especialidad */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-[#00687a] shrink-0" />
                              <span>
                                Dr. {cita.medico?.nombres} {cita.medico?.apellidos}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#00687a] font-medium mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{cita.especialidad?.nombre || 'Medicina General'}</span>
                            </div>
                          </td>

                          {/* Tipo / Modalidad */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="text-slate-800 font-medium text-xs">
                              {cita.tipo_cita?.nombre || 'Consulta Médica'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {cita.modalidad === 'TELECONSULTA' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                                  <Video className="w-2.5 h-2.5" />
                                  Teleconsulta
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  Presencial
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {getStatusBadge(cita.estado)}
                          </td>

                          {/* Acciones */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setTicketModalAppointment(cita)}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                              title="Ver ficha / ticket de la cita"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Ticket</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.last_page > 1 && (
              <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Mostrando página <strong>{pagination.current_page}</strong> de <strong>{pagination.last_page}</strong> ({pagination.total} citas en total)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={pagination.current_page <= 1}
                    onClick={() => loadAppointments(pagination.current_page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pagination.current_page >= pagination.last_page}
                    onClick={() => loadAppointments(pagination.current_page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Asistido para Programar Cita (CU10) */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingInitialData(null);
        }}
        onAppointmentBooked={handleAppointmentBooked}
        initialData={bookingInitialData}
      />

      {/* Modal de Visualización de Ticket Oficial de Cita */}
      {ticketModalAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#004d5a] to-[#00687a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-200" />
                <h3 className="font-bold text-sm font-montserrat">Ticket de Cita Médica</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketModalAppointment(null)}
                className="p-1 text-cyan-200 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket Body */}
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                  CENTRO MÉDICO LA CRUZ
                </h4>
                <p className="text-[11px] text-slate-500">Clínica Vida Salud • Santa Cruz, Bolivia</p>
                <div className="mt-2 inline-block px-3 py-1 bg-[#00687a]/10 border border-[#00687a]/20 rounded-lg">
                  <span className="font-mono font-extrabold text-sm text-[#00687a]">
                    {ticketModalAppointment.codigo_cita}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {ticketModalAppointment.paciente?.nombres} {ticketModalAppointment.paciente?.apellidos}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Documento CI:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {ticketModalAppointment.paciente?.numero_documento || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Médico Tratante:</span>
                  <span className="font-bold text-slate-800 text-right">
                    Dr. {ticketModalAppointment.medico?.nombres} {ticketModalAppointment.medico?.apellidos}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Especialidad:</span>
                  <span className="font-semibold text-[#00687a]">
                    {ticketModalAppointment.especialidad?.nombre || 'Medicina General'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-bold text-slate-900">
                    {formatDateDisplay(ticketModalAppointment.fecha_hora_inicio)} • {formatTimeDisplay(ticketModalAppointment.fecha_hora_inicio)} - {formatTimeDisplay(ticketModalAppointment.fecha_hora_fin)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Modalidad:</span>
                  <span className="font-semibold text-slate-700">
                    {ticketModalAppointment.modalidad}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Estado:</span>
                  <div>{getStatusBadge(ticketModalAppointment.estado)}</div>
                </div>
                {ticketModalAppointment.motivo_consulta && (
                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">Motivo de Consulta:</span>
                    <p className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700 italic">
                      "{ticketModalAppointment.motivo_consulta}"
                    </p>
                  </div>
                )}
              </div>

              {/* Botón de Impresión */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-[#00687a] to-[#008b9e] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 hover:brightness-105 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketModalAppointment(null)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

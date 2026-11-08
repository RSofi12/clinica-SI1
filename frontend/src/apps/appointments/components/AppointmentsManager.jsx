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
  CalendarClock,
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
  Ban,
  History,
  UserCheck,
  UserX,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../../clinical-resources/services/doctorService';
import { AppointmentAvailabilityViewer } from './AppointmentAvailabilityViewer';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { DoctorAgendaView } from './DoctorAgendaView';
import { AppointmentCancelModal } from './AppointmentCancelModal';
import { AppointmentRescheduleModal } from './AppointmentRescheduleModal';
import { PatientAppointmentHistoryModal } from './PatientAppointmentHistoryModal';
import { AppointmentStatusModal } from './AppointmentStatusModal';
import { patientProfileService } from '../../clinical-resources/services/patientProfileService';
import StripePaymentModal from '../../payments/components/StripePaymentModal';

/**
 * Gestor Integral de Citas Médicas y Agenda (CU09, CU10, CU12, CU14, CU15 / RF05-RF12)
 * Paquete 3: Gestión de Citas Médicas
 */
export function AppointmentsManager() {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState('citas'); // 'citas' | 'disponibilidad'
  const [myPatientProfile, setMyPatientProfile] = useState(null);

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
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [statusModalAppointment, setStatusModalAppointment] = useState(null);
  const [statusModalAction, setStatusModalAction] = useState(null);
  const [payingAppointment, setPayingAppointment] = useState(null);
  const [paymentSuccessAlert, setPaymentSuccessAlert] = useState(null);

  // Auto-descartar alerta de pago tras 8 segundos
  useEffect(() => {
    if (!paymentSuccessAlert) return;
    const timer = setTimeout(() => {
      setPaymentSuccessAlert(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [paymentSuccessAlert]);

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

  // Cargar ficha propia si el usuario es PACIENTE (para CU15 y autocitas)
  useEffect(() => {
    if (role === 'PACIENTE') {
      patientProfileService
        .fetchMyProfile()
        .then((res) => {
          const p = res?.data || res?.patient;
          if (p) setMyPatientProfile(p);
        })
        .catch((err) => console.error('Error al cargar perfil de paciente en appointments:', err));
    }
  }, [role]);

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
      case 'PROGRAMADA':
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Programada
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200" title="Paciente presente en sala de espera (CU13)">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            En Espera
          </span>
        );
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
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
      case 'INASISTENCIA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            Inasistencia
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

  // Para el rol MEDICO, su módulo es exclusivamente su Agenda Médica Diaria (CU14) e Historial de Citas (CU15)
  if (role === 'MEDICO') {
    return (
      <div className="space-y-6">
        {/* Cabecera Exclusiva para Médico */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00687a] to-[#008b9e] text-white flex items-center justify-center shadow-md shadow-[#00687a]/20 shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif-clinical font-normal tracking-tight text-slate-900 tracking-tight">
                  Mi Agenda Médica Diaria (CU14)
                </h1>
                <span className="text-[11px] font-bold bg-[#00687a]/10 text-[#00687a] px-2 py-0.5 rounded-md uppercase tracking-wider">
                  CU14 / CU15
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte los pacientes citados para su jornada, franjas activas y acceda al historial clínico cronológico de citas del paciente (RF11, RF12).
              </p>
            </div>
          </div>
        </div>

        {/* Vista directa de la agenda médica diaria */}
        <DoctorAgendaView
          onOpenTicket={setTicketModalAppointment}
          onOpenPatientHistory={setSelectedPatientForHistory}
        />

        {/* Modal de Ticket de Cita */}
        {ticketModalAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-[#004d5a] to-[#00687a] p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Printer className="w-5 h-5 text-cyan-200" />
                  <h3 className="font-bold text-sm font-serif-clinical font-normal tracking-tight">Ticket de Cita Médica</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketModalAppointment(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="text-center pb-3 border-b border-dashed border-slate-200">
                  <span className="font-mono font-extrabold text-xl text-[#00687a] block">
                    {ticketModalAppointment.codigo_cita}
                  </span>
                  <span className="text-[11px] text-slate-400">Comprobante Oficial de Cita</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Paciente:</span>
                    <span className="font-bold text-slate-800">
                      {ticketModalAppointment.paciente?.nombres} {ticketModalAppointment.paciente?.apellidos}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Documento / CI:</span>
                    <span className="font-mono text-slate-700">
                      {ticketModalAppointment.paciente?.numero_documento || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Médico:</span>
                    <span className="font-semibold text-slate-800">
                      Dr(a). {ticketModalAppointment.medico?.nombres} {ticketModalAppointment.medico?.apellidos}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Especialidad:</span>
                    <span className="text-slate-700">{ticketModalAppointment.especialidad?.nombre}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Fecha y Hora:</span>
                    <span className="font-bold text-slate-900">
                      {formatDateDisplay(ticketModalAppointment.fecha_hora_inicio)} — {formatTimeDisplay(ticketModalAppointment.fecha_hora_inicio)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Estado:</span>
                    <div>{getStatusBadge(ticketModalAppointment.estado)}</div>
                  </div>
                </div>

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

        {/* Modal de Historial Cronológico de Citas del Paciente (CU15) */}
        <PatientAppointmentHistoryModal
          isOpen={Boolean(selectedPatientForHistory)}
          onClose={() => setSelectedPatientForHistory(null)}
          patientInitial={selectedPatientForHistory}
          onOpenTicket={setTicketModalAppointment}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-view-fade">
      {/* Cabecera Principal */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00687a] to-[#008b9e] text-white flex items-center justify-center shadow-md shadow-[#00687a]/20 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-serif-clinical font-normal tracking-tight text-slate-900 tracking-tight">
                {role === 'PACIENTE' ? 'Mis Citas Médicas y Agenda' : 'Gestión de Citas Médicas y Agenda'}
              </h1>
              <span className="text-[11px] font-bold bg-[#00687a]/10 text-[#00687a] px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                {role === 'PACIENTE' ? 'Portal Paciente' : 'CU09 / CU10 / CU12 / CU14 / CU15'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {role === 'PACIENTE'
                ? 'Consulta el estado de tus citas médicas, tickets de atención, turnos disponibles y tu historial de salud.'
                : 'Prevención anti-colisión transaccional (RF07), auditoría inmutable en bitácora, agenda diaria y consulta de turnos libres.'}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-start xl:justify-end shrink-0">
          {role === 'PACIENTE' && (
            <button
              type="button"
              onClick={() => {
                const targetPatient =
                  myPatientProfile ||
                  appointments[0]?.paciente ||
                  (appointments[0]?.id_paciente
                    ? { id_paciente: appointments[0].id_paciente, nombres: user?.username }
                    : null);
                if (targetPatient) {
                  setSelectedPatientForHistory(targetPatient);
                }
              }}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <History className="w-4 h-4" />
              <span>Mi Historial (CU15)</span>
            </button>
          )}

          {role !== 'MEDICO' && (
            <button
              type="button"
              onClick={() => {
                setBookingInitialData(null);
                setIsBookingModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md shadow-[#00687a]/20 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{role === 'PACIENTE' ? 'Reservar Mi Cita (CU10)' : 'Programar Cita (CU10)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta Destacada de Pago Realizado */}
      {paymentSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 shadow-xs flex items-center justify-between gap-3 text-emerald-900 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>¡Pago realizado con éxito!</span>
                {paymentSuccessAlert.codigo_pago && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 font-bold border border-emerald-300">
                    {paymentSuccessAlert.codigo_pago}
                  </span>
                )}
              </div>
              <p className="text-emerald-800 mt-0.5">
                La cita <strong>{paymentSuccessAlert.codigo_cita}</strong> fue pagada exitosamente por un monto de{' '}
                <strong>Bs. {Number(paymentSuccessAlert.monto || 0).toFixed(2)}</strong> vía Stripe Sandbox y su estado pasó a <strong>Confirmada</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessAlert(null)}
            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shrink-0"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pestañas de Navegación: Citas vs Disponibilidad vs Agenda Diaria */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
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
          <span>{role === 'PACIENTE' ? 'Mis Citas Médicas' : 'Citas Programadas (CU10)'}</span>
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
          <span>Consultar Disponibilidad (CU09)</span>
        </button>

        {role !== 'PACIENTE' && (
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
              activeTab === 'agenda'
                ? 'border-[#00687a] text-[#00687a]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Agenda Médica Diaria (CU14)</span>
          </button>
        )}
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'disponibilidad' && (
        <AppointmentAvailabilityViewer onSelectSlotForBooking={handleSelectSlotForBooking} />
      )}

      {activeTab === 'agenda' && role !== 'PACIENTE' && (
        <DoctorAgendaView onOpenTicket={setTicketModalAppointment} />
      )}

      {activeTab === 'citas' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Buscador textual */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  role === 'PACIENTE'
                    ? 'Buscar por código (CM-XXXX), fecha o médico...'
                    : 'Buscar por código (CM-XXXX), paciente, CI, o médico...'
                }
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
                <option value="INASISTENCIA">Inasistencias</option>
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
              <table className="w-full text-left text-xs min-w-[1080px]">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5 w-[160px] min-w-[160px]">Código / Fecha</th>
                    <th className="px-5 py-3.5 min-w-[260px]">Paciente</th>
                    <th className="px-5 py-3.5 min-w-[240px]">Médico / Especialidad</th>
                    <th className="px-5 py-3.5 w-[130px] min-w-[130px]">Tipo / Modalidad</th>
                    <th className="px-5 py-3.5 w-[120px] min-w-[120px]">Estado</th>
                    <th className="px-5 py-3.5 w-[210px] min-w-[210px] text-right">Acciones</th>
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
                        <tr key={cita.id_cita} className="hover:bg-slate-50/80 transition-colors duration-150">
                          {/* Código y Fecha */}
                          <td className="px-5 py-4 whitespace-nowrap align-middle">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-xs text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md border border-[#00687a]/20">
                                {cita.codigo_cita}
                              </span>
                              {cita.reprogramada_en && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md"
                                  title={`Reprogramada: ${cita.motivo_reprogramacion || 'Cambio de horario'}`}
                                >
                                  <CalendarClock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>Reprog.</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDateDisplay(cita.fecha_hora_inicio)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {horaInicioStr} - {horaFinStr}
                              </span>
                            </div>
                          </td>

                          {/* Paciente */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-[#00687a] font-bold text-xs shrink-0 mt-0.5">
                                {cita.paciente?.nombres ? cita.paciente.nombres[0] : 'P'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900 text-xs tracking-tight leading-snug">
                                  {cita.paciente?.nombres} {cita.paciente?.apellidos}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono">Doc: {cita.paciente?.numero_documento || '—'}</span>
                                  {cita.paciente?.numero_historia && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="font-mono font-semibold text-[#00687a]">
                                        HC: {cita.paciente?.numero_historia}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {cita.paciente && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPatientForHistory(cita.paciente)}
                                    className="mt-1 text-[11px] font-semibold text-[#00687a] hover:text-[#004d5a] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Ver historial cronológico de citas del paciente (CU15)"
                                  >
                                    <History className="w-3 h-3" />
                                    <span>Ver Historial</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Médico y Especialidad */}
                          <td className="px-5 py-4 align-middle">
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-[#00687a] shrink-0" />
                              <span>
                                Dr(a). {cita.medico?.nombres} {cita.medico?.apellidos}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md border border-[#00687a]/15">
                                <Building2 className="w-3 h-3 text-[#00687a] shrink-0" />
                                <span>{cita.especialidad?.nombre || 'Medicina General'}</span>
                              </span>
                            </div>
                          </td>

                          {/* Tipo / Modalidad */}
                          <td className="px-5 py-4 whitespace-nowrap align-middle">
                            <div className="text-slate-800 font-medium text-xs">
                              {cita.tipo_cita?.nombre || 'Consulta Médica'}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {cita.modalidad === 'TELECONSULTA' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                                  <Video className="w-2.5 h-2.5" />
                                  Teleconsulta
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md">
                                  Presencial
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="px-5 py-4 whitespace-nowrap align-middle">
                            <div className="flex flex-col gap-1 items-start">
                              {getStatusBadge(cita.estado)}
                              {cita.pagada ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Cita pagada y garantizada con Stripe (CU21)">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Pagada
                                </span>
                              ) : (
                                !['CANCELADA', 'ATENDIDA', 'INASISTENCIA'].includes(cita.estado) && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                    Pendiente pago
                                  </span>
                                )
                              )}
                            </div>
                          </td>

                          {/* Acciones (Apiladas en 2 filas compactas) */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap align-middle">
                            <div className="flex flex-col items-end gap-1.5">
                              {/* Fila 1: Operativa (Check-in / Inasistencia, Ticket, Historial) */}
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botón Check-in de Recepción (CU13 / RF10) */}
                                {role !== 'MEDICO' && ['PROGRAMADA', 'PENDIENTE'].includes(cita.estado) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStatusModalAppointment(cita);
                                      setStatusModalAction('CONFIRMADA');
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                    title="Registrar llegada del paciente / Check-in a sala de espera (CU13 / RF10)"
                                  >
                                    <UserCheck className="w-3 h-3 text-amber-600" />
                                    <span>Check-in</span>
                                  </button>
                                )}

                                {/* Botón Inasistencia si estaba en espera (CU13 / RF10) */}
                                {role !== 'MEDICO' && cita.estado === 'CONFIRMADA' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStatusModalAppointment(cita);
                                      setStatusModalAction('INASISTENCIA');
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                    title="Registrar inasistencia o abandono de sala de espera (CU13 / RF10)"
                                  >
                                    <UserX className="w-3 h-3 text-rose-600" />
                                    <span>Inasistencia</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setTicketModalAppointment(cita)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                  title="Ver ficha / ticket de la cita"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Ticket</span>
                                </button>

                                {/* Ver Trazabilidad / Historial de Estados (CU13) */}
                                {role !== 'PACIENTE' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStatusModalAppointment(cita);
                                      setStatusModalAction('HISTORIAL');
                                    }}
                                    className="p-1 text-slate-400 hover:text-[#00687a] hover:bg-[#00687a]/10 border border-transparent hover:border-[#00687a]/20 rounded-lg transition cursor-pointer active:scale-95"
                                    title="Consultar trazabilidad de máquina de estados de la cita (CU13 / RF10)"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Fila 2: Modificaciones de Agenda (Reprogramar, Cancelar) */}
                              {(['PROGRAMADA', 'PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {!cita.pagada && (
                                    <button
                                      type="button"
                                      onClick={() => setPayingAppointment(cita)}
                                      className="px-2 py-0.5 text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                      title="Pagar cita médica con tarjeta vía Stripe Sandbox (CU21)"
                                    >
                                      <CreditCard className="w-3 h-3 text-emerald-600" />
                                      <span>Pagar</span>
                                    </button>
                                  )}

                                  {role !== 'MEDICO' && (
                                    <button
                                      type="button"
                                      onClick={() => setReschedulingAppointment(cita)}
                                      className="px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                      title="Reprogramar cita médica a otra fecha u horario (CU11 / RF08)"
                                    >
                                      <CalendarClock className="w-3 h-3" />
                                      <span>Reprogramar</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setCancellingAppointment(cita)}
                                    className="px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                    title="Cancelar cita médica (libera cupo horario - CU12)"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span>Cancelar</span>
                                  </button>
                                </div>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-modal-panel">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#004d5a] to-[#00687a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-200" />
                <h3 className="font-bold text-sm font-serif-clinical font-normal tracking-tight">Ticket de Cita Médica</h3>
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
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Estado de Pago:</span>
                  <div>
                    {ticketModalAppointment.pagada ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        PAGADA (Garantizada con Stripe)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        PENDIENTE DE PAGO
                      </span>
                    )}
                  </div>
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

      {/* Modal de Reprogramación de Cita con Validación Anti-Colisión (CU11 / RF08) */}
      <AppointmentRescheduleModal
        isOpen={Boolean(reschedulingAppointment)}
        onClose={() => setReschedulingAppointment(null)}
        appointment={reschedulingAppointment}
        onAppointmentRescheduled={() => {
          setReschedulingAppointment(null);
          loadAppointments(pagination.current_page);
        }}
      />

      {/* Modal de Cancelación de Cita con Motivo Obligatorio (CU12) */}
      <AppointmentCancelModal
        isOpen={Boolean(cancellingAppointment)}
        onClose={() => setCancellingAppointment(null)}
        appointment={cancellingAppointment}
        onAppointmentCancelled={() => {
          setCancellingAppointment(null);
          loadAppointments(pagination.current_page);
        }}
      />

      {/* Modal de Historial Cronológico de Citas del Paciente (CU15) */}
      <PatientAppointmentHistoryModal
        isOpen={Boolean(selectedPatientForHistory)}
        onClose={() => setSelectedPatientForHistory(null)}
        patientInitial={selectedPatientForHistory}
        onOpenTicket={setTicketModalAppointment}
      />

      {/* Modal de Registro de Asistencia y Máquina de Estados (CU13 / RF10) */}
      <AppointmentStatusModal
        isOpen={Boolean(statusModalAppointment)}
        onClose={() => {
          setStatusModalAppointment(null);
          setStatusModalAction(null);
        }}
        appointment={statusModalAppointment}
        initialAction={statusModalAction}
        currentRole={role}
        onStatusUpdated={() => {
          setStatusModalAppointment(null);
          setStatusModalAction(null);
          loadAppointments(pagination.current_page);
        }}
      />

      {/* Modal de Pago con Pasarela Stripe Sandbox (CU21) */}
      <StripePaymentModal
        isOpen={Boolean(payingAppointment)}
        cita={payingAppointment}
        onClose={() => {
          setPayingAppointment(null);
          loadAppointments(pagination.current_page);
        }}
        onSuccess={(pagoData) => {
          // Refrescar la lista de citas en segundo plano
          loadAppointments(pagination.current_page);
          setPaymentSuccessAlert({
            codigo_cita: payingAppointment?.codigo_cita,
            monto: pagoData?.monto || payingAppointment?.especialidad?.precio_consulta,
            codigo_pago: pagoData?.codigo_pago,
          });
        }}
      />
    </div>
  );
}

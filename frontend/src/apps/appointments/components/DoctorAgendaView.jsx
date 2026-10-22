import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
  Ban,
  Search,
  Filter,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../../clinical-resources/services/doctorService';
import { AppointmentCancelModal } from './AppointmentCancelModal';

const DIAS_SEMANA_MAP = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

/**
 * Vista de Agenda Médica Diaria por Médico y Fecha (CU14 / RF11 / Prueba #8)
 * Paquete 3: Gestión de Citas Médicas
 */
export function DoctorAgendaView({ onOpenTicket = null }) {
  const { role, user } = useAuth();

  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [filterStatus, setFilterStatus] = useState('TODOS');

  // Estados de carga y datos
  const [agendaData, setAgendaData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de cancelación (CU12)
  const [cancellingAppointment, setCancellingAppointment] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Cargar lista de médicos si no es rol MEDICO
  useEffect(() => {
    if (role === 'MEDICO') return;
    async function loadDoctors() {
      try {
        const res = await doctorService.fetchDoctors({ per_page: 100, estado: 'activo' });
        if (res?.data && res.data.length > 0) {
          setDoctorsList(res.data);
          if (!selectedDoctorId) {
            setSelectedDoctorId(String(res.data[0].id_medico));
          }
        }
      } catch (err) {
        console.error('Error cargando médicos para agenda:', err);
      }
    }
    loadDoctors();
  }, [role, selectedDoctorId]);

  // 2. Cargar agenda diaria
  const loadAgenda = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await appointmentService.fetchDoctorAgenda({
        medico_id: role === 'MEDICO' ? undefined : (selectedDoctorId || undefined),
        fecha: selectedDate,
        estado: filterStatus !== 'TODOS' ? filterStatus : undefined,
      });

      if (res?.success && res.data) {
        setAgendaData(res.data);
      } else {
        setErrorMsg(res?.message || 'Error al obtener la agenda médica.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [role, selectedDoctorId, selectedDate, filterStatus]);

  useEffect(() => {
    loadAgenda();
  }, [loadAgenda]);

  // Navegación de fechas
  const changeDateByDays = (days) => {
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

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

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Programada
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Confirmada
          </span>
        );
      case 'ATENDIDA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <BadgeCheck className="w-3 h-3 text-cyan-600" />
            Atendida
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3 h-3 text-rose-500" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {estado}
          </span>
        );
    }
  };

  const stats = agendaData?.stats || {
    total: 0,
    programadas: 0,
    confirmadas: 0,
    atendidas: 0,
    canceladas: 0,
  };

  const medico = agendaData?.medico;
  const citas = agendaData?.citas || [];
  const disponibilidades = agendaData?.disponibilidades || [];

  return (
    <div className="space-y-5">
      {/* Barra Superior: Selector de Médico, Fecha y Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Selector de Médico (si no es médico) */}
        {role !== 'MEDICO' && doctorsList.length > 0 ? (
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#00687a]" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white text-slate-800 cursor-pointer"
            >
              {doctorsList.map((doc) => (
                <option key={doc.id_medico} value={doc.id_medico}>
                  Dr. {doc.apellidos} {doc.nombres} ({doc.especialidad_principal?.nombre || 'General'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-[#00687a]/10 rounded-xl text-[#00687a]">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Agenda Médica Personal
              </span>
              <span className="font-bold text-sm text-slate-900">
                Dr. {medico ? `${medico.apellidos} ${medico.nombres}` : user?.username}
              </span>
            </div>
          </div>
        )}

        {/* Selector de Fecha con botones de día anterior / siguiente */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeDateByDays(-1)}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
            title="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-[#00687a]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => changeDateByDays(1)}
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
            title="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Atajo "Hoy" */}
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-[#00687a] text-white border-[#00687a]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Hoy
          </button>
        </div>

        {/* Filtro por Estado y Recargar */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] text-slate-700 cursor-pointer"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Programadas</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="ATENDIDA">Atendidas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>

          <button
            type="button"
            onClick={loadAgenda}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Recargar agenda"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00687a]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjeta Informativa del Médico y Franja Horaria del Día */}
      {medico && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                {formatDateDisplay(selectedDate)}
              </span>
              <h2 className="text-lg font-bold font-montserrat tracking-tight text-white">
                Dr. {medico.nombres} {medico.apellidos}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span>Matrícula: {medico.codigo_profesional}</span>
                <span>•</span>
                <span className="text-cyan-200 font-semibold">
                  {medico.especialidad_principal?.nombre || 'Medicina General'}
                </span>
              </div>
            </div>
          </div>

          {/* Horario de Atención Configurado para este Día */}
          <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 backdrop-blur-xs text-xs">
            <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider block">
              Horario de Consulta ({DIAS_SEMANA_MAP[agendaData?.dia_semana] || 'Día'}):
            </span>
            {disponibilidades.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {disponibilidades.map((d) => (
                  <span
                    key={d.id_disponibilidad}
                    className="font-mono font-bold text-white bg-cyan-900/60 border border-cyan-400/30 px-2 py-0.5 rounded-md"
                  >
                    {d.hora_inicio} a {d.hora_fin} ({d.duracion_cita_minutos} min)
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-amber-300 text-xs font-medium mt-1 inline-block">
                No tiene franja semanal asignada para este día
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4 KPIs de la Jornada */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Citas Programadas
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{stats.total}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs bg-amber-50/20">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Por Atender
          </span>
          <span className="text-xl font-extrabold text-amber-800 mt-0.5 block">
            {stats.programadas + stats.confirmadas}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-cyan-200/80 shadow-xs bg-cyan-50/20">
          <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
            Atendidas
          </span>
          <span className="text-xl font-extrabold text-[#00687a] mt-0.5 block">{stats.atendidas}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200/80 shadow-xs bg-rose-50/20">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Canceladas
          </span>
          <span className="text-xl font-extrabold text-rose-700 mt-0.5 block">{stats.canceladas}</span>
        </div>
      </div>

      {/* Timeline y Listado de Citas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00687a]" />
            <h3 className="font-bold text-slate-900 text-sm font-montserrat">
              Cronograma de Citas de la Jornada
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {citas.length} {citas.length === 1 ? 'cita' : 'citas'} registradas
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin" />
            <span className="text-xs">Cargando agenda médica...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <span>{errorMsg}</span>
          </div>
        ) : citas.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
            <Calendar className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-700 text-sm">Sin citas para esta fecha</p>
            <p className="text-xs text-slate-500">
              No hay citas programadas para el Dr. {medico?.apellidos} el día{' '}
              {formatDateDisplay(selectedDate)}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {citas.map((cita) => {
              const horaInicio = formatTimeDisplay(cita.fecha_hora_inicio);
              const horaFin = formatTimeDisplay(cita.fecha_hora_fin);
              const puedeCancelar = ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado);

              return (
                <div
                  key={cita.id_cita}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    cita.estado === 'CANCELADA' ? 'bg-slate-50/80 opacity-75' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Horario y Código */}
                  <div className="flex items-center gap-3 sm:w-48 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex flex-col items-center justify-center font-mono font-bold text-xs shrink-0">
                      <Clock className="w-3.5 h-3.5 text-[#00687a] mb-0.5" />
                      <span>{horaInicio}</span>
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-md border border-[#00687a]/20 block w-fit">
                        {cita.codigo_cita}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        Hasta {horaFin} ({cita.duracion_minutos || 30} min)
                      </span>
                    </div>
                  </div>

                  {/* Datos del Paciente y Especialidad */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-900 text-sm">
                        {cita.paciente?.nombres} {cita.paciente?.apellidos}
                      </span>
                      {cita.paciente?.numero_documento && (
                        <span className="text-slate-500 font-mono text-xs">
                          • CI: {cita.paciente.numero_documento}
                        </span>
                      )}
                      {cita.paciente?.numero_historia && (
                        <span className="text-[10px] font-mono text-[#00687a] bg-[#00687a]/10 px-1.5 py-0.2 rounded-md">
                          HC: {cita.paciente.numero_historia}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{cita.tipo_cita?.nombre || 'Consulta Médica'}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-medium">
                        {cita.especialidad?.nombre || 'Medicina General'}
                      </span>
                      <span>•</span>
                      {cita.modalidad === 'TELECONSULTA' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                          <Video className="w-2.5 h-2.5" />
                          Teleconsulta
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          Presencial
                        </span>
                      )}
                    </div>

                    {/* Motivo de Consulta */}
                    {cita.motivo_consulta && (
                      <p className="text-[11px] text-slate-600 italic bg-slate-100/60 px-2.5 py-1 rounded-lg w-fit mt-1">
                        "{cita.motivo_consulta}"
                      </p>
                    )}

                    {/* Motivo de Cancelación (si aplica) */}
                    {cita.estado === 'CANCELADA' && cita.motivo_cancelacion && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg w-fit mt-1 flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>
                          <strong>Motivo cancelación:</strong> {cita.motivo_cancelacion}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Estado y Acciones */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <div>{getStatusBadge(cita.estado)}</div>

                    {/* Ver Ticket */}
                    {onOpenTicket && (
                      <button
                        type="button"
                        onClick={() => onOpenTicket(cita)}
                        className="p-1.5 text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-lg transition cursor-pointer"
                        title="Ver / Imprimir Ticket de Cita"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Cancelar Cita (CU12) */}
                    {puedeCancelar && (
                      <button
                        type="button"
                        onClick={() => setCancellingAppointment(cita)}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Cancelar cita médica (libera cupo)"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Cancelación (CU12) */}
      <AppointmentCancelModal
        isOpen={Boolean(cancellingAppointment)}
        onClose={() => setCancellingAppointment(null)}
        appointment={cancellingAppointment}
        onAppointmentCancelled={() => {
          setCancellingAppointment(null);
          loadAgenda();
        }}
      />
    </div>
  );
}

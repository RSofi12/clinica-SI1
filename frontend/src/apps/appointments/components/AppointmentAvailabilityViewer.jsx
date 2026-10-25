import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Stethoscope,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  User,
  ShieldAlert,
  ChevronRight,
  CalendarCheck,
  CalendarX,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../../clinical-resources/services/doctorService';
import { specialtyService } from '../../clinical-resources/services/specialtyService';

/**
 * Visor Interactivo de Disponibilidad de Horarios de Consulta (CU09 / RF05, RF06)
 * Paquete 3: Gestión de Citas Médicas
 */
export function AppointmentAvailabilityViewer({ onSelectSlotForBooking = null }) {
  const { role } = useAuth();
  const canBook = role !== 'MEDICO';

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [availability, setAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Cargar catálogo de especialidades y médicos iniciales
  useEffect(() => {
    let isMounted = true;
    async function loadCatalogs() {
      setIsLoadingCatalogs(true);
      try {
        const [espRes, docRes] = await Promise.all([
          specialtyService.fetchSpecialties({ estado: 'ACTIVO' }),
          doctorService.fetchDoctors({ per_page: 100, estado: 'activo' }),
        ]);

        if (isMounted) {
          if (espRes?.data) setSpecialties(espRes.data);
          if (docRes?.data) {
            setDoctors(docRes.data);
            if (docRes.data.length > 0) {
              setSelectedDoctorId(String(docRes.data[0].id_medico));
            }
          }
        }
      } catch (err) {
        if (isMounted) setErrorMsg('Error al cargar médicos y especialidades.');
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    }
    loadCatalogs();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Filtrar médicos cuando cambia la especialidad seleccionada
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedSpecialtyId) return true;
    return (doc.specialties || []).some(
      (esp) => String(esp.id_especialidad) === String(selectedSpecialtyId)
    );
  });

  // Ajustar el médico seleccionado si queda fuera del filtro
  useEffect(() => {
    if (selectedSpecialtyId && filteredDoctors.length > 0) {
      const stillValid = filteredDoctors.some(
        (doc) => String(doc.id_medico) === String(selectedDoctorId)
      );
      if (!stillValid) {
        setSelectedDoctorId(String(filteredDoctors[0].id_medico));
      }
    }
  }, [selectedSpecialtyId, filteredDoctors, selectedDoctorId]);

  // 3. Consultar disponibilidad con el servicio de cálculo
  const loadAvailability = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate) return;
    setIsLoadingAvailability(true);
    setErrorMsg('');
    setSelectedSlot(null);

    try {
      const res = await appointmentService.fetchAvailability({
        medico_id: selectedDoctorId,
        fecha: selectedDate,
        especialidad_id: selectedSpecialtyId || undefined,
      });

      if (res?.data) {
        setAvailability(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al consultar disponibilidad.');
      setAvailability(null);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [selectedDoctorId, selectedDate, selectedSpecialtyId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Atajos rápidos de fecha
  const setQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-[#004d5a] to-[#00687a] rounded-2xl text-cyan-200 shadow-md">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-montserrat font-bold text-xl text-slate-900">
                  Consulta de Disponibilidad de Horarios
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#00687a]">
                  CU09 / RF05, RF06
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo en tiempo real de turnos libres descartando citas reservadas, feriados institucionales y licencias
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAvailability}
            disabled={isLoadingAvailability}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
            title="Actualizar disponibilidad"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAvailability ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Especialidad, Médico y Fecha */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Especialidad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Filtrar Especialidad (Opcional)
            </label>
            <select
              value={selectedSpecialtyId}
              onChange={(e) => setSelectedSpecialtyId(e.target.value)}
              disabled={isLoadingCatalogs}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((esp) => (
                <option key={esp.id_especialidad} value={esp.id_especialidad}>
                  {esp.nombre} {esp.precio_consulta > 0 ? `(Bs. ${esp.precio_consulta})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Médico */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Médico Profesional <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={isLoadingCatalogs || filteredDoctors.length === 0}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
            >
              {filteredDoctors.length === 0 ? (
                <option value="">No hay médicos para la especialidad</option>
              ) : (
                filteredDoctors.map((doc) => (
                  <option key={doc.id_medico} value={doc.id_medico}>
                    {doc.nombre_completo || `Dr(a). ${doc.nombres} ${doc.apellidos}`} — {doc.codigo_profesional}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 3. Selector de Fecha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. Fecha de Consulta <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
            />
          </div>
        </div>

        {/* Atajos Rápidos de Fecha */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Fecha rápida:
          </span>
          <button
            type="button"
            onClick={() => setQuickDate(0)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
              selectedDate === todayStr
                ? 'bg-[#00687a] text-white border-[#00687a]'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(1)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition"
          >
            Mañana
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(2)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition"
          >
            En 2 días
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(7)}
            className="text-xs px-2.5 py-1 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition"
          >
            Próxima semana
          </button>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Contenido Principal de Disponibilidad */}
      {isLoadingAvailability ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
          <div className="w-8 h-8 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">
            Calculando turnos libres y verificando colisiones...
          </p>
        </div>
      ) : availability ? (
        <div className="space-y-6">
          {/* Tarjeta de Resumen / KPIs */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-[#00687a] uppercase tracking-wider">
                  Profesional Evaluado
                </span>
                <h2 className="font-montserrat font-bold text-lg text-slate-900 mt-0.5">
                  {availability.medico?.nombre_completo || 'Médico'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>Matrícula: <strong className="text-slate-700">{availability.medico?.codigo_profesional}</strong></span>
                  <span>•</span>
                  <span>Especialidad: <strong className="text-slate-700">{availability.medico?.especialidad_principal?.nombre || 'General'}</strong></span>
                </div>
              </div>

              <div className="bg-cyan-50/60 border border-cyan-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#00687a]" />
                <div>
                  <span className="text-[11px] text-slate-500 block">Fecha consultada:</span>
                  <span className="text-xs font-bold text-[#00687a]">
                    {availability.dia_nombre}, {availability.fecha}
                  </span>
                </div>
              </div>
            </div>

            {/* Contador de Turnos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Turnos</span>
                <span className="text-lg font-bold text-slate-800">
                  {availability.resumen?.total_slots || 0}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 block">Disponibles</span>
                <span className="text-lg font-bold text-emerald-700">
                  {availability.resumen?.disponibles || 0}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-[11px] font-semibold text-amber-700 block">Citas Reservadas</span>
                <span className="text-lg font-bold text-amber-700">
                  {availability.resumen?.ocupados || 0}
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-[11px] font-semibold text-rose-700 block">Bloqueados / Pasados</span>
                <span className="text-lg font-bold text-rose-700">
                  {availability.resumen?.bloqueados || 0}
                </span>
              </div>
            </div>
          </div>

          {/* CASO A: Día bloqueado por feriado o licencia completa (Prueba P9.3) */}
          {availability.bloqueado_todo_el_dia && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-base text-rose-900 mb-1">
                Fecha no disponible para atención clínica
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                {availability.motivo_bloqueo}
              </p>
              <p className="text-[11px] text-rose-500 mt-3 font-medium">
                Seleccione otra fecha en el calendario superior para consultar disponibilidad de citas.
              </p>
            </div>
          )}

          {/* CASO B: Día no laborable para el médico (RN05) */}
          {!availability.bloqueado_todo_el_dia && !availability.es_laborable && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <CalendarX className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-base text-amber-900 mb-1">
                El médico no atiende en el día seleccionado
              </h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
                {availability.motivo_bloqueo}
              </p>
              <p className="text-[11px] text-amber-600 mt-3 font-medium">
                Puede consultar los días en que el médico tiene franjas activas en la sección &quot;Horarios y Disponibilidad&quot;.
              </p>
            </div>
          )}

          {/* CASO C: Grilla de Turnos Generados (Prueba P9.1) */}
          {availability.es_laborable && !availability.bloqueado_todo_el_dia && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-montserrat font-bold text-base text-slate-900">
                    Turnos de Consulta para el {availability.dia_nombre} {availability.fecha}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haga clic sobre un turno libre para seleccionarlo
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {availability.resumen?.disponibles} cupos libres
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availability.slots?.map((slot, idx) => {
                  const isSelected =
                    selectedSlot?.hora_inicio === slot.hora_inicio &&
                    selectedSlot?.hora_fin === slot.hora_fin;

                  if (slot.disponible) {
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102 ring-2 ring-emerald-300'
                            : 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 text-emerald-900 hover:shadow-xs'
                        }`}
                      >
                        <Clock className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                        <span className="font-bold text-xs tracking-wide">
                          {slot.hora_inicio} - {slot.hora_fin}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-200/60 text-emerald-800'
                          }`}
                        >
                          {isSelected ? 'Seleccionado' : 'Disponible'}
                        </span>
                      </button>
                    );
                  }

                  if (slot.estado === 'OCUPADO') {
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border bg-amber-50/50 border-amber-200/80 text-amber-900 text-center flex flex-col items-center justify-between gap-1.5 opacity-80"
                        title={slot.motivo}
                      >
                        <User className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-xs tracking-wide text-slate-700 line-through">
                          {slot.hora_inicio} - {slot.hora_fin}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          {slot.motivo}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border bg-slate-100/70 border-slate-200 text-slate-500 text-center flex flex-col items-center justify-between gap-1.5 opacity-60"
                      title={slot.motivo}
                    >
                      <XCircle className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-xs tracking-wide">
                        {slot.hora_inicio} - {slot.hora_fin}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-full">
                        {slot.motivo || 'No disponible'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Panel de Turno Seleccionado (Precursor de CU10) */}
              {selectedSlot && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Turno Seleccionado
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {availability.dia_nombre} {availability.fecha} • {selectedSlot.hora_inicio} a {selectedSlot.hora_fin} ({selectedSlot.duracion_minutos} min)
                      </span>
                    </div>
                  </div>

                  {onSelectSlotForBooking && canBook ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectSlotForBooking({
                          medico: availability.medico,
                          fecha: availability.fecha,
                          slot: selectedSlot,
                        })
                      }
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Programar Cita (CU10)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[#00687a] bg-white/80 border border-[#00687a]/30 px-3 py-1.5 rounded-xl">
                      ✓ Turno libre verificado (Reserva gestionada por Recepción o Paciente)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

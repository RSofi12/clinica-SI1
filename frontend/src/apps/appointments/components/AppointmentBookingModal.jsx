import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  Building2,
  Tag,
  FileText,
  Video,
  Printer,
  BadgeCheck,
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../../clinical-resources/services/patientService';
import { patientProfileService } from '../../clinical-resources/services/patientProfileService';
import { useAuth } from '../../../context/AuthContext';

/**
 * Modal Asistido para Programar Cita Médica con Prevención Anti-Colisión Transaccional (CU10 / RF06, RF07)
 * Paquete 3: Gestión de Citas Médicas
 */
export function AppointmentBookingModal({
  isOpen,
  onClose,
  onAppointmentBooked,
  initialData = null,
}) {
  const { role, user } = useAuth();
  const isPaciente = role === 'PACIENTE';
  const [step, setStep] = useState(1); // 1: Paciente, 2: Especialidad/Médico, 3: Horario, 4: Confirmación, 5: Éxito (Ticket)

  // Catálogos
  const [formDataCatalogs, setFormDataCatalogs] = useState({
    tipos_cita: [],
    especialidades: [],
    medicos: [],
  });
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);

  // Búsqueda de Paciente
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Datos del Formulario de Reserva
  const [selectedTipoCitaId, setSelectedTipoCitaId] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalidad, setModalidad] = useState('PRESENCIAL');
  const [motivoConsulta, setMotivoConsulta] = useState('');

  // Disponibilidad de Slots (Llamada al motor de CU09)
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilitySummary, setAvailabilitySummary] = useState(null);

  // Estados de Envío y Errores
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Cargar Catálogos del Backend
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadData() {
      setIsLoadingCatalogs(true);
      try {
        const res = await appointmentService.fetchBookingFormData();
        if (isMounted && res?.data) {
          setFormDataCatalogs(res.data);

          // Si hay tipo de cita, pre-seleccionar el primero ('PRIMERA CONSULTA')
          if (res.data.tipos_cita?.length > 0 && !selectedTipoCitaId) {
            setSelectedTipoCitaId(String(res.data.tipos_cita[0].id_tipo_cita));
          }
        }
      } catch (err) {
        console.error('Error cargando catálogos de reserva:', err);
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedTipoCitaId]);

  // Si se proveen datos iniciales (desde el visor CU09)
  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.medico) {
        setSelectedDoctorId(String(initialData.medico.id_medico));
        if (initialData.medico.especialidad_principal) {
          setSelectedSpecialtyId(String(initialData.medico.especialidad_principal.id_especialidad));
        }
      }
      if (initialData.fecha) {
        setSelectedDate(initialData.fecha);
      }
      if (initialData.slot) {
        setSelectedSlot(initialData.slot);
      }
      setStep(1);
    }
  }, [initialData, isOpen]);

  // Auto-vincular y asegurar la identidad del paciente en modo autoservicio (Rol PACIENTE)
  useEffect(() => {
    if (!isOpen) return;
    if (isPaciente) {
      async function loadPatientSelf() {
        try {
          const res = await patientProfileService.fetchMyProfile();
          const p = res?.data || res?.patient;
          if (p) {
            setSelectedPatient(p);
          }
        } catch (err) {
          console.error('Error al cargar perfil de paciente en modal:', err);
        }
      }
      loadPatientSelf();
    }
  }, [isOpen, isPaciente]);

  // 2. Búsqueda en vivo de pacientes
  const handleSearchPatient = async (term) => {
    setPatientSearchTerm(term);
    if (!term || term.trim().length < 2) {
      setPatientResults([]);
      return;
    }

    setIsSearchingPatient(true);
    try {
      const res = await patientService.fetchPatients({ q: term.trim(), per_page: 5 });
      if (res?.data) {
        setPatientResults(res.data);
      }
    } catch (err) {
      console.error('Error buscando pacientes:', err);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // 3. Médicos filtrados por la especialidad seleccionada
  const doctorsForSpecialty = formDataCatalogs.medicos.filter((m) => {
    if (!selectedSpecialtyId) return true;
    return (m.specialties || []).some(
      (esp) => String(esp.id_especialidad) === String(selectedSpecialtyId)
    );
  });

  // Especialidad seleccionada y validación etaria (RF04 / Prueba P10.4)
  const currentSpecialty = formDataCatalogs.especialidades.find(
    (e) => String(e.id_especialidad) === String(selectedSpecialtyId)
  );

  const pacienteEdad = selectedPatient?.edad ?? 0;
  const esEdadApta = currentSpecialty
    ? (currentSpecialty.edad_min_anios === null || pacienteEdad >= currentSpecialty.edad_min_anios) &&
      (currentSpecialty.edad_max_anios === null || pacienteEdad <= currentSpecialty.edad_max_anios)
    : true;

  // 4. Cargar disponibilidad de turnos en el Paso 3
  const loadSlots = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate) return;
    setIsLoadingSlots(true);
    setErrorMsg('');
    try {
      const res = await appointmentService.fetchAvailability({
        medico_id: selectedDoctorId,
        fecha: selectedDate,
        especialidad_id: selectedSpecialtyId || undefined,
      });

      if (res?.data) {
        setAvailabilitySummary(res.data);
        setAvailabilitySlots(res.data.slots || []);

        // Si el slot previamente seleccionado ya no está disponible, desmarcarlo
        if (selectedSlot) {
          const match = (res.data.slots || []).find(
            (s) => s.hora_inicio === selectedSlot.hora_inicio && s.disponible
          );
          if (!match) setSelectedSlot(null);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener turnos disponibles.');
      setAvailabilitySlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDoctorId, selectedDate, selectedSpecialtyId, selectedSlot]);

  useEffect(() => {
    if (step === 3 && selectedDoctorId && selectedDate) {
      loadSlots();
    }
  }, [step, selectedDoctorId, selectedDate, loadSlots]);

  // Enviar Reserva Transaccional (CU10 / RF06, RF07)
  const handleConfirmBooking = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        id_paciente: selectedPatient.id_paciente,
        id_medico: parseInt(selectedDoctorId, 10),
        id_especialidad: parseInt(selectedSpecialtyId, 10),
        id_tipo_cita: parseInt(selectedTipoCitaId, 10),
        fecha: selectedDate,
        hora_inicio: selectedSlot.hora_inicio,
        duracion_minutos: selectedSlot.duracion_minutos || 30,
        modalidad: modalidad,
        motivo_consulta: motivoConsulta.trim() || null,
      };

      const res = await appointmentService.bookAppointment(payload);
      if (res?.data) {
        setCreatedAppointment(res.data);
        setStep(5); // Pantalla de éxito con ticket
        onAppointmentBooked?.(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al programar la cita médica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004d5a] to-[#00687a] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base leading-tight">
                Programar Cita Médica
              </h3>
              <p className="text-xs text-cyan-100/80">
                CU10 / RF06, RF07 — Reserva Transaccional con Prevención Anti-Colisión
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progreso de Pasos (1 a 4) */}
        {step < 5 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#00687a] font-bold' : step > 1 ? 'text-emerald-700' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-[#00687a] text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>1</span>
              <span>Paciente</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#00687a] font-bold' : step > 2 ? 'text-emerald-700' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-[#00687a] text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>2</span>
              <span>Especialidad / Dr.</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#00687a] font-bold' : step > 3 ? 'text-emerald-700' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-[#00687a] text-white' : step > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
              <span>Horario Libre</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-[#00687a] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 4 ? 'bg-[#00687a] text-white' : 'bg-slate-200'}`}>4</span>
              <span>Confirmar</span>
            </div>
          </div>
        )}

        {/* Mensaje de Error en el Paso */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* CONTENIDO SEGÚN PASO */}
        <div className="p-6">
          {/* ========================================================================= */}
          {/* PASO 1: Selección de Paciente y Tipo de Cita */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Buscador de Paciente para Recepción/Admin O Ficha fija para Paciente */}
              {isPaciente ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50/80 to-emerald-50/80 border border-cyan-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00687a] text-white flex items-center justify-center font-bold text-sm">
                      {selectedPatient?.nombres?.charAt(0) || 'P'}{selectedPatient?.apellidos?.charAt(0) || ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-montserrat font-bold text-slate-900 text-sm">
                          {selectedPatient ? `${selectedPatient.nombres} ${selectedPatient.apellidos}` : 'Cargando tus datos...'}
                        </span>
                        <span className="text-[10px] font-bold bg-[#00687a] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Tu Ficha Personal
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        CI: <strong>{selectedPatient?.numero_documento || '—'}</strong> • HC: <strong>{selectedPatient?.numero_historia || '—'}</strong> • Edad: <strong>{selectedPatient?.edad ?? '—'} años</strong> ({selectedPatient?.grupo_etario || 'General'})
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                    ✓ Identidad Verificada
                  </span>
                </div>
              ) : (
                <>
                  {/* Buscador de Paciente */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Buscar Paciente Clínico <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Escriba CI, N° Historia (HC-XXXX) o Nombre..."
                        value={patientSearchTerm}
                        onChange={(e) => handleSearchPatient(e.target.value)}
                        className="w-full text-xs py-2 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                      />
                      {isSearchingPatient && (
                        <div className="absolute right-3 top-2.5">
                          <div className="w-3.5 h-3.5 border-2 border-[#00687a]/40 border-t-[#00687a] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Lista de resultados desplegable */}
                    {patientResults.length > 0 && !selectedPatient && (
                      <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                        {patientResults.map((p) => (
                          <div
                            key={p.id_paciente}
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientResults([]);
                              setPatientSearchTerm(`${p.nombres} ${p.apellidos}`);
                            }}
                            className="p-2.5 hover:bg-cyan-50/60 cursor-pointer transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {p.nombres} {p.apellidos}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                CI: {p.numero_documento} • HC: {p.numero_historia} • {p.edad} años ({p.grupo_etario})
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#00687a]">Seleccionar →</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ficha del Paciente Seleccionado */}
                  {selectedPatient ? (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50/60 to-emerald-50/60 border border-cyan-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00687a] text-white flex items-center justify-center font-bold text-sm">
                          {selectedPatient.nombres?.charAt(0)}{selectedPatient.apellidos?.charAt(0)}
                        </div>
                        <div>
                          <span className="font-montserrat font-bold text-slate-900 text-sm block">
                            {selectedPatient.nombres} {selectedPatient.apellidos}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            CI: <strong>{selectedPatient.numero_documento}</strong> • HC: <strong>{selectedPatient.numero_historia}</strong> • Edad: <strong>{selectedPatient.edad} años</strong> ({selectedPatient.grupo_etario})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setPatientSearchTerm('');
                        }}
                        className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      Seleccione un paciente de la búsqueda para continuar con la reserva.
                    </div>
                  )}
                </>
              )}

              {/* Selector de Tipo de Cita */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Tipo de Cita Médica <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formDataCatalogs.tipos_cita.map((tc) => (
                    <button
                      key={tc.id_tipo_cita}
                      type="button"
                      onClick={() => setSelectedTipoCitaId(String(tc.id_tipo_cita))}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        String(selectedTipoCitaId) === String(tc.id_tipo_cita)
                          ? 'bg-cyan-50 border-[#00687a] text-[#00687a] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      <span>{tc.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: Selección de Especialidad y Médico con Verificación Etaria */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Resumen del Paciente para el que se reserva */}
              {selectedPatient && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00687a]" />
                    <span>Cita médica para: <strong>{selectedPatient.nombres} {selectedPatient.apellidos}</strong> (CI: {selectedPatient.numero_documento})</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{selectedPatient.edad} años • {selectedPatient.grupo_etario}</span>
                </div>
              )}
              {/* Selector de Especialidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Seleccionar Especialidad Médica <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSpecialtyId}
                  onChange={(e) => {
                    setSelectedSpecialtyId(e.target.value);
                    setSelectedDoctorId('');
                    setSelectedSlot(null);
                  }}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                >
                  <option value="">-- Seleccionar Especialidad --</option>
                  {formDataCatalogs.especialidades.map((esp) => (
                    <option key={esp.id_especialidad} value={esp.id_especialidad}>
                      {esp.nombre} {esp.precio_consulta > 0 ? `(Arancel: Bs. ${esp.precio_consulta})` : ''}
                    </option>
                  ))}
                </select>

                {/* Validación Etaria en Tiempo Real (RF04 / Prueba P10.4) */}
                {currentSpecialty && (
                  <div className="mt-2.5">
                    {esEdadApta ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Paciente Apto (RF04):</strong> La edad ({pacienteEdad} años) califica para {currentSpecialty.nombre}.
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong>Restricción Etaria (RF04 / P10.4):</strong> El paciente tiene {pacienteEdad} años y no cumple con el rango admitido para {currentSpecialty.nombre} ({currentSpecialty.edad_min_anios || 0} a {currentSpecialty.edad_max_anios || 'sin límite'} años).
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selector de Médico Profesional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Profesional Médico Acreditado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setSelectedSlot(null);
                  }}
                  disabled={!selectedSpecialtyId || !esEdadApta || doctorsForSpecialty.length === 0}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                >
                  <option value="">-- Seleccionar Médico del Plantel --</option>
                  {doctorsForSpecialty.map((m) => (
                    <option key={m.id_medico} value={m.id_medico}>
                      {m.nombre_completo || `Dr(a). ${m.nombres} ${m.apellidos}`} — {m.codigo_profesional}
                    </option>
                  ))}
                </select>

                {selectedSpecialtyId && doctorsForSpecialty.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No hay médicos activos asignados a esta especialidad actualmente.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: Selección de Fecha y Turno Libre (Motor CU09) */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Atención <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                  />
                </div>

                {availabilitySummary && (
                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500">
                    <span className="font-semibold">{availabilitySummary.dia_nombre}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {availabilitySummary.resumen?.disponibles || 0} libres
                    </span>
                  </div>
                )}
              </div>

              {/* Grilla de Turnos */}
              {isLoadingSlots ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#00687a]/40 border-t-[#00687a] rounded-full animate-spin mx-auto mb-2" />
                  <span>Consultando turnos libres con el servidor...</span>
                </div>
              ) : availabilitySummary?.bloqueado_todo_el_dia ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center text-xs text-rose-800">
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  <strong>Fecha Bloqueada:</strong> {availabilitySummary.motivo_bloqueo}
                </div>
              ) : !availabilitySummary?.es_laborable ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800">
                  <strong>Día No Laborable:</strong> {availabilitySummary?.motivo_bloqueo}
                </div>
              ) : availabilitySlots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No hay franjas de atención configuradas para esta fecha.
                </div>
              ) : (
                <div>
                  <span className="text-xs font-semibold text-slate-600 block mb-2">
                    Seleccione un horario disponible (Verde):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                    {availabilitySlots.map((slot, idx) => {
                      const isSelected = selectedSlot?.hora_inicio === slot.hora_inicio;

                      if (slot.disponible) {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2 rounded-xl border text-xs font-bold text-center transition flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                                : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-900'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                            <span>{slot.hora_inicio} - {slot.hora_fin}</span>
                            <span className="text-[10px] font-normal opacity-80">Libre</span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-xl border bg-slate-100/60 border-slate-200 text-slate-400 text-center flex flex-col items-center gap-0.5 opacity-60 cursor-not-allowed"
                          title={slot.motivo}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-xs line-through">{slot.hora_inicio} - {slot.hora_fin}</span>
                          <span className="text-[10px] truncate max-w-full">{slot.motivo}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 4: Modalidad, Motivo y Confirmación Final */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Resumen de la Reserva */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Paciente:</span>
                  <strong className="text-slate-900">{selectedPatient?.nombres} {selectedPatient?.apellidos} (HC: {selectedPatient?.numero_historia})</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Médico:</span>
                  <strong className="text-slate-900">{doctorsForSpecialty.find((m) => String(m.id_medico) === String(selectedDoctorId))?.nombre_completo || 'Médico'}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Especialidad:</span>
                  <strong className="text-[#00687a]">{currentSpecialty?.nombre} (Arancel: Bs. {currentSpecialty?.precio_consulta})</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <strong className="text-emerald-700">{selectedDate} de {selectedSlot?.hora_inicio} a {selectedSlot?.hora_fin} ({selectedSlot?.duracion_minutos} min)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipo de Consulta:</span>
                  <strong className="text-slate-800">{formDataCatalogs.tipos_cita.find((t) => String(t.id_tipo_cita) === String(selectedTipoCitaId))?.nombre}</strong>
                </div>
              </div>

              {/* Modalidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Modalidad de Atención
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalidad('PRESENCIAL')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      modalidad === 'PRESENCIAL'
                        ? 'bg-cyan-50 border-[#00687a] text-[#00687a] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Presencial (Consultorio)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidad('TELEMEDICINA')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      modalidad === 'TELEMEDICINA'
                        ? 'bg-cyan-50 border-[#00687a] text-[#00687a] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Telemedicina (Virtual)</span>
                  </button>
                </div>
              </div>

              {/* Motivo de Consulta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Consulta o Síntomas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Control rutinario de presión arterial / Dolor de garganta..."
                  value={motivoConsulta}
                  onChange={(e) => setMotivoConsulta(e.target.value)}
                  maxLength={255}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a]"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 5: TICKET OFICIAL DE CITA MÉDICA (ÉXITO / CU10) */}
          {/* ========================================================================= */}
          {step === 5 && createdAppointment && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  ¡Cita Programada Exitosamente!
                </span>
                <h4 className="font-montserrat font-extrabold text-2xl text-slate-900 mt-1">
                  Código: <span className="text-[#00687a]">{createdAppointment.codigo_cita}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Cupo reservado con transacción anti-colisión en el Centro Médico La Cruz
                </p>
              </div>

              {/* Comprobante / Ticket */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Estado de Cita:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {createdAppointment.estado}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <strong className="text-slate-900">{createdAppointment.paciente?.nombres} {createdAppointment.paciente?.apellidos}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Historia Clínica:</span>
                  <strong className="text-slate-800">{createdAppointment.paciente?.numero_historia}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Médico Tratante:</span>
                  <strong className="text-slate-900">{createdAppointment.medico?.nombres} {createdAppointment.medico?.apellidos}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Especialidad:</span>
                  <strong className="text-[#00687a]">{createdAppointment.especialidad?.nombre}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <strong className="text-slate-900">{createdAppointment.fecha_formateada} • {createdAppointment.hora_inicio_formateada} hrs</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Arancel Consulta:</span>
                  <strong className="text-emerald-700 text-sm">Bs. {createdAppointment.especialidad?.precio_consulta || '0.00'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] rounded-xl shadow-md transition hover:brightness-105"
                >
                  Finalizar y Volver
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Navegación del Wizard (Pasos 1 a 4) */}
        {step < 5 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep((prev) => prev - 1);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  if (step === 1) {
                    if (!selectedPatient) {
                      setErrorMsg('Debe seleccionar un paciente para continuar.');
                      return;
                    }
                    if (!selectedTipoCitaId) {
                      setErrorMsg('Debe seleccionar el tipo de cita médica.');
                      return;
                    }
                  } else if (step === 2) {
                    if (!selectedSpecialtyId) {
                      setErrorMsg('Debe seleccionar una especialidad.');
                      return;
                    }
                    if (!esEdadApta) {
                      setErrorMsg('El paciente no califica etariamente para esta especialidad.');
                      return;
                    }
                    if (!selectedDoctorId) {
                      setErrorMsg('Debe seleccionar un médico.');
                      return;
                    }
                  } else if (step === 3) {
                    if (!selectedSlot) {
                      setErrorMsg('Debe seleccionar un horario disponible.');
                      return;
                    }
                  }
                  setStep((prev) => prev + 1);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Bloqueando Cupo Transaccional...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirmar Reserva Anti-Colisión (CU10)</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

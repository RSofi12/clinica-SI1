import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  CalendarX,
  Building2,
  UserCheck,
  Sparkles,
  RefreshCw,
  Search,
  ShieldAlert,
  ChevronRight,
  Info,
  CalendarDays,
  Copy,
} from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { doctorService } from '../services/doctorService';
import { BlockModal } from './BlockModal';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes', corto: 'Lun' },
  { id: 2, nombre: 'Martes', corto: 'Mar' },
  { id: 3, nombre: 'Miércoles', corto: 'Mié' },
  { id: 4, nombre: 'Jueves', corto: 'Jue' },
  { id: 5, nombre: 'Viernes', corto: 'Vie' },
  { id: 6, nombre: 'Sábado', corto: 'Sáb' },
  { id: 7, nombre: 'Domingo', corto: 'Dom' },
];

export function SchedulesManager() {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'blocks'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Horarios semanales: diccionario de día_semana -> array de franjas { id_disponibilidad, hora_inicio, hora_fin, duracion_cita_minutos, activo }
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [defaultDuration, setDefaultDuration] = useState(30);

  // Bloqueos y Feriados
  const [blocks, setBlocks] = useState([]);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Estados de carga y mensajes
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success' | 'error', text: '' }

  // 1. Cargar lista de médicos activos
  const loadDoctors = useCallback(async () => {
    setIsLoadingDoctors(true);
    try {
      const res = await doctorService.fetchDoctors({ per_page: 100, estado: 'activo' });
      if (res?.data) {
        setDoctors(res.data);
        if (res.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(String(res.data[0].id_medico));
        }
      }
    } catch (err) {
      console.error('Error cargando médicos:', err);
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // 2. Cargar horarios del médico seleccionado
  const loadSchedule = useCallback(async (docId) => {
    if (!docId) return;
    setIsLoadingSchedule(true);
    setAlertInfo(null);
    try {
      const res = await scheduleService.fetchDoctorSchedule(docId);
      if (res?.data) {
        setSelectedDoctor(res.data.medico);

        // Agrupar disponibilidades por día_semana
        const grouped = {};
        DIAS_SEMANA.forEach((d) => {
          grouped[d.id] = [];
        });

        (res.data.disponibilidades || []).forEach((disp) => {
          if (!grouped[disp.dia_semana]) {
            grouped[disp.dia_semana] = [];
          }
          grouped[disp.dia_semana].push({
            id_disponibilidad: disp.id_disponibilidad,
            hora_inicio: disp.hora_inicio ? disp.hora_inicio.substring(0, 5) : '08:00',
            hora_fin: disp.hora_fin ? disp.hora_fin.substring(0, 5) : '12:00',
            duracion_cita_minutos: disp.duracion_cita_minutos || 30,
            activo: disp.activo ?? true,
          });
        });

        setWeeklySchedule(grouped);
      }
    } catch (err) {
      setAlertInfo({ type: 'error', text: err.message || 'Error al obtener horarios del médico.' });
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadSchedule(selectedDoctorId);
    }
  }, [selectedDoctorId, loadSchedule]);

  // 3. Cargar Bloqueos y Feriados
  const loadBlocks = useCallback(async () => {
    setIsLoadingBlocks(true);
    try {
      const res = await scheduleService.fetchBlocks();
      if (res?.data) {
        setBlocks(res.data);
      }
    } catch (err) {
      console.error('Error al cargar bloqueos:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'blocks') {
      loadBlocks();
    }
  }, [activeTab, loadBlocks]);

  // Agregar una franja horaria a un día específico
  const handleAddSlot = (diaId) => {
    setWeeklySchedule((prev) => {
      const current = prev[diaId] || [];
      const newSlot = {
        id_disponibilidad: null,
        hora_inicio: current.length > 0 ? '14:00' : '08:00',
        hora_fin: current.length > 0 ? '18:00' : '12:00',
        duracion_cita_minutos: defaultDuration,
        activo: true,
      };
      return {
        ...prev,
        [diaId]: [...current, newSlot],
      };
    });
  };

  // Eliminar una franja horaria
  const handleRemoveSlot = (diaId, index) => {
    setWeeklySchedule((prev) => {
      const current = [...(prev[diaId] || [])];
      current.splice(index, 1);
      return {
        ...prev,
        [diaId]: current,
      };
    });
  };

  // Modificar un campo de una franja
  const handleUpdateSlot = (diaId, index, field, value) => {
    setWeeklySchedule((prev) => {
      const current = [...(prev[diaId] || [])];
      current[index] = {
        ...current[index],
        [field]: value,
      };
      return {
        ...prev,
        [diaId]: current,
      };
    });
  };

  // Plantillas Rápidas de Horario
  const applyPreset = (presetType) => {
    const newSchedule = {};
    DIAS_SEMANA.forEach((d) => {
      newSchedule[d.id] = [];
    });

    if (presetType === 'full-lv') {
      // Lunes a Viernes: 08:00 - 12:00 y 14:00 - 18:00
      [1, 2, 3, 4, 5].forEach((d) => {
        newSchedule[d] = [
          { hora_inicio: '08:00', hora_fin: '12:00', duracion_cita_minutos: defaultDuration, activo: true },
          { hora_inicio: '14:00', hora_fin: '18:00', duracion_cita_minutos: defaultDuration, activo: true },
        ];
      });
    } else if (presetType === 'morning-ls') {
      // Lunes a Sábado: 08:00 - 13:00
      [1, 2, 3, 4, 5, 6].forEach((d) => {
        newSchedule[d] = [
          { hora_inicio: '08:00', hora_fin: '13:00', duracion_cita_minutos: defaultDuration, activo: true },
        ];
      });
    } else if (presetType === 'afternoon-lv') {
      // Lunes a Viernes: 14:00 - 20:00
      [1, 2, 3, 4, 5].forEach((d) => {
        newSchedule[d] = [
          { hora_inicio: '14:00', hora_fin: '20:00', duracion_cita_minutos: defaultDuration, activo: true },
        ];
      });
    }

    setWeeklySchedule(newSchedule);
    setAlertInfo({
      type: 'success',
      text: 'Plantilla de horarios aplicada en la vista previa. Haga clic en "Guardar Horarios" para confirmar.',
    });
  };

  // Validar y Guardar Horarios Semanales (Prueba P8.1)
  const handleSaveSchedule = async () => {
    setAlertInfo(null);

    // Flatten array
    const payloadHorarios = [];
    let hasValidationError = false;
    let errorDetail = '';

    Object.entries(weeklySchedule).forEach(([diaId, slots]) => {
      const diaNum = parseInt(diaId, 10);
      const diaNombre = DIAS_SEMANA.find((d) => d.id === diaNum)?.nombre || `Día ${diaNum}`;

      slots.forEach((s, idx) => {
        if (!s.hora_inicio || !s.hora_fin) {
          hasValidationError = true;
          errorDetail = `En ${diaNombre}: debe especificar tanto la hora de inicio como la de fin.`;
          return;
        }

        // Validación P8.1: La hora final debe ser mayor que la hora inicial
        if (s.hora_fin <= s.hora_inicio) {
          hasValidationError = true;
          errorDetail = `Error en ${diaNombre} (Franja ${idx + 1}): La hora fin (${s.hora_fin}) debe ser posterior a la hora inicio (${s.hora_inicio}).`;
          return;
        }

        payloadHorarios.push({
          id_disponibilidad: s.id_disponibilidad || null,
          dia_semana: diaNum,
          hora_inicio: s.hora_inicio,
          hora_fin: s.hora_fin,
          duracion_cita_minutos: parseInt(s.duracion_cita_minutos, 10) || 30,
          activo: Boolean(s.activo),
        });
      });
    });

    if (hasValidationError) {
      setAlertInfo({ type: 'error', text: errorDetail });
      return;
    }

    setIsSaving(true);
    try {
      await scheduleService.saveDoctorSchedule(selectedDoctorId, payloadHorarios);
      setAlertInfo({
        type: 'success',
        text: `Horarios de atención guardados correctamente para ${selectedDoctor?.nombre_completo || 'el médico'}.`,
      });
      loadSchedule(selectedDoctorId);
    } catch (err) {
      setAlertInfo({
        type: 'error',
        text: err.message || 'Error al guardar los horarios de atención.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar Bloqueo
  const handleDeleteBlock = async (blockId, motivo) => {
    if (!confirm(`¿Está seguro de eliminar el bloqueo '${motivo}'?`)) return;
    try {
      await scheduleService.deleteBlock(blockId);
      loadBlocks();
    } catch (err) {
      alert(err.message || 'Error al eliminar el bloqueo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Módulo */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-[#004d5a] to-[#00687a] rounded-2xl text-cyan-200 shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-montserrat font-bold text-xl text-slate-900">
                  Gestión de Horarios de Atención Médica
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#00687a]">
                  CU08 / RF05
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configuración de franjas semanales por médico, duración de cita y bloqueo de feriados institucionales
              </p>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'weekly'
                  ? 'bg-white text-[#00687a] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Horarios Semanales</span>
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'blocks'
                  ? 'bg-white text-[#00687a] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Feriados y Bloqueos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between transition animate-in fade-in duration-150 ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{alertInfo.text}</span>
          </div>
          <button
            onClick={() => setAlertInfo(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* PESTAÑA 1: Horarios Semanales por Médico */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {/* Barra de Control: Selección de Médico y Plantillas Rápidas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Seleccionar Médico:
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                disabled={isLoadingDoctors || isSaving}
                className="text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00687a] font-medium min-w-[280px]"
              >
                {doctors.map((doc) => (
                  <option key={doc.id_medico} value={doc.id_medico}>
                    {doc.nombre_completo || `Dr(a). ${doc.nombres} ${doc.apellidos}`} — {doc.especialidad_principal?.nombre || 'General'}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Duración base:</span>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(parseInt(e.target.value, 10))}
                  className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden"
                >
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>

            {/* Plantillas de configuración rápida */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Plantillas:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('full-lv')}
                className="text-[11px] font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-[#00687a] hover:border-cyan-200 border border-slate-200 rounded-lg transition"
              >
                L-V Doble Turno
              </button>
              <button
                type="button"
                onClick={() => applyPreset('morning-ls')}
                className="text-[11px] font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-[#00687a] hover:border-cyan-200 border border-slate-200 rounded-lg transition"
              >
                L-S Mañanas
              </button>
              <button
                type="button"
                onClick={() => applyPreset('afternoon-lv')}
                className="text-[11px] font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-[#00687a] hover:border-cyan-200 border border-slate-200 rounded-lg transition"
              >
                L-V Tardes
              </button>
              <button
                type="button"
                onClick={() => applyPreset('clear')}
                className="text-[11px] font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 rounded-lg transition"
              >
                Limpiar Todo
              </button>
            </div>
          </div>

          {/* Grilla Semanal: 7 Días */}
          {isLoadingSchedule ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center">
              <div className="w-8 h-8 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Cargando disponibilidad semanal...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DIAS_SEMANA.map((dia) => {
                const slots = weeklySchedule[dia.id] || [];
                const tieneHorarios = slots.length > 0;

                return (
                  <div
                    key={dia.id}
                    className={`rounded-2xl border transition flex flex-col justify-between overflow-hidden ${
                      tieneHorarios
                        ? 'bg-white border-slate-200/90 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/50'
                    }`}
                  >
                    {/* Cabecera del día */}
                    <div
                      className={`px-4 py-3 flex items-center justify-between border-b ${
                        tieneHorarios
                          ? 'bg-gradient-to-r from-slate-50 to-cyan-50/40 border-slate-200'
                          : 'bg-slate-100/70 border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            tieneHorarios
                              ? 'bg-[#00687a] text-white shadow-xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {dia.id}
                        </span>
                        <span className="font-montserrat font-bold text-sm text-slate-800">
                          {dia.nombre}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSlot(dia.id)}
                        className="text-[11px] font-semibold text-[#00687a] bg-cyan-50 hover:bg-cyan-100 px-2 py-1 rounded-md transition flex items-center gap-1"
                        title={`Agregar franja para ${dia.nombre}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Franja</span>
                      </button>
                    </div>

                    {/* Contenido: Lista de Franjas */}
                    <div className="p-4 space-y-3 flex-1">
                      {slots.length === 0 ? (
                        <div className="py-6 text-center text-slate-400">
                          <p className="text-xs font-medium">No atiende este día</p>
                          <button
                            type="button"
                            onClick={() => handleAddSlot(dia.id)}
                            className="text-[11px] text-[#00687a] hover:underline mt-1 font-medium inline-block"
                          >
                            + Activar horario
                          </button>
                        </div>
                      ) : (
                        slots.map((slot, idx) => {
                          const isInvalido = slot.hora_fin <= slot.hora_inicio;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border transition space-y-2 ${
                                isInvalido
                                  ? 'bg-rose-50/80 border-rose-300'
                                  : 'bg-slate-50 border-slate-200/80 hover:border-cyan-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">
                                  Franja #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(dia.id, idx)}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition"
                                  title="Eliminar franja"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                    Inicio
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.hora_inicio}
                                    onChange={(e) =>
                                      handleUpdateSlot(dia.id, idx, 'hora_inicio', e.target.value)
                                    }
                                    className="w-full text-xs py-1 px-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#00687a]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                    Fin
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.hora_fin}
                                    onChange={(e) =>
                                      handleUpdateSlot(dia.id, idx, 'hora_fin', e.target.value)
                                    }
                                    className={`w-full text-xs py-1 px-1.5 bg-white border rounded-md focus:outline-hidden focus:ring-1 ${
                                      isInvalido
                                        ? 'border-rose-400 text-rose-700 focus:ring-rose-400'
                                        : 'border-slate-300 focus:ring-[#00687a]'
                                    }`}
                                  />
                                </div>
                              </div>

                              {isInvalido && (
                                <p className="text-[10px] text-rose-600 font-medium">
                                  Hora fin debe ser posterior a inicio.
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                                <span className="text-slate-500">Duración:</span>
                                <select
                                  value={slot.duracion_cita_minutos}
                                  onChange={(e) =>
                                    handleUpdateSlot(
                                      dia.id,
                                      idx,
                                      'duracion_cita_minutos',
                                      parseInt(e.target.value, 10)
                                    )
                                  }
                                  className="text-[11px] py-0.5 px-1 bg-white border border-slate-300 rounded-md"
                                >
                                  <option value={15}>15 min</option>
                                  <option value={20}>20 min</option>
                                  <option value={30}>30 min</option>
                                  <option value={45}>45 min</option>
                                  <option value={60}>60 min</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barra Inferior Fija para Guardar Cambios */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-[#00687a]" />
              <span>
                Configuración para: <strong className="text-slate-900">{selectedDoctor?.nombre_completo || 'Médico'}</strong>. Los cambios aplican de inmediato en el generador de citas.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={isSaving || isLoadingSchedule}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Guardando Horarios...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Horarios Semanales</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Feriados y Bloqueos Institucionales (RF05 / P8.3) */}
      {activeTab === 'blocks' && (
        <div className="space-y-6">
          {/* Barra Superior con Botón de Alta */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-montserrat font-bold text-base text-slate-900">
                Feriados Institucionales y Licencias Médicas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Las fechas bloqueadas quedan automáticamente excluidas de la asignación de citas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadBlocks}
                disabled={isLoadingBlocks}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                title="Recargar lista"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBlocks ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#00687a] to-[#008b9e] hover:brightness-105 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Bloqueo / Feriado</span>
              </button>
            </div>
          </div>

          {/* Tabla de Bloqueos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingBlocks ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Cargando bloqueos vigentes...</p>
              </div>
            ) : blocks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CalendarX className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No hay bloqueos o feriados registrados</p>
                <p className="text-xs text-slate-400 mt-1">
                  Haga clic en &quot;Registrar Bloqueo / Feriado&quot; para añadir asuetos de la clínica o licencias.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Alcance / Tipo</th>
                      <th className="py-3 px-4">Horario</th>
                      <th className="py-3 px-4">Motivo / Justificación</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {blocks.map((b) => (
                      <tr key={b.id_bloqueo} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {b.fecha}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {b.es_general ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Building2 className="w-3 h-3" />
                              Feriado Clínica
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                              <ShieldAlert className="w-3 h-3" />
                              {b.medico?.nombres ? `Dr(a). ${b.medico.nombres} ${b.medico.apellidos}` : 'Licencia Médico'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {!b.hora_inicio ? (
                            <span className="font-semibold text-slate-700">Día Completo</span>
                          ) : (
                            <span>
                              {b.hora_inicio?.substring(0, 5)} - {b.hora_fin?.substring(0, 5)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                          {b.motivo}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(b.id_bloqueo, b.motivo)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar bloqueo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Crear Bloqueo / Feriado */}
      <BlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        doctors={doctors}
        defaultDoctorId={selectedDoctorId}
        onBlockCreated={() => {
          loadBlocks();
          if (selectedDoctorId) {
            loadSchedule(selectedDoctorId);
          }
        }}
      />
    </div>
  );
}

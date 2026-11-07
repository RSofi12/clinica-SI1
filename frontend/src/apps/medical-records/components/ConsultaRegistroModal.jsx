import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Stethoscope,
  User,
  Heart,
  Activity,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ClipboardList,
  Thermometer,
  Weight,
  Ruler,
  Droplets,
  ShieldAlert,
} from 'lucide-react';
import { AntecedentesPatientModal } from './AntecedentesPatientModal';
import { consultaService } from '../services/consultaService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function calcularIMC(peso, talla) {
  const p = parseFloat(peso);
  const t = parseFloat(talla);
  if (!p || !t || t <= 0) return null;
  const tallaMt = t / 100;
  return (p / (tallaMt * tallaMt)).toFixed(1);
}

function clasificacionIMC(imc) {
  const v = parseFloat(imc);
  if (isNaN(v)) return null;
  if (v < 18.5) return { label: 'Bajo peso', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (v < 25)   return { label: 'Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (v < 30)   return { label: 'Sobrepeso', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (v < 35)   return { label: 'Obesidad I', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (v < 40)   return { label: 'Obesidad II', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  return { label: 'Obesidad III', color: 'text-rose-900 bg-rose-100 border-rose-300' };
}

function DiagnosticoItem({ item, index, onChange, onRemove, canRemove }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 relative">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          title="Eliminar diagnóstico"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Diagnóstico #{index + 1}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Descripción */}
        <div className="sm:col-span-2 space-y-1">
          <label className="font-bold text-slate-700 text-xs">
            Descripción <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={item.descripcion}
            onChange={(e) => onChange(index, 'descripcion', e.target.value)}
            placeholder="Ej: Gastritis crónica leve"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
          />
        </div>

        {/* CIE-10 */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 text-xs">Código CIE-10</label>
          <input
            type="text"
            value={item.codigo_cie10}
            onChange={(e) => onChange(index, 'codigo_cie10', e.target.value.toUpperCase())}
            placeholder="Ej: K29.5"
            maxLength={8}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs font-mono text-slate-800"
          />
        </div>
      </div>

      {/* Tipo de diagnóstico */}
      <div className="flex gap-2">
        {['PRESUNTIVO', 'DEFINITIVO'].map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => onChange(index, 'tipo_diagnostico', tipo)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
              item.tipo_diagnostico === tipo
                ? tipo === 'DEFINITIVO'
                  ? 'bg-cyan-700 text-white border-cyan-700'
                  : 'bg-amber-500 text-white border-amber-500'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {tipo === 'PRESUNTIVO' ? '⚠ Presuntivo' : '✓ Definitivo'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function ConsultaRegistroModal({ isOpen, onClose, cita, onConsultaRegistrada }) {
  const [contexto, setContexto] = useState(null);
  const [loadingContexto, setLoadingContexto] = useState(false);
  const [isAntecedentesModalOpen, setIsAntecedentesModalOpen] = useState(false);

  const recargarContexto = useCallback(() => {
    if (!cita?.id_cita) return;
    consultaService
      .prepararConsulta(cita.id_cita)
      .then((res) => setContexto(res?.data || res))
      .catch(() => {});
  }, [cita?.id_cita]);

  // Formulario
  const [form, setForm] = useState({
    peso_kg: '',
    talla_cm: '',
    temperatura_c: '',
    presion_arterial: '',
    frecuencia_cardiaca: '',
    motivo_consulta: '',
    observaciones: '',
    plan_tratamiento: '',
  });

  const [diagnosticos, setDiagnosticos] = useState([
    { descripcion: '', codigo_cie10: '', tipo_diagnostico: 'PRESUNTIVO' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cargar contexto al abrir
  useEffect(() => {
    if (!isOpen || !cita?.id_cita) return;
    setContexto(null);
    setErrorMsg('');
    setSuccessMsg('');
    setForm({ peso_kg: '', talla_cm: '', temperatura_c: '', presion_arterial: '', frecuencia_cardiaca: '', motivo_consulta: '', observaciones: '', plan_tratamiento: '' });
    setDiagnosticos([{ descripcion: '', codigo_cie10: '', tipo_diagnostico: 'PRESUNTIVO' }]);
    setLoadingContexto(true);

    consultaService
      .prepararConsulta(cita.id_cita)
      .then((res) => setContexto(res?.data || res))
      .catch(() => setContexto(null))
      .finally(() => setLoadingContexto(false));
  }, [isOpen, cita?.id_cita]);

  const handleField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDiagnostico = useCallback((index, key, value) => {
    setDiagnosticos((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [key]: value } : d))
    );
  }, []);

  const addDiagnostico = () =>
    setDiagnosticos((prev) => [
      ...prev,
      { descripcion: '', codigo_cie10: '', tipo_diagnostico: 'PRESUNTIVO' },
    ]);

  const removeDiagnostico = (index) =>
    setDiagnosticos((prev) => prev.filter((_, i) => i !== index));

  // IMC en tiempo real
  const imc = calcularIMC(form.peso_kg, form.talla_cm);
  const imcClasif = imc ? clasificacionIMC(imc) : null;

  // Validación
  function validar() {
    if (!form.motivo_consulta.trim() || form.motivo_consulta.trim().length < 5)
      return 'El motivo de consulta es requerido (mínimo 5 caracteres).';
    if (!form.plan_tratamiento.trim() || form.plan_tratamiento.trim().length < 5)
      return 'El plan de tratamiento es requerido (mínimo 5 caracteres).';
    if (diagnosticos.length === 0)
      return 'Debe registrar al menos un diagnóstico.';
    for (let i = 0; i < diagnosticos.length; i++) {
      if (!diagnosticos[i].descripcion.trim())
        return `El diagnóstico #${i + 1} debe tener una descripción.`;
    }
    return null;
  }

  async function handleSubmit() {
    const err = validar();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      id_cita: cita.id_cita,
      signos_vitales: {
        peso_kg: form.peso_kg || null,
        talla_cm: form.talla_cm || null,
        temperatura_c: form.temperatura_c || null,
        presion_arterial: form.presion_arterial || null,
        frecuencia_cardiaca: form.frecuencia_cardiaca || null,
      },
      motivo_consulta: form.motivo_consulta.trim(),
      observaciones: form.observaciones.trim() || null,
      plan_tratamiento: form.plan_tratamiento.trim(),
      diagnosticos: diagnosticos.map((d) => ({
        descripcion: d.descripcion.trim(),
        codigo_cie10: d.codigo_cie10.trim() || null,
        tipo_diagnostico: d.tipo_diagnostico,
      })),
    };

    try {
      const res = await consultaService.createConsulta(payload);
      setSuccessMsg('Consulta médica registrada exitosamente.');
      if (onConsultaRegistrada) onConsultaRegistrada(res?.data || res);
    } catch (e) {
      setErrorMsg(e.message || 'Error al guardar la consulta. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const paciente = contexto?.paciente || cita?.paciente || {};
  const edad = calcularEdad(paciente.fecha_nacimiento);
  const tieneAlergias =
    paciente.antecedentes_alergicos ||
    contexto?.antecedentes?.algunos?.alergias;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#004d5a] to-[#006677] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base font-montserrat leading-tight">
                Registrar Consulta Médica
              </h2>
              <span className="text-xs text-cyan-100 font-mono">
                {cita?.codigo_cita || '—'} · CU16 — Triaje y Anamnesis
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast de éxito dentro del header */}
        {successMsg && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-6 py-2.5 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {loadingContexto ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-[#00687a]/30 border-t-[#00687a] rounded-full animate-spin" />
              <span className="text-xs">Cargando datos del paciente...</span>
            </div>
          ) : (
            <>
              {/* ── Sección 1: Cabecera del Paciente ───────────────────── */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00687a]" />
                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Datos del Paciente
                    </span>
                  </div>
                  {paciente && (
                    <button
                      type="button"
                      onClick={() => setIsAntecedentesModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition cursor-pointer"
                      title="Ver y Gestionar Antecedentes Médicos (CU17)"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      Gestionar Antecedentes
                    </button>
                  )}
                </div>

                {tieneAlergias && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    ¡ALERTA! El paciente tiene antecedentes alérgicos registrados. Verificar antes de prescribir.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Completo</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {paciente.nombres} {paciente.apellidos}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CI</span>
                    <span className="font-mono font-bold text-[#00687a] text-sm">
                      {paciente.numero_documento || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Historia Clínica</span>
                    <span className="font-mono text-xs bg-[#00687a]/10 text-[#00687a] border border-[#00687a]/20 rounded-md px-2 py-0.5 inline-block mt-0.5">
                      {paciente.numero_historia || 'Sin asignar'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Edad / Sangre</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {edad !== null ? `${edad} años` : '—'}
                      {paciente.tipo_sangre ? (
                        <span className="ml-2 font-mono bg-rose-50 text-rose-700 border border-rose-200 rounded-md px-1.5 py-0.5 text-[11px]">
                          {paciente.tipo_sangre}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>

                {/* Últimas consultas */}
                {contexto?.ultimas_consultas?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Últimas Consultas
                    </span>
                    <div className="space-y-1">
                      {contexto.ultimas_consultas.slice(0, 2).map((uc, i) => (
                        <div key={i} className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                          <ClipboardList className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-500">{uc.fecha || uc.created_at?.slice(0, 10)}</span>
                          <span className="text-slate-700">{uc.diagnostico_principal || uc.motivo_consulta || 'Consulta registrada'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sección 2: Signos Vitales y Triaje ─────────────────── */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-[#00687a]" />
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Signos Vitales y Triaje
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Peso */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5 text-slate-400" /> Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="300"
                      value={form.peso_kg}
                      onChange={(e) => handleField('peso_kg', e.target.value)}
                      placeholder="Ej: 72.5"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
                    />
                  </div>

                  {/* Talla */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5 text-slate-400" /> Talla (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="250"
                      value={form.talla_cm}
                      onChange={(e) => handleField('talla_cm', e.target.value)}
                      placeholder="Ej: 168"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
                    />
                  </div>

                  {/* IMC calculado */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs">IMC (calculado)</label>
                    {imc && imcClasif ? (
                      <div className={`px-3 py-2 rounded-xl border text-xs font-bold ${imcClasif.color} flex items-center gap-2`}>
                        <span className="font-mono text-base">{imc}</span>
                        <span>{imcClasif.label}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400">
                        Ingresa peso y talla
                      </div>
                    )}
                  </div>

                  {/* Temperatura */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400" /> Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="45"
                      value={form.temperatura_c}
                      onChange={(e) => handleField('temperatura_c', e.target.value)}
                      placeholder="Ej: 36.6"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
                    />
                  </div>

                  {/* Presión Arterial */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-slate-400" /> Presión Arterial
                    </label>
                    <input
                      type="text"
                      value={form.presion_arterial}
                      onChange={(e) => handleField('presion_arterial', e.target.value)}
                      placeholder="Ej: 120/80"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
                    />
                  </div>

                  {/* Frecuencia Cardiaca */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-slate-400" /> Frec. Cardiaca (bpm)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="300"
                      value={form.frecuencia_cardiaca}
                      onChange={(e) => handleField('frecuencia_cardiaca', e.target.value)}
                      placeholder="Ej: 72"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* ── Sección 3: Anamnesis ────────────────────────────────── */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-[#00687a]" />
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Anamnesis
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">
                    Motivo de Consulta <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.motivo_consulta}
                    onChange={(e) => handleField('motivo_consulta', e.target.value)}
                    placeholder="Describa el motivo principal de la consulta médica (mínimo 5 caracteres)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">
                    Observaciones Clínicas <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.observaciones}
                    onChange={(e) => handleField('observaciones', e.target.value)}
                    placeholder="Hallazgos en el examen físico, antecedentes relevantes, notas adicionales..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800 resize-none"
                  />
                </div>
              </div>

              {/* ── Sección 4: Diagnósticos ─────────────────────────────── */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#00687a]" />
                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Diagnósticos <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addDiagnostico}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 border border-[#00687a]/20 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar diagnóstico
                  </button>
                </div>

                <div className="space-y-2">
                  {diagnosticos.map((d, i) => (
                    <DiagnosticoItem
                      key={i}
                      item={d}
                      index={i}
                      onChange={handleDiagnostico}
                      onRemove={() => removeDiagnostico(i)}
                      canRemove={diagnosticos.length > 1}
                    />
                  ))}
                </div>
              </div>

              {/* ── Sección 5: Plan de Tratamiento ──────────────────────── */}
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="w-4 h-4 text-[#00687a]" />
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Plan de Tratamiento <span className="text-rose-500">*</span>
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={form.plan_tratamiento}
                  onChange={(e) => handleField('plan_tratamiento', e.target.value)}
                  placeholder="Indicaciones médicas, medicamentos, dosis, próxima cita, referencias o interconsultas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00687a] focus:bg-white transition text-xs text-slate-800 resize-none"
                />
              </div>

              {/* Error global */}
              {errorMsg && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer sticky */}
        {!successMsg && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white/95 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loadingContexto}
              className="px-6 py-2 text-xs font-bold bg-gradient-to-r from-[#00687a] to-[#004d5a] text-white rounded-xl hover:opacity-90 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Guardar Consulta Médica
                </>
              )}
            </button>
          </div>
        )}

        {successMsg && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white/95 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold bg-gradient-to-r from-[#00687a] to-[#004d5a] text-white rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Modal de Gestión de Antecedentes Médicos (CU17) */}
      {isAntecedentesModalOpen && paciente && (
        <AntecedentesPatientModal
          isOpen={isAntecedentesModalOpen}
          patient={paciente}
          onClose={() => setIsAntecedentesModalOpen(false)}
          onAntecedentesUpdated={recargarContexto}
        />
      )}
    </div>
  );
}

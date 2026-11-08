import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Activity,
  Scissors,
  Pill,
  Users,
  Check,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { antecedenteService } from '../services/antecedenteService';
import { ModalPortal } from '../../../components/ModalPortal';

// Sugerencias clínicas rápidas por categoría
const SUGERENCIAS_CLINICAS = {
  ALERGICO: [
    'Alergia severa a Penicilina y derivados beta-lactámicos',
    'Alergia a AINEs (Ibuprofeno, Aspirina, Ketorolaco)',
    'Alergia a Sulfonamidas (Sulfas)',
    'Alergia al Látex y polímeros sintéticos',
    'Alergia a medios de contraste yodados',
    'Alergia alimentaria a mariscos y frutos secos',
  ],
  PATOLOGICO: [
    'Hipertensión Arterial Sistémica (HTA) en tratamiento',
    'Diabetes Mellitus Tipo 2 (no insulinodependiente)',
    'Asma Bronquial moderada persistente',
    'Hipotiroidismo primario diagnosticado',
    'Gastritis crónica superficial / Reflujo GE',
    'Dislipidemia mixta (colesterol/triglicéridos elevados)',
  ],
  QUIRURGICO: [
    'Apendicectomía abierta sin complicaciones',
    'Colecistectomía laparoscópica electiva',
    'Cesárea segmentaria previa (x1)',
    'Hernioplastia inguinal bilateral',
    'Artroscopia de rodilla reconstructiva',
  ],
  FARMACOLOGICO: [
    'Losartán 50mg VO cada 24 horas',
    'Metformina 850mg VO cada 12 horas con comidas',
    'Levotiroxina 50mcg VO en ayunas matinal',
    'Omeprazol 20mg VO diario antes del desayuno',
    'Atorvastatina 20mg VO por la noche',
  ],
  FAMILIAR: [
    'Madre con Cáncer de Mama diagnosticado a los 52 años',
    'Padre con Infarto Agudo de Miocardio (IAM) a los 58 años',
    'Antecedente de Diabetes Mellitus materna de primer grado',
    'Hermano con Hipertensión Arterial precoz',
  ],
};

const CATEGORIAS = [
  {
    id: 'ALERGICO',
    label: 'Alérgico',
    icon: AlertTriangle,
    subtitle: 'Alergias a fármacos, alimentos o sustancias (Alerta prioritaria)',
    colorClass: 'border-rose-200 bg-rose-50/50 text-rose-800',
    selectedClass: 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20',
    iconBg: 'bg-rose-100 text-rose-700',
  },
  {
    id: 'PATOLOGICO',
    label: 'Patológico',
    icon: Activity,
    subtitle: 'Enfermedades crónicas, metabólicas o preexistentes',
    colorClass: 'border-blue-200 bg-blue-50/50 text-blue-800',
    selectedClass: 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'QUIRURGICO',
    label: 'Quirúrgico',
    icon: Scissors,
    subtitle: 'Cirugías previas, traumatismos o procedimientos invasivos',
    colorClass: 'border-purple-200 bg-purple-50/50 text-purple-800',
    selectedClass: 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20',
    iconBg: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'FARMACOLOGICO',
    label: 'Farmacológico',
    icon: Pill,
    subtitle: 'Medicamentos habituales de uso crónico o continuo',
    colorClass: 'border-emerald-200 bg-emerald-50/50 text-emerald-800',
    selectedClass: 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'FAMILIAR',
    label: 'Familiar',
    icon: Users,
    subtitle: 'Antecedentes hereditarios o patologías de primer grado',
    colorClass: 'border-amber-200 bg-amber-50/50 text-amber-800',
    selectedClass: 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20',
    iconBg: 'bg-amber-100 text-amber-700',
  },
];

/**
 * Modal de Registro y Edición de Antecedente Médico (CU17)
 */
export function AntecedenteFormModal({
  isOpen,
  onClose,
  patientId,
  patientName = 'Paciente',
  antecedenteToEdit = null,
  onAntecedenteSaved,
}) {
  const [tipo, setTipo] = useState('ALERGICO');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = Boolean(antecedenteToEdit?.id_antecedente);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (antecedenteToEdit) {
        setTipo(antecedenteToEdit.tipo_antecedente || 'ALERGICO');
        setDescripcion(antecedenteToEdit.descripcion || '');
      } else {
        setTipo('ALERGICO');
        setDescripcion('');
      }
    }
  }, [isOpen, antecedenteToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim() || descripcion.trim().length < 3) {
      setErrorMsg('La descripción del antecedente debe contener al menos 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        tipo_antecedente: tipo,
        descripcion: descripcion.trim(),
      };

      let res;
      if (isEditing) {
        res = await antecedenteService.updateAntecedente(antecedenteToEdit.id_antecedente, payload);
      } else {
        res = await antecedenteService.createAntecedente(patientId, payload);
      }

      if (res && res.success) {
        if (onAntecedenteSaved) {
          onAntecedenteSaved(res.data);
        }
        onClose();
      } else {
        setErrorMsg(res?.message || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      console.error('Error al guardar antecedente:', err);
      setErrorMsg(err.message || 'Error de comunicación con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sugerencias = SUGERENCIAS_CLINICAS[tipo] || [];

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-modal-panel flex flex-col max-h-[92vh] cursor-default"
    >
      {/* Header */}
        <div className="bg-gradient-to-r from-[#003d47] via-[#005a69] to-[#00687a] p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <FileText className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest text-cyan-200 uppercase font-semibold">
                  Expediente Clínico Permanente • CU17
                </span>
                <h3 className="text-lg font-bold font-serif-clinical font-normal tracking-tight text-white mt-0.5">
                  {isEditing ? 'Editar Antecedente Médico' : 'Nuevo Antecedente Médico'}
                </h3>
                <span className="text-xs text-cyan-100 block">
                  Paciente: <strong className="text-white font-semibold">{patientName}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              data-modal-close="true"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 text-xs">
                <strong className="block font-bold">Validación asistencial</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Selector de Categoría */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Categoría del Antecedente:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => {
                const Icon = cat.icon;
                const isSelected = tipo === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTipo(cat.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      isSelected ? cat.selectedClass : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block text-slate-900 leading-tight">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                        {cat.id === 'ALERGICO' ? 'Alerta prioritaria' : cat.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sugerencias Rápidas */}
          {sugerencias.length > 0 && (
            <div className="space-y-1.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#00687a]" />
                <span>Plantillas frecuentes para {CATEGORIAS.find((c) => c.id === tipo)?.label}:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sugerencias.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDescripcion(sug)}
                    className="text-[11px] bg-white hover:bg-[#005a69]/10 text-slate-700 hover:text-[#005a69] border border-slate-200 hover:border-[#005a69]/30 px-2.5 py-1 rounded-xl transition cursor-pointer text-left font-medium"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción Clínica */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="descripcion-antecedente" className="block text-xs font-bold text-slate-800">
                Descripción Clínica Detallada *
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {descripcion.length} / 1000
              </span>
            </div>
            <textarea
              id="descripcion-antecedente"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={
                tipo === 'ALERGICO'
                  ? 'Ej. Alergia severa a Penicilina G y derivados (presentó edema de glotis en 2022)...'
                  : 'Detalle diagnóstico, tratamiento, fecha aproximada o gravedad clínica...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#005a69] text-xs resize-none bg-white transition"
              required
            />
            <p className="text-[10px] text-slate-500">
              Esta información será preservada permanentemente en la historia clínica del paciente y visible en cada consulta médica (RN11).
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              data-modal-close="true"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || descripcion.trim().length < 3}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#005a69] to-[#007b8f] hover:brightness-105 text-white font-bold text-xs shadow-md shadow-[#005a69]/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Actualizar Antecedente' : 'Guardar Antecedente'}</span>
                </>
              )}
            </button>
          </div>
        </form>
    </ModalPortal>
  );
}

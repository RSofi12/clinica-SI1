import {
  X,
  HeartPulse,
  User,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export function PatientDetailModal({ isOpen, onClose, patient }) {
  if (!isOpen || !patient) return null;

  const contacto = patient.contactos_emergencia?.[0] || null;

  const getGrupoBadge = (grupo) => {
    if (grupo?.includes('Pediátrico')) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
          👶 Pediátrico (&lt;15 años)
        </span>
      );
    }
    if (grupo?.includes('Geriátrico')) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
          🧓 Geriátrico (≥60 años)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
        🧑 Adulto (15-59 años)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl my-8 overflow-hidden transition-all animate-in fade-in zoom-in-95">
        {/* Cabecera de la Ficha Clínica */}
        <div className="relative bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-xl font-bold font-montserrat shadow-inner shrink-0">
              {patient.nombres?.[0]}
              {patient.apellidos?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono tracking-wider font-bold">
                  {patient.numero_historia}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  patient.estado_paciente === 'ACTIVO'
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-rose-400/20 text-rose-200 border border-rose-400/30'
                }`}>
                  {patient.estado_paciente}
                </span>
              </div>
              <h3 className="font-montserrat font-bold text-lg sm:text-xl text-white mt-1">
                {patient.nombre_completo || `${patient.nombres} ${patient.apellidos}`}
              </h3>
              <p className="text-xs text-cyan-100 flex items-center gap-1.5 font-mono">
                <span>CI: {patient.numero_documento}</span>
                <span>•</span>
                <span>{patient.edad} años</span>
                <span>•</span>
                <span>{patient.sexo}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contenido de la Ficha */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Tarjeta de Sugerencia de Especialidad Médica (RF04) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#00687a] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Grupo Etario y Criterio Clínico</span>
                {getGrupoBadge(patient.grupo_etario)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Según las reglas de especialidades médicas (RF04), este paciente aplica para{' '}
                <strong className="text-[#00687a]">{patient.especialidad_sugerida}</strong>.
              </p>
            </div>
          </div>

          {/* Grilla de Datos Médicos Básicos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tipo de Sangre
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">
                {patient.tipo_sangre || 'No registrado'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Fecha Nacimiento
              </span>
              <span className="text-xs font-mono font-medium text-slate-800 mt-0.5 block">
                {patient.fecha_nacimiento ? patient.fecha_nacimiento.substring(0, 10) : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Notificaciones
              </span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {patient.notificaciones_activas ? 'Habilitadas' : 'Desactivadas'}
              </span>
            </div>
          </div>

          {/* Datos de Contacto y Residencia */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Información de Contacto
            </h4>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono font-medium">{patient.telefono || 'Sin teléfono registrado'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{patient.correo || 'Sin correo electrónico registrado'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{patient.direccion || 'Dirección domiciliaria no especificada'}</span>
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Contacto de Emergencia Institucional
            </h4>
            {contacto ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{contacto.nombre}</span>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    {contacto.parentesco}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{contacto.telefono}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No se ha registrado contacto de emergencia aún.</p>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Registrado el {patient.fecha_registro ? new Date(patient.fecha_registro).toLocaleDateString() : '—'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer shadow-xs"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}

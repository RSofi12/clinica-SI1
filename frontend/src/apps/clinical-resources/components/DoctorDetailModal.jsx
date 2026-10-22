import {
  X,
  Stethoscope,
  Award,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

export function DoctorDetailModal({ isOpen, onClose, doctor, onEdit }) {
  if (!isOpen || !doctor) return null;

  const especialidadPrincipal =
    doctor.specialties?.find((s) => s.pivot?.es_principal) ||
    doctor.specialties?.[0];

  const especialidadesSecundarias =
    doctor.specialties?.filter(
      (s) => s.id_especialidad !== especialidadPrincipal?.id_especialidad
    ) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con fondo clínico y gradiente */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-[#003844] via-[#004d5a] to-[#00687a] text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-bold text-[#70cbff] shadow-inner shrink-0">
              {doctor.nombres?.[0]}
              {doctor.apellidos?.[0]}
            </div>

            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#70cbff]/20 text-[#70cbff] border border-[#70cbff]/30">
                  Matrícula: {doctor.codigo_profesional}
                </span>
                {doctor.estado_activo ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    En Servicio Activo
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Inactivo (Baja Lógica)
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-montserrat font-bold text-white tracking-tight">
                {doctor.nombre_completo || `Dr(a). ${doctor.nombres} ${doctor.apellidos}`}
              </h2>

              <p className="text-xs sm:text-sm text-cyan-100/80 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#70cbff]" />
                <span>
                  {especialidadPrincipal?.nombre || 'Médico General'}
                </span>
                {especialidadesSecundarias.length > 0 && (
                  <span className="text-[11px] text-cyan-200/70">
                    (+{especialidadesSecundarias.length} especialidad adicional)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido con scroll independiente */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Especialidades Asignadas (CU07 / RF04) */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#00687a]" />
              <span>Especialidades Médicas Asignadas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Especialidad Principal */}
              {especialidadPrincipal && (
                <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 shadow-xs relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#00687a] flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#00687a] text-[#00687a]" />
                      Especialidad Principal
                    </span>
                    <span className="text-xs font-bold text-cyan-900 bg-white px-2 py-0.5 rounded-lg border border-cyan-200">
                      Bs. {especialidadPrincipal.precio_consulta || '70.00'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    {especialidadPrincipal.nombre}
                  </h4>
                  {especialidadPrincipal.descripcion && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {especialidadPrincipal.descripcion}
                    </p>
                  )}
                  <div className="mt-2 text-[11px] text-slate-500 font-medium">
                    Rango etario: {especialidadPrincipal.edad_min_anios ?? 0} a {especialidadPrincipal.edad_max_anios ?? 'Sin límite'} años
                  </div>
                </div>
              )}

              {/* Especialidades Secundarias */}
              {especialidadesSecundarias.map((esp) => (
                <div
                  key={esp.id_especialidad}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">
                      Especialidad Secundaria
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      Bs. {esp.precio_consulta || '80.00'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    {esp.nombre}
                  </h4>
                  {esp.descripcion && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {esp.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Datos de Contacto y Profesional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00687a]" />
                <span>Contacto Directo</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Teléfono Móvil:</span>
                  <span className="font-semibold text-slate-800">
                    {doctor.telefono_contacto || 'No registrado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Correo Profesional:</span>
                  <span className="font-semibold text-slate-800 break-all">
                    {doctor.correo_profesional || 'No registrado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00687a]" />
                <span>Cuenta de Sistema (RBAC)</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Usuario Asociado:</span>
                  <span className="font-semibold text-slate-800">
                    {doctor.user?.username ? `@${doctor.user.username}` : 'Sin cuenta web vinculada'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Rol Asignado:</span>
                  <span className="font-semibold text-[#00687a]">
                    Médico Clínico (MEDICO)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de Disponibilidad */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-3">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block">Gestión de Horarios y Disponibilidad (CU08):</span>
              Los turnos y franjas de atención de este profesional se configuran semanalmente para alimentar la agenda anti-colisión.
            </div>
          </div>
        </div>

        {/* Pie con botones de acción */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cerrar
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(doctor);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00687a] hover:bg-[#005564] shadow-md shadow-[#00687a]/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editar Médico</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

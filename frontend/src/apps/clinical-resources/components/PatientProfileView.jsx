import { useState, useEffect } from 'react';
import { patientProfileService } from '../services/patientProfileService';
import {
  User,
  HeartPulse,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  ShieldCheck,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bell,
  Sparkles,
  Save,
  KeyRound,
  Check,
} from 'lucide-react';

export function PatientProfileView() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [feedback, setFeedback] = useState({ type: null, message: null });

  // Formulario de perfil editable
  const [contactData, setContactData] = useState({
    telefono: '',
    correo: '',
    direccion: '',
    notificaciones_activas: true,
    contacto_nombre: '',
    contacto_parentesco: '',
    contacto_telefono: '',
  });

  // Formulario de cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    setFeedback({ type: null, message: null });
    try {
      const res = await patientProfileService.fetchMyProfile();
      const p = res.patient;
      setPatient(p);

      const contacto = p.contactos_emergencia?.[0] || {};
      setContactData({
        telefono: p.telefono || '',
        correo: p.correo || '',
        direccion: p.direccion || '',
        notificaciones_activas: p.notificaciones_activas ?? true,
        contacto_nombre: contacto.nombre || '',
        contacto_parentesco: contacto.parentesco || 'Familiar',
        contacto_telefono: contacto.telefono || '',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'No se pudo cargar la información de su perfil.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 5000);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await patientProfileService.updateMyProfile(contactData);
      showToast('success', res.message || 'Información de contacto actualizada correctamente.');
      setPatient(res.patient);
    } catch (err) {
      showToast('error', err.message || 'Error al actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Validación de nueva contraseña
  const np = passwordData.new_password;
  const passwordChecks = {
    length: np.length >= 8,
    upper: /[A-Z]/.test(np),
    lower: /[a-z]/.test(np),
    number: /[0-9]/.test(np),
    symbol: /[@$!%*?&#^_{}-]/.test(np),
  };
  const isNewPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!isNewPasswordValid) {
      showToast('error', 'La nueva contraseña no cumple con los criterios de seguridad.');
      return;
    }
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showToast('error', 'La confirmación de la contraseña no coincide.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await patientProfileService.changeMyPassword(passwordData);
      showToast('success', res.message || 'Contraseña actualizada exitosamente.');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      showToast('error', err.message || 'Error al modificar contraseña.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00687a] mb-3" />
        <p className="text-xs text-slate-500 font-medium">Cargando su ficha de paciente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-montserrat font-bold text-slate-900 text-base">Ficha no Vinculada</h3>
        <p className="text-xs text-slate-500 mt-1">
          No se encontró un registro clínico asociado a su cuenta de usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Notificación Toast */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Tarjeta de Cabecera del Paciente */}
      <div className="bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#00687a]/15">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-2xl font-bold font-montserrat shadow-inner shrink-0">
              {patient.nombres?.[0]}
              {patient.apellidos?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono tracking-wider font-bold">
                  {patient.numero_historia}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold">
                  {patient.estado_paciente}
                </span>
              </div>
              <h2 className="font-montserrat font-bold text-xl sm:text-2xl mt-1 text-white">
                {patient.nombre_completo}
              </h2>
              <p className="text-xs text-cyan-100/90 flex flex-wrap items-center gap-1.5 font-mono mt-0.5">
                <span>CI: {patient.numero_documento}</span>
                <span>•</span>
                <span>{patient.edad} años</span>
                <span>•</span>
                <span>{patient.grupo_etario}</span>
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md text-right text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-200 block">
              Especialidad Sugerida (RF04)
            </span>
            <span className="font-semibold text-white mt-0.5 block">
              {patient.especialidad_sugerida}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: Formulario de Contacto y Emergencia */}
        <div className="lg:col-span-7 space-y-6">
          {/* Formulario de Canales de Contacto */}
          <form onSubmit={handleSaveContact} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Phone className="w-4 h-4 text-[#00687a]" />
              <h3 className="font-montserrat font-bold text-slate-800 text-sm">
                Canales de Contacto y Ubicación
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Teléfono / Celular
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={contactData.telefono}
                    onChange={(e) => setContactData({ ...contactData, telefono: e.target.value })}
                    placeholder="Ej. 77123401"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={contactData.correo}
                    onChange={(e) => setContactData({ ...contactData, correo: e.target.value })}
                    placeholder="paciente@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dirección Domiciliaria
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={contactData.direccion}
                    onChange={(e) => setContactData({ ...contactData, direccion: e.target.value })}
                    placeholder="Barrio, Calle, Número de Casa"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                  />
                </div>
              </div>

              {/* Notificaciones y Avisos de Citas */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition">
                  <input
                    type="checkbox"
                    checked={contactData.notificaciones_activas}
                    onChange={(e) => setContactData({ ...contactData, notificaciones_activas: e.target.checked })}
                    className="w-4 h-4 text-[#00687a] rounded-md focus:ring-[#00687a] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Recibir recordatorios automáticos de citas
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Avisos de proximidad de consulta, confirmación o reprogramación.
                    </span>
                  </div>
                </label>
              </div>

              {/* Contacto de Emergencia */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00687a]" />
                  <h4 className="font-montserrat font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Contacto de Emergencia
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nombre del Familiar / Contacto
                    </label>
                    <input
                      type="text"
                      value={contactData.contacto_nombre}
                      onChange={(e) => setContactData({ ...contactData, contacto_nombre: e.target.value })}
                      placeholder="Ej. Andrea Choque de Morales"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Parentesco
                    </label>
                    <input
                      type="text"
                      value={contactData.contacto_parentesco}
                      onChange={(e) => setContactData({ ...contactData, contacto_parentesco: e.target.value })}
                      placeholder="Madre, Cónyuge, Hijo"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Teléfono de Emergencia
                    </label>
                    <input
                      type="tel"
                      value={contactData.contacto_telefono}
                      onChange={(e) => setContactData({ ...contactData, contacto_telefono: e.target.value })}
                      placeholder="Ej. 77123499"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios de Contacto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: Datos Protegidos y Seguridad */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta de Datos Personales Protegidos (Solo Lectura) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-montserrat font-bold text-slate-800 text-sm">
                Datos Clínicos Oficiales
              </h3>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Estos datos fueron verificados durante su admisión y no pueden ser alterados en línea por seguridad clínica. Para correcciones, presente su documento en recepción.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Documento CI
                </span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {patient.numero_documento}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  N° Historia
                </span>
                <span className="font-mono font-bold text-[#00687a] mt-0.5 block">
                  {patient.numero_historia}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fecha Nacimiento
                </span>
                <span className="font-mono font-medium text-slate-700 mt-0.5 block">
                  {patient.fecha_nacimiento ? patient.fecha_nacimiento.substring(0, 10) : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Grupo Sanguíneo
                </span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {patient.tipo_sangre || 'No registrado'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de Cambio de Contraseña */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-[#00687a]" />
              <h3 className="font-montserrat font-bold text-slate-800 text-sm">
                Seguridad de la Cuenta
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordData.new_password_confirmation}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                    required
                  />
                </div>
              </div>

              {/* Checklist */}
              {passwordData.new_password && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
                  <span className={`flex items-center gap-1 ${passwordChecks.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> 8+ caracteres
                  </span>
                  <span className={`flex items-center gap-1 ${passwordChecks.upper && passwordChecks.lower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> Mayúscula y minúscula
                  </span>
                  <span className={`flex items-center gap-1 ${passwordChecks.number && passwordChecks.symbol ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> Número y símbolo especial
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword || !isNewPasswordValid}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Actualizar Contraseña</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

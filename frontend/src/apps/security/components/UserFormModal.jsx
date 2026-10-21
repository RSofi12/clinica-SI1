import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Shield, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';

/**
 * Modal para creación y edición de usuarios (CU02 - RF01)
 * Incluye validador dinámico de fortaleza de contraseña según StrongPasswordRule
 */
export function UserFormModal({ isOpen, onClose, onSaved, initialUser = null, roles = [] }) {
  const isEditing = Boolean(initialUser);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    tipo_usuario: 'MEDICO',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialUser) {
      setFormData({
        username: initialUser.username || '',
        email: initialUser.email || '',
        tipo_usuario: initialUser.tipo_usuario || 'MEDICO',
        password: '',
      });
    } else {
      setFormData({
        username: '',
        email: '',
        tipo_usuario: 'MEDICO',
        password: '',
      });
    }
    setError(null);
    setFieldErrors({});
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  // Validación de criterios de contraseña segura
  const pwd = formData.password;
  const passwordChecks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()\-_=+{};:,<.>?]/.test(pwd),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validaciones preventivas en cliente
    if (!isEditing && !formData.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    if (formData.password && !isPasswordValid) {
      setError('La contraseña no cumple con todas las políticas de seguridad.');
      return;
    }

    setLoading(true);

    try {
      await onSaved(formData, initialUser?.id_usuario);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el usuario.');
      if (err.data?.errors) {
        setFieldErrors(err.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00687a]/10 text-[#00687a]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 text-base">
                {isEditing ? 'Editar Operador de Sistema' : 'Nuevo Operador de Sistema'}
              </h3>
              <p className="text-xs text-slate-500">CU02: Gestión de accesos y perfiles (RF01)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de Usuario <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isEditing} // El username es inmutable en edición para integridad de auditoría
                placeholder="ej: doctor.martinez"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 transition ${
                  isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-300'
                } ${fieldErrors.username ? 'border-rose-400 ring-2 ring-rose-100' : ''}`}
                required
              />
            </div>
            {fieldErrors.username && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.username[0]}</p>
            )}
            {isEditing && (
              <p className="text-[10px] text-slate-400 mt-1">El nombre de usuario no puede modificarse una vez registrado.</p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico Institucional <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ej: doctor@clinicalacruz.com"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 transition ${
                  fieldErrors.email ? 'border-rose-400 ring-2 ring-rose-100' : ''
                }`}
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Rol / Tipo de Usuario */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rol del Sistema (RBAC) <span className="text-rose-500">*</span>
            </label>
            <select
              name="tipo_usuario"
              value={formData.tipo_usuario}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-medium text-slate-800 transition"
              required
            >
              <option value="ADMIN">ADMIN (Administrador del Sistema)</option>
              <option value="RECEPCIONISTA">RECEPCIONISTA (Gestión de Pacientes y Citas)</option>
              <option value="MEDICO">MEDICO (Consultas, Historias y Recetas)</option>
              <option value="PACIENTE">PACIENTE (Autoservicio y Visualización)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Los especialistas clínicos (pediatras, geriatras) se gestionan bajo el rol único de <span className="font-semibold text-slate-700">MÉDICO</span>.
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Segura'} {!isEditing && <span className="text-rose-500">*</span>}
              </label>
              {isEditing && (
                <span className="text-[10px] text-slate-400">Dejar en blanco para mantener</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? '••••••••' : 'Ej: Clinica2026@'}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 transition ${
                  fieldErrors.password ? 'border-rose-400 ring-2 ring-rose-100' : ''
                }`}
                required={!isEditing}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.password[0]}</p>
            )}

            {/* Checklist de requisitos de contraseña cuando el usuario escribe */}
            {(formData.password.length > 0 || !isEditing) && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-700">Requisitos de contraseña segura:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <span className={`flex items-center gap-1 ${passwordChecks.length ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <Check className={`w-3 h-3 ${passwordChecks.length ? 'opacity-100' : 'opacity-30'}`} /> Mínimo 8 caracteres
                  </span>
                  <span className={`flex items-center gap-1 ${passwordChecks.upper ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <Check className={`w-3 h-3 ${passwordChecks.upper ? 'opacity-100' : 'opacity-30'}`} /> Al menos 1 mayúscula
                  </span>
                  <span className={`flex items-center gap-1 ${passwordChecks.lower ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <Check className={`w-3 h-3 ${passwordChecks.lower ? 'opacity-100' : 'opacity-30'}`} /> Al menos 1 minúscula
                  </span>
                  <span className={`flex items-center gap-1 ${passwordChecks.number ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <Check className={`w-3 h-3 ${passwordChecks.number ? 'opacity-100' : 'opacity-30'}`} /> Al menos 1 número
                  </span>
                  <span className={`flex items-center gap-1 col-span-2 ${passwordChecks.special ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                    <Check className={`w-3 h-3 ${passwordChecks.special ? 'opacity-100' : 'opacity-30'}`} /> Al menos 1 carácter especial (!@#$%...)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Operador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

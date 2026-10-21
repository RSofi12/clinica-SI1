import { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  Award,
  Phone,
  Mail,
  User,
  Lock,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import { specialtyService } from '../services/specialtyService';

export function DoctorFormModal({ isOpen, onClose, doctorToEdit, onSaved }) {
  const isEditing = !!doctorToEdit;

  const [formData, setFormData] = useState({
    codigo_profesional: '',
    nombres: '',
    apellidos: '',
    correo_profesional: '',
    telefono_contacto: '',
    especialidades: [],
    id_especialidad_principal: null,
    crear_cuenta_web: false,
    username: '',
    password: '',
  });

  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Cargar catálogo de especialidades activas al abrir
  useEffect(() => {
    if (!isOpen) return;

    async function loadSpecialties() {
      setIsLoadingSpecialties(true);
      try {
        const response = await specialtyService.fetchSpecialties({ estado: 'ACTIVO' });
        setAvailableSpecialties(response?.data || []);
      } catch (err) {
        console.error('Error al cargar catálogo de especialidades:', err);
      } finally {
        setIsLoadingSpecialties(false);
      }
    }

    loadSpecialties();
  }, [isOpen]);

  // Poblar formulario si es modo edición
  useEffect(() => {
    if (!isOpen) return;

    if (doctorToEdit) {
      const selectedIds = doctorToEdit.specialties?.map((s) => s.id_especialidad) || [];
      const principal =
        doctorToEdit.specialties?.find((s) => s.pivot?.es_principal)?.id_especialidad ||
        selectedIds[0] ||
        null;

      setFormData({
        codigo_profesional: doctorToEdit.codigo_profesional || '',
        nombres: doctorToEdit.nombres || '',
        apellidos: doctorToEdit.apellidos || '',
        correo_profesional: doctorToEdit.correo_profesional || '',
        telefono_contacto: doctorToEdit.telefono_contacto || '',
        especialidades: selectedIds,
        id_especialidad_principal: principal,
        crear_cuenta_web: false,
        username: doctorToEdit.user?.username || '',
        password: '',
      });
    } else {
      setFormData({
        codigo_profesional: '',
        nombres: '',
        apellidos: '',
        correo_profesional: '',
        telefono_contacto: '',
        especialidades: [],
        id_especialidad_principal: null,
        crear_cuenta_web: true,
        username: '',
        password: 'Admin123@',
      });
    }

    setErrors({});
    setGeneralError('');
  }, [isOpen, doctorToEdit]);

  if (!isOpen) return null;

  const handleSpecialtyToggle = (id) => {
    setFormData((prev) => {
      const current = prev.especialidades;
      const exists = current.includes(id);
      let updated;

      if (exists) {
        updated = current.filter((x) => x !== id);
      } else {
        updated = [...current, id];
      }

      // Si la que desmarcó era la principal, reasignar al primer elemento
      let newPrincipal = prev.id_especialidad_principal;
      if (newPrincipal === id && exists) {
        newPrincipal = updated[0] || null;
      } else if (!newPrincipal && updated.length > 0) {
        newPrincipal = updated[0];
      }

      return {
        ...prev,
        especialidades: updated,
        id_especialidad_principal: newPrincipal,
      };
    });
  };

  const handleSetPrincipal = (id, e) => {
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      id_especialidad_principal: id,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (formData.especialidades.length === 0) {
      setGeneralError('Debe seleccionar al menos una especialidad médica.');
      return;
    }

    if (!formData.id_especialidad_principal) {
      setGeneralError('Debe marcar cuál es la especialidad principal del médico.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        await doctorService.updateDoctor(doctorToEdit.id_medico, formData);
      } else {
        await doctorService.createDoctor(formData);
      }
      onSaved();
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        setGeneralError(err.message || 'Error al guardar los datos del médico.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#007b90] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <Stethoscope className="w-5 h-5 text-[#70cbff]" />
            </div>
            <div>
              <h2 className="text-lg font-montserrat font-bold">
                {isEditing ? 'Modificar Datos del Médico' : 'Registrar Nuevo Profesional Médico'}
              </h2>
              <p className="text-xs text-cyan-100/80">
                CU06 / RF03 — Plantel Médico y Especialidades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Sección 1: Datos Personales y Profesionales */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Identificación y Credenciales Médicas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombres */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  placeholder="Ej. Juan Carlos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition"
                />
                {errors.nombres && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.nombres[0]}</span>
                )}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Ej. Pérez Saucedo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition"
                />
                {errors.apellidos && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.apellidos[0]}</span>
                )}
              </div>

              {/* Matrícula Profesional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matrícula / Código Profesional *
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigo_profesional}
                  onChange={(e) => setFormData({ ...formData, codigo_profesional: e.target.value })}
                  placeholder="Ej. MED-10492"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition"
                />
                {errors.codigo_profesional && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.codigo_profesional[0]}</span>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={formData.telefono_contacto}
                  onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                  placeholder="Ej. 71023456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition"
                />
              </div>

              {/* Correo Profesional */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico Profesional
                </label>
                <input
                  type="email"
                  value={formData.correo_profesional}
                  onChange={(e) => setFormData({ ...formData, correo_profesional: e.target.value })}
                  placeholder="doctor@clinicalacruz.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] focus:bg-white transition"
                />
                {errors.correo_profesional && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{errors.correo_profesional[0]}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sección 2: Especialidades Médicas (CU07 / RF04) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Especialidades Médicas (Selección y Principal)
              </h3>
              <span className="text-[11px] text-slate-500">
                ⭐ Haz clic en la estrella para designar la Principal
              </span>
            </div>

            {isLoadingSpecialties ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Cargando catálogo de especialidades...
              </div>
            ) : availableSpecialties.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs">
                No hay especialidades registradas en el catálogo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                {availableSpecialties.map((esp) => {
                  const isSelected = formData.especialidades.includes(esp.id_especialidad);
                  const isPrincipal = formData.id_especialidad_principal === esp.id_especialidad;

                  return (
                    <div
                      key={esp.id_especialidad}
                      onClick={() => handleSpecialtyToggle(esp.id_especialidad)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? isPrincipal
                            ? 'bg-cyan-50/80 border-[#00687a] shadow-xs'
                            : 'bg-white border-cyan-200 shadow-xs'
                          : 'bg-white/60 border-slate-200/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Manejado por onClick contenedor
                          className="w-4 h-4 rounded text-[#00687a] accent-[#00687a]"
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block leading-tight">
                            {esp.nombre}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Bs. {esp.precio_consulta || '70.00'}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => handleSetPrincipal(esp.id_especialidad, e)}
                          title={isPrincipal ? 'Especialidad Principal' : 'Hacer Principal'}
                          className={`p-1.5 rounded-lg transition ${
                            isPrincipal
                              ? 'bg-[#00687a] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isPrincipal ? 'fill-white' : ''}`} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.especialidades && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.especialidades[0]}</span>
            )}
            {errors.id_especialidad_principal && (
              <span className="text-[11px] text-rose-500 mt-1 block">
                {errors.id_especialidad_principal[0]}
              </span>
            )}
          </div>

          {/* Sección 3: Creación de Cuenta de Acceso (Solo en modo registro) */}
          {!isEditing && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer mb-3 select-none">
                <input
                  type="checkbox"
                  checked={formData.crear_cuenta_web}
                  onChange={(e) =>
                    setFormData({ ...formData, crear_cuenta_web: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#00687a] accent-[#00687a]"
                />
                <span className="text-xs font-bold text-slate-800">
                  Habilitar cuenta de acceso al sistema (Rol: MEDICO)
                </span>
              </label>

              {formData.crear_cuenta_web && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nombre de Usuario (Login) *
                    </label>
                    <input
                      type="text"
                      required={formData.crear_cuenta_web}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Ej. doctor.perez"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] transition"
                    />
                    {errors.username && (
                      <span className="text-[10px] text-rose-500 mt-1 block">{errors.username[0]}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Contraseña Temporal
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Admin123@"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#00687a]/40 focus:border-[#00687a] transition"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#00687a] to-[#007b90] hover:from-[#005564] hover:to-[#006a7c] shadow-md shadow-[#00687a]/20 transition cursor-pointer disabled:opacity-70 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Registrar Médico'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  X,
  User,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export function PatientFormModal({ isOpen, onClose, onSaved, initialPatient }) {
  const isEditing = Boolean(initialPatient);

  const [formData, setFormData] = useState({
    numero_documento: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: 'MASCULINO',
    tipo_sangre: 'O+',
    telefono: '',
    correo: '',
    direccion: '',
    notificaciones_activas: true,
    contacto_nombre: '',
    contacto_parentesco: 'Madre',
    contacto_telefono: '',
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [suggestedSpecialty, setSuggestedSpecialty] = useState(null);

  // Inicializar o limpiar campos
  useEffect(() => {
    if (initialPatient) {
      const contacto = initialPatient.contactos_emergencia?.[0] || {};
      setFormData({
        numero_documento: initialPatient.numero_documento || '',
        nombres: initialPatient.nombres || '',
        apellidos: initialPatient.apellidos || '',
        fecha_nacimiento: initialPatient.fecha_nacimiento ? initialPatient.fecha_nacimiento.substring(0, 10) : '',
        sexo: initialPatient.sexo || 'MASCULINO',
        tipo_sangre: initialPatient.tipo_sangre || 'O+',
        telefono: initialPatient.telefono || '',
        correo: initialPatient.correo || '',
        direccion: initialPatient.direccion || '',
        notificaciones_activas: initialPatient.notificaciones_activas ?? true,
        contacto_nombre: contacto.nombre || '',
        contacto_parentesco: contacto.parentesco || 'Familiar',
        contacto_telefono: contacto.telefono || '',
      });
    } else {
      setFormData({
        numero_documento: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        sexo: 'MASCULINO',
        tipo_sangre: 'O+',
        telefono: '',
        correo: '',
        direccion: '',
        notificaciones_activas: true,
        contacto_nombre: '',
        contacto_parentesco: 'Madre',
        contacto_telefono: '',
      });
    }
    setError(null);
  }, [initialPatient, isOpen]);

  // Cálculo en tiempo real de edad y especialidad recomendada
  useEffect(() => {
    if (!formData.fecha_nacimiento) {
      setCalculatedAge(null);
      setSuggestedSpecialty(null);
      return;
    }

    const birthDate = new Date(formData.fecha_nacimiento);
    if (isNaN(birthDate.getTime())) {
      setCalculatedAge(null);
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age >= 0) {
      setCalculatedAge(age);
      if (age < 15) {
        setSuggestedSpecialty({ grupo: 'Pediátrico (<15a)', especialidad: 'Pediatría', color: 'sky' });
      } else if (age >= 60) {
        setSuggestedSpecialty({ grupo: 'Geriátrico (≥60a)', especialidad: 'Geriatría / Medicina General', color: 'indigo' });
      } else {
        setSuggestedSpecialty({ grupo: 'Adulto (15-59a)', especialidad: 'Medicina General', color: 'emerald' });
      }
    } else {
      setCalculatedAge(null);
      setSuggestedSpecialty(null);
    }
  }, [formData.fecha_nacimiento]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.numero_documento.trim()) {
      setError('El documento de identidad (CI) es obligatorio.');
      return;
    }
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setError('Nombres y apellidos son requeridos.');
      return;
    }
    if (!formData.fecha_nacimiento) {
      setError('La fecha de nacimiento es obligatoria.');
      return;
    }

    setSubmitting(true);
    try {
      await onSaved(formData, initialPatient?.id_paciente);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar los datos del paciente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl my-8 overflow-hidden transition-all animate-in fade-in zoom-in-95">
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00687a]/10 text-[#00687a]">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 text-lg">
                {isEditing ? 'Editar Ficha del Paciente' : 'Registrar Nuevo Paciente'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Historia Clínica: ${initialPatient.numero_historia} — CI: ${initialPatient.numero_documento}`
                  : 'Admisión clínica institucional (RF02 — Asignación correlativa de HC)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECCIÓN 1: Identificación y Datos Clínicos Demográficos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-[#00687a]" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Identificación y Demografía (RF02)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Documento de Identidad CI */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cédula de Identidad (CI) *
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="numero_documento"
                    value={formData.numero_documento}
                    onChange={handleChange}
                    placeholder="Ej. 12458901"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* Nombres */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  placeholder="Ej. Mateo Andrés"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                  required
                />
              </div>

              {/* Apellidos */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Ej. Morales Choque"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                  required
                />
              </div>

              {/* Sexo */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sexo Biológico *
                </label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-medium"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>

              {/* Fecha de Nacimiento */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Tipo de Sangre */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grupo Sanguíneo y Factor Rh
                </label>
                <select
                  name="tipo_sangre"
                  value={formData.tipo_sangre}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono font-medium"
                >
                  <option value="O+">O Positivo (O+)</option>
                  <option value="O-">O Negativo (O-)</option>
                  <option value="A+">A Positivo (A+)</option>
                  <option value="A-">A Negativo (A-)</option>
                  <option value="B+">B Positivo (B+)</option>
                  <option value="B-">B Negativo (B-)</option>
                  <option value="AB+">AB Positivo (AB+)</option>
                  <option value="AB-">AB Negativo (AB-)</option>
                </select>
              </div>
            </div>

            {/* Asistente visual de edad y rango etario */}
            {calculatedAge !== null && suggestedSpecialty && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Edad calculada:</span>
                  <span className="font-mono font-bold text-[#00687a] bg-[#00687a]/10 px-2 py-0.5 rounded-lg">
                    {calculatedAge} {calculatedAge === 1 ? 'año' : 'años'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                    suggestedSpecialty.color === 'sky'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : suggestedSpecialty.color === 'indigo'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {suggestedSpecialty.grupo}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500 hidden sm:block">
                  Sugerencia RF04: <span className="font-semibold text-slate-800">{suggestedSpecialty.especialidad}</span>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: Contacto y Localización */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Phone className="w-4 h-4 text-[#00687a]" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Canales de Contacto
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Teléfono */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / Celular
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej. 77123401"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="paciente@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                  />
                </div>
              </div>

              {/* Dirección Domiciliaria */}
              <div className="sm:col-span-12">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección Domiciliaria
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Barrio, Avenida, Calle y Número de Domicilio"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Contacto de Emergencia */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Users className="w-4 h-4 text-[#00687a]" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Contacto de Emergencia Institucional
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Nombre de Contacto */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Familiar o Responsable
                </label>
                <input
                  type="text"
                  name="contacto_nombre"
                  value={formData.contacto_nombre}
                  onChange={handleChange}
                  placeholder="Ej. Andrea Choque de Morales"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                />
              </div>

              {/* Parentesco */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parentesco
                </label>
                <input
                  type="text"
                  name="contacto_parentesco"
                  value={formData.contacto_parentesco}
                  onChange={handleChange}
                  placeholder="Madre, Esposo, Hijo"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20"
                />
              </div>

              {/* Teléfono de Emergencia */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono de Emergencia
                </label>
                <input
                  type="tel"
                  name="contacto_telefono"
                  value={formData.contacto_telefono}
                  onChange={handleChange}
                  placeholder="Ej. 77123499"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a]/20 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00687a] hover:bg-[#004d5a] rounded-xl shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Paciente'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

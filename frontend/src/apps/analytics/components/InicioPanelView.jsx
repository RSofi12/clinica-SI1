import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  History,
  UserCheck,
  Calendar,
  Clock,
  Clock3,
  Stethoscope,
  FileText,
  Pill,
  Sparkles,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  User,
  Activity,
  HeartPulse,
  CalendarCheck2,
  CreditCard,
  Layers,
  FolderOpen,
} from 'lucide-react';

/**
 * Vista de Inicio del Panel por Rol (CU01 / CU24 / Portal Ecosistema)
 * Inspirada en el diseño institucional con saludo contextual, ficha de cuenta y accesos rápidos a los CUs.
 */
export default function InicioPanelView({ user, role, onNavigate, onOpenSecurityPolicies }) {
  const [saludo, setSaludo] = useState('Buenos días,');
  const [fechaActual, setFechaActual] = useState('');
  const [ultimoAcceso, setUltimoAcceso] = useState('');

  useEffect(() => {
    // 1. Determinar saludo según la hora local de Bolivia
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      setSaludo('Buenos días,');
    } else if (hora >= 12 && hora < 19) {
      setSaludo('Buenas tardes,');
    } else {
      setSaludo('Buenas noches,');
    }

    // 2. Formatear fecha actual en español
    try {
      const fecha = new Intl.DateTimeFormat('es-BO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/La_Paz',
      }).format(new Date());
      setFechaActual(fecha);

      const horaAcceso = new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/La_Paz',
      }).format(new Date());
      setUltimoAcceso(horaAcceso);
    } catch {
      setFechaActual('Hoy');
      setUltimoAcceso(new Date().toLocaleString());
    }
  }, []);

  // Iniciales del usuario para avatar
  const getInitials = () => {
    if (!user?.username) return 'US';
    const parts = user.username.split(/[._\s-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Rol legible y descripción
  const getRoleDetails = () => {
    switch (role) {
      case 'ADMIN':
        return {
          title: 'Administrador Sistema',
          badge: 'Admin del sistema',
          email: user?.email || 'admin@clinicalacruz.bo',
        };
      case 'MEDICO':
        return {
          title: 'Médico Especialista',
          badge: 'Plantel Médico Clínico',
          email: user?.email || `${user?.username || 'medico'}@clinicalacruz.bo`,
        };
      case 'RECEPCIONISTA':
        return {
          title: 'Recepcionista de Admisión',
          badge: 'Atención al Paciente',
          email: user?.email || `${user?.username || 'recepcion'}@clinicalacruz.bo`,
        };
      case 'PACIENTE':
        return {
          title: user?.nombre_completo || user?.username || 'Paciente Registrado',
          badge: 'Portal de Autoservicio',
          email: user?.email || `CI: ${user?.numero_documento || user?.username || '—'}`,
        };
      default:
        return {
          title: user?.username || 'Usuario',
          badge: role,
          email: user?.email || 'usuario@clinicalacruz.bo',
        };
    }
  };

  const roleDetails = getRoleDetails();

  // Definición de accesos rápidos por rol
  const getQuickAccessItems = () => {
    if (role === 'ADMIN') {
      return [
        {
          id: 'users',
          title: 'Usuarios',
          desc: 'Alta, permisos y estado del personal con acceso (CU02)',
          icon: Users,
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          badge: 'RBAC',
          action: () => onNavigate('users'),
        },
        {
          id: 'roles',
          title: 'Roles y Seguridad',
          desc: 'Agrupa permisos según el puesto en la clínica (CU02)',
          icon: Shield,
          iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
          badge: 'Seguridad',
          action: () => onNavigate('users'),
        },
        {
          id: 'permisos',
          title: 'Políticas de Bloqueo',
          desc: 'Intentos fallidos y minutos de castigo de acceso (CU01)',
          icon: Key,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          badge: 'Políticas',
          action: () => (onOpenSecurityPolicies ? onOpenSecurityPolicies() : onNavigate('users')),
        },
        {
          id: 'audit',
          title: 'Bitácora del Sistema',
          desc: 'Quién hizo qué y cuándo, para trazabilidad inmutable (CU03)',
          icon: History,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          badge: 'Inmutable',
          action: () => onNavigate('audit'),
        },
        {
          id: 'patients',
          title: 'Padrón de Pacientes',
          desc: 'Admisión clínica, correlativo HC y grupos etarios (CU04)',
          icon: UserCheck,
          iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
          badge: 'Admisión',
          action: () => onNavigate('patients'),
        },
        {
          id: 'doctors',
          title: 'Plantel Médico',
          desc: 'Especialistas colegiados y catálogo de especialidades (CU06/07)',
          icon: Stethoscope,
          iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
          badge: 'Plantel',
          action: () => onNavigate('doctors'),
        },
        {
          id: 'schedules',
          title: 'Horarios y Bloqueos',
          desc: 'Franjas semanales por médico, feriados y excepciones (CU08)',
          icon: Clock,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
          badge: 'Turnos',
          action: () => onNavigate('schedules'),
        },
        {
          id: 'appointments',
          title: 'Gestión de Citas',
          desc: 'Disponibilidad de turnos, programación y cancelación (CU09/10/12)',
          icon: Calendar,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
          badge: 'Citas',
          action: () => onNavigate('appointments'),
        },
        {
          id: 'voice-reports',
          title: 'Reportes por Voz con IA',
          desc: 'Asistente de inteligencia artificial para analítica clínica (CU23)',
          icon: Sparkles,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          badge: 'IA',
          action: () => onNavigate('voice-reports'),
        },
        {
          id: 'overview',
          title: 'Dashboard Clínico',
          desc: 'Indicadores ejecutivos, ocupación y distribución mensual (CU24)',
          icon: BarChart3,
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          badge: 'KPIs',
          action: () => onNavigate('overview'),
        },
        {
          id: 'stripe-admin',
          title: 'Pagos con Stripe (CU21)',
          desc: 'Supervisión de transacciones electrónicas en Sandbox',
          icon: CreditCard,
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'En desarrollo',
          action: () => {},
        },
        {
          id: 'examenes-admin',
          title: 'Órdenes de Exámenes (CU25)',
          desc: 'Catálogo de pruebas diagnósticas y laboratorio',
          icon: Layers,
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'En desarrollo',
          action: () => {},
        },
      ];
    }

    if (role === 'MEDICO') {
      return [
        {
          id: 'appointments',
          title: 'Mi Agenda Médica Diaria',
          desc: 'Pacientes citados para hoy y control de turnos en vivo (CU14)',
          icon: CalendarCheck2,
          iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
          badge: 'Hoy',
          action: () => onNavigate('appointments'),
        },
        {
          id: 'consultas',
          title: 'Consultas Médicas',
          desc: 'Registro de triaje, signos vitales, evolución y tratamiento (CU16)',
          icon: HeartPulse,
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          badge: 'Atención',
          action: () => onNavigate('consultas'),
        },
        {
          id: 'expediente',
          title: 'Expediente Clínico Digital',
          desc: 'Historial digital, diagnósticos CIE-10 y evolución histórica (CU19)',
          icon: FileText,
          iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
          badge: 'Historial',
          action: () => onNavigate('expediente'),
        },
        {
          id: 'recetas',
          title: 'Prescripciones y Recetas',
          desc: 'Emisión estructurada con fármacos, posología y archivo legal (CU18)',
          icon: Pill,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
          badge: 'Recetas',
          action: () => onNavigate('recetas'),
        },
        {
          id: 'voice-reports',
          title: 'Reportes por Voz con IA',
          desc: 'Dictado de comandos clínicos y filtros inteligentes (CU23)',
          icon: Sparkles,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          badge: 'IA Asistente',
          action: () => onNavigate('voice-reports'),
        },
        {
          id: 'overview',
          title: 'Dashboard de Rendimiento',
          desc: 'Resumen táctico de consultas atendidas y programación (CU24)',
          icon: BarChart3,
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          badge: 'Métricas',
          action: () => onNavigate('overview'),
        },
        {
          id: 'examenes',
          title: 'Órdenes de Exámenes (CU25)',
          desc: 'Solicitud de pruebas diagnósticas (laboratorio e imágenes)',
          icon: Layers,
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'En desarrollo',
          action: () => {},
        },
        {
          id: 'adjuntos',
          title: 'Documentos Adjuntos (CU26)',
          desc: 'Custodia de estudios y archivos clínicos externos',
          icon: FolderOpen,
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'En desarrollo',
          action: () => {},
        },
      ];
    }

    if (role === 'RECEPCIONISTA') {
      return [
        {
          id: 'patients',
          title: 'Padrón de Pacientes',
          desc: 'Admisión clínica de pacientes, correlativo HC y contacto (CU04)',
          icon: UserCheck,
          iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
          badge: 'Admisión',
          action: () => onNavigate('patients'),
        },
        {
          id: 'appointments',
          title: 'Programación de Citas',
          desc: 'Ver disponibilidad médica y programar turnos presenciales (CU09/10)',
          icon: Calendar,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
          badge: 'Agenda',
          action: () => onNavigate('appointments'),
        },
        {
          id: 'patient-accounts',
          title: 'Cuentas Web de Pacientes',
          desc: 'Habilitar acceso de autoservicio con CI desde el padrón (CU05)',
          icon: Key,
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          badge: 'Autoservicio',
          action: () => onNavigate('patients'),
        },
        {
          id: 'recetas',
          title: 'Recetario y Comprobantes',
          desc: 'Consulta y reimpresión de recetas emitidas a pacientes (CU18)',
          icon: Pill,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
          badge: 'Comprobantes',
          action: () => onNavigate('recetas'),
        },
        {
          id: 'overview',
          title: 'Dashboard Clínico',
          desc: 'Operativo diario y flujo de citas de la jornada (CU24)',
          icon: BarChart3,
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          badge: 'Operativo',
          action: () => onNavigate('overview'),
        },
        {
          id: 'asistencia',
          title: 'Control de Asistencia (CU13)',
          desc: 'Registro presencial de llegada del paciente a la sala',
          icon: CalendarCheck2,
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'En desarrollo',
          action: () => {},
        },
      ];
    }

    // PACIENTE
    return [
      {
        id: 'appointments-book',
        title: 'Reservar Cita Médica',
        desc: 'Buscar especialidad, médico y agendar turno sin filas (CU09/10)',
        icon: Calendar,
        iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
        badge: 'Agendar',
        action: () => onNavigate('appointments'),
      },
      {
        id: 'appointments',
        title: 'Mis Citas Médicas',
        desc: 'Consultar horarios programados o solicitar reprogramación (CU15)',
        icon: Clock,
        iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
        badge: 'Mis Citas',
        action: () => onNavigate('appointments'),
      },
      {
        id: 'expediente',
        title: 'Mi Expediente Digital',
        desc: 'Acceso confidencial a su historial médico y diagnósticos (CU19)',
        icon: FileText,
        iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
        badge: 'Solo lectura',
        action: () => onNavigate('expediente'),
      },
      {
        id: 'recetas',
        title: 'Mis Recetas Médicas',
        desc: 'Ver indicaciones farmacológicas y prescripciones vigentes (CU18)',
        icon: Pill,
        iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
        badge: 'Farmacia',
        action: () => onNavigate('recetas'),
      },
      {
        id: 'patient-profile',
        title: 'Mi Perfil de Paciente',
        desc: 'Actualizar teléfono, dirección y contactos de emergencia (CU05)',
        icon: User,
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        badge: 'Ficha',
        action: () => onNavigate('patient-profile'),
      },
      {
        id: 'stripe-paciente',
        title: 'Pago Online con Stripe (CU21)',
        desc: 'Abonar consulta con tarjeta tokenizada en modo prueba',
        icon: CreditCard,
        iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'En desarrollo',
        action: () => {},
      },
      {
        id: 'examenes-paciente',
        title: 'Órdenes de Exámenes (CU25)',
        desc: 'Consultar solicitudes de laboratorio e indicaciones clínicas',
        icon: Layers,
        iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'En desarrollo',
        action: () => {},
      },
    ];
  };

  const quickAccessItems = getQuickAccessItems();

  const handleCardClick = (item) => {
    if (item.badge === 'En desarrollo') {
      alert(`${item.title}\n\nFuncionalidad en desarrollo para la entrega final del Ciclo 2.`);
      return;
    }
    if (item.action) {
      item.action();
    }
  };

  return (
    <div className="space-y-8 animate-view-fade">
      {/* 1. SECCIÓN SUPERIOR: Saludo Contextual + Tarjeta de Cuenta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Banner de Bienvenida Institucional */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white via-slate-50/80 to-[#f4f8f9] rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {saludo}
            </span>
            <h1 className="font-serif-clinical font-normal text-3xl sm:text-4xl text-slate-900 tracking-tight mb-3">
              Inicio del panel
            </h1>

            {/* Fecha en vivo con ícono de reloj */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-700 mb-4">
              <Clock3 className="w-3.5 h-3.5 text-[#00687a]" />
              <span className="capitalize">{fechaActual}</span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              Estás en el espacio de trabajo del <strong className="text-slate-900 font-semibold">Centro Médico La Cruz</strong>. Elige un módulo en los accesos rápidos para continuar con tus actividades clínicas o administrativas.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-200/60 mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Servidor activo
            </span>
            <span className="text-slate-300">•</span>
            <span>Atención Primaria & Especialidades</span>
            <span className="text-slate-300">•</span>
            <span>Zona Horaria: America/La_Paz (UTC-4)</span>
          </div>
        </div>

        {/* Tarjeta TU CUENTA (Fiel a la 2da Imagen de Referencia) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              <User className="w-3.5 h-3.5" />
              <span>Tu Cuenta</span>
            </div>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00687a] to-[#004d5a] text-white flex items-center justify-center font-serif-clinical font-semibold text-lg shadow-sm">
                {getInitials()}
              </div>
              <div className="min-w-0">
                <h3 className="font-sans-clinical font-bold text-slate-900 text-base leading-tight truncate">
                  {roleDetails.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">{roleDetails.badge}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Activo</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Identificador / Correo</span>
                <span className="text-slate-700 font-medium truncate block">{roleDetails.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Último Acceso Registrado</span>
                <span className="text-slate-700 font-medium">{ultimoAcceso || 'Reciente'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Rol asignado:</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#00687a]/10 text-[#00687a] rounded-md">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN INFERIOR: ACCESOS RÁPIDOS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#00687a] rounded-full"></span>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Accesos Rápidos
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {quickAccessItems.length} accesos configurados para {role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            const isDev = item.badge === 'En desarrollo';

            return (
              <button
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group p-4 bg-white hover:bg-slate-50/90 rounded-2xl border transition-all duration-200 text-left flex items-start justify-between gap-3 cursor-pointer ${
                  isDev
                    ? 'border-amber-200/90 hover:border-amber-300'
                    : 'border-slate-200/90 hover:border-[#00687a]/30 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-sans-clinical font-bold text-slate-900 text-sm group-hover:text-[#00687a] transition-colors truncate">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      {item.desc}
                    </p>
                    {isDev && (
                      <span className="inline-block mt-2 text-[9px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded">
                        En desarrollo
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-300 group-hover:text-[#00687a] group-hover:translate-x-0.5 transition-all shrink-0 mt-2">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

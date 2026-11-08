import {
  Home,
  LayoutDashboard,
  User,
  UserCog,
  ShieldCheck,
  History,
  UserPlus,
  Stethoscope,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  Layers,
  Clock,
  Mic,
  ClipboardList,
  Pill,
  FileText,
  Paperclip,
  FileSpreadsheet,
} from 'lucide-react';
import logoWhite from '../assets/logo-full-white.svg';

export function Sidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  user,
  role,
  onLogout,
}) {
  const navItems = [
    {
      group: 'Principal',
      items: [
        {
          id: 'inicio',
          label: 'Inicio',
          subtitle: 'Espacio de trabajo y accesos rápidos',
          icon: Home,
          requiredRole: null, // Visible para todos
        },
        {
          id: 'overview',
          label: 'Dashboard Clínico',
          subtitle: 'Métricas, KPIs y operativo',
          icon: LayoutDashboard,
          requiredRole: null, // Visible para todos
        },
      ],
    },
    {
      group: 'Seguridad y Auditoría (P1)',
      items: [
        {
          id: 'users',
          label: 'Usuarios y Roles',
          subtitle: 'Control RBAC de operadores',
          tag: 'CU02 / RF01',
          icon: UserCog,
          requiredRole: 'ADMIN',
        },
        {
          id: 'audit',
          label: 'Bitácora del Sistema',
          subtitle: 'Trazabilidad de eventos',
          tag: 'CU03 / RF01',
          icon: History,
          requiredRole: 'ADMIN',
        },
      ],
    },
    {
      group: 'Recursos Clínicos (P2)',
      items: [
        {
          id: 'patient-profile',
          label: 'Mi Perfil de Paciente',
          subtitle: 'Autoservicio y contacto',
          tag: 'CU05 / §3.4',
          icon: User,
          requiredRoles: ['PACIENTE'],
        },
        {
          id: 'patients',
          label: 'Pacientes y Fichas',
          subtitle: 'Padrón clínico y admisiones',
          tag: 'CU04 / RF02',
          icon: UserPlus,
          requiredRoles: ['ADMIN', 'RECEPCIONISTA'],
        },
        {
          id: 'doctors',
          label: 'Médicos y Especialidades',
          subtitle: 'Plantel médico institucional',
          tag: 'CU06 / RF03',
          icon: Stethoscope,
          requiredRoles: ['ADMIN'],
        },
        {
          id: 'schedules',
          label: 'Horarios y Disponibilidad',
          subtitle: 'Franjas semanales y feriados',
          tag: 'CU08 / RF05',
          icon: Clock,
          requiredRoles: ['ADMIN'],
        },
        {
          id: 'appointments',
          label: role === 'MEDICO' ? 'Mi Agenda Médica' : role === 'PACIENTE' ? 'Mis Citas Médicas' : 'Disponibilidad y Citas',
          subtitle: role === 'MEDICO' ? 'Pacientes de la jornada e historial' : role === 'PACIENTE' ? 'Reserva y seguimiento' : 'Turnos libres y agenda',
          tag: role === 'MEDICO' ? 'CU14 / CU15' : role === 'PACIENTE' ? 'CU09 / CU10' : 'CU09, CU10 / RF06, RF07',
          icon: role === 'MEDICO' ? Stethoscope : Calendar,
          requiredRoles: ['ADMIN', 'RECEPCIONISTA', 'MEDICO', 'PACIENTE'],
        },
      ],
    },
        {
      group: 'Historial Clínico y Consultas (P4)',
      items: [
        {
          id: 'expediente',
          label: role === 'PACIENTE' ? 'Mi Expediente Clínico' : 'Expediente Clínico Digital',
          subtitle: role === 'PACIENTE' ? 'Historial, recetas y antecedentes' : 'Visor integral de historias clínicas',
          tag: 'CU19 / §3.4',
          icon: FileText,
          requiredRoles: ['ADMIN', 'MEDICO', 'PACIENTE'],
        },
        {
          id: 'consultas',
          label: 'Consultas Médicas y Triaje',
          subtitle: 'Atención clínica y diagnósticos',
          tag: 'CU16 / Extra',
          icon: ClipboardList,
          requiredRoles: ['ADMIN', 'MEDICO', 'PACIENTE'],
        },
        {
          id: 'recetas',
          label: 'Prescripciones y Recetas',
          subtitle: 'Recetario digital y posología',
          tag: 'CU18 / Extra',
          icon: Pill,
          requiredRoles: ['ADMIN', 'MEDICO', 'PACIENTE'],
        },
      ],
    },
    {
      group: 'Reportes y Analítica (P6)',
      items: [
        {
          id: 'dynamic-reports',
          label: 'Reportes Dinámicos',
          subtitle: '7 reportes gerenciales con filtros',
          tag: 'CU22 / RF13',
          icon: FileSpreadsheet,
          requiredRoles: ['ADMIN', 'RECEPCIONISTA', 'MEDICO'],
        },
        {
          id: 'voice-reports',
          label: 'Reportes por Voz (IA)',
          subtitle: 'Consultas dictadas con IA',
          tag: 'CU23 / Extra',
          icon: Mic,
          requiredRoles: ['ADMIN', 'MEDICO'],
        },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop para dispositivos móviles */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Barra Lateral / Sidebar (Diseño Editorial Aqua Profundo) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#003844] border-r border-[#002830] text-white shadow-xl transition-all duration-300 ease-in-out md:sticky md:top-0 h-screen max-h-screen shrink-0 print:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-72`}
      >
        {/* Cabecera del Sidebar (Logo Blanco + Nombre de la Clínica) */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div
            onClick={() => onSelectTab('inicio')}
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${
              isCollapsed ? 'md:justify-center md:w-full' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <img src={logoWhite} alt="Centro Médico La Cruz" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h1 className="text-base font-serif-clinical font-semibold text-white leading-tight tracking-tight truncate">
                  Centro Médico
                </h1>
                <p className="text-[11px] font-sans-clinical font-medium text-[#70cbff] truncate">La Cruz — Vida Salud</p>
              </div>
            )}
          </div>

          {/* Botón cerrar en móvil */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 md:hidden cursor-pointer"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegación por Grupos */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-track-transparent">
          {navItems.map((group, groupIdx) => {
            // Filtrar items por rol
            const visibleItems = group.items.filter((item) => {
              if (item.requiredRoles) {
                return item.requiredRoles.includes(role);
              }
              return !item.requiredRole || item.requiredRole === role;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1.5">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold text-cyan-200/50 uppercase tracking-wider">
                    {group.group}
                  </p>
                )}
                {isCollapsed && groupIdx > 0 && (
                  <div className="border-t border-white/10 my-2 mx-2" />
                )}

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isDisabled = item.disabled;

                    return (
                      <button
                        key={item.id}
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            onSelectTab(item.id);
                            if (window.innerWidth < 768) {
                              onCloseMobile();
                            }
                          }
                        }}
                        title={isCollapsed ? `${item.label} ${item.tag ? `(${item.tag})` : ''}` : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition group cursor-pointer relative ${
                          isActive
                            ? 'bg-[#00687a] text-white shadow-md shadow-black/20 ring-1 ring-cyan-300/30'
                            : isDisabled
                            ? 'text-cyan-200/30 opacity-40 cursor-not-allowed hover:bg-transparent'
                            : 'text-cyan-100/75 hover:text-white hover:bg-white/10'
                        } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-white' : 'text-cyan-200/70 group-hover:text-white'
                          } ${isCollapsed ? 'w-5 h-5' : ''}`}
                        />

                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-serif-clinical font-medium text-sm tracking-tight truncate">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/15 text-cyan-200 border border-white/15 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className={`text-[10px] font-sans-clinical truncate ${isActive ? 'text-cyan-100/80' : 'text-cyan-200/40 group-hover:text-cyan-100/70'}`}>
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Indicador sutil para collapsed view */}
                        {isCollapsed && isActive && (
                          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#70cbff] rounded-l-full shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie del Sidebar: Perfil de Usuario y Colapso */}
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-2 shrink-0">
          {/* Card de Usuario */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs text-white ${
              isCollapsed ? 'md:justify-center md:p-2' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/15 text-cyan-200 flex items-center justify-center font-bold text-xs shrink-0 border border-white/20">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-[#00687a] text-cyan-100 border border-cyan-400/30 rounded-sm">
                  {role}
                </span>
              </div>
            )}
          </div>

          {/* Botones de acción inferior: Colapsar en escritorio y Salir */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleCollapse}
              className={`hidden md:flex items-center justify-center p-2 rounded-xl border border-white/15 bg-white/5 text-cyan-200 hover:text-white hover:bg-white/15 transition cursor-pointer ${
                isCollapsed ? 'w-full' : 'flex-1'
              }`}
              title={isCollapsed ? 'Expandir barra lateral' : 'Comprimir barra lateral'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isCollapsed && <span className="text-[11px] font-medium ml-1">Comprimir</span>}
            </button>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center p-2 px-3 rounded-xl border border-rose-400/30 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 hover:text-white transition text-[11px] font-semibold cursor-pointer shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="ml-1">Salir</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

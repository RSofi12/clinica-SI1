import {
  LayoutDashboard,
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
} from 'lucide-react';
import logoColor from '../assets/logo-color.svg';

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
          id: 'overview',
          label: 'Panel General',
          subtitle: 'Métricas y visión general',
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
          disabled: true,
          badge: 'Próximo',
        },
      ],
    },
    {
      group: 'Gestión Clínica (P2 - P4)',
      items: [
        {
          id: 'patients',
          label: 'Pacientes y Fichas',
          subtitle: 'Admisión y registro',
          tag: 'CU04 / RF02',
          icon: UserPlus,
          disabled: true,
          badge: 'Ciclo 2',
        },
        {
          id: 'doctors',
          label: 'Médicos y Especialidades',
          subtitle: 'Plantel médico institucional',
          tag: 'CU08 / RF04',
          icon: Stethoscope,
          disabled: true,
          badge: 'Ciclo 2',
        },
        {
          id: 'appointments',
          label: 'Agenda y Citas',
          subtitle: 'Reserva anti-colisión',
          tag: 'CU10 / RF07',
          icon: Calendar,
          disabled: true,
          badge: 'Ciclo 2',
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

      {/* Barra Lateral / Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/90 shadow-xs transition-all duration-300 ease-in-out md:static ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-72 h-screen`}
      >
        {/* Cabecera del Sidebar (Logo + Toggle) */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div
            onClick={() => onSelectTab('overview')}
            className={`flex items-center gap-3 cursor-pointer overflow-hidden ${
              isCollapsed ? 'md:justify-center md:w-full' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#00687a]/10 border border-[#00687a]/20 p-2 flex items-center justify-center shrink-0">
              <img src={logoColor} alt="Centro Médico La Cruz" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <h1 className="text-sm font-montserrat font-bold text-slate-900 leading-tight truncate">
                  Centro Médico
                </h1>
                <p className="text-[11px] font-semibold text-[#00687a] truncate">La Cruz — Vida Salud</p>
              </div>
            )}
          </div>

          {/* Botón cerrar en móvil */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegación por Grupos */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {navItems.map((group, groupIdx) => {
            // Filtrar items por rol
            const visibleItems = group.items.filter(
              (item) => !item.requiredRole || item.requiredRole === role
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1.5">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.group}
                  </p>
                )}
                {isCollapsed && groupIdx > 0 && (
                  <div className="border-t border-slate-100 my-2 mx-2" />
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition group cursor-pointer relative ${
                          isActive
                            ? 'bg-[#00687a] text-white shadow-xs font-semibold'
                            : isDisabled
                            ? 'text-slate-400 opacity-60 cursor-not-allowed hover:bg-transparent'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                          } ${isCollapsed ? 'w-5 h-5' : ''}`}
                        />

                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && !isActive && (
                              <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                            )}
                          </div>
                        )}

                        {/* Indicador sutil para collapsed view */}
                        {isCollapsed && isActive && (
                          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00687a] rounded-l-full" />
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
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
          {/* Card de Usuario */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 ${
              isCollapsed ? 'md:justify-center md:p-2' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#00687a]/10 text-[#00687a] flex items-center justify-center font-bold text-xs shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.username}</p>
                <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-[#00687a] text-white rounded-sm">
                  {role}
                </span>
              </div>
            )}
          </div>

          {/* Botones de acción inferior: Colapsar en escritorio y Salir */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleCollapse}
              className={`hidden md:flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer ${
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
                className="flex items-center justify-center p-2 px-3 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 transition text-[11px] font-semibold cursor-pointer shrink-0"
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

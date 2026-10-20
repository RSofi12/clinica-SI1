import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UsersManager } from './apps/security/components/UsersManager';
import { AuditLogViewer } from './apps/security/components/AuditLogViewer';
import { Sidebar } from './components/Sidebar';
import {
  Stethoscope,
  Calendar,
  Users,
  Activity,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  LogOut,
  Shield,
  LayoutDashboard,
  UserCog,
  Menu,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function App() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [dashboardTab, setDashboardTab] = useState('overview'); // 'overview' | 'users'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Si no está autenticado y pide dashboard, fuerza ir a login
  if (!isAuthenticated && currentView === 'dashboard') {
    return (
      <LoginPage
        onNavigateHome={() => setCurrentView('home')}
        onLoginSuccess={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'home' && !isAuthenticated) {
    return <HomePage onNavigateLogin={() => setCurrentView('login')} />;
  }

  if (currentView === 'login' && !isAuthenticated) {
    return (
      <LoginPage
        onNavigateHome={() => setCurrentView('home')}
        onLoginSuccess={() => setCurrentView('dashboard')}
        onNavigateForgotPassword={() => setCurrentView('forgot-password')}
      />
    );
  }

  if (currentView === 'forgot-password' && !isAuthenticated) {
    return (
      <ForgotPasswordPage
        onNavigateLogin={() => setCurrentView('login')}
      />
    );
  }

  // Nombre de sección activa para el breadcrumb superior
  const getSectionTitle = () => {
    switch (dashboardTab) {
      case 'users':
        return 'Gestión de Usuarios y Roles (CU02)';
      case 'audit':
        return 'Bitácora de Auditoría del Sistema (CU03)';
      case 'overview':
      default:
        return 'Panel General';
    }
  };

  // Vista de Dashboard Clínico con Barra Lateral Izquierda Responsiva y Colapsable
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-hidden">
      {/* 1. Barra Lateral a la Izquierda (Sidebar) */}
      <Sidebar
        activeTab={dashboardTab}
        onSelectTab={setDashboardTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        user={user}
        role={role}
        onLogout={async () => {
          await logout();
          setCurrentView('home');
        }}
      />

      {/* 2. Área de Contenido Principal a la Derecha */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Barra Superior Limpia (Header) */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs h-16">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Izquierda: Botón Hamburguesa Móvil + Botón Colapso Desktop + Breadcrumb */}
            <div className="flex items-center gap-3">
              {/* Botón hamburguesa para móvil */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden cursor-pointer"
                title="Abrir menú de navegación"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Botón de toggle colapso rápido para escritorio */}
              <button
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden md:flex p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Comprimir barra lateral'}
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Ruta / Migas de Pan (Breadcrumb) */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  onClick={() => setDashboardTab('overview')}
                  className="font-medium text-slate-500 hover:text-slate-800 cursor-pointer hidden sm:inline"
                >
                  Clínica La Cruz
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
                <span className="font-montserrat font-bold text-slate-900">
                  {getSectionTitle()}
                </span>
              </div>
            </div>

            {/* Derecha: Badge de Usuario y Salir */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl border border-slate-200">
                <Shield className="w-3.5 h-3.5 text-[#00687a]" />
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{user?.username}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#00687a] text-white rounded-md">
                  {role}
                </span>
              </div>

              <button
                onClick={async () => {
                  await logout();
                  setCurrentView('home');
                }}
                title="Cerrar Sesión"
                className="flex items-center gap-1.5 p-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. Contenedor de la Vista Activa */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {dashboardTab === 'users' && role === 'ADMIN' ? (
            <UsersManager />
          ) : dashboardTab === 'audit' && role === 'ADMIN' ? (
            <AuditLogViewer />
          ) : (
            <div className="space-y-8">
              {/* Banner de Bienvenida */}
              <div className="bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-[#00687a]/15">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-montserrat font-bold text-2xl sm:text-3xl mb-2">
                      Bienvenido, {user?.username || 'Usuario'}
                    </h2>
                    <p className="text-cyan-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                      Sesión activa bajo el rol de <span className="font-bold underline">{role}</span> en el Centro Médico La Cruz.
                    </p>
                  </div>
                  <div className="hidden md:block p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                    <Stethoscope className="w-10 h-10 text-cyan-200" />
                  </div>
                </div>
              </div>

              {/* Tarjetas informativas de roles */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="font-montserrat font-bold text-slate-800 text-base mb-2">
                  Módulos autorizados para su rol:
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  El sistema de permisos RBAC del Paquete 1 valida las acciones permitidas según su perfil institucional.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-bold text-[#00687a] uppercase">CU01: Autenticación</span>
                    <p className="text-xs text-slate-600 mt-1">Sesión activa con hash seguro y registro en bitácora.</p>
                  </div>

                  <div
                    onClick={() => role === 'ADMIN' && setDashboardTab('users')}
                    className={`p-4 rounded-xl border transition ${
                      role === 'ADMIN'
                        ? 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50 hover:shadow-xs cursor-pointer'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase">CU02: Usuarios y Roles</span>
                      {role === 'ADMIN' && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
                          Abrir módulo →
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Control de operadores, asignación de roles y bajas lógicas (RF01).
                    </p>
                  </div>

                  <div
                    onClick={() => role === 'ADMIN' && setDashboardTab('audit')}
                    className={`p-4 rounded-xl border transition ${
                      role === 'ADMIN'
                        ? 'bg-cyan-50/50 border-cyan-200/80 hover:bg-cyan-50 hover:shadow-xs cursor-pointer'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-800 uppercase">CU03: Bitácora Activa</span>
                      {role === 'ADMIN' && (
                        <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-100/60 px-1.5 py-0.5 rounded-md">
                          Consultar →
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Trazabilidad inmutable de accesos con IP, usuario, acción y fecha.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

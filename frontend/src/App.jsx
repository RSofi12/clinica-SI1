import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UsersManager } from './apps/security/components/UsersManager';
import { AuditLogViewer } from './apps/security/components/AuditLogViewer';
import { SecurityPolicyModal } from './apps/security/components/SecurityPolicyModal';
import { PatientsManager } from './apps/clinical-resources/components/PatientsManager';
import { PatientProfileView } from './apps/clinical-resources/components/PatientProfileView';
import { ActivatePatientModal } from './apps/clinical-resources/components/ActivatePatientModal';
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
  ShieldAlert,
  HeartPulse,
  LayoutDashboard,
  UserCog,
  Menu,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

function getInitialView() {
  const path = window.location.pathname.toLowerCase();
  if (path === '/login') return 'login';
  if (path === '/forgot-password') return 'forgot-password';
  if (path === '/dashboard') return 'dashboard';
  return 'home';
}

export default function App() {
  const { user, role, isAuthenticated, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState(getInitialView);
  const [dashboardTab, setDashboardTab] = useState('overview'); // 'overview' | 'users'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isActivatePatientOpen, setIsActivatePatientOpen] = useState(false);

  // Sincronizar cambios de URL con el estado interno
  const navigateTo = (view) => {
    setCurrentView(view);
    const targetPath = view === 'home' ? '/' : `/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Si se detecta autenticación activa y estaba en login, ir a dashboard
  useEffect(() => {
    if (isAuthenticated && currentView === 'login') {
      navigateTo('dashboard');
    }
  }, [isAuthenticated, currentView]);

  // Pantalla de carga mientras se verifica sesión inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-cyan-200 font-sans">
        <div className="w-10 h-10 border-4 border-[#00687a]/40 border-t-[#70cbff] rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wider text-slate-300">
          Cargando Centro Médico La Cruz...
        </span>
      </div>
    );
  }

  // Si no está autenticado y pide dashboard, fuerza ir a login
  if (!isAuthenticated && currentView === 'dashboard') {
    return (
      <>
        <LoginPage
          onNavigateHome={() => navigateTo('home')}
          onLoginSuccess={() => navigateTo('dashboard')}
          onOpenActivatePatient={() => setIsActivatePatientOpen(true)}
        />
        <ActivatePatientModal
          isOpen={isActivatePatientOpen}
          onClose={() => setIsActivatePatientOpen(false)}
          onActivated={() => setIsActivatePatientOpen(false)}
        />
      </>
    );
  }

  if (currentView === 'home' && !isAuthenticated) {
    return (
      <>
        <HomePage
          onNavigateLogin={() => navigateTo('login')}
          onOpenActivatePatient={() => setIsActivatePatientOpen(true)}
        />
        <ActivatePatientModal
          isOpen={isActivatePatientOpen}
          onClose={() => setIsActivatePatientOpen(false)}
          onActivated={() => {
            setIsActivatePatientOpen(false);
            navigateTo('login');
          }}
        />
      </>
    );
  }

  if (currentView === 'login' && !isAuthenticated) {
    return (
      <>
        <LoginPage
          onNavigateHome={() => navigateTo('home')}
          onLoginSuccess={() => navigateTo('dashboard')}
          onNavigateForgotPassword={() => navigateTo('forgot-password')}
          onOpenActivatePatient={() => setIsActivatePatientOpen(true)}
        />
        <ActivatePatientModal
          isOpen={isActivatePatientOpen}
          onClose={() => setIsActivatePatientOpen(false)}
          onActivated={() => setIsActivatePatientOpen(false)}
        />
      </>
    );
  }

  if (currentView === 'forgot-password' && !isAuthenticated) {
    return (
      <ForgotPasswordPage
        onNavigateLogin={() => navigateTo('login')}
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
      case 'patients':
        return 'Gestión de Pacientes (CU04)';
      case 'patient-profile':
        return 'Mi Perfil de Paciente (CU05)';
      case 'overview':
      default:
        return 'Panel General';
    }
  };

  // Vista de Dashboard Clínico con Barra Lateral Fija y Contenido con Scroll Independiente a la Derecha
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* 1. Barra Lateral a la Izquierda (Sidebar fija con su propio scroll) */}
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
          navigateTo('home');
        }}
      />

      {/* 2. Área de Contenido Principal a la Derecha (con scroll vertical independiente) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Barra Superior Limpia (Header fijo) */}
        <header className="border-b border-slate-200 bg-white shrink-0 z-30 shadow-xs h-16">
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

        {/* 3. Contenedor de la Vista Activa con Scroll Independiente a la Derecha */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-transparent">
          {dashboardTab === 'users' && role === 'ADMIN' ? (
            <UsersManager />
          ) : dashboardTab === 'audit' && role === 'ADMIN' ? (
            <AuditLogViewer />
          ) : dashboardTab === 'patients' && ['ADMIN', 'RECEPCIONISTA', 'MEDICO'].includes(role) ? (
            <PatientsManager />
          ) : dashboardTab === 'patient-profile' ? (
            <PatientProfileView />
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
                  El sistema de permisos RBAC valida las acciones permitidas según su perfil institucional.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tarjeta especial para Paciente Autenticado */}
                  {role === 'PACIENTE' && (
                    <div
                      onClick={() => setDashboardTab('patient-profile')}
                      className="p-4 rounded-xl border bg-emerald-50/70 border-emerald-300 hover:bg-emerald-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase">CU05: Mi Perfil</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                            Gestionar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Consulte su historial, actualice sus canales de contacto y contacto de emergencia (§3.4).
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#00687a] uppercase">CU01: Autenticación</span>
                        {role === 'ADMIN' && (
                          <button
                            onClick={() => setIsPolicyModalOpen(true)}
                            className="text-[10px] font-semibold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1"
                            title="Editar intentos fallidos y minutos de bloqueo de seguridad"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Configurar Bloqueo →</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Sesión activa con hash seguro, bloqueo tras 3 intentos y registro en bitácora.
                      </p>
                    </div>
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

                  <div
                    onClick={() => ['ADMIN', 'RECEPCIONISTA', 'MEDICO'].includes(role) && setDashboardTab('patients')}
                    className={`p-4 rounded-xl border transition ${
                      ['ADMIN', 'RECEPCIONISTA', 'MEDICO'].includes(role)
                        ? 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 hover:shadow-xs cursor-pointer'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 uppercase">CU04: Pacientes</span>
                      {['ADMIN', 'RECEPCIONISTA', 'MEDICO'].includes(role) && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded-md">
                          Gestionar →
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Admisión clínica, correlativo HC, grupos etarios y bajas lógicas (RF02).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Políticas de Bloqueo (Acceso rápido Administrador) */}
      <SecurityPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />
    </div>
  );
}

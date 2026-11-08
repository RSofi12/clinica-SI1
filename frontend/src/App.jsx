import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UsersManager } from './apps/security/components/UsersManager';
import { AuditLogViewer } from './apps/security/components/AuditLogViewer';
import { SecurityPolicyModal } from './apps/security/components/SecurityPolicyModal';
import { PatientsManager } from './apps/clinical-resources/components/PatientsManager';
import { DoctorsManager } from './apps/clinical-resources/components/DoctorsManager';
import { SchedulesManager } from './apps/clinical-resources/components/SchedulesManager';
import { AppointmentsManager } from './apps/appointments/components/AppointmentsManager';
import { VoiceReportAssistant } from './apps/analytics/components/VoiceReportAssistant';
import { DynamicReportsView } from './apps/analytics/components/DynamicReportsView';
import { ConsultasManager } from './apps/medical-records/components/ConsultasManager';
import { RecetasManager } from './apps/medical-records/components/RecetasManager';
import { ExpedienteClinicoView } from './apps/medical-records/components/ExpedienteClinicoView';
import InicioPanelView from './apps/analytics/components/InicioPanelView';
import ClinicalDashboardView from './apps/analytics/components/ClinicalDashboardView';

import { PatientProfileView } from './apps/clinical-resources/components/PatientProfileView';
import { ActivatePatientModal } from './apps/clinical-resources/components/ActivatePatientModal';
import { Sidebar } from './components/Sidebar';
import { NotificationsDropdown } from './components/NotificationsDropdown';
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
  const [dashboardTab, setDashboardTab] = useState('inicio'); // 'inicio' | 'overview' | 'users'
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

  // Si no está autenticado y se ingresa a dashboard, sincronizar URL a login
  useEffect(() => {
    if (!loading && !isAuthenticated && currentView === 'dashboard') {
      navigateTo('login');
    }
  }, [loading, isAuthenticated, currentView]);

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

  if (currentView === 'home' && !isAuthenticated) {
    return (
      <>
        <div key="home-view" className="animate-view-fade">
          <HomePage
            onNavigateLogin={() => navigateTo('login')}
            onOpenActivatePatient={() => setIsActivatePatientOpen(true)}
          />
        </div>
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
        <div key="login-view" className="animate-view-fade">
          <LoginPage
            onNavigateHome={() => navigateTo('home')}
            onLoginSuccess={() => navigateTo('dashboard')}
            onNavigateForgotPassword={() => navigateTo('forgot-password')}
            onOpenActivatePatient={() => setIsActivatePatientOpen(true)}
          />
        </div>
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
      <div key="forgot-view" className="animate-view-fade">
        <ForgotPasswordPage
          onNavigateLogin={() => navigateTo('login')}
        />
      </div>
    );
  }

  // Nombre de sección activa para el breadcrumb superior (con validación de rol)
  const getSectionTitle = () => {
    switch (dashboardTab) {
      case 'inicio':
        return 'Inicio';
      case 'overview':
        return 'Dashboard Clínico';
      case 'users':
        return role === 'ADMIN' ? 'Gestión de Usuarios y Roles (CU02)' : 'Inicio';
      case 'audit':
        return role === 'ADMIN' ? 'Bitácora de Auditoría del Sistema (CU03)' : 'Inicio';
      case 'patients':
        return ['ADMIN', 'RECEPCIONISTA'].includes(role)
          ? 'Gestión de Pacientes y Cuentas Web (CU04 / CU05)'
          : 'Inicio';
      case 'doctors':
        return role === 'ADMIN' ? 'Plantel Médico y Especialidades (CU06 / CU07)' : 'Inicio';
      case 'schedules':
        return role === 'ADMIN' ? 'Gestión de Horarios y Disponibilidad Médica (CU08)' : 'Inicio';
      case 'dynamic-reports':
        return ['ADMIN', 'RECEPCIONISTA', 'MEDICO'].includes(role)
          ? 'Generador de Reportes con Filtros Dinámicos (CU22 / RF13)'
          : 'Inicio';
      case 'voice-reports':
        return ['ADMIN', 'MEDICO'].includes(role)
          ? 'Asistente de Reportes por Voz con IA (CU23)'
          : 'Inicio';
      case 'appointments':
        return role === 'MEDICO'
          ? 'Mi Agenda Médica Diaria (CU14 / CU15)'
          : role === 'PACIENTE'
          ? 'Mis Citas Médicas'
          : 'Consulta de Disponibilidad de Horarios y Citas (CU09 / CU10)';
      case 'patient-profile':
        return role === 'PACIENTE' ? 'Mi Perfil de Paciente (CU05)' : 'Inicio';
      default:
        return 'Inicio';
    }
  };

  // Vista de Dashboard Clínico con Barra Lateral Fija y Contenido con Scroll Independiente a la Derecha
  return (
    <div key="dashboard-view" className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans animate-view-fade print:h-auto print:w-auto print:overflow-visible print:bg-white">
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
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden print:h-auto print:overflow-visible">
        {/* Barra Superior Limpia (Header fijo) */}
        <header className="border-b border-slate-200 bg-white shrink-0 z-30 shadow-xs h-16 print:hidden">
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
                  onClick={() => setDashboardTab('inicio')}
                  className="font-medium text-slate-500 hover:text-slate-800 cursor-pointer hidden sm:inline"
                >
                  Clínica La Cruz
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
                <span className="font-serif-clinical font-semibold text-slate-900 text-sm tracking-tight">
                  {getSectionTitle()}
                </span>
              </div>
            </div>

            {/* Derecha: Notificaciones, Badge de Usuario y Salir */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Precursor UI Notificaciones Push (CU20/CU21) */}
              <NotificationsDropdown />

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-transparent print:p-0 print:m-0 print:max-w-none print:overflow-visible print:h-auto">
          <div key={dashboardTab} className="animate-view-fade">
            {dashboardTab === 'inicio' ? (
              <InicioPanelView
                user={user}
                role={role}
                onNavigate={setDashboardTab}
                onOpenSecurityPolicies={() => setIsPolicyModalOpen(true)}
              />
            ) : dashboardTab === 'users' && role === 'ADMIN' ? (
              <UsersManager />
            ) : dashboardTab === 'audit' && role === 'ADMIN' ? (
              <AuditLogViewer />
            ) : dashboardTab === 'patients' && ['ADMIN', 'RECEPCIONISTA'].includes(role) ? (
              <PatientsManager />
            ) : dashboardTab === 'doctors' && role === 'ADMIN' ? (
              <DoctorsManager />
            ) : dashboardTab === 'schedules' && role === 'ADMIN' ? (
              <SchedulesManager />
            ) : dashboardTab === 'appointments' ? (
              <AppointmentsManager />
            ) : dashboardTab === 'expediente' && ['ADMIN', 'MEDICO', 'PACIENTE'].includes(role) ? (
              <ExpedienteClinicoView />
            ) : dashboardTab === 'consultas' && ['ADMIN', 'MEDICO', 'PACIENTE'].includes(role) ? (
              <ConsultasManager />
            ) : dashboardTab === 'recetas' && ['ADMIN', 'MEDICO', 'PACIENTE'].includes(role) ? (
              <RecetasManager currentUser={user} />
            ) : dashboardTab === 'dynamic-reports' && ['ADMIN', 'RECEPCIONISTA', 'MEDICO'].includes(role) ? (
              <DynamicReportsView />
            ) : dashboardTab === 'voice-reports' && ['ADMIN', 'MEDICO'].includes(role) ? (
              <VoiceReportAssistant />
            ) : dashboardTab === 'patient-profile' && role === 'PACIENTE' ? (
              <PatientProfileView />
            ) : (
              <ClinicalDashboardView
                role={role}
                onNavigate={setDashboardTab}
                onOpenSecurityPolicies={() => setIsPolicyModalOpen(true)}
              />
            )}
          </div>
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

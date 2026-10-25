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

  // Nombre de sección activa para el breadcrumb superior (con validación de rol)
  const getSectionTitle = () => {
    switch (dashboardTab) {
      case 'users':
        return role === 'ADMIN' ? 'Gestión de Usuarios y Roles (CU02)' : 'Panel General';
      case 'audit':
        return role === 'ADMIN' ? 'Bitácora de Auditoría del Sistema (CU03)' : 'Panel General';
      case 'patients':
        return ['ADMIN', 'RECEPCIONISTA'].includes(role)
          ? 'Gestión de Pacientes y Cuentas Web (CU04 / CU05)'
          : 'Panel General';
      case 'doctors':
        return role === 'ADMIN' ? 'Plantel Médico y Especialidades (CU06 / CU07)' : 'Panel General';
      case 'schedules':
        return role === 'ADMIN' ? 'Gestión de Horarios y Disponibilidad Médica (CU08)' : 'Panel General';
      case 'appointments':
        return role === 'MEDICO'
          ? 'Mi Agenda Médica Diaria (CU14 / CU15)'
          : role === 'PACIENTE'
          ? 'Mis Citas Médicas'
          : 'Consulta de Disponibilidad de Horarios y Citas (CU09 / CU10)';
      case 'patient-profile':
        return role === 'PACIENTE' ? 'Mi Perfil de Paciente (CU05)' : 'Panel General';
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
          ) : dashboardTab === 'patients' && ['ADMIN', 'RECEPCIONISTA'].includes(role) ? (
            <PatientsManager />
          ) : dashboardTab === 'doctors' && role === 'ADMIN' ? (
            <DoctorsManager />
          ) : dashboardTab === 'schedules' && role === 'ADMIN' ? (
            <SchedulesManager />
          ) : dashboardTab === 'appointments' ? (
            <AppointmentsManager />
          ) : dashboardTab === 'patient-profile' && role === 'PACIENTE' ? (
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
                  {/* CU01: Autenticación (Todos los usuarios) */}
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
                        Sesión activa con hash criptográfico, bloqueo tras 3 intentos y registro inmutable en bitácora.
                      </p>
                    </div>
                  </div>

                  {/* CU02: Usuarios y Roles (Exclusivo Administrador) */}
                  {role === 'ADMIN' && (
                    <div
                      onClick={() => setDashboardTab('users')}
                      className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 uppercase">CU02: Usuarios y Roles</span>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
                            Abrir módulo →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Control de operadores, asignación de roles y bajas lógicas (RF01).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU03: Bitácora Activa (Exclusivo Administrador) */}
                  {role === 'ADMIN' && (
                    <div
                      onClick={() => setDashboardTab('audit')}
                      className="p-4 rounded-xl border bg-cyan-50/50 border-cyan-200/80 hover:bg-cyan-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-800 uppercase">CU03: Bitácora Activa</span>
                          <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-100/60 px-1.5 py-0.5 rounded-md">
                            Consultar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Trazabilidad inmutable de accesos con IP, usuario, acción y fecha.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU04: Pacientes (Recepcionista y Administrador) */}
                  {['ADMIN', 'RECEPCIONISTA'].includes(role) && (
                    <div
                      onClick={() => setDashboardTab('patients')}
                      className="p-4 rounded-xl border bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-800 uppercase">CU04: Pacientes</span>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded-md">
                            Gestionar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Admisión clínica, correlativo HC, grupos etarios y bajas lógicas (RF02).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU05: Cuentas Web de Pacientes (Recepcionista y Administrador) */}
                  {['ADMIN', 'RECEPCIONISTA'].includes(role) && (
                    <div
                      onClick={() => setDashboardTab('patients')}
                      className="p-4 rounded-xl border bg-teal-50/60 border-teal-200/80 hover:bg-teal-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-800 uppercase">CU05: Cuentas Web</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-md">
                            Padrón →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Habilite el acceso web de autoservicio para pacientes con su CI desde el padrón de admisiones (§3.4).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU05: Mi Perfil (Exclusivo Paciente) */}
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

                  {/* CU06: Médicos y Especialidades (Exclusivo Administrador) */}
                  {role === 'ADMIN' && (
                    <div
                      onClick={() => setDashboardTab('doctors')}
                      className="p-4 rounded-xl border bg-cyan-50/50 border-cyan-200/80 hover:bg-cyan-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#00687a] uppercase">CU06 / CU07: Médicos</span>
                          <span className="text-[10px] font-semibold text-[#00687a] bg-cyan-100/70 px-1.5 py-0.5 rounded-md">
                            Plantel →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Plantel institucional, especialidades asignadas, rangos etarios y matrículas (RF03, RF04).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU08: Horarios y Bloqueos (Exclusivo Administrador) */}
                  {role === 'ADMIN' && (
                    <div
                      onClick={() => setDashboardTab('schedules')}
                      className="p-4 rounded-xl border bg-cyan-50/50 border-cyan-200/80 hover:bg-cyan-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#00687a] uppercase">CU08: Horarios y Bloqueos</span>
                          <span className="text-[10px] font-semibold text-[#00687a] bg-cyan-100/70 px-1.5 py-0.5 rounded-md">
                            Gestionar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Franjas semanales por médico, duración de cita y bloqueo de feriados (RF05).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU09 / CU10 / CU12: Gestión de Citas (Recepcionista y Administrador) */}
                  {['ADMIN', 'RECEPCIONISTA'].includes(role) && (
                    <div
                      onClick={() => setDashboardTab('appointments')}
                      className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase">CU09 / CU10 / CU12: Citas</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
                            Gestionar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Disponibilidad de turnos libres, programación asistida y cancelación con motivo (RF06, RF07, RF09).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU14: Agenda Médica Diaria (Recepcionista y Administrador) */}
                  {['ADMIN', 'RECEPCIONISTA'].includes(role) && (
                    <div
                      onClick={() => setDashboardTab('appointments')}
                      className="p-4 rounded-xl border bg-cyan-50/50 border-cyan-200/80 hover:bg-cyan-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#00687a] uppercase">CU14: Agendas Médicas</span>
                          <span className="text-[10px] font-semibold text-[#00687a] bg-cyan-100/70 px-1.5 py-0.5 rounded-md">
                            Consultar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Supervise el cronograma de pacientes y los KPIs del día de cualquier médico de la institución (RF11).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU14: Mi Agenda Médica (Exclusivo Médico) */}
                  {role === 'MEDICO' && (
                    <div
                      onClick={() => setDashboardTab('appointments')}
                      className="p-4 rounded-xl border bg-emerald-50/70 border-emerald-300 hover:bg-emerald-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase">CU14: Mi Agenda Médica</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                            Mi Agenda →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Consulte su cronograma diario de citas, turnos confirmados y franjas horarias de atención (RF11).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU15: Historial Clínico de Citas (Médico y Recepcionista) */}
                  {['MEDICO', 'RECEPCIONISTA'].includes(role) && (
                    <div
                      onClick={() => setDashboardTab('appointments')}
                      className="p-4 rounded-xl border bg-slate-50 border-slate-200/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#00687a] uppercase">CU15: Historial de Citas</span>
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded-md">
                            Integrado
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {role === 'MEDICO'
                            ? 'Consulte la cronología y tasa de asistencia de sus pacientes asignados desde su agenda (RF12).'
                            : 'Consulte el historial completo de atenciones y estados de cualquier paciente desde citas y padrón (RF12).'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU09 / CU10 / CU12: Mis Citas (Exclusivo Paciente) */}
                  {role === 'PACIENTE' && (
                    <div
                      onClick={() => setDashboardTab('appointments')}
                      className="p-4 rounded-xl border bg-emerald-50/70 border-emerald-300 hover:bg-emerald-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase">CU09 / CU10: Mis Citas</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                            Mis Citas →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Consulte disponibilidad de turnos libres y reserve sus citas médicas personales con anti-colisión (RF06, RF07).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CU15: Mi Historial de Salud (Exclusivo Paciente) */}
                  {role === 'PACIENTE' && (
                    <div
                      onClick={() => setDashboardTab('appointments')}
                      className="p-4 rounded-xl border bg-cyan-50/70 border-cyan-300 hover:bg-cyan-50 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#00687a] uppercase">CU15: Mi Historial</span>
                          <span className="text-[10px] font-semibold text-[#00687a] bg-cyan-100 px-1.5 py-0.5 rounded-md">
                            Consultar →
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Consulte la cronología completa de sus citas previas, atendidas y canceladas en modo solo lectura (RF12).
                        </p>
                      </div>
                    </div>
                  )}
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

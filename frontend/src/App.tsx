import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { Stethoscope, Calendar, Users, Activity, Clock, Plus, Search, CheckCircle2, LogOut } from 'lucide-react';
import logoColor from './assets/logo-color.svg';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'dashboard'>('home');

  if (currentView === 'home') {
    return <HomePage onNavigateLogin={() => setCurrentView('login')} />;
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onNavigateHome={() => setCurrentView('home')}
        onLoginSuccess={() => setCurrentView('dashboard')}
      />
    );
  }

  // Vista de Dashboard Clínico (Panel de administración tras iniciar sesión)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Barra de Navegación Superior del Panel */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00687a]/10 border border-[#00687a]/20 p-2 flex items-center justify-center">
              <img src={logoColor} alt="Centro Médico La Cruz" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-montserrat font-bold text-slate-900 leading-tight">
                Centro Médico La Cruz
              </h1>
              <p className="text-xs text-slate-500">Panel de Administración Médica</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Servidor Activo
            </span>
            <button className="flex items-center gap-2 bg-[#00687a] hover:bg-[#005564] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-montserrat font-semibold transition shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Nueva Cita</span>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              title="Cerrar Sesión"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal del Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Bienvenida con degradado turquesa */}
        <div className="mb-8 bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-[#00687a]/15">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-montserrat font-bold text-2xl sm:text-3xl mb-2">Panel de Control Clínico</h2>
              <p className="text-cyan-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Bienvenido al sistema. Aquí puedes gestionar citas médicas, expedientes de pacientes, doctores y reportes en tiempo real.
              </p>
            </div>
            <div className="hidden md:block p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <Stethoscope className="w-10 h-10 text-cyan-200" />
            </div>
          </div>
        </div>

        {/* Tarjetas de Estadísticas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pacientes</span>
              <div className="p-2.5 bg-[#00687a]/10 text-[#00687a] rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-montserrat font-bold text-slate-900">128</div>
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> +12 registrados este mes
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citas Hoy</span>
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-montserrat font-bold text-slate-900">18</div>
            <p className="text-xs text-slate-500 mt-2">6 citas completadas</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En Espera</span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-montserrat font-bold text-slate-900">4</div>
            <p className="text-xs text-amber-600 font-medium mt-2">Tiempo promedio: 15 min</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Especialidades</span>
              <div className="p-2.5 bg-cyan-50 text-[#00687a] rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-montserrat font-bold text-slate-900">8</div>
            <p className="text-xs text-slate-500 mt-2">12 médicos activos</p>
          </div>
        </div>

        {/* Tabla de Citas del Día */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-montserrat font-bold text-slate-800 text-lg">Próximas Citas Médicas</h3>
              <p className="text-xs text-slate-500">Agenda médica del día actualizada en tiempo real</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar paciente o doctor..."
                className="pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00687a] focus:border-transparent w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Paciente</th>
                  <th className="px-6 py-3.5 font-semibold">Médico / Especialidad</th>
                  <th className="px-6 py-3.5 font-semibold">Hora</th>
                  <th className="px-6 py-3.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">Carlos Méndez</td>
                  <td className="px-6 py-4">Dra. Valeria Soto · Cardiología</td>
                  <td className="px-6 py-4 text-slate-500">10:30 AM</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      Confirmada
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">Ana María Rivas</td>
                  <td className="px-6 py-4">Dr. Rodrigo Paz · Pediatría</td>
                  <td className="px-6 py-4 text-slate-500">11:15 AM</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      En Espera
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">Jorge Morales</td>
                  <td className="px-6 py-4">Dra. Camila Torres · Traumatología</td>
                  <td className="px-6 py-4 text-slate-500">12:00 PM</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-[#00687a]">
                      Pendiente
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import {
  Calendar,
  FileText,
  UserCheck,
  Stethoscope,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Shield,
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  LogIn,
  Menu,
  X,
  HeartPulse,
} from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import doctorsImg from '../assets/doctors-clinica.jpg';
import pediatriaImg from '../assets/clinica-pediatria.png';
import geriatricImg from '../assets/doctor-geriatric.jpg';
import sesionesImg from '../assets/sesiones-clinicas.jpg';

export const HomePage = ({ onNavigateLogin }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState('medicos'); // 'medicos' | 'recepcion' | 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1a3a3f] flex flex-col font-montserrat selection:bg-[#70cbff] selection:text-[#01171d]">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR INSTITUCIONAL (Atención 24/7 & Emergencias)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#004d5a] text-white text-xs py-2 px-4 sm:px-8 border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <a
              href="tel:+59133362211"
              className="flex items-center gap-1.5 text-cyan-100 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#70cbff]" />
              <span><span className="font-semibold">Emergencias:</span> +591 (3) 336-2211</span>
            </a>
            <a
              href="mailto:contacto@clinicalacruz.bo"
              className="hidden md:flex items-center gap-1.5 text-cyan-100 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#70cbff]" />
              contacto@clinicalacruz.bo
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-cyan-100">
              <MapPin className="w-3.5 h-3.5 text-[#70cbff]" />
              Atención 24/7 · Santa Cruz, Bolivia
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-cyan-200/90 font-medium hidden sm:inline">
              Centro Médico de Atención Primaria
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#70cbff]"></span>
            <span className="text-emerald-300 font-semibold text-[11px] flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Guardia activa
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HEADER / NAVBAR PRINCIPAL (Con Backdrop blur y Mobile Drawer)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo y Nombre Institucional */}
          <a href="#inicio" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00687a]/10 to-[#70cbff]/20 p-1.5 flex items-center justify-center border border-[#00687a]/15 shadow-xs transition-transform duration-300 group-hover:scale-105">
              <img
                src={logoColorSvg}
                alt="Logo Centro Médico La Cruz"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-montserrat font-bold text-lg sm:text-xl text-[#004d5a] tracking-tight leading-none group-hover:text-[#00687a] transition-colors">
                Centro Médico La Cruz
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#008b9e] tracking-wider uppercase font-semibold mt-1">
                Clínica de Atención Primaria
              </div>
            </div>
          </a>

          {/* Menú de Navegación Central (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#1a3a3f]">
            <a href="#inicio" className="text-[#00687a] font-semibold hover:text-[#004d5a] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#00687a]">
              Inicio
            </a>
            <a href="#especialidades" className="hover:text-[#00687a] transition-colors py-1">
              Especialidades
            </a>
            <a href="#portal-pacientes" className="hover:text-[#00687a] transition-colors py-1">
              Portal Pacientes
            </a>
            <a href="#gestion" className="hover:text-[#00687a] transition-colors py-1">
              Gestión Médica
            </a>
            <a href="#contacto" className="hover:text-[#00687a] transition-colors py-1">
              Contacto
            </a>
          </nav>

          {/* Botón de Login & Hamburger Móvil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateLogin}
              className="group flex items-center gap-2 bg-[#00687a] hover:bg-[#004d5a] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm shadow-[#00687a]/20 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#70cbff] group-hover:translate-x-0.5 transition-transform" />
              <span>Acceso al Sistema</span>
            </button>

            {/* Toggle Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#00687a] hover:bg-slate-100 transition"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desplegable de Navegación Móvil */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3 animate-fade-up">
            <a
              href="#inicio"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#00687a] py-1"
            >
              Inicio
            </a>
            <a
              href="#especialidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-[#00687a] py-1"
            >
              Especialidades
            </a>
            <a
              href="#portal-pacientes"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-[#00687a] py-1"
            >
              Portal Pacientes
            </a>
            <a
              href="#gestion"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-[#00687a] py-1"
            >
              Gestión Médica
            </a>
            <a
              href="#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-[#00687a] py-1"
            >
              Contacto
            </a>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. SECCIÓN HERO PRINCIPAL (Con Micro-interacciones & Profundidad)
      ───────────────────────────────────────────────────────────── */}
      <section id="inicio" className="relative bg-white pt-8 pb-14 sm:pt-14 sm:pb-24 overflow-hidden">
        {/* Luces radiales de fondo suaves */}
        <div className="absolute top-12 right-10 w-96 h-96 rounded-full bg-[#70cbff]/15 blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute -bottom-10 left-0 w-80 h-80 rounded-full bg-[#00687a]/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Columna Izquierda: Copywriting y Llamados a la Acción */}
            <div className="lg:col-span-6 flex flex-col items-start z-10 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f7f9] border border-[#70cbff]/40 text-xs font-semibold text-[#00687a] mb-5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#00687a] animate-ping"></span>
                Atención Médica Integral & Portal Clínico
              </div>

              <h1 className="font-montserrat font-bold text-3xl sm:text-5xl xl:text-[54px] text-[#003844] leading-[1.12] tracking-tight mb-5">
                Cuidamos de ti, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00687a] via-[#008b9e] to-[#70cbff]">
                  gestionamos tu salud
                </span>{' '}
                con excelencia.
              </h1>

              <p className="text-[#3b5a60] text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
                Plataforma unificada del <strong>Centro Médico La Cruz</strong> para pacientes, médicos
                especialistas, recepción y administración. Agenda tu cita, consulta tus resultados de
                laboratorio o ingresa al panel médico con un solo clic.
              </p>

              {/* Botones de acción con hover fluido */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
                <a
                  href="#portal-pacientes"
                  className="flex items-center gap-2.5 bg-[#00687a] hover:bg-[#004d5a] text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-[#00687a]/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Calendar className="w-4 h-4 text-[#70cbff]" />
                  <span>Pedir Cita Online</span>
                </a>

                <button
                  onClick={onNavigateLogin}
                  className="flex items-center gap-2 bg-[#e8f7f9] hover:bg-[#d5f1f5] text-[#00687a] font-semibold text-sm px-5 py-3.5 rounded-xl transition-all duration-200 border border-[#70cbff]/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#00687a]" />
                  <span>Portal del Personal</span>
                </button>
              </div>

              {/* Métricas destacadas con transiciones */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-lg">
                <div className="group">
                  <div className="font-montserrat font-bold text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                    +15
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Especialidades médicas
                  </div>
                </div>
                <div className="group">
                  <div className="font-montserrat font-bold text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                    +35
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Médicos en plantilla
                  </div>
                </div>
                <div className="group">
                  <div className="font-montserrat font-bold text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                    24/7
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Atención y guardia
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Composición de Imágenes con Efectos Sutiles */}
            <div className="lg:col-span-6 relative">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center">
                
                {/* Imagen 1: Equipo Médico (destacada alta) */}
                <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-slate-100 bg-white">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/75 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <img
                    src={doctorsImg}
                    alt="Equipo Médico Centro Médico La Cruz"
                    className="w-full h-64 sm:h-84 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 right-3 z-20 text-white">
                    <p className="text-xs font-semibold">Cuerpo Médico</p>
                    <p className="text-[11px] text-cyan-200">Especialistas certificados</p>
                  </div>
                </div>

                {/* Columna con dos fotos: Pediatría y Geriatría */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="relative group overflow-hidden rounded-2xl shadow-md border border-slate-100 bg-white">
                    <img
                      src={pediatriaImg}
                      alt="Atención pediátrica"
                      className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/70 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10">
                      <p className="text-[11px] font-semibold">Pediatría & Familia</p>
                    </div>
                  </div>

                  <div className="relative group overflow-hidden rounded-2xl shadow-md border border-slate-100 bg-white">
                    <img
                      src={geriatricImg}
                      alt="Atención geriátrica y medicina interna"
                      className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/70 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10">
                      <p className="text-[11px] font-semibold">Medicina General</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge flotante de acreditación médica con micro-animación */}
              <div className="absolute -bottom-4 -left-3 sm:bottom-4 sm:left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl border border-[#70cbff]/40 flex items-center gap-3 animate-float-soft">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00687a] to-[#008b9e] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Shield className="w-5 h-5 text-[#70cbff]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#003844]">Atención Primaria de Calidad</div>
                  <div className="text-[11px] text-slate-500">Acreditación Médica Verificada</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. TARJETAS DE ACCESO RÁPIDO PARA PACIENTES (Interactive Cards)
      ───────────────────────────────────────────────────────────── */}
      <section id="portal-pacientes" className="bg-[#f3fafb] py-12 sm:py-16 border-y border-[#d8f0f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2 className="font-montserrat font-bold text-xl sm:text-3xl text-[#004d5a]">
              Servicios Rápidos para Pacientes
            </h2>
            <p className="text-xs sm:text-sm text-[#3b5a60] mt-1.5">
              Sin filas y disponible las 24 horas desde cualquier dispositivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {/* Tarjeta 1: Agendar Cita */}
            <div className="interactive-card bg-white rounded-2xl p-6 sm:p-8 border border-[#70cbff]/30 shadow-xs flex items-start gap-4 sm:gap-5 group cursor-pointer hover:border-[#00687a]/50">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f7f9] border border-[#70cbff]/40 text-[#00687a] flex items-center justify-center shrink-0 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300 shadow-xs">
                <Calendar className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-[#003844] mb-1.5 group-hover:text-[#00687a] transition-colors">
                  Agenda tu consulta
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                  Elige la especialidad, el médico de tu preferencia y la fecha más cómoda para tu atención.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Módulo de Citas Online: Próximamente disponible.')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#00687a] group-hover:text-[#004d5a] transition"
                >
                  <span>Reservar turno ahora</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Tarjeta 2: Revisar Resultados */}
            <div className="interactive-card bg-white rounded-2xl p-6 sm:p-8 border border-[#70cbff]/30 shadow-xs flex items-start gap-4 sm:gap-5 group cursor-pointer hover:border-[#00687a]/50">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f7f9] border border-[#70cbff]/40 text-[#00687a] flex items-center justify-center shrink-0 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300 shadow-xs">
                <FileText className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-[#003844] mb-1.5 group-hover:text-[#00687a] transition-colors">
                  Revisa tus resultados
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                  Descarga tus órdenes médicas, análisis de laboratorio e informes clínicos de forma segura.
                </p>
                <button
                  type="button"
                  onClick={() => alert('Módulo de Resultados: Próximamente disponible.')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#00687a] group-hover:text-[#004d5a] transition"
                >
                  <span>Consultar con mi cédula</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECCIÓN DE GESTIÓN INTERNA Y ROLES (Pestañas Interactivas)
      ───────────────────────────────────────────────────────────── */}
      <section id="gestion" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Foto de sesiones clínicas */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-100 group">
                <img
                  src={sesionesImg}
                  alt="Sesión clínica de médicos especialistas"
                  className="w-full h-80 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/85 via-transparent to-transparent"></div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold mb-2">
                    <Activity className="w-3.5 h-3.5 text-[#70cbff]" />
                    Coordinación Multidisciplinaria
                  </div>
                  <h4 className="font-montserrat font-bold text-lg">
                    Comité Médico & Diagnóstico
                  </h4>
                  <p className="text-xs text-cyan-100 mt-1">
                    Sesiones clínicas continuas para casos complejos y medicina integral
                  </p>
                </div>
              </div>
            </div>

            {/* Roles interactivos con selección visual */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f7f9] text-xs font-semibold text-[#00687a] mb-4">
                <Users className="w-4 h-4 text-[#00687a]" />
                Flujos de Trabajo por Rol
              </div>

              <h2 className="font-montserrat font-bold text-2xl sm:text-4xl text-[#003844] leading-tight mb-4">
                Diseñado para el flujo de trabajo real de una clínica.
              </h2>

              <p className="text-sm text-[#3b5a60] leading-relaxed mb-6">
                El sistema centraliza las operaciones del Centro Médico La Cruz permitiendo que cada
                perfil acceda exactamente a las herramientas que necesita para una atención de calidad.
              </p>

              {/* Selector interactivo de roles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('medicos')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRoleTab === 'medicos'
                      ? 'border-[#00687a] bg-[#eefafb] shadow-xs'
                      : 'border-slate-200/80 bg-[#f8fdfe] hover:border-[#70cbff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#00687a] text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <Stethoscope className="w-4 h-4 text-[#70cbff]" />
                  </div>
                  <h4 className="font-montserrat font-bold text-sm text-[#003844]">Médicos</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Agenda diaria, consultas, recetas e historial clínico.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('recepcion')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRoleTab === 'recepcion'
                      ? 'border-[#008b9e] bg-[#eefafb] shadow-xs'
                      : 'border-slate-200/80 bg-[#f8fdfe] hover:border-[#70cbff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#008b9e] text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <Calendar className="w-4 h-4 text-cyan-200" />
                  </div>
                  <h4 className="font-montserrat font-bold text-sm text-[#003844]">Recepción</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Admisión de pacientes, asignación de salas y cobros.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('admin')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRoleTab === 'admin'
                      ? 'border-[#004d5a] bg-[#eefafb] shadow-xs'
                      : 'border-slate-200/80 bg-[#f8fdfe] hover:border-[#70cbff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#004d5a] text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <Shield className="w-4 h-4 text-[#70cbff]" />
                  </div>
                  <h4 className="font-montserrat font-bold text-sm text-[#003844]">Administración</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Control de usuarios, métricas de atención y especialidades.
                  </p>
                </button>
              </div>

              {/* Botón de acceso al panel con micro-interacción */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onNavigateLogin}
                  className="group inline-flex items-center gap-2 bg-[#00687a] hover:bg-[#004d5a] text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-[#00687a]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#70cbff] group-hover:translate-x-0.5 transition-transform" />
                  <span>Ingresar al panel de gestión</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SECCIÓN DE ESPECIALIDADES DESTACADAS
      ───────────────────────────────────────────────────────────── */}
      <section id="especialidades" className="py-12 sm:py-16 bg-[#f9fcfd] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00687a]/10 text-xs font-semibold text-[#00687a] mb-2.5">
              <HeartPulse className="w-3.5 h-3.5 text-[#00687a]" />
              Servicios Clínicos
            </div>
            <h2 className="font-montserrat font-bold text-2xl sm:text-3xl text-[#003844]">
              Especialidades Médicas
            </h2>
            <p className="text-xs sm:text-sm text-[#3b5a60] mt-1.5">
              Atención médica de primer nivel con especialistas certificados
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {[
              { name: 'Medicina General', icon: Stethoscope, docs: '8 médicos' },
              { name: 'Pediatría', icon: Users, docs: '5 médicos' },
              { name: 'Cardiología', icon: HeartPulse, docs: '4 médicos' },
              { name: 'Traumatología', icon: Activity, docs: '3 médicos' },
              { name: 'Ginecología', icon: Shield, docs: '4 médicos' },
              { name: 'Odontología', icon: CheckCircle2, docs: '3 médicos' },
            ].map((esp, idx) => {
              const IconComp = esp.icon;
              return (
                <div
                  key={idx}
                  className="interactive-card bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-[#00687a]/40 text-center flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#e8f7f9] text-[#00687a] flex items-center justify-center mb-3 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300">
                    <IconComp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h4 className="font-montserrat font-bold text-xs sm:text-sm text-[#003844] mb-0.5 leading-tight">
                    {esp.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {esp.docs}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. BARRA INFERIOR / FRANJA DE VALORES
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] text-white py-6 sm:py-8 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-10 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#70cbff]" />
              <span>Diagnóstico de Alta Precisión</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#70cbff]" />
              <span>Valores Éticos & Calidez</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#70cbff]" />
              <span>Tecnología Médica Actualizada</span>
            </div>
          </div>

          <div className="text-xs text-cyan-100 flex items-center gap-2">
            <span className="font-semibold text-white">Centro Médico La Cruz</span>
            <span>·</span>
            <span>Atención con Vocación</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER INSTITUCIONAL
      ───────────────────────────────────────────────────────────── */}
      <footer id="contacto" className="bg-[#002b35] text-slate-300 py-12 px-4 sm:px-8 text-xs border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center">
                <img src={logoColorSvg} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-montserrat font-bold text-sm text-white">
                Centro Médico La Cruz
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Clínica de Atención Primaria dedicada al cuidado integral del paciente y la gestión médica
              eficiente.
            </p>
          </div>

          <div>
            <h4 className="font-montserrat font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Especialidades
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li>Medicina General & Familiar</li>
              <li>Pediatría & Puericultura</li>
              <li>Cardiología Preventiva</li>
              <li>Traumatología & Rehabilitación</li>
              <li>Laboratorio Clínico</li>
            </ul>
          </div>

          <div>
            <h4 className="font-montserrat font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Servicios Web
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li>
                <a href="#portal-pacientes" className="hover:text-[#70cbff] transition-colors">
                  Agendamiento de Citas
                </a>
              </li>
              <li>
                <a href="#portal-pacientes" className="hover:text-[#70cbff] transition-colors">
                  Consulta de Resultados
                </a>
              </li>
              <li>
                <button onClick={onNavigateLogin} className="hover:text-[#70cbff] transition-colors text-left cursor-pointer">
                  Portal Médico & Administrativo
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-montserrat font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Ubicación & Contacto
            </h4>
            <div className="space-y-2 text-slate-400 text-[11px]">
              <p>Av. San Martín #450, Equipetrol</p>
              <p>Santa Cruz de la Sierra, Bolivia</p>
              <p className="text-[#70cbff] font-semibold">+591 (3) 336-2211</p>
              <p>Emergencias 24 Horas</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Centro Médico La Cruz. Sistema de Gestión Clínica.
          </div>
          <div className="flex gap-4">
            <span>Privacidad de Datos Médicos</span>
            <span>Términos de Servicio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

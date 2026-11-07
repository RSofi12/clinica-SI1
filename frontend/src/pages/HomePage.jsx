import { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  UserCheck,
  Stethoscope,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
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
  Eye,
  Sparkles,
} from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import logoFullWhiteSvg from '../assets/logo-full-white.svg';
import doctorsImg from '../assets/doctors-clinica.jpg';
import pediatriaImg from '../assets/clinica-pediatria.png';
import geriatricImg from '../assets/doctor-geriatric.jpg';
import sesionesImg from '../assets/sesiones-clinicas.jpg';

export const HomePage = ({ onNavigateLogin, onOpenActivatePatient }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState('medicos'); // 'medicos' | 'recepcion' | 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 4;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 10000); // Avance automático garantizado cada 10 segundos
    return () => clearInterval(timer);
  }, [currentSlide, totalSlides]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));

  return (
    <div className="min-h-screen bg-white text-[#1a3a3f] flex flex-col font-sans-clinical selection:bg-[#70cbff] selection:text-[#01171d]">
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
              <div className="font-serif-clinical font-semibold text-xl sm:text-2xl text-[#003844] tracking-normal leading-none group-hover:text-[#00687a] transition-colors">
                Centro Médico La Cruz
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#00687a] tracking-wider uppercase font-semibold mt-1">
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
            {onOpenActivatePatient && (
              <button
                onClick={onOpenActivatePatient}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#00687a] bg-[#00687a]/10 hover:bg-[#00687a]/20 px-3.5 py-2 rounded-full transition cursor-pointer"
                title="Activar cuenta digital con Cédula de Identidad"
              >
                <span>Activar Cuenta CI</span>
              </button>
            )}

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
          3. SECCIÓN HERO SLIDER PRINCIPAL (4 Paneles Deslizantes en Carrusel)
      ───────────────────────────────────────────────────────────── */}
      <section 
        id="inicio" 
        className="relative bg-white pt-6 pb-12 sm:pt-12 sm:pb-20 overflow-hidden"
      >
        {/* Luces radiales de fondo suaves */}
        <div className="absolute top-12 right-10 w-96 h-96 rounded-full bg-[#70cbff]/15 blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute -bottom-10 left-0 w-80 h-80 rounded-full bg-[#00687a]/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative">
          
          {/* Contenedor con carrusel deslizante horizontal real (Sin cortes abruptos) */}
          <div className="overflow-hidden w-full">
            <div 
              className="flex transition-transform duration-700 ease-in-out will-change-transform"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              
              {/* SLIDE 0: Cuidamos de ti con excelencia médica y vocación humana */}
              <div className="w-full shrink-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-h-[480px] lg:min-h-[510px]">
                  
                  {/* Columna Izquierda: Copywriting y Llamados a la Acción */}
                  <div className="lg:col-span-6 flex flex-col items-start z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e8f7f9] border border-[#b2e3ea] text-xs font-medium text-[#00687a] mb-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00687a]"></span>
                      Atención Primaria & Especialidades Clínicas
                    </div>

                    <h1 className="font-serif-clinical text-3xl sm:text-5xl xl:text-[52px] text-[#003844] leading-[1.14] tracking-tight mb-5 font-normal">
                      Cuidamos de ti con <br />
                      <span className="italic font-light text-[#004d5a]">excelencia médica</span> y vocación humana.
                    </h1>

                    <p className="text-[#3b5a60] text-sm sm:text-base leading-relaxed mb-8 max-w-xl font-sans-clinical">
                      Plataforma unificada del <strong>Centro Médico La Cruz</strong> para pacientes, médicos
                      especialistas, recepción y administración. Agenda tu cita, consulta tus resultados o ingresa al panel médico con un solo clic.
                    </p>

                    {/* Botones de acción con hover fluido */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
                      <button
                        type="button"
                        onClick={() => setIsAppointmentModalOpen(true)}
                        className="flex items-center gap-2.5 bg-[#00687a] hover:bg-[#004d5a] text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#00687a]/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#70cbff]" />
                        <span>Pedir Cita Online</span>
                      </button>

                      <button
                        onClick={onNavigateLogin}
                        className="flex items-center gap-2 bg-[#e8f7f9] hover:bg-[#d5f1f5] text-[#00687a] font-medium text-sm px-5 py-3.5 rounded-xl transition-all duration-200 border border-[#b2e3ea] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-[#00687a]" />
                        <span>Portal del Personal</span>
                      </button>
                    </div>

                    {/* Métricas destacadas */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-lg">
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          12
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Especialidades médicas
                        </div>
                      </div>
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          16
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Médicos en plantilla
                        </div>
                      </div>
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          24/7
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Atención continua
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Foto de Cuerpo Médico Exclusiva (Slide 1) */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div className="relative group overflow-hidden rounded-2xl shadow-md border border-slate-100 bg-white h-[360px] sm:h-[400px]">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/80 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-40 transition-opacity duration-300"></div>
                      <img
                        src={doctorsImg}
                        alt="Cuerpo Médico Centro Médico La Cruz"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                        <p className="font-serif-clinical text-base sm:text-lg font-normal">Cuerpo Médico Especializado</p>
                        <p className="text-xs text-cyan-200 font-sans-clinical">Especialistas colegiados comprometidos con la atención de primer nivel</p>
                      </div>
                    </div>

                    <div className="mt-4 bg-[#f8fdfe] rounded-xl p-3.5 border border-[#b2e3ea] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00687a] text-white flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5 text-[#70cbff]" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#003844]">Atención Primaria Acreditada</div>
                          <div className="text-[11px] text-slate-500">Médicos colegiados & protocolos de bioseguridad</div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#00687a] font-medium shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Guardia 24/7 Activa
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SLIDE 1: Especialidades Clínicas & Cuidado Familiar */}
              <div className="w-full shrink-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-h-[480px] lg:min-h-[510px]">
                  
                  <div className="lg:col-span-6 flex flex-col items-start z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e8f7f9] border border-[#b2e3ea] text-xs font-medium text-[#00687a] mb-5">
                      <HeartPulse className="w-3.5 h-3.5 text-[#00687a]" />
                      Especialidades Médicas & Familia
                    </div>

                    <h1 className="font-serif-clinical text-3xl sm:text-5xl xl:text-[52px] text-[#003844] leading-[1.14] tracking-tight mb-5 font-normal">
                      Cuidado integral para <br />
                      <span className="italic font-light text-[#004d5a]">cada etapa</span> de tu vida.
                    </h1>

                    <p className="text-[#3b5a60] text-sm sm:text-base leading-relaxed mb-8 max-w-xl font-sans-clinical">
                      Desde la consulta pediátrica y el desarrollo infantil hasta la medicina preventiva y atención del adulto mayor. Especialistas coordinados para el bienestar de toda tu familia.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
                      <button
                        type="button"
                        onClick={() => setIsAppointmentModalOpen(true)}
                        className="flex items-center gap-2.5 bg-[#00687a] hover:bg-[#004d5a] text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#00687a]/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#70cbff]" />
                        <span>Pedir Cita Online</span>
                      </button>

                      <a
                        href="#especialidades"
                        className="flex items-center gap-2 bg-[#e8f7f9] hover:bg-[#d5f1f5] text-[#00687a] font-medium text-sm px-5 py-3.5 rounded-xl transition-all duration-200 border border-[#b2e3ea] hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <HeartPulse className="w-4 h-4 text-[#00687a]" />
                        <span>Ver Especialidades</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-lg">
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          Pediatría
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Infancia y vacunas
                        </div>
                      </div>
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          Familia
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Medicina preventiva
                        </div>
                      </div>
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          Geriatría
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Adulto mayor
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Dúo de Fotos de Especialidades (Slide 2) */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-3.5 h-[360px] sm:h-[400px]">
                      
                      {/* Foto Pediatría */}
                      <div className="relative group overflow-hidden rounded-2xl shadow-md border border-slate-100 bg-white h-full">
                        <img
                          src={pediatriaImg}
                          alt="Pediatría y puericultura"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/80 via-transparent to-transparent opacity-80 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                          <p className="font-serif-clinical text-sm font-semibold">Pediatría & Familia</p>
                          <p className="text-[11px] text-cyan-200 font-sans-clinical">Atención infantil cálida</p>
                        </div>
                      </div>

                      {/* Foto Geriatría */}
                      <div className="relative group overflow-hidden rounded-2xl shadow-md border border-slate-100 bg-white h-full">
                        <img
                          src={geriatricImg}
                          alt="Medicina general y geriatría"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/80 via-transparent to-transparent opacity-80 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                          <p className="font-serif-clinical text-sm font-semibold">Medicina General</p>
                          <p className="text-[11px] text-cyan-200 font-sans-clinical">Geriatría y chequeos</p>
                        </div>
                      </div>

                    </div>

                    <div className="mt-4 bg-[#f8fdfe] rounded-xl p-3.5 border border-[#b2e3ea] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00687a] text-white flex items-center justify-center shrink-0">
                          <HeartPulse className="w-5 h-5 text-[#70cbff]" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#003844]">Servicios Médicos Completos</div>
                          <div className="text-[11px] text-slate-500">Consultas programadas y seguimiento médico continuo</div>
                        </div>
                      </div>
                      <span className="hidden sm:inline-block text-xs font-medium text-[#00687a]">12 Especialidades</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* SLIDE 2: Portal Pacientes (Tu salud en tus manos) */}
              <div className="w-full shrink-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-h-[480px] lg:min-h-[510px]">
                  
                  <div className="lg:col-span-6 flex flex-col items-start z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e8f7f9] border border-[#b2e3ea] text-xs font-medium text-[#00687a] mb-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00687a]"></span>
                      Portal Digital del Paciente
                    </div>

                    <h1 className="font-serif-clinical text-3xl sm:text-5xl xl:text-[52px] text-[#003844] leading-[1.14] tracking-tight mb-5 font-normal">
                  Tu salud en tus manos: <br />
                  <span className="italic font-light text-[#004d5a]">citas y resultados</span> en un solo lugar.
                </h1>

                <p className="text-[#3b5a60] text-sm sm:text-base leading-relaxed mb-8 max-w-xl font-sans-clinical">
                  Accede a tu historial clínico, revisa diagnósticos médicos y descarga órdenes de laboratorio sin filas ni trámites presenciales. Activa tu cuenta con tu Cédula de Identidad en un solo paso.
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
                  <button
                    type="button"
                    onClick={() => onOpenActivatePatient?.()}
                    className="flex items-center gap-2.5 bg-[#00687a] hover:bg-[#004d5a] text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#00687a]/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-[#70cbff]" />
                    <span>Activar Cuenta con C.I.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="flex items-center gap-2 bg-[#e8f7f9] hover:bg-[#d5f1f5] text-[#00687a] font-medium text-sm px-5 py-3.5 rounded-xl transition-all duration-200 border border-[#b2e3ea] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#00687a]" />
                    <span>Reservar Turno Digital</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-lg">
                  <div className="group">
                    <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                      100%
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                      Gestión online
                    </div>
                  </div>
                  <div className="group">
                    <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                      0 Filas
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                      Acceso directo con CI
                    </div>
                  </div>
                  <div className="group">
                    <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                      Seguro
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                      Privacidad médica
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Tarjeta destacada de resultados (Slide 3) */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 bg-[#003844] text-white p-6 sm:p-7 h-[360px] sm:h-[400px] flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#70cbff]/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-[#00687a] flex items-center justify-center text-[#70cbff] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif-clinical text-lg font-medium text-white">Historial Clínico Digital</h4>
                        <p className="text-xs text-cyan-200 font-sans-clinical">Disponible 24/7 para el paciente</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 font-sans-clinical text-xs">
                      <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#70cbff]" />
                          <span>Consulta Médica & Receta Digital</span>
                        </div>
                        <span className="text-[10px] text-cyan-200 bg-white/10 px-2 py-0.5 rounded">PDF</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#70cbff]" />
                          <span>Informes de Laboratorio & Análisis</span>
                        </div>
                        <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">Listo</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#70cbff]" />
                          <span>Próxima Cita con Especialista</span>
                        </div>
                        <span className="text-[10px] text-cyan-200 bg-white/10 px-2 py-0.5 rounded">Confirmada</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-sans-clinical">Ingreso inmediato sin contraseñas difíciles</span>
                    <button
                      onClick={() => onOpenActivatePatient?.()}
                      className="text-xs font-semibold text-[#70cbff] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Activar ahora</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-[#f8fdfe] rounded-xl p-3.5 border border-[#b2e3ea] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#00687a] text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-[#70cbff]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#003844]">Seguridad & Protección de Datos</div>
                      <div className="text-[11px] text-slate-500">Solo tú tienes acceso a tu información confidencial</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

              {/* SLIDE 3: Guardia 24 Horas & Sesiones Clínicas */}
              <div className="w-full shrink-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center min-h-[480px] lg:min-h-[510px]">
                  
                  <div className="lg:col-span-6 flex flex-col items-start z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e8f7f9] border border-[#b2e3ea] text-xs font-medium text-[#00687a] mb-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Guardia Médica 24/7 & Emergencias
                    </div>

                    <h1 className="font-serif-clinical text-3xl sm:text-5xl xl:text-[52px] text-[#003844] leading-[1.14] tracking-tight mb-5 font-normal">
                      Respuesta médica oportuna <br />
                      <span className="italic font-light text-[#004d5a]">las 24 horas del día</span>, siempre listos.
                    </h1>

                    <p className="text-[#3b5a60] text-sm sm:text-base leading-relaxed mb-8 max-w-xl font-sans-clinical">
                      Servicio ininterrumpido de triaje clínico, estabilización y consulta médica continua en Equipetrol. Equipo multidisciplinario coordinado para diagnósticos precisos cuando cada minuto cuenta.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
                      <a
                        href="tel:+59133362211"
                        className="flex items-center gap-2.5 bg-[#00687a] hover:bg-[#004d5a] text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#00687a]/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Phone className="w-4 h-4 text-[#70cbff]" />
                        <span>Llamar a Emergencias: +591 (3) 336-2211</span>
                      </a>

                      <a
                        href="#especialidades"
                        className="flex items-center gap-2 bg-[#e8f7f9] hover:bg-[#d5f1f5] text-[#00687a] font-medium text-sm px-5 py-3.5 rounded-xl transition-all duration-200 border border-[#b2e3ea] hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <HeartPulse className="w-4 h-4 text-[#00687a]" />
                        <span>Ver Especialidades</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-lg">
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          365
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Días al año
                        </div>
                      </div>
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          15 min
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Tiempo de triaje
                        </div>
                      </div>
                      <div className="group">
                        <div className="font-serif-clinical font-normal text-2xl sm:text-3xl text-[#00687a] transition-transform duration-200 group-hover:scale-105 origin-left">
                          Equipetrol
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 font-sans-clinical">
                          Santa Cruz, Bolivia
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Foto de Sesiones Clínicas & Guardia (Slide 4) */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div className="relative group overflow-hidden rounded-2xl shadow-lg border border-slate-100 bg-white h-[360px] sm:h-[400px]">
                      <img
                        src={sesionesImg}
                        alt="Comité médico y diagnóstico continuo"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/85 via-[#003844]/20 to-transparent"></div>
                      <div className="absolute bottom-5 left-5 right-5 text-white">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold mb-2">
                          <Activity className="w-3.5 h-3.5 text-[#70cbff]" />
                          Atención & Diagnóstico Coordinado
                        </div>
                        <h4 className="font-serif-clinical text-xl font-normal">
                          Cuerpo Médico en Guardia Permanente
                        </h4>
                        <p className="text-xs text-cyan-100 mt-1 font-sans-clinical">
                          Atención inmediata a urgencias médicas con derivación directa a especialistas
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 bg-[#f8fdfe] rounded-xl p-3.5 border border-[#b2e3ea] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00687a] text-white flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-[#70cbff]" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#003844]">Av. San Martín #450, Equipetrol</div>
                          <div className="text-[11px] text-slate-500">Acceso preferencial para ambulancias y triaje</div>
                        </div>
                      </div>
                      <span className="hidden sm:inline-block text-xs font-medium text-[#00687a]">Atención 24/7</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Controles de Navegación del Slider (Flechas y Paginación) */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            {/* Indicadores de Puntos (Dots) */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx ? 'w-8 bg-[#00687a]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
              <span className="ml-3 text-xs font-medium text-slate-400 font-sans-clinical">
                0{currentSlide + 1} / 0{totalSlides}
              </span>
            </div>

            {/* Flechas Anterior / Siguiente */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="w-9 h-9 rounded-xl border border-slate-200 hover:border-[#00687a] text-slate-600 hover:text-[#00687a] hover:bg-[#e8f7f9] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="w-9 h-9 rounded-xl border border-slate-200 hover:border-[#00687a] text-slate-600 hover:text-[#00687a] hover:bg-[#e8f7f9] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Slide siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SECCIÓN DE ESPECIALIDADES DESTACADAS (12 Especialidades Oficiales)
      ───────────────────────────────────────────────────────────── */}
      <section id="especialidades" className="py-12 sm:py-16 bg-[#f9fcfd] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00687a]/10 text-xs font-medium text-[#00687a] mb-2.5">
              <HeartPulse className="w-3.5 h-3.5 text-[#00687a]" />
              Catálogo Clínico Integral
            </div>
            <h2 className="font-serif-clinical text-2xl sm:text-3xl text-[#003844] font-normal">
              12 Especialidades Médicas
            </h2>
            <p className="text-xs sm:text-sm text-[#3b5a60] mt-1.5 font-sans-clinical">
              Atención médica de primer nivel con especialistas certificados y equipamiento actualizado
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {[
              { name: 'Medicina General', icon: Stethoscope, docs: '8 médicos', code: 'MG' },
              { name: 'Pediatría', icon: Users, docs: '5 médicos', code: 'PED' },
              { name: 'Geriatría', icon: UserCheck, docs: '3 médicos', code: 'GER' },
              { name: 'Cardiología', icon: HeartPulse, docs: '4 médicos', code: 'CARD' },
              { name: 'Ginecología y Obst.', icon: Shield, docs: '4 médicos', code: 'GIN' },
              { name: 'Traumatología', icon: Activity, docs: '3 médicos', code: 'TRAUM' },
              { name: 'Dermatología', icon: Sparkles, docs: '2 médicos', code: 'DERM' },
              { name: 'Oftalmología', icon: Eye, docs: '2 médicos', code: 'OFT' },
              { name: 'Gastroenterología', icon: Activity, docs: '2 médicos', code: 'GAST' },
              { name: 'Neurología', icon: Activity, docs: '2 médicos', code: 'NEUR' },
              { name: 'Otorrinolaringología', icon: Stethoscope, docs: '2 médicos', code: 'ORL' },
              { name: 'Endocrinología', icon: HeartPulse, docs: '2 médicos', code: 'END' },
            ].map((esp, idx) => {
              const IconComp = esp.icon;
              return (
                <div
                  key={idx}
                  className="interactive-card bg-white p-4 sm:p-5 rounded-xl border border-slate-200/70 shadow-2xs hover:border-[#00687a]/40 text-center flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#e8f7f9] text-[#00687a] flex items-center justify-center mb-3 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300">
                    <IconComp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h4 className="font-serif-clinical font-semibold text-xs sm:text-sm text-[#003844] mb-0.5 leading-tight">
                    {esp.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium font-sans-clinical">
                    {esp.docs}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. TARJETAS DE ACCESO RÁPIDO PARA PACIENTES (Interactive Cards)
      ───────────────────────────────────────────────────────────── */}
      <section id="portal-pacientes" className="bg-[#f3fafb] py-12 sm:py-16 border-y border-[#d8f0f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2 className="font-serif-clinical text-2xl sm:text-3xl text-[#003844] font-normal">
              Servicios Rápidos para Pacientes
            </h2>
            <p className="text-xs sm:text-sm text-[#3b5a60] mt-1.5 font-sans-clinical">
              Sin filas y disponible las 24 horas desde cualquier dispositivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {/* Tarjeta 1: Agendar Cita */}
            <div 
              onClick={() => setIsAppointmentModalOpen(true)}
              className="interactive-card bg-white rounded-2xl p-6 sm:p-8 border border-[#70cbff]/30 shadow-xs flex items-start gap-4 sm:gap-5 group cursor-pointer hover:border-[#00687a]/50"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#e8f7f9] border border-[#70cbff]/40 text-[#00687a] flex items-center justify-center shrink-0 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300 shadow-xs">
                <Calendar className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif-clinical font-semibold text-lg text-[#003844] mb-1.5 group-hover:text-[#00687a] transition-colors">
                  Agenda tu consulta
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed font-sans-clinical">
                  Elige la especialidad, el médico de tu preferencia y la fecha más cómoda para tu atención.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#00687a] group-hover:text-[#004d5a] transition">
                  <span>Reservar turno ahora</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Revisar Resultados */}
            <div 
              onClick={() => onOpenActivatePatient?.()}
              className="interactive-card bg-white rounded-2xl p-6 sm:p-8 border border-[#70cbff]/30 shadow-xs flex items-start gap-4 sm:gap-5 group cursor-pointer hover:border-[#00687a]/50"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#e8f7f9] border border-[#70cbff]/40 text-[#00687a] flex items-center justify-center shrink-0 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300 shadow-xs">
                <FileText className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif-clinical font-semibold text-lg text-[#003844] mb-1.5 group-hover:text-[#00687a] transition-colors">
                  Revisa tus resultados
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed font-sans-clinical">
                  Accede a tu historial clínico o activa tu cuenta con tu Cédula de Identidad en un paso.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#00687a] group-hover:text-[#004d5a] transition">
                  <span>Consultar con mi cédula</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SECCIÓN DE GESTIÓN INTERNA Y ROLES (Pestañas Interactivas)
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
                  <h4 className="font-serif-clinical font-semibold text-lg">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#e8f7f9] border border-[#b2e3ea] text-xs font-medium text-[#00687a] mb-4">
                <Users className="w-3.5 h-3.5 text-[#00687a]" />
                Flujos de Trabajo por Rol
              </div>

              <h2 className="font-serif-clinical text-2xl sm:text-4xl text-[#003844] font-normal leading-tight mb-4">
                Diseñado para el flujo de trabajo real de una clínica.
              </h2>

              <p className="text-sm text-[#3b5a60] leading-relaxed mb-6 font-sans-clinical">
                El sistema centraliza las operaciones del Centro Médico La Cruz permitiendo que cada
                perfil acceda exactamente a las herramientas que necesita para una atención de calidad.
              </p>

              {/* Selector interactivo de roles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('medicos')}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRoleTab === 'medicos'
                      ? 'border-[#00687a] bg-[#eefafb] shadow-xs'
                      : 'border-slate-200/80 bg-[#f8fdfe] hover:border-[#70cbff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#00687a] text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <Stethoscope className="w-4 h-4 text-[#70cbff]" />
                  </div>
                  <h4 className="font-serif-clinical font-semibold text-base text-[#003844]">Médicos</h4>
                  <p className="text-xs text-slate-500 mt-1 font-sans-clinical">
                    Agenda diaria, consultas, recetas e historial clínico.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('recepcion')}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRoleTab === 'recepcion'
                      ? 'border-[#008b9e] bg-[#eefafb] shadow-xs'
                      : 'border-slate-200/80 bg-[#f8fdfe] hover:border-[#70cbff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#008b9e] text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <Calendar className="w-4 h-4 text-cyan-200" />
                  </div>
                  <h4 className="font-serif-clinical font-semibold text-base text-[#003844]">Recepción</h4>
                  <p className="text-xs text-slate-500 mt-1 font-sans-clinical">
                    Admisión de pacientes, asignación de salas y cobros.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoleTab('admin')}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    selectedRoleTab === 'admin'
                      ? 'border-[#004d5a] bg-[#eefafb] shadow-xs'
                      : 'border-slate-200/80 bg-[#f8fdfe] hover:border-[#70cbff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#004d5a] text-white flex items-center justify-center mb-2.5 shadow-xs">
                    <Shield className="w-4 h-4 text-[#70cbff]" />
                  </div>
                  <h4 className="font-serif-clinical font-semibold text-base text-[#003844]">Administración</h4>
                  <p className="text-xs text-slate-500 mt-1 font-sans-clinical">
                    Control de usuarios, métricas de atención y especialidades.
                  </p>
                </button>
              </div>

              {/* Botón de acceso al panel con micro-interacción */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onNavigateLogin}
                  className="group inline-flex items-center gap-2 bg-[#00687a] hover:bg-[#004d5a] text-white text-xs sm:text-sm font-medium px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#00687a]/20 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
                <img src={logoFullWhiteSvg} alt="Centro Médico La Cruz" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif-clinical font-semibold text-base text-white tracking-wide">
                Centro Médico La Cruz
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] font-sans-clinical">
              Clínica de Atención Primaria dedicada al cuidado integral del paciente y la gestión médica
              eficiente.
            </p>
          </div>

          <div>
            <h4 className="font-serif-clinical font-semibold text-white text-sm tracking-wide mb-3">
              Especialidades
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px] font-sans-clinical">
              <li>Medicina General & Familiar</li>
              <li>Pediatría & Puericultura</li>
              <li>Cardiología Preventiva</li>
              <li>Traumatología & Ortopedia</li>
              <li>Ginecología & Obstetricia</li>
              <li>12 Especialidades Oficiales</li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif-clinical font-semibold text-white text-sm tracking-wide mb-3">
              Servicios Web
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px] font-sans-clinical">
              <li>
                <button 
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="hover:text-[#70cbff] transition-colors text-left cursor-pointer"
                >
                  Agendamiento de Citas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenActivatePatient?.()}
                  className="hover:text-[#70cbff] transition-colors text-left cursor-pointer"
                >
                  Consulta de Resultados
                </button>
              </li>
              <li>
                <button onClick={onNavigateLogin} className="hover:text-[#70cbff] transition-colors text-left cursor-pointer">
                  Portal Médico & Administrativo
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif-clinical font-semibold text-white text-sm tracking-wide mb-3">
              Ubicación & Contacto
            </h4>
            <div className="space-y-2 text-slate-400 text-[11px] font-sans-clinical">
              <p>Av. San Martín #450, Equipetrol</p>
              <p>Santa Cruz de la Sierra, Bolivia</p>
              <p className="text-[#70cbff] font-semibold">+591 (3) 336-2211</p>
              <p>Emergencias 24 Horas</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-sans-clinical">
          <div>
            © {new Date().getFullYear()} Centro Médico La Cruz. Sistema de Gestión Clínica.
          </div>
          <div className="flex gap-4">
            <span>Privacidad de Datos Médicos</span>
            <span>Términos de Servicio</span>
          </div>
        </div>
      </footer>

      {/* Modal Fluido: Agendamiento Rápido de Cita */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#00171d]/60 backdrop-blur-sm animate-modal-backdrop"
            onClick={() => setIsAppointmentModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-7 z-10 animate-modal-panel">
            <button
              onClick={() => setIsAppointmentModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-[#e8f7f9] text-[#00687a] flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>

            <h3 className="font-serif-clinical text-2xl text-[#003844] font-normal mb-2">
              Reserva de Consulta
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-sans-clinical">
              Para programar tu cita con el médico de guardia o especialista, puedes ingresar al portal con tu cédula o contactarnos directamente:
            </p>

            <div className="space-y-3 mb-6 font-sans-clinical">
              <button
                onClick={() => {
                  setIsAppointmentModalOpen(false);
                  onOpenActivatePatient?.();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#b2e3ea] bg-[#f8fdfe] hover:bg-[#eefafb] text-left transition-colors group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-[#003844]">Soy Paciente Registrado</div>
                  <div className="text-[11px] text-slate-500">Ingresa o activa tu acceso con tu C.I.</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#00687a] group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="tel:+59133362211"
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#00687a] bg-white text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-[#003844]">Central Telefónica 24/7</div>
                  <div className="text-[11px] text-slate-500">+591 (3) 336-2211 · Recepción y Triaje</div>
                </div>
                <Phone className="w-4 h-4 text-[#00687a]" />
              </a>
            </div>

            <button
              onClick={() => setIsAppointmentModalOpen(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

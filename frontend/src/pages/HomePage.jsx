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
} from 'lucide-react';
import logoColorSvg from '../assets/logo-color.svg';
import doctorsImg from '../assets/doctors-clinica.jpg';
import pediatriaImg from '../assets/clinica-pediatria.png';
import geriatricImg from '../assets/doctor-geriatric.jpg';
import sesionesImg from '../assets/sesiones-clinicas.jpg';

export const HomePage = ({ onNavigateLogin }) => {
  const [activeTab, setActiveTab] = useState('todos');

  return (
    <div className="min-h-screen bg-white text-[#1a3a3f] flex flex-col font-montserrat">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR INSTITUCIONAL (Estilo Foianini / Clínica moderna)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#004d5a] text-white text-xs py-2 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-cyan-100">
              <Phone className="w-3.5 h-3.5 text-[#70cbff]" />
              <span className="font-semibold">Emergencias:</span> +591 (3) 336-2211
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-cyan-100">
              <Mail className="w-3.5 h-3.5 text-[#70cbff]" />
              contacto@clinicalacruz.bo
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-cyan-100">
              <MapPin className="w-3.5 h-3.5 text-[#70cbff]" />
              Atención 24/7 · Santa Cruz, Bolivia
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-cyan-200/90 font-medium hidden sm:inline">
              Clínica de Atención Primaria & Especialidades
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#70cbff]"></span>
            <span className="text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Guardia activa
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HEADER / NAVBAR PRINCIPAL
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo y Nombre Institucional */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00687a]/10 to-[#70cbff]/20 p-1.5 flex items-center justify-center border border-[#00687a]/15 shadow-xs">
              <img
                src={logoColorSvg}
                alt="Logo Centro Médico La Cruz"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-montserrat font-bold text-lg sm:text-xl text-[#004d5a] tracking-tight leading-none">
                Centro Médico La Cruz
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#008b9e] tracking-wider uppercase font-semibold mt-1">
                Clínica de Atención Primaria
              </div>
            </div>
          </div>

          {/* Menú de Navegación Central */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#1a3a3f]">
            <a href="#inicio" className="text-[#00687a] font-semibold hover:text-[#004d5a] transition">
              Inicio
            </a>
            <a href="#especialidades" className="hover:text-[#00687a] transition">
              Especialidades
            </a>
            <a href="#pacientes" className="hover:text-[#00687a] transition">
              Portal Pacientes
            </a>
            <a href="#gestion" className="hover:text-[#00687a] transition">
              Gestión Médica
            </a>
            <a href="#contacto" className="hover:text-[#00687a] transition">
              Contacto
            </a>
          </nav>

          {/* Botón de Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateLogin}
              className="group flex items-center gap-2 bg-[#00687a] hover:bg-[#004d5a] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm shadow-[#00687a]/20 hover:shadow-md hover:scale-[1.01] cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#70cbff] group-hover:translate-x-0.5 transition-transform" />
              <span>Acceso al Sistema</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          3. SECCIÓN HERO PRINCIPAL
      ───────────────────────────────────────────────────────────── */}
      <section id="inicio" className="relative bg-white pt-8 pb-14 sm:pt-12 sm:pb-20 overflow-hidden">
        {/* Sutiles acentos geométricos en tonos turquesa claro */}
        <div className="absolute top-12 right-10 w-96 h-96 rounded-full bg-[#70cbff]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-0 w-80 h-80 rounded-full bg-[#00687a]/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna Izquierda */}
            <div className="lg:col-span-6 flex flex-col items-start z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f7f9] border border-[#70cbff]/40 text-xs font-semibold text-[#00687a] mb-5">
                <span className="w-2 h-2 rounded-full bg-[#00687a]"></span>
                Atención Médica Integral & Portal Clínico
              </div>

              <h1 className="font-montserrat font-bold text-3xl sm:text-5xl xl:text-[54px] text-[#003844] leading-[1.12] tracking-tight mb-5">
                Cuidamos de ti, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00687a] via-[#008b9e] to-[#70cbff]">
                  gestionamos tu salud
                </span>{' '}
                con excelencia.
              </h1>

              <p className="text-[#3b5a60] text-sm sm:text-base leading-relaxed mb-7 max-w-xl">
                Plataforma unificada del <strong>Centro Médico La Cruz</strong> para pacientes, médicos
                especialistas, recepción y administración. Agenda tu cita, consulta tus resultados de
                laboratorio o ingresa al panel médico con un solo clic.
              </p>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
                <a
                  href="#portal-pacientes"
                  className="flex items-center gap-2 bg-[#00687a] hover:bg-[#004d5a] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-[#00687a]/25 hover:shadow-lg hover:scale-[1.01]"
                >
                  <Calendar className="w-4 h-4 text-[#70cbff]" />
                  <span>Pedir Cita Online</span>
                </a>

                <button
                  onClick={onNavigateLogin}
                  className="flex items-center gap-2 bg-[#e8f7f9] hover:bg-[#d5f1f5] text-[#00687a] font-semibold text-sm px-5 py-3 rounded-xl transition-all border border-[#70cbff]/40"
                >
                  <UserCheck className="w-4 h-4 text-[#00687a]" />
                  <span>Portal del Personal</span>
                </button>
              </div>

              {/* Métricas destacadas */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 w-full max-w-lg">
                <div>
                  <div className="font-montserrat font-bold text-2xl sm:text-3xl text-[#00687a]">
                    +15
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Especialidades médicas
                  </div>
                </div>
                <div>
                  <div className="font-montserrat font-bold text-2xl sm:text-3xl text-[#00687a]">
                    +35
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Médicos en plantilla
                  </div>
                </div>
                <div>
                  <div className="font-montserrat font-bold text-2xl sm:text-3xl text-[#00687a]">
                    24/7
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Atención y guardia
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Composición de Imágenes */}
            <div className="lg:col-span-6 relative">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center">
                {/* Imagen 1: Equipo Médico */}
                <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-slate-100 bg-white">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/60 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition"></div>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/60 to-transparent opacity-60"></div>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/60 to-transparent opacity-60"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-10">
                      <p className="text-[11px] font-semibold">Medicina General</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge flotante de acreditación médica */}
              <div className="absolute -bottom-4 -left-3 sm:bottom-4 sm:left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl border border-[#70cbff]/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00687a] to-[#008b9e] text-white flex items-center justify-center shrink-0">
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
          4. TARJETAS DE ACCESO RÁPIDO PARA PACIENTES
      ───────────────────────────────────────────────────────────── */}
      <section id="portal-pacientes" className="bg-[#f3fafb] py-8 sm:py-10 border-y border-[#d8f0f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-[#004d5a]">
              Servicios Rápidos para Pacientes
            </h2>
            <p className="text-xs sm:text-sm text-[#3b5a60] mt-1">
              Sin filas y disponible las 24 horas desde cualquier dispositivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Tarjeta 1: Agendar Cita */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#70cbff]/30 shadow-sm hover:shadow-md transition-all flex items-start gap-4 sm:gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f7f9] border border-[#70cbff]/40 text-[#00687a] flex items-center justify-center shrink-0 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-[#003844] mb-1">
                  Agenda tu consulta
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                  Elige la especialidad, el médico de tu preferencia y la fecha más cómoda para tu atención.
                </p>
                <button
                  onClick={() => alert('Módulo de Citas Online: Próximamente disponible.')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#00687a] hover:text-[#004d5a] transition group-hover:translate-x-1"
                >
                  <span>Reservar turno ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tarjeta 2: Revisar Resultados */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#70cbff]/30 shadow-sm hover:shadow-md transition-all flex items-start gap-4 sm:gap-5 group">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f7f9] border border-[#70cbff]/40 text-[#00687a] flex items-center justify-center shrink-0 group-hover:bg-[#00687a] group-hover:text-white transition-colors duration-300">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-[#003844] mb-1">
                  Revisa tus resultados
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                  Descarga tus órdenes médicas, análisis de laboratorio e informes clínicos de forma segura.
                </p>
                <button
                  onClick={() => alert('Módulo de Resultados: Próximamente disponible.')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#00687a] hover:text-[#004d5a] transition group-hover:translate-x-1"
                >
                  <span>Consultar con mi cédula</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECCIÓN DE GESTIÓN INTERNA
      ───────────────────────────────────────────────────────────── */}
      <section id="gestion" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Foto de sesiones clínicas */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                <img
                  src={sesionesImg}
                  alt="Sesión clínica de médicos especialistas"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003844]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold mb-2">
                    <Activity className="w-3.5 h-3.5 text-[#70cbff]" />
                    Coordinación Multidisciplinaria
                  </div>
                  <h4 className="font-montserrat font-bold text-lg">
                    Comité Médico & Diagnóstico
                  </h4>
                  <p className="text-xs text-cyan-100 mt-1">
                    Sesiones clínicas continuas para casos complejos
                  </p>
                </div>
              </div>
            </div>

            {/* Texto y roles del sistema */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f7f9] text-xs font-semibold text-[#00687a] mb-4">
                <Users className="w-4 h-4 text-[#00687a]" />
                Roles y Gestión Hospitalaria
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
                <div className="p-4 rounded-xl border border-[#70cbff]/30 bg-[#f8fdfe] hover:border-[#00687a] transition">
                  <div className="w-8 h-8 rounded-lg bg-[#00687a] text-white flex items-center justify-center mb-2">
                    <Stethoscope className="w-4 h-4 text-[#70cbff]" />
                  </div>
                  <h4 className="font-montserrat font-bold text-sm text-[#003844]">Médicos</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Agenda diaria, consultas, recetas electrónicas e historia clínica.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#70cbff]/30 bg-[#f8fdfe] hover:border-[#00687a] transition">
                  <div className="w-8 h-8 rounded-lg bg-[#008b9e] text-white flex items-center justify-center mb-2">
                    <Calendar className="w-4 h-4 text-cyan-200" />
                  </div>
                  <h4 className="font-montserrat font-bold text-sm text-[#003844]">Recepción</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Admisión de pacientes, asignación de salas y cobros de consulta.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#70cbff]/30 bg-[#f8fdfe] hover:border-[#00687a] transition">
                  <div className="w-8 h-8 rounded-lg bg-[#004d5a] text-white flex items-center justify-center mb-2">
                    <Shield className="w-4 h-4 text-[#70cbff]" />
                  </div>
                  <h4 className="font-montserrat font-bold text-sm text-[#003844]">Administración</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Control de usuarios, métricas de atención, especialidades y auditoría.
                  </p>
                </div>
              </div>

              {/* CTA directo al login del personal */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onNavigateLogin}
                  className="inline-flex items-center gap-2 bg-[#00687a] hover:bg-[#004d5a] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition shadow-md shadow-[#00687a]/20"
                >
                  <LogIn className="w-4 h-4 text-[#70cbff]" />
                  <span>Ingresar al panel de gestión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. BARRA INFERIOR / FRANJA DE VALORES
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#004d5a] via-[#00687a] to-[#008b9e] text-white py-6 sm:py-8">
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
          7. FOOTER INSTITUCIONAL
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
                <a href="#portal-pacientes" className="hover:text-[#70cbff] transition">
                  Agendamiento de Citas
                </a>
              </li>
              <li>
                <a href="#portal-pacientes" className="hover:text-[#70cbff] transition">
                  Consulta de Resultados
                </a>
              </li>
              <li>
                <button onClick={onNavigateLogin} className="hover:text-[#70cbff] transition text-left cursor-pointer">
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

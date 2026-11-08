import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Stethoscope,
  Calendar,
  Clock,
  User,
  Heart,
  Activity,
  Thermometer,
  Scale,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Pill,
  FlaskConical,
  Building2,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { ModalPortal } from '../../../components/ModalPortal';
import { consultaService } from '../services/consultaService';

/**
 * Modal de Detalle Clínico de Consulta Médica y Triaje (CU16 / CU19)
 * Paquete 4: Historial Clínico y Consultas
 * Centro Médico La Cruz — Clínica Vida Salud
 */
export function ConsultaDetailModal({
  isOpen,
  onClose,
  consulta: initialConsulta,
  consultaId,
}) {
  const [consulta, setConsulta] = useState(initialConsulta || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  // Cargar datos completos de la consulta si se proporciona consultaId o para asegurar relaciones
  useEffect(() => {
    if (!isOpen) return;

    const id = consultaId || initialConsulta?.id_consulta || initialConsulta?.id;
    if (!id) return;

    // Si ya tenemos initialConsulta con detalles completos, mostrarlo inicialmente
    if (initialConsulta && initialConsulta.id_consulta === id) {
      setConsulta(initialConsulta);
    }

    // Fetch fresco de la API para traer receta, órdenes y diagnósticos completos
    async function fetchDetalle() {
      try {
        setLoading(true);
        setError(null);
        const res = await consultaService.getConsulta(id);
        const data = res?.data || res;
        if (data) {
          setConsulta(data);
        }
      } catch (err) {
        console.error('Error al cargar detalle de consulta:', err);
        // Si ya teníamos el inicial, no bloqueamos con error general
        if (!initialConsulta) {
          setError(err.message || 'No se pudo cargar el detalle de la consulta.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDetalle();
  }, [isOpen, consultaId, initialConsulta]);

  if (!isOpen) return null;

  const paciente =
    consulta?.historia_clinica?.paciente ||
    consulta?.historiaClinica?.paciente ||
    consulta?.paciente;

  const medico = consulta?.medico;
  const cita = consulta?.cita;
  const diagnosticos = consulta?.diagnosticos || [];
  const receta = consulta?.receta || (consulta?.recetas && consulta.recetas[0]);
  const ordenes = consulta?.ordenes_examenes || consulta?.ordenesExamenes || [];

  const handlePrint = () => {
    window.print();
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const diff = Date.now() - new Date(fechaNacimiento).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const edad = calcularEdad(paciente?.fecha_nacimiento);

  // Clasificación de IMC con colores
  const getImcBadge = (imc, clasificacion) => {
    if (!imc) return null;
    let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (imc < 18.5) colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (imc >= 25 && imc < 30) colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (imc >= 30) colorClass = 'bg-rose-50 text-rose-700 border-rose-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorClass}`}>
        {clasificacion || (imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad')}
      </span>
    );
  };

  const fechaFormateada = consulta?.fecha_consulta
    ? new Date(consulta.fecha_consulta).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Fecha no registrada';

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      className="print:p-0 print:bg-white print:static"
      panelClassName="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-panel print:border-none print:shadow-none print:max-w-none print:my-0 print:rounded-none"
    >
      <div ref={printRef} className="flex flex-col max-h-[90vh]">
        {/* Cabecera Deep Aqua */}
        <div className="bg-gradient-to-r from-[#003844] to-[#005566] text-white p-5 sm:p-6 flex items-start justify-between relative shrink-0 print:bg-none print:text-slate-900 print:border-b print:border-slate-300">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-300/30 flex items-center gap-1 print:text-slate-700 print:border-slate-300">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-300 print:text-slate-700" />
                Consulta Médica · CU16
              </span>
              {cita?.codigo_cita && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20 print:text-slate-700 print:border-slate-300">
                  Cita: {cita.codigo_cita}
                </span>
              )}
              {cita?.modalidad && (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-cyan-900/40 text-cyan-100 border border-cyan-700/50">
                  {cita.modalidad}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-clinical tracking-tight flex items-center gap-2">
              Ficha Clínica de Consulta #{consulta?.id_consulta || consultaId}
            </h2>
            <p className="text-xs text-cyan-100/80 mt-1 flex items-center gap-1.5 print:text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-cyan-300 print:text-slate-500" />
              <span>{fechaFormateada}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              type="button"
              className="p-2 rounded-xl text-cyan-100 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition cursor-pointer"
              title="Imprimir ficha clínica"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-cyan-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {loading && !consulta ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00687a]" />
              <p className="text-xs font-semibold text-slate-600">Cargando expediente de la consulta...</p>
            </div>
          ) : error && !consulta ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* 1. Tarjeta Resumen: Paciente y Médico Tratante */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paciente */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#00687a]" />
                      Paciente
                    </span>
                    {paciente?.numero_historia && (
                      <span className="font-mono text-[10px] font-bold text-[#003844] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {paciente.numero_historia}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'Paciente no especificado'}
                  </h4>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    {paciente?.numero_documento && (
                      <p className="font-mono text-[11px]">CI / Doc: {paciente.numero_documento}</p>
                    )}
                    <p className="text-slate-500">
                      {edad !== null ? `${edad} años` : ''}
                      {paciente?.sexo ? ` • Sexo: ${paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}` : ''}
                    </p>
                  </div>
                </div>

                {/* Médico Tratante */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-[#00687a]" />
                      Médico Responsable
                    </span>
                    {medico?.codigo_profesional && (
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Matrícula: {medico.codigo_profesional}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {medico ? `Dr(a). ${medico.nombres} ${medico.apellidos}` : 'Médico General'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Atención médica clínica especializada — Centro Médico La Cruz
                  </p>
                </div>
              </div>

              {/* 2. Triaje y Constantes Vitales */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#00687a]" />
                    Constantes Vitales y Triaje Clínico
                  </h3>
                  {consulta?.imc && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">IMC:</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{consulta.imc} kg/m²</span>
                      {getImcBadge(consulta.imc, consulta.clasificacion_imc)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Presión Arterial */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Presión Arterial
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {consulta?.presion_arterial || '—'}
                      </span>
                      {consulta?.presion_arterial && <span className="text-[10px] text-slate-400">mmHg</span>}
                    </div>
                  </div>

                  {/* Frecuencia Cardíaca */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Frecuencia Cardíaca
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {consulta?.frecuencia_cardiaca || '—'}
                      </span>
                      {consulta?.frecuencia_cardiaca && <span className="text-[10px] text-slate-400">lpm</span>}
                    </div>
                  </div>

                  {/* Temperatura */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Temperatura
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {consulta?.temperatura_c ? `${Number(consulta.temperatura_c).toFixed(1)}` : '—'}
                      </span>
                      {consulta?.temperatura_c && <span className="text-[10px] text-slate-400">°C</span>}
                    </div>
                  </div>

                  {/* Peso y Talla */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Peso / Talla
                    </span>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {consulta?.peso_kg ? `${Number(consulta.peso_kg).toFixed(1)} kg` : '—'} /{' '}
                      {consulta?.talla_cm ? `${Number(consulta.talla_cm).toFixed(0)} cm` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Motivo de Consulta y Examen Clínico */}
              <div className="space-y-3">
                {/* Motivo de Consulta */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                    Motivo de Consulta
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {consulta?.motivo_consulta || 'Sin motivo especificado.'}
                  </p>
                </div>

                {/* Observaciones / Evolución */}
                {consulta?.observaciones && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Observaciones Clínicas y Exploración
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {consulta.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Diagnósticos Médicos (CIE-10) */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#00687a]" />
                  Diagnósticos Clínicos (CIE-10) ({diagnosticos.length})
                </h3>

                {diagnosticos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    No se registraron diagnósticos codificados en esta consulta.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {diagnosticos.map((diag, idx) => {
                      const isDefinitivo = diag.tipo === 'DEFINITIVO';
                      return (
                        <div
                          key={diag.id_diagnostico || idx}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-start justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              {diag.codigo_cie10 && (
                                <span className="font-mono text-xs font-bold text-[#003844] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                  {diag.codigo_cie10}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-900">
                                {diag.descripcion}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              isDefinitivo
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isDefinitivo ? (
                              <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            {diag.tipo || 'PRESUNTIVO'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Plan de Tratamiento y Prescripciones */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200/60">
                  <span className="text-[10px] font-bold text-[#00687a] uppercase tracking-wider block mb-1">
                    Plan de Tratamiento y Conducta Terapéutica
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                    {consulta?.plan_tratamiento || 'Conducta médica de control y seguimiento ambulatorio.'}
                  </p>
                </div>

                {/* Receta Médica Asociada (CU18) */}
                {receta && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-[#00687a]" />
                        <span className="text-xs font-bold text-slate-800">
                          Prescripción Farmacológica (Receta #{receta.id_receta})
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {receta.estado || 'EMITIDA'}
                      </span>
                    </div>

                    {receta.detalles && receta.detalles.length > 0 ? (
                      <div className="divide-y divide-slate-100 text-xs">
                        {receta.detalles.map((med, idx) => (
                          <div key={med.id_receta_detalle || idx} className="py-2 flex items-start justify-between gap-2">
                            <div>
                              <span className="font-semibold text-slate-800">{med.medicamento}</span>
                              {med.concentracion && <span className="text-slate-500 ml-1">({med.concentracion})</span>}
                              <p className="text-[11px] text-slate-500">
                                {med.dosis && `Dosis: ${med.dosis}`}
                                {med.frecuencia && ` • Cada ${med.frecuencia}`}
                                {med.duracion_dias && ` • Por ${med.duracion_dias} días`}
                              </p>
                            </div>
                            {med.indicaciones && (
                              <span className="text-[11px] text-slate-600 italic text-right max-w-xs">
                                {med.indicaciones}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Detalle de fármacos no disponible.</p>
                    )}
                  </div>
                )}

                {/* Órdenes de Exámenes Asociadas (CU25) */}
                {ordenes.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                      <FlaskConical className="w-4 h-4 text-[#00687a]" />
                      <span className="text-xs font-bold text-slate-800">
                        Órdenes de Exámenes Auxiliares ({ordenes.length})
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {ordenes.map((ord, idx) => (
                        <div key={ord.id_orden || idx} className="py-2 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-[#003844] mr-2">
                              {ord.codigo_orden || `ORD-${ord.id_orden}`}
                            </span>
                            <span className="font-semibold text-slate-800">{ord.nombre_estudio}</span>
                            <span className="text-[11px] text-slate-500 ml-1">({ord.tipo_estudio})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            {ord.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-[#00687a]" />
            <span className="hidden sm:inline">Centro Médico La Cruz — Ficha Clínica Inmutable</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#003844] to-[#00687a] hover:brightness-105 rounded-xl transition shadow-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
export default ConsultaDetailModal;

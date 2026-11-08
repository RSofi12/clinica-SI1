import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  AlertTriangle, 
  Ban, 
  FileText, 
  User, 
  Calendar, 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Pill
} from 'lucide-react';
import { ModalPortal } from '../../../components/ModalPortal';

/**
 * Modal de Detalle y Vista Membretada Imprimible de Receta Médica (CU18)
 * Metodología PUDS / RUP — Clínica Vida Salud / Centro Médico La Cruz
 */
export default function RecetaDetailModal({ 
  receta, 
  isOpen, 
  onClose, 
  onAnular, 
  currentUser 
}) {
  const printRef = useRef(null);
  const [cachedReceta, setCachedReceta] = useState(receta);

  useEffect(() => {
    if (receta) {
      setCachedReceta(receta);
    }
  }, [receta]);

  const activeReceta = receta || cachedReceta;

  if (!isOpen && !activeReceta) return null;
  if (!activeReceta) return null;

  const esAnulada = activeReceta.estado === 'ANULADO';
  const paciente = activeReceta.historia_clinica?.paciente || activeReceta.consulta?.historia_clinica?.paciente;
  const medico = activeReceta.medico;
  const consulta = activeReceta.consulta;
  const detalles = activeReceta.detalles || [];

  // Determina si el usuario autenticado puede anular (médico prescriptor o admin)
  const rol = currentUser?.tipo_usuario || currentUser?.rol;
  const puedeAnular = !esAnulada && (
    rol === 'ADMIN' || 
    (rol === 'MEDICO' && currentUser?.medico?.id_medico === activeReceta.id_medico)
  );

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

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      className="print:p-0 print:bg-white print:static"
      panelClassName="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-panel print:border-none print:shadow-none print:max-w-none print:my-0 print:rounded-none"
    >
      <div ref={printRef}>
        {/* ENCABEZADO MODAL (Oculto en impresión) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${esAnulada ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Prescripción Médica Oficial #{activeReceta.id_receta}
              </h3>
              <p className="text-xs text-slate-500">
                Emitida el {new Date(activeReceta.fecha_emision).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm cursor-pointer"
              title="Imprimir receta oficial"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              data-modal-close="true"
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALERTA DE RECETA ANULADA (SI APLICA) */}
        {esAnulada && (
          <div className="mx-6 mt-5 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 print:border-rose-400">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold uppercase tracking-wide">Receta Médica Anulada — Sin Validez Farmacéutica</span>
              {activeReceta.motivo_anulacion && (
                <p className="text-rose-700">
                  <span className="font-medium">Motivo de anulación:</span> {activeReceta.motivo_anulacion}
                </p>
              )}
              {activeReceta.anulado_en && (
                <p className="text-rose-600 text-[11px]">
                  Fecha de anulación: {new Date(activeReceta.anulado_en).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* HOJA DE RECETA CLÍNICA MEMBRETADA */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 relative">
          {/* Marca de Agua si está Anulada */}
          {esAnulada && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
              <span className="text-rose-500/15 font-black text-6xl sm:text-7xl -rotate-45 tracking-widest border-4 border-dashed border-rose-500/20 px-8 py-4 rounded-3xl">
                ANULADA
              </span>
            </div>
          )}

          {/* MEMBRETE INSTITUCIONAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b-2 border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  +
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
                    Clínica Vida Salud
                  </h1>
                  <p className="text-[11px] font-medium text-teal-700 uppercase tracking-wider">
                    Centro Médico La Cruz — Atención Integral
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Av. San Martín #1420 · Santa Cruz, Bolivia · Tel: +591 (3) 345-6789
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                Receta Médica Nº {String(activeReceta.id_receta).padStart(5, '0')}
              </span>
              <p className="text-xs text-slate-500 mt-1 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha: {new Date(activeReceta.fecha_emision).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* FICHA DEL PACIENTE Y PROFESIONAL TRATANTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
            {/* Paciente */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Datos del Paciente
              </div>
              <p className="text-sm font-bold text-slate-900">
                {paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'No especificado'}
              </p>
              <div className="grid grid-cols-2 gap-1 text-slate-600">
                <span><span className="font-medium text-slate-700">Documento:</span> {paciente?.numero_documento || 'S/D'}</span>
                <span><span className="font-medium text-slate-700">Nº H.C.:</span> {paciente?.numero_historia || 'S/N'}</span>
                {edad !== null && <span><span className="font-medium text-slate-700">Edad:</span> {edad} años</span>}
                {paciente?.sexo && <span><span className="font-medium text-slate-700">Sexo:</span> {paciente.sexo}</span>}
              </div>
            </div>

            {/* Médico Tratante */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                Médico Prescriptor
              </div>
              <p className="text-sm font-bold text-slate-900">
                Dr(a). {medico ? `${medico.nombres} ${medico.apellidos}` : 'No especificado'}
              </p>
              <p className="text-slate-600">
                <span className="font-medium text-slate-700">Matrícula Prof.:</span> {medico?.codigo_profesional || 'En trámite'}
              </p>
              {medico?.especialidades?.length > 0 && (
                <p className="text-slate-600">
                  <span className="font-medium text-slate-700">Especialidad:</span> {medico.especialidades.map(e => e.nombre).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* DIAGNÓSTICOS ASOCIADOS (SI EXISTEN EN LA CONSULTA) */}
          {consulta?.diagnosticos?.length > 0 && (
            <div className="text-xs p-3 rounded-lg bg-teal-50/50 border border-teal-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-teal-900">Diagnóstico(s) CIE-10 Asociados: </span>
                <span className="text-teal-800">
                  {consulta.diagnosticos.map(d => `${d.descripcion} ${d.codigo_cie10 ? `(${d.codigo_cie10})` : ''}`).join(' · ')}
                </span>
              </div>
            </div>
          )}

          {/* PRESCRIPCIÓN FARMACOLÓGICA (RP / ℞) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="font-serif italic font-bold text-2xl text-teal-700">℞</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Plan Farmacológico y Posología
              </h2>
            </div>

            {detalles.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 text-center">
                No hay medicamentos registrados en esta prescripción.
              </p>
            ) : (
              <div className="space-y-3">
                {detalles.map((item, index) => (
                  <div 
                    key={item.id_detalle || index}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition space-y-2 print:border-slate-300 print:p-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.medicamento}
                        </h4>
                      </div>

                      {/* BADGES POSOLÓGICOS */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {item.dosis}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.frecuencia}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {item.duracion}
                        </span>
                      </div>
                    </div>

                    {item.indicaciones && (
                      <p className="text-xs text-slate-600 pl-7 italic">
                        <span className="font-medium not-italic text-slate-700">Indicaciones: </span>
                        {item.indicaciones}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INDICACIONES GENERALES Y DIETA */}
          {activeReceta.indicaciones_generales && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-semibold text-slate-800 uppercase tracking-wider block">
                Recomendaciones Generales e Indicaciones Higiénico-Dietéticas:
              </span>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                {activeReceta.indicaciones_generales}
              </p>
            </div>
          )}

          {/* FIRMA Y SELLO PROFESIONAL */}
          <div className="pt-8 flex flex-col sm:flex-row items-end justify-between gap-6 print:pt-16">
            <div className="text-[11px] text-slate-400 max-w-xs space-y-0.5">
              <p>Documento clínico digital inmutable.</p>
              <p>Validez legal conforme a Ley de Salud y Normativa Médica.</p>
              <p>Clínica Vida Salud · Sistema SI1</p>
            </div>

            <div className="text-center w-60 border-t-2 border-slate-300 pt-2 space-y-0.5">
              <p className="text-xs font-bold text-slate-900">
                Dr(a). {medico ? `${medico.nombres} ${medico.apellidos}` : 'Firma Autorizada'}
              </p>
              <p className="text-[11px] text-slate-500">
                Matrícula: {medico?.codigo_profesional || 'Médico Cirujano'}
              </p>
              <p className="text-[10px] text-teal-700 font-medium">
                Firma y Sello Profesional
              </p>
            </div>
          </div>
        </div>

        {/* PIE DEL MODAL (Acciones interactivas - Oculto en impresión) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 print:hidden">
          <div>
            {puedeAnular && (
              <button
                type="button"
                onClick={() => onAnular(activeReceta)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition shadow-sm cursor-pointer"
              >
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Anular Receta</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar</span>
            </button>
            <button
              type="button"
              data-modal-close="true"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Paperclip,
  UploadCloud,
  FileText,
  FileImage,
  FileArchive,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  FileCode,
  Link as LinkIcon,
  Eye,
  Info
} from 'lucide-react';
import { documentoClinicoService } from '../services/documentoClinicoService';
import { useAuth } from '../../../context/AuthContext';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const OBSERVACIONES_MAX_LENGTH = 1000;
const EXTERNAL_DICOM_VIEWER_URL = 'https://www.imaios.com/es/imaios-dicom-viewer';

const DOCUMENT_CATEGORIES = [
  { value: 'FONDO_DE_OJO', label: 'Fondo de ojo' },
  { value: 'TOPOGRAFIA_CORNEAL', label: 'Topografía corneal' },
  { value: 'OCT', label: 'Tomografía de coherencia óptica (OCT)' },
  { value: 'CAMPO_VISUAL', label: 'Campo visual' },
  { value: 'ECOGRAFIA_OCULAR', label: 'Ecografía ocular' },
  { value: 'INFORME_LABORATORIO', label: 'Informe de laboratorio' },
  { value: 'INFORME_EXTERNO', label: 'Informe externo' },
  { value: 'CONSENTIMIENTO', label: 'Consentimiento informado' },
  { value: 'OTRO', label: 'Otro estudio o documento' },
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'dcm'];

export default function ClinicalDocumentsSection({
  historialId,
  historialEstado = 'ACTIVO',
  onDocumentChange = null,
}) {
  const { user } = useAuth();
  const role = (user?.rol || user?.tipo_usuario || '').toUpperCase();
  const isPatient = role === 'PACIENTE';
  const isStaff = ['ADMIN', 'MEDICO', 'ADMINISTRADOR'].includes(role);
  const isArchived = historialEstado === 'ARCHIVADO';

  const fileInputRef = useRef(null);

  // Estados de datos
  const [documents, setDocuments] = useState([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Estados del formulario
  const [formOpen, setFormOpen] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [selectedOrdenId, setSelectedOrdenId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [observations, setObservations] = useState('');
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modales secundarios
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [dicomModalDoc, setDicomModalDoc] = useState(null);
  const [previewModalDoc, setPreviewModalDoc] = useState(null);

  // Cargar documentos y órdenes pendientes al montar o cambiar historialId
  useEffect(() => {
    if (historialId) {
      loadDocuments();
      if (isStaff) {
        loadOrdenesPendientes();
      }
    }
  }, [historialId]);

  const loadDocuments = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await documentoClinicoService.fetchDocumentos(historialId);
      const docs = res?.data || [];
      setDocuments(docs);
      if (onDocumentChange) {
        onDocumentChange(docs);
      }
    } catch (err) {
      console.error('Error cargando documentos clínicos:', err);
      setLoadError(err?.message || 'No se pudieron cargar los documentos clínicos.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenesPendientes = async () => {
    try {
      const res = await documentoClinicoService.fetchOrdenesPendientes(historialId);
      setOrdenesPendientes(res?.data || []);
    } catch (err) {
      console.warn('No se pudieron obtener órdenes pendientes:', err);
      setOrdenesPendientes([]);
    }
  };

  const resetForm = () => {
    setDocumentType('');
    setSelectedOrdenId('');
    setSelectedFile(null);
    setObservations('');
    setFormError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeForm = () => {
    if (uploading) return;
    resetForm();
    setFormOpen(false);
  };

  const handleFileChange = (e) => {
    setFormError(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFormError('Formato no permitido. Solo se aceptan archivos JPG, JPEG, PNG, PDF o DICOM (.dcm).');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormError('El archivo supera el límite máximo permitido de 15 MB.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size === 0) {
      setFormError('El archivo seleccionado está vacío.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) return null;
    const mb = (selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${selectedFile.name} (${mb} MB)`;
  }, [selectedFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setFormError(null);

    if (isPatient || !isStaff || isArchived) {
      setFormError('No tienes privilegios para adjuntar documentos en este historial.');
      return;
    }

    if (!documentType) {
      setFormError('Por favor, selecciona una categoría o tipo de documento.');
      return;
    }

    if (!selectedFile) {
      setFormError('Debes seleccionar un archivo para adjuntar.');
      return;
    }

    const formData = new FormData();
    formData.append('tipo_documento', documentType);
    formData.append('archivo', selectedFile);
    if (selectedOrdenId) {
      formData.append('id_orden', selectedOrdenId);
    }
    if (observations.trim()) {
      formData.append('observaciones', observations.trim());
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await documentoClinicoService.uploadDocumento(historialId, formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(percent);
        }
      });

      setSuccess('Documento clínico adjuntado correctamente.');
      resetForm();
      setFormOpen(false);
      await loadDocuments();
      if (isStaff) {
        await loadOrdenesPendientes();
      }
    } catch (err) {
      console.error('Error al subir documento clínico:', err);
      setFormError(err?.message || 'Error al procesar la subida del archivo.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setDeletingId(deleteCandidate.id_documento);
    setLoadError(null);
    setSuccess(null);

    try {
      await documentoClinicoService.deleteDocumento(deleteCandidate.id_documento);
      setSuccess(`Documento "${deleteCandidate.nombre_archivo}" eliminado correctamente.`);
      setDeleteCandidate(null);
      await loadDocuments();
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setLoadError(err?.message || 'No se pudo eliminar el documento.');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper de descarga directa con cabecera attachment para Cloudinary
  const getDownloadUrl = (doc) => {
    if (!doc.cloudinary_url) return '#';
    if (doc.formato_archivo === 'DCM') return doc.cloudinary_url;
    if (doc.cloudinary_url.includes('/upload/')) {
      return doc.cloudinary_url.replace('/upload/', '/upload/fl_attachment/');
    }
    return doc.cloudinary_url;
  };

  const formatFecha = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CABECERA DE LA SECCIÓN (IDÉNTICA AL ESTILO DE REFERENCIA) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Paperclip className="w-5 h-5" />
          </span>
          <div>
            <div className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
              CU26 · Archivo Documental
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Documentos clínicos adjuntos
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Imágenes e informes asociados directamente a este historial clínico.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            {documents.length} {documents.length === 1 ? 'archivo' : 'archivos'}
          </span>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            title="Actualizar documentos"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isStaff && !isArchived && (
            <button
              type="button"
              onClick={() => {
                setSuccess(null);
                if (formOpen) closeForm();
                else setFormOpen(true);
              }}
              disabled={uploading}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-sm ${
                formOpen
                  ? 'bg-slate-700 hover:bg-slate-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {formOpen ? 'Cerrar formulario' : 'Adjuntar documento'}
            </button>
          )}
        </div>
      </div>

      {/* 2. MENSAJES DE ESTADO Y ALERTAS */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* 3. FORMULARIO DESPLEGABLE PARA ADJUNTAR DOCUMENTO */}
      {formOpen && isStaff && !isArchived && (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 border border-indigo-100 shadow-sm space-y-5 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-indigo-100/70">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Nuevo documento clínico</h4>
              <span className="text-[11px] text-slate-500 font-medium">
                JPG, JPEG, PNG, PDF o DICOM · máximo 15 MB
              </span>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría de Documento */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Documento <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
                disabled={uploading}
                className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
              >
                <option value="">Selecciona una categoría</option>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Archivo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Archivo <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="clinical-file-input"
                  accept=".jpg,.jpeg,.png,.pdf,.dcm"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="clinical-file-input"
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer transition shadow-2xs shrink-0 ${
                    uploading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  Seleccionar archivo
                </label>
                <span className="text-xs text-slate-600 truncate font-medium">
                  {selectedFileSummary || 'Sin archivos seleccionados'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Selecciona un archivo desde tu equipo (hasta 15 MB).
              </p>
            </div>
          </div>

          {/* Selector de Orden de Examen Auxiliar (CU25) — Modalidad Dual */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vincular a Orden de Examen Auxiliar (Opcional — CU25)
            </label>
            <div className="relative">
              <select
                value={selectedOrdenId}
                onChange={(e) => setSelectedOrdenId(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
              >
                <option value="">-- Archivo autónomo / independiente (Sin orden previa) --</option>
                {ordenesPendientes.map((orden) => (
                  <option key={orden.id_orden} value={orden.id_orden}>
                    Orden #{orden.id_orden} — {orden.nombre_examen} ({orden.fecha_formateada || 'Pendiente'})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-indigo-600/80 mt-1">
              💡 Si este estudio corresponde a una orden de examen previa emitida en la clínica, selecciónala aquí para actualizar automáticamente su estado a <strong>CON RESULTADOS</strong>.
            </p>
          </div>

          {/* Observaciones o Conclusión Clínica */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Observaciones o Conclusión
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {observations.length}/{OBSERVACIONES_MAX_LENGTH}
              </span>
            </div>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              maxLength={OBSERVACIONES_MAX_LENGTH}
              rows={3}
              disabled={uploading}
              placeholder="Ej.: hallazgos principales, resultado del estudio o conclusión del especialista."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none font-sans text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Barra de Progreso durante la Carga */}
          {uploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/60">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Transmitiendo estudio a Cloudinary...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={uploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Subiendo documento...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Subir documento
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 4. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteCandidate && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm animate-in fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-bold text-rose-900">
              ¿Eliminar documento "{deleteCandidate.nombre_archivo}"?
            </h5>
            <p className="text-[11px] text-rose-700">
              Se eliminará también del repositorio Cloudinary. Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDeleteCandidate(null)}
              disabled={deletingId !== null}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deletingId !== null}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
            >
              {deletingId ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deletingId ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL DE INFORMACIÓN Y ASISTENCIA DICOM */}
      {dicomModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <FileArchive className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Estudio Tomográfico / DICOM (.dcm)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {dicomModalDoc.nombre_archivo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDicomModalDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-2">
              <p className="font-semibold">
                ⚠️ Vista previa directa no soportada en navegadores web.
              </p>
              <p className="text-purple-800 leading-relaxed">
                Los archivos con formato <strong>DICOM (.dcm)</strong> contienen metadatos radiológicos y secuencias volumétricas de alta densidad médica. Para visualizarlos con herramientas de medición, contraste y zoom:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-purple-800 text-[11px]">
                <li>Descarga el archivo <code>.dcm</code> en tu computadora con el botón de abajo.</li>
                <li>Abre el Visor DICOM oficial (IMAIOS DICOM Viewer u OsiriX).</li>
                <li>Arrastra el archivo descargado sobre la página del visor para examinar los cortes tomográficos.</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <a
                href={EXTERNAL_DICOM_VIEWER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Visor DICOM (IMAIOS)
              </a>

              <a
                href={dicomModalDoc.cloudinary_url}
                download={dicomModalDoc.nombre_archivo}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar .dcm ({dicomModalDoc.tamanio_legible || 'Archivo'})
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE PREVISUALIZACIÓN DE IMÁGENES / PDF */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Eye className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate max-w-md">
                    {previewModalDoc.nombre_archivo}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {previewModalDoc.tipo_documento_display} · {previewModalDoc.tamanio_legible}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDownloadUrl(previewModalDoc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
                <button
                  onClick={() => setPreviewModalDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              {['JPG', 'PNG', 'JPEG'].includes(previewModalDoc.formato_archivo) ? (
                <img
                  src={previewModalDoc.cloudinary_url}
                  alt={previewModalDoc.nombre_archivo}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
                />
              ) : previewModalDoc.formato_archivo === 'PDF' ? (
                <iframe
                  src={previewModalDoc.cloudinary_url}
                  title={previewModalDoc.nombre_archivo}
                  className="w-full h-[70vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 7. LISTADO DE DOCUMENTOS CLÍNICOS */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <LoaderCircle className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Cargando documentos clínicos...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
            <Paperclip className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Aún no hay documentos adjuntos</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Las imágenes, estudios DICOM e informes que se agreguen al historial aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {documents.map((doc) => {
            const isDicom = doc.formato_archivo === 'DCM';
            const isPdf = doc.formato_archivo === 'PDF';
            const isImg = ['JPG', 'PNG', 'JPEG'].includes(doc.formato_archivo);

            return (
              <div
                key={doc.id_documento}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-xs transition duration-150 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Icono de formato */}
                  <span
                    className={`p-3 rounded-2xl shrink-0 border ${
                      isDicom
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : isPdf
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                  >
                    {isDicom ? (
                      <FileArchive className="w-5 h-5" />
                    ) : isPdf ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <FileImage className="w-5 h-5" />
                    )}
                  </span>

                  {/* Metadatos y título */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        {doc.tipo_documento_display}
                      </span>

                      {/* Badge de Formato */}
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                          isDicom
                            ? 'bg-purple-100/70 text-purple-800 border-purple-300'
                            : isPdf
                            ? 'bg-rose-100/70 text-rose-800 border-rose-300'
                            : 'bg-sky-100/70 text-sky-800 border-sky-300'
                        }`}
                      >
                        {doc.formato_archivo}
                      </span>

                      {/* Badge de Orden CU25 (si está asociado) */}
                      {doc.id_orden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          Orden #{doc.id_orden}
                          {doc.orden_examen?.nombre_examen ? `: ${doc.orden_examen.nombre_examen}` : ''}
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-semibold text-slate-900 truncate font-mono">
                      {doc.nombre_archivo}
                    </h5>

                    {/* Observaciones o Conclusiones */}
                    {doc.observaciones ? (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 font-sans">
                        {doc.observaciones}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Sin observaciones registradas.
                      </p>
                    )}

                    {/* Subido por y fecha */}
                    <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span>Subido por <strong>{doc.subido_por_nombre || 'Sistema'}</strong></span>
                      <span>·</span>
                      <span>{formatFecha(doc.created_at)}</span>
                      {doc.tamanio_legible && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{doc.tamanio_legible}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción a la Derecha */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Botón Ver / Inspeccionar */}
                  {isDicom ? (
                    <button
                      type="button"
                      onClick={() => setDicomModalDoc(doc)}
                      title="Abrir asistente de visualización DICOM"
                      className="p-2 rounded-xl text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-slate-200 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewModalDoc(doc)}
                      title="Vista previa del documento"
                      className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  {/* Botón Descargar */}
                  <a
                    href={getDownloadUrl(doc)}
                    download={doc.nombre_archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Descargar archivo a tu dispositivo"
                    className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {/* Botón Eliminar (Médicos y Administradores) */}
                  {isStaff && !isArchived && (
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(doc)}
                      title="Eliminar documento clínico"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

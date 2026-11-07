import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Eye,
  Info,
  Check,
  ArrowUpRight
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

  // Filtro de categoría / formato activo
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'IMAGE' | 'PDF' | 'DICOM' | 'CU25'

  // Estados del formulario y Drag & Drop
  const [formOpen, setFormOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  // Cargar documentos y órdenes pendientes de forma robusta
  useEffect(() => {
    if (historialId) {
      loadDocuments();
      if (isStaff) {
        loadOrdenesPendientes();
      }
    } else {
      setLoading(false);
      setDocuments([]);
    }
  }, [historialId]);

  // Cierre de modales con Escape y bloqueo de scroll de página
  useEffect(() => {
    const isModalOpen = Boolean(dicomModalDoc || previewModalDoc || deleteCandidate);
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDicomModalDoc(null);
        setPreviewModalDoc(null);
        setDeleteCandidate(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dicomModalDoc, previewModalDoc, deleteCandidate]);

  const loadDocuments = async () => {
    if (!historialId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await documentoClinicoService.fetchDocumentos(historialId);
      const raw = res?.data;
      const docs = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(res?.data?.items) ? res.data.items : []));
      
      setDocuments(docs);
      if (onDocumentChange) {
        onDocumentChange(docs);
      }
    } catch (err) {
      console.error('Error cargando documentos clínicos:', err);
      setLoadError(err?.message || 'No se pudieron cargar los documentos clínicos.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenesPendientes = async () => {
    if (!historialId) return;
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
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeForm = () => {
    if (uploading) return;
    resetForm();
    setFormOpen(false);
  };

  const validateAndSetFile = (file) => {
    setFormError(null);
    if (!file) {
      setSelectedFile(null);
      return false;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFormError('Formato no permitido. Solo se aceptan archivos JPG, JPEG, PNG, PDF o DICOM (.dcm).');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormError('El archivo supera el límite máximo permitido de 15 MB.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    if (file.size === 0) {
      setFormError('El archivo seleccionado está vacío.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    validateAndSetFile(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    validateAndSetFile(file);
  };

  const selectedFileSummary = useMemo(() => {
    if (!selectedFile) return null;
    const mb = (selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${selectedFile.name} (${mb} MB)`;
  }, [selectedFile]);

  // Contadores para filtros
  const counts = useMemo(() => {
    let images = 0;
    let pdfs = 0;
    let dicoms = 0;
    let ordenes = 0;

    if (Array.isArray(documents)) {
      documents.forEach((d) => {
        const fmt = d.formato_archivo?.toUpperCase();
        if (['JPG', 'JPEG', 'PNG'].includes(fmt)) images++;
        if (fmt === 'PDF') pdfs++;
        if (fmt === 'DCM') dicoms++;
        if (d.id_orden) ordenes++;
      });
    }

    return { total: documents.length || 0, images, pdfs, dicoms, ordenes };
  }, [documents]);

  // Documentos filtrados
  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    if (activeFilter === 'IMAGE') {
      return documents.filter((d) => ['JPG', 'JPEG', 'PNG'].includes(d.formato_archivo?.toUpperCase()));
    }
    if (activeFilter === 'PDF') {
      return documents.filter((d) => d.formato_archivo?.toUpperCase() === 'PDF');
    }
    if (activeFilter === 'DICOM') {
      return documents.filter((d) => d.formato_archivo?.toUpperCase() === 'DCM');
    }
    if (activeFilter === 'CU25') {
      return documents.filter((d) => Boolean(d.id_orden));
    }
    return documents;
  }, [documents, activeFilter]);

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
    <div className="space-y-6 animate-view-fade">
      {/* 1. CABECERA CON PALETA INSTITUCIONAL TEAL/AQUA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs shrink-0">
            <Paperclip className="w-5 h-5 text-teal-700" />
          </span>
          <div>
            <div className="text-[11px] font-bold text-teal-800 tracking-wider uppercase flex items-center gap-1.5">
              <span>CU26 · Archivo Documental</span>
              <span className="w-1 h-1 rounded-full bg-teal-500"></span>
              <span className="text-slate-400 font-medium lowercase">cloud storage</span>
            </div>
            <h3 className="text-lg font-serif-clinical font-semibold text-slate-900 tracking-tight">
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
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-200 active:scale-95 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm active:scale-95 cursor-pointer ${
                formOpen
                  ? 'bg-slate-700 hover:bg-slate-800'
                  : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 hover:shadow-teal-200'
              }`}
            >
              {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {formOpen ? 'Cerrar formulario' : 'Adjuntar documento'}
            </button>
          )}
        </div>
      </div>

      {/* 2. MENSAJES DE ESTADO */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 animate-view-fade">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold p-1 rounded hover:bg-emerald-100/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-view-fade">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* 3. FORMULARIO DESPLEGABLE CON TEAL CLÍNICO Y DRAG & DROP */}
      {formOpen && isStaff && !isArchived && (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-50/40 via-white to-slate-50 border border-teal-200/70 shadow-sm space-y-5 animate-view-fade"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-teal-100/80">
            <UploadCloud className="w-5 h-5 text-teal-700" />
            <div>
              <h4 className="text-sm font-serif-clinical font-semibold text-slate-900">
                Nuevo documento clínico
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                JPG, JPEG, PNG, PDF o DICOM · máximo 15 MB
              </span>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-view-fade">
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
                className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 shadow-2xs transition"
              >
                <option value="">Selecciona una categoría</option>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Archivo con Drag & Drop */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Archivo <span className="text-rose-500">*</span>
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-200 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-dashed border-slate-300 bg-white hover:border-teal-400'
                }`}
              >
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
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all shadow-2xs shrink-0 active:scale-95 ${
                    uploading
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  Seleccionar archivo
                </label>
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-slate-700 font-medium truncate block">
                    {selectedFileSummary || (isDragging ? 'Suelta el archivo aquí...' : 'Sin archivos seleccionados')}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    o arrastra tu archivo a este recuadro
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Orden de Examen Auxiliar (CU25) — Modalidad Dual */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vincular a Orden de Examen Auxiliar (Opcional — CU25)
            </label>
            <select
              value={selectedOrdenId}
              onChange={(e) => setSelectedOrdenId(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 shadow-2xs transition"
            >
              <option value="">-- Archivo autónomo / independiente (Sin orden previa) --</option>
              {ordenesPendientes.map((orden) => (
                <option key={orden.id_orden} value={orden.id_orden}>
                  Orden #{orden.id_orden} — {orden.nombre_examen} ({orden.fecha_formateada || 'Pendiente'})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-teal-800/80 mt-1">
              💡 Si este estudio corresponde a una orden previa emitida en la clínica, selecciónala para actualizar automáticamente su estado a <strong>CON RESULTADOS</strong>.
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
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 resize-none font-sans text-slate-800 placeholder:text-slate-400 shadow-2xs transition"
            />
          </div>

          {/* Barra de Progreso durante la Carga */}
          {uploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-teal-50/80 border border-teal-200/70 animate-view-fade">
              <div className="flex items-center justify-between text-xs text-teal-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin text-teal-700" />
                  Transmitiendo estudio a Cloudinary...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-teal-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-700 h-2 rounded-full transition-all duration-200 ease-out"
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 active:scale-95 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Subiendo...
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

      {/* 4. PESTAÑAS DE FILTRO POR TIPO / FORMATO */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todos ({counts.total})
          </button>

          {counts.images > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('IMAGE')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'IMAGE'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Imágenes ({counts.images})
            </button>
          )}

          {counts.pdfs > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('PDF')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'PDF'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Informes PDF ({counts.pdfs})
            </button>
          )}

          {counts.dicoms > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('DICOM')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'DICOM'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              DICOM (.dcm) ({counts.dicoms})
            </button>
          )}

          {counts.ordenes > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('CU25')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'CU25'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Con Orden CU25 ({counts.ordenes})
            </button>
          )}
        </div>
      )}

      {/* 5. LISTADO DE DOCUMENTOS CON TARJETAS ELEVABLES */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <LoaderCircle className="w-7 h-7 text-teal-700 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">Cargando documentos clínicos...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-100">
            <Paperclip className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {activeFilter === 'ALL'
              ? 'Aún no hay documentos adjuntos'
              : 'No hay documentos en este filtro'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeFilter === 'ALL'
              ? 'Las imágenes, estudios DICOM e informes que se agreguen al historial aparecerán aquí.'
              : 'Selecciona la pestaña "Todos" para visualizar el archivo documental completo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDocuments.map((doc) => {
            const isDicom = doc.formato_archivo === 'DCM';
            const isPdf = doc.formato_archivo === 'PDF';
            const isImg = ['JPG', 'PNG', 'JPEG'].includes(doc.formato_archivo);

            return (
              <div
                key={doc.id_documento}
                className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Icono de Formato */}
                  <span
                    className={`p-3 rounded-2xl shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                      isDicom
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
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
                            ? 'bg-teal-100/70 text-teal-800 border-teal-300'
                            : isPdf
                            ? 'bg-rose-100/70 text-rose-800 border-rose-300'
                            : 'bg-sky-100/70 text-sky-800 border-sky-300'
                        }`}
                      >
                        {doc.formato_archivo}
                      </span>

                      {/* Badge de Orden CU25 (si está asociado) */}
                      {doc.id_orden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-teal-600" />
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
                      <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 font-sans leading-relaxed">
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

                {/* Botones de Acción */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Botón Ver / Inspeccionar */}
                  {isDicom ? (
                    <button
                      type="button"
                      onClick={() => setDicomModalDoc(doc)}
                      title="Abrir asistente de visualización DICOM"
                      className="p-2 rounded-xl text-teal-800 hover:text-teal-900 hover:bg-teal-50 border border-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewModalDoc(doc)}
                      title="Vista previa del documento"
                      className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition active:scale-95 cursor-pointer"
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
                    className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {/* Botón Eliminar (Médicos y Administradores) */}
                  {isStaff && !isArchived && (
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(doc)}
                      title="Eliminar documento clínico"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition active:scale-95 cursor-pointer"
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

      {/* 6. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CON CREATEPORTAL */}
      {deleteCandidate &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteCandidate(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-modal-backdrop cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-modal-panel cursor-default"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <span className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    ¿Eliminar documento clínico?
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {deleteCandidate.nombre_archivo}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                El documento será dado de baja lógica en el historial del paciente y su archivo físico se eliminará de forma irreversible del repositorio en Cloudinary.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  disabled={deletingId !== null}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-95 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {deletingId ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deletingId ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 7. MODAL DE ASISTENCIA DICOM CON CREATEPORTAL */}
      {dicomModalDoc &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setDicomModalDoc(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-modal-backdrop cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-modal-panel cursor-default"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                    <FileArchive className="w-5 h-5 text-teal-700" />
                  </span>
                  <div>
                    <h4 className="text-sm font-serif-clinical font-bold text-slate-900">
                      Estudio Tomográfico / DICOM (.dcm)
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      {dicomModalDoc.nombre_archivo}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDicomModalDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-teal-950 space-y-2">
                <p className="font-semibold flex items-center gap-1.5 text-teal-900">
                  <Info className="w-4 h-4 text-teal-700 shrink-0" />
                  Visualización especializada en visor médico externo
                </p>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Los archivos <strong>DICOM (.dcm)</strong> almacenan secuencias de tomografía computarizada, resonancias y cortes volumétricos de alta precisión que requieren herramientas de ventana, contraste y calibración espacial.
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-[11px]">
                  <li>Descarga el archivo <code>.dcm</code> con el botón de descarga.</li>
                  <li>Abre el Visor DICOM web (IMAIOS).</li>
                  <li>Arrastra el archivo sobre la ventana del visor para examinar los cortes clínicos.</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <a
                  href={EXTERNAL_DICOM_VIEWER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 active:scale-95 transition shadow-2xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Visor DICOM (IMAIOS)
                  <ArrowUpRight className="w-3 h-3 text-teal-600" />
                </a>

                <a
                  href={dicomModalDoc.cloudinary_url}
                  download={dicomModalDoc.nombre_archivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 active:scale-95 rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar .dcm ({dicomModalDoc.tamanio_legible || 'Archivo'})
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 8. MODAL DE PREVISUALIZACIÓN DE IMÁGENES / PDF CON CREATEPORTAL */}
      {previewModalDoc &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewModalDoc(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-modal-backdrop cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-modal-panel cursor-default"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
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
                    download={previewModalDoc.nombre_archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </a>
                  <button
                    onClick={() => setPreviewModalDoc(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                    className="max-h-[72vh] w-auto object-contain rounded-lg shadow-md"
                  />
                ) : previewModalDoc.formato_archivo === 'PDF' ? (
                  <iframe
                    src={previewModalDoc.cloudinary_url}
                    title={previewModalDoc.nombre_archivo}
                    className="w-full h-[72vh] rounded-lg border border-slate-200 bg-white"
                  />
                ) : null}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

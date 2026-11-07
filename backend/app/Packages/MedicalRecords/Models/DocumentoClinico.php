<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\Security\Models\User;

/**
 * Modelo de Documentos Clínicos Adjuntos
 * Tabla relacional: 'documentos_clinicos'
 * Clase UML: 'DocumentosClinicos'
 * Paquete 4: Historial Clínico y Consultas (CU26)
 */
class DocumentoClinico extends Model
{
    protected $table = 'documentos_clinicos';
    protected $primaryKey = 'id_documento';

    protected $fillable = [
        'id_historia_clinica',
        'id_consulta',
        'id_orden',
        'id_medico',
        'subido_por',
        'titulo',
        'nombre_archivo',
        'formato_archivo', // JPG, PNG, PDF, DCM
        'tipo_documento',   // FONDO_DE_OJO, TOPOGRAFIA_CORNEAL, OCT, CAMPO_VISUAL, ECOGRAFIA_OCULAR, INFORME_LABORATORIO, INFORME_EXTERNO, CONSENTIMIENTO, OTRO
        'descripcion',
        'ruta_archivo',
        'cloudinary_public_id',
        'mime_type',
        'tamanio_bytes',
        'fecha_subida',
        'estado', // ACTIVO, ARCHIVADO, INACTIVO
    ];

    protected $casts = [
        'fecha_subida' => 'datetime',
        'tamanio_bytes' => 'integer',
        'id_orden' => 'integer',
        'id_consulta' => 'integer',
        'id_medico' => 'integer',
        'subido_por' => 'integer',
    ];

    protected $appends = [
        'es_dicom',
        'tamanio_legible',
    ];

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'id_consulta', 'id_consulta');
    }

    public function ordenExamen(): BelongsTo
    {
        return $this->belongsTo(OrdenExamen::class, 'id_orden', 'id_orden');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    public function subidoPorUsuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subido_por', 'id_usuario');
    }

    /**
     * Evalúa si el archivo corresponde al formato médico DICOM
     */
    public function getEsDicomAttribute(): bool
    {
        return strtoupper($this->formato_archivo ?? '') === 'DCM';
    }

    /**
     * Retorna el tamaño en formato legible humano (KB / MB)
     */
    public function getTamanioLegibleAttribute(): string
    {
        $bytes = (int) ($this->tamanio_bytes ?? 0);
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }
}

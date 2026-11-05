<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\ClinicalResources\Models\Medico;

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
        'titulo',
        'tipo_documento', // LABORATORIO, IMAGENOLOGIA, INFORME_EXTERNO, CONSENTIMIENTO, OTRO
        'descripcion',
        'ruta_archivo',
        'mime_type',
        'tamanio_bytes',
        'fecha_subida',
        'estado', // ACTIVO, ARCHIVADO
    ];

    protected $casts = [
        'fecha_subida' => 'datetime',
        'tamanio_bytes' => 'integer',
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
}

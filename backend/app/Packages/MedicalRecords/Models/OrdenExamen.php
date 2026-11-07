<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Modelo de Orden de Exámenes Auxiliares (Laboratorio e Imagenología)
 * Tabla relacional: 'ordenes_examenes'
 * Clase UML: 'OrdenesExamenes'
 * Paquete 4: Historial Clínico y Consultas (CU25)
 */
class OrdenExamen extends Model
{
    protected $table = 'ordenes_examenes';
    protected $primaryKey = 'id_orden';

    protected $fillable = [
        'codigo_orden', // ej: 'ORD-0001'
        'id_consulta',
        'id_historia_clinica',
        'id_medico',
        'tipo_estudio', // LABORATORIO, IMAGENOLOGIA, CARDIOLOGIA, OTROS
        'nombre_estudio',
        'indicaciones_preparacion',
        'diagnostico_presuntivo',
        'estado', // PENDIENTE, CON_RESULTADOS, CANCELADA
        'fecha_emision',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
    ];

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'id_consulta', 'id_consulta');
    }

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    public function documentosAdjuntos(): HasMany
    {
        return $this->hasMany(DocumentoClinico::class, 'id_orden', 'id_orden');
    }
}

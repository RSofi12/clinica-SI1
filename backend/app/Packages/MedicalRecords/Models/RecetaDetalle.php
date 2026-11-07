<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Detalle de Receta Médica
 * Tabla relacional: 'receta_detalles'
 * Clase UML: 'RecetaDetalles'
 * Paquete 4: Historial Clínico y Consultas (CU18)
 */
class RecetaDetalle extends Model
{
    protected $table = 'receta_detalles';
    protected $primaryKey = 'id_detalle';

    protected $fillable = [
        'id_receta',
        'medicamento',
        'dosis',
        'frecuencia',
        'duracion',
        'indicaciones',
    ];

    public function receta(): BelongsTo
    {
        return $this->belongsTo(Receta::class, 'id_receta', 'id_receta');
    }
}

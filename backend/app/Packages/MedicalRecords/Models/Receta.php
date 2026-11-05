<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Modelo de Receta Médica
 * Tabla relacional: 'recetas'
 * Clase UML: 'Recetas'
 * Paquete 4: Historial Clínico y Consultas (CU18)
 */
class Receta extends Model
{
    protected $table = 'recetas';
    protected $primaryKey = 'id_receta';

    protected $fillable = [
        'id_historia_clinica',
        'id_consulta',
        'id_medico',
        'fecha_emision',
        'indicaciones_generales',
        'estado', // ACTIVO, ANULADO
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
    ];

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'id_consulta', 'id_consulta');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(RecetaDetalle::class, 'id_receta', 'id_receta');
    }
}

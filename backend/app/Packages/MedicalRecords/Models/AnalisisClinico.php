<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Modelo de Análisis Clínico Asistido por IA (Reserva CU28-OPC)
 * Tabla relacional: 'analisis_clinicos'
 * Clase UML: 'AnalisisClinicos'
 * Paquete 4: Historial Clínico y Consultas
 */
class AnalisisClinico extends Model
{
    protected $table = 'analisis_clinicos';
    protected $primaryKey = 'id_analisis';

    protected $fillable = [
        'id_historia_clinica',
        'id_medico',
        'resumen',
        'alertas',
        'modelo_ia',
        'fecha_generacion',
    ];

    protected $casts = [
        'fecha_generacion' => 'datetime',
        'alertas' => 'array',
    ];

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }
}

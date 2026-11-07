<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Diagnóstico Médico (CIE-10)
 * Tabla relacional: 'diagnosticos'
 * Clase UML: 'Diagnosticos'
 * Paquete 4: Historial Clínico y Consultas (CU16)
 */
class Diagnostico extends Model
{
    protected $table = 'diagnosticos';
    protected $primaryKey = 'id_diagnostico';

    protected $fillable = [
        'id_historia_clinica',
        'id_consulta',
        'descripcion',
        'codigo_cie10',
        'tipo', // PRESUNTIVO, DEFINITIVO
        'fecha_registro',
    ];

    protected $casts = [
        'fecha_registro' => 'datetime',
    ];

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'id_consulta', 'id_consulta');
    }
}

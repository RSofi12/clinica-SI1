<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Modelo de Notas de Evolución
 * Tabla relacional: 'evoluciones'
 * Clase UML: 'Evoluciones'
 * Paquete 4: Historial Clínico y Consultas (CU18)
 */
class Evolucion extends Model
{
    protected $table = 'evoluciones';
    protected $primaryKey = 'id_evolucion';

    protected $fillable = [
        'id_historia_clinica',
        'id_medico',
        'nota',
        'fecha_registro',
    ];

    protected $casts = [
        'fecha_registro' => 'datetime',
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

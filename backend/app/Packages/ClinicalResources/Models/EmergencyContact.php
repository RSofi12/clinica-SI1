<?php

namespace App\Packages\ClinicalResources\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo EmergencyContact — Mapea la tabla 'contactos_emergencia'
 * Paquete 2: Gestión de Recursos Clínicos y Pacientes (CU04 / RF02)
 */
class EmergencyContact extends Model
{
    protected $table = 'contactos_emergencia';
    protected $primaryKey = 'id_contacto';
    public $timestamps = false;

    protected $fillable = [
        'id_paciente',
        'nombre',
        'parentesco',
        'telefono',
    ];

    /**
     * Paciente al que pertenece este contacto
     */
    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'id_paciente', 'id_paciente');
    }
}

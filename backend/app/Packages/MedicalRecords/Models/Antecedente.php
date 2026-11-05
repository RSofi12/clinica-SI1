<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Security\Models\User;

/**
 * Modelo de Antecedentes Médicos
 * Tabla relacional: 'antecedentes'
 * Clase UML: 'Antecedentes'
 * Paquete 4: Historial Clínico y Consultas (CU17)
 */
class Antecedente extends Model
{
    protected $table = 'antecedentes';
    protected $primaryKey = 'id_antecedente';

    protected $fillable = [
        'id_historia_clinica',
        'tipo_antecedente', // PATOLOGICO, QUIRURGICO, ALERGICO, FAMILIAR, FARMACOLOGICO
        'descripcion',
        'registrado_por',
        'fecha_registro',
        'estado',
    ];

    protected $casts = [
        'fecha_registro' => 'datetime',
    ];

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function registrador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por', 'id_usuario');
    }
}

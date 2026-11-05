<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Packages\ClinicalResources\Models\Paciente;

/**
 * Modelo de Historia Clínica (Expediente Digital)
 * Tabla relacional: 'historias_clinicas'
 * Clase UML: 'HistoriasClinicas'
 * Paquete 4: Historial Clínico y Consultas
 */
class HistoriaClinica extends Model
{
    protected $table = 'historias_clinicas';
    protected $primaryKey = 'id_historia_clinica';

    protected $fillable = [
        'id_paciente',
        'fecha_apertura',
        'estado', // ACTIVO, ARCHIVADO
    ];

    protected $casts = [
        'fecha_apertura' => 'date',
    ];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'id_paciente', 'id_paciente');
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(ConsultaMedica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function antecedentes(): HasMany
    {
        return $this->hasMany(Antecedente::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function diagnosticos(): HasMany
    {
        return $this->hasMany(Diagnostico::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function evoluciones(): HasMany
    {
        return $this->hasMany(Evolucion::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function recetas(): HasMany
    {
        return $this->hasMany(Receta::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function ordenesExamenes(): HasMany
    {
        return $this->hasMany(OrdenExamen::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function documentosClinicos(): HasMany
    {
        return $this->hasMany(DocumentoClinico::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function analisisClinicos(): HasMany
    {
        return $this->hasMany(AnalisisClinico::class, 'id_historia_clinica', 'id_historia_clinica');
    }
}

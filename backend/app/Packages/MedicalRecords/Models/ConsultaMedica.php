<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Modelo de Consulta Médica (Acto Médico y Triaje)
 * Tabla relacional: 'consultas_medicas'
 * Clase UML: 'ConsultasMedicas'
 * Paquete 4: Historial Clínico y Consultas
 */
class ConsultaMedica extends Model
{
    protected $table = 'consultas_medicas';
    protected $primaryKey = 'id_consulta';

    protected $fillable = [
        'id_cita',
        'id_historia_clinica',
        'id_medico',
        'motivo_consulta',
        'peso_kg',
        'talla_cm',
        'temperatura_c',
        'presion_arterial',
        'frecuencia_cardiaca',
        'observaciones',
        'plan_tratamiento',
        'fecha_consulta',
    ];

    protected $casts = [
        'fecha_consulta' => 'datetime',
        'peso_kg' => 'decimal:2',
        'talla_cm' => 'decimal:2',
        'temperatura_c' => 'decimal:1',
        'frecuencia_cardiaca' => 'integer',
    ];

    protected $appends = [
        'imc',
        'clasificacion_imc',
    ];

    /**
     * Cálculo de IMC (Índice de Masa Corporal): peso / (talla en m)^2
     */
    public function getImcAttribute(): ?float
    {
        if ($this->peso_kg > 0 && $this->talla_cm > 0) {
            $tallaMetros = $this->talla_cm / 100;
            return round($this->peso_kg / ($tallaMetros * $tallaMetros), 1);
        }
        return null;
    }

    /**
     * Clasificación OMS del IMC
     */
    public function getClasificacionImcAttribute(): ?string
    {
        $imc = $this->imc;
        if ($imc === null) {
            return null;
        }

        if ($imc < 18.5) {
            return 'Bajo peso';
        } elseif ($imc < 25.0) {
            return 'Peso normal';
        } elseif ($imc < 30.0) {
            return 'Sobrepeso';
        } elseif ($imc < 35.0) {
            return 'Obesidad Grado I';
        } elseif ($imc < 40.0) {
            return 'Obesidad Grado II';
        } else {
            return 'Obesidad Grado III (Mórbida)';
        }
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    public function diagnosticos(): HasMany
    {
        return $this->hasMany(Diagnostico::class, 'id_consulta', 'id_consulta');
    }

    public function receta(): HasOne
    {
        return $this->hasOne(Receta::class, 'id_consulta', 'id_consulta')->latestOfMany('id_receta');
    }

    public function recetas(): HasMany
    {
        return $this->hasMany(Receta::class, 'id_consulta', 'id_consulta');
    }

    public function ordenesExamenes(): HasMany
    {
        return $this->hasMany(OrdenExamen::class, 'id_consulta', 'id_consulta');
    }

    public function documentosClinicos(): HasMany
    {
        return $this->hasMany(DocumentoClinico::class, 'id_consulta', 'id_consulta');
    }
}

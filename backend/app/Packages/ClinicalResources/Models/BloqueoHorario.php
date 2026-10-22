<?php

namespace App\Packages\ClinicalResources\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Modelo de Bloqueo de Horario / Feriados Institucionales y Licencias (CU08 / RF05)
 * Tabla relacional: 'bloqueos_horario' (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class BloqueoHorario extends Model
{
    protected $table = 'bloqueos_horario';
    protected $primaryKey = 'id_bloqueo';

    protected $fillable = [
        'id_medico', // NULL = Feriado institucional de toda la clínica
        'fecha',
        'hora_inicio', // NULL = Día completo
        'hora_fin',
        'motivo',
    ];

    protected $casts = [
        'fecha' => 'date:Y-m-d',
    ];

    protected $appends = [
        'es_general',
        'tipo_bloqueo',
    ];

    /**
     * Médico afectado por la licencia/bloqueo (o NULL si es general)
     */
    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    /**
     * Determina si el bloqueo es un feriado general de la clínica
     * (diagrama_de_clases.puml: esFeriadoGeneral(): Boolean)
     */
    public function esFeriadoGeneral(): bool
    {
        return is_null($this->id_medico);
    }

    public function getEsGeneralAttribute(): bool
    {
        return $this->esFeriadoGeneral();
    }

    public function getTipoBloqueoAttribute(): string
    {
        if ($this->esFeriadoGeneral()) {
            return is_null($this->hora_inicio) ? 'FERIADO_COMPLETO' : 'FERIADO_PARCIAL';
        }
        return is_null($this->hora_inicio) ? 'LICENCIA_COMPLETA' : 'BLOQUEO_PARCIAL';
    }

    /**
     * Verifica si una hora o rango solapa con este bloqueo
     * (diagrama_de_clases.puml: solapaConHorario(h: Time): Boolean)
     */
    public function solapaConHorario(?string $horaInicio, ?string $horaFin = null): bool
    {
        // Si no tiene hora inicio/fin, bloquea todo el día
        if (is_null($this->hora_inicio) || is_null($this->hora_fin)) {
            return true;
        }

        if (is_null($horaInicio)) {
            return true;
        }

        $bInicio = Carbon::parse($this->hora_inicio);
        $bFin = Carbon::parse($this->hora_fin);

        $cInicio = Carbon::parse($horaInicio);
        $cFin = $horaFin ? Carbon::parse($horaFin) : $cInicio->copy()->addMinutes(30);

        // Solapamiento: cInicio < bFin && cFin > bInicio
        return $cInicio->lessThan($bFin) && $cFin->greaterThan($bInicio);
    }

    /**
     * Scope para bloqueos vigentes a partir de una fecha
     */
    public function scopeDesdeFecha($query, string $fecha)
    {
        return $query->where('fecha', '>=', $fecha);
    }

    /**
     * Scope para feriados generales
     */
    public function scopeFeriadosGenerales($query)
    {
        return $query->whereNull('id_medico');
    }

    /**
     * Scope para un médico o feriados institucionales
     */
    public function scopeParaMedicoOInstitucional($query, ?int $idMedico)
    {
        return $query->where(function ($q) use ($idMedico) {
            $q->whereNull('id_medico');
            if ($idMedico) {
                $q->orWhere('id_medico', $idMedico);
            }
        });
    }
}

<?php

namespace App\Packages\ClinicalResources\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Modelo de Disponibilidad / Horario Semanal Médico (CU08 / RF05)
 * Tabla relacional: 'disponibilidades' (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class Disponibilidad extends Model
{
    protected $table = 'disponibilidades';
    protected $primaryKey = 'id_disponibilidad';

    protected $fillable = [
        'id_medico',
        'dia_semana', // 1: Lunes .. 7: Domingo
        'hora_inicio',
        'hora_fin',
        'duracion_cita_minutos',
        'activo',
    ];

    protected $casts = [
        'dia_semana' => 'integer',
        'duracion_cita_minutos' => 'integer',
        'activo' => 'boolean',
    ];

    protected $appends = [
        'dia_nombre',
    ];

    /**
     * Médico al que pertenece este horario de atención
     */
    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    /**
     * Accessor para el nombre legible del día de la semana
     */
    public function getDiaNombreAttribute(): string
    {
        $dias = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miércoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo',
        ];

        return $dias[$this->dia_semana] ?? 'Desconocido';
    }

    /**
     * Scope para disponibilidades activas
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Verifica si una hora dada se encuentra dentro del rango de atención
     * (diagrama_de_clases.puml: verificarHorario(hora: Time): Boolean)
     */
    public function verificarHorario(string $hora): bool
    {
        $inicio = Carbon::parse($this->hora_inicio);
        $fin = Carbon::parse($this->hora_fin);
        $eval = Carbon::parse($hora);

        return $eval->greaterThanOrEqualTo($inicio) && $eval->lessThan($fin);
    }

    /**
     * Genera la lista de slots de citas teóricos según la duración
     * (diagrama_de_clases.puml: generarSlots(fecha: Date): List)
     */
    public function generarSlots(?string $fecha = null): array
    {
        $slots = [];
        $inicio = Carbon::parse($this->hora_inicio);
        $fin = Carbon::parse($this->hora_fin);
        $duracion = $this->duracion_cita_minutos > 0 ? $this->duracion_cita_minutos : 30;

        $actual = $inicio->copy();
        while ($actual->copy()->addMinutes($duracion)->lessThanOrEqualTo($fin)) {
            $slotFin = $actual->copy()->addMinutes($duracion);
            $slots[] = [
                'hora_inicio' => $actual->format('H:i'),
                'hora_fin' => $slotFin->format('H:i'),
                'disponible' => true,
            ];
            $actual->addMinutes($duracion);
        }

        return $slots;
    }
}

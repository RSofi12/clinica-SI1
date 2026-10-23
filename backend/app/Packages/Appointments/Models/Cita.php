<?php

namespace App\Packages\Appointments\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\Security\Models\User;
use Carbon\Carbon;

/**
 * Modelo de Cita Médica
 * Tabla relacional: 'citas' (DDL_Database_Clinica_LaCruz.sql)
 * Clase UML: 'Citas' (diagrama_de_clases.puml)
 * Paquete 3: Gestión de Citas Médicas
 */
class Cita extends Model
{
    protected $table = 'citas';
    protected $primaryKey = 'id_cita';

    protected $fillable = [
        'codigo_cita', // ej: 'CM-0001' (RF06)
        'id_paciente',
        'id_medico',
        'id_especialidad',
        'id_tipo_cita',
        'id_cita_origen',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'duracion_minutos',
        'estado', // PROGRAMADA, CONFIRMADA, EN_CONSULTA, ATENDIDA, CANCELADA, NO_ASISTIO
        'modalidad', // PRESENCIAL, TELEMEDICINA
        'motivo_consulta',
        'motivo_breve', // Homologación DDL / Sección 7.1
        'motivo_cancelacion',
        'cancelada_en',
        'creada_por',
    ];

    protected $casts = [
        'fecha_hora_inicio' => 'datetime',
        'fecha_hora_fin' => 'datetime',
        'cancelada_en' => 'datetime',
        'duracion_minutos' => 'integer',
    ];

    protected $appends = [
        'fecha_formateada',
        'hora_inicio_formateada',
        'hora_fin_formateada',
        'es_cancelada',
        'motivo_breve',
    ];

    // =========================================================================
    // RELACIONES RELACIONALES
    // =========================================================================

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'id_paciente', 'id_paciente');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    public function especialidad(): BelongsTo
    {
        return $this->belongsTo(Especialidad::class, 'id_especialidad', 'id_especialidad');
    }

    public function tipoCita(): BelongsTo
    {
        return $this->belongsTo(TipoCita::class, 'id_tipo_cita', 'id_tipo_cita');
    }

    public function citaOrigen(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'id_cita_origen', 'id_cita');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creada_por', 'id_usuario');
    }

    public function historialEstados(): HasMany
    {
        return $this->hasMany(CitaEstadoHistorial::class, 'id_cita', 'id_cita')->orderBy('fecha_cambio', 'desc');
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    public function getFechaFormateadaAttribute(): string
    {
        return $this->fecha_hora_inicio ? $this->fecha_hora_inicio->format('Y-m-d') : '';
    }

    public function getHoraInicioFormateadaAttribute(): string
    {
        return $this->fecha_hora_inicio ? $this->fecha_hora_inicio->format('H:i') : '';
    }

    public function getHoraFinFormateadaAttribute(): string
    {
        return $this->fecha_hora_fin ? $this->fecha_hora_fin->format('H:i') : '';
    }

    public function getEsCanceladaAttribute(): bool
    {
        return $this->estado === 'CANCELADA';
    }

    public function getMotivoBreveAttribute(): ?string
    {
        return $this->attributes['motivo_consulta'] ?? null;
    }

    public function setMotivoBreveAttribute($value): void
    {
        $this->attributes['motivo_consulta'] = $value;
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope para citas que ocupan turno de agenda (todas menos CANCELADA)
     */
    public function scopeActivas($query)
    {
        return $query->where('estado', '!=', 'CANCELADA');
    }

    public function scopeParaMedico($query, int $idMedico)
    {
        return $query->where('id_medico', $idMedico);
    }

    public function scopeEnFecha($query, string $fecha)
    {
        return $query->whereDate('fecha_hora_inicio', $fecha);
    }

    // =========================================================================
    // MÉTODOS DE NEGOCIO (diagrama_de_clases.puml)
    // =========================================================================

    /**
     * Cambia de estado y registra en el historial (PUDS: cambiarEstado(est))
     */
    public function cambiarEstado(string $nuevoEstado, int $idUsuario, ?string $observacion = null): void
    {
        $estadoAnterior = $this->estado;
        $this->estado = $nuevoEstado;

        if ($nuevoEstado === 'CANCELADA' && !$this->cancelada_en) {
            $this->cancelada_en = now();
        }

        $this->save();

        CitaEstadoHistorial::registrarCambio($this->id_cita, $estadoAnterior, $nuevoEstado, $idUsuario, $observacion);
    }

    /**
     * Cancela la cita con motivo obligatorio (RF09 / PUDS: cancelar(motivo))
     */
    public function cancelar(string $motivo, int $idUsuario): bool
    {
        $this->motivo_cancelacion = $motivo;
        $this->cambiarEstado('CANCELADA', $idUsuario, "Cancelada por motivo: {$motivo}");
        return true;
    }

    /**
     * Valida si esta cita solapa con otra del mismo médico (RF07 / PUDS: validarSolapamiento())
     */
    public function validarSolapamiento(): bool
    {
        return self::where('id_medico', $this->id_medico)
            ->where('id_cita', '!=', $this->id_cita ?? 0)
            ->where('estado', '!=', 'CANCELADA')
            ->where(function ($q) {
                // Solapamiento: inicio < citaExistenteFin && fin > citaExistenteInicio
                $q->where('fecha_hora_inicio', '<', $this->fecha_hora_fin)
                  ->where('fecha_hora_fin', '>', $this->fecha_hora_inicio);
            })
            ->exists();
    }
}

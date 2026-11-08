<?php

namespace App\Packages\Appointments\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\Integrations\Models\Pago;
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
        'estado', // PROGRAMADA, CONFIRMADA, ATENDIDA, CANCELADA, INASISTENCIA (DDL_Database_Clinica_LaCruz.sql)
        'modalidad', // PRESENCIAL, TELEMEDICINA
        'motivo_consulta',
        'motivo_breve', // Homologación DDL / Sección 7.1
        'motivo_cancelacion',
        'cancelada_en',
        'reprogramada_en',
        'motivo_reprogramacion',
        'creada_por',
        'pagada',
        'monto_pago',
    ];

    protected $casts = [
        'fecha_hora_inicio' => 'datetime',
        'fecha_hora_fin' => 'datetime',
        'cancelada_en' => 'datetime',
        'reprogramada_en' => 'datetime',
        'duracion_minutos' => 'integer',
        'pagada' => 'boolean',
        'monto_pago' => 'decimal:2',
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

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'id_cita', 'id_cita')->orderBy('created_at', 'desc');
    }

    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class, 'id_cita', 'id_cita');
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
     * Determina si la cita se encuentra en estado apto para reprogramación (CU11 / RF08)
     */
    public function puedeReprogramarse(): bool
    {
        return in_array($this->estado, ['PROGRAMADA', 'CONFIRMADA'], true);
    }

    /**
     * Reprograma la cita con nueva fecha/hora y motivo obligatorio (CU11 / RF08)
     */
    public function reprogramar(\Carbon\Carbon $nuevaFechaHoraInicio, \Carbon\Carbon $nuevaFechaHoraFin, string $motivo, int $idUsuario): bool
    {
        $anteriorInicio = $this->fecha_hora_inicio?->format('d/m/Y H:i');
        $this->fecha_hora_inicio = $nuevaFechaHoraInicio;
        $this->fecha_hora_fin = $nuevaFechaHoraFin;
        $this->motivo_reprogramacion = $motivo;
        $this->reprogramada_en = now();
        $this->save();

        CitaEstadoHistorial::registrarCambio(
            $this->id_cita,
            $this->estado,
            $this->estado,
            $idUsuario,
            "Cita reprogramada del {$anteriorInicio} al {$nuevaFechaHoraInicio->format('d/m/Y H:i')}. Motivo: {$motivo}"
        );

        return true;
    }

    // =========================================================================
    // CONSTANTES Y MÁQUINA DE ESTADOS (CU13 / RF10 / RN10)
    // =========================================================================

    public const ESTADO_PROGRAMADA = 'PROGRAMADA';
    public const ESTADO_CONFIRMADA = 'CONFIRMADA';
    public const ESTADO_ATENDIDA = 'ATENDIDA';
    public const ESTADO_CANCELADA = 'CANCELADA';
    public const ESTADO_INASISTENCIA = 'INASISTENCIA';

    public const ESTADOS_VALIDOS = [
        self::ESTADO_PROGRAMADA,
        self::ESTADO_CONFIRMADA,
        self::ESTADO_ATENDIDA,
        self::ESTADO_CANCELADA,
        self::ESTADO_INASISTENCIA,
    ];

    /**
     * Matriz oficial de transiciones permitidas (Máquina de estados RF10)
     */
    public const TRANSICIONES_VALIDAS = [
        self::ESTADO_PROGRAMADA => [
            self::ESTADO_CONFIRMADA,
            self::ESTADO_CANCELADA,
            self::ESTADO_INASISTENCIA,
        ],
        self::ESTADO_CONFIRMADA => [
            self::ESTADO_ATENDIDA,
            self::ESTADO_CANCELADA,
            self::ESTADO_INASISTENCIA,
        ],
        self::ESTADO_ATENDIDA => [],     // Terminal
        self::ESTADO_CANCELADA => [],    // Terminal
        self::ESTADO_INASISTENCIA => [], // Terminal
    ];

    /**
     * Determina si la cita se encuentra en un estado terminal (inmutable)
     */
    public function esEstadoTerminal(): bool
    {
        return in_array($this->estado, [
            self::ESTADO_ATENDIDA,
            self::ESTADO_CANCELADA,
            self::ESTADO_INASISTENCIA,
        ], true);
    }

    /**
     * Retorna las transiciones válidas disponibles para el estado actual
     */
    public function obtenerTransicionesPermitidas(): array
    {
        return self::TRANSICIONES_VALIDAS[$this->estado] ?? [];
    }

    /**
     * Evalúa si una transición hacia un nuevo estado es legal
     */
    public function puedeTransicionarA(string $nuevoEstado): bool
    {
        $permitidas = $this->obtenerTransicionesPermitidas();
        return in_array($nuevoEstado, $permitidas, true);
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

<?php

namespace App\Packages\Appointments\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Security\Models\User;

/**
 * Modelo de Historial de Transición de Estados de Citas Médicas
 * Tabla relacional: 'cita_estado_historial' (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 3: Gestión de Citas Médicas
 */
class CitaEstadoHistorial extends Model
{
    protected $table = 'cita_estado_historial';
    protected $primaryKey = 'id_historial';
    public $timestamps = false;

    protected $fillable = [
        'id_cita',
        'estado_anterior',
        'estado_nuevo',
        'id_usuario',
        'observacion',
        'fecha_cambio',
    ];

    protected $casts = [
        'fecha_cambio' => 'datetime',
    ];

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Registra una transición de estado (diagrama_de_clases.puml: registrarCambio(ant, nuev): Void)
     */
    public static function registrarCambio(
        int $idCita,
        ?string $estadoAnterior,
        string $estadoNuevo,
        int $idUsuario,
        ?string $observacion = null
    ): self {
        return self::create([
            'id_cita' => $idCita,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $estadoNuevo,
            'id_usuario' => $idUsuario,
            'observacion' => $observacion,
            'fecha_cambio' => now(),
        ]);
    }
}

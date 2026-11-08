<?php

namespace App\Packages\Integrations\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Security\Models\User;
use App\Packages\Appointments\Models\Cita;

/**
 * Modelo de Notificaciones y Recordatorios
 * Tabla relacional: 'notificaciones'
 * Clase UML: 'Notificaciones'
 * Paquete 5: Integraciones Externas y Pagos (CU20)
 */
class Notificacion extends Model
{
    protected $table = 'notificaciones';
    protected $primaryKey = 'id_notificacion';

    const TIPO_RECORDATORIO_24H = 'RECORDATORIO_24H';
    const TIPO_CONFIRMACION = 'CONFIRMACION';
    const TIPO_CANCELACION = 'CANCELACION';
    const TIPO_REPROGRAMACION = 'REPROGRAMACION';
    const TIPO_PAGO_EXITOSO = 'PAGO_EXITOSO';
    const TIPO_AVISO_CLINICO = 'AVISO_CLINICO';

    const CANAL_EMAIL = 'EMAIL';
    const CANAL_PUSH = 'PUSH';
    const CANAL_SMS = 'SMS';
    const CANAL_IN_APP = 'IN_APP';

    protected $fillable = [
        'id_usuario',
        'id_cita',
        'tipo',
        'canal',
        'titulo',
        'mensaje',
        'leida',
        'fecha_envio',
    ];

    protected $casts = [
        'leida' => 'boolean',
        'fecha_envio' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'tiempo_relativo',
    ];

    public function getTiempoRelativoAttribute(): string
    {
        $fecha = $this->fecha_envio ?? $this->created_at;
        return $fecha ? $fecha->diffForHumans() : 'Recientemente';
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }

    public function scopeNoLeidas($query)
    {
        return $query->where('leida', false);
    }

    public function scopeParaUsuario($query, int $idUsuario)
    {
        return $query->where('id_usuario', $idUsuario);
    }

    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    public function marcarComoLeida(): bool
    {
        $this->leida = true;
        return $this->save();
    }
}

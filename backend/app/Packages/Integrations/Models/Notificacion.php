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

    protected $fillable = [
        'id_usuario',
        'id_cita',
        'tipo', // RECORDATORIO_24H, CONFIRMACION, CANCELACION, REPROGRAMACION
        'canal', // EMAIL, PUSH, SMS
        'titulo',
        'mensaje',
        'leida',
        'fecha_envio',
    ];

    protected $casts = [
        'leida' => 'boolean',
        'fecha_envio' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }
}

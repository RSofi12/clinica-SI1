<?php

namespace App\Packages\Integrations\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Security\Models\User;

/**
 * Modelo de Suscripciones Web Push
 * Tabla relacional: 'push_suscripciones'
 * Clase UML: 'PushSuscripciones'
 * Paquete 5: Integraciones Externas y Pagos (CU20)
 */
class PushSuscripcion extends Model
{
    protected $table = 'push_suscripciones';
    protected $primaryKey = 'id_suscripcion';

    protected $fillable = [
        'id_usuario',
        'endpoint',
        'p256dh_key',
        'auth_token',
        'fecha_registro',
    ];

    protected $casts = [
        'fecha_registro' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}

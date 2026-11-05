<?php

namespace App\Packages\Integrations\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Paciente;

/**
 * Modelo de Pago con Pasarela (Stripe Sandbox)
 * Tabla relacional: 'pagos'
 * Clase UML: 'Pagos'
 * Paquete 5: Integraciones Externas y Pagos (CU21)
 */
class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'id_pago';

    protected $fillable = [
        'id_cita',
        'id_paciente',
        'monto',
        'metodo_pago', // STRIPE
        'stripe_payment_intent_id',
        'estado', // PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO
        'fecha_pago',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
    ];

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'id_cita', 'id_cita');
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'id_paciente', 'id_paciente');
    }
}

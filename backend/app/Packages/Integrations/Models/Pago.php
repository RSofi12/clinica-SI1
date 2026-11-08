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
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'id_pago';

    public const METODO_STRIPE = 'STRIPE';

    public const ESTADO_PENDIENTE   = 'PENDIENTE';
    public const ESTADO_COMPLETADO  = 'COMPLETADO';
    public const ESTADO_FALLIDO     = 'FALLIDO';
    public const ESTADO_REEMBOLSADO = 'REEMBOLSADO';

    public const ESTADOS_VALIDOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_COMPLETADO,
        self::ESTADO_FALLIDO,
        self::ESTADO_REEMBOLSADO,
    ];

    protected $fillable = [
        'codigo_pago', // ej: 'PAG-0001'
        'id_cita',
        'id_paciente',
        'monto',
        'moneda',
        'metodo_pago', // STRIPE
        'stripe_payment_intent_id',
        'tarjeta_marca',
        'tarjeta_ultimos4',
        'descripcion',
        'estado', // PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO
        'recibo_url',
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

    /**
     * Marca el pago como COMPLETADO y actualiza la cita asociada a pagada
     */
    public function marcarCompletado(?string $marca = null, ?string $ultimos4 = null, ?string $reciboUrl = null): void
    {
        $this->update([
            'estado'           => self::ESTADO_COMPLETADO,
            'tarjeta_marca'    => $marca ?? $this->tarjeta_marca,
            'tarjeta_ultimos4' => $ultimos4 ?? $this->tarjeta_ultimos4,
            'recibo_url'       => $reciboUrl ?? $this->recibo_url,
            'fecha_pago'       => now(),
        ]);

        if ($this->cita) {
            $this->cita->update([
                'pagada'     => true,
                'monto_pago' => $this->monto,
            ]);
        }
    }

    /**
     * Marca el pago como FALLIDO
     */
    public function marcarFallido(string $motivo): void
    {
        $this->update([
            'estado'      => self::ESTADO_FALLIDO,
            'descripcion' => $motivo,
        ]);
    }
}

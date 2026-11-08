<?php

namespace App\Packages\Integrations\Services;

use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\Integrations\Models\Pago;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Exception;

/**
 * Servicio Transaccional de Pasarela de Pagos Stripe Sandbox (CU21)
 * Paquete 5: Integraciones Externas y Pagos
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class StripePaymentService
{
    protected string $secretKey;
    protected string $currency;

    public function __construct()
    {
        $this->secretKey = config('services.stripe.secret') ?? env('STRIPE_SECRET', '');
        $this->currency  = strtolower(config('services.stripe.currency') ?? env('STRIPE_CURRENCY', 'usd'));
    }

    /**
     * Generador atómico del código correlativo de pago: PAG-0001, PAG-0002...
     */
    public static function generarCodigoPago(): string
    {
        $ultimo = Pago::query()
            ->where('codigo_pago', 'LIKE', 'PAG-%')
            ->orderByRaw("CAST(SUBSTRING(codigo_pago FROM 5) AS INTEGER) DESC")
            ->value('codigo_pago');

        if (!$ultimo) {
            return 'PAG-0001';
        }

        $correlativo = (int) substr($ultimo, 4);
        $siguiente = $correlativo + 1;

        return sprintf('PAG-%04d', $siguiente);
    }

    /**
     * Inicializa o recupera un PaymentIntent en Stripe para una cita médica pendiente
     */
    public function crearPaymentIntent(int $idCita, User $usuario): array
    {
        $cita = Cita::with(['paciente', 'especialidad', 'medico.usuario', 'tipoCita'])->find($idCita);
        if (!$cita) {
            throw new Exception("La cita médica #{$idCita} no existe.", 404);
        }

        // Validación Anti-IDOR
        $this->validarTitularidadCita($cita, $usuario);

        if ($cita->pagada) {
            throw new Exception("La cita médica {$cita->codigo_cita} ya se encuentra pagada.", 422);
        }

        if ($cita->es_cancelada || $cita->estado === 'CANCELADA') {
            throw new Exception("No es posible procesar el pago de una cita cancelada.", 422);
        }

        // Determinar monto según especialidad (fallback a 70.00 USD)
        $monto = (float) ($cita->especialidad?->precio_consulta > 0 ? $cita->especialidad->precio_consulta : 70.00);
        $montoCentavos = (int) round($monto * 100);

        // Verificar si ya existe un registro de Pago PENDIENTE para esta cita
        $pagoExistente = Pago::where('id_cita', $cita->id_cita)
            ->where('estado', Pago::ESTADO_PENDIENTE)
            ->whereNotNull('stripe_payment_intent_id')
            ->latest()
            ->first();

        if ($pagoExistente && $this->secretKey) {
            // Verificar si el PaymentIntent sigue activo en Stripe
            $resStripe = Http::withToken($this->secretKey)->get("https://api.stripe.com/v1/payment_intents/{$pagoExistente->stripe_payment_intent_id}");
            if ($resStripe->successful()) {
                $intentData = $resStripe->json();
                if (in_array($intentData['status'] ?? '', ['requires_payment_method', 'requires_confirmation', 'requires_action'], true)) {
                    return [
                        'client_secret'     => $intentData['client_secret'],
                        'payment_intent_id' => $intentData['id'],
                        'monto'             => $monto,
                        'moneda'            => $this->currency,
                        'codigo_pago'       => $pagoExistente->codigo_pago,
                        'cita'              => $this->formatearResumenCita($cita),
                    ];
                }
            }
        }

        // Crear nuevo PaymentIntent en la API REST de Stripe
        if (!$this->secretKey) {
            throw new Exception("La clave secreta de Stripe no está configurada en el servidor.", 500);
        }

        $response = Http::asForm()
            ->withToken($this->secretKey)
            ->post('https://api.stripe.com/v1/payment_intents', [
                'amount'                    => $montoCentavos,
                'currency'                  => $this->currency,
                'description'               => "Pago Consulta Médica {$cita->codigo_cita} - Centro Médico La Cruz",
                'metadata[id_cita]'         => (string) $cita->id_cita,
                'metadata[codigo_cita]'     => $cita->codigo_cita,
                'metadata[id_paciente]'     => (string) $cita->id_paciente,
                'metadata[paciente]'        => $cita->paciente ? "{$cita->paciente->nombres} {$cita->paciente->apellidos}" : 'Paciente',
                'metadata[especialidad]'    => $cita->especialidad?->nombre ?? 'Medicina General',
                'automatic_payment_methods[enabled]' => 'true',
                'automatic_payment_methods[allow_redirects]' => 'never',
            ]);

        if ($response->failed()) {
            $errorData = $response->json();
            $mensajeError = $errorData['error']['message'] ?? 'Error de comunicación con Stripe Sandbox.';
            throw new Exception("Stripe Error: {$mensajeError}", 422);
        }

        $stripeIntent = $response->json();
        $codigoPago = self::generarCodigoPago();

        // Registrar intento en la tabla de pagos
        $pago = Pago::create([
            'codigo_pago'              => $codigoPago,
            'id_cita'                  => $cita->id_cita,
            'id_paciente'              => $cita->id_paciente,
            'monto'                    => $monto,
            'moneda'                   => $this->currency,
            'metodo_pago'              => Pago::METODO_STRIPE,
            'stripe_payment_intent_id' => $stripeIntent['id'],
            'descripcion'              => "Consulta {$cita->especialidad?->nombre} - Dr(a). {$cita->medico?->nombres} {$cita->medico?->apellidos}",
            'estado'                   => Pago::ESTADO_PENDIENTE,
            'fecha_pago'               => now(),
        ]);

        return [
            'client_secret'     => $stripeIntent['client_secret'],
            'payment_intent_id' => $stripeIntent['id'],
            'monto'             => $monto,
            'moneda'            => $this->currency,
            'codigo_pago'       => $pago->codigo_pago,
            'cita'              => $this->formatearResumenCita($cita),
        ];
    }

    /**
     * Procesa y confirma el cobro directo en Stripe Sandbox y garantiza la cita
     */
    public function procesarPago(int $idCita, array $datosPago, User $usuario): Pago
    {
        return DB::transaction(function () use ($idCita, $datosPago, $usuario) {
            $cita = Cita::with(['paciente', 'especialidad', 'medico.usuario'])->lockForUpdate()->find($idCita);
            if (!$cita) {
                throw new Exception("La cita médica #{$idCita} no existe.", 404);
            }

            $this->validarTitularidadCita($cita, $usuario);

            if ($cita->pagada) {
                throw new Exception("Esta cita médica ya ha sido pagada previamente.", 422);
            }

            $monto = (float) ($cita->especialidad?->precio_consulta > 0 ? $cita->especialidad->precio_consulta : 70.00);
            $montoCentavos = (int) round($monto * 100);

            // Obtener o crear PaymentIntent
            $paymentIntentId = $datosPago['payment_intent_id'] ?? null;
            $tarjetaMarca = strtolower($datosPago['tarjeta_marca'] ?? 'visa');
            $tarjetaUltimos4 = substr($datosPago['tarjeta_numero'] ?? '4242', -4);

            // Si no se proporcionó un PaymentIntent o se desea confirmar directamente con el método de prueba
            if (!$paymentIntentId) {
                // Creamos y confirmamos en un solo paso usando el PaymentMethod de prueba de Stripe 'pm_card_visa'
                $resStripe = Http::asForm()
                    ->withToken($this->secretKey)
                    ->post('https://api.stripe.com/v1/payment_intents', [
                        'amount'                 => $montoCentavos,
                        'currency'               => $this->currency,
                        'payment_method'         => 'pm_card_visa', // Tarjeta de prueba universal de Stripe
                        'confirm'                => 'true',
                        'description'            => "Cobro Cita Médica {$cita->codigo_cita} - Centro Médico La Cruz",
                        'metadata[id_cita]'      => (string) $cita->id_cita,
                        'metadata[codigo_cita]'  => $cita->codigo_cita,
                        'metadata[id_paciente]'  => (string) $cita->id_paciente,
                        'metadata[paciente]'     => $cita->paciente ? "{$cita->paciente->nombres} {$cita->paciente->apellidos}" : 'Paciente',
                        'metadata[especialidad]' => $cita->especialidad?->nombre ?? 'Medicina General',
                        'automatic_payment_methods[enabled]' => 'true',
                        'automatic_payment_methods[allow_redirects]' => 'never',
                    ]);

                if ($resStripe->failed()) {
                    $errorData = $resStripe->json();
                    $msg = $errorData['error']['message'] ?? 'Error al procesar cobro en Stripe Sandbox.';
                    throw new Exception("Stripe Error: {$msg}", 422);
                }

                $stripeData = $resStripe->json();
                $paymentIntentId = $stripeData['id'];
            } else {
                // Confirmar PaymentIntent existente en Stripe
                $resStripe = Http::asForm()
                    ->withToken($this->secretKey)
                    ->post("https://api.stripe.com/v1/payment_intents/{$paymentIntentId}/confirm", [
                        'payment_method' => 'pm_card_visa',
                    ]);

                if ($resStripe->failed()) {
                    $errorData = $resStripe->json();
                    // Si ya estaba succeeded, lo aceptamos
                    if (($errorData['error']['code'] ?? '') !== 'payment_intent_unexpected_state') {
                        $msg = $errorData['error']['message'] ?? 'Error al confirmar en Stripe.';
                        throw new Exception("Stripe Error: {$msg}", 422);
                    }
                }

                $stripeData = $resStripe->json();
            }

            // Validar estado devuelto por Stripe
            $estadoStripe = $stripeData['status'] ?? 'succeeded';
            if (!in_array($estadoStripe, ['succeeded', 'processing'], true)) {
                throw new Exception("El pago no pudo completarse en Stripe (Estado: {$estadoStripe}).", 422);
            }

            // Buscar o crear registro de Pago
            $pago = Pago::where('stripe_payment_intent_id', $paymentIntentId)->first();
            if (!$pago) {
                $pago = new Pago();
                $pago->codigo_pago = self::generarCodigoPago();
                $pago->id_cita = $cita->id_cita;
                $pago->id_paciente = $cita->id_paciente;
                $pago->monto = $monto;
                $pago->moneda = $this->currency;
                $pago->metodo_pago = Pago::METODO_STRIPE;
                $pago->stripe_payment_intent_id = $paymentIntentId;
                $pago->descripcion = "Consulta {$cita->especialidad?->nombre} - Dr(a). {$cita->medico?->nombres} {$cita->medico?->apellidos}";
            }

            // Marcar pago como completado y actualizar la cita
            $reciboUrl = $stripeData['charges']['data'][0]['receipt_url'] ?? "https://dashboard.stripe.com/test/payments/{$paymentIntentId}";
            $pago->marcarCompletado($tarjetaMarca, $tarjetaUltimos4, $reciboUrl);

            // Garantizar la cita (si estaba en estado inicial PROGRAMADA o PENDIENTE)
            if ($cita->estado === 'PROGRAMADA' || $cita->estado === 'PENDIENTE') {
                $cita->update([
                    'estado'     => 'CONFIRMADA',
                    'pagada'     => true,
                    'monto_pago' => $monto,
                ]);
            } else {
                $cita->update([
                    'pagada'     => true,
                    'monto_pago' => $monto,
                ]);
            }

            // Auditoría inmutable en Bitacora (CU03)
            Bitacora::registrar(
                $usuario->id_usuario ?? $usuario->id,
                'PAGOS',
                'PAGO_CITA_STRIPE',
                'pagos',
                $pago->id_pago,
                "Confirmado pago {$pago->codigo_pago} de \${$monto} USD para cita {$cita->codigo_cita} ({$cita->especialidad?->nombre}) vía Stripe Sandbox ({$paymentIntentId}). Tarjeta terminada en {$tarjetaUltimos4}.",
                request() ? request()->ip() : '127.0.0.1'
            );

            // Disparar notificación automática de pago confirmado (CU20 / CU21)
            try {
                app(\App\Packages\Integrations\Services\NotificationService::class)->notificarPagoCompletado($pago);
            } catch (\Throwable $th) {
                \Illuminate\Support\Facades\Log::warning("Error al emitir notificación de pago {$pago->codigo_pago}: " . $th->getMessage());
            }

            return $pago->fresh(['cita.especialidad', 'cita.medico', 'paciente']);
        });
    }

    /**
     * Lista los pagos registrados con filtros y control Anti-IDOR
     */
    public function listarPagos(array $filtros, User $usuario): array
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        $query = Pago::with([
            'cita:id_cita,codigo_cita,fecha_hora_inicio,modalidad,estado,pagada',
            'cita.especialidad:id_especialidad,nombre',
            'cita.medico:id_medico,nombres,apellidos',
            'paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia',
        ])->latest('fecha_pago');

        // Scoping por Rol (Anti-IDOR)
        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if ($paciente) {
                $query->where('id_paciente', $paciente->id_paciente);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($rol === 'MEDICO') {
            $medico = $usuario->medico;
            if ($medico) {
                $query->whereHas('cita', fn($q) => $q->where('id_medico', $medico->id_medico));
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // Filtros
        if (!empty($filtros['estado'])) {
            $query->where('estado', strtoupper($filtros['estado']));
        }

        if (!empty($filtros['buscar'])) {
            $buscar = trim($filtros['buscar']);
            $query->where(function ($q) use ($buscar) {
                $q->where('codigo_pago', 'ilike', "%{$buscar}%")
                  ->orWhere('stripe_payment_intent_id', 'ilike', "%{$buscar}%")
                  ->orWhereHas('cita', fn($qc) => $qc->where('codigo_cita', 'ilike', "%{$buscar}%"))
                  ->orWhereHas('paciente', fn($qp) => $qp->where('nombres', 'ilike', "%{$buscar}%")->orWhere('apellidos', 'ilike', "%{$buscar}%")->orWhere('numero_documento', 'ilike', "%{$buscar}%"));
            });
        }

        $cloned = clone $query;
        $metricas = [
            'total_recaudado'  => (clone $cloned)->where('estado', Pago::ESTADO_COMPLETADO)->sum('monto'),
            'total_pagos'      => (clone $cloned)->count(),
            'completados'      => (clone $cloned)->where('estado', Pago::ESTADO_COMPLETADO)->count(),
            'pendientes'       => (clone $cloned)->where('estado', Pago::ESTADO_PENDIENTE)->count(),
        ];

        $perPage = !empty($filtros['per_page']) ? (int) $filtros['per_page'] : 15;
        $paginador = $query->paginate($perPage);

        return [
            'paginador' => $paginador,
            'metricas'  => $metricas,
        ];
    }

    /**
     * Consulta el detalle y comprobante de un pago
     */
    public function obtenerComprobante(int $idPago, User $usuario): Pago
    {
        $pago = Pago::with([
            'cita.especialidad',
            'cita.medico.usuario',
            'paciente',
        ])->find($idPago);

        if (!$pago) {
            throw new Exception("El registro de pago #{$idPago} no existe.", 404);
        }

        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if (!$paciente || $paciente->id_paciente !== $pago->id_paciente) {
                throw new Exception("No tiene autorización para visualizar este comprobante de pago.", 403);
            }
        }

        return $pago;
    }

    /**
     * Valida que el usuario sea el paciente titular de la cita o personal de la clínica
     */
    protected function validarTitularidadCita(Cita $cita, User $usuario): void
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if (!$paciente || $paciente->id_paciente !== $cita->id_paciente) {
                throw new Exception("Anti-IDOR: No puede gestionar pagos de citas ajenas.", 403);
            }
        }
    }

    /**
     * Formatea un resumen informativo de la cita
     */
    protected function formatearResumenCita(Cita $cita): array
    {
        return [
            'id_cita'      => $cita->id_cita,
            'codigo_cita'  => $cita->codigo_cita,
            'especialidad' => $cita->especialidad?->nombre ?? 'Medicina General',
            'medico'       => $cita->medico ? "Dr(a). {$cita->medico->nombres} {$cita->medico->apellidos}" : 'Médico General',
            'fecha'        => $cita->fecha_formateada,
            'hora'         => $cita->hora_inicio_formateada,
            'paciente'     => $cita->paciente ? "{$cita->paciente->nombres} {$cita->paciente->apellidos}" : 'Paciente',
            'documento'    => $cita->paciente?->numero_documento,
        ];
    }
}


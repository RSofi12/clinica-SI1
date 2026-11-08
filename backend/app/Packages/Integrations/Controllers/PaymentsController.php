<?php

namespace App\Packages\Integrations\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Integrations\Requests\ProcessPaymentRequest;
use App\Packages\Integrations\Services\StripePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * Controlador de Pasarela de Pagos Stripe (CU21 / Paquete 5)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class PaymentsController extends Controller
{
    protected StripePaymentService $service;

    public function __construct(StripePaymentService $service)
    {
        $this->service = $service;
    }

    /**
     * Listado paginado de pagos con métricas y control Anti-IDOR
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $resultado = $this->service->listarPagos($request->all(), $user);
            return response()->json([
                'success' => true,
                'data'    => $resultado['paginador'],
                'metrics' => $resultado['metricas'],
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Inicializa un PaymentIntent en Stripe para una cita médica
     */
    public function createIntent(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        $idCita = $request->input('id_cita');
        if (!$idCita) {
            return response()->json(['success' => false, 'message' => 'El identificador de la cita es obligatorio.'], 422);
        }

        try {
            $datosIntent = $this->service->crearPaymentIntent((int) $idCita, $user);
            return response()->json([
                'success' => true,
                'data'    => $datosIntent,
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422, 500], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Procesa y confirma el cobro de la cita con Stripe Sandbox
     */
    public function process(ProcessPaymentRequest $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $validated = $request->validated();
            $pago = $this->service->procesarPago((int) $validated['id_cita'], $validated, $user);

            return response()->json([
                'success' => true,
                'message' => "Pago de la cita {$pago->cita?->codigo_cita} procesado exitosamente por \${$pago->monto} {$pago->moneda}.",
                'data'    => $pago,
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Obtiene el comprobante oficial de pago
     */
    public function receipt(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $pago = $this->service->obtenerComprobante($id, $user);
            return response()->json([
                'success' => true,
                'data'    => $pago,
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 404;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }
}


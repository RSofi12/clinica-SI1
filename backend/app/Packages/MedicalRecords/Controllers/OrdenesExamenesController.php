<?php

namespace App\Packages\MedicalRecords\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\MedicalRecords\Requests\OrdenExamenAnularRequest;
use App\Packages\MedicalRecords\Requests\OrdenExamenCreateRequest;
use App\Packages\MedicalRecords\Services\OrdenExamenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * Controlador de Órdenes de Exámenes Auxiliares (CU25 / Paquete 4)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class OrdenesExamenesController extends Controller
{
    protected OrdenExamenService $service;

    public function __construct(OrdenExamenService $service)
    {
        $this->service = $service;
    }

    /**
     * Listado paginado de órdenes de exámenes auxiliares con filtros y métricas
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $resultado = $this->service->listarOrdenes($request->all(), $user);
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
     * Consulta el detalle de una orden de examen auxiliar
     */
    public function show(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $orden = $this->service->obtenerPorId($id, $user);
            return response()->json([
                'success' => true,
                'data'    => $orden,
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 404;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Obtiene las órdenes vinculadas a una consulta médica
     */
    public function byConsulta(int $idConsulta): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $ordenes = $this->service->obtenerPorConsulta($idConsulta, $user);
            return response()->json([
                'success' => true,
                'data'    => $ordenes,
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
     * Obtiene las órdenes de una historia clínica
     */
    public function byHistoria(int $idHistoria, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $filtros = array_merge($request->all(), ['id_historia_clinica' => $idHistoria]);
            $resultado = $this->service->listarOrdenes($filtros, $user);
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
     * Emite una nueva orden de examen auxiliar (CU25)
     */
    public function store(OrdenExamenCreateRequest $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $orden = $this->service->emitirOrden($request->validated(), $user);
            return response()->json([
                'success' => true,
                'message' => "Orden de examen auxiliar {$orden->codigo_orden} emitida exitosamente.",
                'data'    => $orden,
            ], 201);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Anula lógicamente una orden de examen auxiliar (RN11)
     */
    public function anular(int $id, OrdenExamenAnularRequest $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $orden = $this->service->anularOrden($id, $request->validated()['motivo_cancelacion'], $user);
            return response()->json([
                'success' => true,
                'message' => "Orden médica {$orden->codigo_orden} anulada exitosamente.",
                'data'    => $orden,
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }
}


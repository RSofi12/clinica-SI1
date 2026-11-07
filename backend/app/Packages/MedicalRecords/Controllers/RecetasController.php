<?php

namespace App\Packages\MedicalRecords\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\MedicalRecords\Requests\RecetaAnularRequest;
use App\Packages\MedicalRecords\Requests\RecetaCreateRequest;
use App\Packages\MedicalRecords\Services\RecetaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de Prescripciones Médicas y Recetas (CU18 / Paquete 4)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class RecetasController extends Controller
{
    protected RecetaService $service;

    public function __construct(RecetaService $service)
    {
        $this->service = $service;
    }

    /**
     * Listado paginado de recetas con filtros y métricas
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $resultado = $this->service->listarRecetas($request->all(), $user);
            return response()->json([
                'success' => true,
                'data'    => $resultado['paginador'],
                'metrics' => $resultado['metricas'],
            ], 200);
        } catch (\Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Consulta el detalle de una receta médica con sus fármacos estructurados
     */
    public function show(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $receta = $this->service->obtenerReceta($id, $user);
            return response()->json([
                'success' => true,
                'data'    => $receta,
            ], 200);
        } catch (\Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Consulta las recetas vinculadas a una consulta médica
     */
    public function byConsulta(int $idConsulta): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $data = $this->service->listarPorConsulta($idConsulta, $user);
            return response()->json([
                'success' => true,
                'data'    => $data,
            ], 200);
        } catch (\Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Emite una nueva receta médica con medicamentos estructurados (RF08)
     */
    public function store(RecetaCreateRequest $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $receta = $this->service->emitirReceta($request->validated(), $user, $request->ip());
            return response()->json([
                'success' => true,
                'message' => 'Receta médica emitida exitosamente.',
                'data'    => $receta,
            ], 201);
        } catch (\Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Anula lógicamente una receta médica con motivo obligatorio (RN11)
     */
    public function anular(RecetaAnularRequest $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $receta = $this->service->anularReceta($id, $request->validated('motivo_anulacion'), $user, $request->ip());
            return response()->json([
                'success' => true,
                'message' => 'Receta médica anulada exitosamente.',
                'data'    => $receta,
            ], 200);
        } catch (\Exception $e) {
            $status = in_array($e->getCode(), [400, 401, 403, 404, 422], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }
}

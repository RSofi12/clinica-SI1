<?php

namespace App\Packages\MedicalRecords\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\MedicalRecords\Requests\AntecedenteCreateRequest;
use App\Packages\MedicalRecords\Requests\AntecedenteUpdateRequest;
use App\Packages\MedicalRecords\Services\AntecedenteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de Antecedentes Médicos (CU17 / §3.4)
 * Paquete 4: Historial Clínico y Consultas
 */
class AntecedentesController extends Controller
{
    protected AntecedenteService $service;

    public function __construct(AntecedenteService $service)
    {
        $this->service = $service;
    }

    /**
     * Consulta antecedentes de un paciente (con scoping RBAC y anti-IDOR)
     */
    public function indexByPatient(Request $request, int $patientId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $data = $this->service->obtenerPorPaciente($patientId, $request->all(), $user);
            return response()->json([
                'success' => true,
                'data' => $data,
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
     * Registra un nuevo antecedente médico para el paciente
     */
    public function store(AntecedenteCreateRequest $request, int $patientId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $antecedente = $this->service->registrar($patientId, $request->validated(), $user, $request->ip());
            return response()->json([
                'success' => true,
                'message' => 'Antecedente médico registrado exitosamente en la historia clínica.',
                'data' => $antecedente,
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
     * Actualiza la descripción o tipo de un antecedente
     */
    public function update(AntecedenteUpdateRequest $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $antecedente = $this->service->actualizar($id, $request->validated(), $user, $request->ip());
            return response()->json([
                'success' => true,
                'message' => 'Antecedente médico actualizado exitosamente.',
                'data' => $antecedente,
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
     * Alterna la baja lógica (ACTIVO / INACTIVO) de un antecedente (RN11)
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $antecedente = $this->service->toggleStatus($id, $user, $request->ip());
            $estadoStr = $antecedente->estado === 'ACTIVO' ? 'activado' : 'desactivado';
            return response()->json([
                'success' => true,
                'message' => "Antecedente médico {$estadoStr} exitosamente (RN11).",
                'data' => $antecedente,
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

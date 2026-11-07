<?php

namespace App\Packages\MedicalRecords\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\MedicalRecords\Services\ExpedienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/**
 * Controlador REST para Consulta Integral de Expediente Clínico (CU19)
 * Paquete 4: Historial Clínico y Consultas
 */
class ExpedienteController extends Controller
{
    public function __construct(
        protected ExpedienteService $expedienteService
    ) {}

    /**
     * Consulta el expediente propio del paciente en sesión (Autoservicio)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function miExpediente(Request $request): JsonResponse
    {
        try {
            $data = $this->expedienteService->obtenerMiExpediente(
                $request->user(),
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al consultar el expediente clínico: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Consulta el expediente clínico de un paciente por su ID (Médicos / Administradores)
     *
     * @param Request $request
     * @param int $idPaciente
     * @return JsonResponse
     */
    public function showByPatient(Request $request, int $idPaciente): JsonResponse
    {
        try {
            $data = $this->expedienteService->obtenerExpedientePorPaciente(
                $idPaciente,
                $request->user(),
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el expediente clínico del paciente: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene el timeline cronológico de atenciones, recetas y antecedentes
     *
     * @param Request $request
     * @param int $idPaciente
     * @return JsonResponse
     */
    public function timeline(Request $request, int $idPaciente): JsonResponse
    {
        try {
            $timeline = $this->expedienteService->obtenerTimeline(
                $idPaciente,
                $request->user()
            );

            return response()->json([
                'success' => true,
                'data' => $timeline,
            ]);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la cronología del expediente: ' . $e->getMessage(),
            ], 500);
        }
    }
}

<?php

namespace App\Packages\Analytics\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Analytics\Services\DynamicReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Exception;

/**
 * Controlador de Reportes Gerenciales y Analítica Dinámica (CU22 - RF13)
 * Paquete 6: Reportes y Analítica
 * Metodología PUDS / RUP — Centro Médico La Cruz
 */
class ReportsController extends Controller
{
    public function __construct(
        protected DynamicReportService $reportService
    ) {}

    /**
     * Catálogos para alimentar los filtros de los 7 reportes
     * GET /api/analytics/reports/catalogs
     */
    public function catalogs(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $role = $user?->roles?->first()?->nombre_rol ?? 'PACIENTE';

            $data = $this->reportService->getCatalogs($user, $role);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los catálogos para reportes.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar reporte dinámico en tiempo real (1 al 7)
     * GET /api/analytics/reports/dynamic
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $role = $user?->roles?->first()?->nombre_rol ?? 'PACIENTE';

            $tipo = $request->query('tipo', DynamicReportService::TIPO_CITAS_FECHA);
            $filtros = $request->all();

            $reporte = $this->reportService->generateReport($tipo, $filtros, $user, $role);

            return response()->json([
                'success' => true,
                'data' => $reporte,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el reporte dinámico.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exportar reporte dinámico a archivo CSV estructurado
     * GET /api/analytics/reports/export-csv
     */
    public function export(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $user = $request->user();
            $role = $user?->roles?->first()?->nombre_rol ?? 'PACIENTE';

            $tipo = $request->query('tipo', DynamicReportService::TIPO_CITAS_FECHA);
            $filtros = $request->all();

            return $this->reportService->exportCsv($tipo, $filtros, $user, $role);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar el archivo CSV del reporte.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

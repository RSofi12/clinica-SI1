<?php

namespace App\Packages\Analytics\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Packages\Analytics\Requests\ProcessVoiceReportRequest;
use App\Packages\Analytics\Services\VoiceReportService;
use App\Packages\Analytics\Models\ReporteIa;

/**
 * Controlador de Reportes Personalizados por Voz con IA (CU23)
 * Paquete 6: Reportes y Analítica
 */
class VoiceReportController extends Controller
{
    public function __construct(
        protected VoiceReportService $voiceReportService
    ) {}

    /**
     * Procesa un comando de voz transcrito y retorna el reporte con métricas
     * POST /api/analytics/voice-report
     */
    public function processVoiceCommand(ProcessVoiceReportRequest $request): JsonResponse
    {
        try {
            $usuario = $request->user();
            $comando = $request->input('comando_texto');
            $contexto = $request->input('contexto', []);

            $reporte = $this->voiceReportService->generateReport($comando, $usuario, $contexto);

            return response()->json([
                'success' => true,
                'message' => 'Reporte generado con éxito a partir de la instrucción de voz.',
                'data'    => $reporte,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el comando de voz para analítica.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Consulta el historial de reportes solicitados por voz por el usuario
     * GET /api/analytics/voice-history
     */
    public function history(Request $request): JsonResponse
    {
        $usuario = $request->user();
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado.',
            ], 401);
        }

        $historial = $this->voiceReportService->getHistory($usuario->id_usuario);

        return response()->json([
            'success' => true,
            'data'    => $historial,
        ], 200);
    }

    /**
     * Estadísticas generales de uso del asistente inteligente de voz
     * GET /api/analytics/voice-stats
     */
    public function stats(Request $request): JsonResponse
    {
        $totalReportes = ReporteIa::count();
        $reportesHoy = ReporteIa::whereDate('fecha_generacion', today())->count();

        $tiposFrecuentes = ReporteIa::select('tipo_reporte', \DB::raw('count(*) as total'))
            ->groupBy('tipo_reporte')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_reportes'   => $totalReportes,
                'reportes_hoy'     => $reportesHoy,
                'tipos_frecuentes' => $tiposFrecuentes,
            ],
        ], 200);
    }
}

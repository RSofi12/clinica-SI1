<?php

namespace App\Packages\MedicalRecords\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\MedicalRecords\Requests\DocumentoClinicoUploadRequest;
use App\Packages\MedicalRecords\Services\DocumentoClinicoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/**
 * Controlador REST para Gestión de Documentos Clínicos Adjuntos (CU26)
 * Paquete 4: Historial Clínico y Consultas
 */
class DocumentosClinicosController extends Controller
{
    public function __construct(
        protected DocumentoClinicoService $documentoService
    ) {}

    /**
     * Lista los documentos clínicos asociados a un historial
     * GET /api/medical-records/historias/{idHistoria}/documentos
     */
    public function index(Request $request, int $idHistoria): JsonResponse
    {
        try {
            $filtros = $request->only(['tipo_documento', 'formato', 'id_orden', 'buscar', 'per_page']);
            $resultado = $this->documentoService->listarPorHistoria($idHistoria, $request->user(), $filtros);

            return response()->json([
                'success' => true,
                'data' => $resultado['documentos'],
                'estadisticas' => $resultado['estadisticas'],
                'historia' => $resultado['historia'],
            ], 200);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al consultar el archivo documental clínico: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sube y adjunta un documento clínico a la historia (con o sin orden CU25)
     * POST /api/medical-records/historias/{idHistoria}/documentos
     */
    public function store(DocumentoClinicoUploadRequest $request, int $idHistoria): JsonResponse
    {
        try {
            $archivo = $request->file('archivo');
            $datos = $request->validated();

            $documento = $this->documentoService->adjuntarDocumento(
                $idHistoria,
                $archivo,
                $datos,
                $request->user(),
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'message' => 'Documento clínico adjuntado correctamente.',
                'data' => $documento,
            ], 201);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al adjuntar el documento clínico: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retorna las órdenes de exámenes pendientes de la historia para asociar en el formulario
     * GET /api/medical-records/historias/{idHistoria}/ordenes-pendientes
     */
    public function ordenesPendientes(Request $request, int $idHistoria): JsonResponse
    {
        try {
            $ordenes = $this->documentoService->obtenerOrdenesPendientes($idHistoria, $request->user());

            return response()->json([
                'success' => true,
                'data' => $ordenes,
            ], 200);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener órdenes pendientes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina un documento clínico aplicando baja lógica y limpieza en Cloudinary
     * DELETE /api/medical-records/documentos/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $motivo = $request->input('motivo_eliminacion');
            $this->documentoService->eliminarDocumento($id, $request->user(), $motivo, $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'Documento clínico eliminado correctamente.',
            ], 200);
        } catch (HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el documento clínico: ' . $e->getMessage(),
            ], 500);
        }
    }
}

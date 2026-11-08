<?php

namespace App\Packages\Integrations\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Integrations\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * Controlador de Notificaciones y Recordatorios (CU20 / Paquete 5)
 * Metodología PUDS / RUP — Centro Médico La Cruz
 */
class NotificationsController extends Controller
{
    protected NotificationService $service;

    public function __construct(NotificationService $service)
    {
        $this->service = $service;
    }

    /**
     * Listado paginado de notificaciones con métricas para el usuario en sesión
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $resultado = $this->service->listarNotificaciones($user, $request->all());

            return response()->json([
                'success'         => true,
                'unread_count'    => $resultado['unread_count'],
                'conteo_por_tipo' => $resultado['conteo_por_tipo'],
                'data'            => $resultado['notificaciones'],
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Conteo rápido de no leídas para polling ligero de la campana
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $resultado = $this->service->listarNotificaciones($user, ['limit' => 1]);

            return response()->json([
                'success'      => true,
                'unread_count' => $resultado['unread_count'],
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Marca una notificación como leída con verificación Anti-IDOR
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $notificacion = $this->service->marcarComoLeida($id, $user);

            return response()->json([
                'success' => true,
                'message' => 'Notificación marcada como leída.',
                'data'    => $notificacion,
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [401, 403, 404], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Marca todas las notificaciones pendientes del usuario como leídas
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $afectadas = $this->service->marcarTodasComoLeidas($user);

            return response()->json([
                'success'   => true,
                'message'   => "Se marcaron {$afectadas} notificaciones como leídas.",
                'afectadas' => $afectadas,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Elimina una notificación con control Anti-IDOR
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $this->service->eliminarNotificacion($id, $user);

            return response()->json([
                'success' => true,
                'message' => 'Notificación eliminada de la bandeja.',
            ], 200);
        } catch (Exception $e) {
            $status = in_array($e->getCode(), [401, 403, 404], true) ? $e->getCode() : 422;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    /**
     * Disparador manual para emitir los recordatorios 24h (para demostración del examen en vivo)
     * Accesible por roles de gestión (ADMIN, RECEPCIONISTA)
     */
    public function triggerReminders(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        $rol = $user->tipo_usuario ?? $user->rol;
        if (!in_array($rol, ['ADMIN', 'RECEPCIONISTA'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo administradores y personal de recepción pueden ejecutar el disparador de recordatorios.',
            ], 403);
        }

        try {
            $forzar = (bool) $request->input('force', false);
            $idCita = $request->input('id_cita') ? (int) $request->input('id_cita') : null;

            $resumen = $this->service->ejecutarRecordatorios24h($forzar, $idCita);

            return response()->json([
                'success' => true,
                'message' => "Proceso de recordatorios CU20 ejecutado. {$resumen['recordatorios_enviados']} recordatorios generados exitosamente.",
                'data'    => $resumen,
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

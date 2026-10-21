<?php

namespace App\Packages\Security\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * AuditController - CU03: Gestionar Bitácora de Auditoría
 * Paquete: P1 - Seguridad y Auditoría
 * Consulta inmutable en solo lectura para supervisión administrativa
 */
class AuditController extends Controller
{
    /**
     * Listado paginado de eventos de bitácora con filtros multidimensionales (GET /api/audit)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Bitacora::with(['usuario:id_usuario,username,email,tipo_usuario']);

        // 1. Filtro textual libre (q) sobre descripción o IP
        if ($request->filled('q')) {
            $search = trim($request->input('q'));
            $query->where(function ($q) use ($search) {
                $q->where('descripcion', 'ilike', "%{$search}%")
                  ->orWhere('ip_origen', 'ilike', "%{$search}%")
                  ->orWhere('tabla_afectada', 'ilike', "%{$search}%")
                  ->orWhereHas('usuario', function ($u) use ($search) {
                      $u->where('username', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                  });
            });
        }

        // 2. Filtro por Módulo
        if ($request->filled('modulo')) {
            $query->where('modulo', $request->input('modulo'));
        }

        // 3. Filtro por Acción específica
        if ($request->filled('accion')) {
            $query->where('accion', $request->input('accion'));
        }

        // 4. Filtro por Operador / Usuario responsable
        if ($request->filled('id_usuario')) {
            $query->where('id_usuario', $request->input('id_usuario'));
        }

        // 5. Filtro por Rango de Fechas (fecha_inicio y fecha_fin)
        if ($request->filled('fecha_inicio')) {
            $query->where('fecha_registro', '>=', $request->input('fecha_inicio') . ' 00:00:00');
        }

        if ($request->filled('fecha_fin')) {
            $query->where('fecha_registro', '<=', $request->input('fecha_fin') . ' 23:59:59');
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = in_array($perPage, [10, 15, 25, 50, 100]) ? $perPage : 15;

        $logs = $query->orderBy('fecha_registro', 'desc')
                      ->orderBy('id_bitacora', 'desc')
                      ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    /**
     * Opciones únicas para selectores dinámicos de filtro (GET /api/audit/filters-data)
     */
    public function filtersData(): JsonResponse
    {
        $modulos = Bitacora::select('modulo')->distinct()->pluck('modulo')->filter()->values();
        $acciones = Bitacora::select('accion')->distinct()->pluck('accion')->filter()->values();
        $usuarios = User::select('id_usuario', 'username', 'email', 'tipo_usuario')
                        ->orderBy('username')
                        ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'modulos' => $modulos,
                'acciones' => $acciones,
                'usuarios' => $usuarios,
            ],
        ]);
    }

    /**
     * Métricas rápidas / KPIs de auditoría para la cabecera (GET /api/audit/stats)
     */
    public function stats(): JsonResponse
    {
        $hoy = now()->startOfDay();

        $totalEventosHoy = Bitacora::where('fecha_registro', '>=', $hoy)->count();
        $loginsExitososHoy = Bitacora::where('fecha_registro', '>=', $hoy)
                                    ->where('accion', 'LOGIN_EXITOSO')
                                    ->count();
        $intentosFallidosHoy = Bitacora::where('fecha_registro', '>=', $hoy)
                                      ->whereIn('accion', ['LOGIN_FALLIDO', 'LOGIN_BLOQUEADO'])
                                      ->count();
        $operacionesAdminHoy = Bitacora::where('fecha_registro', '>=', $hoy)
                                      ->whereIn('accion', ['CREAR_USUARIO', 'MODIFICAR_USUARIO', 'CAMBIO_ESTADO', 'DESBLOQUEO_USUARIO'])
                                      ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_hoy' => $totalEventosHoy,
                'logins_exitosos_hoy' => $loginsExitososHoy,
                'intentos_fallidos_hoy' => $intentosFallidosHoy,
                'operaciones_admin_hoy' => $operacionesAdminHoy,
            ],
        ]);
    }
}

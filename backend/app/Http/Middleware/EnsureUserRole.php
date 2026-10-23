<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware EnsureUserRole
 * Control de Acceso Basado en Roles (RBAC) y Verificación de Sesión Activa
 * Clínca Vida Salud / Centro Médico La Cruz
 */
class EnsureUserRole
{
    /**
     * Maneja la verificación de autenticación y rol para las rutas protegidas.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // 1. Comprobación de Autenticación Híbrida (Cookies de Sesión o Bearer Token de Sanctum)
        $user = Auth::user();
        if (!$user && $request->bearerToken()) {
            $user = Auth::guard('sanctum')->user();
            if ($user) {
                Auth::setUser($user);
            }
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Sesión no iniciada o credenciales expiradas. Inicie sesión para continuar.',
            ], 401);
        }

        // 2. Comprobación de Estado Activo del Usuario
        if ($user->estado !== 'ACTIVO') {
            Auth::logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                'success' => false,
                'message' => 'Su cuenta se encuentra inactiva o bloqueada. Comuníquese con la administración de la clínica.',
            ], 403);
        }

        // 3. Si no se especificaron roles requeridos, con estar autenticado y activo es suficiente
        if (empty($roles)) {
            return $next($request);
        }

        // 4. Verificación de Rol
        $userRole = strtoupper(trim($user->tipo_usuario ?? $user->rol ?? ''));
        $allowedRoles = array_map(fn($r) => strtoupper(trim($r)), $roles);

        if (!in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => "Acceso denegado: su rol de usuario ({$userRole}) no cuenta con los permisos requeridos para esta operación.",
            ], 403);
        }

        return $next($request);
    }
}

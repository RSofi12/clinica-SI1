<?php

namespace App\Packages\Security\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Security\Models\SecurityConfig;
use App\Packages\Security\Models\Bitacora;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * SecurityPolicyController - Parámetros configurables de seguridad (CU01 / CU02)
 * Paquete: P1 - Seguridad y Auditoría
 */
class SecurityPolicyController extends Controller
{
    /**
     * Obtener política de bloqueo activa (GET /api/security/policy)
     */
    public function getPolicy(): JsonResponse
    {
        $policy = SecurityConfig::obtenerPoliticaActiva();

        return response()->json([
            'success' => true,
            'data' => $policy,
        ]);
    }

    /**
     * Actualizar política de bloqueo (PUT /api/security/policy)
     */
    public function updatePolicy(Request $request): JsonResponse
    {
        $request->validate([
            'max_intentos_fallidos' => 'required|integer|min:2|max:10',
            'minutos_bloqueo' => 'required|integer|min:1|max:60',
        ], [
            'max_intentos_fallidos.required' => 'El número de intentos máximos es obligatorio.',
            'max_intentos_fallidos.min' => 'El mínimo de intentos permitidos es 2.',
            'max_intentos_fallidos.max' => 'El máximo de intentos permitidos es 10.',
            'minutos_bloqueo.required' => 'Los minutos de penalización son obligatorios.',
            'minutos_bloqueo.min' => 'El tiempo de espera mínimo es 1 minuto.',
            'minutos_bloqueo.max' => 'El tiempo de espera máximo es 60 minutos.',
        ]);

        $maxIntentos = (int) $request->input('max_intentos_fallidos');
        $minutosBloqueo = (int) $request->input('minutos_bloqueo');

        $policy = SecurityConfig::obtenerPoliticaActiva();
        $policy->actualizarPolitica($maxIntentos, $minutosBloqueo, Auth::id());

        // Auditoría CU03
        Bitacora::registrar(
            Auth::id(),
            'Seguridad',
            'ACTUALIZAR_POLITICA_SEGURIDAD',
            'configuracion_seguridad',
            $policy->id_configuracion,
            "Política de seguridad actualizada: {$maxIntentos} intentos máximos permitidos, {$minutosBloqueo} minutos de penalización temporal.",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Política de seguridad actualizada exitosamente.',
            'data' => $policy,
        ]);
    }
}

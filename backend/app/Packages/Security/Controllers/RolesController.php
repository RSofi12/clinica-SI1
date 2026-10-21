<?php

namespace App\Packages\Security\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Security\Models\Role;
use Illuminate\Http\JsonResponse;

/**
 * RolesController - Catálogo de Roles y Permisos (CU02 - RF01)
 * Paquete: P1 - Seguridad y Auditoría
 */
class RolesController extends Controller
{
    /**
     * Listar roles disponibles con sus permisos asociados
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permisos')->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }
}

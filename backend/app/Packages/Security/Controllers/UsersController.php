<?php

namespace App\Packages\Security\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Security\Models\User;
use App\Packages\Security\Models\Role;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Requests\UserCreateRequest;
use App\Packages\Security\Requests\UserUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * UsersController - CU02: Gestionar Usuarios, Roles y Permisos (RF01)
 * Paquete: P1 - Seguridad y Auditoría
 */
class UsersController extends Controller
{
    /**
     * Listado con filtros y paginación (GET /api/users)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles.permisos');

        // Filtro por término de búsqueda (username o email)
        if ($request->filled('q')) {
            $search = trim($request->input('q'));
            $query->where(function ($q) use ($search) {
                $q->where('username', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        // Filtro por Rol / Tipo de Usuario
        if ($request->filled('tipo_usuario')) {
            $query->where('tipo_usuario', $request->input('tipo_usuario'));
        }

        // Filtro por Estado (ACTIVO, INACTIVO, BLOQUEADO)
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $users = $query->orderBy('id_usuario', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Crear nuevo usuario (POST /api/users)
     */
    public function store(UserCreateRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = User::create([
                'username' => trim($request->input('username')),
                'email' => strtolower(trim($request->input('email'))),
                'password_hash' => Hash::make($request->input('password')),
                'tipo_usuario' => $request->input('tipo_usuario'),
                'estado' => 'ACTIVO',
                'intentos_fallidos' => 0,
                'fecha_creacion' => now(),
                'fecha_actualizacion' => now(),
            ]);

            // Asignación de rol correspondiente
            $role = Role::where('nombre', $request->input('tipo_usuario'))->first();
            if ($role) {
                $user->roles()->sync([$role->id_rol]);
            }

            // Auditoría CU03
            $authId = Auth::id();
            Bitacora::registrar(
                $authId,
                'Seguridad',
                'CREAR_USUARIO',
                'usuarios',
                $user->id_usuario,
                "Se registró el nuevo usuario '{$user->username}' con rol '{$user->tipo_usuario}'.",
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente.',
                'data' => $user->load('roles.permisos'),
            ], 201);
        });
    }

    /**
     * Ver detalle de un usuario (GET /api/users/{id})
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('roles.permisos')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario solicitado no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Modificar usuario existente (PUT /api/users/{id})
     */
    public function update(UserUpdateRequest $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario a modificar no existe.',
            ], 404);
        }

        return DB::transaction(function () use ($request, $user) {
            $user->email = strtolower(trim($request->input('email')));
            $user->tipo_usuario = $request->input('tipo_usuario');
            $user->fecha_actualizacion = now();

            // Si se envió nueva contraseña, aplicar hash
            if ($request->filled('password')) {
                $user->password_hash = Hash::make($request->input('password'));
            }

            $user->save();

            // Sincronizar rol correspondiente
            $role = Role::where('nombre', $user->tipo_usuario)->first();
            if ($role) {
                $user->roles()->sync([$role->id_rol]);
            }

            // Auditoría CU03
            $authId = Auth::id();
            Bitacora::registrar(
                $authId,
                'Seguridad',
                'MODIFICAR_USUARIO',
                'usuarios',
                $user->id_usuario,
                "Se actualizaron los datos del usuario '{$user->username}'.",
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente.',
                'data' => $user->load('roles.permisos'),
            ]);
        });
    }

    /**
     * Conmutar Estado / Baja Lógica (PATCH /api/users/{id}/toggle-status)
     * Regla RN11: No se hace DELETE físico de la base de datos.
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario no existe.',
            ], 404);
        }

        // Protección: evitar que el administrador activo se inhabilite a sí mismo
        if (Auth::id() === $user->id_usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No puede inhabilitar su propia cuenta de administrador en sesión.',
            ], 422);
        }

        $nuevoEstado = ($user->estado === 'ACTIVO') ? 'INACTIVO' : 'ACTIVO';
        $user->estado = $nuevoEstado;
        $user->fecha_actualizacion = now();
        $user->save();

        // Auditoría CU03
        $authId = Auth::id();
        Bitacora::registrar(
            $authId,
            'Seguridad',
            'CAMBIO_ESTADO',
            'usuarios',
            $user->id_usuario,
            "Baja lógica / cambio de estado del usuario '{$user->username}' a '{$nuevoEstado}'.",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "El usuario ha sido marcado como {$nuevoEstado}.",
            'data' => $user->load('roles'),
        ]);
    }

    /**
     * Desbloquear cuenta bloqueada por intentos fallidos (POST /api/users/{id}/unlock)
     */
    public function unlock(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario no existe.',
            ], 404);
        }

        $user->estado = 'ACTIVO';
        $user->intentos_fallidos = 0;
        $user->fecha_actualizacion = now();
        $user->save();

        // Auditoría CU03
        $authId = Auth::id();
        Bitacora::registrar(
            $authId,
            'Seguridad',
            'DESBLOQUEO_USUARIO',
            'usuarios',
            $user->id_usuario,
            "Se desbloqueó la cuenta y se reiniciaron los intentos fallidos para '{$user->username}'.",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "La cuenta de '{$user->username}' ha sido desbloqueada con éxito.",
            'data' => $user->load('roles'),
        ]);
    }
}

<?php

namespace App\Packages\ClinicalResources\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\ClinicalResources\Requests\DoctorCreateRequest;
use App\Packages\ClinicalResources\Requests\DoctorUpdateRequest;
use App\Packages\Security\Models\User;
use App\Packages\Security\Models\Role;
use App\Packages\Security\Models\Bitacora;

/**
 * Controlador de Médicos y Especialistas (CU06 / RF03 - Actor Médico Unificado)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class DoctorsController extends Controller
{
    /**
     * Listado paginado de médicos con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $query = Medico::with(['specialties', 'user:id_usuario,username,email,estado']);

        // Filtro por término textual (nombres, apellidos, matrícula, correo o especialidad)
        if ($request->filled('q')) {
            $query->buscar($request->q);
        }

        // Filtro por especialidad
        if ($request->filled('especialidad_id')) {
            $query->porEspecialidad((int) $request->especialidad_id);
        }

        // Filtro por estado activo / inactivo
        if ($request->filled('estado')) {
            $estado = strtolower($request->estado);
            if ($estado === 'activo' || $estado === '1' || $estado === 'true') {
                $query->where('estado_activo', true);
            } elseif ($estado === 'inactivo' || $estado === '0' || $estado === 'false') {
                $query->where('estado_activo', false);
            }
        }

        $perPage = (int) $request->input('per_page', 10);
        $medicos = $query->orderBy('apellidos')->orderBy('nombres')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $medicos->items(),
            'meta' => [
                'current_page' => $medicos->currentPage(),
                'last_page' => $medicos->lastPage(),
                'per_page' => $medicos->perPage(),
                'total' => $medicos->total(),
            ],
        ]);
    }

    /**
     * Detalle de un médico
     */
    public function show(int $id): JsonResponse
    {
        $medico = Medico::with(['specialties', 'user'])->find($id);

        if (!$medico) {
            return response()->json([
                'success' => false,
                'message' => 'Médico no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $medico,
        ]);
    }

    /**
     * Registrar un nuevo médico con sus especialidades (CU06 / RF03)
     */
    public function store(DoctorCreateRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $medico = DB::transaction(function () use ($validated, $request) {
            $idUsuario = $validated['id_usuario'] ?? null;

            // 1. Crear cuenta de acceso al sistema si fue solicitada
            if ($request->boolean('crear_cuenta_web') && !empty($validated['username'])) {
                $rolMedico = Role::firstOrCreate(['nombre' => 'MEDICO']);
                $passwordPlana = $validated['password'] ?? 'Admin123@';

                $usuario = User::create([
                    'username' => trim($validated['username']),
                    'email' => $validated['correo_profesional'] ?? ($validated['username'] . '@clinicalacruz.com'),
                    'password_hash' => Hash::make($passwordPlana),
                    'tipo_usuario' => 'MEDICO',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => now(),
                    'fecha_actualizacion' => now(),
                ]);

                $usuario->roles()->syncWithoutDetaching([$rolMedico->id_rol]);
                $idUsuario = $usuario->id_usuario;
            }

            // 2. Crear el registro del médico
            $doctor = Medico::create([
                'id_usuario' => $idUsuario,
                'codigo_profesional' => strtoupper(trim($validated['codigo_profesional'])),
                'nombres' => trim($validated['nombres']),
                'apellidos' => trim($validated['apellidos']),
                'telefono_contacto' => $validated['telefono_contacto'] ?? null,
                'correo_profesional' => $validated['correo_profesional'] ?? null,
                'estado_activo' => true,
            ]);

            // 3. Vincular especialidades en tabla intermedia
            $especialidadesPivot = [];
            $principalId = (int) $validated['id_especialidad_principal'];

            foreach ($validated['especialidades'] as $espId) {
                $espIdInt = (int) $espId;
                $especialidadesPivot[$espIdInt] = [
                    'es_principal' => ($espIdInt === $principalId),
                ];
            }

            $doctor->specialties()->sync($especialidadesPivot);

            // 4. Registro en bitácora inmutable
            Bitacora::registrar(
                'CU06: Registrar Médico',
                "Alta médica para {$doctor->nombre_completo} (Matrícula: {$doctor->codigo_profesional}) con " . count($especialidadesPivot) . " especialidad(es).",
                'RECURSOS_CLINICOS'
            );

            return $doctor->load(['specialties', 'user']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Médico registrado exitosamente en el plantel institucional.',
            'data' => $medico,
        ], 201);
    }

    /**
     * Actualizar datos y especialidades de un médico
     */
    public function update(DoctorUpdateRequest $request, int $id): JsonResponse
    {
        $medico = Medico::find($id);

        if (!$medico) {
            return response()->json([
                'success' => false,
                'message' => 'Médico no encontrado.',
            ], 404);
        }

        $validated = $request->validated();

        $medicoActualizado = DB::transaction(function () use ($medico, $validated) {
            $medico->update([
                'codigo_profesional' => strtoupper(trim($validated['codigo_profesional'])),
                'nombres' => trim($validated['nombres']),
                'apellidos' => trim($validated['apellidos']),
                'telefono_contacto' => $validated['telefono_contacto'] ?? null,
                'correo_profesional' => $validated['correo_profesional'] ?? null,
                'estado_activo' => $validated['estado_activo'] ?? $medico->estado_activo,
            ]);

            // Sincronizar especialidades
            $especialidadesPivot = [];
            $principalId = (int) $validated['id_especialidad_principal'];

            foreach ($validated['especialidades'] as $espId) {
                $espIdInt = (int) $espId;
                $especialidadesPivot[$espIdInt] = [
                    'es_principal' => ($espIdInt === $principalId),
                ];
            }

            $medico->specialties()->sync($especialidadesPivot);

            Bitacora::registrar(
                'CU06: Modificar Médico',
                "Modificación de datos del profesional {$medico->nombre_completo} (ID: {$medico->id_medico}).",
                'RECURSOS_CLINICOS'
            );

            return $medico->load(['specialties', 'user']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Datos del médico actualizados exitosamente.',
            'data' => $medicoActualizado,
        ]);
    }

    /**
     * Alternar estado de baja lógica (RN04 y RN11)
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $medico = Medico::find($id);

        if (!$medico) {
            return response()->json([
                'success' => false,
                'message' => 'Médico no encontrado.',
            ], 404);
        }

        $nuevoEstado = !$medico->estado_activo;
        $medico->estado_activo = $nuevoEstado;
        $medico->save();

        $estadoStr = $nuevoEstado ? 'ACTIVADO' : 'DESACTIVADO';

        Bitacora::registrar(
            'CU06: Cambiar Estado Médico',
            "Médico {$medico->nombre_completo} ha sido {$estadoStr} (Baja lógica RN11).",
            'RECURSOS_CLINICOS'
        );

        return response()->json([
            'success' => true,
            'message' => "Médico {$estadoStr} exitosamente.",
            'data' => [
                'id_medico' => $medico->id_medico,
                'estado_activo' => $medico->estado_activo,
            ],
        ]);
    }

    /**
     * Estadísticas rápidas del plantel médico
     */
    public function stats(): JsonResponse
    {
        $total = Medico::count();
        $activos = Medico::where('estado_activo', true)->count();
        $inactivos = $total - $activos;

        // Distribución por especialidad
        $porEspecialidad = Especialidad::withCount('doctors')
            ->where('estado', 'ACTIVO')
            ->get(['id_especialidad', 'nombre', 'precio_consulta'])
            ->map(function ($esp) {
                return [
                    'id_especialidad' => $esp->id_especialidad,
                    'nombre' => $esp->nombre,
                    'total_medicos' => $esp->doctors_count,
                    'precio_consulta' => $esp->precio_consulta,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => $inactivos,
                'por_especialidad' => $porEspecialidad,
            ],
        ]);
    }
}

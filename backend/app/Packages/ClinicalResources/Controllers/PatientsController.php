<?php

namespace App\Packages\ClinicalResources\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\ClinicalResources\Models\EmergencyContact;
use App\Packages\ClinicalResources\Models\Patient;
use App\Packages\ClinicalResources\Requests\PatientCreateRequest;
use App\Packages\ClinicalResources\Requests\PatientUpdateRequest;
use App\Packages\Security\Models\Bitacora;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Controlador de Gestión de Pacientes — CU04 (RF02)
 * Paquete 2: Gestión de Recursos Clínicos y Pacientes
 */
class PatientsController extends Controller
{
    /**
     * Listado paginado de pacientes con filtros de búsqueda y demografía
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if ($user && ($user->tipo_usuario ?? $user->rol) === 'PACIENTE') {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado: los pacientes no tienen autorización para consultar el padrón general.',
            ], 403);
        }

        $query = Patient::with(['contactosEmergencia']);

        // Filtro de búsqueda textual (CI, N° Historia, Nombres o Apellidos)
        if ($request->filled('q')) {
            $query->buscar($request->input('q'));
        }

        // Filtro por estado del paciente (ACTIVO / INACTIVO)
        if ($request->filled('estado')) {
            $query->where('estado_paciente', $request->input('estado'));
        }

        // Filtro por sexo
        if ($request->filled('sexo')) {
            $query->where('sexo', $request->input('sexo'));
        }

        // Filtro por grupo etario (pediatrico, adulto, geriatrico)
        if ($request->filled('grupo_etario')) {
            $hoy = Carbon::today();
            $grupo = strtolower($request->input('grupo_etario'));

            if ($grupo === 'pediatrico') {
                $query->where('fecha_nacimiento', '>', $hoy->copy()->subYears(15));
            } elseif ($grupo === 'geriatrico') {
                $query->where('fecha_nacimiento', '<=', $hoy->copy()->subYears(60));
            } elseif ($grupo === 'adulto') {
                $query->whereBetween('fecha_nacimiento', [
                    $hoy->copy()->subYears(60)->addDay(),
                    $hoy->copy()->subYears(15),
                ]);
            }
        }

        $perPage = (int) $request->input('per_page', 10);
        $patients = $query->orderBy('id_paciente', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $patients->items(),
            'pagination' => [
                'total'        => $patients->total(),
                'per_page'     => $patients->perPage(),
                'current_page' => $patients->currentPage(),
                'last_page'    => $patients->lastPage(),
            ],
        ]);
    }

    /**
     * Estadísticas y KPIs institucionales del padrón de pacientes
     */
    public function stats(): JsonResponse
    {
        $hoy = Carbon::today();

        $total = Patient::count();
        $activos = Patient::where('estado_paciente', 'ACTIVO')->count();
        $inactivos = Patient::where('estado_paciente', 'INACTIVO')->count();

        $pediatricos = Patient::where('estado_paciente', 'ACTIVO')
            ->where('fecha_nacimiento', '>', $hoy->copy()->subYears(15))
            ->count();

        $geriatricos = Patient::where('estado_paciente', 'ACTIVO')
            ->where('fecha_nacimiento', '<=', $hoy->copy()->subYears(60))
            ->count();

        $adultos = $activos - ($pediatricos + $geriatricos);
        if ($adultos < 0) $adultos = 0;

        return response()->json([
            'success' => true,
            'stats'   => [
                'total'        => $total,
                'activos'      => $activos,
                'inactivos'    => $inactivos,
                'pediatricos'  => $pediatricos,
                'adultos'      => $adultos,
                'geriatricos'  => $geriatricos,
            ],
        ]);
    }

    /**
     * Búsqueda ágil por CI para reserva de citas (CU09 / CU10)
     */
    public function searchByCi(string $ci): JsonResponse
    {
        $patient = Patient::with('contactosEmergencia')
            ->where('numero_documento', trim($ci))
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró ningún paciente con el CI proporcionado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'patient' => $patient,
        ]);
    }

    /**
     * Obtener el detalle completo de un paciente
     */
    public function show(int $id): JsonResponse
    {
        $patient = Patient::with(['contactosEmergencia', 'usuario'])->find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Paciente no encontrado en el sistema.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'patient' => $patient,
        ]);
    }

    /**
     * Registrar un nuevo paciente con su contacto de emergencia (CU04 / RF02)
     */
    public function store(PatientCreateRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            // Auto-generar número correlativo de historia clínica (ej. HC-0001)
            $numeroHistoria = Patient::generarNumeroHistoria();

            $patient = Patient::create([
                'numero_historia'       => $numeroHistoria,
                'numero_documento'      => trim($data['numero_documento']),
                'nombres'               => trim($data['nombres']),
                'apellidos'             => trim($data['apellidos']),
                'fecha_nacimiento'      => $data['fecha_nacimiento'],
                'sexo'                  => $data['sexo'],
                'tipo_sangre'           => $data['tipo_sangre'] ?? null,
                'telefono'              => $data['telefono'] ?? null,
                'correo'                => $data['correo'] ?? null,
                'direccion'             => $data['direccion'] ?? null,
                'notificaciones_activas'=> $data['notificaciones_activas'] ?? true,
                'estado_paciente'       => 'ACTIVO',
                'fecha_registro'        => now(),
            ]);

            // Guardar contacto de emergencia si fue proporcionado
            if (!empty($data['contacto_nombre']) && !empty($data['contacto_telefono'])) {
                EmergencyContact::create([
                    'id_paciente' => $patient->id_paciente,
                    'nombre'      => trim($data['contacto_nombre']),
                    'parentesco'  => trim($data['contacto_parentesco'] ?? 'Familiar'),
                    'telefono'    => trim($data['contacto_telefono']),
                ]);
            }

            // Auditoría inmutable en Bitácora (CU03)
            Bitacora::registrar([
                'id_usuario'      => Auth::id(),
                'modulo'          => 'Recursos Clínicos',
                'accion'          => 'ALTA_PACIENTE',
                'tabla_afectada'  => 'pacientes',
                'id_registro'     => $patient->id_paciente,
                'datos_nuevos'    => [
                    'numero_historia'  => $patient->numero_historia,
                    'numero_documento' => $patient->numero_documento,
                    'nombre_completo'  => $patient->nombre_completo,
                    'edad'             => $patient->edad,
                    'grupo_etario'     => $patient->grupo_etario,
                ],
                'descripcion'     => "Se registró el paciente '{$patient->nombre_completo}' con CI '{$patient->numero_documento}' e Historia '{$patient->numero_historia}'.",
                'ip_origen'       => $request->ip(),
                'user_agent'      => $request->userAgent(),
            ]);

            $patient->load('contactosEmergencia');

            return response()->json([
                'success' => true,
                'message' => "Paciente '{$patient->nombre_completo}' registrado con éxito bajo la Historia Clínica {$patient->numero_historia}.",
                'patient' => $patient,
            ], 201);
        });
    }

    /**
     * Modificar datos demográficos y de contacto del paciente
     */
    public function update(PatientUpdateRequest $request, int $id): JsonResponse
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Paciente no encontrado.',
            ], 404);
        }

        return DB::transaction(function () use ($request, $patient) {
            $data = $request->validated();
            $datosPrevios = $patient->toArray();

            $patient->update([
                'numero_documento'      => trim($data['numero_documento']),
                'nombres'               => trim($data['nombres']),
                'apellidos'             => trim($data['apellidos']),
                'fecha_nacimiento'      => $data['fecha_nacimiento'],
                'sexo'                  => $data['sexo'],
                'tipo_sangre'           => $data['tipo_sangre'] ?? null,
                'telefono'              => $data['telefono'] ?? null,
                'correo'                => $data['correo'] ?? null,
                'direccion'             => $data['direccion'] ?? null,
                'notificaciones_activas'=> $data['notificaciones_activas'] ?? $patient->notificaciones_activas,
            ]);

            // Actualizar o crear contacto de emergencia principal
            if (!empty($data['contacto_nombre']) && !empty($data['contacto_telefono'])) {
                $contacto = EmergencyContact::where('id_paciente', $patient->id_paciente)->first();
                if ($contacto) {
                    $contacto->update([
                        'nombre'     => trim($data['contacto_nombre']),
                        'parentesco' => trim($data['contacto_parentesco'] ?? $contacto->parentesco),
                        'telefono'   => trim($data['contacto_telefono']),
                    ]);
                } else {
                    EmergencyContact::create([
                        'id_paciente' => $patient->id_paciente,
                        'nombre'      => trim($data['contacto_nombre']),
                        'parentesco'  => trim($data['contacto_parentesco'] ?? 'Familiar'),
                        'telefono'    => trim($data['contacto_telefono']),
                    ]);
                }
            }

            // Auditoría inmutable en Bitácora (CU03)
            Bitacora::registrar([
                'id_usuario'      => Auth::id(),
                'modulo'          => 'Recursos Clínicos',
                'accion'          => 'EDICION_PACIENTE',
                'tabla_afectada'  => 'pacientes',
                'id_registro'     => $patient->id_paciente,
                'datos_previos'   => $datosPrevios,
                'datos_nuevos'    => $patient->fresh()->toArray(),
                'descripcion'     => "Se actualizaron los datos del paciente '{$patient->nombre_completo}' ({$patient->numero_historia}).",
                'ip_origen'       => $request->ip(),
                'user_agent'      => $request->userAgent(),
            ]);

            $patient->load('contactosEmergencia');

            return response()->json([
                'success' => true,
                'message' => "Datos del paciente '{$patient->nombre_completo}' actualizados correctamente.",
                'patient' => $patient,
            ]);
        });
    }

    /**
     * Conmutar estado activo/inactivo (Baja Lógica RN11)
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Paciente no encontrado.',
            ], 404);
        }

        $nuevoEstado = $patient->estado_paciente === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        $accion = $nuevoEstado === 'INACTIVO' ? 'BAJA_LOGICA_PACIENTE' : 'REACTIVACION_PACIENTE';

        $patient->estado_paciente = $nuevoEstado;
        $patient->save();

        // Auditoría inmutable en Bitácora (CU03)
        Bitacora::registrar([
            'id_usuario'      => Auth::id(),
            'modulo'          => 'Recursos Clínicos',
            'accion'          => $accion,
            'tabla_afectada'  => 'pacientes',
            'id_registro'     => $patient->id_paciente,
            'datos_nuevos'    => ['estado_paciente' => $nuevoEstado],
            'descripcion'     => "Se cambió el estado del paciente '{$patient->nombre_completo}' ({$patient->numero_historia}) a {$nuevoEstado}.",
            'ip_origen'       => $request->ip(),
            'user_agent'      => $request->userAgent(),
        ]);

        $mensaje = $nuevoEstado === 'ACTIVO'
            ? "Paciente '{$patient->nombre_completo}' reactivado correctamente para programación de citas."
            : "Paciente '{$patient->nombre_completo}' desactivado (Baja Lógica). Su historial clínico y de citas permanece protegido.";

        return response()->json([
            'success'         => true,
            'message'         => $mensaje,
            'estado_paciente' => $nuevoEstado,
            'patient'         => $patient,
        ]);
    }

    /**
     * Habilitar o crear cuenta web para un paciente desde ventanilla/recepción (CU05)
     */
    public function enableWebAccount(Request $request, int $id): JsonResponse
    {
        $operator = Auth::user();
        if (!$operator || !in_array($operator->tipo_usuario ?? $operator->rol, ['ADMIN', 'RECEPCIONISTA'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado: solo el personal de recepción o administración puede habilitar accesos web.',
            ], 403);
        }

        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Paciente no encontrado.'], 404);
        }

        if ($patient->id_usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Este paciente ya tiene una cuenta web asignada.',
            ], 422);
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:50', 'unique:usuarios,username', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'email'    => ['required', 'email', 'max:120', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        return DB::transaction(function () use ($validated, $patient, $request) {
            $user = \App\Packages\Security\Models\User::create([
                'username'            => trim($validated['username']),
                'email'               => trim($validated['email']),
                'password_hash'       => \Illuminate\Support\Facades\Hash::make($validated['password']),
                'tipo_usuario'        => 'PACIENTE',
                'estado'              => 'ACTIVO',
                'intentos_fallidos'   => 0,
                'fecha_creacion'      => now(),
                'fecha_actualizacion' => now(),
            ]);

            $rolPaciente = \App\Packages\Security\Models\Role::where('nombre', 'PACIENTE')->first();
            if ($rolPaciente) {
                $user->roles()->syncWithoutDetaching([$rolPaciente->id_rol]);
            }

            $patient->id_usuario = $user->id_usuario;
            if (empty($patient->correo)) {
                $patient->correo = $user->email;
            }
            $patient->save();

            Bitacora::registrar([
                'id_usuario'     => Auth::id(),
                'modulo'         => 'Recursos Clínicos',
                'accion'         => 'HABILITACION_CUENTA_PACIENTE',
                'tabla_afectada' => 'pacientes',
                'id_registro'    => $patient->id_paciente,
                'descripcion'    => "Recepción habilitó cuenta web para '{$patient->nombre_completo}' (usuario: {$user->username}).",
                'ip_origen'      => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Acceso web habilitado exitosamente para {$patient->nombre_completo}.",
                'patient' => $patient->load('usuario'),
            ], 201);
        });
    }
}

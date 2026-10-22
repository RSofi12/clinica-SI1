<?php

namespace App\Packages\Appointments\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Packages\Appointments\Models\Cita;
use App\Packages\Appointments\Models\TipoCita;
use App\Packages\Appointments\Requests\AppointmentBookRequest;
use App\Packages\Appointments\Services\AppointmentBookingService;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Paciente;

/**
 * Controlador de Gestión y Reserva de Citas Médicas (CU10 / RF06, RF07)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentsController extends Controller
{
    protected AppointmentBookingService $bookingService;

    public function __construct(AppointmentBookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /**
     * Listado paginado de citas con filtros multicriterio (RF11 / RF12)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Cita::with([
            'paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,telefono',
            'medico:id_medico,nombres,apellidos,codigo_profesional',
            'especialidad:id_especialidad,nombre,precio_consulta',
            'tipoCita:id_tipo_cita,nombre',
        ]);

        $user = Auth::user();
        if ($user) {
            if ($user->rol === 'PACIENTE') {
                $paciente = Paciente::where('id_usuario', $user->id_usuario)->first();
                if ($paciente) {
                    $query->where('id_paciente', $paciente->id_paciente);
                } else {
                    $query->whereRaw('1 = 0');
                }
            } elseif ($user->rol === 'MEDICO') {
                $medico = Medico::where('id_usuario', $user->id_usuario)->first();
                if ($medico) {
                    $query->where('id_medico', $medico->id_medico);
                }
            }
        }

        // Filtro por término de búsqueda (código de cita, paciente o médico)
        if ($request->filled('q')) {
            $term = mb_strtolower(trim($request->q));
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(codigo_cita) LIKE ?', ["%{$term}%"])
                  ->orWhereHas('paciente', function ($pq) use ($term) {
                      $pq->whereRaw('LOWER(nombres) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(numero_documento) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(numero_historia) LIKE ?', ["%{$term}%"]);
                  })
                  ->orWhereHas('medico', function ($mq) use ($term) {
                      $mq->whereRaw('LOWER(nombres) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(codigo_profesional) LIKE ?', ["%{$term}%"]);
                  });
            });
        }

        // Filtro por fecha específica
        if ($request->filled('fecha')) {
            $query->whereDate('fecha_hora_inicio', $request->fecha);
        }

        // Filtro por médico (solo si no es médico o es admin/recepción)
        if ($request->filled('medico_id') && (!$user || $user->rol !== 'MEDICO')) {
            $query->where('id_medico', (int) $request->medico_id);
        }

        // Filtro por paciente (solo si no es paciente)
        if ($request->filled('paciente_id') && (!$user || $user->rol !== 'PACIENTE')) {
            $query->where('id_paciente', (int) $request->paciente_id);
        }

        // Filtro por estado
        if ($request->filled('estado') && $request->estado !== 'TODOS') {
            $query->where('estado', $request->estado);
        }

        $perPage = (int) $request->input('per_page', 10);
        $citas = $query->orderBy('fecha_hora_inicio', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $citas->items(),
            'meta' => [
                'current_page' => $citas->currentPage(),
                'last_page' => $citas->lastPage(),
                'per_page' => $citas->perPage(),
                'total' => $citas->total(),
            ],
        ]);
    }

    /**
     * Programar nueva cita médica con prevención anti-colisión transaccional (CU10 / RF06, RF07)
     */
    public function store(AppointmentBookRequest $request): JsonResponse
    {
        try {
            $creadaPor = Auth::id() ?? 1; // ID de usuario autenticado en la sesión
            $cita = $this->bookingService->programarCita($request->validated(), $creadaPor);

            return response()->json([
                'success' => true,
                'message' => "Cita médica {$cita->codigo_cita} programada exitosamente.",
                'data' => $cita,
            ], 201);
        } catch (\Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    /**
     * Detalle completo de una cita médica
     */
    public function show(int $id): JsonResponse
    {
        $cita = Cita::with([
            'paciente',
            'medico.specialties',
            'especialidad',
            'tipoCita',
            'historialEstados.usuario:id_usuario,username',
        ])->find($id);

        if (!$cita) {
            return response()->json([
                'success' => false,
                'message' => 'Cita médica no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $cita,
        ]);
    }

    /**
     * Catálogos auxiliares para el asistente interactivo de reserva
     */
    public function getBookingFormData(): JsonResponse
    {
        $tiposCita = TipoCita::orderBy('nombre')->get();
        $especialidades = Especialidad::activas()->orderBy('nombre')->get();
        $medicos = Medico::activos()->with(['specialties'])->orderBy('apellidos')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'tipos_cita' => $tiposCita,
                'especialidades' => $especialidades,
                'medicos' => $medicos,
            ],
        ]);
    }
}

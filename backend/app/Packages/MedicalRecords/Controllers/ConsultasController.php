<?php

namespace App\Packages\MedicalRecords\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\MedicalRecords\Models\ConsultaMedica;
use App\Packages\MedicalRecords\Requests\ConsultaCreateRequest;
use App\Packages\MedicalRecords\Services\ConsultaMedicaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConsultasController extends Controller
{
    protected ConsultaMedicaService $consultaService;

    public function __construct(ConsultaMedicaService $consultaService)
    {
        $this->consultaService = $consultaService;
    }

    /**
     * Listado paginado de consultas médicas con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = ConsultaMedica::with([
            'cita:id_cita,codigo_cita,fecha_hora_inicio,modalidad,estado',
            'historiaClinica.paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,fecha_nacimiento,sexo',
            'medico:id_medico,nombres,apellidos,codigo_profesional',
            'diagnosticos:id_diagnostico,id_consulta,descripcion,codigo_cie10,tipo',
        ])->latest('fecha_consulta');

        // Scoping según rol
        if ($user->tipo_usuario === 'MEDICO') {
            $medico = $user->medico;
            if ($medico) {
                $query->where('id_medico', $medico->id_medico);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user->tipo_usuario === 'PACIENTE') {
            $paciente = $user->paciente;
            if ($paciente && $paciente->historiaClinica) {
                $query->where('id_historia_clinica', $paciente->historiaClinica->id_historia_clinica);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // Filtro por fecha
        if ($request->filled('fecha')) {
            $query->whereDate('fecha_consulta', $request->fecha);
        }

        // Filtro por término de búsqueda (paciente, CI, código de cita)
        if ($request->filled('buscar')) {
            $buscar = trim($request->buscar);
            $query->where(function ($q) use ($buscar) {
                $q->whereHas('historiaClinica.paciente', function ($qp) use ($buscar) {
                    $qp->where('nombres', 'ilike', "%{$buscar}%")
                       ->orWhere('apellidos', 'ilike', "%{$buscar}%")
                       ->orWhere('numero_documento', 'ilike', "%{$buscar}%")
                       ->orWhere('numero_historia', 'ilike', "%{$buscar}%");
                })->orWhereHas('cita', function ($qc) use ($buscar) {
                    $qc->where('codigo_cita', 'ilike', "%{$buscar}%");
                });
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $consultas = $query->paginate($perPage);

        return response()->json($consultas, 200);
    }

    /**
     * Prepara la ficha previa de consulta médica a partir de una cita
     */
    public function preparar(int $idCita): JsonResponse
    {
        $user = Auth::user();
        $datos = $this->consultaService->prepararConsulta($idCita, $user);

        return response()->json($datos, 200);
    }

    /**
     * Obtiene el detalle completo de una consulta médica
     */
    public function show(int $id): JsonResponse
    {
        $user = Auth::user();

        $consulta = ConsultaMedica::with([
            'cita',
            'historiaClinica.paciente',
            'medico',
            'diagnosticos',
            'receta.detalles',
            'ordenesExamenes',
            'documentosClinicos',
        ])->findOrFail($id);

        // Control de acceso
        if ($user->tipo_usuario === 'MEDICO' && $user->medico && $user->medico->id_medico !== $consulta->id_medico) {
            return response()->json(['message' => 'No autorizado para ver consultas de otro profesional.'], 403);
        }

        if ($user->tipo_usuario === 'PACIENTE' && $user->paciente && $user->paciente->id_paciente !== $consulta->historiaClinica->id_paciente) {
            return response()->json(['message' => 'No autorizado para acceder a este expediente clínico.'], 403);
        }

        return response()->json($consulta, 200);
    }

    /**
     * Registra una consulta médica completa y finaliza la cita (CU16)
     */
    public function store(ConsultaCreateRequest $request): JsonResponse
    {
        $user = Auth::user();
        $consulta = $this->consultaService->registrarConsulta($request->validated(), $user);

        return response()->json([
            'message' => 'Consulta médica y triaje clínico registrados exitosamente.',
            'data'    => $consulta,
        ], 201);
    }
}

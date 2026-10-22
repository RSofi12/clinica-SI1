<?php

namespace App\Packages\ClinicalResources\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Disponibilidad;
use App\Packages\ClinicalResources\Models\BloqueoHorario;
use App\Packages\ClinicalResources\Requests\ScheduleBatchRequest;
use App\Packages\ClinicalResources\Requests\BlockCreateRequest;
use App\Packages\Security\Models\Bitacora;
use Carbon\Carbon;

/**
 * Controlador de Gestión de Horarios de Atención y Bloqueos (CU08 / RF05)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class SchedulesController extends Controller
{
    /**
     * Obtiene los horarios semanales configurados y bloqueos de un médico
     */
    public function getDoctorSchedule(Request $request, int $idMedico): JsonResponse
    {
        $medico = Medico::with(['specialties'])->find($idMedico);

        if (!$medico) {
            return response()->json([
                'success' => false,
                'message' => 'Médico no encontrado.',
            ], 404);
        }

        // Obtener disponibilidades semanales
        $disponibilidades = Disponibilidad::where('id_medico', $idMedico)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        // Obtener bloqueos vigentes (personales y generales de la clínica)
        $fechaHoy = Carbon::today()->format('Y-m-d');
        $bloqueos = BloqueoHorario::paraMedicoOInstitucional($idMedico)
            ->where('fecha', '>=', $fechaHoy)
            ->orderBy('fecha')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'medico' => [
                    'id_medico' => $medico->id_medico,
                    'nombre_completo' => $medico->nombre_completo,
                    'codigo_profesional' => $medico->codigo_profesional,
                    'estado_activo' => $medico->estado_activo,
                    'especialidad_principal' => $medico->especialidad_principal,
                ],
                'disponibilidades' => $disponibilidades,
                'bloqueos' => $bloqueos,
            ],
        ]);
    }

    /**
     * Guarda o actualiza en lote la grilla semanal de atención de un médico (CU08 / RF05)
     */
    public function saveDoctorSchedule(ScheduleBatchRequest $request, int $idMedico): JsonResponse
    {
        $medico = Medico::find($idMedico);

        if (!$medico) {
            return response()->json([
                'success' => false,
                'message' => 'Médico no encontrado.',
            ], 404);
        }

        $horarios = $request->validated()['horarios'];

        DB::beginTransaction();
        try {
            // Reemplazar la configuración semanal del médico
            Disponibilidad::where('id_medico', $idMedico)->delete();

            $insertados = [];
            foreach ($horarios as $item) {
                $disponibilidad = Disponibilidad::create([
                    'id_medico' => $idMedico,
                    'dia_semana' => (int) $item['dia_semana'],
                    'hora_inicio' => $item['hora_inicio'],
                    'hora_fin' => $item['hora_fin'],
                    'duracion_cita_minutos' => (int) ($item['duracion_cita_minutos'] ?? 30),
                    'activo' => (bool) ($item['activo'] ?? true),
                ]);
                $insertados[] = $disponibilidad;
            }

            // Registro inmutable de auditoría (CU03 / Bitacora)
            Bitacora::registrar(
                Auth::id(),
                'Recursos Clínicos',
                'ACTUALIZAR_HORARIOS',
                'disponibilidades',
                $idMedico,
                "Se actualizó la grilla de disponibilidad semanal (" . count($insertados) . " franjas) para {$medico->nombre_completo}."
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Horarios de atención actualizados exitosamente.',
                'data' => $insertados,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar los horarios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lista todos los bloqueos (feriados institucionales y licencias de médicos)
     */
    public function getBlocks(Request $request): JsonResponse
    {
        $query = BloqueoHorario::with(['medico:id_medico,nombres,apellidos,codigo_profesional']);

        // Filtro por fecha inicial
        if ($request->filled('desde')) {
            $query->where('fecha', '>=', $request->desde);
        }

        // Filtro por médico específico
        if ($request->filled('id_medico')) {
            $query->where('id_medico', (int) $request->id_medico);
        }

        // Filtro solo feriados institucionales generales
        if ($request->boolean('solo_generales')) {
            $query->feriadosGenerales();
        }

        $bloqueos = $query->orderBy('fecha', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $bloqueos,
        ]);
    }

    /**
     * Registra un nuevo bloqueo (feriado general de clínica o licencia particular)
     */
    public function storeBlock(BlockCreateRequest $request): JsonResponse
    {
        $data = $request->validated();

        $bloqueo = BloqueoHorario::create([
            'id_medico' => $data['id_medico'] ?? null,
            'fecha' => $data['fecha'],
            'hora_inicio' => $data['hora_inicio'] ?? null,
            'hora_fin' => $data['hora_fin'] ?? null,
            'motivo' => $data['motivo'],
        ]);

        $tipo = is_null($bloqueo->id_medico) ? 'Feriado General Institucional' : 'Licencia Médica Personal';
        $detalle = "{$tipo} registrado para el {$bloqueo->fecha}: {$bloqueo->motivo}";

        Bitacora::registrar(
            Auth::id(),
            'Recursos Clínicos',
            'REGISTRAR_BLOQUEO',
            'bloqueos_horario',
            $bloqueo->id_bloqueo,
            $detalle
        );

        $bloqueo->load('medico:id_medico,nombres,apellidos,codigo_profesional');

        return response()->json([
            'success' => true,
            'message' => "{$tipo} registrado correctamente.",
            'data' => $bloqueo,
        ], 201);
    }

    /**
     * Elimina un bloqueo o feriado
     */
    public function deleteBlock(int $id): JsonResponse
    {
        $bloqueo = BloqueoHorario::find($id);

        if (!$bloqueo) {
            return response()->json([
                'success' => false,
                'message' => 'Bloqueo no encontrado.',
            ], 404);
        }

        $motivo = $bloqueo->motivo;
        $fecha = $bloqueo->fecha;
        $idMedico = $bloqueo->id_medico;

        $bloqueo->delete();

        Bitacora::registrar(
            Auth::id(),
            'Recursos Clínicos',
            'ELIMINAR_BLOQUEO',
            'bloqueos_horario',
            $id,
            "Se eliminó el bloqueo/feriado '{$motivo}' de la fecha {$fecha}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Bloqueo eliminado correctamente.',
        ]);
    }
}

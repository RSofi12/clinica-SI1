<?php

namespace App\Packages\Analytics\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Patient;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Controlador de Dashboard Clínico y KPIs (CU24 - Paquete 6: Reportes y Analítica)
 * Provee métricas ejecutivas, operativas del día y distribución de citas por estado.
 */
class DashboardController extends Controller
{
    public function getKpis(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user?->roles?->first()?->nombre_rol ?? 'PACIENTE';

        // 1. Resolver rango de fechas según 'periodo' o 'desde'/'hasta'
        $periodo = $request->query('periodo', 'mes');
        $ahora = Carbon::now('America/La_Paz');
        $hoy = $ahora->copy()->startOfDay();

        if ($request->has('desde') && $request->has('hasta') && !empty($request->query('desde')) && !empty($request->query('hasta'))) {
            $fechaInicio = Carbon::parse($request->query('desde'), 'America/La_Paz')->startOfDay();
            $fechaFin = Carbon::parse($request->query('hasta'), 'America/La_Paz')->endOfDay();
            $periodo = 'custom';
        } else {
            switch ($periodo) {
                case 'hoy':
                    $fechaInicio = $hoy->copy();
                    $fechaFin = $ahora->copy()->endOfDay();
                    break;
                case '7d':
                    $fechaInicio = $hoy->copy()->subDays(6);
                    $fechaFin = $ahora->copy()->endOfDay();
                    break;
                case '30d':
                    $fechaInicio = $hoy->copy()->subDays(29);
                    $fechaFin = $ahora->copy()->endOfDay();
                    break;
                case 'mes':
                default:
                    $fechaInicio = $hoy->copy()->startOfMonth();
                    $fechaFin = $hoy->copy()->endOfMonth();
                    $periodo = 'mes';
                    break;
            }
        }

        // 2. Query base con scoping de rol
        $citaQuery = Cita::query();
        $medicoActual = null;
        $pacienteActual = null;

        if ($role === 'MEDICO') {
            $medicoActual = Medico::where('id_usuario', $user->id_usuario)->first();
            if ($medicoActual) {
                $citaQuery->where('id_medico', $medicoActual->id_medico);
            }
        } elseif ($role === 'PACIENTE') {
            $pacienteActual = Patient::where('id_usuario', $user->id_usuario)->first();
            if ($pacienteActual) {
                $citaQuery->where('id_paciente', $pacienteActual->id_paciente);
            }
        }

        // 3. Pacientes Activos
        if ($role === 'PACIENTE') {
            $pacientesActivos = 1;
        } elseif ($role === 'MEDICO' && $medicoActual) {
            $pacientesActivos = Cita::where('id_medico', $medicoActual->id_medico)
                ->distinct('id_paciente')
                ->count('id_paciente');
        } else {
            $pacientesActivos = Patient::where('estado_paciente', 'ACTIVO')->count();
        }

        // 4. Citas del período filtrado
        $citasPeriodoQuery = (clone $citaQuery)
            ->whereBetween('fecha_hora_inicio', [$fechaInicio, $fechaFin]);

        $totalCitasPeriodo = (clone $citasPeriodoQuery)->count();
        $atendidasPeriodo = (clone $citasPeriodoQuery)->where('estado', 'ATENDIDA')->count();
        $canceladasPeriodo = (clone $citasPeriodoQuery)->where('estado', 'CANCELADA')->count();
        $reprogramadasPeriodo = (clone $citasPeriodoQuery)
            ->where(function ($q) {
                $q->whereNotNull('reprogramada_en')
                  ->orWhereNotNull('motivo_reprogramacion');
            })->count();

        $tasaAtencion = $totalCitasPeriodo > 0 ? round(($atendidasPeriodo / $totalCitasPeriodo) * 100, 1) : 0;
        $tasaCancelacion = $totalCitasPeriodo > 0 ? round(($canceladasPeriodo / $totalCitasPeriodo) * 100, 1) : 0;

        // 5. Distribución de estados en el período
        $estadosRaw = (clone $citasPeriodoQuery)
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->orderByDesc('total')
            ->get();

        $distribucionEstados = [];
        foreach ($estadosRaw as $item) {
            $distribucionEstados[] = [
                'estado' => $item->estado,
                'total'  => (int)$item->total,
            ];
        }

        // 6. Operativo de Hoy
        $inicioHoy = $hoy->copy()->startOfDay();
        $finHoy = $hoy->copy()->endOfDay();

        $citasHoyQuery = (clone $citaQuery)
            ->whereBetween('fecha_hora_inicio', [$inicioHoy, $finHoy]);

        $totalHoy = (clone $citasHoyQuery)->count();
        $programadasHoy = (clone $citasHoyQuery)->whereIn('estado', ['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'])->count();
        $atendidasHoy = (clone $citasHoyQuery)->where('estado', 'ATENDIDA')->count();
        $canceladasHoy = (clone $citasHoyQuery)->where('estado', 'CANCELADA')->count();

        // Lista de citas del día para vista operativa
        $citasHoy = (clone $citasHoyQuery)
            ->with([
                'paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia',
                'medico:id_medico,nombres,apellidos',
                'especialidad:id_especialidad,nombre_especialidad'
            ])
            ->orderBy('fecha_hora_inicio', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($cita) {
                return [
                    'id_cita'           => $cita->id_cita,
                    'codigo_cita'       => $cita->codigo_cita,
                    'hora'              => Carbon::parse($cita->fecha_hora_inicio)->format('H:i'),
                    'estado'            => $cita->estado,
                    'paciente_nombre'   => $cita->paciente ? ($cita->paciente->nombres . ' ' . $cita->paciente->apellidos) : 'Paciente no asignado',
                    'numero_historia'   => $cita->paciente?->numero_historia ?? '—',
                    'medico_nombre'     => $cita->medico ? ($cita->medico->nombres . ' ' . $cita->medico->apellidos) : 'Médico institucional',
                    'especialidad'      => $cita->especialidad?->nombre_especialidad ?? 'Medicina General',
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'periodo' => [
                    'tipo'   => $periodo,
                    'desde'  => $fechaInicio->format('Y-m-d'),
                    'hasta'  => $fechaFin->format('Y-m-d'),
                    'desde_f'=> $fechaInicio->format('d/m/Y'),
                    'hasta_f'=> $fechaFin->format('d/m/Y'),
                ],
                'kpis' => [
                    'pacientes_activos'    => $pacientesActivos,
                    'citas_periodo'        => $totalCitasPeriodo,
                    'tasa_atencion'        => $tasaAtencion,
                    'citas_atendidas'      => $atendidasPeriodo,
                    'citas_canceladas'     => $canceladasPeriodo,
                    'tasa_cancelacion'     => $tasaCancelacion,
                    'citas_reprogramadas'  => $reprogramadasPeriodo,
                ],
                'distribucion_estados'     => $distribucionEstados,
                'operativo_hoy' => [
                    'fecha'           => $ahora->format('d/m/Y'),
                    'total'           => $totalHoy,
                    'programadas'     => $programadasHoy,
                    'atendidas'       => $atendidasHoy,
                    'canceladas'      => $canceladasHoy,
                    'citas'           => $citasHoy,
                ],
            ],
        ], 200);
    }
}

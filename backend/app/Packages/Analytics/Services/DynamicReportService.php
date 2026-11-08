<?php

namespace App\Packages\Analytics\Services;

use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Disponibilidad;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Patient;
use App\Packages\Integrations\Models\Pago;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Servicio de Generación de Reportes con Filtros Dinámicos (CU22 - RF13)
 * Paquete 6: Reportes y Analítica
 * Metodología PUDS / RUP — Centro Médico La Cruz
 */
class DynamicReportService
{
    /**
     * Mapeo de tipos de reporte soportados (1 al 7 según RF13)
     */
    public const TIPO_CITAS_FECHA = 'citas-fecha';
    public const TIPO_CITAS_MEDICO = 'citas-medico';
    public const TIPO_CITAS_ESPECIALIDAD = 'citas-especialidad';
    public const TIPO_CITAS_ESTADO = 'citas-estado';
    public const TIPO_PACIENTES = 'pacientes';
    public const TIPO_BALANCE = 'balance';
    public const TIPO_AGENDA_DIARIA = 'agenda-diaria';

    /**
     * Catálogos para filtros en frontend
     */
    public function getCatalogs(?User $user, string $role): array
    {
        $especialidades = Especialidad::activas()
            ->orderBy('nombre', 'asc')
            ->get(['id_especialidad', 'nombre', 'precio_consulta']);

        $medicosQuery = Medico::query()
            ->with(['especialidades:id_especialidad,nombre'])
            ->where('estado_activo', true);

        if ($role === 'MEDICO' && $user) {
            $medicosQuery->where('id_usuario', $user->id_usuario);
        }

        $medicos = $medicosQuery->get()->map(function ($m) {
            return [
                'id_medico' => $m->id_medico,
                'nombre_completo' => $m->nombre_completo,
                'matricula_profesional' => $m->codigo_profesional ?? 'S/M',
                'especialidad_principal' => $m->especialidad_principal?->nombre ?? 'Medicina General',
                'especialidades' => $m->especialidades->pluck('nombre'),
            ];
        });

        return [
            'especialidades' => $especialidades,
            'medicos' => $medicos,
            'estados_cita' => [
                'TODOS',
                'PROGRAMADA',
                'CONFIRMADA',
                'ATENDIDA',
                'CANCELADA',
                'INASISTENCIA',
                'NO_ASISTIO',
            ],
            'grupos_etarios' => [
                'TODOS',
                'PEDIATRICO' => 'Pediátrico (0 - 12 años)',
                'ADULTO' => 'Adulto (13 - 59 años)',
                'GERIATRICO' => 'Geriátrico (60+ años)',
            ],
        ];
    }

    /**
     * Generador unificado de los 7 reportes gerenciales con filtros dinámicos
     */
    public function generateReport(string $tipo, array $filtros, ?User $user, string $role): array
    {
        // 1. Normalizar fechas
        $rango = $this->resolverRangoFechas($filtros);
        $fechaInicio = $rango['inicio'];
        $fechaFin = $rango['fin'];

        // 2. Scoping de Médico
        if ($role === 'MEDICO' && $user) {
            $medico = Medico::where('id_usuario', $user->id_usuario)->first();
            if ($medico) {
                $filtros['id_medico'] = $medico->id_medico;
            }
        }

        // 3. Despacho al generador específico según el tipo
        $resultado = match ($tipo) {
            self::TIPO_CITAS_FECHA => $this->reporteCitasPorFecha($fechaInicio, $fechaFin, $filtros),
            self::TIPO_CITAS_MEDICO => $this->reporteCitasPorMedico($fechaInicio, $fechaFin, $filtros),
            self::TIPO_CITAS_ESPECIALIDAD => $this->reporteCitasPorEspecialidad($fechaInicio, $fechaFin, $filtros),
            self::TIPO_CITAS_ESTADO => $this->reporteCitasPorEstado($fechaInicio, $fechaFin, $filtros),
            self::TIPO_PACIENTES => $this->reportePacientes($fechaInicio, $fechaFin, $filtros),
            self::TIPO_BALANCE => $this->reporteBalanceTotales($fechaInicio, $fechaFin, $filtros),
            self::TIPO_AGENDA_DIARIA => $this->reporteAgendaDiaria($filtros),
            default => $this->reporteCitasPorFecha($fechaInicio, $fechaFin, $filtros),
        };

        // 4. Auditoría inmutable en bitácora
        if ($user) {
            Bitacora::registrar(
                idUsuario: $user->id_usuario,
                accion: 'GENERAR_REPORTE_DINAMICO',
                tablaAfectada: 'citas',
                idRegistroAfectado: null,
                valoresAnteriores: null,
                valoresNuevos: [
                    'tipo_reporte' => $tipo,
                    'filtros' => $filtros,
                    'total_registros' => count($resultado['registros'] ?? []),
                ],
                ip: request()->ip()
            );
        }

        $resultado['tipo_reporte'] = $tipo;
        $resultado['filtros_aplicados'] = array_merge($filtros, [
            'fecha_desde_normalizada' => $fechaInicio->toDateString(),
            'fecha_hasta_normalizada' => $fechaFin->toDateString(),
        ]);
        $resultado['generado_en'] = Carbon::now('America/La_Paz')->format('Y-m-d H:i:s');
        $resultado['generado_por'] = $user?->username ?? 'Sistema';

        return $resultado;
    }

    /**
     * Reporte 1: Citas por Fecha / Rango de Fechas
     */
    protected function reporteCitasPorFecha(Carbon $desde, Carbon $hasta, array $filtros): array
    {
        $query = $this->crearQueryCitasBase($desde, $hasta, $filtros);

        $citas = $query->orderBy('fecha_hora_inicio', 'asc')->get();

        $total = $citas->count();
        $atendidas = $citas->where('estado', 'ATENDIDA')->count();
        $canceladas = $citas->where('estado', 'CANCELADA')->count();
        $programadas = $citas->whereIn('estado', ['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'])->count();
        $inasistencias = $citas->whereIn('estado', ['INASISTENCIA', 'NO_ASISTIO'])->count();

        // Agrupación por día
        $porDia = $citas->groupBy(fn ($c) => Carbon::parse($c->fecha_hora_inicio)->format('Y-m-d'))
            ->map(fn ($grupo, $dia) => [
                'fecha' => $dia,
                'total' => $grupo->count(),
                'atendidas' => $grupo->where('estado', 'ATENDIDA')->count(),
                'canceladas' => $grupo->where('estado', 'CANCELADA')->count(),
            ])->values();

        $diasDiferencia = max(1, $desde->diffInDays($hasta) + 1);
        $promedioDiario = round($total / $diasDiferencia, 1);

        return [
            'titulo' => 'Reporte 1: Citas Médicas por Rango de Fechas',
            'descripcion' => "Detalle cronológico de citas programadas entre {$desde->format('d/m/Y')} y {$hasta->format('d/m/Y')}",
            'metricas' => [
                'total_citas' => $total,
                'atendidas' => $atendidas,
                'programadas' => $programadas,
                'canceladas' => $canceladas,
                'inasistencias' => $inasistencias,
                'tasa_asistencia' => $total > 0 ? round(($atendidas / $total) * 100, 1) : 0,
                'promedio_diario' => $promedioDiario,
            ],
            'grafico_tendencia' => $porDia,
            'registros' => $this->formatearColeccionCitas($citas),
        ];
    }

    /**
     * Reporte 2: Citas por Médico
     */
    protected function reporteCitasPorMedico(Carbon $desde, Carbon $hasta, array $filtros): array
    {
        $query = $this->crearQueryCitasBase($desde, $hasta, $filtros);
        $citas = $query->orderBy('fecha_hora_inicio', 'asc')->get();

        // Agrupar por médico
        $resumenMedicos = $citas->groupBy('id_medico')->map(function ($grupo) {
            $primera = $grupo->first();
            $total = $grupo->count();
            $atendidas = $grupo->where('estado', 'ATENDIDA')->count();
            $canceladas = $grupo->where('estado', 'CANCELADA')->count();
            $programadas = $grupo->whereIn('estado', ['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'])->count();
            $inasistencias = $grupo->whereIn('estado', ['INASISTENCIA', 'NO_ASISTIO'])->count();

            return [
                'id_medico' => $primera->id_medico,
                'medico' => $primera->medico?->nombre_completo ?? 'No asignado',
                'matricula' => $primera->medico?->codigo_profesional ?? 'S/M',
                'especialidad' => $primera->medico?->especialidad_principal?->nombre ?? 'General',
                'total_citas' => $total,
                'atendidas' => $atendidas,
                'canceladas' => $canceladas,
                'programadas' => $programadas,
                'inasistencias' => $inasistencias,
                'tasa_atencion' => $total > 0 ? round(($atendidas / $total) * 100, 1) : 0,
                'tasa_cancelacion' => $total > 0 ? round(($canceladas / $total) * 100, 1) : 0,
            ];
        })->values()->sortByDesc('total_citas')->values();

        return [
            'titulo' => 'Reporte 2: Citas Médicas por Médico Asignado',
            'descripcion' => 'Desempeño, carga de trabajo y tasa de atención individual por profesional médico',
            'metricas' => [
                'medicos_con_citas' => $resumenMedicos->count(),
                'total_citas' => $citas->count(),
                'medico_mayor_demanda' => $resumenMedicos->first()['medico'] ?? 'N/A',
                'citas_mayor_demanda' => $resumenMedicos->first()['total_citas'] ?? 0,
            ],
            'resumen_agrupado' => $resumenMedicos,
            'registros' => $this->formatearColeccionCitas($citas),
        ];
    }

    /**
     * Reporte 3: Citas por Especialidad
     */
    protected function reporteCitasPorEspecialidad(Carbon $desde, Carbon $hasta, array $filtros): array
    {
        $query = $this->crearQueryCitasBase($desde, $hasta, $filtros);
        $citas = $query->orderBy('fecha_hora_inicio', 'asc')->get();

        $totalGeneral = max(1, $citas->count());

        $resumenEspecialidades = $citas->groupBy('id_especialidad')->map(function ($grupo) use ($totalGeneral) {
            $primera = $grupo->first();
            $total = $grupo->count();
            $atendidas = $grupo->where('estado', 'ATENDIDA')->count();
            $canceladas = $grupo->where('estado', 'CANCELADA')->count();

            return [
                'id_especialidad' => $primera->id_especialidad,
                'especialidad' => $primera->especialidad?->nombre ?? 'Medicina General',
                'precio_consulta' => (float) ($primera->especialidad?->precio_consulta ?? 70.00),
                'total_citas' => $total,
                'atendidas' => $atendidas,
                'canceladas' => $canceladas,
                'participacion_porcentaje' => round(($total / $totalGeneral) * 100, 1),
                'ingresos_estimados' => round($atendidas * (float) ($primera->especialidad?->precio_consulta ?? 70.00), 2),
            ];
        })->values()->sortByDesc('total_citas')->values();

        return [
            'titulo' => 'Reporte 3: Demanda y Volumen por Especialidad Médica',
            'descripcion' => 'Distribución clínica de citas, atenciones y porcentaje de demanda por especialidad',
            'metricas' => [
                'especialidades_activas' => $resumenEspecialidades->count(),
                'total_citas' => $citas->count(),
                'especialidad_top' => $resumenEspecialidades->first()['especialidad'] ?? 'N/A',
                'participacion_top' => $resumenEspecialidades->first()['participacion_porcentaje'] ?? 0,
            ],
            'resumen_agrupado' => $resumenEspecialidades,
            'registros' => $this->formatearColeccionCitas($citas),
        ];
    }

    /**
     * Reporte 4: Citas por Estado (Programadas, Atendidas, Canceladas, Inasistencias)
     */
    protected function reporteCitasPorEstado(Carbon $desde, Carbon $hasta, array $filtros): array
    {
        $query = $this->crearQueryCitasBase($desde, $hasta, $filtros);
        $citas = $query->orderBy('fecha_hora_inicio', 'asc')->get();

        $total = max(1, $citas->count());

        $estados = [
            'ATENDIDA' => ['label' => 'Atendidas', 'color' => '#10b981'],
            'PROGRAMADA' => ['label' => 'Programadas', 'color' => '#3b82f6'],
            'CONFIRMADA' => ['label' => 'Confirmadas', 'color' => '#06b6d4'],
            'CANCELADA' => ['label' => 'Canceladas', 'color' => '#ef4444'],
            'INASISTENCIA' => ['label' => 'Inasistencias', 'color' => '#f59e0b'],
            'NO_ASISTIO' => ['label' => 'No Asistió', 'color' => '#8b5cf6'],
            'PENDIENTE' => ['label' => 'Pendientes', 'color' => '#64748b'],
        ];

        $resumenEstados = [];
        foreach ($estados as $key => $info) {
            $conteo = $citas->where('estado', $key)->count();
            if ($conteo > 0 || in_array($key, ['ATENDIDA', 'PROGRAMADA', 'CANCELADA', 'INASISTENCIA'])) {
                $resumenEstados[] = [
                    'estado' => $key,
                    'nombre_visible' => $info['label'],
                    'color' => $info['color'],
                    'conteo' => $conteo,
                    'porcentaje' => round(($conteo / $total) * 100, 1),
                ];
            }
        }

        // Análisis específico de cancelaciones con motivos
        $canceladasConMotivo = $citas->where('estado', 'CANCELADA')->map(function ($c) {
            return [
                'codigo_cita' => $c->codigo_cita,
                'fecha' => Carbon::parse($c->fecha_hora_inicio)->format('d/m/Y H:i'),
                'paciente' => $c->paciente?->nombre_completo ?? 'N/A',
                'medico' => $c->medico?->nombre_completo ?? 'N/A',
                'motivo_cancelacion' => $c->motivo_cancelacion ?? 'Sin motivo registrado',
                'cancelada_en' => $c->cancelada_en ? Carbon::parse($c->cancelada_en)->format('d/m/Y H:i') : 'N/A',
            ];
        })->values();

        return [
            'titulo' => 'Reporte 4: Clasificación de Citas por Estado y Ciclo de Vida',
            'descripcion' => 'Distribución de citas según su estado actual con justificaciones de cancelación (RN09/RN11)',
            'metricas' => [
                'total_citas' => $citas->count(),
                'tasa_efectividad' => round(($citas->where('estado', 'ATENDIDA')->count() / $total) * 100, 1),
                'tasa_cancelacion' => round(($citas->where('estado', 'CANCELADA')->count() / $total) * 100, 1),
                'tasa_inasistencia' => round(($citas->whereIn('estado', ['INASISTENCIA', 'NO_ASISTIO'])->count() / $total) * 100, 1),
            ],
            'distribucion_estados' => $resumenEstados,
            'motivos_cancelacion' => $canceladasConMotivo,
            'registros' => $this->formatearColeccionCitas($citas),
        ];
    }

    /**
     * Reporte 5: Pacientes Registrados
     */
    protected function reportePacientes(Carbon $desde, Carbon $hasta, array $filtros): array
    {
        $query = Patient::query()
            ->with(['contactosEmergencia']);

        if (!empty($filtros['desde']) && !empty($filtros['hasta'])) {
            $query->whereBetween('fecha_registro', [$desde, $hasta]);
        }

        if (!empty($filtros['grupo_etario']) && $filtros['grupo_etario'] !== 'TODOS') {
            $hoy = Carbon::now('America/La_Paz');
            if ($filtros['grupo_etario'] === 'PEDIATRICO') {
                $query->where('fecha_nacimiento', '>', $hoy->copy()->subYears(15));
            } elseif ($filtros['grupo_etario'] === 'GERIATRICO') {
                $query->where('fecha_nacimiento', '<=', $hoy->copy()->subYears(60));
            } elseif ($filtros['grupo_etario'] === 'ADULTO') {
                $query->whereBetween('fecha_nacimiento', [$hoy->copy()->subYears(60)->addDay(), $hoy->copy()->subYears(15)]);
            }
        }

        if (!empty($filtros['estado']) && $filtros['estado'] !== 'TODOS') {
            $query->where('estado_paciente', $filtros['estado']);
        }

        $pacientes = $query->orderBy('fecha_registro', 'desc')->get();

        $total = max(1, $pacientes->count());
        $pediatricos = $pacientes->filter(fn ($p) => $p->edad < 15)->count();
        $adultos = $pacientes->filter(fn ($p) => $p->edad >= 15 && $p->edad < 60)->count();
        $geriatricos = $pacientes->filter(fn ($p) => $p->edad >= 60)->count();
        $conCuentaWeb = $pacientes->whereNotNull('id_usuario')->count();
        $activos = $pacientes->where('estado_paciente', 'ACTIVO')->count();

        $registrosFormateados = $pacientes->map(function ($p) {
            return [
                'id_paciente' => $p->id_paciente,
                'codigo_historia' => $p->numero_historia ?? 'HC-' . str_pad($p->id_paciente, 4, '0', STR_PAD_LEFT),
                'nombre_completo' => $p->nombre_completo,
                'numero_documento' => $p->numero_documento,
                'fecha_nacimiento' => $p->fecha_nacimiento ? Carbon::parse($p->fecha_nacimiento)->format('d/m/Y') : 'N/A',
                'edad' => $p->edad ?? ($p->fecha_nacimiento ? Carbon::parse($p->fecha_nacimiento)->age : 'N/A'),
                'grupo_etario' => $p->grupo_etario ?? 'ADULTO',
                'sexo' => $p->sexo ?? 'N/A',
                'telefono' => $p->telefono ?? 'N/A',
                'email' => $p->correo ?? $p->email ?? 'N/A',
                'cuenta_web_activa' => !empty($p->id_usuario),
                'estado' => $p->estado_paciente ?? 'ACTIVO',
                'fecha_registro' => $p->fecha_registro ? Carbon::parse($p->fecha_registro)->format('d/m/Y H:i') : 'N/A',
            ];
        })->values()->all();

        return [
            'titulo' => 'Reporte 5: Padrón de Pacientes Registrados',
            'descripcion' => 'Censo poblacional clínico, segmentación por grupos etarios (RF04) y acceso digital (§3.4)',
            'metricas' => [
                'total_pacientes' => $pacientes->count(),
                'pediatricos' => $pediatricos,
                'adultos' => $adultos,
                'geriatricos' => $geriatricos,
                'cuentas_web_activas' => $conCuentaWeb,
                'porcentaje_cuentas_web' => round(($conCuentaWeb / $total) * 100, 1),
                'pacientes_activos' => $activos,
            ],
            'distribucion_etaria' => [
                ['grupo' => 'Pediátrico (0 - 12)', 'conteo' => $pediatricos, 'porcentaje' => round(($pediatricos / $total) * 100, 1)],
                ['grupo' => 'Adulto (13 - 59)', 'conteo' => $adultos, 'porcentaje' => round(($adultos / $total) * 100, 1)],
                ['grupo' => 'Geriátrico (60+)', 'conteo' => $geriatricos, 'porcentaje' => round(($geriatricos / $total) * 100, 1)],
            ],
            'registros' => $registrosFormateados,
        ];
    }

    /**
     * Reporte 6: Balance y Totales en Período (Financiero + Asistencia)
     */
    protected function reporteBalanceTotales(Carbon $desde, Carbon $hasta, array $filtros): array
    {
        $query = $this->crearQueryCitasBase($desde, $hasta, $filtros);
        $citas = $query->with('pago')->orderBy('fecha_hora_inicio', 'asc')->get();

        $totalCitas = $citas->count();
        $atendidas = $citas->where('estado', 'ATENDIDA')->count();
        $canceladas = $citas->where('estado', 'CANCELADA')->count();
        $inasistencias = $citas->whereIn('estado', ['INASISTENCIA', 'NO_ASISTIO'])->count();
        $programadas = $citas->whereIn('estado', ['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'])->count();

        // Finanzas y Pagos Stripe
        $pagosQuery = Pago::query()
            ->where('estado', Pago::ESTADO_COMPLETADO)
            ->whereBetween('created_at', [$desde, $hasta]);

        $totalIngresosStripe = (float) $pagosQuery->sum('monto');
        $totalPagosCount = $pagosQuery->count();

        // Estimación por atenciones con precio de especialidad
        $ingresosEstimadosConsultas = (float) $citas->where('estado', 'ATENDIDA')->sum(function ($c) {
            return $c->monto_pago ?? ($c->especialidad?->precio_consulta ?? 70.00);
        });

        $citasPagadas = $citas->where('pagada', true)->count();
        $citasPendientesPago = $totalCitas - $citasPagadas;

        $tasaAsistencia = $totalCitas > 0 ? round(($atendidas / $totalCitas) * 100, 1) : 0;
        $tasaPerdida = $totalCitas > 0 ? round((($canceladas + $inasistencias) / $totalCitas) * 100, 1) : 0;
        $ticketPromedio = $atendidas > 0 ? round($ingresosEstimadosConsultas / $atendidas, 2) : 0;

        return [
            'titulo' => 'Reporte 6: Balance Consolidado y Rendimiento Operativo',
            'descripcion' => "Resumen institucional de efectividad clínica, citas y balance de ingresos ({$desde->format('d/m/Y')} - {$hasta->format('d/m/Y')})",
            'metricas' => [
                'total_citas' => $totalCitas,
                'atendidas' => $atendidas,
                'canceladas' => $canceladas,
                'inasistencias' => $inasistencias,
                'programadas' => $programadas,
                'tasa_asistencia' => $tasaAsistencia,
                'tasa_perdida' => $tasaPerdida,
                'total_ingresos' => round($ingresosEstimadosConsultas, 2),
                'ingresos_stripe_confirmados' => round($totalIngresosStripe, 2),
                'pagos_registrados' => $totalPagosCount,
                'citas_pagadas' => $citasPagadas,
                'citas_pendientes_pago' => $citasPendientesPago,
                'ticket_promedio' => $ticketPromedio,
            ],
            'registros' => $this->formatearColeccionCitas($citas),
        ];
    }

    /**
     * Reporte 7: Agenda Diaria por Médico (RF11 / RF13)
     */
    protected function reporteAgendaDiaria(array $filtros): array
    {
        $fecha = !empty($filtros['fecha']) ? Carbon::parse($filtros['fecha'], 'America/La_Paz') : Carbon::now('America/La_Paz');
        $inicioDia = $fecha->copy()->startOfDay();
        $finDia = $fecha->copy()->endOfDay();

        $medico = null;
        if (!empty($filtros['id_medico'])) {
            $medico = Medico::with(['especialidades', 'usuario'])->find($filtros['id_medico']);
        }

        if (!$medico) {
            $medico = Medico::with(['especialidades', 'usuario'])->where('estado_activo', true)->first();
        }

        if (!$medico) {
            return [
                'titulo' => 'Reporte 7: Agenda Médica Diaria',
                'descripcion' => 'No se encontraron médicos activos registrados.',
                'metricas' => ['total_turnos' => 0],
                'registros' => [],
            ];
        }

        $citas = Cita::query()
            ->with(['paciente', 'especialidad', 'tipoCita'])
            ->where('id_medico', $medico->id_medico)
            ->whereBetween('fecha_hora_inicio', [$inicioDia, $finDia])
            ->orderBy('fecha_hora_inicio', 'asc')
            ->get();

        // Franja horaria configurada en disponibilidades para el día
        $diaSemana = $fecha->dayOfWeekIso; // 1 = Lunes, 7 = Domingo
        $disponibilidad = Disponibilidad::where('id_medico', $medico->id_medico)
            ->where('dia_semana', $diaSemana)
            ->where('activo', true)
            ->first();

        $franjaHoraria = $disponibilidad
            ? substr($disponibilidad->hora_inicio, 0, 5) . ' - ' . substr($disponibilidad->hora_fin, 0, 5)
            : 'Sin turno fijo programado';

        $totalCitas = $citas->count();
        $atendidas = $citas->where('estado', 'ATENDIDA')->count();
        $pendientes = $citas->whereIn('estado', ['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'])->count();
        $canceladas = $citas->where('estado', 'CANCELADA')->count();
        $inasistencias = $citas->whereIn('estado', ['INASISTENCIA', 'NO_ASISTIO'])->count();

        return [
            'titulo' => 'Reporte 7: Agenda Médica Diaria por Profesional',
            'descripcion' => "Cronograma de atención para el Dr.(a) {$medico->nombre_completo} para el día {$fecha->format('d/m/Y')}",
            'medico' => [
                'id_medico' => $medico->id_medico,
                'nombre_completo' => $medico->nombre_completo,
                'matricula' => $medico->codigo_profesional ?? 'S/M',
                'especialidad' => $medico->especialidad_principal?->nombre ?? 'Medicina General',
                'fecha_agenda' => $fecha->format('Y-m-d'),
                'franja_horaria' => $franjaHoraria,
            ],
            'metricas' => [
                'total_citas_dia' => $totalCitas,
                'atendidas' => $atendidas,
                'pendientes' => $pendientes,
                'canceladas' => $canceladas,
                'inasistencias' => $inasistencias,
                'tasa_ocupacion' => $totalCitas > 0 ? round(($atendidas / $totalCitas) * 100, 1) : 0,
            ],
            'registros' => $this->formatearColeccionCitas($citas),
        ];
    }

    /**
     * Exportación Streamed CSV con codificación UTF-8 y BOM
     */
    public function exportCsv(string $tipo, array $filtros, ?User $user, string $role): StreamedResponse
    {
        $reporte = $this->generateReport($tipo, $filtros, $user, $role);
        $registros = $reporte['registros'] ?? [];
        $titulo = preg_replace('/[^a-zA-Z0-9_-]/', '_', strtolower($tipo));
        $fecha = Carbon::now('America/La_Paz')->format('Ymd_His');
        $fileName = "reporte_{$titulo}_{$fecha}.csv";

        return response()->streamDownload(function () use ($reporte, $registros) {
            $handle = fopen('php://output', 'w');
            // Escribir BOM para compatibilidad con Excel
            fwrite($handle, "\xEF\xBB\xBF");

            // Metadatos iniciales
            fputcsv($handle, [$reporte['titulo'] ?? 'Reporte Clínico']);
            fputcsv($handle, ['Generado en:', $reporte['generado_en'] ?? date('Y-m-d H:i:s')]);
            fputcsv($handle, ['Generado por:', $reporte['generado_por'] ?? 'Sistema']);
            fputcsv($handle, []);

            if (empty($registros)) {
                fputcsv($handle, ['No hay registros que coincidan con los filtros seleccionados.']);
                fclose($handle);
                return;
            }

            // Encabezados según el tipo de datos
            $primero = $registros[0];
            $encabezados = array_keys($primero);
            fputcsv($handle, array_map(fn ($k) => ucwords(str_replace('_', ' ', $k)), $encabezados));

            // Filas
            foreach ($registros as $fila) {
                $filaLimpia = [];
                foreach ($encabezados as $col) {
                    $val = $fila[$col] ?? '';
                    if (is_bool($val)) {
                        $val = $val ? 'SÍ' : 'NO';
                    } elseif (is_array($val)) {
                        $val = implode(', ', $val);
                    }
                    $filaLimpia[] = $val;
                }
                fputcsv($handle, $filaLimpia);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Helper: Construye query base de citas con relaciones y filtros
     */
    protected function crearQueryCitasBase(Carbon $desde, Carbon $hasta, array $filtros)
    {
        $query = Cita::query()
            ->with([
                'paciente',
                'medico.usuario',
                'medico.especialidades',
                'especialidad',
                'tipoCita',
            ])
            ->whereBetween('fecha_hora_inicio', [$desde, $hasta]);

        if (!empty($filtros['id_medico']) && $filtros['id_medico'] !== 'TODOS') {
            $query->where('id_medico', $filtros['id_medico']);
        }

        if (!empty($filtros['id_especialidad']) && $filtros['id_especialidad'] !== 'TODOS') {
            $query->where('id_especialidad', $filtros['id_especialidad']);
        }

        if (!empty($filtros['estado']) && $filtros['estado'] !== 'TODOS') {
            $query->where('estado', $filtros['estado']);
        }

        return $query;
    }

    /**
     * Helper: Resuelve Carbon desde/hasta a partir de atajos o inputs
     */
    protected function resolverRangoFechas(array $filtros): array
    {
        $ahora = Carbon::now('America/La_Paz');
        $hoy = $ahora->copy()->startOfDay();

        if (!empty($filtros['desde']) && !empty($filtros['hasta'])) {
            return [
                'inicio' => Carbon::parse($filtros['desde'], 'America/La_Paz')->startOfDay(),
                'fin' => Carbon::parse($filtros['hasta'], 'America/La_Paz')->endOfDay(),
            ];
        }

        $periodo = $filtros['periodo'] ?? 'mes';

        return match ($periodo) {
            'hoy' => ['inicio' => $hoy->copy(), 'fin' => $ahora->copy()->endOfDay()],
            '7d' => ['inicio' => $hoy->copy()->subDays(6), 'fin' => $ahora->copy()->endOfDay()],
            '30d' => ['inicio' => $hoy->copy()->subDays(29), 'fin' => $ahora->copy()->endOfDay()],
            'anio' => ['inicio' => $hoy->copy()->startOfYear(), 'fin' => $hoy->copy()->endOfYear()],
            'mes' => ['inicio' => $hoy->copy()->startOfMonth(), 'fin' => $hoy->copy()->endOfMonth()],
            default => ['inicio' => $hoy->copy()->startOfMonth(), 'fin' => $hoy->copy()->endOfMonth()],
        };
    }

    /**
     * Helper: Mapea la colección Eloquent a un array limpio para el frontend
     */
    protected function formatearColeccionCitas($citas): array
    {
        return $citas->map(function ($c) {
            $inicio = Carbon::parse($c->fecha_hora_inicio);
            $fin = $c->fecha_hora_fin ? Carbon::parse($c->fecha_hora_fin) : null;

            return [
                'id_cita' => $c->id_cita,
                'codigo_cita' => $c->codigo_cita,
                'fecha' => $inicio->format('d/m/Y'),
                'fecha_iso' => $inicio->format('Y-m-d'),
                'hora_inicio' => $inicio->format('H:i'),
                'hora_fin' => $fin ? $fin->format('H:i') : 'N/A',
                'estado' => $c->estado,
                'paciente' => $c->paciente?->nombre_completo ?? 'Paciente no asignado',
                'numero_documento' => $c->paciente?->numero_documento ?? 'S/D',
                'historia_clinica' => $c->paciente?->numero_historia ?? 'HC-' . str_pad($c->id_paciente ?? 0, 4, '0', STR_PAD_LEFT),
                'medico' => $c->medico?->nombre_completo ?? 'Médico no asignado',
                'matricula' => $c->medico?->codigo_profesional ?? 'S/M',
                'especialidad' => $c->especialidad?->nombre ?? 'Medicina General',
                'motivo_consulta' => $c->motivo_consulta ?? $c->motivo_breve ?? 'Sin especificar',
                'motivo_cancelacion' => $c->motivo_cancelacion,
                'pagada' => (bool) $c->pagada,
                'monto_pago' => (float) ($c->monto_pago ?? $c->especialidad?->precio_consulta ?? 70.00),
            ];
        })->values()->all();
    }
}

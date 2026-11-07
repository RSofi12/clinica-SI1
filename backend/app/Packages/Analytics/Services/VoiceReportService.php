<?php

namespace App\Packages\Analytics\Services;

use Illuminate\Support\Facades\DB;
use App\Packages\Analytics\Models\ReporteIa;
use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;

class VoiceReportService
{
    public function __construct(
        protected VoiceCommandParserService $parser
    ) {}

    /**
     * Procesa el comando dictado, aplica filtros RBAC, ejecuta la consulta y persiste el reporte
     */
    public function generateReport(string $comandoTexto, ?User $usuario, array $contexto = []): array
    {
        // 1. Interpretar lenguaje natural a filtros estructurados
        $parsed = $this->parser->parse($comandoTexto, $contexto);
        $filtros = $parsed['filtros'];

        // 2. Control de Acceso y RBAC (RN12): Scoping para rol MÉDICO
        if ($usuario && $usuario->tipo_usuario === 'MEDICO') {
            $medico = Medico::where('id_usuario', $usuario->id_usuario)->first();
            if ($medico) {
                $filtros['id_medico'] = $medico->id_medico;
                $filtros['medico_nombre'] = 'Dr(a). ' . $medico->nombres . ' ' . $medico->apellidos;
                $parsed['filtros'] = $filtros;
            }
        }

        // 3. Ejecutar consulta en base de datos PostgreSQL
        if ($parsed['tipo_reporte'] === 'PACIENTES_REGISTRADOS') {
            $datosConsulta = $this->consultarPacientes($filtros);
        } else {
            $datosConsulta = $this->consultarCitas($filtros);
        }

        // 4. Persistir registro en reportes_ia y auditar en Bitácora (CU03)
        $idUsuario = $usuario ? $usuario->id_usuario : 1;
        $reporteGuardado = DB::transaction(function () use ($idUsuario, $comandoTexto, $parsed) {
            $reporte = ReporteIa::create([
                'id_usuario'       => $idUsuario,
                'comando_texto'    => $comandoTexto,
                'filtros_json'     => $parsed['filtros'],
                'tipo_reporte'     => $parsed['tipo_reporte'],
                'fecha_generacion' => now(),
            ]);

            Bitacora::registrar(
                $idUsuario,
                'Analitica',
                'GENERAR_REPORTE_VOZ',
                'reportes_ia',
                $reporte->id_reporte,
                "Reporte por voz generado: '{$comandoTexto}' (Tipo: {$parsed['tipo_reporte']})"
            );

            return $reporte;
        });

        return [
            'reporte_id'             => $reporteGuardado->id_reporte,
            'comando_texto'          => $comandoTexto,
            'tipo_reporte'           => $parsed['tipo_reporte'],
            'filtros_detectados'     => $filtros,
            'interpretacion_legible' => $parsed['interpretacion_legible'],
            'motor'                  => $parsed['motor'] ?? 'DETERMINISTIC_NLP',
            'confianza'              => $parsed['confianza'] ?? 1.0,
            'metricas'               => $datosConsulta['metricas'],
            'total_registros'        => count($datosConsulta['registros']),
            'registros'              => $datosConsulta['registros'],
            'fecha_generacion'       => now()->toIso8601String(),
        ];
    }

    /**
     * Construye y ejecuta las consultas analíticas sobre Citas
     */
    protected function consultarCitas(array $filtros): array
    {
        $query = Cita::with(['paciente', 'medico', 'especialidad']);

        if (!empty($filtros['id_especialidad'])) {
            $query->where('id_especialidad', $filtros['id_especialidad']);
        }

        if (!empty($filtros['id_medico'])) {
            $query->where('id_medico', $filtros['id_medico']);
        }

        if (!empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
        }

        if (!empty($filtros['fecha_inicio'])) {
            $query->whereDate('fecha_hora_inicio', '>=', $filtros['fecha_inicio']);
        }

        if (!empty($filtros['fecha_fin'])) {
            $query->whereDate('fecha_hora_inicio', '<=', $filtros['fecha_fin']);
        }

        // Métricas de agregación
        $total = (clone $query)->count();
        $atendidas = (clone $query)->where('estado', 'ATENDIDA')->count();
        $canceladas = (clone $query)->where('estado', 'CANCELADA')->count();
        $programadas = (clone $query)->where('estado', 'PROGRAMADA')->count();
        $confirmadas = (clone $query)->where('estado', 'CONFIRMADA')->count();
        $inasistencias = (clone $query)->where('estado', 'INASISTENCIA')->count();

        $denominador = $atendidas + $canceladas + $inasistencias;
        $tasaAsistencia = $denominador > 0 ? round(($atendidas / $denominador) * 100, 1) : 0;

        // Extraer primeros 100 registros formateados para visualización
        $registros = $query->orderBy('fecha_hora_inicio', 'desc')
            ->limit(100)
            ->get()
            ->map(function (Cita $cita) {
                return [
                    'id_cita'           => $cita->id_cita,
                    'codigo_cita'       => $cita->codigo_cita,
                    'fecha_hora_inicio' => $cita->fecha_hora_inicio?->toIso8601String(),
                    'fecha_hora_fin'    => $cita->fecha_hora_fin?->toIso8601String(),
                    'fecha_formateada'  => $cita->fecha_hora_inicio?->format('d/m/Y'),
                    'hora_formateada'   => $cita->fecha_hora_inicio?->format('H:i'),
                    'estado'            => $cita->estado,
                    'modalidad'         => $cita->modalidad,
                    'motivo_consulta'   => $cita->motivo_consulta ?? $cita->motivo_breve,
                    'motivo_cancelacion'=> $cita->motivo_cancelacion,
                    'paciente'          => [
                        'id_paciente'      => $cita->paciente?->id_paciente,
                        'nombre_completo'  => $cita->paciente ? ($cita->paciente->nombres . ' ' . $cita->paciente->apellidos) : 'N/A',
                        'numero_documento' => $cita->paciente?->numero_documento,
                        'telefono'         => $cita->paciente?->telefono,
                    ],
                    'medico'            => [
                        'id_medico'        => $cita->medico?->id_medico,
                        'nombre_completo'  => $cita->medico ? ($cita->medico->nombres . ' ' . $cita->medico->apellidos) : 'N/A',
                        'codigo'           => $cita->medico?->codigo_profesional,
                    ],
                    'especialidad'      => [
                        'id_especialidad'  => $cita->especialidad?->id_especialidad,
                        'nombre'           => $cita->especialidad?->nombre ?? 'N/A',
                    ],
                ];
            });

        return [
            'metricas' => [
                'total_citas'     => $total,
                'atendidas'       => $atendidas,
                'canceladas'      => $canceladas,
                'programadas'     => $programadas,
                'confirmadas'     => $confirmadas,
                'inasistencias'   => $inasistencias,
                'tasa_asistencia' => $tasaAsistencia,
            ],
            'registros' => $registros,
        ];
    }

    /**
     * Construye y ejecuta consultas de pacientes
     */
    protected function consultarPacientes(array $filtros): array
    {
        $query = Paciente::query();

        if (!empty($filtros['fecha_inicio'])) {
            $query->whereDate('fecha_registro', '>=', $filtros['fecha_inicio']);
        }
        if (!empty($filtros['fecha_fin'])) {
            $query->whereDate('fecha_registro', '<=', $filtros['fecha_fin']);
        }

        $total = (clone $query)->count();
        $activos = (clone $query)->where('estado_paciente', 'ACTIVO')->count();
        $inactivos = (clone $query)->where('estado_paciente', 'INACTIVO')->count();

        $registros = $query->orderBy('fecha_registro', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($pac) {
                return [
                    'id_paciente'      => $pac->id_paciente,
                    'nombre_completo'  => $pac->nombres . ' ' . $pac->apellidos,
                    'numero_documento' => $pac->numero_documento,
                    'telefono'         => $pac->telefono,
                    'correo'           => $pac->correo,
                    'estado_paciente'  => $pac->estado_paciente,
                    'fecha_registro'   => $pac->fecha_registro?->format('d/m/Y'),
                ];
            });

        return [
            'metricas' => [
                'total_pacientes' => $total,
                'activos'         => $activos,
                'inactivos'       => $inactivos,
            ],
            'registros' => $registros,
        ];
    }

    /**
     * Obtiene el historial reciente de reportes por voz del usuario
     */
    public function getHistory(int $idUsuario, int $limit = 15)
    {
        return ReporteIa::where('id_usuario', $idUsuario)
            ->orderBy('fecha_generacion', 'desc')
            ->limit($limit)
            ->get();
    }
}

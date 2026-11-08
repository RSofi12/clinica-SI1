<?php

namespace App\Packages\MedicalRecords\Services;

use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\MedicalRecords\Models\ConsultaMedica;
use App\Packages\MedicalRecords\Models\HistoriaClinica;
use App\Packages\MedicalRecords\Models\OrdenExamen;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * Servicio de Negocio para Órdenes de Exámenes Auxiliares (CU25)
 * Paquete 4: Historial Clínico y Consultas
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class OrdenExamenService
{
    /**
     * Generador automático atómico del código correlativo único: ORD-0001, ORD-0002...
     */
    public static function generarCodigoOrden(): string
    {
        $ultimo = OrdenExamen::query()
            ->where('codigo_orden', 'LIKE', 'ORD-%')
            ->orderByRaw("CAST(SUBSTRING(codigo_orden FROM 5) AS INTEGER) DESC")
            ->value('codigo_orden');

        if (!$ultimo) {
            return 'ORD-0001';
        }

        $correlativo = (int) substr($ultimo, 4);
        $siguiente = $correlativo + 1;

        return sprintf('ORD-%04d', $siguiente);
    }

    /**
     * Lista órdenes de exámenes auxiliares con filtros dinámicos, métricas y control Anti-IDOR
     */
    public function listarOrdenes(array $filtros, User $usuario): array
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        $query = OrdenExamen::with([
            'consulta:id_consulta,id_cita,motivo_consulta,fecha_consulta',
            'historiaClinica.paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,sexo,fecha_nacimiento',
            'medico:id_medico,nombres,apellidos,codigo_profesional',
            'documentosAdjuntos:id_documento,id_orden,titulo,tipo_documento,ruta_archivo,mime_type,tamanio_bytes,fecha_subida',
        ])->latest('fecha_emision');

        // 1. Scoping por Rol (Anti-IDOR)
        if ($rol === 'MEDICO') {
            $medico = $usuario->medico;
            if ($medico) {
                // El médico puede ver las que él emitió o las de un paciente específico si se pasa id_historia_clinica
                if (!empty($filtros['id_historia_clinica'])) {
                    $query->where('id_historia_clinica', (int) $filtros['id_historia_clinica']);
                } else {
                    $query->where('id_medico', $medico->id_medico);
                }
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if ($paciente && $paciente->historiaClinica) {
                $query->where('id_historia_clinica', $paciente->historiaClinica->id_historia_clinica);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // 2. Filtros de búsqueda
        if (!empty($filtros['id_historia_clinica'])) {
            $query->where('id_historia_clinica', (int) $filtros['id_historia_clinica']);
        }

        if (!empty($filtros['id_consulta'])) {
            $query->where('id_consulta', (int) $filtros['id_consulta']);
        }

        if (!empty($filtros['tipo_estudio']) && in_array(strtoupper($filtros['tipo_estudio']), OrdenExamen::TIPOS_VALIDOS, true)) {
            $query->where('tipo_estudio', strtoupper($filtros['tipo_estudio']));
        }

        if (!empty($filtros['estado']) && in_array(strtoupper($filtros['estado']), OrdenExamen::ESTADOS_VALIDOS, true)) {
            $query->where('estado', strtoupper($filtros['estado']));
        }

        if (!empty($filtros['buscar'])) {
            $buscar = trim($filtros['buscar']);
            $query->where(function ($q) use ($buscar) {
                $q->where('codigo_orden', 'ilike', "%{$buscar}%")
                  ->orWhere('nombre_estudio', 'ilike', "%{$buscar}%")
                  ->orWhere('diagnostico_presuntivo', 'ilike', "%{$buscar}%")
                  ->orWhereHas('historiaClinica.paciente', function ($qp) use ($buscar) {
                      $qp->where('nombres', 'ilike', "%{$buscar}%")
                         ->orWhere('apellidos', 'ilike', "%{$buscar}%")
                         ->orWhere('numero_documento', 'ilike', "%{$buscar}%")
                         ->orWhere('numero_historia', 'ilike', "%{$buscar}%");
                  });
            });
        }

        if (!empty($filtros['fecha_desde'])) {
            $query->whereDate('fecha_emision', '>=', $filtros['fecha_desde']);
        }
        if (!empty($filtros['fecha_hasta'])) {
            $query->whereDate('fecha_emision', '<=', $filtros['fecha_hasta']);
        }

        // 3. Métricas acumuladas del conjunto filtrado
        $cloned = clone $query;
        $metricas = [
            'total'          => (clone $cloned)->count(),
            'pendientes'     => (clone $cloned)->where('estado', OrdenExamen::ESTADO_PENDIENTE)->count(),
            'con_resultados' => (clone $cloned)->where('estado', OrdenExamen::ESTADO_CON_RESULTADOS)->count(),
            'canceladas'     => (clone $cloned)->where('estado', OrdenExamen::ESTADO_CANCELADA)->count(),
        ];

        // 4. Paginación
        $perPage = !empty($filtros['per_page']) ? (int) $filtros['per_page'] : 15;
        $paginador = $query->paginate($perPage);

        return [
            'paginador' => $paginador,
            'metricas'  => $metricas,
        ];
    }

    /**
     * Consulta el detalle de una orden de examen auxiliar con verificación de privacidad
     */
    public function obtenerPorId(int $idOrden, User $usuario): OrdenExamen
    {
        $orden = OrdenExamen::with([
            'consulta:id_consulta,id_cita,motivo_consulta,fecha_consulta',
            'consulta.cita:id_cita,codigo_cita,modalidad,estado',
            'historiaClinica.paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,sexo,fecha_nacimiento,telefono,email',
            'medico:id_medico,nombres,apellidos,codigo_profesional',
            'medico.especialidades:id_especialidad,nombre',
            'documentosAdjuntos',
        ])->find($idOrden);

        if (!$orden) {
            throw new Exception("La orden de examen auxiliar #{$idOrden} no existe.", 404);
        }

        // Validación Anti-IDOR
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if (!$paciente || !$paciente->historiaClinica || $paciente->historiaClinica->id_historia_clinica !== $orden->id_historia_clinica) {
                throw new Exception("No tiene autorización para consultar esta orden médica.", 403);
            }
        } elseif ($rol === 'MEDICO') {
            $medico = $usuario->medico;
            // Médico puede consultar las de sus consultas o si tiene acceso a la ficha
            if (!$medico) {
                throw new Exception("Perfil médico no vinculado a la cuenta.", 403);
            }
        }

        return $orden;
    }

    /**
     * Obtiene las órdenes vinculadas a una consulta médica
     */
    public function obtenerPorConsulta(int $idConsulta, User $usuario): array
    {
        $consulta = ConsultaMedica::with('cita')->find($idConsulta);
        if (!$consulta) {
            throw new Exception("La consulta médica #{$idConsulta} no existe.", 404);
        }

        // Anti-IDOR
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if (!$paciente || $paciente->id_paciente !== $consulta->cita->id_paciente) {
                throw new Exception("No tiene autorización para acceder a las órdenes de esta consulta.", 403);
            }
        }

        return OrdenExamen::with([
            'documentosAdjuntos',
            'medico:id_medico,nombres,apellidos,codigo_profesional',
        ])
        ->where('id_consulta', $idConsulta)
        ->latest('fecha_emision')
        ->get()
        ->toArray();
    }

    /**
     * Emite una nueva orden de examen auxiliar dentro de una transacción atómica (CU25)
     */
    public function emitirOrden(array $datos, User $usuario): OrdenExamen
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        return DB::transaction(function () use ($datos, $usuario, $rol) {
            $consulta = ConsultaMedica::with(['historiaClinica', 'medico'])->find($datos['id_consulta']);
            if (!$consulta) {
                throw new Exception("La consulta médica indicada no existe.", 404);
            }

            // Validación Anti-IDOR médica: El médico emisor debe ser el médico de la consulta o ADMIN
            $idMedico = $consulta->id_medico;
            if ($rol === 'MEDICO') {
                $medicoAutenticado = $usuario->medico;
                if (!$medicoAutenticado) {
                    throw new Exception("No se encontró el registro médico del facultativo autenticado.", 403);
                }
                if ($medicoAutenticado->id_medico !== $consulta->id_medico) {
                    throw new Exception("No puede emitir órdenes de exámenes para una consulta médica que no atendió.", 403);
                }
                $idMedico = $medicoAutenticado->id_medico;
            }

            // Generar código correlativo atómico ORD-XXXX
            $codigoOrden = self::generarCodigoOrden();

            $orden = OrdenExamen::create([
                'codigo_orden'             => $codigoOrden,
                'id_consulta'              => $consulta->id_consulta,
                'id_historia_clinica'      => $consulta->id_historia_clinica,
                'id_medico'                => $idMedico,
                'tipo_estudio'             => strtoupper($datos['tipo_estudio']),
                'nombre_estudio'           => trim($datos['nombre_estudio']),
                'indicaciones_preparacion' => !empty($datos['indicaciones_preparacion']) ? trim($datos['indicaciones_preparacion']) : null,
                'diagnostico_presuntivo'   => !empty($datos['diagnostico_presuntivo']) ? trim($datos['diagnostico_presuntivo']) : null,
                'estado'                   => OrdenExamen::ESTADO_PENDIENTE,
                'fecha_emision'            => now(),
            ]);

            // Auditoría inmutable en Bitacora.php (CU03)
            Bitacora::registrar(
                $usuario->id_usuario ?? $usuario->id,
                'EMITIR_ORDEN_EXAMEN',
                'HISTORIAL_CLINICO',
                "Emitida orden de examen auxiliar {$orden->codigo_orden} ({$orden->nombre_estudio} - {$orden->tipo_estudio}) para historia clínica #{$consulta->id_historia_clinica} en consulta #{$consulta->id_consulta}."
            );

            return $orden->load([
                'consulta:id_consulta,id_cita,motivo_consulta,fecha_consulta',
                'historiaClinica.paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia',
                'medico:id_medico,nombres,apellidos,codigo_profesional',
                'documentosAdjuntos',
            ]);
        });
    }

    /**
     * Anula lógicamente una orden de examen auxiliar (RN11)
     */
    public function anularOrden(int $idOrden, string $motivo, User $usuario): OrdenExamen
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        return DB::transaction(function () use ($idOrden, $motivo, $usuario, $rol) {
            $orden = OrdenExamen::with(['medico', 'historiaClinica'])->find($idOrden);
            if (!$orden) {
                throw new Exception("La orden médica #{$idOrden} no existe.", 404);
            }

            // Anti-IDOR médico: Solo el médico que la emitió o un ADMIN pueden anular
            if ($rol === 'MEDICO') {
                $medico = $usuario->medico;
                if (!$medico || $medico->id_medico !== $orden->id_medico) {
                    throw new Exception("Solo el médico emisor de la orden médica puede cancelarla.", 403);
                }
            }

            if (!$orden->puedeCancelarse()) {
                throw new Exception("No es posible cancelar la orden {$orden->codigo_orden} porque se encuentra en estado '{$orden->estado}'. Solo se pueden cancelar órdenes en estado PENDIENTE.", 422);
            }

            $orden->cancelar($motivo);

            // Auditoría inmutable en Bitacora (CU03)
            Bitacora::registrar(
                $usuario->id_usuario ?? $usuario->id,
                'ANULAR_ORDEN_EXAMEN',
                'HISTORIAL_CLINICO',
                "Cancelada orden de examen {$orden->codigo_orden} ({$orden->nombre_estudio}). Motivo: {$motivo}"
            );

            return $orden->fresh(['consulta', 'historiaClinica.paciente', 'medico', 'documentosAdjuntos']);
        });
    }
}


<?php

namespace App\Packages\MedicalRecords\Services;

use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\MedicalRecords\Models\ConsultaMedica;
use App\Packages\MedicalRecords\Models\HistoriaClinica;
use App\Packages\MedicalRecords\Models\Receta;
use App\Packages\MedicalRecords\Models\RecetaDetalle;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Servicio de Prescripción Médica y Recetas (CU18)
 * Paquete 4: Historial Clínico y Consultas
 */
class RecetaService
{
    /**
     * Lista recetas médicas con filtros dinámicos, métricas y control RBAC / Anti-IDOR
     */
    public function listarRecetas(array $filtros, User $usuario): array
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        $query = Receta::with([
            'detalles',
            'consulta:id_consulta,id_cita,motivo_consulta,fecha_consulta,plan_tratamiento',
            'consulta.cita:id_cita,codigo_cita,modalidad,estado',
            'historiaClinica.paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,sexo,fecha_nacimiento',
            'medico:id_medico,nombres,apellidos,codigo_profesional',
            'medico.especialidades:id_especialidad,nombre',
        ])->latest('fecha_emision');

        // 1. Scoping por Rol (Anti-IDOR)
        if ($rol === 'MEDICO') {
            $medico = $usuario->medico;
            if ($medico) {
                $query->where('id_medico', $medico->id_medico);
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
        if (!empty($filtros['estado']) && in_array(strtoupper($filtros['estado']), [Receta::ESTADO_ACTIVO, Receta::ESTADO_ANULADO], true)) {
            $query->where('estado', strtoupper($filtros['estado']));
        }

        if (!empty($filtros['fecha'])) {
            $query->whereDate('fecha_emision', $filtros['fecha']);
        }

        if (!empty($filtros['id_consulta'])) {
            $query->where('id_consulta', (int) $filtros['id_consulta']);
        }

        if (!empty($filtros['id_paciente']) && $rol !== 'PACIENTE') {
            $query->whereHas('historiaClinica', function ($q) use ($filtros) {
                $q->where('id_paciente', (int) $filtros['id_paciente']);
            });
        }

        if (!empty($filtros['buscar'])) {
            $buscar = trim($filtros['buscar']);
            $query->where(function ($q) use ($buscar) {
                $q->whereHas('historiaClinica.paciente', function ($qp) use ($buscar) {
                    $qp->where('nombres', 'ilike', "%{$buscar}%")
                       ->orWhere('apellidos', 'ilike', "%{$buscar}%")
                       ->orWhere('numero_documento', 'ilike', "%{$buscar}%")
                       ->orWhere('numero_historia', 'ilike', "%{$buscar}%");
                })->orWhereHas('medico', function ($qm) use ($buscar) {
                    $qm->where('nombres', 'ilike', "%{$buscar}%")
                       ->orWhere('apellidos', 'ilike', "%{$buscar}%")
                       ->orWhere('codigo_profesional', 'ilike', "%{$buscar}%");
                })->orWhereHas('detalles', function ($qd) use ($buscar) {
                    $qd->where('medicamento', 'ilike', "%{$buscar}%");
                });
            });
        }

        // 3. Métricas rápidas (KPIs)
        $metricasQuery = clone $query;
        $total = $metricasQuery->count();
        $activas = (clone $query)->where('estado', Receta::ESTADO_ACTIVO)->count();
        $anuladas = (clone $query)->where('estado', Receta::ESTADO_ANULADO)->count();

        // 4. Paginación
        $perPage = isset($filtros['per_page']) ? (int) $filtros['per_page'] : 15;
        $paginador = $query->paginate($perPage);

        return [
            'paginador' => $paginador,
            'metricas'  => [
                'total'    => $total,
                'activas'  => $activas,
                'anuladas' => $anuladas,
            ],
        ];
    }

    /**
     * Obtiene el detalle completo de una receta médica con verificación de privacidad
     */
    public function obtenerReceta(int $idReceta, User $usuario): Receta
    {
        $receta = Receta::with([
            'detalles',
            'consulta.cita',
            'consulta.diagnosticos',
            'historiaClinica.paciente',
            'medico.especialidades',
            'medico.usuario:id_usuario,email',
        ])->find($idReceta);

        if (!$receta) {
            throw new \Exception('La receta médica solicitada no existe.', 404);
        }

        $this->validarAccesoLectura($receta, $usuario);

        return $receta;
    }

    /**
     * Lista las recetas emitidas para una consulta médica específica
     */
    public function listarPorConsulta(int $idConsulta, User $usuario): array
    {
        $consulta = ConsultaMedica::with(['cita', 'historiaClinica.paciente'])->find($idConsulta);
        if (!$consulta) {
            throw new \Exception('Consulta médica no encontrada.', 404);
        }

        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            if (!$paciente || (int) $consulta->historiaClinica->id_paciente !== (int) $paciente->id_paciente) {
                throw new \Exception('Acceso denegado: no puede consultar recetas de otros pacientes.', 403);
            }
        }

        $recetas = Receta::where('id_consulta', $idConsulta)
            ->with(['detalles', 'medico.especialidades'])
            ->orderBy('fecha_emision', 'desc')
            ->get();

        return [
            'consulta' => [
                'id_consulta'      => $consulta->id_consulta,
                'fecha_consulta'   => $consulta->fecha_consulta,
                'motivo_consulta'  => $consulta->motivo_consulta,
                'plan_tratamiento' => $consulta->plan_tratamiento,
            ],
            'paciente' => $consulta->historiaClinica->paciente,
            'recetas'  => $recetas,
        ];
    }

    /**
     * Emite una receta médica estructurada dentro de una transacción atómica (RF08 / RN11)
     */
    public function emitirReceta(array $datos, User $usuario, ?string $ip = null): Receta
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if (!in_array($rol, ['ADMIN', 'MEDICO'], true)) {
            throw new \Exception('Acceso denegado: solo el personal médico autorizado puede prescribir recetas.', 403);
        }

        $consulta = ConsultaMedica::with(['cita', 'historiaClinica.paciente', 'medico'])->find($datos['id_consulta']);
        if (!$consulta) {
            throw new \Exception('La consulta médica seleccionada no existe.', 404);
        }

        // Control Anti-IDOR para Médicos: el médico debe ser el facultativo responsable de la atención
        if ($rol === 'MEDICO') {
            $medicoAutenticado = $usuario->medico;
            if (!$medicoAutenticado || (int) $consulta->id_medico !== (int) $medicoAutenticado->id_medico) {
                throw new \Exception('No está autorizado para emitir recetas en esta consulta médica (no es el médico tratante asignado).', 403);
            }
        }

        if (empty($datos['detalles']) || !is_array($datos['detalles'])) {
            throw new \Exception('Debe ingresar al menos un medicamento en la prescripción médica.', 422);
        }

        return DB::transaction(function () use ($datos, $consulta, $usuario, $ip) {
            // 1. Crear cabecera de Receta
            $receta = Receta::create([
                'id_historia_clinica'   => $consulta->id_historia_clinica,
                'id_consulta'           => $consulta->id_consulta,
                'id_medico'             => $consulta->id_medico,
                'fecha_emision'         => now(),
                'indicaciones_generales'=> $datos['indicaciones_generales'] ?? null,
                'estado'                => Receta::ESTADO_ACTIVO,
            ]);

            // 2. Insertar renglones de medicación (receta_detalles)
            foreach ($datos['detalles'] as $detalle) {
                RecetaDetalle::create([
                    'id_receta'    => $receta->id_receta,
                    'medicamento'  => trim($detalle['medicamento']),
                    'dosis'        => trim($detalle['dosis']),
                    'frecuencia'   => trim($detalle['frecuencia']),
                    'duracion'     => trim($detalle['duracion']),
                    'indicaciones' => !empty($detalle['indicaciones']) ? trim($detalle['indicaciones']) : null,
                ]);
            }

            // 3. Auditoría inmutable en Bitacora (CU03)
            $paciente = $consulta->historiaClinica->paciente;
            $nombrePaciente = $paciente ? "{$paciente->nombres} {$paciente->apellidos}" : "HC #{$consulta->id_historia_clinica}";
            $cantFarmacos = count($datos['detalles']);

            Bitacora::registrar([
                'id_usuario'     => $usuario->id_usuario,
                'modulo'         => 'HISTORIAL_CLINICO',
                'accion'         => 'EMITIR_RECETA',
                'tabla_afectada' => 'recetas',
                'id_registro'    => $receta->id_receta,
                'descripcion'    => "Emisión de receta médica #{$receta->id_receta} ({$cantFarmacos} fármacos) para paciente {$nombrePaciente} en consulta #{$consulta->id_consulta}.",
                'ip_origen'      => $ip,
            ]);

            return $receta->load([
                'detalles',
                'consulta:id_consulta,id_cita,motivo_consulta,fecha_consulta',
                'historiaClinica.paciente',
                'medico:id_medico,nombres,apellidos,codigo_profesional',
                'medico.especialidades:id_especialidad,nombre',
            ]);
        });
    }

    /**
     * Anula lógicamente una receta médica justificando el motivo (RN11 - Baja Lógica)
     */
    public function anularReceta(int $idReceta, string $motivo, User $usuario, ?string $ip = null): Receta
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if (!in_array($rol, ['ADMIN', 'MEDICO'], true)) {
            throw new \Exception('No tiene permisos para anular recetas médicas.', 403);
        }

        $receta = Receta::with(['consulta', 'historiaClinica.paciente', 'medico'])->find($idReceta);
        if (!$receta) {
            throw new \Exception('Receta médica no encontrada.', 404);
        }

        if ($receta->estado === Receta::ESTADO_ANULADO) {
            throw new \Exception('La receta médica ya se encuentra anulada.', 422);
        }

        // Control Anti-IDOR: solo el médico emisor o Admin pueden anular
        if ($rol === 'MEDICO') {
            $medicoAutenticado = $usuario->medico;
            if (!$medicoAutenticado || (int) $receta->id_medico !== (int) $medicoAutenticado->id_medico) {
                throw new \Exception('No está autorizado para anular recetas emitidas por otro profesional médico.', 403);
            }
        }

        $motivoLimpio = trim($motivo);
        if (mb_strlen($motivoLimpio) < 5) {
            throw new \Exception('El motivo de anulación debe tener al menos 5 caracteres.', 422);
        }

        return DB::transaction(function () use ($receta, $motivoLimpio, $usuario, $ip) {
            $receta->estado = Receta::ESTADO_ANULADO;

            // Si existen las columnas en BD, persistir motivo estructurado
            if (Schema::hasColumn('recetas', 'motivo_anulacion')) {
                $receta->motivo_anulacion = $motivoLimpio;
            }
            if (Schema::hasColumn('recetas', 'anulado_en')) {
                $receta->anulado_en = now();
            }

            // Preservar nota de anulación en indicaciones generales para resiliencia visual
            $notaAnulacion = "\n[ANULADA el " . now()->format('d/m/Y H:i') . " por {$usuario->username}. Motivo: {$motivoLimpio}]";
            $receta->indicaciones_generales = ($receta->indicaciones_generales ?? '') . $notaAnulacion;

            $receta->save();

            // Auditoría inmutable en Bitacora (CU03)
            Bitacora::registrar([
                'id_usuario'     => $usuario->id_usuario,
                'modulo'         => 'HISTORIAL_CLINICO',
                'accion'         => 'ANULAR_RECETA',
                'tabla_afectada' => 'recetas',
                'id_registro'    => $receta->id_receta,
                'descripcion'    => "Anulación de receta médica #{$receta->id_receta}. Motivo: {$motivoLimpio}",
                'ip_origen'      => $ip,
            ]);

            return $receta->load([
                'detalles',
                'consulta',
                'historiaClinica.paciente',
                'medico',
            ]);
        });
    }

    /**
     * Valida si el usuario en sesión tiene autorización para leer la receta
     */
    protected function validarAccesoLectura(Receta $receta, User $usuario): void
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        if ($rol === 'ADMIN' || $rol === 'RECEPCIONISTA') {
            return;
        }

        if ($rol === 'PACIENTE') {
            $paciente = $usuario->paciente;
            $idPacienteReceta = $receta->historiaClinica->id_paciente ?? null;

            $esTitular = $paciente && ((int) $paciente->id_paciente === (int) $idPacienteReceta);

            if (!$esTitular) {
                throw new \Exception('Acceso denegado: solo puede consultar sus propias recetas médicas.', 403);
            }
            return;
        }

        if ($rol === 'MEDICO') {
            $medico = $usuario->medico;
            // Un médico puede ver sus recetas emitidas o las del historial clínico institucional
            if ($medico) {
                return;
            }
        }

        throw new \Exception('No tiene permisos para consultar esta prescripción médica.', 403);
    }
}

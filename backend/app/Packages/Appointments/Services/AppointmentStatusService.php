<?php

namespace App\Packages\Appointments\Services;

use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Servicio Transaccional de Transición de Estados de Citas Médicas (CU13 / RF10)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentStatusService
{
    /**
     * Aplica una transición formal de estado a la cita médica bajo máquina de estados y transacción atómica.
     *
     * @param int $idCita Identificador de la cita médica
     * @param string $nuevoEstado Nuevo estado destino (CONFIRMADA, ATENDIDA, INASISTENCIA)
     * @param string|null $observacion Justificación u observación del cambio
     * @param User $usuarioAutenticado Usuario en sesión
     * @param string|null $ip Dirección IP de origen
     * @return Cita
     * @throws \Exception
     */
    public function cambiarEstado(
        int $idCita,
        string $nuevoEstado,
        ?string $observacion,
        User $usuarioAutenticado,
        ?string $ip = null
    ): Cita {
        return DB::transaction(function () use ($idCita, $nuevoEstado, $observacion, $usuarioAutenticado, $ip) {
            // 1. Obtener la cita bajo bloqueo pesimista
            $cita = Cita::lockForUpdate()->find($idCita);

            if (!$cita) {
                throw new \Exception('Cita médica no encontrada.', 404);
            }

            $tipoUsuario = $usuarioAutenticado->tipo_usuario ?? $usuarioAutenticado->rol;

            // 2. Control de Acceso Basado en Roles (RBAC / Scoping)
            if ($tipoUsuario === 'PACIENTE') {
                throw new \Exception('Acceso denegado: los pacientes no tienen autorización para modificar el estado de las citas médicas.', 403);
            }

            if ($tipoUsuario === 'MEDICO') {
                $medico = Medico::where('id_usuario', $usuarioAutenticado->id_usuario)->first();
                if (!$medico || (int)$medico->id_medico !== (int)$cita->id_medico) {
                    throw new \Exception('Acceso denegado: solo el médico titular asignado a esta cita puede actualizar su estado asistencial.', 403);
                }

                // Un médico solo transiciona a ATENDIDA o INASISTENCIA (la confirmación es recepción)
                if (!in_array($nuevoEstado, [Cita::ESTADO_ATENDIDA, Cita::ESTADO_INASISTENCIA], true)) {
                    throw new \Exception("Los médicos solo pueden transicionar citas hacia estado ATENDIDA o INASISTENCIA.", 422);
                }
            }

            // 3. Validación de Estado Terminal (RN10)
            if ($cita->esEstadoTerminal()) {
                throw new \Exception(
                    "Operación no permitida (RN10): La cita médica se encuentra en estado terminal '{$cita->estado}' y no admite modificaciones.",
                    422
                );
            }

            // 4. Validación de Máquina de Estados (RF10 / RN10)
            if (!$cita->puedeTransicionarA($nuevoEstado)) {
                $permitidas = implode(', ', $cita->obtenerTransicionesPermitidas());
                $permitidasTexto = !empty($permitidas) ? $permitidas : 'Ninguna';
                throw new \Exception(
                    "Transición no permitida (RN10): No se puede cambiar la cita de '{$cita->estado}' a '{$nuevoEstado}'. Transiciones válidas disponibles: [{$permitidasTexto}].",
                    422
                );
            }

            // 5. Validaciones de Coherencia Temporal
            if ($nuevoEstado === Cita::ESTADO_INASISTENCIA) {
                // No se puede marcar inasistencia para una cita que aún no ha llegado a su hora de inicio
                if ($cita->fecha_hora_inicio && $cita->fecha_hora_inicio->isFuture()) {
                    throw new \Exception(
                        "Validación temporal: No es posible registrar inasistencia para una cita programada a futuro ({$cita->fecha_hora_inicio->format('d/m/Y H:i')}).",
                        422
                    );
                }
            }

            if ($nuevoEstado === Cita::ESTADO_CONFIRMADA) {
                // Check-in en recepción debe ser para el día de la cita
                $fechaCita = $cita->fecha_hora_inicio?->toDateString();
                $hoy = Carbon::today()->toDateString();
                if ($fechaCita && $fechaCita < $hoy) {
                    throw new \Exception(
                        "Validación temporal: No se puede confirmar la asistencia de una cita correspondiente a una fecha pasada ({$cita->fecha_hora_inicio->format('d/m/Y')}).",
                        422
                    );
                }
            }

            // 6. Aplicar la transición de estado
            $estadoAnterior = $cita->estado;
            $cita->cambiarEstado($nuevoEstado, $usuarioAutenticado->id_usuario, $observacion);

            // 7. Auditoría inmutable en bitácora (CU03)
            Bitacora::registrar([
                'id_usuario'     => $usuarioAutenticado->id_usuario,
                'modulo'         => 'CITAS',
                'accion'         => 'CAMBIO_ESTADO',
                'tabla_afectada' => 'citas',
                'id_registro'    => $cita->id_cita,
                'descripcion'    => "Cambio de estado de cita {$cita->codigo_cita} de {$estadoAnterior} a {$nuevoEstado}." . ($observacion ? " Obs: {$observacion}" : ""),
                'ip_origen'      => $ip,
            ]);

            return $cita->fresh([
                'paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,telefono',
                'medico:id_medico,nombres,apellidos,codigo_profesional',
                'especialidad:id_especialidad,nombre,precio_consulta',
                'tipoCita:id_tipo_cita,nombre',
                'historialEstados.usuario:id_usuario,username,nombres,apellidos,rol',
            ]);
        });
    }
}

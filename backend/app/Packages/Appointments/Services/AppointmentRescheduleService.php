<?php

namespace App\Packages\Appointments\Services;

use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Disponibilidad;
use App\Packages\ClinicalResources\Models\BloqueoHorario;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\Security\Models\Bitacora;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Servicio Transaccional de Reprogramación de Citas Médicas (CU11 / RF08)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentRescheduleService
{
    /**
     * Reprograma una cita médica con verificación transaccional anti-colisión (RF07, RF08)
     */
    public function reprogramar(int $idCita, array $data, int $idUsuario): Cita
    {
        return DB::transaction(function () use ($idCita, $data, $idUsuario) {
            // 1. Obtener cita con bloqueo pesimista
            $cita = Cita::lockForUpdate()->find($idCita);

            if (!$cita) {
                throw new \Exception('Cita médica no encontrada.', 404);
            }

            // 2. Validar que la cita esté en un estado apto para reprogramar (RF08 / RN10)
            if (!$cita->puedeReprogramarse()) {
                throw new \Exception(
                    "Operación no permitida (RN10): No es posible reprogramar una cita en estado {$cita->estado}. Solo se admiten citas en estado PROGRAMADA o CONFIRMADA.",
                    422
                );
            }

            // 3. Validar que el médico siga activo (RN04)
            $medico = Medico::find($cita->id_medico);
            if (!$medico || !$medico->estado_activo) {
                throw new \Exception('El médico asignado a esta cita se encuentra inactivo (RN04).', 422);
            }

            // 4. Calcular nuevos rangos de fecha y hora
            $fecha = $data['fecha'];
            $horaInicio = $data['hora_inicio'];
            $duracionMinutos = $data['duracion_minutos'] ?? $cita->duracion_minutos ?? 30;

            $nuevaFechaHoraInicio = Carbon::parse("{$fecha} {$horaInicio}");
            $nuevaFechaHoraFin = $nuevaFechaHoraInicio->copy()->addMinutes($duracionMinutos);

            // Validar que no sea horario pasado (RN06)
            if ($nuevaFechaHoraInicio->lessThan(Carbon::now())) {
                throw new \Exception('No es posible reprogramar la cita en un horario que ya ha transcurrido (RN06).', 422);
            }

            // 5. Validar jornada semanal del médico (RN05 / Prueba #5)
            $diaSemana = $nuevaFechaHoraInicio->dayOfWeekIso; // 1 (Lunes) a 7 (Domingo)
            $disponibilidad = Disponibilidad::where('id_medico', $cita->id_medico)
                ->where('dia_semana', $diaSemana)
                ->where('activo', true)
                ->where('hora_inicio', '<=', $horaInicio)
                ->where('hora_fin', '>=', $nuevaFechaHoraFin->format('H:i'))
                ->first();

            if (!$disponibilidad) {
                throw new \Exception(
                    "Horario no válido (RN05 / Prueba #5): El horario {$horaInicio} - {$nuevaFechaHoraFin->format('H:i')} se encuentra fuera de la jornada de atención del médico para este día de la semana.",
                    422
                );
            }

            // 6. Validar feriados y licencias (Prueba P9.3)
            $bloqueos = BloqueoHorario::paraMedicoOInstitucional($cita->id_medico)
                ->where('fecha', $fecha)
                ->get();

            foreach ($bloqueos as $b) {
                if ($b->solapaConHorario($horaInicio, $nuevaFechaHoraFin->format('H:i'))) {
                    $tipo = $b->esFeriadoGeneral() ? 'Feriado General de la Clínica' : 'Licencia Médica Particular';
                    throw new \Exception("No se puede reprogramar al horario solicitado: Coincide con {$tipo} ('{$b->motivo}').", 422);
                }
            }

            // 7. Validación anti-colisión transaccional (RF07 / Prueba #4)
            // Se excluye la propia cita que está siendo reprogramada
            $colision = Cita::where('id_medico', $cita->id_medico)
                ->where('id_cita', '!=', $cita->id_cita)
                ->whereNotIn('estado', ['CANCELADA', 'INASISTENCIA'])
                ->where(function ($q) use ($nuevaFechaHoraInicio, $nuevaFechaHoraFin) {
                    $q->where('fecha_hora_inicio', '<', $nuevaFechaHoraFin)
                      ->where('fecha_hora_fin', '>', $nuevaFechaHoraInicio);
                })
                ->lockForUpdate()
                ->first();

            if ($colision) {
                throw new \Exception(
                    "Colisión de Horario (RF07 / Anti-Colisión): El médico ya tiene una cita activa ({$colision->codigo_cita}) entre {$colision->fecha_hora_inicio->format('H:i')} y {$colision->fecha_hora_fin->format('H:i')}. El cupo ya está ocupado.",
                    409
                );
            }

            // 8. Aplicar la reprogramación en el modelo
            $cita->duracion_minutos = $duracionMinutos;
            $cita->reprogramar(
                $nuevaFechaHoraInicio,
                $nuevaFechaHoraFin,
                $data['motivo_reprogramacion'],
                $idUsuario
            );

            // 9. Registrar auditoría inmutable en bitácora (CU03)
            Bitacora::registrarAccion(
                'REPROGRAMAR_CITA',
                'citas',
                $cita->id_cita,
                "Cita {$cita->codigo_cita} reprogramada para el {$nuevaFechaHoraInicio->format('d/m/Y H:i')}. Motivo: {$data['motivo_reprogramacion']}",
                $idUsuario
            );

            // Disparar notificaciones automáticas (CU20 / Paquete 5)
            try {
                app(\App\Packages\Integrations\Services\NotificationService::class)->notificarCitaReprogramada($cita, $data['motivo_reprogramacion']);
            } catch (\Throwable $th) {
                \Illuminate\Support\Facades\Log::warning("Error al emitir notificación de reprogramación para {$cita->codigo_cita}: " . $th->getMessage());
            }

            return $cita->fresh([
                'paciente:id_paciente,nombres,apellidos,numero_documento,numero_historia,telefono',
                'medico:id_medico,nombres,apellidos,codigo_profesional',
                'especialidad:id_especialidad,nombre,precio_consulta',
                'tipoCita:id_tipo_cita,nombre',
                'historialEstados',
            ]);
        });
    }
}

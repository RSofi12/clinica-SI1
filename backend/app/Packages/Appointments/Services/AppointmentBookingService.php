<?php

namespace App\Packages\Appointments\Services;

use Illuminate\Support\Facades\DB;
use App\Packages\Appointments\Models\Cita;
use App\Packages\Appointments\Models\CitaEstadoHistorial;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\ClinicalResources\Models\Disponibilidad;
use App\Packages\ClinicalResources\Models\BloqueoHorario;
use App\Packages\Security\Models\Bitacora;
use Carbon\Carbon;

/**
 * Servicio Transaccional de Reserva y Programación de Citas Médicas (CU10 / RF06, RF07)
 * Implementa el mecanismo de prevención anti-colisión transaccional estricto (RF07 / Prueba #4)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentBookingService
{
    /**
     * Generador automático del código correlativo único: CM-0001, CM-0002... (RF06)
     */
    public static function generarCodigoCita(): string
    {
        $ultimo = Cita::query()
            ->where('codigo_cita', 'LIKE', 'CM-%')
            ->orderByRaw("CAST(SUBSTRING(codigo_cita FROM 4) AS INTEGER) DESC")
            ->value('codigo_cita');

        if (!$ultimo) {
            return 'CM-0001';
        }

        $correlativo = (int) substr($ultimo, 3);
        $siguiente = $correlativo + 1;

        return sprintf('CM-%04d', $siguiente);
    }

    /**
     * Programa una cita médica bajo una transacción atómica anti-colisión (RF07)
     *
     * @param array $data
     * @param int $creadaPor (id_usuario de sesión)
     * @return Cita
     * @throws \Exception
     */
    public function programarCita(array $data, int $creadaPor): Cita
    {
        return DB::transaction(function () use ($data, $creadaPor) {
            $idPaciente = (int) $data['id_paciente'];
            $idMedico = (int) $data['id_medico'];
            $idEspecialidad = (int) $data['id_especialidad'];
            $idTipoCita = (int) $data['id_tipo_cita'];
            $fecha = $data['fecha'];
            $horaInicio = $data['hora_inicio'];
            $modalidad = $data['modalidad'] ?? 'PRESENCIAL';
            $motivo = $data['motivo_breve'] ?? $data['motivo_consulta'] ?? null;

            // 1. Validar Paciente y compatibilidad etaria con la especialidad (RF04 / Prueba P10.4)
            $paciente = Paciente::find($idPaciente);
            if (!$paciente) {
                throw new \Exception('Paciente no encontrado en el sistema.', 404);
            }

            if ($paciente->estado_paciente !== 'ACTIVO') {
                throw new \Exception('El paciente seleccionado no se encuentra en estado ACTIVO (RN11).', 422);
            }

            $especialidad = Especialidad::find($idEspecialidad);
            if (!$especialidad) {
                throw new \Exception('Especialidad médica no encontrada.', 404);
            }

            $edad = $paciente->calcularEdad();
            if (!$especialidad->esAptaParaEdad($edad)) {
                $min = $especialidad->edad_min_anios ?? 0;
                $max = $especialidad->edad_max_anios ?? 'sin límite';
                throw new \Exception(
                    "Restricción etaria (RF04 / P10.4): El paciente tiene {$edad} años y la especialidad '{$especialidad->nombre}' solo admite pacientes entre {$min} y {$max} años.",
                    422
                );
            }

            // 2. Bloquear registro del médico con lockForUpdate() para serializar solicitudes concurrentes (RF07 / Prueba #4)
            $medico = Medico::where('id_medico', $idMedico)->lockForUpdate()->first();
            if (!$medico) {
                throw new \Exception('Médico no encontrado.', 404);
            }

            if (!$medico->estado_activo) {
                throw new \Exception('El médico seleccionado se encuentra inactivo y no puede recibir citas (RN04).', 422);
            }

            // Verificar que el médico posea la especialidad asignada
            $tieneEspecialidad = $medico->specialties()->where('especialidades.id_especialidad', $idEspecialidad)->exists();
            if (!$tieneEspecialidad) {
                throw new \Exception("El {$medico->nombre_completo} no tiene acreditada la especialidad de {$especialidad->nombre}.", 422);
            }

            // 3. Calcular intervalo de tiempo
            $duracionMinutos = (int) ($data['duracion_minutos'] ?? 30);
            if ($duracionMinutos <= 0) {
                $duracionMinutos = 30;
            }

            $fechaHoraInicio = Carbon::parse("{$fecha} {$horaInicio}");
            $fechaHoraFin = $fechaHoraInicio->copy()->addMinutes($duracionMinutos);

            // Validar que no sea horario pasado (RN06)
            if ($fechaHoraInicio->lessThan(Carbon::now())) {
                throw new \Exception('No es posible programar citas en un horario que ya ha transcurrido (RN06).', 422);
            }

            // 4. Validar que el horario caiga dentro de la jornada semanal del médico (RN05 / Prueba #5)
            $diaSemana = $fechaHoraInicio->dayOfWeekIso; // 1-7
            $disponibilidad = Disponibilidad::where('id_medico', $idMedico)
                ->where('dia_semana', $diaSemana)
                ->where('activo', true)
                ->where('hora_inicio', '<=', $horaInicio)
                ->where('hora_fin', '>=', $fechaHoraFin->format('H:i'))
                ->first();

            if (!$disponibilidad) {
                throw new \Exception(
                    "Horario no válido (RN05 / Prueba #5): El horario {$horaInicio} - {$fechaHoraFin->format('H:i')} se encuentra fuera de la jornada de atención configurada para el médico en este día de la semana.",
                    422
                );
            }

            // 5. Validar que no caiga en un feriado institucional o licencia médica (Prueba P9.3)
            $bloqueos = BloqueoHorario::paraMedicoOInstitucional($idMedico)
                ->where('fecha', $fecha)
                ->get();

            foreach ($bloqueos as $b) {
                if ($b->solapaConHorario($horaInicio, $fechaHoraFin->format('H:i'))) {
                    $tipo = $b->esFeriadoGeneral() ? 'Feriado General de la Clínica' : 'Licencia Médica Particular';
                    throw new \Exception("No se puede reservar el cupo: Coincide con {$tipo} ('{$b->motivo}').", 422);
                }
            }

            // 6. VALIDACIÓN ANTI-COLISIÓN TRANSACCIONAL (RF07 / Mandamiento PUDS / Prueba #4)
            // Se verifica si ya existe una cita activa (no cancelada) que solape con el mismo médico
            $colision = Cita::where('id_medico', $idMedico)
                ->where('estado', '!=', 'CANCELADA')
                ->where(function ($q) use ($fechaHoraInicio, $fechaHoraFin) {
                    // Solapan si: inicio < citaExistenteFin && fin > citaExistenteInicio
                    $q->where('fecha_hora_inicio', '<', $fechaHoraFin)
                      ->where('fecha_hora_fin', '>', $fechaHoraInicio);
                })
                ->lockForUpdate()
                ->first();

            if ($colision) {
                throw new \Exception(
                    "Colisión de Horario (RF07 / Anti-Colisión): El médico ya tiene una cita activa ({$colision->codigo_cita}) asignada entre {$colision->fecha_hora_inicio->format('H:i')} y {$colision->fecha_hora_fin->format('H:i')}. El cupo ya fue reservado.",
                    409
                );
            }

            // 7. Generar código correlativo atómico CM-XXXX e insertar cita
            $codigoCita = self::generarCodigoCita();

            $cita = Cita::create([
                'codigo_cita' => $codigoCita,
                'id_paciente' => $idPaciente,
                'id_medico' => $idMedico,
                'id_especialidad' => $idEspecialidad,
                'id_tipo_cita' => $idTipoCita,
                'fecha_hora_inicio' => $fechaHoraInicio,
                'fecha_hora_fin' => $fechaHoraFin,
                'duracion_minutos' => $duracionMinutos,
                'estado' => 'PROGRAMADA',
                'modalidad' => $modalidad,
                'motivo_consulta' => $motivo,
                'creada_por' => $creadaPor,
            ]);

            // Registrar transición inicial en historial
            CitaEstadoHistorial::registrarCambio(
                $cita->id_cita,
                null,
                'PROGRAMADA',
                $creadaPor,
                'Reserva inicial de cita médica (CU10)'
            );

            // Registrar en auditoría inmutable (CU03 / Bitacora)
            Bitacora::registrar(
                $creadaPor,
                'Citas Médicas',
                'PROGRAMAR_CITA',
                'citas',
                $cita->id_cita,
                "Se reservó la cita {$codigoCita} para el paciente {$paciente->nombre_completo} (HC: {$paciente->numero_historia}) con {$medico->nombre_completo} ({$especialidad->nombre}) el {$fecha} a las {$horaInicio}."
            );

            return $cita->load(['paciente', 'medico', 'especialidad', 'tipoCita']);
        });
    }
}

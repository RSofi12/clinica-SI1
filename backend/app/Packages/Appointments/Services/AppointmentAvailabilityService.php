<?php

namespace App\Packages\Appointments\Services;

use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Disponibilidad;
use App\Packages\ClinicalResources\Models\BloqueoHorario;
use App\Packages\Appointments\Models\Cita;
use Carbon\Carbon;

/**
 * Servicio de Cálculo y Consulta de Disponibilidad de Horarios (CU09 / RF05, RF06)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentAvailabilityService
{
    /**
     * Consulta la disponibilidad de turnos para un médico en una fecha determinada
     *
     * @param int $idMedico
     * @param string $fecha (Formato Y-m-d)
     * @param int|null $idEspecialidad
     * @return array
     * @throws \Exception
     */
    public function consultarDisponibilidad(int $idMedico, string $fecha, ?int $idEspecialidad = null): array
    {
        // 1. Validar que el médico exista y se encuentre en estado activo (RN04)
        $medico = Medico::with(['specialties'])->find($idMedico);
        if (!$medico) {
            throw new \Exception('Médico no encontrado.', 404);
        }

        if (!$medico->estado_activo) {
            throw new \Exception('El médico seleccionado se encuentra inactivo y no ofrece turnos de consulta (RN04).', 422);
        }

        // 2. Validar que la fecha no sea anterior a hoy (RN06)
        $fechaHoy = Carbon::today()->format('Y-m-d');
        if ($fecha < $fechaHoy) {
            throw new \Exception('No es posible consultar disponibilidad en fechas pasadas (RN06).', 422);
        }

        // Si se especificó una especialidad, validar que el médico la tenga asignada
        if ($idEspecialidad) {
            $tieneEspecialidad = $medico->specialties->contains('id_especialidad', $idEspecialidad);
            if (!$tieneEspecialidad) {
                throw new \Exception('El médico no atiende en la especialidad seleccionada.', 422);
            }
        }

        $carbonFecha = Carbon::parse($fecha);
        $diaSemana = $carbonFecha->dayOfWeekIso; // 1: Lunes .. 7: Domingo

        $diasNombres = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miércoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo',
        ];
        $diaNombre = $diasNombres[$diaSemana] ?? 'Desconocido';

        // 3. Verificar Bloqueos de Fecha Completa (Feriados Generales o Licencias Médicas - Prueba P9.3)
        $bloqueos = BloqueoHorario::paraMedicoOInstitucional($idMedico)
            ->where('fecha', $fecha)
            ->get();

        $bloqueoDiaCompleto = $bloqueos->first(function ($b) {
            return is_null($b->hora_inicio) || is_null($b->hora_fin);
        });

        if ($bloqueoDiaCompleto) {
            $tipoBloqueo = $bloqueoDiaCompleto->esFeriadoGeneral()
                ? 'Feriado General de la Clínica'
                : 'Licencia Médica';

            return [
                'disponible' => false,
                'es_laborable' => false,
                'bloqueado_todo_el_dia' => true,
                'motivo_bloqueo' => "{$tipoBloqueo}: {$bloqueoDiaCompleto->motivo}",
                'fecha' => $fecha,
                'dia_semana' => $diaSemana,
                'dia_nombre' => $diaNombre,
                'medico' => [
                    'id_medico' => $medico->id_medico,
                    'nombre_completo' => $medico->nombre_completo,
                    'codigo_profesional' => $medico->codigo_profesional,
                    'especialidad_principal' => $medico->especialidad_principal,
                ],
                'resumen' => [
                    'total_slots' => 0,
                    'disponibles' => 0,
                    'ocupados' => 0,
                    'bloqueados' => 0,
                ],
                'slots' => [],
            ];
        }

        // 4. Obtener Franjas de Disponibilidad Semanal del Médico para este día (RN05)
        $disponibilidades = Disponibilidad::where('id_medico', $idMedico)
            ->where('dia_semana', $diaSemana)
            ->where('activo', true)
            ->orderBy('hora_inicio')
            ->get();

        if ($disponibilidades->isEmpty()) {
            return [
                'disponible' => false,
                'es_laborable' => false,
                'bloqueado_todo_el_dia' => false,
                'motivo_bloqueo' => "El profesional no tiene horario configurado de atención para el día {$diaNombre} (RN05).",
                'fecha' => $fecha,
                'dia_semana' => $diaSemana,
                'dia_nombre' => $diaNombre,
                'medico' => [
                    'id_medico' => $medico->id_medico,
                    'nombre_completo' => $medico->nombre_completo,
                    'codigo_profesional' => $medico->codigo_profesional,
                    'especialidad_principal' => $medico->especialidad_principal,
                ],
                'resumen' => [
                    'total_slots' => 0,
                    'disponibles' => 0,
                    'ocupados' => 0,
                    'bloqueados' => 0,
                ],
                'slots' => [],
            ];
        }

        // 5. Cargar Citas Médicas Activas en esta Fecha para descartar turnos ocupados (Prueba P9.2)
        $citas = Cita::paraMedico($idMedico)
            ->enFecha($fecha)
            ->activas()
            ->get();

        // 6. Generar los slots por cada franja según la duración (Prueba P9.1)
        $todosLosSlots = [];
        $conteoDisponibles = 0;
        $conteoOcupados = 0;
        $conteoBloqueados = 0;
        $ahora = Carbon::now();
        $esHoy = ($fecha === $fechaHoy);

        foreach ($disponibilidades as $disp) {
            $duracion = $disp->duracion_cita_minutos > 0 ? $disp->duracion_cita_minutos : 30;
            $horaInicioFranja = Carbon::parse("{$fecha} {$disp->hora_inicio}");
            $horaFinFranja = Carbon::parse("{$fecha} {$disp->hora_fin}");

            $actual = $horaInicioFranja->copy();
            while ($actual->copy()->addMinutes($duracion)->lessThanOrEqualTo($horaFinFranja)) {
                $slotFin = $actual->copy()->addMinutes($duracion);
                $horaInicioStr = $actual->format('H:i');
                $horaFinStr = $slotFin->format('H:i');

                $disponible = true;
                $motivoNoDisponible = null;
                $estadoSlot = 'DISPONIBLE';

                // A. ¿Ya pasó la hora si la fecha es hoy?
                if ($esHoy && $actual->lessThan($ahora)) {
                    $disponible = false;
                    $estadoSlot = 'HORA_PASADA';
                    $motivoNoDisponible = 'Horario ya concluido';
                    $conteoBloqueados++;
                }

                // B. ¿Solapa con algún bloqueo parcial o feriado parcial?
                if ($disponible) {
                    foreach ($bloqueos as $b) {
                        if ($b->solapaConHorario($horaInicioStr, $horaFinStr)) {
                            $disponible = false;
                            $estadoSlot = 'BLOQUEADO';
                            $motivoNoDisponible = $b->esFeriadoGeneral()
                                ? "Feriado: {$b->motivo}"
                                : "Licencia: {$b->motivo}";
                            $conteoBloqueados++;
                            break;
                        }
                    }
                }

                // C. ¿Solapa con una cita ya reservada para este médico? (Prueba P9.2)
                if ($disponible) {
                    foreach ($citas as $c) {
                        $citaInicio = Carbon::parse($c->fecha_hora_inicio);
                        $citaFin = Carbon::parse($c->fecha_hora_fin);

                        // Solapamiento: slotInicio < citaFin && slotFin > citaInicio
                        if ($actual->lessThan($citaFin) && $slotFin->greaterThan($citaInicio)) {
                            $disponible = false;
                            $estadoSlot = 'OCUPADO';
                            $motivoNoDisponible = "Ocupado ({$c->codigo_cita})";
                            $conteoOcupados++;
                            break;
                        }
                    }
                }

                if ($disponible) {
                    $conteoDisponibles++;
                }

                $todosLosSlots[] = [
                    'hora_inicio' => $horaInicioStr,
                    'hora_fin' => $horaFinStr,
                    'duracion_minutos' => $duracion,
                    'disponible' => $disponible,
                    'estado' => $estadoSlot,
                    'motivo' => $motivoNoDisponible,
                ];

                $actual->addMinutes($duracion);
            }
        }

        return [
            'disponible' => $conteoDisponibles > 0,
            'es_laborable' => true,
            'bloqueado_todo_el_dia' => false,
            'motivo_bloqueo' => null,
            'fecha' => $fecha,
            'dia_semana' => $diaSemana,
            'dia_nombre' => $diaNombre,
            'medico' => [
                'id_medico' => $medico->id_medico,
                'nombre_completo' => $medico->nombre_completo,
                'codigo_profesional' => $medico->codigo_profesional,
                'especialidad_principal' => $medico->especialidad_principal,
            ],
            'resumen' => [
                'total_slots' => count($todosLosSlots),
                'disponibles' => $conteoDisponibles,
                'ocupados' => $conteoOcupados,
                'bloqueados' => $conteoBloqueados,
            ],
            'slots' => $todosLosSlots,
        ];
    }
}

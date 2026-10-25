<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Disponibilidad;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\Appointments\Models\Cita;
use App\Packages\Appointments\Models\TipoCita;
use App\Packages\Appointments\Models\CitaEstadoHistorial;
use App\Packages\Security\Models\User;
use Carbon\Carbon;

/**
 * Seeder de Horarios Semanales (CU08) y Citas Médicas Iniciales (CU09/CU10/CU12/CU14/CU15)
 * Provee datos listos para probar la agenda diaria, turnos libres y cancelaciones.
 */
class ScheduleAndAppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $medicos = Medico::all();
        $adminUser = User::where('tipo_usuario', 'ADMIN')->first() ?? User::first();
        $tiposCita = TipoCita::all();
        $tipoGeneral = $tiposCita->first() ? $tiposCita->first()->id_tipo_cita : 1;
        $pacientes = Paciente::where('estado_paciente', 'ACTIVO')->get();

        if ($medicos->isEmpty()) {
            return;
        }

        // =========================================================================
        // 1. POBLAR HORARIOS DE ATENCIÓN SEMANAL (Lunes a Viernes y Sábados)
        // =========================================================================
        foreach ($medicos as $medico) {
            // Lunes a Viernes (Días 1 a 5): Mañana 08:00 - 12:00 y Tarde 14:00 - 18:00
            for ($dia = 1; $dia <= 5; $dia++) {
                Disponibilidad::firstOrCreate(
                    [
                        'id_medico' => $medico->id_medico,
                        'dia_semana' => $dia,
                        'hora_inicio' => '08:00',
                        'hora_fin' => '12:00',
                    ],
                    [
                        'duracion_cita_minutos' => 30,
                        'activo' => true,
                    ]
                );

                Disponibilidad::firstOrCreate(
                    [
                        'id_medico' => $medico->id_medico,
                        'dia_semana' => $dia,
                        'hora_inicio' => '14:00',
                        'hora_fin' => '18:00',
                    ],
                    [
                        'duracion_cita_minutos' => 30,
                        'activo' => true,
                    ]
                );
            }

            // Sábado (Día 6): Mañana 08:00 - 12:00
            Disponibilidad::firstOrCreate(
                [
                    'id_medico' => $medico->id_medico,
                    'dia_semana' => 6,
                    'hora_inicio' => '08:00',
                    'hora_fin' => '12:00',
                ],
                [
                    'duracion_cita_minutos' => 30,
                    'activo' => true,
                ]
            );
        }

        // =========================================================================
        // 2. POBLAR CITAS MÉDICAS DEMOSTRATIVAS REALISTAS
        // =========================================================================
        if ($pacientes->isEmpty()) {
            return;
        }

        $hoy = Carbon::now('America/La_Paz')->format('Y-m-d');
        $ayer = Carbon::now('America/La_Paz')->subDay()->format('Y-m-d');
        $manana = Carbon::now('America/La_Paz')->addDay()->format('Y-m-d');

        $citasDemo = [
            // Cita 1: Dr. Juan Carlos Pérez - Hoy 08:30 a 09:00 (CONFIRMADA)
            [
                'codigo_cita' => 'CM-0001',
                'medico_idx' => 0,
                'paciente_id' => 5, // Carlos Andrés Silva (Adulto)
                'fecha' => $hoy,
                'inicio' => '08:30:00',
                'fin' => '09:00:00',
                'estado' => 'CONFIRMADA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Control de presión arterial y fatiga ocasional.',
            ],
            // Cita 2: Dr. Juan Carlos Pérez - Hoy 09:30 a 10:00 (PENDIENTE)
            [
                'codigo_cita' => 'CM-0002',
                'medico_idx' => 0,
                'paciente_id' => 6, // Mariana Torrico
                'fecha' => $hoy,
                'inicio' => '09:30:00',
                'fin' => '10:00:00',
                'estado' => 'PENDIENTE',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Evaluación de dolor lumbar recurrente.',
            ],
            // Cita 3: Dr. Juan Carlos Pérez - Hoy 10:30 a 11:00 (CANCELADA con motivo)
            [
                'codigo_cita' => 'CM-0003',
                'medico_idx' => 0,
                'paciente_id' => 7, // Rodrigo Benítez
                'fecha' => $hoy,
                'inicio' => '10:30:00',
                'fin' => '11:00:00',
                'estado' => 'CANCELADA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Chequeo médico laboral anual.',
                'motivo_cancelacion' => 'Paciente tuvo reunión de trabajo imprevista fuera de la ciudad.',
                'cancelada_en' => Carbon::now('America/La_Paz')->subHours(2),
            ],
            // Cita 4: Dra. Elena Paredes (Pediatría) - Hoy 09:00 a 09:30 (CONFIRMADA)
            [
                'codigo_cita' => 'CM-0004',
                'medico_idx' => 2, // Dra. Elena Paredes (Pediatra)
                'paciente_id' => 1, // Mateo Morales (Pediátrico 4 años)
                'fecha' => $hoy,
                'inicio' => '09:00:00',
                'fin' => '09:30:00',
                'estado' => 'CONFIRMADA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Control de crecimiento, peso y esquema de vacunación.',
            ],
            // Cita 5: Dra. Elena Paredes (Pediatría) - Hoy 10:00 a 10:30 (PENDIENTE)
            [
                'codigo_cita' => 'CM-0005',
                'medico_idx' => 2,
                'paciente_id' => 2, // Luciana Quispe (Pediátrica 8 años)
                'fecha' => $hoy,
                'inicio' => '10:00:00',
                'fin' => '10:30:00',
                'estado' => 'PENDIENTE',
                'modalidad' => 'TELECONSULTA',
                'motivo_consulta' => 'Revisión de resultados de laboratorio de rutina.',
            ],
            // Cita 6: Dr. Alejandro Morales (Cardiología) - Hoy 15:00 a 15:30 (CONFIRMADA)
            [
                'codigo_cita' => 'CM-0006',
                'medico_idx' => 1, // Dr. Alejandro Morales
                'paciente_id' => 9, // Javier Mendoza (52 años)
                'fecha' => $hoy,
                'inicio' => '15:00:00',
                'fin' => '15:30:00',
                'estado' => 'CONFIRMADA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Ecocardiograma de control y chequeo cardiovascular.',
            ],
            // Cita 7: Dra. Carmen Mendoza (Geriatría) - Hoy 11:00 a 11:30 (ATENDIDA)
            [
                'codigo_cita' => 'CM-0007',
                'medico_idx' => 3, // Dra. Carmen Mendoza
                'paciente_id' => 12, // Donato Flores (67 años)
                'fecha' => $hoy,
                'inicio' => '11:00:00',
                'fin' => '11:30:00',
                'estado' => 'ATENDIDA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Seguimiento geriátrico y ajuste de dosis de medicación.',
            ],
            // Cita 8: Dr. Juan Carlos Pérez - Ayer 09:00 a 09:30 (ATENDIDA para Historial)
            [
                'codigo_cita' => 'CM-0008',
                'medico_idx' => 0,
                'paciente_id' => 5, // Carlos Andrés Silva
                'fecha' => $ayer,
                'inicio' => '09:00:00',
                'fin' => '09:30:00',
                'estado' => 'ATENDIDA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Consulta por cuadro gripal y dolor de garganta.',
            ],
            // Cita 9: Dr. Juan Carlos Pérez - Mañana 08:30 a 09:00 (PENDIENTE)
            [
                'codigo_cita' => 'CM-0009',
                'medico_idx' => 0,
                'paciente_id' => 8, // Gabriela Paz
                'fecha' => $manana,
                'inicio' => '08:30:00',
                'fin' => '09:00:00',
                'estado' => 'PENDIENTE',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Consulta dermatológica por irritación cutánea.',
            ],
            // Cita 10: Dr. Juan Carlos Pérez - Ayer 11:30 a 12:00 (INASISTENCIA)
            [
                'codigo_cita' => 'CM-0010',
                'medico_idx' => 0,
                'paciente_id' => 7, // Rodrigo Benítez
                'fecha' => $ayer,
                'inicio' => '11:30:00',
                'fin' => '12:00:00',
                'estado' => 'INASISTENCIA',
                'modalidad' => 'PRESENCIAL',
                'motivo_consulta' => 'Control de dolor lumbar programado.',
            ],
        ];

        foreach ($citasDemo as $c) {
            $medico = $medicos[$c['medico_idx']] ?? $medicos->first();
            $especialidadPrincipal = $medico->especialidad_principal ?? $medico->specialties()->first();
            $especialidadId = $especialidadPrincipal ? $especialidadPrincipal->id_especialidad : 1;

            $fechaInicio = Carbon::parse("{$c['fecha']} {$c['inicio']}");
            $fechaFin = Carbon::parse("{$c['fecha']} {$c['fin']}");

            $cita = Cita::firstOrCreate(
                ['codigo_cita' => $c['codigo_cita']],
                [
                    'id_paciente' => $c['paciente_id'],
                    'id_medico' => $medico->id_medico,
                    'id_especialidad' => $especialidadId,
                    'id_tipo_cita' => $tipoGeneral,
                    'fecha_hora_inicio' => $fechaInicio,
                    'fecha_hora_fin' => $fechaFin,
                    'duracion_minutos' => 30,
                    'estado' => $c['estado'],
                    'modalidad' => $c['modalidad'],
                    'motivo_consulta' => $c['motivo_consulta'],
                    'motivo_cancelacion' => $c['motivo_cancelacion'] ?? null,
                    'cancelada_en' => $c['cancelada_en'] ?? null,
                    'creada_por' => $adminUser->id_usuario,
                ]
            );

            // Registro histórico del estado inicial
            CitaEstadoHistorial::registrarCambio(
                $cita->id_cita,
                'PENDIENTE',
                $c['estado'],
                $adminUser->id_usuario,
                $c['motivo_cancelacion'] ?? 'Registro inicial de cita de demostración.'
            );
        }
    }
}

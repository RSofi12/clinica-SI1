<?php

namespace App\Packages\MedicalRecords\Services;

use App\Packages\Appointments\Models\Cita;
use App\Packages\Appointments\Models\CitaEstadoHistorial;
use App\Packages\MedicalRecords\Models\ConsultaMedica;
use App\Packages\MedicalRecords\Models\HistoriaClinica;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConsultaMedicaService
{
    /**
     * Prepara los datos clínicos y de antecedentes antes de iniciar la atención
     */
    public function prepararConsulta(int $idCita, User $user): array
    {
        $cita = Cita::with([
            'paciente.historiaClinica.consultas' => function ($q) {
                $q->latest('fecha_consulta')->take(5)->with('diagnosticos', 'medico');
            },
            'paciente.historiaClinica.antecedentes' => function ($q) {
                $q->where('estado', 'ACTIVO');
            },
            'medico',
            'especialidad',
            'tipoCita',
        ])->findOrFail($idCita);

        $this->validarAccesoMedico($cita, $user);

        return [
            'cita' => $cita,
            'paciente' => $cita->paciente,
            'historia_clinica' => $cita->paciente->historiaClinica,
            'ultimas_consultas' => $cita->paciente->historiaClinica?->consultas ?? [],
            'antecedentes' => $cita->paciente->historiaClinica?->antecedentes ?? [],
        ];
    }

    /**
     * Registra el acto médico, triaje, diagnósticos y actualiza la cita a ATENDIDA
     */
    public function registrarConsulta(array $datos, User $user): ConsultaMedica
    {
        return DB::transaction(function () use ($datos, $user) {
            // 1. Bloqueo pesimista de la cita
            $cita = Cita::lockForUpdate()->findOrFail($datos['id_cita']);

            // 2. Validaciones de negocio y seguridad
            $this->validarAccesoMedico($cita, $user);

            if ($cita->estado === 'ATENDIDA') {
                throw ValidationException::withMessages([
                    'id_cita' => ['Esta cita médica ya ha sido atendida y cuenta con una consulta registrada.'],
                ]);
            }

            if (in_array($cita->estado, ['CANCELADA', 'INASISTENCIA'])) {
                throw ValidationException::withMessages([
                    'id_cita' => ["No se puede registrar una consulta médica para una cita en estado {$cita->estado}."],
                ]);
            }

            // Verificar si ya existe registro en consultas_medicas
            $consultaExistente = ConsultaMedica::where('id_cita', $cita->id_cita)->first();
            if ($consultaExistente) {
                throw ValidationException::withMessages([
                    'id_cita' => ['Ya existe una consulta médica asociada a esta cita.'],
                ]);
            }

            // 3. Asegurar la existencia de historia clínica para el paciente
            $historia = HistoriaClinica::firstOrCreate(
                ['id_paciente' => $cita->id_paciente],
                [
                    'fecha_apertura' => now()->toDateString(),
                    'estado' => 'ACTIVO',
                ]
            );

            // 4. Crear la Consulta Médica
            $consulta = ConsultaMedica::create([
                'id_cita'             => $cita->id_cita,
                'id_historia_clinica' => $historia->id_historia_clinica,
                'id_medico'           => $cita->id_medico,
                'motivo_consulta'     => $datos['motivo_consulta'],
                'peso_kg'             => $datos['peso_kg'] ?? null,
                'talla_cm'            => $datos['talla_cm'] ?? null,
                'temperatura_c'       => $datos['temperatura_c'] ?? null,
                'presion_arterial'    => $datos['presion_arterial'] ?? null,
                'frecuencia_cardiaca' => $datos['frecuencia_cardiaca'] ?? null,
                'observaciones'       => $datos['observaciones'] ?? null,
                'plan_tratamiento'    => $datos['plan_tratamiento'],
                'fecha_consulta'      => now(),
            ]);

            // 5. Registrar diagnósticos asociados
            if (!empty($datos['diagnosticos'])) {
                foreach ($datos['diagnosticos'] as $diag) {
                    $consulta->diagnosticos()->create([
                        'id_historia_clinica' => $historia->id_historia_clinica,
                        'descripcion'         => $diag['descripcion'],
                        'codigo_cie10'        => $diag['codigo_cie10'] ?? null,
                        'tipo'                => $diag['tipo'] ?? 'PRESUNTIVO',
                        'fecha_registro'      => now(),
                    ]);
                }
            }

            // 6. Transición de estado de la cita -> ATENDIDA
            $estadoAnterior = $cita->estado;
            $cita->estado = 'ATENDIDA';
            $cita->save();

            // 7. Registro de la transición en el historial de estados de la cita
            CitaEstadoHistorial::create([
                'id_cita'         => $cita->id_cita,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo'    => 'ATENDIDA',
                'id_usuario'      => $user->id_usuario,
                'observacion'     => 'Consulta médica registrada y finalizada con éxito.',
                'fecha_cambio'    => now(),
            ]);

            // 8. Registro de auditoría inmutable en Bitácora (CU03)
            Bitacora::registrar(
                $user->id_usuario,
                'ConsultasMedicas',
                'REGISTRAR_CONSULTA',
                'consultas_medicas',
                $consulta->id_consulta,
                "Consulta médica registrada para paciente ID {$cita->id_paciente} en cita {$cita->codigo_cita}."
            );

            return $consulta->load(['diagnosticos', 'medico', 'cita.paciente', 'historiaClinica']);
        });
    }

    /**
     * Valida permisos y pertenencia de la cita al médico autenticado (Anti-IDOR)
     */
    private function validarAccesoMedico(Cita $cita, User $user): void
    {
        if ($user->tipo_usuario === 'ADMIN') {
            return;
        }

        if ($user->tipo_usuario === 'MEDICO') {
            $medico = $user->medico;
            if (!$medico || $medico->id_medico !== $cita->id_medico) {
                abort(403, 'No tiene autorización para gestionar o atender citas de otro médico.');
            }
            return;
        }

        abort(403, 'No cuenta con los permisos asistenciales necesarios para acceder a la consulta médica.');
    }
}

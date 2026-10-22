<?php

namespace App\Packages\ClinicalResources\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

/**
 * Validador para configuración semanal de horarios de médicos (CU08 / RF05)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class ScheduleBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'horarios' => ['present', 'array'],
            'horarios.*.id_disponibilidad' => ['nullable', 'integer'],
            'horarios.*.dia_semana' => ['required', 'integer', 'between:1,7'],
            'horarios.*.hora_inicio' => ['required', 'date_format:H:i'],
            'horarios.*.hora_fin' => ['required', 'date_format:H:i'],
            'horarios.*.duracion_cita_minutos' => ['required', 'integer', 'min:5', 'max:240'],
            'horarios.*.activo' => ['required', 'boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $horarios = $this->input('horarios', []);
            $diasMap = [];

            foreach ($horarios as $index => $item) {
                $inicioStr = $item['hora_inicio'] ?? null;
                $finStr = $item['hora_fin'] ?? null;
                $dia = $item['dia_semana'] ?? null;
                $activo = $item['activo'] ?? true;

                if ($inicioStr && $finStr) {
                    try {
                        $inicio = Carbon::createFromFormat('H:i', $inicioStr);
                        $fin = Carbon::createFromFormat('H:i', $finStr);

                        // Validación P8.1: La hora final debe ser estrictamente posterior a la hora inicial
                        if ($fin->lessThanOrEqualTo($inicio)) {
                            $validator->errors()->add(
                                "horarios.{$index}.hora_fin",
                                "La hora final ({$finStr}) debe ser posterior a la hora inicial ({$inicioStr}) para el día {$dia}."
                            );
                        }

                        // Validación de solapamiento de franjas horarias activas en el mismo día
                        if ($activo && $dia) {
                            if (!isset($diasMap[$dia])) {
                                $diasMap[$dia] = [];
                            }

                            foreach ($diasMap[$dia] as $prev) {
                                // Solapan si: inicio < prevFin && fin > prevInicio
                                if ($inicio->lessThan($prev['fin']) && $fin->greaterThan($prev['inicio'])) {
                                    $validator->errors()->add(
                                        "horarios.{$index}.hora_inicio",
                                        "Existe un solapamiento de horarios en el día {$dia} entre {$inicioStr}-{$finStr} y {$prev['inicioStr']}-{$prev['finStr']}."
                                    );
                                    break;
                                }
                            }

                            $diasMap[$dia][] = [
                                'inicio' => $inicio,
                                'fin' => $fin,
                                'inicioStr' => $inicioStr,
                                'finStr' => $finStr,
                            ];
                        }
                    } catch (\Exception $e) {
                        $validator->errors()->add("horarios.{$index}", "Formato de hora no válido.");
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'horarios.present' => 'Debe enviar la lista de horarios.',
            'horarios.*.dia_semana.between' => 'El día de la semana debe estar entre 1 (Lunes) y 7 (Domingo).',
            'horarios.*.hora_inicio.required' => 'La hora inicial es obligatoria.',
            'horarios.*.hora_fin.required' => 'La hora final es obligatoria.',
            'horarios.*.duracion_cita_minutos.min' => 'La duración de cada cita debe ser de al menos 5 minutos.',
            'horarios.*.duracion_cita_minutos.max' => 'La duración de cada cita no puede exceder 240 minutos.',
        ];
    }
}

<?php

namespace App\Packages\ClinicalResources\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

/**
 * Validador para registro de bloqueos de horario y feriados (CU08 / RF05)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class BlockCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_medico' => ['nullable', 'integer', 'exists:medicos,id_medico'],
            'fecha' => ['required', 'date_format:Y-m-d'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'hora_fin' => ['nullable', 'date_format:H:i'],
            'motivo' => ['required', 'string', 'max:255'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $horaInicio = $this->input('hora_inicio');
            $horaFin = $this->input('hora_fin');

            // Si se especifica una hora inicial o final, ambas deben estar presentes
            if (($horaInicio && !$horaFin) || (!$horaInicio && $horaFin)) {
                $validator->errors()->add(
                    'hora_fin',
                    'Para bloqueos parciales debe especificar tanto la hora de inicio como la de fin.'
                );
            }

            // Si ambas están presentes, hora_fin debe ser mayor que hora_inicio
            if ($horaInicio && $horaFin) {
                try {
                    $inicio = Carbon::createFromFormat('H:i', $horaInicio);
                    $fin = Carbon::createFromFormat('H:i', $horaFin);

                    if ($fin->lessThanOrEqualTo($inicio)) {
                        $validator->errors()->add(
                            'hora_fin',
                            "La hora de fin del bloqueo ({$horaFin}) debe ser posterior a la hora de inicio ({$horaInicio})."
                        );
                    }
                } catch (\Exception $e) {
                    $validator->errors()->add('hora_inicio', 'Formato de hora no válido.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'fecha.required' => 'La fecha del bloqueo es obligatoria.',
            'fecha.date_format' => 'El formato de fecha debe ser YYYY-MM-DD.',
            'motivo.required' => 'El motivo del bloqueo o feriado es obligatorio.',
            'motivo.max' => 'El motivo no puede exceder los 255 caracteres.',
        ];
    }
}

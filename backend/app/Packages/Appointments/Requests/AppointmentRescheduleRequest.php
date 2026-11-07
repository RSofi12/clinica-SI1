<?php

namespace App\Packages\Appointments\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest de Reprogramación de Cita Médica (CU11 / RF08)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentRescheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fecha' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'hora_inicio' => [
                'required',
                'date_format:H:i',
            ],
            'duracion_minutos' => [
                'nullable',
                'integer',
                'min:15',
                'max:120',
            ],
            'motivo_reprogramacion' => [
                'required',
                'string',
                'min:5',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'fecha.required' => 'La nueva fecha de la cita es obligatoria.',
            'fecha.date_format' => 'El formato de fecha debe ser YYYY-MM-DD.',
            'fecha.after_or_equal' => 'No es posible reprogramar una cita en una fecha pasada (RN06).',
            'hora_inicio.required' => 'La nueva hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'El formato de hora debe ser HH:MM (24 horas).',
            'duracion_minutos.integer' => 'La duración debe ser un número entero de minutos.',
            'duracion_minutos.min' => 'La duración mínima de la consulta es de 15 minutos.',
            'duracion_minutos.max' => 'La duración máxima de la consulta es de 120 minutos.',
            'motivo_reprogramacion.required' => 'El motivo de la reprogramación es obligatorio.',
            'motivo_reprogramacion.min' => 'El motivo de reprogramación debe contener al menos 5 caracteres.',
            'motivo_reprogramacion.max' => 'El motivo de reprogramación no puede exceder los 500 caracteres.',
        ];
    }
}

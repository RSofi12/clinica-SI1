<?php

namespace App\Packages\Appointments\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest de Cancelación de Cita Médica (CU12 / RF09)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentCancelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo_cancelacion' => [
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
            'motivo_cancelacion.required' => 'El motivo de cancelación de la cita es obligatorio.',
            'motivo_cancelacion.min' => 'El motivo de cancelación debe contener al menos 5 caracteres.',
            'motivo_cancelacion.max' => 'El motivo de cancelación no puede exceder los 500 caracteres.',
        ];
    }
}

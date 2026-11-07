<?php

namespace App\Packages\Appointments\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FormRequest de Transición de Estados de Citas Médicas (CU13 / RF10)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentChangeStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nuevo_estado' => [
                'required',
                'string',
                Rule::in(['CONFIRMADA', 'ATENDIDA', 'INASISTENCIA']),
            ],
            'observacion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nuevo_estado.required' => 'El nuevo estado de la cita médica es obligatorio.',
            'nuevo_estado.in' => 'El estado indicado no es válido. Estados admitidos para transición operativa: CONFIRMADA, ATENDIDA, INASISTENCIA.',
            'observacion.max' => 'La observación del cambio de estado no puede exceder los 255 caracteres.',
        ];
    }
}

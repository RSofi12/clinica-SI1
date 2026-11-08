<?php

namespace App\Packages\MedicalRecords\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para validar la cancelación o anulación de una Orden de Examen Auxiliar (CU25)
 * Regla de Negocio RN11 (Baja lógica con motivo auditable)
 */
class OrdenExamenAnularRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo_cancelacion' => ['required', 'string', 'min:5', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo_cancelacion.required' => 'El motivo de cancelación es obligatorio según la norma RN11.',
            'motivo_cancelacion.min'      => 'El motivo de cancelación debe tener al menos 5 caracteres.',
            'motivo_cancelacion.max'      => 'El motivo de cancelación no puede exceder los 255 caracteres.',
        ];
    }
}


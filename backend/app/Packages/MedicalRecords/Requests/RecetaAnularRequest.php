<?php

namespace App\Packages\MedicalRecords\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecetaAnularRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo_anulacion' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo_anulacion.required' => 'El motivo de anulación es obligatorio.',
            'motivo_anulacion.min'      => 'El motivo de anulación debe tener al menos 5 caracteres.',
            'motivo_anulacion.max'      => 'El motivo de anulación no debe exceder los 500 caracteres.',
        ];
    }
}

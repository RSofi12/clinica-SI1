<?php

namespace App\Packages\MedicalRecords\Requests;

use App\Packages\MedicalRecords\Models\Antecedente;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FormRequest para registro de Antecedentes Médicos (CU17)
 * Paquete 4: Historial Clínico y Consultas
 */
class AntecedenteCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo_antecedente' => [
                'required',
                'string',
                Rule::in(Antecedente::TIPOS_VALIDOS),
            ],
            'descripcion' => [
                'required',
                'string',
                'min:3',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo_antecedente.required' => 'El tipo de antecedente médico es obligatorio.',
            'tipo_antecedente.in' => 'El tipo de antecedente seleccionado no es válido. Opciones permitidas: ' . implode(', ', Antecedente::TIPOS_VALIDOS) . '.',
            'descripcion.required' => 'La descripción clínica del antecedente es obligatoria.',
            'descripcion.min' => 'La descripción del antecedente debe contener al menos 3 caracteres.',
            'descripcion.max' => 'La descripción del antecedente no puede exceder los 1000 caracteres.',
        ];
    }
}

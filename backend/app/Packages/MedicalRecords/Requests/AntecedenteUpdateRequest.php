<?php

namespace App\Packages\MedicalRecords\Requests;

use App\Packages\MedicalRecords\Models\Antecedente;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FormRequest para actualización de Antecedentes Médicos (CU17)
 * Paquete 4: Historial Clínico y Consultas
 */
class AntecedenteUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo_antecedente' => [
                'sometimes',
                'string',
                Rule::in(Antecedente::TIPOS_VALIDOS),
            ],
            'descripcion' => [
                'sometimes',
                'string',
                'min:3',
                'max:1000',
            ],
            'estado' => [
                'sometimes',
                'string',
                Rule::in([Antecedente::ESTADO_ACTIVO, Antecedente::ESTADO_INACTIVO]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo_antecedente.in' => 'El tipo de antecedente seleccionado no es válido.',
            'descripcion.min' => 'La descripción del antecedente debe contener al menos 3 caracteres.',
            'descripcion.max' => 'La descripción del antecedente no puede exceder los 1000 caracteres.',
            'estado.in' => 'El estado debe ser ACTIVO o INACTIVO.',
        ];
    }
}

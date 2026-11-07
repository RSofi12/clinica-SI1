<?php

namespace App\Packages\MedicalRecords\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecetaCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_consulta'            => ['required', 'integer', 'exists:consultas_medicas,id_consulta'],
            'indicaciones_generales' => ['nullable', 'string', 'max:2000'],
            'detalles'               => ['required', 'array', 'min:1'],
            'detalles.*.medicamento' => ['required', 'string', 'max:150'],
            'detalles.*.dosis'       => ['required', 'string', 'max:100'],
            'detalles.*.frecuencia'  => ['required', 'string', 'max:100'],
            'detalles.*.duracion'    => ['required', 'string', 'max:100'],
            'detalles.*.indicaciones'=> ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_consulta.required'            => 'La consulta médica asociada es obligatoria.',
            'id_consulta.exists'              => 'La consulta médica seleccionada no existe en el sistema.',
            'detalles.required'               => 'Debe ingresar al menos un medicamento en la prescripción.',
            'detalles.array'                  => 'El formato de medicamentos debe ser una lista estructurada.',
            'detalles.min'                    => 'Debe prescribir al menos un medicamento.',
            'detalles.*.medicamento.required' => 'El nombre del medicamento es obligatorio.',
            'detalles.*.dosis.required'       => 'La dosis del medicamento es obligatoria.',
            'detalles.*.frecuencia.required'  => 'La frecuencia de administración es obligatoria.',
            'detalles.*.duracion.required'    => 'La duración del tratamiento es obligatoria.',
        ];
    }
}

<?php

namespace App\Packages\ClinicalResources\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validador para actualización de médicos (CU06 / RF03)
 */
class DoctorUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $doctorId = $this->route('id') ?? $this->route('doctor');

        return [
            'codigo_profesional' => [
                'required',
                'string',
                'max:50',
                Rule::unique('medicos', 'codigo_profesional')->ignore($doctorId, 'id_medico'),
            ],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'correo_profesional' => [
                'nullable',
                'email',
                'max:120',
                Rule::unique('medicos', 'correo_profesional')->ignore($doctorId, 'id_medico'),
            ],
            'telefono_contacto' => ['nullable', 'string', 'max:30'],
            'especialidades' => ['required', 'array', 'min:1'],
            'especialidades.*' => ['integer', 'exists:especialidades,id_especialidad'],
            'id_especialidad_principal' => ['required', 'integer'],
            'estado_activo' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $especialidades = $this->input('especialidades', []);
            $principal = $this->input('id_especialidad_principal');

            if (!empty($especialidades) && $principal && !in_array($principal, $especialidades)) {
                $validator->errors()->add(
                    'id_especialidad_principal',
                    'La especialidad principal debe formar parte de las especialidades seleccionadas.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'codigo_profesional.required' => 'El código o matrícula profesional es obligatorio.',
            'codigo_profesional.unique' => 'Ya existe otro médico registrado con esta matrícula profesional.',
            'nombres.required' => 'Los nombres del médico son obligatorios.',
            'apellidos.required' => 'Los apellidos del médico son obligatorios.',
            'correo_profesional.email' => 'El correo electrónico profesional no tiene un formato válido.',
            'correo_profesional.unique' => 'Este correo electrónico ya está en uso por otro médico.',
            'especialidades.required' => 'Debe asignar al menos una especialidad al médico.',
            'especialidades.min' => 'Debe asignar al menos una especialidad al médico.',
            'id_especialidad_principal.required' => 'Debe designar cuál es la especialidad principal del médico.',
        ];
    }
}

<?php

namespace App\Packages\ClinicalResources\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validador para registro de médicos (CU06 / RF03)
 */
class DoctorCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_profesional' => ['required', 'string', 'max:50', 'unique:medicos,codigo_profesional'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'correo_profesional' => ['nullable', 'email', 'max:120', 'unique:medicos,correo_profesional'],
            'telefono_contacto' => ['nullable', 'string', 'max:30'],
            'id_usuario' => ['nullable', 'integer', 'exists:usuarios,id_usuario', 'unique:medicos,id_usuario'],
            'crear_cuenta_web' => ['nullable', 'boolean'],
            'username' => ['nullable', 'string', 'min:3', 'max:50', 'unique:usuarios,username'],
            'password' => ['nullable', 'string', 'min:8'],
            'especialidades' => ['required', 'array', 'min:1'],
            'especialidades.*' => ['integer', 'exists:especialidades,id_especialidad'],
            'id_especialidad_principal' => ['required', 'integer'],
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
            'codigo_profesional.unique' => 'Ya existe un médico registrado con esta matrícula profesional.',
            'nombres.required' => 'Los nombres del médico son obligatorios.',
            'apellidos.required' => 'Los apellidos del médico son obligatorios.',
            'correo_profesional.email' => 'El correo electrónico profesional no tiene un formato válido.',
            'correo_profesional.unique' => 'Este correo electrónico ya está en uso por otro médico.',
            'especialidades.required' => 'Debe asignar al menos una especialidad al médico.',
            'especialidades.min' => 'Debe asignar al menos una especialidad al médico.',
            'id_especialidad_principal.required' => 'Debe designar cuál es la especialidad principal del médico.',
            'username.unique' => 'El nombre de usuario para el acceso al sistema ya está en uso.',
        ];
    }
}

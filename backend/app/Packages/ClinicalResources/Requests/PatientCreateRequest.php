<?php

namespace App\Packages\ClinicalResources\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validador para registro de nuevo paciente (CU04 / RF02)
 */
class PatientCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero_documento'     => ['required', 'string', 'max:30', 'unique:pacientes,numero_documento'],
            'nombres'              => ['required', 'string', 'max:100'],
            'apellidos'            => ['required', 'string', 'max:100'],
            'fecha_nacimiento'     => ['required', 'date', 'before_or_equal:today'],
            'sexo'                 => ['required', 'in:MASCULINO,FEMENINO'],
            'tipo_sangre'          => ['nullable', 'in:O+,O-,A+,A-,B+,B-,AB+,AB-'],
            'telefono'             => ['nullable', 'string', 'max:30'],
            'correo'               => ['nullable', 'email', 'max:120'],
            'direccion'            => ['nullable', 'string', 'max:255'],
            'notificaciones_activas' => ['nullable', 'boolean'],
            'contacto_nombre'      => ['nullable', 'string', 'max:150'],
            'contacto_parentesco'  => ['nullable', 'string', 'max:50'],
            'contacto_telefono'    => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'numero_documento.required'    => 'El documento de identidad (CI) es obligatorio.',
            'numero_documento.unique'      => 'Ya existe un paciente registrado con este documento de identidad (CI).',
            'nombres.required'             => 'Los nombres del paciente son obligatorios.',
            'apellidos.required'           => 'Los apellidos del paciente son obligatorios.',
            'fecha_nacimiento.required'    => 'La fecha de nacimiento es obligatoria.',
            'fecha_nacimiento.before_or_equal' => 'La fecha de nacimiento no puede ser una fecha futura.',
            'sexo.required'                => 'Debe seleccionar el sexo del paciente.',
            'sexo.in'                      => 'El sexo debe ser MASCULINO o FEMENINO.',
            'correo.email'                 => 'El formato del correo electrónico no es válido.',
        ];
    }
}

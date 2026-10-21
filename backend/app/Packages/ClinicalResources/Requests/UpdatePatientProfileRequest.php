<?php

namespace App\Packages\ClinicalResources\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validador para actualización del perfil del paciente en autoservicio (CU05 / §3.4)
 * Solo permite modificar canales de contacto, contacto de emergencia y notificaciones.
 */
class UpdatePatientProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'telefono'               => ['nullable', 'string', 'max:30'],
            'correo'                 => ['nullable', 'email', 'max:120'],
            'direccion'              => ['nullable', 'string', 'max:255'],
            'notificaciones_activas' => ['boolean'],
            'contacto_nombre'        => ['nullable', 'string', 'max:150'],
            'contacto_parentesco'    => ['nullable', 'string', 'max:50'],
            'contacto_telefono'      => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'correo.email' => 'El correo electrónico no tiene un formato válido.',
        ];
    }
}

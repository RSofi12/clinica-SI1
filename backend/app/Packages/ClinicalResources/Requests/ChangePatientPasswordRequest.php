<?php

namespace App\Packages\ClinicalResources\Requests;

use App\Packages\Security\Rules\StrongPasswordRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validador para cambio de contraseña desde el perfil del paciente (CU05)
 */
class ChangePatientPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password'          => ['required', 'string'],
            'new_password'              => ['required', 'string', new StrongPasswordRule()],
            'new_password_confirmation' => ['required', 'same:new_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required'          => 'Debe ingresar su contraseña actual.',
            'new_password.required'              => 'Debe ingresar la nueva contraseña.',
            'new_password_confirmation.required' => 'Debe confirmar la nueva contraseña.',
            'new_password_confirmation.same'     => 'La confirmación de la nueva contraseña no coincide.',
        ];
    }
}

<?php

namespace App\Packages\ClinicalResources\Requests;

use App\Packages\Security\Rules\StrongPasswordRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validador para activación de cuenta web de paciente (CU05 / §3.4)
 */
class ActivatePatientAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero_documento'      => ['required', 'string', 'max:30'],
            'username'              => ['required', 'string', 'min:3', 'max:50', 'unique:usuarios,username', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'email'                 => ['required', 'email', 'max:120', 'unique:usuarios,email'],
            'password'              => ['required', 'string', new StrongPasswordRule()],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }

    public function messages(): array
    {
        return [
            'numero_documento.required' => 'El número de cédula de identidad (CI) es obligatorio.',
            'username.required'         => 'El nombre de usuario es obligatorio.',
            'username.min'              => 'El nombre de usuario debe tener al menos 3 caracteres.',
            'username.unique'           => 'Este nombre de usuario ya se encuentra registrado.',
            'username.regex'            => 'El nombre de usuario solo puede contener letras, números, puntos y guiones.',
            'email.required'            => 'El correo electrónico es obligatorio para el acceso web.',
            'email.email'               => 'El correo electrónico no tiene un formato válido.',
            'email.unique'              => 'Este correo electrónico ya está registrado en otra cuenta.',
            'password.required'         => 'Debe ingresar una contraseña segura.',
            'password_confirmation.same'=> 'Las contraseñas no coinciden.',
        ];
    }
}

<?php

namespace App\Packages\Security\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Packages\Security\Rules\StrongPasswordRule;

/**
 * UserCreateRequest - Validación para CU02: Alta de Usuario
 * Paquete: P1 - Seguridad y Auditoría
 */
class UserCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|min:3|max:50|unique:usuarios,username|regex:/^[a-zA-Z0-9._-]+$/',
            'email' => 'required|email|max:100|unique:usuarios,email',
            'tipo_usuario' => 'required|string|in:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE',
            'password' => ['required', 'string', new StrongPasswordRule()],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'El nombre de usuario es obligatorio.',
            'username.min' => 'El nombre de usuario debe tener al menos 3 caracteres.',
            'username.unique' => 'El nombre de usuario ya se encuentra registrado.',
            'username.regex' => 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El formato del correo electrónico no es válido.',
            'email.unique' => 'El correo electrónico ya se encuentra registrado.',
            'tipo_usuario.required' => 'Debe seleccionar un rol para el usuario.',
            'tipo_usuario.in' => 'El rol seleccionado no es válido en el sistema.',
            'password.required' => 'La contraseña es obligatoria.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Errores de validación en los datos proporcionados.',
            'errors' => $validator->errors(),
        ], 422));
    }
}

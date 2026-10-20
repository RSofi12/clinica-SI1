<?php

namespace App\Packages\Security\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Packages\Security\Rules\StrongPasswordRule;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:usuarios,email',
            'token' => 'required|string',
            'password' => ['required', 'string', new StrongPasswordRule()],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no es válido.',
            'email.exists' => 'No existe ninguna cuenta asociada a este correo electrónico.',
            'token.required' => 'El código de verificación es obligatorio.',
            'password.required' => 'La nueva contraseña es obligatoria.',
        ];
    }
}

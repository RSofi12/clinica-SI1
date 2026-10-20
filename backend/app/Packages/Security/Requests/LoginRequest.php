<?php

namespace App\Packages\Security\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login' => 'required|string|max:120', // Permite username o email
            'password' => 'required|string|min:4',
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'El nombre de usuario o correo electrónico es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
        ];
    }
}

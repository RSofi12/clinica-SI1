<?php

namespace App\Packages\Security\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;
use App\Packages\Security\Rules\StrongPasswordRule;

/**
 * UserUpdateRequest - Validación para CU02: Modificación de Usuario
 * Paquete: P1 - Seguridad y Auditoría
 */
class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'email' => [
                'required',
                'email',
                'max:100',
                Rule::unique('usuarios', 'email')->ignore($userId, 'id_usuario'),
            ],
            'tipo_usuario' => 'required|string|in:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE',
            'password' => ['nullable', 'string', new StrongPasswordRule()],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El formato del correo electrónico no es válido.',
            'email.unique' => 'El correo electrónico ya pertenece a otro usuario.',
            'tipo_usuario.required' => 'Debe seleccionar un rol para el usuario.',
            'tipo_usuario.in' => 'El rol seleccionado no es válido en el sistema.',
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

<?php

namespace App\Packages\Analytics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessVoiceReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autorizado para usuarios autenticados con sesión válida
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'comando_texto' => ['required', 'string', 'min:2', 'max:500'],
            'contexto'      => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'comando_texto.required' => 'El comando de voz o texto es obligatorio.',
            'comando_texto.min'      => 'El comando debe tener al menos 2 caracteres.',
            'comando_texto.max'      => 'El comando no puede exceder los 500 caracteres.',
        ];
    }
}

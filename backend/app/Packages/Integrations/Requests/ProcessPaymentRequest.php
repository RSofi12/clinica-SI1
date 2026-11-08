<?php

namespace App\Packages\Integrations\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest para procesar cobro de cita médica con Stripe Sandbox (CU21)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class ProcessPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_cita'           => ['required', 'integer', 'exists:citas,id_cita'],
            'payment_intent_id' => ['nullable', 'string', 'max:255'],
            'tarjeta_numero'    => ['nullable', 'string', 'max:30'],
            'tarjeta_marca'     => ['nullable', 'string', 'max:30'],
            'tarjeta_exp'       => ['nullable', 'string', 'max:10'],
            'tarjeta_cvc'       => ['nullable', 'string', 'max:4'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_cita.required' => 'La cita médica a pagar es obligatoria.',
            'id_cita.exists'   => 'La cita médica seleccionada no existe en el sistema.',
        ];
    }
}

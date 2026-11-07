<?php

namespace App\Packages\MedicalRecords\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConsultaCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_cita'              => ['required', 'integer', 'exists:citas,id_cita'],
            'motivo_consulta'      => ['required', 'string', 'min:5', 'max:2000'],
            'peso_kg'              => ['nullable', 'numeric', 'between:0.5,350.0'],
            'talla_cm'             => ['nullable', 'numeric', 'between:20.0,260.0'],
            'temperatura_c'        => ['nullable', 'numeric', 'between:30.0,45.0'],
            'presion_arterial'     => ['nullable', 'string', 'max:20'],
            'frecuencia_cardiaca'  => ['nullable', 'integer', 'between:30,220'],
            'observaciones'        => ['nullable', 'string', 'max:2000'],
            'plan_tratamiento'     => ['required', 'string', 'min:5', 'max:4000'],
            'diagnosticos'         => ['required', 'array', 'min:1'],
            'diagnosticos.*.descripcion'  => ['required', 'string', 'max:500'],
            'diagnosticos.*.codigo_cie10' => ['nullable', 'string', 'max:20'],
            'diagnosticos.*.tipo'         => ['required', 'in:PRESUNTIVO,DEFINITIVO'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_cita.required'              => 'El identificador de la cita es obligatorio.',
            'id_cita.exists'                => 'La cita seleccionada no existe en el sistema.',
            'motivo_consulta.required'      => 'El motivo de la consulta es obligatorio.',
            'motivo_consulta.min'           => 'El motivo de consulta debe tener al menos 5 caracteres.',
            'peso_kg.between'               => 'El peso debe situarse entre 0.5 y 350 kg.',
            'talla_cm.between'              => 'La talla debe situarse entre 20 y 260 cm.',
            'temperatura_c.between'         => 'La temperatura debe encontrarse entre 30.0 y 45.0 °C.',
            'frecuencia_cardiaca.between'   => 'La frecuencia cardíaca debe estar entre 30 y 220 lpm.',
            'plan_tratamiento.required'     => 'El plan de tratamiento y conducta terapéutica es obligatorio.',
            'diagnosticos.required'         => 'Debe registrar al menos un diagnóstico médico.',
            'diagnosticos.min'              => 'Debe incluir al menos un diagnóstico médico en la consulta.',
            'diagnosticos.*.descripcion.required' => 'La descripción de cada diagnóstico es obligatoria.',
            'diagnosticos.*.tipo.in'        => 'El tipo de diagnóstico debe ser PRESUNTIVO o DEFINITIVO.',
        ];
    }
}

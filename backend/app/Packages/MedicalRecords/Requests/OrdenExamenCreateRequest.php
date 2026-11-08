<?php

namespace App\Packages\MedicalRecords\Requests;

use App\Packages\MedicalRecords\Models\OrdenExamen;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validar la emisión de una Orden de Examen Auxiliar (CU25)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class OrdenExamenCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_consulta'              => ['required', 'integer', 'exists:consultas_medicas,id_consulta'],
            'tipo_estudio'             => ['required', 'string', Rule::in(OrdenExamen::TIPOS_VALIDOS)],
            'nombre_estudio'           => ['required', 'string', 'min:3', 'max:150'],
            'indicaciones_preparacion' => ['nullable', 'string', 'max:1000'],
            'diagnostico_presuntivo'   => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_consulta.required'     => 'La consulta médica asociada es obligatoria.',
            'id_consulta.exists'       => 'La consulta médica seleccionada no existe en el sistema.',
            'tipo_estudio.required'    => 'El tipo de estudio (Laboratorio, Imagenología, etc.) es obligatorio.',
            'tipo_estudio.in'          => 'El tipo de estudio ingresado no es válido para el catálogo clínico.',
            'nombre_estudio.required'  => 'El nombre específico del estudio o prueba es obligatorio.',
            'nombre_estudio.min'       => 'El nombre del estudio debe tener al menos 3 caracteres.',
            'nombre_estudio.max'       => 'El nombre del estudio no puede superar los 150 caracteres.',
            'indicaciones_preparacion.max' => 'Las indicaciones de preparación no pueden superar los 1000 caracteres.',
            'diagnostico_presuntivo.max'   => 'El diagnóstico presuntivo no puede superar los 255 caracteres.',
        ];
    }
}


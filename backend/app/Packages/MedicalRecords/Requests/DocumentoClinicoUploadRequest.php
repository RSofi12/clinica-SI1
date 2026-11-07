<?php

namespace App\Packages\MedicalRecords\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class DocumentoClinicoUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'tipo_documento' => [
                'required',
                'string',
                'in:FONDO_DE_OJO,TOPOGRAFIA_CORNEAL,OCT,CAMPO_VISUAL,ECOGRAFIA_OCULAR,INFORME_LABORATORIO,INFORME_EXTERNO,CONSENTIMIENTO,OTRO',
            ],
            'titulo' => ['nullable', 'string', 'max:150'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'id_orden' => ['nullable', 'integer', 'exists:ordenes_examenes,id_orden'],
            'id_consulta' => ['nullable', 'integer', 'exists:consultas_medicas,id_consulta'],
            'archivo' => [
                'required',
                'file',
                'max:15360', // 15 MB máximo
                function ($attribute, $value, $fail) {
                    if (!$value instanceof UploadedFile) {
                        return;
                    }
                    $ext = strtolower($value->getClientOriginalExtension());
                    $allowed = ['jpg', 'jpeg', 'png', 'pdf', 'dcm'];
                    if (!in_array($ext, $allowed, true)) {
                        $fail('El archivo seleccionado no tiene un formato admitido. Permitidos: JPG, JPEG, PNG, PDF o DICOM (.dcm).');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo_documento.required' => 'Debe seleccionar una categoría o tipo de documento clínico.',
            'tipo_documento.in'       => 'El tipo de documento clínico seleccionado no es válido.',
            'observaciones.max'       => 'Las observaciones o conclusiones no pueden exceder los 1000 caracteres.',
            'id_orden.exists'         => 'La orden de examen auxiliar especificada no existe en el sistema.',
            'archivo.required'        => 'Debe seleccionar un archivo clínico para adjuntar.',
            'archivo.max'             => 'El archivo supera el tamaño máximo permitido de 15 MB.',
        ];
    }
}

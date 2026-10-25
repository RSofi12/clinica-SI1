<?php

namespace App\Packages\Appointments\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validador para Solicitud de Reserva y Programación de Citas Médicas (CU10 / RF06, RF07)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_paciente' => ['required', 'integer', 'exists:pacientes,id_paciente'],
            'id_medico' => ['required', 'integer', 'exists:medicos,id_medico'],
            'id_especialidad' => ['required', 'integer', 'exists:especialidades,id_especialidad'],
            'id_tipo_cita' => ['required', 'integer', 'exists:tipos_cita,id_tipo_cita'],
            'fecha' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'duracion_minutos' => ['nullable', 'integer', 'min:5', 'max:240'],
            'modalidad' => ['nullable', 'string', 'in:PRESENCIAL,TELEMEDICINA'],
            'motivo_consulta' => ['nullable', 'string', 'max:255'],
            'motivo_breve' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_paciente.required' => 'Debe seleccionar al paciente para la cita.',
            'id_paciente.exists' => 'El paciente seleccionado no se encuentra registrado en el sistema.',
            'id_medico.required' => 'Debe seleccionar al médico profesional.',
            'id_medico.exists' => 'El médico seleccionado no existe en el sistema.',
            'id_especialidad.required' => 'Debe indicar la especialidad médica.',
            'id_especialidad.exists' => 'La especialidad médica no es válida.',
            'id_tipo_cita.required' => 'Debe seleccionar el tipo de cita médica.',
            'id_tipo_cita.exists' => 'El tipo de cita médica no es válido.',
            'fecha.required' => 'La fecha de la cita es obligatoria.',
            'fecha.date_format' => 'El formato de fecha debe ser YYYY-MM-DD.',
            'fecha.after_or_equal' => 'No se pueden programar citas en fechas pasadas (RN06).',
            'hora_inicio.required' => 'La hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'El formato de hora debe ser HH:MM (24 horas).',
            'duracion_minutos.min' => 'La duración de la cita no puede ser inferior a 5 minutos.',
            'duracion_minutos.max' => 'La duración de la cita no puede superar los 240 minutos.',
        ];
    }
}

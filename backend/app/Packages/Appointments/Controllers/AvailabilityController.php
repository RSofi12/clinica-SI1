<?php

namespace App\Packages\Appointments\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Packages\Appointments\Services\AppointmentAvailabilityService;

/**
 * Controlador de Consulta de Disponibilidad de Citas Médicas (CU09 / RF05, RF06)
 * Paquete 3: Gestión de Citas Médicas
 */
class AvailabilityController extends Controller
{
    protected AppointmentAvailabilityService $availabilityService;

    public function __construct(AppointmentAvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    /**
     * Consulta la disponibilidad de turnos libres para un médico y fecha
     * GET /api/appointments/availability?medico_id=1&fecha=2026-10-25&especialidad_id=2
     */
    public function getAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'medico_id' => ['required', 'integer', 'exists:medicos,id_medico'],
            'fecha' => ['required', 'date_format:Y-m-d'],
            'especialidad_id' => ['nullable', 'integer', 'exists:especialidades,id_especialidad'],
        ], [
            'medico_id.required' => 'Debe seleccionar un médico.',
            'medico_id.exists' => 'El médico seleccionado no existe en el sistema.',
            'fecha.required' => 'La fecha de consulta es obligatoria.',
            'fecha.date_format' => 'El formato de fecha debe ser YYYY-MM-DD.',
        ]);

        try {
            $disponibilidad = $this->availabilityService->consultarDisponibilidad(
                (int) $request->input('medico_id'),
                $request->input('fecha'),
                $request->filled('especialidad_id') ? (int) $request->input('especialidad_id') : null
            );

            return response()->json([
                'success' => true,
                'data' => $disponibilidad,
            ]);
        } catch (\Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }
}

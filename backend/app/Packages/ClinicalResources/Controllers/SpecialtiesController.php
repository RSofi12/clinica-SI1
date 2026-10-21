<?php

namespace App\Packages\ClinicalResources\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\Security\Models\Bitacora;

/**
 * Controlador de Especialidades Médicas (CU07 / RF04)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class SpecialtiesController extends Controller
{
    /**
     * Listado del catálogo de especialidades
     */
    public function index(Request $request): JsonResponse
    {
        $query = Especialidad::query();

        // Filtro de estado
        if ($request->has('estado') && !empty($request->estado)) {
            $query->where('estado', strtoupper($request->estado));
        } elseif (!$request->boolean('incluir_inactivas')) {
            $query->activas();
        }

        // Búsqueda textual
        if ($request->filled('q')) {
            $query->buscar($request->q);
        }

        // Filtro por edad del paciente (RF04)
        if ($request->filled('edad') && is_numeric($request->edad)) {
            $edad = (int) $request->edad;
            $query->where(function ($q) use ($edad) {
                $q->whereNull('edad_min_anios')->orWhere('edad_min_anios', '<=', $edad);
            })->where(function ($q) use ($edad) {
                $q->whereNull('edad_max_anios')->orWhere('edad_max_anios', '>=', $edad);
            });
        }

        $especialidades = $query->withCount('doctors')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $especialidades,
        ]);
    }

    /**
     * Crear nueva especialidad médica (CU07)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
            'edad_min_anios' => ['nullable', 'integer', 'min:0', 'max:130'],
            'edad_max_anios' => ['nullable', 'integer', 'min:0', 'max:130'],
            'precio_consulta' => ['nullable', 'numeric', 'min:0'],
        ]);

        $nombreNormalizado = Str::slug($validated['nombre']);

        if (Especialidad::where('nombre_normalizado', $nombreNormalizado)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe una especialidad registrada con este nombre o su variante normalizada.',
            ], 422);
        }

        if (
            isset($validated['edad_min_anios']) &&
            isset($validated['edad_max_anios']) &&
            $validated['edad_min_anios'] > $validated['edad_max_anios']
        ) {
            return response()->json([
                'success' => false,
                'message' => 'La edad mínima no puede ser mayor a la edad máxima.',
            ], 422);
        }

        $especialidad = Especialidad::create([
            'nombre' => $validated['nombre'],
            'nombre_normalizado' => $nombreNormalizado,
            'descripcion' => $validated['descripcion'] ?? null,
            'edad_min_anios' => $validated['edad_min_anios'] ?? null,
            'edad_max_anios' => $validated['edad_max_anios'] ?? null,
            'precio_consulta' => $validated['precio_consulta'] ?? 0.00,
            'estado' => 'ACTIVO',
        ]);

        Bitacora::registrar(
            'CU07: Crear Especialidad',
            "Especialidad '{$especialidad->nombre}' registrada con rango de edad {$especialidad->edad_min_anios}-{$especialidad->edad_max_anios} años.",
            'ESPECIALIDADES'
        );

        return response()->json([
            'success' => true,
            'message' => 'Especialidad médica registrada exitosamente.',
            'data' => $especialidad,
        ], 201);
    }
}

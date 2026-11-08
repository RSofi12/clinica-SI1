<?php

use Illuminate\Support\Facades\Route;

/**
 * Endpoint Raíz del Backend API (Sección 7.1 de la Especificación Oficial)
 * Devuelve estado de salud y metadatos de los servicios RESTful en la nube.
 */
Route::withoutMiddleware(['web'])->get('/', function () {
    return response()->json([
        'aplicacion' => 'Centro Médico La Cruz — Clínica Vida Salud',
        'servicio' => 'Backend API RESTful (Laravel 13 & PostgreSQL)',
        'estado' => 'Activo / Operacional (Online)',
        'base_de_datos' => 'PostgreSQL (Conectada)',
        'ambiente' => config('app.env', 'production'),
        'especificacion' => 'Examen Parcial II — Sistemas de Información I (PUDS)',
        'frontend_oficial' => env('FRONTEND_URL', 'https://clinica-si1.vercel.app'),
        'endpoints_principales' => [
            'autenticacion' => '/api/auth/login',
            'salud_sistema' => '/up',
            'citas' => '/api/appointments',
            'pacientes' => '/api/patients',
            'reportes_kpis' => '/api/analytics/dashboard-kpis',
        ],
    ], 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
});

// Redirección hacia el Frontend en Vercel para cualquier otra ruta web
Route::withoutMiddleware(['web'])->get('/{any}', function () {
    $frontendUrl = env('FRONTEND_URL', 'https://clinica-si1.vercel.app');
    return redirect($frontendUrl);
})->where('any', '^(?!api|up).*$');

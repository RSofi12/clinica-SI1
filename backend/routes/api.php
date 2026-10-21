<?php

use Illuminate\Support\Facades\Route;
use App\Packages\Security\Controllers\AuthController;
use App\Packages\Security\Controllers\UsersController;
use App\Packages\Security\Controllers\RolesController;
use App\Packages\Security\Controllers\AuditController;
use App\Packages\Security\Controllers\SecurityPolicyController;
use App\Packages\ClinicalResources\Controllers\PatientsController;
use App\Packages\ClinicalResources\Controllers\PatientProfileController;

/*
|--------------------------------------------------------------------------
| Rutas API - Paquete 1: Seguridad y Auditoría (CU01, CU02, CU03)
|--------------------------------------------------------------------------
*/

// CU01: Autenticación y Recuperación
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    
    // Rutas protegidas por sesión
    Route::middleware('web')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// CU02: Gestión de Usuarios (RF01)
Route::prefix('users')->middleware('web')->group(function () {
    Route::get('/', [UsersController::class, 'index']);
    Route::post('/', [UsersController::class, 'store']);
    Route::get('/{id}', [UsersController::class, 'show']);
    Route::put('/{id}', [UsersController::class, 'update']);
    Route::patch('/{id}/toggle-status', [UsersController::class, 'toggleStatus']);
    Route::post('/{id}/unlock', [UsersController::class, 'unlock']);
});

// Catálogo de Roles y Permisos para selectores
Route::prefix('roles')->middleware('web')->group(function () {
    Route::get('/', [RolesController::class, 'index']);
});

// CU03: Gestión de Bitácora de Auditoría
Route::prefix('audit')->middleware('web')->group(function () {
    Route::get('/', [AuditController::class, 'index']);
    Route::get('/filters-data', [AuditController::class, 'filtersData']);
    Route::get('/stats', [AuditController::class, 'stats']);
});

// Políticas de Seguridad y Bloqueo Temporal (CU01 / CU02)
Route::prefix('security')->middleware('web')->group(function () {
    Route::get('/policy', [SecurityPolicyController::class, 'getPolicy']);
    Route::put('/policy', [SecurityPolicyController::class, 'updatePolicy']);
});

// CU04: Gestión de Pacientes (RF02) — Paquete 2: Recursos Clínicos
Route::prefix('patients')->middleware('web')->group(function () {
    Route::get('/', [PatientsController::class, 'index']);
    Route::get('/stats', [PatientsController::class, 'stats']);
    Route::get('/search-ci/{ci}', [PatientsController::class, 'searchByCi']);
    Route::get('/{id}', [PatientsController::class, 'show']);
    Route::post('/', [PatientsController::class, 'store']);
    Route::put('/{id}', [PatientsController::class, 'update']);
    Route::patch('/{id}/toggle-status', [PatientsController::class, 'toggleStatus']);
    Route::post('/{id}/enable-web-account', [PatientsController::class, 'enableWebAccount']);
});

// CU05: Gestión de Cuenta y Perfil del Paciente (§3.4 / Autoservicio)
Route::prefix('patient')->group(function () {
    // Activación pública de cuenta web con CI
    Route::post('/check-ci', [PatientProfileController::class, 'checkCi']);
    Route::post('/activate-account', [PatientProfileController::class, 'activateAccount']);
});

Route::prefix('patient-profile')->middleware('web')->group(function () {
    Route::get('/me', [PatientProfileController::class, 'me']);
    Route::put('/me', [PatientProfileController::class, 'updateProfile']);
    Route::put('/change-password', [PatientProfileController::class, 'changePassword']);
});

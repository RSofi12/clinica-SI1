<?php

use Illuminate\Support\Facades\Route;
use App\Packages\Security\Controllers\AuthController;
use App\Packages\Security\Controllers\UsersController;
use App\Packages\Security\Controllers\RolesController;
use App\Packages\Security\Controllers\AuditController;
use App\Packages\Security\Controllers\SecurityPolicyController;
use App\Packages\ClinicalResources\Controllers\PatientsController;
use App\Packages\ClinicalResources\Controllers\PatientProfileController;
use App\Packages\ClinicalResources\Controllers\DoctorsController;
use App\Packages\ClinicalResources\Controllers\SpecialtiesController;
use App\Packages\ClinicalResources\Controllers\SchedulesController;
use App\Packages\Appointments\Controllers\AvailabilityController;
use App\Packages\Appointments\Controllers\AppointmentsController;

/*
|--------------------------------------------------------------------------
| Rutas API - Paquete 1: Seguridad y Auditoría (CU01, CU02, CU03)
|--------------------------------------------------------------------------
*/

// CU01: Autenticación y Recuperación
Route::prefix('auth')->middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/me', [AuthController::class, 'me'])->middleware('role');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('role');
});

// CU02: Gestión de Usuarios, Roles y Permisos (RF01 - Exclusivo Administrador)
Route::prefix('users')->middleware(['web', 'role:ADMIN'])->group(function () {
    Route::get('/', [UsersController::class, 'index']);
    Route::post('/', [UsersController::class, 'store']);
    Route::get('/{id}', [UsersController::class, 'show']);
    Route::put('/{id}', [UsersController::class, 'update']);
    Route::patch('/{id}/toggle-status', [UsersController::class, 'toggleStatus']);
    Route::post('/{id}/unlock', [UsersController::class, 'unlock']);
});

// Catálogo de Roles y Permisos para selectores (ADMIN y RECEPCIONISTA)
Route::prefix('roles')->middleware(['web', 'role:ADMIN,RECEPCIONISTA'])->group(function () {
    Route::get('/', [RolesController::class, 'index']);
});

// CU03: Gestión de Bitácora de Auditoría (Exclusivo Administrador)
Route::prefix('audit')->middleware(['web', 'role:ADMIN'])->group(function () {
    Route::get('/', [AuditController::class, 'index']);
    Route::get('/filters-data', [AuditController::class, 'filtersData']);
    Route::get('/stats', [AuditController::class, 'stats']);
});

// Políticas de Seguridad y Bloqueo Temporal (CU01 / CU02 - Exclusivo Administrador)
Route::prefix('security')->middleware(['web', 'role:ADMIN'])->group(function () {
    Route::get('/policy', [SecurityPolicyController::class, 'getPolicy']);
    Route::put('/policy', [SecurityPolicyController::class, 'updatePolicy']);
});

// CU04: Gestión de Pacientes (RF02) — Paquete 2: Recursos Clínicos
Route::prefix('patients')->middleware('web')->group(function () {
    // Consulta permitida a personal médico y administrativo (Paciente excluido)
    Route::get('/', [PatientsController::class, 'index'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
    Route::get('/stats', [PatientsController::class, 'stats'])->middleware('role:ADMIN,RECEPCIONISTA');
    Route::get('/search-ci/{ci}', [PatientsController::class, 'searchByCi'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
    Route::get('/{id}', [PatientsController::class, 'show'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');

    // Mutaciones administrativas exclusivas de Recepcionista y Administrador
    Route::post('/', [PatientsController::class, 'store'])->middleware('role:ADMIN,RECEPCIONISTA');
    Route::put('/{id}', [PatientsController::class, 'update'])->middleware('role:ADMIN,RECEPCIONISTA');
    Route::patch('/{id}/toggle-status', [PatientsController::class, 'toggleStatus'])->middleware('role:ADMIN,RECEPCIONISTA');
    Route::post('/{id}/enable-web-account', [PatientsController::class, 'enableWebAccount'])->middleware('role:ADMIN,RECEPCIONISTA');
});

// CU05: Gestión de Cuenta y Perfil del Paciente (§3.4 / Autoservicio)
Route::prefix('patient')->group(function () {
    // Activación pública de cuenta web con CI
    Route::post('/check-ci', [PatientProfileController::class, 'checkCi']);
    Route::post('/activate-account', [PatientProfileController::class, 'activateAccount']);
});

Route::prefix('patient-profile')->middleware(['web', 'role:PACIENTE,ADMIN'])->group(function () {
    Route::get('/me', [PatientProfileController::class, 'me']);
    Route::put('/me', [PatientProfileController::class, 'updateProfile']);
    Route::put('/change-password', [PatientProfileController::class, 'changePassword']);
});

// CU06: Gestión de Médicos y Especialistas (RF03 - Actor Médico Unificado)
Route::prefix('doctors')->middleware('web')->group(function () {
    // Lectura de catálogo para asignaciones y reservas
    Route::get('/', [DoctorsController::class, 'index'])->middleware('role');
    Route::get('/stats', [DoctorsController::class, 'stats'])->middleware('role:ADMIN,RECEPCIONISTA');
    Route::get('/{id}', [DoctorsController::class, 'show'])->middleware('role');

    // Mutaciones exclusivas del Administrador (CU06)
    Route::post('/', [DoctorsController::class, 'store'])->middleware('role:ADMIN');
    Route::put('/{id}', [DoctorsController::class, 'update'])->middleware('role:ADMIN');
    Route::patch('/{id}/toggle-status', [DoctorsController::class, 'toggleStatus'])->middleware('role:ADMIN');
});

// CU07: Catálogo de Especialidades Médicas (RF04)
Route::prefix('specialties')->middleware('web')->group(function () {
    Route::get('/', [SpecialtiesController::class, 'index']); // Abierto para reserva
    Route::post('/', [SpecialtiesController::class, 'store'])->middleware('role:ADMIN'); // Exclusivo Administrador
});

// CU08: Gestión de Horarios de Atención y Bloqueos (RF05)
Route::prefix('schedules')->middleware('web')->group(function () {
    Route::get('/doctors/{id}', [SchedulesController::class, 'getDoctorSchedule'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
    Route::get('/blocks', [SchedulesController::class, 'getBlocks'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');

    // Mutaciones de horarios y bloqueos exclusivas del Administrador
    Route::post('/doctors/{id}', [SchedulesController::class, 'saveDoctorSchedule'])->middleware('role:ADMIN');
    Route::post('/blocks', [SchedulesController::class, 'storeBlock'])->middleware('role:ADMIN');
    Route::delete('/blocks/{id}', [SchedulesController::class, 'deleteBlock'])->middleware('role:ADMIN');
});

// CU09, CU10, CU12, CU14, CU15: Gestión, Agenda, Historial y Cancelación de Citas Médicas
Route::prefix('appointments')->middleware('web')->group(function () {
    // CU09: Disponibilidad y catálogos de reserva
    Route::get('/availability', [AvailabilityController::class, 'getAvailability']);
    Route::get('/booking-form-data', [AppointmentsController::class, 'getBookingFormData']);

    // CU14: Agenda médica diaria (Excluye al Paciente)
    Route::get('/doctor-agenda', [AppointmentsController::class, 'doctorAgenda'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');

    // CU15: Historial cronológico de citas (con scoping)
    Route::get('/patient-history/{id}', [AppointmentsController::class, 'patientHistory'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');

    // CU10 / CU12: Gestión general, Programación, Detalle y Cancelación
    Route::get('/', [AppointmentsController::class, 'index'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::post('/', [AppointmentsController::class, 'store'])->middleware('role:ADMIN,RECEPCIONISTA,PACIENTE');
    Route::get('/{id}', [AppointmentsController::class, 'show'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::post('/{id}/cancel', [AppointmentsController::class, 'cancel'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
});




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
use App\Packages\MedicalRecords\Controllers\ConsultasController;
use App\Packages\MedicalRecords\Controllers\AntecedentesController;
use App\Packages\MedicalRecords\Controllers\RecetasController;
use App\Packages\MedicalRecords\Controllers\ExpedienteController;
use App\Packages\MedicalRecords\Controllers\DocumentosClinicosController;
use App\Packages\MedicalRecords\Controllers\OrdenesExamenesController;
use App\Packages\Integrations\Controllers\PaymentsController;
use App\Packages\Integrations\Controllers\NotificationsController;
use App\Packages\Analytics\Controllers\VoiceReportController;
use App\Packages\Analytics\Controllers\DashboardController;
use App\Packages\Analytics\Controllers\ReportsController;

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

    // CU10 / CU11 / CU12 / CU13: Gestión general, Programación, Reprogramación, Detalle, Cancelación y Estados
    Route::get('/', [AppointmentsController::class, 'index'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::post('/', [AppointmentsController::class, 'store'])->middleware('role:ADMIN,RECEPCIONISTA,PACIENTE');
    Route::get('/{id}', [AppointmentsController::class, 'show'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::patch('/{id}/reschedule', [AppointmentsController::class, 'reschedule'])->middleware('role:ADMIN,RECEPCIONISTA,PACIENTE');
    Route::post('/{id}/cancel', [AppointmentsController::class, 'cancel'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::patch('/{id}/status', [AppointmentsController::class, 'updateStatus'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
    Route::get('/{id}/status-history', [AppointmentsController::class, 'statusHistory'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
});

// CU16 / CU17: Historial Clínico, Consultas Médicas y Antecedentes (Paquete 4)
Route::prefix('medical-records')->middleware('web')->group(function () {
    // CU16: Consultas Médicas y Triaje
    Route::get('/consultas', [ConsultasController::class, 'index'])->middleware('role:ADMIN,MEDICO,PACIENTE');
    Route::get('/consultas/{id}', [ConsultasController::class, 'show'])->middleware('role:ADMIN,MEDICO,PACIENTE');
    Route::get('/citas/{id_cita}/preparar', [ConsultasController::class, 'preparar'])->middleware('role:ADMIN,MEDICO');
    Route::post('/consultas', [ConsultasController::class, 'store'])->middleware('role:ADMIN,MEDICO');

    // CU17: Gestionar Antecedentes Médicos
    Route::get('/patients/{patientId}/antecedentes', [AntecedentesController::class, 'indexByPatient'])->middleware('role:ADMIN,MEDICO,PACIENTE');
    Route::post('/patients/{patientId}/antecedentes', [AntecedentesController::class, 'store'])->middleware('role:ADMIN,MEDICO');
    Route::put('/antecedentes/{id}', [AntecedentesController::class, 'update'])->middleware('role:ADMIN,MEDICO');
    Route::patch('/antecedentes/{id}/toggle-status', [AntecedentesController::class, 'toggleStatus'])->middleware('role:ADMIN,MEDICO');

    // CU18: Gestionar Expediente Clínico Digital — Emisión de Recetas Médicas (Exclusivo Médico y Admin)
    Route::get('/recetas', [RecetasController::class, 'index'])->middleware('role:ADMIN,MEDICO');
    Route::get('/recetas/{id}', [RecetasController::class, 'show'])->middleware('role:ADMIN,MEDICO');
    Route::get('/consultas/{idConsulta}/recetas', [RecetasController::class, 'byConsulta'])->middleware('role:ADMIN,MEDICO');
    Route::post('/recetas', [RecetasController::class, 'store'])->middleware('role:ADMIN,MEDICO');
    Route::patch('/recetas/{id}/anular', [RecetasController::class, 'anular'])->middleware('role:ADMIN,MEDICO');

    // CU19: Consultar Expediente Médico y Antecedentes Clínicos
    Route::get('/expediente/mi-expediente', [ExpedienteController::class, 'miExpediente'])->middleware('role:PACIENTE');
    Route::get('/expediente/paciente/{idPaciente}', [ExpedienteController::class, 'showByPatient'])->middleware('role:ADMIN,MEDICO');
    Route::get('/expediente/paciente/{idPaciente}/timeline', [ExpedienteController::class, 'timeline'])->middleware('role:ADMIN,MEDICO,PACIENTE');

    // CU26: Gestionar Documentos Clínicos Adjuntos (Cloudinary / DICOM / Órdenes CU25)
    Route::get('/historias/{idHistoria}/documentos', [DocumentosClinicosController::class, 'index'])->middleware('role:ADMIN,MEDICO,PACIENTE');
    Route::post('/historias/{idHistoria}/documentos', [DocumentosClinicosController::class, 'store'])->middleware('role:ADMIN,MEDICO');
    Route::get('/historias/{idHistoria}/ordenes-pendientes', [DocumentosClinicosController::class, 'ordenesPendientes'])->middleware('role:ADMIN,MEDICO');
    Route::delete('/documentos/{id}', [DocumentosClinicosController::class, 'destroy'])->middleware('role:ADMIN,MEDICO');

    // CU25: Emitir Órdenes de Exámenes Auxiliares (Laboratorio e Imagenología)
    Route::get('/ordenes-examenes', [OrdenesExamenesController::class, 'index'])->middleware('role:ADMIN,MEDICO,PACIENTE,RECEPCIONISTA');
    Route::get('/ordenes-examenes/{id}', [OrdenesExamenesController::class, 'show'])->middleware('role:ADMIN,MEDICO,PACIENTE,RECEPCIONISTA');
    Route::get('/consultas/{idConsulta}/ordenes-examenes', [OrdenesExamenesController::class, 'byConsulta'])->middleware('role:ADMIN,MEDICO,PACIENTE');
    Route::get('/historias/{idHistoria}/ordenes-examenes', [OrdenesExamenesController::class, 'byHistoria'])->middleware('role:ADMIN,MEDICO,PACIENTE');
    Route::post('/ordenes-examenes', [OrdenesExamenesController::class, 'store'])->middleware('role:ADMIN,MEDICO');
    Route::patch('/ordenes-examenes/{id}/anular', [OrdenesExamenesController::class, 'anular'])->middleware('role:ADMIN,MEDICO');
});

// CU22: Reportes con Filtros Dinámicos (RF13 - Paquete 6: Reportes y Analítica)
Route::prefix('analytics/reports')->middleware('web')->group(function () {
    Route::get('/catalogs', [ReportsController::class, 'catalogs'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
    Route::get('/dynamic', [ReportsController::class, 'generate'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
    Route::get('/export-csv', [ReportsController::class, 'export'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO');
});

// CU23 / CU24: Reportes, Analítica y Dashboard de KPIs (Paquete 6: Exclusivo Administrador)
Route::prefix('analytics')->middleware('web')->group(function () {
    Route::post('/voice-report', [VoiceReportController::class, 'processVoiceCommand'])->middleware('role:ADMIN');
    Route::get('/voice-history', [VoiceReportController::class, 'history'])->middleware('role:ADMIN');
    Route::get('/voice-stats', [VoiceReportController::class, 'stats'])->middleware('role:ADMIN');
    Route::get('/dashboard-kpis', [DashboardController::class, 'getKpis'])->middleware('role:ADMIN');
});

// CU21: Pasarela de Pagos Stripe Sandbox (Paquete 5: Integraciones Externas y Pagos)
Route::prefix('payments')->middleware('web')->group(function () {
    Route::get('/', [PaymentsController::class, 'index'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::post('/create-intent', [PaymentsController::class, 'createIntent'])->middleware('role:ADMIN,RECEPCIONISTA,PACIENTE');
    Route::post('/process', [PaymentsController::class, 'process'])->middleware('role:ADMIN,RECEPCIONISTA,PACIENTE');
    Route::get('/receipt/{id}', [PaymentsController::class, 'receipt'])->middleware('role:ADMIN,RECEPCIONISTA,PACIENTE');
});

// CU20: Enviar Recordatorios y Notificaciones (Paquete 5: Integraciones Externas y Pagos)
Route::prefix('notifications')->middleware('web')->group(function () {
    Route::get('/', [NotificationsController::class, 'index'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::get('/unread-count', [NotificationsController::class, 'unreadCount'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::patch('/{id}/read', [NotificationsController::class, 'markAsRead'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::post('/read-all', [NotificationsController::class, 'markAllAsRead'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::delete('/{id}', [NotificationsController::class, 'destroy'])->middleware('role:ADMIN,RECEPCIONISTA,MEDICO,PACIENTE');
    Route::post('/trigger-reminders', [NotificationsController::class, 'triggerReminders'])->middleware('role:ADMIN,RECEPCIONISTA');
});






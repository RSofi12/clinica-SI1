<?php

use Illuminate\Support\Facades\Route;
use App\Packages\Security\Controllers\AuthController;
use App\Packages\Security\Controllers\UsersController;
use App\Packages\Security\Controllers\RolesController;

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

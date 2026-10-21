<?php

namespace App\Packages\Security\Controllers;

use App\Http\Controllers\Controller;
use App\Packages\Security\Models\User;
use App\Packages\Security\Models\PasswordResetToken;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\SecurityConfig;
use App\Packages\Security\Requests\LoginRequest;
use App\Packages\Security\Requests\ResetPasswordRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * AuthController - CU01: Autenticar Usuario (RF01)
 * Paquete: P1 - Seguridad y Auditoría
 */
class AuthController extends Controller
{
    /**
     * Iniciar Sesión (POST /api/auth/login)
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $login = trim($request->input('login'));
        $password = $request->input('password');

        $user = User::where('username', $login)
            ->orWhere('email', $login)
            ->first();

        // Soporte de inicio de sesión con Carnet de Identidad (CI) para Pacientes (CU05)
        if (!$user) {
            $paciente = \App\Packages\ClinicalResources\Models\Patient::where('numero_documento', $login)
                ->whereNotNull('id_usuario')
                ->first();
            if ($paciente) {
                $user = User::find($paciente->id_usuario);
            }
        }

        $ip = $request->ip();

        if (!$user) {
            Bitacora::registrar(null, 'Seguridad', 'LOGIN_FALLIDO', 'usuarios', null, "Intento fallido con usuario/correo inexistente: {$login}", $ip);
            return response()->json([
                'success' => false,
                'message' => 'Las credenciales proporcionadas son incorrectas.',
            ], 401);
        }

        $policy = SecurityConfig::obtenerPoliticaActiva();

        // Verificación de bloqueo (Temporal o Administrativo)
        if ($user->estaBloqueadoTemporalmente()) {
            $segundosRestantes = $user->segundosRestantesBloqueo();

            if ($segundosRestantes > 0) {
                $minutos = ceil($segundosRestantes / 60);
                Bitacora::registrar(
                    $user->id_usuario,
                    'Seguridad',
                    'LOGIN_BLOQUEADO',
                    'usuarios',
                    $user->id_usuario,
                    "Intento de acceso durante bloqueo temporal ({$segundosRestantes}s restantes).",
                    $ip
                );

                return response()->json([
                    'success' => false,
                    'is_temporarily_locked' => true,
                    'seconds_remaining' => $segundosRestantes,
                    'locked_until' => $user->bloqueado_hasta ? $user->bloqueado_hasta->toISOString() : null,
                    'message' => "Su cuenta se encuentra bloqueada temporalmente por seguridad. Podrá volver a intentar en {$minutos} minuto(s).",
                ], 423);
            }

            // Bloqueo manual permanente sin fecha límite
            Bitacora::registrar($user->id_usuario, 'Seguridad', 'LOGIN_BLOQUEADO', 'usuarios', $user->id_usuario, 'Intento de acceso a cuenta con bloqueo administrativo permanente.', $ip);
            return response()->json([
                'success' => false,
                'is_temporarily_locked' => false,
                'message' => 'Su cuenta ha sido bloqueada debido a reiterados intentos fallidos. Contacte al administrador.',
            ], 403);
        }

        if ($user->estado === 'INACTIVO') {
            return response()->json([
                'success' => false,
                'message' => 'Su cuenta se encuentra inactiva.',
            ], 403);
        }

        if (!$user->autenticar($password)) {
            $maxIntentos = $policy->max_intentos_fallidos;
            $minutosBloqueo = $policy->minutos_bloqueo;

            $user->registrarIntentoFallido($maxIntentos, $minutosBloqueo);

            if ($user->estado === 'BLOQUEADO') {
                Bitacora::registrar(
                    $user->id_usuario,
                    'Seguridad',
                    'LOGIN_BLOQUEADO',
                    'usuarios',
                    $user->id_usuario,
                    "Cuenta bloqueada por {$minutosBloqueo} minutos tras {$user->intentos_fallidos} intentos fallidos.",
                    $ip
                );

                return response()->json([
                    'success' => false,
                    'is_temporarily_locked' => true,
                    'seconds_remaining' => $user->segundosRestantesBloqueo(),
                    'locked_until' => $user->bloqueado_hasta ? $user->bloqueado_hasta->toISOString() : null,
                    'message' => "Ha alcanzado el límite de {$maxIntentos} intentos fallidos. Su cuenta ha sido bloqueada temporalmente durante {$minutosBloqueo} minutos.",
                ], 423);
            }

            $intentosRestantes = max(0, $maxIntentos - $user->intentos_fallidos);
            Bitacora::registrar(
                $user->id_usuario,
                'Seguridad',
                'LOGIN_FALLIDO',
                'usuarios',
                $user->id_usuario,
                "Contraseña incorrecta. Intento fallido #{$user->intentos_fallidos} de {$maxIntentos}.",
                $ip
            );

            return response()->json([
                'success' => false,
                'message' => "Las credenciales son incorrectas. Le quedan {$intentosRestantes} intento(s) antes del bloqueo temporal.",
                'attempts_left' => $intentosRestantes,
            ], 401);
        }

        $user->actualizarUltimoAcceso();
        Auth::login($user);

        Bitacora::registrar($user->id_usuario, 'Seguridad', 'LOGIN_EXITOSO', 'usuarios', $user->id_usuario, 'Inicio de sesión satisfactorio.', $ip);

        $user->load('roles.permisos');

        return response()->json([
            'success' => true,
            'message' => 'Bienvenido al sistema.',
            'user' => [
                'id_usuario' => $user->id_usuario,
                'username' => $user->username,
                'email' => $user->email,
                'tipo_usuario' => $user->tipo_usuario,
                'estado' => $user->estado,
                'ultimo_acceso' => $user->ultimo_acceso,
                'roles' => $user->roles->pluck('nombre'),
            ],
        ]);
    }

    /**
     * Solicitar Código de Recuperación (POST /api/auth/forgot-password)
     * Genera código de 6 dígitos en tokens_recuperacion (expira en 15 minutos).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Formato de correo no válido.',
        ]);

        $email = trim($request->input('email'));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No encontramos ninguna cuenta registrada con este correo electrónico.',
            ], 404);
        }

        // Generar código numérico de 6 dígitos
        $codigo = (string) random_int(100000, 999999);

        // Invalidar tokens previos
        PasswordResetToken::where('id_usuario', $user->id_usuario)
            ->where('usado', false)
            ->update(['usado' => true]);

        // Guardar token con vigencia de 15 minutos
        PasswordResetToken::create([
            'id_usuario' => $user->id_usuario,
            'token_hash' => Hash::make($codigo),
            'tipo_token' => 'RECUPERACION_PASSWORD',
            'fecha_creacion' => now(),
            'fecha_expiracion' => now()->addMinutes(15),
            'usado' => false,
        ]);

        Bitacora::registrar($user->id_usuario, 'Seguridad', 'SOLICITUD_RESET_PASSWORD', 'tokens_recuperacion', null, "Solicitud de recuperación de contraseña para {$email}", $request->ip());

        // Intento de envío por email configurado en Laravel
        try {
            Mail::raw("Centro Médico La Cruz\n\nTu código de recuperación es: {$codigo}\nEste código expirará en 15 minutos.\nSi no solicitaste este cambio, puedes ignorar este mensaje.", function ($msg) use ($email) {
                $msg->to($email)->subject('Código de Recuperación de Contraseña — Centro Médico La Cruz');
            });
        } catch (\Throwable $e) {
            // Si el driver de correo no está en producción, no bloqueamos la respuesta
        }

        return response()->json([
            'success' => true,
            'message' => 'Se ha enviado un código de verificación a su correo electrónico.',
        ]);
    }

    /**
     * Restablecer Contraseña con Código (POST /api/auth/reset-password)
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = trim($request->input('email'));
        $codigo = trim($request->input('token'));
        $nuevaPassword = $request->input('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        // Buscar token activo
        $tokenRecord = PasswordResetToken::where('id_usuario', $user->id_usuario)
            ->where('usado', false)
            ->where('fecha_expiracion', '>', now())
            ->latest('id_token')
            ->first();

        if (!$tokenRecord || !Hash::check($codigo, $tokenRecord->token_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'El código de verificación es inválido o ha expirado.',
            ], 422);
        }

        // Actualizar contraseña usando método de dominio
        $user->recuperarPassword($nuevaPassword);
        $tokenRecord->marcarComoUsado();

        // Si estaba bloqueado, se restaura a ACTIVO
        if ($user->estado === 'BLOQUEADO') {
            $user->estado = 'ACTIVO';
            $user->intentos_fallidos = 0;
            $user->save();
        }

        Bitacora::registrar($user->id_usuario, 'Seguridad', 'RESET_PASSWORD_EXITOSO', 'usuarios', $user->id_usuario, 'Contraseña restablecida exitosamente.', $request->ip());

        return response()->json([
            'success' => true,
            'message' => 'Su contraseña ha sido actualizada exitosamente. Ya puede iniciar sesión.',
        ]);
    }

    /**
     * Obtener Usuario en Sesión (GET /api/auth/me)
     */
    public function me(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No hay una sesión activa.',
            ], 401);
        }

        /** @var User $user */
        $user->load('roles.permisos');

        return response()->json([
            'success' => true,
            'user' => [
                'id_usuario' => $user->id_usuario,
                'username' => $user->username,
                'email' => $user->email,
                'tipo_usuario' => $user->tipo_usuario,
                'estado' => $user->estado,
                'roles' => $user->roles->pluck('nombre'),
            ],
        ]);
    }

    /**
     * Cerrar Sesión (POST /api/auth/logout)
     */
    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($user) {
            Bitacora::registrar($user->id_usuario, 'Seguridad', 'LOGOUT', 'usuarios', $user->id_usuario, 'Cierre de sesión seguro.', $request->ip());
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesión finalizada correctamente.',
        ]);
    }
}

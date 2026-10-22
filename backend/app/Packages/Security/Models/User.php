<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;

/**
 * Modelo User (Usuarios)
 * Paquete: P1 - Seguridad y Auditoría
 * Mapeo: Tabla 'usuarios' (DDL) y Clase 'Usuarios' (diagrama_de_clases.puml)
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';
    public $timestamps = false; // Manejado explícitamente con fecha_creacion y fecha_actualizacion

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'tipo_usuario',
        'estado',
        'intentos_fallidos',
        'bloqueado_hasta',
        'ultimo_acceso',
        'fecha_creacion',
        'fecha_actualizacion',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'ultimo_acceso' => 'datetime',
            'bloqueado_hasta' => 'datetime',
            'fecha_creacion' => 'datetime',
            'fecha_actualizacion' => 'datetime',
            'intentos_fallidos' => 'integer',
        ];
    }

    protected $appends = [
        'rol',
    ];

    /**
     * Accessor de compatibilidad para $user->rol mapeado a tipo_usuario
     */
    public function getRolAttribute(): ?string
    {
        return $this->tipo_usuario;
    }

    /**
     * Requerimiento nativo de Laravel Auth para obtener el hash de la contraseña.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    // =========================================================================
    // MÉTODOS DE DOMINIO (diagrama_de_clases.puml)
    // =========================================================================

    /**
     * + autenticar(password: String): Boolean
     */
    public function autenticar(string $password): bool
    {
        return Hash::check($password, $this->password_hash);
    }

    /**
     * + estaBloqueadoTemporalmente(): Boolean
     * Evalúa si el usuario se encuentra penalizado temporalmente.
     * Si el tiempo ya transcurrió, se auto-desbloquea de forma transparente.
     */
    public function estaBloqueadoTemporalmente(): bool
    {
        if ($this->estado !== 'BLOQUEADO') {
            return false;
        }

        if ($this->bloqueado_hasta) {
            if (now()->lessThan($this->bloqueado_hasta)) {
                return true; // Sigue bloqueado
            }

            // Expiró el tiempo de penalización: auto-desbloqueo transparente
            $this->estado = 'ACTIVO';
            $this->intentos_fallidos = 0;
            $this->bloqueado_hasta = null;
            $this->fecha_actualizacion = now();
            $this->save();

            return false;
        }

        // Si no tiene bloqueado_hasta pero el estado es BLOQUEADO, es bloqueo manual
        return true;
    }

    /**
     * Obtiene los segundos restantes de penalización
     */
    public function segundosRestantesBloqueo(): int
    {
        if ($this->bloqueado_hasta && now()->lessThan($this->bloqueado_hasta)) {
            return (int) now()->diffInSeconds($this->bloqueado_hasta, false);
        }
        return 0;
    }

    /**
     * + recuperarPassword(token: String): Boolean
     */
    public function recuperarPassword(string $nuevoPassword): void
    {
        $this->password_hash = Hash::make($nuevoPassword);
        $this->fecha_actualizacion = now();
        $this->save();
    }

    /**
     * + bloquearAcceso(): Void
     */
    public function bloquearAcceso(?int $minutos = null): void
    {
        $this->estado = 'BLOQUEADO';
        $this->bloqueado_hasta = $minutos ? now()->addMinutes($minutos) : null;
        $this->fecha_actualizacion = now();
        $this->save();
    }

    /**
     * + actualizarUltimoAcceso(): Void
     */
    public function actualizarUltimoAcceso(): void
    {
        $this->ultimo_acceso = now();
        $this->intentos_fallidos = 0;
        $this->bloqueado_hasta = null;
        $this->fecha_actualizacion = now();
        $this->save();
    }

    /**
     * Incrementa intentos fallidos y bloquea temporalmente si alcanza el límite
     */
    public function registrarIntentoFallido(int $maxIntentos = 3, int $minutosBloqueo = 5): void
    {
        $this->intentos_fallidos += 1;
        if ($this->intentos_fallidos >= $maxIntentos) {
            $this->bloquearAcceso($minutosBloqueo);
        } else {
            $this->fecha_actualizacion = now();
            $this->save();
        }
    }

    // =========================================================================
    // RELACIONES ELOQUENT
    // =========================================================================

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'usuario_rol', 'id_usuario', 'id_rol');
    }

    public function tokensRecuperacion()
    {
        return $this->hasMany(PasswordResetToken::class, 'id_usuario', 'id_usuario');
    }

    public function bitacoras()
    {
        return $this->hasMany(Bitacora::class, 'id_usuario', 'id_usuario');
    }
}

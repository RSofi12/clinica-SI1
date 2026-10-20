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
            'fecha_creacion' => 'datetime',
            'fecha_actualizacion' => 'datetime',
            'intentos_fallidos' => 'integer',
        ];
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
    public function bloquearAcceso(): void
    {
        $this->estado = 'BLOQUEADO';
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
        $this->fecha_actualizacion = now();
        $this->save();
    }

    /**
     * Incrementa intentos fallidos y bloquea si llega a 5.
     */
    public function registrarIntentoFallido(): void
    {
        $this->intentos_fallidos += 1;
        if ($this->intentos_fallidos >= 5) {
            $this->bloquearAcceso();
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
        return $this->hasMany(AuditLog::class, 'id_usuario', 'id_usuario');
    }
}

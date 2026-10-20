<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo PasswordResetToken (TokensRecuperacion)
 * Paquete: P1 - Seguridad y Auditoría
 * Mapeo: Tabla 'tokens_recuperacion' (DDL) y Clase 'TokensRecuperacion' (diagrama_de_clases.puml)
 */
class PasswordResetToken extends Model
{
    protected $table = 'tokens_recuperacion';
    protected $primaryKey = 'id_token';
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'token_hash',
        'tipo_token',
        'fecha_creacion',
        'fecha_expiracion',
        'usado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_creacion' => 'datetime',
            'fecha_expiracion' => 'datetime',
            'usado' => 'boolean',
        ];
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function validarToken(): bool
    {
        return !$this->usado && $this->fecha_expiracion->isFuture();
    }

    public function marcarComoUsado(): void
    {
        $this->usado = true;
        $this->save();
    }
}

<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo AuditLog (Bitacora)
 * Paquete: P1 - Seguridad y Auditoría
 * Mapeo: Tabla 'bitacora' (DDL) y Clase 'Bitacora' (diagrama_de_clases.puml)
 */
class AuditLog extends Model
{
    protected $table = 'bitacora';
    protected $primaryKey = 'id_bitacora';
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'modulo',
        'accion',
        'tabla_afectada',
        'id_registro',
        'descripcion',
        'ip_origen',
        'fecha_registro',
    ];

    protected function casts(): array
    {
        return [
            'fecha_registro' => 'datetime',
        ];
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    /**
     * + registrarEvento(u: Long, acc: String): Void
     */
    public static function registrar(
        ?int $idUsuario,
        string $modulo,
        string $accion,
        ?string $tablaAfectada = null,
        ?int $idRegistro = null,
        ?string $descripcion = null,
        ?string $ip = null
    ): self {
        return self::create([
            'id_usuario' => $idUsuario,
            'modulo' => $modulo,
            'accion' => $accion,
            'tabla_afectada' => $tablaAfectada,
            'id_registro' => $idRegistro,
            'descripcion' => $descripcion,
            'ip_origen' => $ip,
            'fecha_registro' => now(),
        ]);
    }
}

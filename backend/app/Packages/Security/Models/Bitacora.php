<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Modelo Bitacora
 * Paquete: P1 - Seguridad y Auditoría (CU03)
 * Mapeo oficial: Tabla 'bitacora' (DDL_Database_Clinica_LaCruz.sql) y Clase 'Bitacora' (diagrama_de_clases.puml)
 */
class Bitacora extends Model
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

    /**
     * Usuario responsable del evento registrado
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Registro unificado de eventos de auditoría inmutables
     * Soporta llamada posicional: registrar($idUsuario, $modulo, $accion, ...)
     * O llamada asociativa: registrar(['id_usuario' => 1, 'modulo' => '...', ...])
     */
    public static function registrar(
        $idUsuario = null,
        ?string $modulo = null,
        ?string $accion = null,
        ?string $tablaAfectada = null,
        ?int $idRegistro = null,
        ?string $descripcion = null,
        ?string $ip = null
    ): self {
        if (is_array($idUsuario)) {
            $data = $idUsuario;
            return self::create([
                'id_usuario'     => $data['id_usuario'] ?? (Auth::check() ? Auth::id() : null),
                'modulo'         => $data['modulo'] ?? 'General',
                'accion'         => $data['accion'] ?? 'OPERACION',
                'tabla_afectada' => $data['tabla_afectada'] ?? null,
                'id_registro'    => $data['id_registro'] ?? null,
                'descripcion'    => $data['descripcion'] ?? null,
                'ip_origen'      => $data['ip_origen'] ?? (request() ? request()->ip() : null),
                'fecha_registro' => now(),
            ]);
        }

        return self::create([
            'id_usuario'     => $idUsuario,
            'modulo'         => $modulo ?? 'General',
            'accion'         => $accion ?? 'OPERACION',
            'tabla_afectada' => $tablaAfectada,
            'id_registro'    => $idRegistro,
            'descripcion'    => $descripcion,
            'ip_origen'      => $ip ?? (request() ? request()->ip() : null),
            'fecha_registro' => now(),
        ]);
    }
}

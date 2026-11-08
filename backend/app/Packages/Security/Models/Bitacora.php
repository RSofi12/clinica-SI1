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
        $idRegistro = null,
        ?string $descripcion = null,
        ?string $ip = null,
        ...$extra
    ): self {
        if (is_array($idUsuario)) {
            $data = $idUsuario;
            return self::create([
                'id_usuario'     => $data['id_usuario'] ?? (Auth::check() ? Auth::id() : null),
                'modulo'         => substr($data['modulo'] ?? 'General', 0, 50),
                'accion'         => substr($data['accion'] ?? 'OPERACION', 0, 50),
                'tabla_afectada' => isset($data['tabla_afectada']) ? substr((string)$data['tabla_afectada'], 0, 100) : null,
                'id_registro'    => $data['id_registro'] ?? null,
                'descripcion'    => $data['descripcion'] ?? null,
                'ip_origen'      => $data['ip_origen'] ?? (request() ? request()->ip() : '127.0.0.1'),
                'fecha_registro' => now(),
            ]);
        }

        // Soporte para argumentos nombrados adicionales (p. ej. idRegistroAfectado o valoresNuevos)
        if ($idRegistro === null && isset($extra['idRegistroAfectado'])) {
            $idRegistro = $extra['idRegistroAfectado'];
        }
        if ($descripcion === null && isset($extra['valoresNuevos'])) {
            $descripcion = is_array($extra['valoresNuevos']) 
                ? json_encode($extra['valoresNuevos'], JSON_UNESCAPED_UNICODE) 
                : (string)$extra['valoresNuevos'];
        }
        if ($ip === null && isset($extra['ip'])) {
            $ip = $extra['ip'];
        }

        // Heurística de protección: si $tablaAfectada contiene un texto explicativo largo o espacios
        // y $descripcion está vacía, el llamador pasó la descripción en la 4ta posición
        if (is_string($tablaAfectada) && (strlen($tablaAfectada) > 50 || str_contains($tablaAfectada, ' ')) && empty($descripcion)) {
            $descripcion = $tablaAfectada;
            $tablaAfectada = (is_string($modulo) && !str_contains($modulo, ' ') && strlen($modulo) <= 50) ? strtolower($modulo) : null;
        }

        // Sanitización para respetar tipos de columnas en PostgreSQL (VARCHAR(50) y VARCHAR(100))
        $moduloLimpio = $modulo ? substr($modulo, 0, 50) : 'General';
        $accionLimpia = $accion ? substr($accion, 0, 50) : 'OPERACION';
        $tablaLimpia  = $tablaAfectada ? substr($tablaAfectada, 0, 100) : null;
        $idRegInt     = is_numeric($idRegistro) ? (int)$idRegistro : null;

        return self::create([
            'id_usuario'     => $idUsuario ?? (Auth::check() ? Auth::id() : null),
            'modulo'         => $moduloLimpio,
            'accion'         => $accionLimpia,
            'tabla_afectada' => $tablaLimpia,
            'id_registro'    => $idRegInt,
            'descripcion'    => $descripcion,
            'ip_origen'      => $ip ?? (request() ? request()->ip() : '127.0.0.1'),
            'fecha_registro' => now(),
        ]);
    }
}

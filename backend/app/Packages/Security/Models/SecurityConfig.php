<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo SecurityConfig (ConfiguracionSeguridad)
 * Paquete: P1 - Seguridad y Auditoría
 * Mapeo: Tabla 'configuracion_seguridad' (DDL) y Clase 'ConfiguracionSeguridad' (diagrama_de_clases.puml)
 */
class SecurityConfig extends Model
{
    protected $table = 'configuracion_seguridad';
    protected $primaryKey = 'id_configuracion';
    public $timestamps = false;

    protected $fillable = [
        'max_intentos_fallidos',
        'minutos_bloqueo',
        'actualizado_por',
        'fecha_actualizacion',
    ];

    protected function casts(): array
    {
        return [
            'max_intentos_fallidos' => 'integer',
            'minutos_bloqueo' => 'integer',
            'fecha_actualizacion' => 'datetime',
        ];
    }

    public function actualizador()
    {
        return $this->belongsTo(User::class, 'actualizado_por', 'id_usuario');
    }

    /**
     * + obtenerPoliticaActiva(): ConfiguracionSeguridad
     * Obtiene la política vigente o crea los valores predeterminados (3 intentos / 5 minutos)
     */
    public static function obtenerPoliticaActiva(): self
    {
        $config = self::orderBy('id_configuracion', 'desc')->first();

        if (!$config) {
            $config = self::create([
                'max_intentos_fallidos' => 3,
                'minutos_bloqueo' => 5,
                'actualizado_por' => null,
                'fecha_actualizacion' => now(),
            ]);
        }

        return $config;
    }

    /**
     * + actualizarPolitica(maxIntentos: Int, minutos: Int): Void
     */
    public function actualizarPolitica(int $maxIntentos, int $minutos, ?int $idAdmin = null): void
    {
        $this->max_intentos_fallidos = $maxIntentos;
        $this->minutos_bloqueo = $minutos;
        $this->actualizado_por = $idAdmin;
        $this->fecha_actualizacion = now();
        $this->save();
    }
}

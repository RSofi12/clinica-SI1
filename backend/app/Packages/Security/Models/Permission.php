<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Permission (Permisos)
 * Paquete: P1 - Seguridad y Auditoría
 * Mapeo: Tabla 'permisos' (DDL) y Clase 'Permisos' (diagrama_de_clases.puml)
 */
class Permission extends Model
{
    protected $table = 'permisos';
    protected $primaryKey = 'id_permiso';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'rol_permiso', 'id_permiso', 'id_rol');
    }

    public function verificarPermiso(string $codigo): bool
    {
        return $this->nombre === $codigo;
    }
}

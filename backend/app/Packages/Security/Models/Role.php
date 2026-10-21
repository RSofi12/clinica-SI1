<?php

namespace App\Packages\Security\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Role (Roles)
 * Paquete: P1 - Seguridad y Auditoría
 * Mapeo: Tabla 'roles' (DDL) y Clase 'Roles' (diagrama_de_clases.puml)
 */
class Role extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'id_rol';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    public function usuarios()
    {
        return $this->belongsToMany(User::class, 'usuario_rol', 'id_rol', 'id_usuario');
    }

    public function permisos()
    {
        return $this->belongsToMany(Permission::class, 'rol_permiso', 'id_rol', 'id_permiso');
    }

    public function asignarPermiso(int $idPermiso): void
    {
        $this->permisos()->syncWithoutDetaching([$idPermiso]);
    }
}

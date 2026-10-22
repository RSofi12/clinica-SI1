<?php

namespace App\Packages\Appointments\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Catálogo de Tipos de Cita Médica
 * Tabla relacional: 'tipos_cita' (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 3: Gestión de Citas Médicas
 */
class TipoCita extends Model
{
    protected $table = 'tipos_cita';
    protected $primaryKey = 'id_tipo_cita';

    protected $fillable = [
        'nombre',
    ];

    /**
     * Citas registradas bajo este tipo
     */
    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'id_tipo_cita', 'id_tipo_cita');
    }

    /**
     * Devuelve el nombre del tipo de cita (diagrama_de_clases.puml: obtenerNombre(): String)
     */
    public function obtenerNombre(): string
    {
        return $this->nombre;
    }
}

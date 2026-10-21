<?php

namespace App\Packages\ClinicalResources\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Modelo de Especialidad Médica (CU07 / RF04)
 * Tabla relacional: 'especialidades' (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class Especialidad extends Model
{
    protected $table = 'especialidades';
    protected $primaryKey = 'id_especialidad';

    protected $fillable = [
        'nombre',
        'nombre_normalizado',
        'descripcion',
        'edad_min_anios',
        'edad_max_anios',
        'precio_consulta',
        'estado',
    ];

    protected $casts = [
        'edad_min_anios' => 'integer',
        'edad_max_anios' => 'integer',
        'precio_consulta' => 'decimal:2',
    ];

    /**
     * Médicos vinculados que ejercen esta especialidad
     */
    public function medicos(): BelongsToMany
    {
        return $this->belongsToMany(
            Medico::class,
            'medico_especialidad',
            'id_especialidad',
            'id_medico'
        )->withPivot('es_principal');
    }

    /**
     * Alias de compatibilidad
     */
    public function doctors(): BelongsToMany
    {
        return $this->medicos();
    }

    /**
     * Scope para especialidades vigentes
     */
    public function scopeActivas($query)
    {
        return $query->where('estado', 'ACTIVO');
    }

    /**
     * Scope de búsqueda rápida
     */
    public function scopeBuscar($query, ?string $termino)
    {
        if (empty($termino)) {
            return $query;
        }

        $term = mb_strtolower(trim($termino));
        return $query->where(function ($q) use ($term) {
            $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$term}%"])
              ->orWhereRaw('LOWER(nombre_normalizado) LIKE ?', ["%{$term}%"])
              ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$term}%"]);
        });
    }

    /**
     * Evalúa si un paciente de cierta edad califica para esta especialidad (RF04)
     */
    public function esAptaParaEdad(int $edad): bool
    {
        if ($this->edad_min_anios !== null && $edad < $this->edad_min_anios) {
            return false;
        }
        if ($this->edad_max_anios !== null && $edad > $this->edad_max_anios) {
            return false;
        }
        return true;
    }
}

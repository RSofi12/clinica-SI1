<?php

namespace App\Packages\ClinicalResources\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Packages\Security\Models\User;

/**
 * Modelo de Médico Clínico (CU06 / RF03 - Actor Médico Unificado)
 * Tabla relacional: 'medicos' (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 2: Recursos Clínicos y Pacientes
 */
class Medico extends Model
{
    protected $table = 'medicos';
    protected $primaryKey = 'id_medico';

    protected $fillable = [
        'id_usuario',
        'codigo_profesional',
        'nombres',
        'apellidos',
        'telefono_contacto',
        'correo_profesional',
        'estado_activo',
    ];

    protected $casts = [
        'estado_activo' => 'boolean',
    ];

    protected $appends = [
        'nombre_completo',
        'especialidad_principal',
    ];

    /**
     * Cuenta de usuario vinculada con rol MEDICO
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Especialidades médicas vinculadas (N:M con tabla 'medico_especialidad')
     */
    public function specialties(): BelongsToMany
    {
        return $this->belongsToMany(
            Especialidad::class,
            'medico_especialidad',
            'id_medico',
            'id_especialidad'
        )->withPivot('es_principal');
    }

    /**
     * Alias de relación en español: especialidades
     */
    public function especialidades(): BelongsToMany
    {
        return $this->specialties();
    }

    /**
     * Accessor: Nombre completo con título Dr./Dra.
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("Dr(a). {$this->nombres} {$this->apellidos}");
    }

    /**
     * Accessor: Especialidad principal asignada
     */
    public function getEspecialidadPrincipalAttribute()
    {
        if ($this->relationLoaded('specialties')) {
            $principal = $this->specialties->firstWhere('pivot.es_principal', true);
            return $principal ?: $this->specialties->first();
        }
        return null;
    }

    /**
     * Scope para médicos en servicio activo (RN04)
     */
    public function scopeActivos($query)
    {
        return $query->where('estado_activo', true);
    }

    /**
     * Scope de búsqueda por nombre, matrícula o correo
     */
    public function scopeBuscar($query, ?string $termino)
    {
        if (empty($termino)) {
            return $query;
        }

        $term = mb_strtolower(trim($termino));
        return $query->where(function ($q) use ($term) {
            $q->whereRaw('LOWER(nombres) LIKE ?', ["%{$term}%"])
              ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$term}%"])
              ->orWhereRaw('LOWER(codigo_profesional) LIKE ?', ["%{$term}%"])
              ->orWhereRaw('LOWER(correo_profesional) LIKE ?', ["%{$term}%"])
              ->orWhereHas('specialties', function ($sq) use ($term) {
                  $sq->whereRaw('LOWER(nombre) LIKE ?', ["%{$term}%"]);
              });
        });
    }

    /**
     * Scope para filtrar por especialidad específica
     */
    public function scopePorEspecialidad($query, ?int $especialidadId)
    {
        if (!$especialidadId) {
            return $query;
        }

        return $query->whereHas('specialties', function ($q) use ($especialidadId) {
            $q->where('especialidades.id_especialidad', $especialidadId);
        });
    }
}

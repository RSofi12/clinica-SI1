<?php

namespace App\Packages\ClinicalResources\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Packages\Security\Models\User;

/**
 * Modelo Patient — Mapea la tabla 'pacientes'
 * Guía: docs/database/diagrama_de_clases.puml y DDL_Database_Clinica_LaCruz.sql
 * Paquete 2: Gestión de Recursos Clínicos y Pacientes (CU04 / RF02)
 */
class Patient extends Model
{
    protected $table = 'pacientes';
    protected $primaryKey = 'id_paciente';
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'numero_historia',
        'numero_documento',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'sexo',
        'tipo_sangre',
        'telefono',
        'correo',
        'direccion',
        'notificaciones_activas',
        'estado_paciente',
        'fecha_registro',
    ];

    protected $casts = [
        'id_usuario' => 'integer',
        'fecha_nacimiento' => 'date:Y-m-d',
        'notificaciones_activas' => 'boolean',
        'fecha_registro' => 'datetime',
    ];

    protected $appends = [
        'nombre_completo',
        'edad',
        'grupo_etario',
        'especialidad_sugerida',
    ];

    /**
     * Usuario de autenticación vinculado (opcional para autoservicio web CU05)
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Contactos de emergencia asociados
     */
    public function contactosEmergencia(): HasMany
    {
        return $this->hasMany(EmergencyContact::class, 'id_paciente', 'id_paciente');
    }

    /**
     * Contacto de emergencia principal (primer registro)
     */
    public function contactoPrincipal(): HasOne
    {
        return $this->hasOne(EmergencyContact::class, 'id_paciente', 'id_paciente');
    }

    /**
     * Nombre completo formateado
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    /**
     * Edad actual calculada en base a la fecha de nacimiento
     */
    public function getEdadAttribute(): int
    {
        if (!$this->fecha_nacimiento) {
            return 0;
        }
        return Carbon::parse($this->fecha_nacimiento)->age;
    }

    /**
     * Clasificación de grupo etario institucional según RF04
     */
    public function getGrupoEtarioAttribute(): string
    {
        $edad = $this->edad;
        if ($edad < 15) {
            return 'Pediátrico (<15a)';
        } elseif ($edad >= 60) {
            return 'Geriátrico (≥60a)';
        }
        return 'Adulto (15-59a)';
    }

    /**
     * Sugerencia automática de especialidad médica (RF04)
     */
    public function getEspecialidadSugeridaAttribute(): string
    {
        $edad = $this->edad;
        if ($edad < 15) {
            return 'Pediatría';
        } elseif ($edad >= 60) {
            return 'Geriatría / Medicina General';
        }
        return 'Medicina General';
    }

    /**
     * Scope para filtrar únicamente pacientes activos
     */
    public function scopeActivo($query)
    {
        return $query->where('estado_paciente', 'ACTIVO');
    }

    /**
     * Scope para búsqueda flexible por CI, N° Historia, Nombres o Apellidos
     */
    public function scopeBuscar($query, ?string $term)
    {
        if (empty($term)) {
            return $query;
        }

        $term = trim($term);
        return $query->where(function ($q) use ($term) {
            $q->where('numero_documento', 'ILIKE', "%{$term}%")
              ->orWhere('numero_historia', 'ILIKE', "%{$term}%")
              ->orWhere('nombres', 'ILIKE', "%{$term}%")
              ->orWhere('apellidos', 'ILIKE', "%{$term}%")
              ->orWhereRaw("CONCAT(nombres, ' ', apellidos) ILIKE ?", ["%{$term}%"]);
        });
    }

    /**
     * Generador automático del correlativo único de historia clínica: HC-0001, HC-0002...
     */
    public static function generarNumeroHistoria(): string
    {
        $ultimo = self::query()
            ->where('numero_historia', 'LIKE', 'HC-%')
            ->orderByRaw("CAST(SUBSTRING(numero_historia FROM 4) AS INTEGER) DESC")
            ->value('numero_historia');

        if (!$ultimo) {
            return 'HC-0001';
        }

        $correlativo = (int) substr($ultimo, 3);
        $siguiente = $correlativo + 1;

        return sprintf('HC-%04d', $siguiente);
    }
}

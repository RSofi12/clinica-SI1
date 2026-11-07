<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Security\Models\User;

/**
 * Modelo de Antecedentes Médicos
 * Tabla relacional: 'antecedentes' (DDL_Database_Clinica_LaCruz.sql)
 * Clase UML: 'Antecedentes' (diagrama_de_clases.puml)
 * Paquete 4: Historial Clínico y Consultas (CU17)
 */
class Antecedente extends Model
{
    protected $table = 'antecedentes';
    protected $primaryKey = 'id_antecedente';

    // Constantes de tipos oficiales (CU17 / PUDS)
    public const TIPO_PATOLOGICO = 'PATOLOGICO';
    public const TIPO_QUIRURGICO = 'QUIRURGICO';
    public const TIPO_ALERGICO = 'ALERGICO';
    public const TIPO_FAMILIAR = 'FAMILIAR';
    public const TIPO_FARMACOLOGICO = 'FARMACOLOGICO';

    public const TIPOS_VALIDOS = [
        self::TIPO_PATOLOGICO,
        self::TIPO_QUIRURGICO,
        self::TIPO_ALERGICO,
        self::TIPO_FAMILIAR,
        self::TIPO_FARMACOLOGICO,
    ];

    public const ESTADO_ACTIVO = 'ACTIVO';
    public const ESTADO_INACTIVO = 'INACTIVO';

    protected $fillable = [
        'id_historia_clinica',
        'tipo_antecedente', // PATOLOGICO, QUIRURGICO, ALERGICO, FAMILIAR, FARMACOLOGICO
        'descripcion',
        'registrado_por',
        'fecha_registro',
        'estado', // ACTIVO, INACTIVO
    ];

    protected $casts = [
        'fecha_registro' => 'datetime',
    ];

    // =========================================================================
    // RELACIONES
    // =========================================================================

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function registrador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por', 'id_usuario');
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    public function scopeActivos($query)
    {
        return $query->where('estado', self::ESTADO_ACTIVO);
    }

    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('tipo_antecedente', $tipo);
    }

    public function scopeAlergicos($query)
    {
        return $query->where('tipo_antecedente', self::TIPO_ALERGICO);
    }

    // =========================================================================
    // MÉTODOS DE NEGOCIO
    // =========================================================================

    public function esAlergico(): bool
    {
        return $this->tipo_antecedente === self::TIPO_ALERGICO;
    }
}

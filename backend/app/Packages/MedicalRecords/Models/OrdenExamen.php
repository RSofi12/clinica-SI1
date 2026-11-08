<?php

namespace App\Packages\MedicalRecords\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Modelo de Orden de Exámenes Auxiliares (Laboratorio e Imagenología)
 * Tabla relacional: 'ordenes_examenes'
 * Clase UML: 'OrdenesExamenes'
 * Paquete 4: Historial Clínico y Consultas (CU25)
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
class OrdenExamen extends Model
{
    protected $table = 'ordenes_examenes';
    protected $primaryKey = 'id_orden';

    // Tipos de estudio permitidos
    public const TIPO_LABORATORIO  = 'LABORATORIO';
    public const TIPO_IMAGENOLOGIA = 'IMAGENOLOGIA';
    public const TIPO_CARDIOLOGIA  = 'CARDIOLOGIA';
    public const TIPO_OTROS        = 'OTROS';

    public const TIPOS_VALIDOS = [
        self::TIPO_LABORATORIO,
        self::TIPO_IMAGENOLOGIA,
        self::TIPO_CARDIOLOGIA,
        self::TIPO_OTROS,
    ];

    // Estados de la orden médica
    public const ESTADO_PENDIENTE       = 'PENDIENTE';
    public const ESTADO_CON_RESULTADOS  = 'CON_RESULTADOS';
    public const ESTADO_CANCELADA       = 'CANCELADA';

    public const ESTADOS_VALIDOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_CON_RESULTADOS,
        self::ESTADO_CANCELADA,
    ];

    protected $fillable = [
        'codigo_orden', // ej: 'ORD-0001'
        'id_consulta',
        'id_historia_clinica',
        'id_medico',
        'tipo_estudio', // LABORATORIO, IMAGENOLOGIA, CARDIOLOGIA, OTROS
        'nombre_estudio',
        'indicaciones_preparacion',
        'diagnostico_presuntivo',
        'estado', // PENDIENTE, CON_RESULTADOS, CANCELADA
        'motivo_cancelacion',
        'cancelado_en',
        'fecha_emision',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'cancelado_en'  => 'datetime',
    ];

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'id_consulta', 'id_consulta');
    }

    public function historiaClinica(): BelongsTo
    {
        return $this->belongsTo(HistoriaClinica::class, 'id_historia_clinica', 'id_historia_clinica');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    public function documentosAdjuntos(): HasMany
    {
        return $this->hasMany(DocumentoClinico::class, 'id_orden', 'id_orden');
    }

    /**
     * Comprueba si la orden puede ser anulada lógicamente (RN11)
     */
    public function puedeCancelarse(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }

    /**
     * Aplica la baja lógica inmutable con motivo
     */
    public function cancelar(string $motivo): void
    {
        $this->update([
            'estado'             => self::ESTADO_CANCELADA,
            'motivo_cancelacion' => $motivo,
            'cancelado_en'       => now(),
        ]);
    }

    /**
     * Cambia el estado a CON_RESULTADOS cuando se adjunta un documento clínico (CU26)
     */
    public function marcarConResultados(): void
    {
        if ($this->estado === self::ESTADO_PENDIENTE) {
            $this->update([
                'estado' => self::ESTADO_CON_RESULTADOS,
            ]);
        }
    }
}

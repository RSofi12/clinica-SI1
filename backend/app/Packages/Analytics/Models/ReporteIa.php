<?php

namespace App\Packages\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Packages\Security\Models\User;

/**
 * Modelo de Reportes por Voz con IA
 * Tabla relacional: 'reportes_ia'
 * Clase UML: 'ReportesIA'
 * Paquete 6: Reportes y Analítica (CU23)
 */
class ReporteIa extends Model
{
    protected $table = 'reportes_ia';
    protected $primaryKey = 'id_reporte';

    protected $fillable = [
        'id_usuario',
        'comando_texto',
        'filtros_json',
        'tipo_reporte',
        'fecha_generacion',
    ];

    protected $casts = [
        'filtros_json' => 'array',
        'fecha_generacion' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}

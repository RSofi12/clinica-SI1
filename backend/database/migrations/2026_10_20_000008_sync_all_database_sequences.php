<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sincronizar todas las secuencias de PostgreSQL con el valor MAX(id)
     * para evitar colisiones de clave primaria (SQLSTATE[23505] Unique violation).
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $tablasYClaves = [
            'usuarios'              => 'id_usuario',
            'roles'                 => 'id_rol',
            'permisos'              => 'id_permiso',
            'pacientes'             => 'id_paciente',
            'contactos_emergencia'  => 'id_contacto',
            'medicos'               => 'id_medico',
            'especialidades'        => 'id_especialidad',
            'disponibilidades'      => 'id_disponibilidad',
            'bloqueos_horario'      => 'id_bloqueo',
            'tipos_cita'            => 'id_tipo_cita',
            'citas'                 => 'id_cita',
            'cita_estado_historial' => 'id_historial',
            'bitacora'              => 'id_bitacora',
        ];

        foreach ($tablasYClaves as $tabla => $columna) {
            if (Schema::hasTable($tabla) && Schema::hasColumn($tabla, $columna)) {
                $maxId = DB::table($tabla)->max($columna);
                if ($maxId !== null && $maxId > 0) {
                    try {
                        DB::statement("SELECT setval(pg_get_serial_sequence('{$tabla}', '{$columna}'), {$maxId})");
                    } catch (\Throwable $e) {
                        // Omitir si la columna no posee secuencia serial directa
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se requiere reversión para ajuste de secuencias
    }
};

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Packages\Appointments\Models\TipoCita;

/**
 * Seeder de Tipos de Cita Médica (DDL_Database_Clinica_LaCruz.sql)
 * Paquete 3: Gestión de Citas Médicas
 */
class AppointmentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $tipos = [
            'PRIMERA CONSULTA',
            'CONTROL',
            'RECONSULTA',
        ];

        foreach ($tipos as $nombre) {
            TipoCita::firstOrCreate(
                ['nombre' => $nombre],
                ['nombre' => $nombre]
            );
        }
    }
}

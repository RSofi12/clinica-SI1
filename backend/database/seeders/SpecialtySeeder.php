<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Packages\ClinicalResources\Models\Especialidad;

/**
 * Seeder del Catálogo de Especialidades Médicas (CU07 / RF04)
 */
class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $especialidades = [
            [
                'nombre' => 'Medicina General',
                'descripcion' => 'Atención integral, triaje preventivo y patologías comunes en pacientes jóvenes y adultos.',
                'edad_min_anios' => 15,
                'edad_max_anios' => 59,
                'precio_consulta' => 70.00,
            ],
            [
                'nombre' => 'Pediatría',
                'descripcion' => 'Cuidado clínico integral, desarrollo infantil y patologías pediátricas hasta los 14 años.',
                'edad_min_anios' => 0,
                'edad_max_anios' => 14,
                'precio_consulta' => 90.00,
            ],
            [
                'nombre' => 'Geriatría',
                'descripcion' => 'Manejo clínico especializado para adultos mayores a partir de los 60 años.',
                'edad_min_anios' => 60,
                'edad_max_anios' => 130,
                'precio_consulta' => 90.00,
            ],
            [
                'nombre' => 'Cardiología',
                'descripcion' => 'Diagnóstico, tratamiento y prevención de enfermedades cardiovasculares e hipertensión.',
                'edad_min_anios' => 15,
                'edad_max_anios' => null,
                'precio_consulta' => 120.00,
            ],
            [
                'nombre' => 'Ginecología y Obstetricia',
                'descripcion' => 'Salud reproductiva femenina, control prenatal y patologías ginecológicas.',
                'edad_min_anios' => 12,
                'edad_max_anios' => null,
                'precio_consulta' => 100.00,
            ],
            [
                'nombre' => 'Traumatología y Ortopedia',
                'descripcion' => 'Tratamiento de lesiones óseas, fracturas, articulares y aparato locomotor.',
                'edad_min_anios' => null,
                'edad_max_anios' => null,
                'precio_consulta' => 110.00,
            ],
            [
                'nombre' => 'Dermatología',
                'descripcion' => 'Diagnóstico y tratamiento de enfermedades cutáneas, alergias y cuidado dérmico.',
                'edad_min_anios' => null,
                'edad_max_anios' => null,
                'precio_consulta' => 95.00,
            ],
            [
                'nombre' => 'Oftalmología',
                'descripcion' => 'Salud ocular, agudeza visual y tratamiento de patologías de la visión.',
                'edad_min_anios' => null,
                'edad_max_anios' => null,
                'precio_consulta' => 85.00,
            ],
        ];

        foreach ($especialidades as $esp) {
            Especialidad::firstOrCreate(
                ['nombre_normalizado' => Str::slug($esp['nombre'])],
                [
                    'nombre' => $esp['nombre'],
                    'descripcion' => $esp['descripcion'],
                    'edad_min_anios' => $esp['edad_min_anios'],
                    'edad_max_anios' => $esp['edad_max_anios'],
                    'precio_consulta' => $esp['precio_consulta'],
                    'estado' => 'ACTIVO',
                ]
            );
        }
    }
}

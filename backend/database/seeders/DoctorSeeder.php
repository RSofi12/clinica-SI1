<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\Security\Models\User;
use App\Packages\Security\Models\Role;

/**
 * Seeder de Médicos y Especialistas (CU06 / RF03 - Actor Médico Unificado)
 */
class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $rolMedico = Role::firstOrCreate(['nombre' => 'MEDICO']);
        $passwordHash = Hash::make('Admin123@');

        // Mapa de especialidades por nombre
        $espGeneral = Especialidad::where('nombre', 'Medicina General')->first();
        $espPediatria = Especialidad::where('nombre', 'Pediatría')->first();
        $espGeriatria = Especialidad::where('nombre', 'Geriatría')->first();
        $espCardio = Especialidad::where('nombre', 'Cardiología')->first();
        $espGineco = Especialidad::where('nombre', 'Ginecología y Obstetricia')->first();
        $espTraumato = Especialidad::where('nombre', 'Traumatología y Ortopedia')->first();
        $espDerma = Especialidad::where('nombre', 'Dermatología')->first();

        $plantel = [
            // 1. Dr. Juan Pérez (Medicina General + Dermatología)
            [
                'username' => 'doctor.perez',
                'codigo' => 'MED-10492',
                'nombres' => 'Juan Carlos',
                'apellidos' => 'Pérez Saucedo',
                'telefono' => '71023456',
                'correo' => 'juan.perez@clinicalacruz.com',
                'principal' => $espGeneral->id_especialidad,
                'secundarias' => $espDerma ? [$espDerma->id_especialidad] : [],
            ],
            // 2. Dr. Alejandro Morales (Cardiología + Medicina General)
            [
                'username' => 'doctor.alejandro',
                'codigo' => 'MED-20831',
                'nombres' => 'Alejandro',
                'apellidos' => 'Morales Terrazas',
                'telefono' => '72134567',
                'correo' => 'alejandro.cardiologia@clinicalacruz.com',
                'principal' => $espCardio->id_especialidad,
                'secundarias' => $espGeneral ? [$espGeneral->id_especialidad] : [],
            ],
            // 3. Dra. Elena Paredes (Pediatría)
            [
                'username' => 'doctora.elena',
                'codigo' => 'MED-31950',
                'nombres' => 'Elena Sofía',
                'apellidos' => 'Paredes Justiniano',
                'telefono' => '73245678',
                'correo' => 'elena.pediatria@clinicalacruz.com',
                'principal' => $espPediatria->id_especialidad,
                'secundarias' => [],
            ],
            // 4. Dra. Carmen Mendoza (Geriatría + Medicina General)
            [
                'username' => 'doctora.carmen',
                'codigo' => 'MED-45012',
                'nombres' => 'Carmen Rosa',
                'apellidos' => 'Mendoza Vaca',
                'telefono' => '74356789',
                'correo' => 'carmen.mendoza@clinicalacruz.com',
                'principal' => $espGeriatria ? $espGeriatria->id_especialidad : $espGeneral->id_especialidad,
                'secundarias' => $espGeneral ? [$espGeneral->id_especialidad] : [],
            ],
            // 5. Dr. Roberto Suárez (Traumatología)
            [
                'username' => 'doctor.roberto',
                'codigo' => 'MED-58190',
                'nombres' => 'Roberto Carlos',
                'apellidos' => 'Suárez Mercado',
                'telefono' => '75467890',
                'correo' => 'roberto.suarez@clinicalacruz.com',
                'principal' => $espTraumato ? $espTraumato->id_especialidad : $espGeneral->id_especialidad,
                'secundarias' => [],
            ],
            // 6. Dra. Mariana Vaca (Ginecología y Obstetricia)
            [
                'username' => 'doctora.mariana',
                'codigo' => 'MED-62734',
                'nombres' => 'Mariana',
                'apellidos' => 'Vaca Ribera',
                'telefono' => '76578901',
                'correo' => 'mariana.vaca@clinicalacruz.com',
                'principal' => $espGineco ? $espGineco->id_especialidad : $espGeneral->id_especialidad,
                'secundarias' => [],
            ],
        ];

        foreach ($plantel as $item) {
            // Buscar o crear usuario
            $usuario = User::firstOrCreate(
                ['username' => $item['username']],
                [
                    'email' => $item['correo'],
                    'password_hash' => $passwordHash,
                    'tipo_usuario' => 'MEDICO',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => now(),
                    'fecha_actualizacion' => now(),
                ]
            );
            $usuario->roles()->syncWithoutDetaching([$rolMedico->id_rol]);

            // Buscar o crear médico
            $doctor = Medico::firstOrCreate(
                ['codigo_profesional' => $item['codigo']],
                [
                    'id_usuario' => $usuario->id_usuario,
                    'nombres' => $item['nombres'],
                    'apellidos' => $item['apellidos'],
                    'telefono_contacto' => $item['telefono'],
                    'correo_profesional' => $item['correo'],
                    'estado_activo' => true,
                ]
            );

            // Sincronizar especialidades
            $pivots = [];
            $pivots[$item['principal']] = ['es_principal' => true];

            foreach ($item['secundarias'] as $secId) {
                if ($secId !== $item['principal']) {
                    $pivots[$secId] = ['es_principal' => false];
                }
            }

            $doctor->specialties()->sync($pivots);
        }
    }
}

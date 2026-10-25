<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Packages\Security\Models\User;
use App\Packages\Security\Models\Role;
use App\Packages\Security\Models\Permission;

/**
 * Seeder del Paquete 1: Seguridad y Auditoría (CU01, CU02)
 * Crea los 4 roles del sistema y usuarios demo:
 * - 1 Administrador
 * - 1 Recepcionista
 * - 3 Médicos (General, Cardiología [H], Pediatría [M])
 * - 4 Pacientes (2 hombres, 2 mujeres)
 * Contraseña estándar para todos: Admin123@
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles oficiales del sistema (RBAC)
        $roles = [
            'ADMIN'         => Role::firstOrCreate(['nombre' => 'ADMIN']),
            'RECEPCIONISTA' => Role::firstOrCreate(['nombre' => 'RECEPCIONISTA']),
            'MEDICO'        => Role::firstOrCreate(['nombre' => 'MEDICO']),
            'PACIENTE'      => Role::firstOrCreate(['nombre' => 'PACIENTE']),
        ];

        // 2. Permisos granulares
        $permisos = [
            'usuarios.gestionar',
            'roles.gestionar',
            'pacientes.gestionar',
            'citas.gestionar',
            'citas.consultar_agenda',
            'consultas.atender',
            'reportes.consultar',
            'bitacora.consultar',
        ];

        foreach ($permisos as $permisoNombre) {
            $p = Permission::firstOrCreate(['nombre' => $permisoNombre]);
            // El admin posee todos los permisos
            $roles['ADMIN']->asignarPermiso($p->id_permiso);
        }

        // Permisos para Recepcionista
        $pPacientes = Permission::where('nombre', 'pacientes.gestionar')->first();
        $pCitas = Permission::where('nombre', 'citas.gestionar')->first();
        if ($pPacientes) $roles['RECEPCIONISTA']->asignarPermiso($pPacientes->id_permiso);
        if ($pCitas) $roles['RECEPCIONISTA']->asignarPermiso($pCitas->id_permiso);

        // Permisos para Médico
        $pAgenda = Permission::where('nombre', 'citas.consultar_agenda')->first();
        $pAtender = Permission::where('nombre', 'consultas.atender')->first();
        if ($pAgenda) $roles['MEDICO']->asignarPermiso($pAgenda->id_permiso);
        if ($pAtender) $roles['MEDICO']->asignarPermiso($pAtender->id_permiso);

        // Contraseña segura solicitada para todos los usuarios demo (1 mayús, 1 minús, 1 num, 1 especial)
        $passwordHash = Hash::make('Admin123@');

        // =====================================================================
        // 3. USUARIOS BASE Y DEMOSTRACIÓN
        // =====================================================================

        // A. Administrador
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@clinicalacruz.com',
                'password_hash' => $passwordHash,
                'tipo_usuario' => 'ADMIN',
                'estado' => 'ACTIVO',
                'intentos_fallidos' => 0,
                'fecha_creacion' => now(),
                'fecha_actualizacion' => now(),
            ]
        );
        $admin->password_hash = $passwordHash;
        $admin->save();
        $admin->roles()->syncWithoutDetaching([$roles['ADMIN']->id_rol]);

        // B. Recepcionista
        $recepcionista = User::firstOrCreate(
            ['username' => 'recepcion'],
            [
                'email' => 'recepcion@clinicalacruz.com',
                'password_hash' => $passwordHash,
                'tipo_usuario' => 'RECEPCIONISTA',
                'estado' => 'ACTIVO',
                'intentos_fallidos' => 0,
                'fecha_creacion' => now(),
                'fecha_actualizacion' => now(),
            ]
        );
        $recepcionista->password_hash = $passwordHash;
        $recepcionista->save();
        $recepcionista->roles()->syncWithoutDetaching([$roles['RECEPCIONISTA']->id_rol]);

        // C. Médicos (Rol único MEDICO según AGENTS.md, con especialidades)
        $medicos = [
            [
                'username' => 'doctor.perez',
                'email' => 'juan.perez@clinicalacruz.com',
                'descripcion' => 'Dr. Juan Pérez (Medicina General)',
            ],
            [
                'username' => 'doctor.alejandro',
                'email' => 'alejandro.cardiologia@clinicalacruz.com',
                'descripcion' => 'Dr. Alejandro Morales (Cardiología - Hombre)',
            ],
            [
                'username' => 'doctora.elena',
                'email' => 'elena.pediatria@clinicalacruz.com',
                'descripcion' => 'Dra. Elena Paredes (Pediatría - Mujer)',
            ],
        ];

        foreach ($medicos as $m) {
            $doc = User::firstOrCreate(
                ['username' => $m['username']],
                [
                    'email' => $m['email'],
                    'password_hash' => $passwordHash,
                    'tipo_usuario' => 'MEDICO',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => now(),
                    'fecha_actualizacion' => now(),
                ]
            );
            $doc->password_hash = $passwordHash;
            $doc->save();
            $doc->roles()->syncWithoutDetaching([$roles['MEDICO']->id_rol]);
        }

        // D. Pacientes (Autoservicio CU05)
        $pacientes = [
            [
                'username' => 'paciente.carlos',
                'email' => 'carlos.silva.v@gmail.com',
                'genero' => 'Hombre',
            ],
            [
                'username' => 'paciente.mariana',
                'email' => 'mariana.torrico@gmail.com',
                'genero' => 'Mujer',
            ],
            [
                'username' => 'paciente.valeria',
                'email' => 'valeria.escalante@gmail.com',
                'genero' => 'Mujer',
            ],
            [
                'username' => 'paciente.fernando',
                'email' => 'fer.justiniano@estudiante.edu',
                'genero' => 'Hombre',
            ],
        ];

        foreach ($pacientes as $pac) {
            $pacienteUser = User::firstOrCreate(
                ['username' => $pac['username']],
                [
                    'email' => $pac['email'],
                    'password_hash' => $passwordHash,
                    'tipo_usuario' => 'PACIENTE',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => now(),
                    'fecha_actualizacion' => now(),
                ]
            );
            $pacienteUser->email = $pac['email'];
            $pacienteUser->password_hash = $passwordHash;
            $pacienteUser->save();
            $pacienteUser->roles()->syncWithoutDetaching([$roles['PACIENTE']->id_rol]);
        }

        // 6. Poblar catálogo de 15 pacientes con datos demográficos y contactos (CU04 / RF02)
        $this->call(PatientSeeder::class);

        // 7. Poblar catálogo de especialidades médicas (CU07 / RF04)
        $this->call(SpecialtySeeder::class);

        // 8. Poblar plantel de médicos institucionales con especialidades (CU06 / RF03)
        $this->call(DoctorSeeder::class);

        // 9. Poblar catálogo oficial de tipos de cita (CU09, CU10 / RF06)
        $this->call(AppointmentTypeSeeder::class);

        // 10. Poblar horarios de atención médica (CU08) y citas demostrativas (CU09-CU15)
        $this->call(ScheduleAndAppointmentSeeder::class);
    }
}

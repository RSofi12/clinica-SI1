<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Packages\Security\Models\User;
use App\Packages\Security\Models\Role;
use App\Packages\Security\Models\Permission;

/**
 * Seeder del Paquete 1: Seguridad y Auditoría (CU01, CU02)
 * Crea los 4 roles del sistema y 1 usuario de prueba por cada actor.
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

        // 3. Crear 1 usuario de prueba por cada uno de los 4 actores humanos

        // Actor 1: Administrador
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

        // Actor 2: Recepcionista
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

        // Actor 3: Médico
        $medico = User::firstOrCreate(
            ['username' => 'doctor.perez'],
            [
                'email' => 'juan.perez@clinicalacruz.com',
                'password_hash' => $passwordHash,
                'tipo_usuario' => 'MEDICO',
                'estado' => 'ACTIVO',
                'intentos_fallidos' => 0,
                'fecha_creacion' => now(),
                'fecha_actualizacion' => now(),
            ]
        );
        $medico->password_hash = $passwordHash;
        $medico->save();
        $medico->roles()->syncWithoutDetaching([$roles['MEDICO']->id_rol]);

        // Actor 4: Paciente (Autoservicio)
        $paciente = User::firstOrCreate(
            ['username' => 'paciente.carlos'],
            [
                'email' => 'carlos.mendez@gmail.com',
                'password_hash' => $passwordHash,
                'tipo_usuario' => 'PACIENTE',
                'estado' => 'ACTIVO',
                'intentos_fallidos' => 0,
                'fecha_creacion' => now(),
                'fecha_actualizacion' => now(),
            ]
        );
        $paciente->password_hash = $passwordHash;
        $paciente->save();
        $paciente->roles()->syncWithoutDetaching([$roles['PACIENTE']->id_rol]);
    }
}

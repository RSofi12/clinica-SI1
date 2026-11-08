<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Seeder Maestro de Población Integral (PUDS / Clínica La Cruz)
 * Amplía y unifica la población de la base de datos:
 * - 16 Permisos RBAC
 * - 3 Recepcionistas
 * - 12 Especialidades médicas
 * - 16 Médicos (con 5 multiespecialidad y horarios semanales completos)
 * - 40 Pacientes (35 recurrentes con >=3 citas, 5 nuevos con 1 cita)
 * - 40 Historias Clínicas (10 con antecedentes clínicos detallados)
 * - 110 Citas Médicas (rango de 4 semanas, estados atendida, programada, no asistió, cancelada)
 * - 80+ Consultas Médicas completas (signos vitales, CIE-10, evoluciones y recetas)
 */
class ComprehensivePopulationSeeder extends Seeder
{
    public function run(): void
    {
        $passwordHash = Hash::make('Admin123@');
        $ahora = Carbon::now('America/La_Paz');

        // =========================================================================
        // 1. PERMISOS GRANULARES (16 permisos oficiales)
        // =========================================================================
        $todosPermisos = [
            'usuarios.gestionar',
            'roles.gestionar',
            'pacientes.gestionar',
            'citas.gestionar',
            'citas.consultar_agenda',
            'consultas.atender',
            'reportes.consultar',
            'bitacora.consultar',
            'medicos.gestionar',
            'especialidades.gestionar',
            'horarios.gestionar',
            'recetas.gestionar',
            'antecedentes.gestionar',
            'expediente.consultar',
            'seguridad.politicas',
            'analitica.ia',
        ];

        $permisosMap = [];
        foreach ($todosPermisos as $permisoNombre) {
            $p = DB::table('permisos')->where('nombre', $permisoNombre)->first();
            if (!$p) {
                $idPermiso = DB::table('permisos')->insertGetId(['nombre' => $permisoNombre], 'id_permiso');
            } else {
                $idPermiso = $p->id_permiso;
            }
            $permisosMap[$permisoNombre] = $idPermiso;
        }

        $rolAdmin = DB::table('roles')->where('nombre', 'ADMIN')->first();
        $rolRecep = DB::table('roles')->where('nombre', 'RECEPCIONISTA')->first();
        $rolMedico = DB::table('roles')->where('nombre', 'MEDICO')->first();
        $rolPaciente = DB::table('roles')->where('nombre', 'PACIENTE')->first();

        // Admin: todos los permisos
        foreach ($permisosMap as $pId) {
            DB::table('rol_permiso')->updateOrInsert(
                ['id_rol' => $rolAdmin->id_rol, 'id_permiso' => $pId],
                []
            );
        }

        // Recepcionista
        $recepPermisos = [
            'pacientes.gestionar',
            'citas.gestionar',
            'citas.consultar_agenda',
            'recetas.gestionar',
        ];
        foreach ($recepPermisos as $pName) {
            if (isset($permisosMap[$pName])) {
                DB::table('rol_permiso')->updateOrInsert(
                    ['id_rol' => $rolRecep->id_rol, 'id_permiso' => $permisosMap[$pName]],
                    []
                );
            }
        }

        // Médico
        $medicoPermisos = [
            'citas.consultar_agenda',
            'consultas.atender',
            'recetas.gestionar',
            'antecedentes.gestionar',
            'expediente.consultar',
            'analitica.ia',
        ];
        foreach ($medicoPermisos as $pName) {
            if (isset($permisosMap[$pName])) {
                DB::table('rol_permiso')->updateOrInsert(
                    ['id_rol' => $rolMedico->id_rol, 'id_permiso' => $permisosMap[$pName]],
                    []
                );
            }
        }

        // =========================================================================
        // 2. RECEPCIONISTAS (Aumentar a 3)
        // =========================================================================
        $recepcionistas = [
            [
                'username' => 'recepcion.carlos',
                'email' => 'carlos.melgar@clinicalacruz.com',
                'nombre' => 'Carlos Eduardo Melgar Vaca',
            ],
            [
                'username' => 'recepcion.laura',
                'email' => 'laura.aguilera@clinicalacruz.com',
                'nombre' => 'Laura Beatriz Aguilera Pinto',
            ],
        ];

        foreach ($recepcionistas as $rec) {
            $u = DB::table('usuarios')->where('username', $rec['username'])->first();
            if (!$u) {
                $uId = DB::table('usuarios')->insertGetId([
                    'username' => $rec['username'],
                    'email' => $rec['email'],
                    'password_hash' => $passwordHash,
                    'tipo_usuario' => 'RECEPCIONISTA',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => $ahora,
                    'fecha_actualizacion' => $ahora,
                ], 'id_usuario');
                DB::table('usuario_rol')->insertOrIgnore([
                    'id_usuario' => $uId,
                    'id_rol' => $rolRecep->id_rol,
                ]);
            }
        }

        // =========================================================================
        // 3. ESPECIALIDADES MÉDICAS (Aumentar a 12)
        // =========================================================================
        $nuevasEspecialidades = [
            [
                'nombre' => 'Gastroenterología',
                'nombre_normalizado' => 'gastroenterologia',
                'descripcion' => 'Diagnóstico y tratamiento de enfermedades del aparato digestivo, reflujo, gastritis y colon.',
                'edad_min_anios' => 15,
                'edad_max_anios' => null,
                'precio_consulta' => 105.00,
            ],
            [
                'nombre' => 'Neurología',
                'nombre_normalizado' => 'neurologia',
                'descripcion' => 'Evaluación y tratamiento de cefaleas, migrañas, neuropatías y afecciones del sistema nervioso.',
                'edad_min_anios' => 15,
                'edad_max_anios' => null,
                'precio_consulta' => 130.00,
            ],
            [
                'nombre' => 'Otorrinolaringología',
                'nombre_normalizado' => 'otorrinolaringologia',
                'descripcion' => 'Atención especializada en patologías de oído, nariz, senos paranasales y garganta.',
                'edad_min_anios' => 0,
                'edad_max_anios' => null,
                'precio_consulta' => 95.00,
            ],
            [
                'nombre' => 'Endocrinología y Metabolismo',
                'nombre_normalizado' => 'endocrinologia-y-metabolismo',
                'descripcion' => 'Manejo integral de diabetes mellitus, tiroides, metabolismo lipídico y trastornos hormonales.',
                'edad_min_anios' => 12,
                'edad_max_anios' => null,
                'precio_consulta' => 110.00,
            ],
        ];

        foreach ($nuevasEspecialidades as $esp) {
            $existe = DB::table('especialidades')->where('nombre', $esp['nombre'])->first();
            if (!$existe) {
                DB::table('especialidades')->insert([
                    'nombre' => $esp['nombre'],
                    'nombre_normalizado' => $esp['nombre_normalizado'],
                    'descripcion' => $esp['descripcion'],
                    'edad_min_anios' => $esp['edad_min_anios'],
                    'edad_max_anios' => $esp['edad_max_anios'],
                    'precio_consulta' => $esp['precio_consulta'],
                    'estado' => 'ACTIVO',
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ]);
            }
        }

        $especialidadesMap = DB::table('especialidades')->pluck('id_especialidad', 'nombre');

        // =========================================================================
        // 4. PLANTEL DE 16 MÉDICOS (Con 5 Multiespecialidad y Disponibilidades)
        // =========================================================================
        $nuevosMedicos = [
            [
                'username' => 'doctor.vargas',
                'codigo' => 'MED-71829',
                'nombres' => 'Gonzalo Javier',
                'apellidos' => 'Vargas Hurtado',
                'telefono' => '77012345',
                'correo' => 'gonzalo.vargas@clinicalacruz.com',
                'principal' => 'Gastroenterología',
                'secundarias' => ['Medicina General'],
            ],
            [
                'username' => 'doctora.antelo',
                'codigo' => 'MED-82930',
                'nombres' => 'Claudia Patricia',
                'apellidos' => 'Antelo Rojas',
                'telefono' => '78123456',
                'correo' => 'claudia.antelo@clinicalacruz.com',
                'principal' => 'Neurología',
                'secundarias' => ['Geriatría'],
            ],
            [
                'username' => 'doctor.soria',
                'codigo' => 'MED-93041',
                'nombres' => 'Mauricio Andrés',
                'apellidos' => 'Soria Céspedes',
                'telefono' => '79234567',
                'correo' => 'mauricio.soria@clinicalacruz.com',
                'principal' => 'Otorrinolaringología',
                'secundarias' => ['Pediatría'],
            ],
            [
                'username' => 'doctora.guzman',
                'codigo' => 'MED-14152',
                'nombres' => 'Valeria Andrea',
                'apellidos' => 'Guzmán Cuéllar',
                'telefono' => '70345678',
                'correo' => 'valeria.guzman@clinicalacruz.com',
                'principal' => 'Endocrinología y Metabolismo',
                'secundarias' => ['Medicina General'],
            ],
            [
                'username' => 'doctor.ribera',
                'codigo' => 'MED-25263',
                'nombres' => 'Fernando José',
                'apellidos' => 'Ribera Roca',
                'telefono' => '71456789',
                'correo' => 'fernando.ribera@clinicalacruz.com',
                'principal' => 'Medicina General',
                'secundarias' => [],
            ],
            [
                'username' => 'doctora.duran',
                'codigo' => 'MED-36374',
                'nombres' => 'Paola Jimena',
                'apellidos' => 'Durán Banzer',
                'telefono' => '72567890',
                'correo' => 'paola.duran@clinicalacruz.com',
                'principal' => 'Pediatría',
                'secundarias' => [],
            ],
            [
                'username' => 'doctor.justiniano',
                'codigo' => 'MED-47485',
                'nombres' => 'Sergio Daniel',
                'apellidos' => 'Justiniano Paz',
                'telefono' => '73678901',
                'correo' => 'sergio.justiniano@clinicalacruz.com',
                'principal' => 'Cardiología',
                'secundarias' => [],
            ],
            [
                'username' => 'doctora.chavez',
                'codigo' => 'MED-58596',
                'nombres' => 'Silvana Marcela',
                'apellidos' => 'Chávez Egüez',
                'telefono' => '74789012',
                'correo' => 'silvana.chavez@clinicalacruz.com',
                'principal' => 'Ginecología y Obstetricia',
                'secundarias' => [],
            ],
            [
                'username' => 'doctor.aguilera',
                'codigo' => 'MED-69607',
                'nombres' => 'Christian Eduardo',
                'apellidos' => 'Aguilera Soliz',
                'telefono' => '75890123',
                'correo' => 'christian.aguilera@clinicalacruz.com',
                'principal' => 'Traumatología y Ortopedia',
                'secundarias' => [],
            ],
            [
                'username' => 'doctora.montero',
                'codigo' => 'MED-70718',
                'nombres' => 'Natalia Rocío',
                'apellidos' => 'Montero Arteaga',
                'telefono' => '76901234',
                'correo' => 'natalia.montero@clinicalacruz.com',
                'principal' => 'Dermatología',
                'secundarias' => [],
            ],
        ];

        foreach ($nuevosMedicos as $m) {
            $user = DB::table('usuarios')->where('username', $m['username'])->first();
            if (!$user) {
                $idUsuario = DB::table('usuarios')->insertGetId([
                    'username' => $m['username'],
                    'email' => $m['correo'],
                    'password_hash' => $passwordHash,
                    'tipo_usuario' => 'MEDICO',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => $ahora,
                    'fecha_actualizacion' => $ahora,
                ], 'id_usuario');

                DB::table('usuario_rol')->insertOrIgnore([
                    'id_usuario' => $idUsuario,
                    'id_rol' => $rolMedico->id_rol,
                ]);
            } else {
                $idUsuario = $user->id_usuario;
            }

            $medico = DB::table('medicos')->where('codigo_profesional', $m['codigo'])->first();
            if (!$medico) {
                $idMedico = DB::table('medicos')->insertGetId([
                    'id_usuario' => $idUsuario,
                    'codigo_profesional' => $m['codigo'],
                    'nombres' => $m['nombres'],
                    'apellidos' => $m['apellidos'],
                    'telefono_contacto' => $m['telefono'],
                    'correo_profesional' => $m['correo'],
                    'estado_activo' => true,
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ], 'id_medico');
            } else {
                $idMedico = $medico->id_medico;
            }

            // Asignar especialidad principal
            if (isset($especialidadesMap[$m['principal']])) {
                DB::table('medico_especialidad')->updateOrInsert(
                    ['id_medico' => $idMedico, 'id_especialidad' => $especialidadesMap[$m['principal']]],
                    ['es_principal' => true]
                );
            }

            // Asignar secundarias
            foreach ($m['secundarias'] as $secNombre) {
                if (isset($especialidadesMap[$secNombre])) {
                    DB::table('medico_especialidad')->updateOrInsert(
                        ['id_medico' => $idMedico, 'id_especialidad' => $especialidadesMap[$secNombre]],
                        ['es_principal' => false]
                    );
                }
            }
        }

        // Asegurar disponibilidad horaria para todos los 16 médicos (Lunes a Viernes y Sábado)
        $todosLosMedicos = DB::table('medicos')->get();
        foreach ($todosLosMedicos as $medico) {
            for ($dia = 1; $dia <= 5; $dia++) {
                // Mañana: 08:00 - 12:00
                DB::table('disponibilidades')->updateOrInsert(
                    [
                        'id_medico' => $medico->id_medico,
                        'dia_semana' => $dia,
                        'hora_inicio' => '08:00:00',
                        'hora_fin' => '12:00:00',
                    ],
                    [
                        'duracion_cita_minutos' => 30,
                        'activo' => true,
                    ]
                );
                // Tarde: 14:00 - 18:00
                DB::table('disponibilidades')->updateOrInsert(
                    [
                        'id_medico' => $medico->id_medico,
                        'dia_semana' => $dia,
                        'hora_inicio' => '14:00:00',
                        'hora_fin' => '18:00:00',
                    ],
                    [
                        'duracion_cita_minutos' => 30,
                        'activo' => true,
                    ]
                );
            }
            // Sábado mañana: 08:00 - 12:00
            DB::table('disponibilidades')->updateOrInsert(
                [
                    'id_medico' => $medico->id_medico,
                    'dia_semana' => 6,
                    'hora_inicio' => '08:00:00',
                    'hora_fin' => '12:00:00',
                ],
                [
                    'duracion_cita_minutos' => 30,
                    'activo' => true,
                ]
            );
        }

        // =========================================================================
        // 5. PACIENTES (Asegurar los 40 pacientes con datos bolivianos válidos)
        // =========================================================================
        $nuevosPacientesData = [
            // 16 al 35: Pacientes recurrentes
            ['nombres' => 'Alejandra', 'apellidos' => 'Vargas Justiniano', 'fnac' => '1995-03-14', 'sexo' => 'FEMENINO', 'ci' => '9482103', 'sangre' => 'O+', 'tel' => '77301928', 'dir' => 'Av. San Martín #450'],
            ['nombres' => 'Bernardo', 'apellidos' => 'Paz Soldán', 'fnac' => '1982-11-20', 'sexo' => 'MASCULINO', 'ci' => '5839201', 'sangre' => 'A+', 'tel' => '78401922', 'dir' => 'Barrio Sirari Calle 4 #12'],
            ['nombres' => 'Camila Andrea', 'apellidos' => 'Rojas Menacho', 'fnac' => '2001-07-08', 'sexo' => 'FEMENINO', 'ci' => '10293847', 'sangre' => 'B+', 'tel' => '79501833', 'dir' => 'Condominio La Casona Depto 3B'],
            ['nombres' => 'Daniel', 'apellidos' => 'Suárez Justiniano', 'fnac' => '1975-01-30', 'sexo' => 'MASCULINO', 'ci' => '4738291', 'sangre' => 'O+', 'tel' => '70601744', 'dir' => 'Av. Grigotá 3er Anillo #89'],
            ['nombres' => 'Estela', 'apellidos' => 'Morales de Vaca', 'fnac' => '1958-09-15', 'sexo' => 'FEMENINO', 'ci' => '3284910', 'sangre' => 'O-', 'tel' => '71701655', 'dir' => 'Barrio Hamacas Calle 7 #40'],
            ['nombres' => 'Fabián Andrés', 'apellidos' => 'Céspedes Rivero', 'fnac' => '1988-12-05', 'sexo' => 'MASCULINO', 'ci' => '7482910', 'sangre' => 'A+', 'tel' => '72801566', 'dir' => 'Av. Cristo Redentor 5to Anillo'],
            ['nombres' => 'Gabriela', 'apellidos' => 'Antelo Hurtado', 'fnac' => '1992-04-18', 'sexo' => 'FEMENINO', 'ci' => '8392019', 'sangre' => 'AB+', 'tel' => '73901477', 'dir' => 'Barrio Urbari Calle Tobité #22'],
            ['nombres' => 'Hugo Marcelo', 'apellidos' => 'Flores Callisaya', 'fnac' => '1963-08-22', 'sexo' => 'MASCULINO', 'ci' => '3920194', 'sangre' => 'O+', 'tel' => '74001388', 'dir' => 'Av. Busch Calle 9 #31'],
            ['nombres' => 'Inés Rosario', 'apellidos' => 'Gutiérrez Baldivieso', 'fnac' => '1985-02-11', 'sexo' => 'FEMENINO', 'ci' => '6492018', 'sangre' => 'A-', 'tel' => '75101299', 'dir' => 'Villa 1ro de Mayo Calle 3'],
            ['nombres' => 'Jorge Luis', 'apellidos' => 'Montenegro Roca', 'fnac' => '1979-06-25', 'sexo' => 'MASCULINO', 'ci' => '5392017', 'sangre' => 'O+', 'tel' => '76201100', 'dir' => 'Barrio Las Palmas Calle 2 #15'],
            ['nombres' => 'Karina', 'apellidos' => 'Terrazas Saucedo', 'fnac' => '1999-10-14', 'sexo' => 'FEMENINO', 'ci' => '11920384', 'sangre' => 'B-', 'tel' => '77301011', 'dir' => 'Plan 3000 Curva de la Muerte'],
            ['nombres' => 'Leonardo', 'apellidos' => 'Hurtado Mercado', 'fnac' => '2019-05-19', 'sexo' => 'MASCULINO', 'ci' => '13920192', 'sangre' => 'O+', 'tel' => '78401122', 'dir' => 'Av. Tres Pasos al Frente #50'],
            ['nombres' => 'Mariela', 'apellidos' => 'Vaca Díez', 'fnac' => '1990-11-28', 'sexo' => 'FEMENINO', 'ci' => '7829103', 'sangre' => 'A+', 'tel' => '79501233', 'dir' => 'Barrio Polanco Calle 5 #11'],
            ['nombres' => 'Nicolás', 'apellidos' => 'Mendoza Torrico', 'fnac' => '2005-08-03', 'sexo' => 'MASCULINO', 'ci' => '12093847', 'sangre' => 'O+', 'tel' => '70601344', 'dir' => 'Condominio Sevilla Real Casa 45'],
            ['nombres' => 'Olga Marina', 'apellidos' => 'Sandoval Cuéllar', 'fnac' => '1952-12-19', 'sexo' => 'FEMENINO', 'ci' => '2938401', 'sangre' => 'O+', 'tel' => '71701455', 'dir' => 'Calle Warnes #280 Centro'],
            ['nombres' => 'Pablo Renato', 'apellidos' => 'Justiniano Vaca', 'fnac' => '1987-03-09', 'sexo' => 'MASCULINO', 'ci' => '6920182', 'sangre' => 'A+', 'tel' => '72801566', 'dir' => 'Av. Piraí 4to Anillo'],
            ['nombres' => 'Quintina', 'apellidos' => 'Mamani Choque', 'fnac' => '1968-07-27', 'sexo' => 'FEMENINO', 'ci' => '4029184', 'sangre' => 'O+', 'tel' => '73901677', 'dir' => 'Barrio Guaracachi Calle 4 #19'],
            ['nombres' => 'Rodrigo', 'apellidos' => 'Alarcón Peña', 'fnac' => '1996-01-17', 'sexo' => 'MASCULINO', 'ci' => '9019284', 'sangre' => 'B+', 'tel' => '74001788', 'dir' => 'Av. Beni Calle 8 #200'],
            ['nombres' => 'Sara Elizabeth', 'apellidos' => 'Salvatierra Paz', 'fnac' => '2003-09-02', 'sexo' => 'FEMENINO', 'ci' => '11029384', 'sangre' => 'O+', 'tel' => '75101899', 'dir' => 'Barrio Petrolero Norte Calle 3'],
            ['nombres' => 'Tomás', 'apellidos' => 'Beltrán Aguilera', 'fnac' => '2016-04-10', 'sexo' => 'MASCULINO', 'ci' => '14029381', 'sangre' => 'O+', 'tel' => '76201910', 'dir' => 'Av. Virgen de Cotoca Km 4'],

            // 36 al 40: Los 5 pacientes extras con SOLO 1 CITA
            ['nombres' => 'Diego Armando', 'apellidos' => 'Torrico Suárez', 'fnac' => '1998-05-14', 'sexo' => 'MASCULINO', 'ci' => '14890214', 'sangre' => 'O+', 'tel' => '77112233', 'dir' => 'Av. Mutualista 3er Anillo #23'],
            ['nombres' => 'Camila Valentina', 'apellidos' => 'Añez Justiniano', 'fnac' => '2007-10-21', 'sexo' => 'FEMENINO', 'ci' => '15309482', 'sangre' => 'A+', 'tel' => '78223344', 'dir' => 'Barrio El Trompillo Calle 5'],
            ['nombres' => 'Javier Enrique', 'apellidos' => 'Claure Sandoval', 'fnac' => '1974-02-18', 'sexo' => 'MASCULINO', 'ci' => '9812405', 'sangre' => 'O+', 'tel' => '79334455', 'dir' => 'Av. Cañoto esq. 21 de Mayo'],
            ['nombres' => 'Natalia Beatriz', 'apellidos' => 'Soliz Barba', 'fnac' => '1992-12-09', 'sexo' => 'FEMENINO', 'ci' => '12049811', 'sangre' => 'B+', 'tel' => '70445566', 'dir' => 'Condominio Palma Real Dpto 14'],
            ['nombres' => 'Fabricio Leonardo', 'apellidos' => 'Roca Méndez', 'fnac' => '2018-06-30', 'sexo' => 'MASCULINO', 'ci' => '16849201', 'sangre' => 'O+', 'tel' => '71556677', 'dir' => 'Av. Santos Dumont 6to Anillo'],
        ];

        foreach ($nuevosPacientesData as $pData) {
            $pacienteExistente = DB::table('pacientes')->where('numero_documento', $pData['ci'])->first();

            if (!$pacienteExistente) {
                $targetId = (DB::table('pacientes')->max('id_paciente') ?? 0) + 1;
                $numHistoria = sprintf('HC-%04d', $targetId);

                $usernamePaciente = 'paciente.' . strtolower(explode(' ', $pData['nombres'])[0]) . $targetId;
                $emailPaciente = strtolower(explode(' ', $pData['nombres'])[0]) . '.' . strtolower(explode(' ', $pData['apellidos'])[0]) . '@gmail.com';

                $idUsuarioPaciente = DB::table('usuarios')->insertGetId([
                    'username' => $usernamePaciente,
                    'email' => $emailPaciente,
                    'password_hash' => $passwordHash,
                    'tipo_usuario' => 'PACIENTE',
                    'estado' => 'ACTIVO',
                    'intentos_fallidos' => 0,
                    'fecha_creacion' => $ahora,
                    'fecha_actualizacion' => $ahora,
                ], 'id_usuario');

                DB::table('usuario_rol')->insertOrIgnore([
                    'id_usuario' => $idUsuarioPaciente,
                    'id_rol' => $rolPaciente->id_rol,
                ]);

                $idPac = DB::table('pacientes')->insertGetId([
                    'id_paciente' => $targetId,
                    'id_usuario' => $idUsuarioPaciente,
                    'numero_historia' => $numHistoria,
                    'numero_documento' => $pData['ci'],
                    'nombres' => $pData['nombres'],
                    'apellidos' => $pData['apellidos'],
                    'fecha_nacimiento' => $pData['fnac'],
                    'sexo' => $pData['sexo'],
                    'tipo_sangre' => $pData['sangre'],
                    'telefono' => $pData['tel'],
                    'correo' => $emailPaciente,
                    'direccion' => $pData['dir'],
                    'notificaciones_activas' => true,
                    'estado_paciente' => 'ACTIVO',
                    'fecha_registro' => $ahora->copy()->subDays(rand(30, 90)),
                ], 'id_paciente');
            } else {
                $idPac = $pacienteExistente->id_paciente;
            }

            // Contacto de emergencia
            $contactoExistente = DB::table('contactos_emergencia')->where('id_paciente', $idPac)->first();
            if (!$contactoExistente) {
                DB::table('contactos_emergencia')->insert([
                    'id_paciente' => $idPac,
                    'nombre' => 'Familiar de ' . $pData['nombres'],
                    'parentesco' => ($pData['sexo'] === 'FEMENINO' ? 'Esposo/Familiar' : 'Esposa/Familiar'),
                    'telefono' => '77' . rand(100000, 999999),
                ]);
            }
        }

        // =========================================================================
        // 6. HISTORIAS CLÍNICAS (Asegurar que TODOS los 40 pacientes tengan HC)
        // =========================================================================
        $todosPacientes = DB::table('pacientes')->get();
        $historiasMap = []; // id_paciente => id_historia_clinica

        foreach ($todosPacientes as $pac) {
            $hc = DB::table('historias_clinicas')->where('id_paciente', $pac->id_paciente)->first();
            if (!$hc) {
                $idHc = DB::table('historias_clinicas')->insertGetId([
                    'id_paciente' => $pac->id_paciente,
                    'fecha_apertura' => Carbon::parse($pac->fecha_registro)->format('Y-m-d'),
                    'estado' => 'ACTIVO',
                    'created_at' => $pac->fecha_registro,
                    'updated_at' => $ahora,
                ], 'id_historia_clinica');
            } else {
                $idHc = $hc->id_historia_clinica;
            }
            $historiasMap[$pac->id_paciente] = $idHc;
        }

        // =========================================================================
        // 7. ANTECEDENTES MÉDICOS (Para 10 pacientes específicos)
        // =========================================================================
        $adminUserId = $rolAdmin ? DB::table('usuario_rol')->where('id_rol', $rolAdmin->id_rol)->value('id_usuario') : 1;

        $antecedentesDemo = [
            1 => ['tipo' => 'ALERGICO', 'desc' => 'Alergia confirmada a la Penicilina y derivados beta-lactámicos (edema y urticaria).'],
            3 => ['tipo' => 'PATOLOGICO', 'desc' => 'Hipertensión Arterial Primaria Grado 1 diagnosticada en 2023. En tratamiento con Losartán 50mg.'],
            5 => ['tipo' => 'PATOLOGICO', 'desc' => 'Diabetes Mellitus Tipo 2 no insulinodependiente. Control glicémico con Metformina 850mg.'],
            7 => ['tipo' => 'PATOLOGICO', 'desc' => 'Asma bronquial con crisis estacionales. Uso de Salbutamol en aerosol a demanda.'],
            10 => ['tipo' => 'ALERGICO', 'desc' => 'Hipersensibilidad severa a antiinflamatorios no esteroideos (AINEs: Ibuprofeno, Ketorolaco).'],
            12 => ['tipo' => 'QUIRURGICO', 'desc' => 'Apendicectomía laparoscópica realizada sin complicaciones posquirúrgicas en 2021.'],
            18 => ['tipo' => 'QUIRURGICO', 'desc' => 'Colecistectomía convencional por litiasis biliar en 2019.'],
            22 => ['tipo' => 'PATOLOGICO', 'desc' => 'Hipotiroidismo subclínico diagnosticado en 2022. Tratamiento con Levotiroxina 50 mcg/día.'],
            27 => ['tipo' => 'FAMILIAR', 'desc' => 'Padre con antecedente de infarto agudo de miocardio a los 54 años y madre hipertensa.'],
            30 => ['tipo' => 'ALERGICO', 'desc' => 'Alergia alérgica a mariscos y colorantes derivados de tartrazina.'],
        ];

        foreach ($antecedentesDemo as $pacId => $ant) {
            if (isset($historiasMap[$pacId])) {
                $hcId = $historiasMap[$pacId];
                $yaTiene = DB::table('antecedentes')->where('id_historia_clinica', $hcId)->where('tipo_antecedente', $ant['tipo'])->first();
                if (!$yaTiene) {
                    DB::table('antecedentes')->insert([
                        'id_historia_clinica' => $hcId,
                        'tipo_antecedente' => $ant['tipo'],
                        'descripcion' => $ant['desc'],
                        'registrado_por' => $adminUserId,
                        'fecha_registro' => $ahora->copy()->subDays(20),
                        'estado' => 'ACTIVO',
                        'created_at' => $ahora->copy()->subDays(20),
                        'updated_at' => $ahora->copy()->subDays(20),
                    ]);
                }
            }
        }

        // =========================================================================
        // 8. CITAS MÉDICAS, CONSULTAS, DIAGNÓSTICOS, EVOLUCIONES Y RECETAS
        // =========================================================================
        $tiposCita = DB::table('tipos_cita')->pluck('id_tipo_cita')->toArray();
        if (empty($tiposCita)) {
            $tipoId = DB::table('tipos_cita')->insertGetId(['nombre' => 'PRIMERA CONSULTA', 'created_at' => $ahora, 'updated_at' => $ahora], 'id_tipo_cita');
            $tiposCita = [$tipoId];
        }

        $medicosList = DB::table('medicos')->get();
        $totalMedicos = $medicosList->count();

        // Mapeo médico -> especialidad principal
        $medicoEspMap = [];
        foreach ($medicosList as $m) {
            $esp = DB::table('medico_especialidad')->where('id_medico', $m->id_medico)->where('es_principal', true)->value('id_especialidad');
            if (!$esp) {
                $esp = DB::table('medico_especialidad')->where('id_medico', $m->id_medico)->value('id_especialidad') ?? 1;
            }
            $medicoEspMap[$m->id_medico] = $esp;
        }

        // Catálogo clínico realista para consultas
        $catalogoClinico = [
            ['cie' => 'K29.7', 'diag' => 'Gastritis crónica no especificada', 'motivo' => 'Dolor y ardor epigástrico posprandial persistente.', 'trat' => 'Omeprazol 20mg en ayunas por 28 días + dieta blanda hipograsa.', 'med' => 'Omeprazol 20mg cápsulas', 'dosis' => '1 cápsula', 'freq' => 'Cada 24 horas en ayunas', 'dur' => '28 días'],
            ['cie' => 'I10', 'diag' => 'Hipertensión esencial (primaria)', 'motivo' => 'Control de cifras tensionales y cefalea occipital leve.', 'trat' => 'Losartán Potásico 50mg diario + restricción estricta de sodio.', 'med' => 'Losartán Potásico 50mg', 'dosis' => '1 comprimido', 'freq' => 'Cada mañana con el desayuno', 'dur' => '30 días'],
            ['cie' => 'J00', 'diag' => 'Rinofaringitis aguda (resfriado común)', 'motivo' => 'Congestión nasal, odinofagia y febrícula de 48 horas de evolución.', 'trat' => 'Hidratación abundante, paracetamol y lavados nasales salinos.', 'med' => 'Paracetamol 500mg', 'dosis' => '1 comprimido', 'freq' => 'Cada 8 horas si hay dolor o fiebre', 'dur' => '5 días'],
            ['cie' => 'M54.5', 'diag' => 'Lumbago no especificado', 'motivo' => 'Dolor lumbar agudo tras esfuerzo físico en región lumbar baja.', 'trat' => 'Reposo relativo, calor local y antiinflamatorio miorrelajante.', 'med' => 'Ibuprofeno 400mg', 'dosis' => '1 tableta', 'freq' => 'Cada 8 horas después de comidas', 'dur' => '7 días'],
            ['cie' => 'L20.9', 'diag' => 'Dermatitis atópica, no especificada', 'motivo' => 'Prurito intenso y lesiones eritematosas en flexuras de extremidades.', 'trat' => 'Emoliente corporal dos veces al día + antihistamínico oral.', 'med' => 'Cetirizina 10mg', 'dosis' => '1 tableta', 'freq' => 'Cada noche antes de dormir', 'dur' => '14 días'],
            ['cie' => 'H10.9', 'diag' => 'Conjuntivitis, no especificada', 'motivo' => 'Enrojecimiento ocular bilateral, secreción matutina y sensación de arenilla.', 'trat' => 'Colirio antiséptico/lubricante + higiene ocular con compresas tibias.', 'med' => 'Tobramicina 0.3% colirio', 'dosis' => '1 gota', 'freq' => 'Cada 6 horas en ambos ojos', 'dur' => '7 días'],
            ['cie' => 'E11.9', 'diag' => 'Diabetes mellitus no insulinodependiente', 'motivo' => 'Control rutinario de glucemia y evaluación metabólica trimestral.', 'trat' => 'Metformina 850mg con almuerzo + plan de alimentación saludable.', 'med' => 'Metformina 850mg', 'dosis' => '1 tableta', 'freq' => 'Cada 12 horas con las comidas', 'dur' => '30 días'],
            ['cie' => 'G43.9', 'diag' => 'Migraña, no especificada', 'motivo' => 'Cefalea hemicraneana pulsátil acompañada de fotofobia y náuseas.', 'trat' => 'Evitar desencadenantes visuales, analgésico específico al inicio del aura.', 'med' => 'Naproxeno 550mg', 'dosis' => '1 comprimido', 'freq' => 'Al inicio del episodio de dolor', 'dur' => '3 días'],
            ['cie' => 'J02.9', 'diag' => 'Faringitis aguda, no especificada', 'motivo' => 'Dolor intenso al tragar, sequedad de garganta y malestar general.', 'trat' => 'Gárgaras antisépticas, analgésico y analítica faríngea.', 'med' => 'Ibuprofeno 600mg', 'dosis' => '1 tableta', 'freq' => 'Cada 8 horas con alimentos', 'dur' => '5 días'],
            ['cie' => 'K21.9', 'diag' => 'Enfermedad por reflujo gastroesofágico', 'motivo' => 'Pirosis retroesternal nocturna y regurgitación ácida frecuente.', 'trat' => 'Medidas higiénico-dietéticas, elevar cabecera de la cama 15cm y procinético.', 'med' => 'Domperidona 10mg', 'dosis' => '1 comprimido', 'freq' => '15 minutos antes de almuerzo y cena', 'dur' => '21 días'],
        ];

        $codigoIndex = (DB::table('citas')->max('id_cita') ?? 0) + 1;
        $horasSlots = ['08:30:00', '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00', '17:00:00'];

        $canceladasTotales = DB::table('citas')->where('estado', 'CANCELADA')->count();
        $noAsistioTotales = DB::table('citas')->where('estado', 'NO_ASISTIO')->count();

        // Control de colisiones horarias en memoria
        $occupiedSlots = []; // [id_medico][datetime_str] => true
        $existingCitas = DB::table('citas')->where('estado', '!=', 'CANCELADA')->get(['id_medico', 'fecha_hora_inicio']);
        foreach ($existingCitas as $ec) {
            $occupiedSlots[$ec->id_medico][$ec->fecha_hora_inicio] = true;
        }

        foreach ($todosPacientes as $pac) {
            $pacId = $pac->id_paciente;
            $hcId = $historiasMap[$pacId] ?? null;
            if (!$hcId) continue;

            $citasCountPaciente = DB::table('citas')->where('id_paciente', $pacId)->count();
            $metaCitas = ($pacId >= 36 && $pacId <= 40) ? 1 : 3;

            if ($citasCountPaciente >= $metaCitas) {
                continue;
            }

            $citasFaltantes = $metaCitas - $citasCountPaciente;

            for ($i = 0; $i < $citasFaltantes; $i++) {
                $codigoCita = sprintf('CM-%04d', $codigoIndex++);
                $medico = $medicosList[($pacId + $i) % $totalMedicos];
                $idEsp = $medicoEspMap[$medico->id_medico] ?? 1;
                $idTipo = $tiposCita[($i) % count($tiposCita)];

                // Determinar fecha y estado
                if ($pacId >= 36 && $pacId <= 40) {
                    // Los 5 extras: 1 cita cada uno (3 atendidas pasadas, 2 futuras)
                    if ($pacId <= 38) {
                        $fechaCita = $ahora->copy()->subDays(rand(7, 24));
                        $estado = 'ATENDIDA';
                    } else {
                        $fechaCita = $ahora->copy()->addDays(rand(1, 5));
                        $estado = 'PROGRAMADA';
                    }
                } else {
                    // Pacientes 1 a 35 (3 citas)
                    if ($i === 0) {
                        $fechaCita = $ahora->copy()->subDays(rand(20, 28));
                        $estado = 'ATENDIDA';
                    } elseif ($i === 1) {
                        $fechaCita = $ahora->copy()->subDays(rand(8, 19));
                        if ($canceladasTotales < 4 && ($pacId % 9 === 0)) {
                            $estado = 'CANCELADA';
                            $canceladasTotales++;
                        } elseif ($noAsistioTotales < 4 && ($pacId % 8 === 0)) {
                            $estado = 'NO_ASISTIO';
                            $noAsistioTotales++;
                        } else {
                            $estado = 'ATENDIDA';
                        }
                    } else {
                        if ($pacId % 3 === 0) {
                            $fechaCita = $ahora->copy()->addDays(rand(1, 6));
                            $estado = ($pacId % 2 === 0) ? 'CONFIRMADA' : 'PROGRAMADA';
                        } else {
                            $fechaCita = $ahora->copy()->subDays(rand(1, 6));
                            $estado = 'ATENDIDA';
                        }
                    }
                }

                // Evitar colisión de turno con slot anti-overlap
                $slotFound = false;
                $slotTry = 0;
                $fInicio = null;
                $fFin = null;

                while (!$slotFound && $slotTry < count($horasSlots)) {
                    $horaStr = $horasSlots[($pacId + $i + $slotTry) % count($horasSlots)];
                    $candidateInicio = Carbon::parse($fechaCita->format('Y-m-d') . ' ' . $horaStr);
                    $candidateKey = $candidateInicio->toDateTimeString();

                    if (!isset($occupiedSlots[$medico->id_medico][$candidateKey]) || $estado === 'CANCELADA') {
                        $fInicio = $candidateInicio;
                        $fFin = $candidateInicio->copy()->addMinutes(30);
                        if ($estado !== 'CANCELADA') {
                            $occupiedSlots[$medico->id_medico][$candidateKey] = true;
                        }
                        $slotFound = true;
                    }
                    $slotTry++;
                }

                if (!$fInicio) {
                    $fInicio = Carbon::parse($fechaCita->format('Y-m-d') . ' 11:30:00');
                    $fFin = $fInicio->copy()->addMinutes(30);
                }

                $clinicaData = $catalogoClinico[($pacId + $i) % count($catalogoClinico)];

                $motivoCancelacion = null;
                $canceladaEn = null;
                if ($estado === 'CANCELADA') {
                    $motivoCancelacion = 'Paciente reportó conflicto laboral imprevisto y solicitó reprogramar su turno.';
                    $canceladaEn = $fInicio->copy()->subHours(4);
                }

                $idCita = DB::table('citas')->insertGetId([
                    'codigo_cita' => $codigoCita,
                    'id_paciente' => $pacId,
                    'id_medico' => $medico->id_medico,
                    'id_especialidad' => $idEsp,
                    'id_tipo_cita' => $idTipo,
                    'fecha_hora_inicio' => $fInicio,
                    'fecha_hora_fin' => $fFin,
                    'duracion_minutos' => 30,
                    'estado' => $estado,
                    'modalidad' => 'PRESENCIAL',
                    'motivo_consulta' => $clinicaData['motivo'],
                    'motivo_cancelacion' => $motivoCancelacion,
                    'cancelada_en' => $canceladaEn,
                    'creada_por' => $adminUserId,
                    'created_at' => $fInicio->copy()->subDays(2),
                    'updated_at' => ($estado === 'ATENDIDA') ? $fFin : $fInicio,
                ], 'id_cita');

                // Historial de estados de la cita
                DB::table('cita_estado_historial')->insert([
                    'id_cita' => $idCita,
                    'estado_anterior' => null,
                    'estado_nuevo' => ($estado === 'ATENDIDA' || $estado === 'CONFIRMADA') ? 'PROGRAMADA' : $estado,
                    'id_usuario' => $adminUserId,
                    'observacion' => 'Registro inicial de cita médica en agenda.',
                    'fecha_cambio' => $fInicio->copy()->subDays(2),
                ]);

                if ($estado === 'CONFIRMADA' || $estado === 'ATENDIDA' || $estado === 'CANCELADA' || $estado === 'NO_ASISTIO') {
                    DB::table('cita_estado_historial')->insert([
                        'id_cita' => $idCita,
                        'estado_anterior' => 'PROGRAMADA',
                        'estado_nuevo' => $estado,
                        'id_usuario' => $adminUserId,
                        'observacion' => ($estado === 'CANCELADA') ? $motivoCancelacion : ($estado === 'NO_ASISTIO' ? 'El paciente no se presentó al consultorio médico en su turno fijado.' : 'Atención médica completada con éxito.'),
                        'fecha_cambio' => ($estado === 'ATENDIDA') ? $fFin : ($estado === 'CANCELADA' ? $canceladaEn : $fInicio),
                    ]);
                }

                // Si está ATENDIDA: generar Consulta Médica, Diagnóstico, Evolución y Receta
                if ($estado === 'ATENDIDA') {
                    $peso = rand(55, 88) + (rand(0, 9) / 10);
                    $talla = rand(155, 185) + (rand(0, 9) / 10);
                    $temp = 36.2 + (rand(0, 12) / 10);
                    $sistolica = rand(110, 135);
                    $diastolica = rand(70, 88);
                    $fc = rand(65, 85);

                    $idConsulta = DB::table('consultas_medicas')->insertGetId([
                        'id_cita' => $idCita,
                        'id_historia_clinica' => $hcId,
                        'id_medico' => $medico->id_medico,
                        'motivo_consulta' => $clinicaData['motivo'],
                        'peso_kg' => $peso,
                        'talla_cm' => $talla,
                        'temperatura_c' => $temp,
                        'presion_arterial' => $sistolica . '/' . $diastolica,
                        'frecuencia_cardiaca' => $fc,
                        'observaciones' => 'Paciente colaborador, afebril, orientado en tiempo y espacio. Examen físico acorde a motivo de consulta.',
                        'plan_tratamiento' => $clinicaData['trat'],
                        'fecha_consulta' => $fFin,
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ], 'id_consulta');

                    // Diagnóstico CIE-10
                    DB::table('diagnosticos')->insert([
                        'id_historia_clinica' => $hcId,
                        'id_consulta' => $idConsulta,
                        'descripcion' => $clinicaData['diag'],
                        'codigo_cie10' => $clinicaData['cie'],
                        'tipo' => 'DEFINITIVO',
                        'fecha_registro' => $fFin,
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ]);

                    // Nota de Evolución
                    DB::table('evoluciones')->insert([
                        'id_historia_clinica' => $hcId,
                        'id_medico' => $medico->id_medico,
                        'nota' => 'Evolución satisfactoria. Se inicia esquema terapéutico según protocolo institucional. Control programado en caso de persistencia de síntomas.',
                        'fecha_registro' => $fFin,
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ]);

                    // Receta Médica
                    $idReceta = DB::table('recetas')->insertGetId([
                        'id_historia_clinica' => $hcId,
                        'id_consulta' => $idConsulta,
                        'id_medico' => $medico->id_medico,
                        'fecha_emision' => $fFin,
                        'indicaciones_generales' => 'Tomar medicación con suficiente agua. Cumplir estrictamente el horario prescrito sin suspender el tratamiento antes del tiempo fijado.',
                        'estado' => 'ACTIVO',
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ], 'id_receta');

                    // Detalle de receta
                    DB::table('receta_detalles')->insert([
                        'id_receta' => $idReceta,
                        'medicamento' => $clinicaData['med'],
                        'dosis' => $clinicaData['dosis'],
                        'frecuencia' => $clinicaData['freq'],
                        'duracion' => $clinicaData['dur'],
                        'indicaciones' => 'Administración por vía oral con agua tibia.',
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ]);
                }
            }
        }

        // =========================================================================
        // 9. SINCRONIZAR SECUENCIAS POSTGRESQL (Para garantizar inserts posteriores)
        // =========================================================================
        $tablasSeq = [
            'pacientes' => 'pacientes_id_paciente_seq',
            'usuarios' => 'usuarios_id_usuario_seq',
            'medicos' => 'medicos_id_medico_seq',
            'especialidades' => 'especialidades_id_especialidad_seq',
            'citas' => 'citas_id_cita_seq',
            'consultas_medicas' => 'consultas_medicas_id_consulta_seq',
            'diagnosticos' => 'diagnosticos_id_diagnostico_seq',
            'evoluciones' => 'evoluciones_id_evolucion_seq',
            'recetas' => 'recetas_id_receta_seq',
            'receta_detalles' => 'receta_detalles_id_detalle_seq',
            'historias_clinicas' => 'historias_clinicas_id_historia_clinica_seq',
            'antecedentes' => 'antecedentes_id_antecedente_seq',
            'cita_estado_historial' => 'cita_estado_historial_id_historial_seq',
            'contactos_emergencia' => 'contactos_emergencia_id_contacto_seq',
        ];

        foreach ($tablasSeq as $tabla => $seq) {
            try {
                $pkCol = DB::select("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = '{$tabla}'::regclass AND i.indisprimary")[0]->attname ?? 'id';
                DB::statement("SELECT setval('{$seq}', COALESCE((SELECT MAX({$pkCol}) FROM {$tabla}), 1))");
            } catch (\Throwable $e) {
                // Silencioso si la secuencia o tabla no aplica
            }
        }
    }
}

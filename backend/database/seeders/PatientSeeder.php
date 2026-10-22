<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder de 15 pacientes con diversidad de edades y datos de emergencia (CU04 / RF02)
 */
class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $idUserCarlos   = DB::table('usuarios')->where('username', 'paciente.carlos')->value('id_usuario');
        $idUserMariana  = DB::table('usuarios')->where('username', 'paciente.mariana')->value('id_usuario');
        $idUserValeria  = DB::table('usuarios')->where('username', 'paciente.valeria')->value('id_usuario');
        $idUserFernando = DB::table('usuarios')->where('username', 'paciente.fernando')->value('id_usuario');

        $pacientes = [
            [
                'id_paciente' => 1,
                'id_usuario' => null,
                'numero_historia' => 'HC-0001',
                'numero_documento' => '12458901',
                'nombres' => 'Mateo',
                'apellidos' => 'Morales Choque',
                'fecha_nacimiento' => '2022-04-12',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'O+',
                'telefono' => '77123401',
                'correo' => 'familia.morales@gmail.com',
                'direccion' => 'Barrio Equipetrol, Calle 7 Este #120',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-01-15 08:30:00',
                'contacto' => [
                    'nombre' => 'Andrea Choque de Morales',
                    'parentesco' => 'Madre',
                    'telefono' => '77123499',
                ],
            ],
            [
                'id_paciente' => 2,
                'id_usuario' => null,
                'numero_historia' => 'HC-0002',
                'numero_documento' => '10982344',
                'nombres' => 'Luciana',
                'apellidos' => 'Quispe Mendoza',
                'fecha_nacimiento' => '2018-09-24',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'A+',
                'telefono' => '78541202',
                'correo' => 'luciana.padres@hotmail.com',
                'direccion' => 'Av. Banzer 4to Anillo, Condominio Sevilla',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-02-10 09:15:00',
                'contacto' => [
                    'nombre' => 'Jorge Quispe Balderrama',
                    'parentesco' => 'Padre',
                    'telefono' => '78541288',
                ],
            ],
            [
                'id_paciente' => 3,
                'id_usuario' => null,
                'numero_historia' => 'HC-0003',
                'numero_documento' => '98451230',
                'nombres' => 'Thiago',
                'apellidos' => 'Rojas Gutiérrez',
                'fecha_nacimiento' => '2014-06-03',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'B+',
                'telefono' => '76098203',
                'correo' => 'rojas.thiago.salud@gmail.com',
                'direccion' => 'Av. San Martín #450, Barrio Sirari',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-03-05 10:00:00',
                'contacto' => [
                    'nombre' => 'Silvia Gutiérrez de Rojas',
                    'parentesco' => 'Madre',
                    'telefono' => '76098277',
                ],
            ],
            [
                'id_paciente' => 4,
                'id_usuario' => null,
                'numero_historia' => 'HC-0004',
                'numero_documento' => '13567891',
                'nombres' => 'Valentina',
                'apellidos' => 'Fernández Arias',
                'fecha_nacimiento' => '2024-02-18',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'O+',
                'telefono' => '71239804',
                'correo' => 'valen.fernandez@gmail.com',
                'direccion' => 'Plan 3000, UV 105, Manzana 12',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-03-20 11:30:00',
                'contacto' => [
                    'nombre' => 'Claudia Arias de Fernández',
                    'parentesco' => 'Madre',
                    'telefono' => '71239866',
                ],
            ],
            [
                'id_paciente' => 5,
                'id_usuario' => $idUserCarlos,
                'numero_historia' => 'HC-0005',
                'numero_documento' => '78923410',
                'nombres' => 'Carlos Andrés',
                'apellidos' => 'Silva Vargas',
                'fecha_nacimiento' => '1998-05-14',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'O+',
                'telefono' => '76345605',
                'correo' => 'carlos.silva.v@gmail.com',
                'direccion' => 'Av. Bush, 2do Anillo #320',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-04-02 14:00:00',
                'contacto' => [
                    'nombre' => 'Lorena Vargas Méndez',
                    'parentesco' => 'Madre',
                    'telefono' => '76345655',
                ],
            ],
            [
                'id_paciente' => 6,
                'id_usuario' => $idUserMariana,
                'numero_historia' => 'HC-0006',
                'numero_documento' => '65432190',
                'nombres' => 'Mariana',
                'apellidos' => 'Torrico Soliz',
                'fecha_nacimiento' => '1992-11-29',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'A+',
                'telefono' => '70987606',
                'correo' => 'mariana.torrico@gmail.com',
                'direccion' => 'Calle René Moreno #560, Centro',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-04-18 15:45:00',
                'contacto' => [
                    'nombre' => 'Daniel Torrico Soliz',
                    'parentesco' => 'Hermano',
                    'telefono' => '70987644',
                ],
            ],
            [
                'id_paciente' => 7,
                'id_usuario' => null,
                'numero_historia' => 'HC-0007',
                'numero_documento' => '54321870',
                'nombres' => 'Rodrigo',
                'apellidos' => 'Benítez Mercado',
                'fecha_nacimiento' => '1981-08-07',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'B+',
                'telefono' => '77891207',
                'correo' => 'r.benitez.m@empresa.com',
                'direccion' => 'Av. Monseñor Rivero #890',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-05-10 08:00:00',
                'contacto' => [
                    'nombre' => 'Beatriz Mercado vda. de Benítez',
                    'parentesco' => 'Esposa',
                    'telefono' => '77891233',
                ],
            ],
            [
                'id_paciente' => 8,
                'id_usuario' => null,
                'numero_historia' => 'HC-0008',
                'numero_documento' => '89012340',
                'nombres' => 'Gabriela',
                'apellidos' => 'Paz Castedo',
                'fecha_nacimiento' => '2004-03-16',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'O-',
                'telefono' => '78901208',
                'correo' => 'gaby.paz.castedo@gmail.com',
                'direccion' => 'Av. Cristo Redentor 6to Anillo',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-05-28 16:20:00',
                'contacto' => [
                    'nombre' => 'Eduardo Paz Cuéllar',
                    'parentesco' => 'Padre',
                    'telefono' => '78901222',
                ],
            ],
            [
                'id_paciente' => 9,
                'id_usuario' => null,
                'numero_historia' => 'HC-0009',
                'numero_documento' => '45678901',
                'nombres' => 'Javier',
                'apellidos' => 'Mendoza Claros',
                'fecha_nacimiento' => '1974-01-22',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'AB+',
                'telefono' => '71234509',
                'correo' => 'javier.mendoza.c@yahoo.es',
                'direccion' => 'Barrio Las Palmas, Calle Los Tajibos #88',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-06-12 10:40:00',
                'contacto' => [
                    'nombre' => 'Teresa Claros de Mendoza',
                    'parentesco' => 'Esposa',
                    'telefono' => '71234511',
                ],
            ],
            [
                'id_paciente' => 10,
                'id_usuario' => $idUserValeria,
                'numero_historia' => 'HC-0010',
                'numero_documento' => '60123450',
                'nombres' => 'Valeria',
                'apellidos' => 'Escalante Romero',
                'fecha_nacimiento' => '1988-07-30',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'A-',
                'telefono' => '76543210',
                'correo' => 'valeria.escalante@gmail.com',
                'direccion' => 'Villa 1ro de Mayo, Calle 3 #45',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-06-25 12:10:00',
                'contacto' => [
                    'nombre' => 'Gonzalo Escalante Romero',
                    'parentesco' => 'Hermano',
                    'telefono' => '76543200',
                ],
            ],
            [
                'id_paciente' => 11,
                'id_usuario' => $idUserFernando,
                'numero_historia' => 'HC-0011',
                'numero_documento' => '94561230',
                'nombres' => 'Fernando',
                'apellidos' => 'Justiniano Vaca',
                'fecha_nacimiento' => '2007-10-05',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'O+',
                'telefono' => '77451211',
                'correo' => 'fer.justiniano@estudiante.edu',
                'direccion' => 'Av. Tres Pasos al Frente #1200',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-07-04 17:00:00',
                'contacto' => [
                    'nombre' => 'Patricia Vaca Justiniano',
                    'parentesco' => 'Madre',
                    'telefono' => '77451299',
                ],
            ],
            [
                'id_paciente' => 12,
                'id_usuario' => null,
                'numero_historia' => 'HC-0012',
                'numero_documento' => '34567890',
                'nombres' => 'Donato',
                'apellidos' => 'Flores Mamani',
                'fecha_nacimiento' => '1959-03-19',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'O+',
                'telefono' => '78123412',
                'correo' => 'donato.flores.m@gmail.com',
                'direccion' => 'Av. Santos Dumont 3er Anillo #230',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-07-22 09:00:00',
                'contacto' => [
                    'nombre' => 'Marcos Flores Quisbert',
                    'parentesco' => 'Hijo',
                    'telefono' => '78123488',
                ],
            ],
            [
                'id_paciente' => 13,
                'id_usuario' => null,
                'numero_historia' => 'HC-0013',
                'numero_documento' => '23456780',
                'nombres' => 'Rosa Elena',
                'apellidos' => 'Pinto vda. de Suárez',
                'fecha_nacimiento' => '1952-12-08',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'A+',
                'telefono' => '70891213',
                'correo' => 'contacto.familia.pinto@gmail.com',
                'direccion' => 'Barrio Hamacas, Calle 8 #34',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-08-14 11:15:00',
                'contacto' => [
                    'nombre' => 'Sonia Suárez Pinto',
                    'parentesco' => 'Hija',
                    'telefono' => '70891277',
                ],
            ],
            [
                'id_paciente' => 14,
                'id_usuario' => null,
                'numero_historia' => 'HC-0014',
                'numero_documento' => '18901230',
                'nombres' => 'Humberto',
                'apellidos' => 'Arteaga Caballero',
                'fecha_nacimiento' => '1945-04-27',
                'sexo' => 'MASCULINO',
                'tipo_sangre' => 'B+',
                'telefono' => '76321214',
                'correo' => 'humberto.arteaga@servicios.bo',
                'direccion' => 'Condominio Urbari, Casa 15',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-09-02 14:30:00',
                'contacto' => [
                    'nombre' => 'Guillermo Arteaga Peña',
                    'parentesco' => 'Hijo',
                    'telefono' => '76321266',
                ],
            ],
            [
                'id_paciente' => 15,
                'id_usuario' => null,
                'numero_historia' => 'HC-0015',
                'numero_documento' => '38901230',
                'nombres' => 'Carmen Teresa',
                'apellidos' => 'Ribera Céspedes',
                'fecha_nacimiento' => '1963-08-11',
                'sexo' => 'FEMENINO',
                'tipo_sangre' => 'O+',
                'telefono' => '77894515',
                'correo' => 'carmen.ribera.c@gmail.com',
                'direccion' => 'Av. Grigotá 2do Anillo #450',
                'notificaciones_activas' => true,
                'estado_paciente' => 'ACTIVO',
                'fecha_registro' => '2026-09-20 16:00:00',
                'contacto' => [
                    'nombre' => 'Mauricio Ribera Céspedes',
                    'parentesco' => 'Hijo',
                    'telefono' => '77894555',
                ],
            ],
        ];

        foreach ($pacientes as $item) {
            $contacto = $item['contacto'];
            unset($item['contacto']);

            // Insertar o actualizar paciente
            $pacienteExistente = DB::table('pacientes')
                ->where('numero_documento', $item['numero_documento'])
                ->first();

            if (!$pacienteExistente) {
                $idPaciente = DB::table('pacientes')->insertGetId($item, 'id_paciente');
            } else {
                $idPaciente = $pacienteExistente->id_paciente;
                // Si el seeder trae id_usuario, actualizar vinculación de cuenta web
                $updateData = [];
                if (!empty($item['id_usuario'])) {
                    $updateData['id_usuario'] = $item['id_usuario'];
                }
                if (!empty($item['estado_paciente'])) {
                    $updateData['estado_paciente'] = $item['estado_paciente'];
                }
                if (!empty($updateData)) {
                    DB::table('pacientes')->where('id_paciente', $idPaciente)->update($updateData);
                }
            }

            // Insertar contacto de emergencia si no existe
            $contactoExiste = DB::table('contactos_emergencia')
                ->where('id_paciente', $idPaciente)
                ->exists();

            if (!$contactoExiste && $contacto) {
                DB::table('contactos_emergencia')->insert([
                    'id_paciente' => $idPaciente,
                    'nombre'      => $contacto['nombre'],
                    'parentesco'  => $contacto['parentesco'],
                    'telefono'    => $contacto['telefono'],
                ]);
            }
        }
    }
}

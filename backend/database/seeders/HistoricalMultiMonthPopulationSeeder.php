<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Seeder de Población Histórica Multimes (4 a 6 meses hacia atrás)
 * Metodología PUDS / RUP — Centro Médico La Cruz
 * 
 * Genera un historial clínico y financiero continuo desde hace 140 días (~4.5 meses)
 * hasta la fecha actual para alimentar:
 * - CU22: Reportes con Filtros Dinámicos (RF13) en rangos mensuales y trimestrales
 * - CU24: Dashboard y Analítica de KPIs con evolución temporal
 * - CU15: Historial cronológico de pacientes recurrentes
 * - CU19: Expedientes clínicos con líneas de tiempo profundas
 */
class HistoricalMultiMonthPopulationSeeder extends Seeder
{
    public function run(): void
    {
        $ahora = Carbon::now('America/La_Paz');
        $adminUser = DB::table('usuarios')->where('tipo_usuario', 'ADMIN')->first();
        $adminId = $adminUser ? $adminUser->id_usuario : 1;

        // 1. Obtener catálogos existentes
        $medicos = DB::table('medicos')->where('estado_activo', true)->get();
        if ($medicos->isEmpty()) {
            return;
        }

        $especialidades = DB::table('especialidades')->get()->keyBy('id_especialidad');
        $tiposCita = DB::table('tipos_cita')->pluck('id_tipo_cita')->toArray();
        if (empty($tiposCita)) {
            $tiposCita = [1];
        }

        // Mapeo de especialidad principal por médico
        $medicoEspMap = DB::table('medico_especialidad')
            ->select('id_medico', DB::raw('MIN(id_especialidad) as id_especialidad'))
            ->groupBy('id_medico')
            ->pluck('id_especialidad', 'id_medico')
            ->toArray();

        // 2. Crear 25 Pacientes Históricos adicionales con registros fechados entre 4 y 6 meses atrás
        $nombresV = ['Gonzalo', 'Mario', 'Bernardo', 'Raúl', 'Marcelo', 'Gustavo', 'Ignacio', 'Fabián', 'Víctor', 'René', 'Boris', 'Hugo'];
        $nombresM = ['Silvia', 'Verónica', 'Beatriz', 'Gladys', 'Leticia', 'Carla', 'Patricia', 'Lorena', 'Roxana', 'Teresa', 'Alicia', 'Miriam'];
        $apellidos = ['Céspedes', 'Baldivieso', 'Saucedo', 'Aguilera', 'Montero', 'Dorado', 'Justiniano', 'Roca', 'Barbery', 'Villagómez', 'Hurtado', 'Melgar', 'Zeballos', 'Pinto'];
        $barrios = ['Equipetrol Norte', 'Barrio Urbari', 'Las Palmas', 'Sirari', 'Villa Fraterna', 'Av. Busch 3er Anillo', 'Remanso', 'Hamacas Calle 4'];

        $maxHc = DB::table('pacientes')
            ->where('numero_historia', 'LIKE', 'HC-%')
            ->selectRaw("MAX(CAST(SUBSTRING(numero_historia FROM 4) AS INTEGER)) as max_num")
            ->value('max_num') ?? 60;

        $pacientesNuevosIds = [];

        for ($k = 1; $k <= 25; $k++) {
            $maxHc++;
            $esVaron = ($k % 2 === 0);
            $nom = $esVaron ? $nombresV[array_rand($nombresV)] : $nombresM[array_rand($nombresM)];
            $ape = $apellidos[array_rand($apellidos)] . ' ' . $apellidos[array_rand($apellidos)];
            $doc = (string) (70000000 + $maxHc * 137);

            // Variabilidad etaria para RF04
            if ($k % 5 === 0) {
                $anios = rand(3, 14); // Pediátrico
            } elseif ($k % 4 === 0) {
                $anios = rand(61, 84); // Geriátrico
            } else {
                $anios = rand(22, 58); // Adulto
            }

            $fechaNac = $ahora->copy()->subYears($anios)->subDays(rand(10, 300))->format('Y-m-d');
            $fechaReg = $ahora->copy()->subDays(rand(120, 180)); // Registrados hace 4 a 6 meses

            $idPac = DB::table('pacientes')->insertGetId([
                'numero_historia'       => sprintf('HC-%04d', $maxHc),
                'numero_documento'      => $doc,
                'nombres'               => $nom,
                'apellidos'             => $ape,
                'fecha_nacimiento'      => $fechaNac,
                'sexo'                  => $esVaron ? 'MASCULINO' : 'FEMENINO',
                'tipo_sangre'           => ['O+', 'A+', 'B+', 'O-'][array_rand(['O+', 'A+', 'B+', 'O-'])],
                'telefono'              => '7' . rand(1000000, 8999999),
                'correo'                => strtolower("{$nom}.{$doc}@gmail.com"),
                'direccion'             => $barrios[array_rand($barrios)] . ', Edif. ' . rand(1, 20),
                'notificaciones_activas' => true,
                'estado_paciente'       => 'ACTIVO',
                'fecha_registro'        => $fechaReg,
            ], 'id_paciente');

            // Crear Historia Clínica para el paciente
            $idHc = DB::table('historias_clinicas')->insertGetId([
                'id_paciente'      => $idPac,
                'fecha_apertura'   => $fechaReg,
                'estado'           => 'ACTIVO',
                'created_at'       => $fechaReg,
                'updated_at'       => $fechaReg,
            ], 'id_historia_clinica');

            // Contacto de emergencia
            DB::table('contactos_emergencia')->insert([
                'id_paciente' => $idPac,
                'nombre'      => ($esVaron ? 'Carmen ' : 'Jorge ') . explode(' ', $ape)[0],
                'parentesco'  => ['Cónyuge', 'Madre', 'Padre', 'Hijo(a)', 'Hermano(a)'][array_rand(['Cónyuge', 'Madre', 'Padre', 'Hijo(a)', 'Hermano(a)'])],
                'telefono'    => '7' . rand(1000000, 8999999),
            ]);

            $pacientesNuevosIds[] = [
                'id_paciente'        => $idPac,
                'id_historia_clinica'=> $idHc,
                'nombre_completo'    => "{$nom} {$ape}",
                'edad'               => $anios,
            ];
        }

        // Combinar con pacientes preexistentes
        $todosPacientes = DB::table('pacientes')
            ->join('historias_clinicas', 'pacientes.id_paciente', '=', 'historias_clinicas.id_paciente')
            ->select('pacientes.id_paciente', 'historias_clinicas.id_historia_clinica', 'pacientes.nombres', 'pacientes.apellidos', 'pacientes.fecha_nacimiento')
            ->get();

        // 3. Catálogo clínico para las consultas históricas por especialidad
        $diagnosticosPorEsp = [
            1 => [ // Medicina General
                ['cie' => 'I10', 'desc' => 'Hipertensión esencial (primaria)', 'plan' => 'Iniciar Losartán 50mg cada 12h, dieta hiposódica y control en 15 días.', 'med' => 'Losartán', 'dosis' => '50 mg', 'freq' => 'Cada 12 horas', 'dur' => '30 días'],
                ['cie' => 'K29.7', 'desc' => 'Gastritis, no especificada', 'plan' => 'Omeprazol 20mg en ayunas por 28 días, evitar irritantes y comidas grasas.', 'med' => 'Omeprazol', 'dosis' => '20 mg', 'freq' => 'Cada 24 horas (ayunas)', 'dur' => '28 días'],
                ['cie' => 'J00', 'desc' => 'Rinofaringitis aguda (resfriado común)', 'plan' => 'Reposo relativo, hidratación abundante y Paracetamol condicional a fiebre.', 'med' => 'Paracetamol', 'dosis' => '500 mg', 'freq' => 'Cada 8 horas si hay dolor o fiebre', 'dur' => '5 días'],
                ['cie' => 'M54.5', 'desc' => 'Lumbago no especificado', 'plan' => 'Ibuprofeno 400mg con las comidas, calor local seco y evitar sobrecargas de peso.', 'med' => 'Ibuprofeno', 'dosis' => '400 mg', 'freq' => 'Cada 8 horas con alimentos', 'dur' => '7 días'],
            ],
            2 => [ // Cardiología
                ['cie' => 'I25.1', 'desc' => 'Enfermedad aterosclerótica del corazón', 'plan' => 'Atorvastatina 20mg nocturna, Aspirina 100mg/día y ecocardiograma transtorácico.', 'med' => 'Atorvastatina', 'dosis' => '20 mg', 'freq' => 'Una vez al día (noche)', 'dur' => '60 días'],
                ['cie' => 'I49.9', 'desc' => 'Arritmia cardíaca, no especificada', 'plan' => 'Monitoreo Holter de 24h, Bisoprolol 2.5mg matutino y seguimiento cardiológico.', 'med' => 'Bisoprolol', 'dosis' => '2.5 mg', 'freq' => 'Cada 24 horas', 'dur' => '30 días'],
                ['cie' => 'I11.9', 'desc' => 'Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca', 'plan' => 'Amlodipino 5mg combinado con Enalapril 10mg, perfil lipídico y fondo de ojo.', 'med' => 'Amlodipino', 'dosis' => '5 mg', 'freq' => 'Cada mañana', 'dur' => '30 días'],
            ],
            3 => [ // Pediatría
                ['cie' => 'J02.9', 'desc' => 'Faringitis aguda, no especificada', 'plan' => 'Amoxicilina suspensión 250mg/5ml según peso por 7 días, abundantes líquidos.', 'med' => 'Amoxicilina Suspensión', 'dosis' => '5 ml (250 mg)', 'freq' => 'Cada 8 horas', 'dur' => '7 días'],
                ['cie' => 'K52.9', 'desc' => 'Gastroenteritis y colitis no infecciosas, no especificadas', 'plan' => 'Sales de rehidratación oral fraccionadas, Zinc 10mg/día y dieta blanda astringente.', 'med' => 'Sales de Rehidratación Oral', 'dosis' => '1 sobre en 1 litro', 'freq' => 'A libre demanda tras cada deposición', 'dur' => '3 días'],
                ['cie' => 'L20.9', 'desc' => 'Dermatitis atópica, no especificada', 'plan' => 'Crema emoliente hipoalergénica tras el baño y Cetirizina jarabe condicional a prurito.', 'med' => 'Cetirizina Jarabe', 'dosis' => '2.5 ml', 'freq' => 'Cada 24 horas en la noche', 'dur' => '5 días'],
            ],
            4 => [ // Ginecología y Obstetricia
                ['cie' => 'N92.0', 'desc' => 'Menstruación excesiva y frecuente con ciclo regular', 'plan' => 'Ácido Tranexámico durante los días de sangrado abundante, ecografía pélvica.', 'med' => 'Ácido Tranexámico', 'dosis' => '500 mg', 'freq' => 'Cada 8 horas durante sangrado', 'dur' => '4 días'],
                ['cie' => 'N76.0', 'desc' => 'Vaginitis aguda', 'plan' => 'Óvulos vaginales de Metronidazol + Nistatina por 10 noches consecutivas.', 'med' => 'Metronidazol + Nistatina Óvulos', 'dosis' => '1 óvulo', 'freq' => 'Vía vaginal por la noche', 'dur' => '10 días'],
            ],
            5 => [ // Traumatología
                ['cie' => 'S93.4', 'desc' => 'Esguince y desgarro de ligamentos del tobillo', 'plan' => 'Inmovilización con bota elástica por 10 días, Ketorolaco 10mg condicional y crioterapia.', 'med' => 'Ketorolaco', 'dosis' => '10 mg', 'freq' => 'Cada 8 horas si hay dolor severo', 'dur' => '5 días'],
                ['cie' => 'M75.1', 'desc' => 'Síndrome del manguito rotatorio', 'plan' => 'Meloxicam 15mg diario con alimentos, reposo articular y fisioterapia guiada.', 'med' => 'Meloxicam', 'dosis' => '15 mg', 'freq' => 'Una vez al día con almuerzo', 'dur' => '10 días'],
            ],
            6 => [ // Dermatología
                ['cie' => 'L70.0', 'desc' => 'Acné común', 'plan' => 'Gel de Peróxido de Benzoilo 5% tópico nocturno, jabón neutro syndet y protector solar oil-free.', 'med' => 'Peróxido de Benzoilo 5% Gel', 'dosis' => 'Capa fina tópica', 'freq' => 'Cada noche sobre lesiones', 'dur' => '60 días'],
                ['cie' => 'L30.9', 'desc' => 'Dermatitis, no especificada', 'plan' => 'Hidrocortisona crema 1% por 5 días en área afectada y antihistamínico oral.', 'med' => 'Hidrocortisona 1% Crema', 'dosis' => 'Tópico capa fina', 'freq' => 'Cada 12 horas', 'dur' => '5 días'],
            ],
            7 => [ // Geriatría
                ['cie' => 'M15.9', 'desc' => 'Poliartrosis, no especificada', 'plan' => 'Glucosamina + Condroitina matutino, Paracetamol 1g condicional y ejercicios en piscina.', 'med' => 'Glucosamina + Condroitina', 'dosis' => '1500mg / 1200mg', 'freq' => 'Un sobre al día con desayuno', 'dur' => '90 días'],
                ['cie' => 'E11.9', 'desc' => 'Diabetes mellitus tipo 2 sin complicaciones', 'plan' => 'Metformina 850mg con cena, automonitoreo glucémico capilar y plan nutricional.', 'med' => 'Metformina', 'dosis' => '850 mg', 'freq' => 'Una vez al día tras la cena', 'dur' => '60 días'],
            ],
        ];

        $motivosCancelacion = [
            'Paciente tuvo viaje de trabajo no programado fuera de la ciudad.',
            'Conflicto de horario imprevisto con su jornada laboral.',
            'Dificultad de transporte y distancia desde su domicilio.',
            'Mejoría notable de los síntomas previa a la fecha de la consulta.',
            'Solicitó reprogramación para el próximo mes por motivos personales.',
            'Urgencia odontológica prioritaria atendida el mismo día.',
        ];

        // 4. Generación escalonada de citas en los últimos 4 meses (140 días atrás hasta hoy)
        // Intervalos de generación:
        // Mes -4 (hace 110-140 días): ~35 citas
        // Mes -3 (hace 80-109 días): ~40 citas
        // Mes -2 (hace 50-79 días): ~45 citas
        // Mes -1 (hace 20-49 días): ~50 citas
        // Total histórico nuevo: ~170 citas adicionales perfectamente distribuidas en el tiempo
        $maxCitaCod = DB::table('citas')
            ->where('codigo_cita', 'LIKE', 'CM-%')
            ->selectRaw("MAX(CAST(SUBSTRING(codigo_cita FROM 4) AS INTEGER)) as max_num")
            ->value('max_num') ?? 200;

        $maxPagoCod = DB::table('pagos')
            ->where('codigo_pago', 'LIKE', 'PAG-%')
            ->selectRaw("MAX(CAST(SUBSTRING(codigo_pago FROM 5) AS INTEGER)) as max_num")
            ->value('max_num') ?? 100;

        $horasJornada = ['08:00:00', '08:30:00', '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00', '17:00:00'];

        $citasCreadasTotal = 0;
        $consultasCreadasTotal = 0;
        $pagosCreadosTotal = 0;

        // Generar 170 citas distribuidas en los últimos 135 días
        for ($step = 1; $step <= 170; $step++) {
            $maxCitaCod++;
            $codigoCita = sprintf('CM-%04d', $maxCitaCod);

            // Antigüedad: distribuida entre 5 y 135 días atrás
            $diasAtras = (int) (5 + ($step * (130 / 170))); // Distribución uniforme a lo largo de los 4 meses
            $horaStr = $horasJornada[($step % count($horasJornada))];

            $fechaHoraIni = $ahora->copy()->subDays($diasAtras)->setTimeFromTimeString($horaStr);
            $fechaHoraFin = $fechaHoraIni->copy()->addMinutes(30);

            // Seleccionar médico y especialidad
            $medico = $medicos->get($step % $medicos->count());
            $espId = $medicoEspMap[$medico->id_medico] ?? 1;
            $especialidad = $especialidades->get($espId);
            $precioConsulta = $especialidad->precio_consulta ?? 80.00;

            // Seleccionar paciente
            $paciente = $todosPacientes->get($step % $todosPacientes->count());

            // Determinar estado de la cita: 80% ATENDIDA, 10% CANCELADA, 10% INASISTENCIA
            $modEstado = $step % 10;
            if ($modEstado === 3) {
                $estado = 'CANCELADA';
                $motivoCancel = $motivosCancelacion[array_rand($motivosCancelacion)];
                $pagada = false;
            } elseif ($modEstado === 7) {
                $estado = 'INASISTENCIA';
                $motivoCancel = null;
                $pagada = false;
            } else {
                $estado = 'ATENDIDA';
                $motivoCancel = null;
                $pagada = true;
            }

            $modalidad = ($step % 6 === 0) ? 'TELECONSULTA' : 'PRESENCIAL';
            $motivoConsulta = "Consulta médica programada de {$especialidad->nombre}.";

            // Insertar Cita
            $idCita = DB::table('citas')->insertGetId([
                'codigo_cita'       => $codigoCita,
                'id_paciente'       => $paciente->id_paciente,
                'id_medico'         => $medico->id_medico,
                'id_especialidad'   => $espId,
                'id_tipo_cita'      => $tiposCita[array_rand($tiposCita)],
                'fecha_hora_inicio' => $fechaHoraIni,
                'fecha_hora_fin'    => $fechaHoraFin,
                'duracion_minutos'  => 30,
                'estado'            => $estado,
                'modalidad'         => $modalidad,
                'motivo_consulta'   => $motivoConsulta,
                'motivo_cancelacion'=> $motivoCancel,
                'pagada'            => $pagada,
                'monto_pago'        => $pagada ? $precioConsulta : null,
                'creada_por'        => $adminId,
                'created_at'        => $fechaHoraIni->copy()->subDays(2),
                'updated_at'        => $fechaHoraFin,
            ], 'id_cita');

            $citasCreadasTotal++;

            // Historial de Estados
            DB::table('cita_estado_historial')->insert([
                'id_cita'          => $idCita,
                'estado_anterior'  => null,
                'estado_nuevo'     => 'PROGRAMADA',
                'id_usuario'       => $adminId,
                'observacion'      => 'Reserva de cita médica institucional.',
                'fecha_cambio'     => $fechaHoraIni->copy()->subDays(2),
            ]);

            if ($estado === 'ATENDIDA') {
                DB::table('cita_estado_historial')->insert([
                    'id_cita'          => $idCita,
                    'estado_anterior'  => 'PROGRAMADA',
                    'estado_nuevo'     => 'ATENDIDA',
                    'id_usuario'       => $adminId,
                    'observacion'      => 'Atención clínica concluida satisfactoriamente.',
                    'fecha_cambio'     => $fechaHoraFin,
                ]);

                // Registrar Consulta Médica Completa
                $datosClinicos = $diagnosticosPorEsp[$espId] ?? $diagnosticosPorEsp[1];
                $casoClinico = $datosClinicos[array_rand($datosClinicos)];

                $peso = rand(520, 890) / 10; // 52.0 a 89.0 kg
                $talla = rand(155, 182);     // cm
                $temp = rand(362, 372) / 10; // 36.2 a 37.2 °C
                $fc = rand(65, 88);
                $pa = [ '110/70', '120/80', '125/80', '130/85', '118/75' ][array_rand([ '110/70', '120/80', '125/80', '130/85', '118/75' ])];

                $idConsulta = DB::table('consultas_medicas')->insertGetId([
                    'id_cita'             => $idCita,
                    'id_historia_clinica' => $paciente->id_historia_clinica,
                    'id_medico'           => $medico->id_medico,
                    'motivo_consulta'     => $motivoConsulta,
                    'peso_kg'             => $peso,
                    'talla_cm'            => $talla,
                    'temperatura_c'       => $temp,
                    'presion_arterial'    => $pa,
                    'frecuencia_cardiaca' => $fc,
                    'observaciones'       => 'Paciente orientado en tiempo y espacio, sin signos de dificultad respiratoria.',
                    'plan_tratamiento'    => $casoClinico['plan'],
                    'fecha_consulta'      => $fechaHoraFin,
                    'created_at'          => $fechaHoraFin,
                    'updated_at'          => $fechaHoraFin,
                ], 'id_consulta');

                $consultasCreadasTotal++;

                // Diagnóstico CIE-10
                DB::table('diagnosticos')->insert([
                    'id_historia_clinica' => $paciente->id_historia_clinica,
                    'id_consulta'         => $idConsulta,
                    'descripcion'         => $casoClinico['desc'],
                    'codigo_cie10'        => $casoClinico['cie'],
                    'tipo'                => 'DEFINITIVO',
                    'fecha_registro'      => $fechaHoraFin,
                    'created_at'          => $fechaHoraFin,
                    'updated_at'          => $fechaHoraFin,
                ]);

                // Receta Médica
                $idReceta = DB::table('recetas')->insertGetId([
                    'id_historia_clinica'   => $paciente->id_historia_clinica,
                    'id_consulta'           => $idConsulta,
                    'id_medico'             => $medico->id_medico,
                    'fecha_emision'         => $fechaHoraFin,
                    'indicaciones_generales'=> 'Cumplir el tratamiento indicado en horario. Mantener hidratación adecuada.',
                    'estado'                => 'ACTIVO',
                    'created_at'            => $fechaHoraFin,
                    'updated_at'            => $fechaHoraFin,
                ], 'id_receta');

                DB::table('receta_detalles')->insert([
                    'id_receta'    => $idReceta,
                    'medicamento'  => $casoClinico['med'],
                    'dosis'        => $casoClinico['dosis'],
                    'frecuencia'   => $casoClinico['freq'],
                    'duracion'     => $casoClinico['dur'],
                    'indicaciones' => 'Tomar con abundante agua después de los alimentos.',
                    'created_at'   => $fechaHoraFin,
                    'updated_at'   => $fechaHoraFin,
                ]);

                // Registro de Pago (para alimentar balance mensual histórico CU22 / CU24)
                $maxPagoCod++;
                $codPago = sprintf('PAG-%04d', $maxPagoCod);

                $metodosArr = ['EFECTIVO', 'EFECTIVO', 'EFECTIVO', 'QR_BANCARIO', 'TRANSFERENCIA', 'STRIPE'];
                $metodo = $metodosArr[array_rand($metodosArr)];
                $stripeId = ($metodo === 'STRIPE') ? 'pi_hist_' . substr(md5("pago_{$idCita}_{$codPago}"), 0, 20) : null;

                DB::table('pagos')->insert([
                    'codigo_pago'             => $codPago,
                    'id_cita'                 => $idCita,
                    'id_paciente'             => $paciente->id_paciente,
                    'monto'                   => $precioConsulta,
                    'moneda'                  => 'USD',
                    'metodo_pago'             => $metodo,
                    'stripe_payment_intent_id'=> $stripeId,
                    'tarjeta_marca'           => ($metodo === 'STRIPE') ? 'Visa' : null,
                    'tarjeta_ultimos4'        => ($metodo === 'STRIPE') ? '4242' : null,
                    'descripcion'             => "Consulta {$especialidad->nombre} - Dr(a). {$medico->apellidos}",
                    'recibo_url'              => ($metodo === 'STRIPE') ? 'https://dashboard.stripe.com/test/payments/' . $stripeId : null,
                    'estado'                  => 'COMPLETADO',
                    'fecha_pago'              => $fechaHoraFin,
                    'created_at'              => $fechaHoraFin,
                    'updated_at'              => $fechaHoraFin,
                ]);

                $pagosCreadosTotal++;
            } elseif ($estado === 'CANCELADA') {
                DB::table('cita_estado_historial')->insert([
                    'id_cita'          => $idCita,
                    'estado_anterior'  => 'PROGRAMADA',
                    'estado_nuevo'     => 'CANCELADA',
                    'id_usuario'       => $adminId,
                    'observacion'      => $motivoCancel,
                    'fecha_cambio'     => $fechaHoraIni->copy()->subHours(6),
                ]);
            } elseif ($estado === 'INASISTENCIA') {
                DB::table('cita_estado_historial')->insert([
                    'id_cita'          => $idCita,
                    'estado_anterior'  => 'PROGRAMADA',
                    'estado_nuevo'     => 'INASISTENCIA',
                    'id_usuario'       => $adminId,
                    'observacion'      => 'Paciente no se presentó a su turno en el horario previsto.',
                    'fecha_cambio'     => $fechaHoraFin,
                ]);
            }

            // Registrar en Bitácora eventos clave fechados en el mes correspondiente
            if ($step % 3 === 0) {
                DB::table('bitacora')->insert([
                    'id_usuario'     => $adminId,
                    'modulo'         => 'CITAS',
                    'accion'         => 'PROGRAMAR_CITA',
                    'tabla_afectada' => 'citas',
                    'id_registro'    => $idCita,
                    'descripcion'    => "Se reservó la cita {$codigoCita} para el paciente {$paciente->nombres} {$paciente->apellidos}.",
                    'ip_origen'      => '127.0.0.1',
                    'fecha_registro' => $fechaHoraIni->copy()->subDays(2),
                ]);
            }
        }

        // 5. Sincronizar todas las secuencias en PostgreSQL
        $tablasSeq = [
            'pacientes'           => 'pacientes_id_paciente_seq',
            'historias_clinicas'  => 'historias_clinicas_id_historia_clinica_seq',
            'contactos_emergencia'=> 'contactos_emergencia_id_contacto_seq',
            'citas'               => 'citas_id_cita_seq',
            'cita_estado_historial'=> 'cita_estado_historial_id_historial_seq',
            'consultas_medicas'   => 'consultas_medicas_id_consulta_seq',
            'diagnosticos'        => 'diagnosticos_id_diagnostico_seq',
            'recetas'             => 'recetas_id_receta_seq',
            'receta_detalles'     => 'receta_detalles_id_detalle_seq',
            'pagos'               => 'pagos_id_pago_seq',
            'bitacora'            => 'bitacora_id_bitacora_seq',
        ];

        foreach ($tablasSeq as $tabla => $seq) {
            try {
                $pkCol = DB::select("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = '{$tabla}'::regclass AND i.indisprimary")[0]->attname ?? 'id';
                DB::statement("SELECT setval('{$seq}', COALESCE((SELECT MAX({$pkCol}) FROM {$tabla}), 1))");
            } catch (\Throwable $e) {}
        }

        $this->command->info("Seeder histórico multimes completado:");
        $this->command->info("  + 25 Pacientes con Historia Clínica e historial.");
        $this->command->info("  + {$citasCreadasTotal} Citas distribuidas a lo largo de los últimos 4.5 meses.");
        $this->command->info("  + {$consultasCreadasTotal} Consultas con triaje y diagnósticos CIE-10.");
        $this->command->info("  + {$pagosCreadosTotal} Pagos registrados en el balance histórico.");
    }
}

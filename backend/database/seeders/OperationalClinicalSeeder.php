<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Seeder Operativo de Apoyo Clínico y Financiero (Ciclo 2)
 * Puebla las tablas de soporte directo a los 26 Casos de Uso oficiales:
 * - bloqueos_horario (CU08 / RF05): Feriados y licencias médicas.
 * - ordenes_examenes (CU25): Laboratorio, imagenología y cardiología.
 * - documentos_clinicos (CU26): Adjuntos con archivos DICOM (.dcm), PDFs e informes.
 * - pagos (CU21): Pagos en Efectivo (mayoría), QR, Transferencia y Stripe.
 * - reportes_ia (CU23): Histórico de consultas por comandos de voz con filtros JSON.
 *
 * NOTA:
 * - notificaciones y push_suscripciones se mantienen vacías (CU20 aún no implementado).
 * - analisis_clinicos se descarta (era reserva de CU28-OPC fuera de los 26 CU oficiales).
 */
class OperationalClinicalSeeder extends Seeder
{
    public function run(): void
    {
        $ahora = Carbon::now('America/La_Paz');
        $adminUser = DB::table('usuarios')->where('tipo_usuario', 'ADMIN')->first();
        $adminId = $adminUser ? $adminUser->id_usuario : 1;

        // =========================================================================
        // 1. BLOQUEOS DE HORARIO (CU08 - Feriados Institucionales y Licencias)
        // =========================================================================
        $medicos = DB::table('medicos')->get();
        $idMedCardio = $medicos->where('apellidos', 'Morales Terrazas')->first()?->id_medico ?? $medicos->first()->id_medico;
        $idMedPedia = $medicos->where('nombres', 'Elena Sofía')->first()?->id_medico ?? $medicos->get(2)->id_medico;
        $idMedGastro = $medicos->where('nombres', 'Gonzalo Javier')->first()?->id_medico ?? $medicos->get(6)->id_medico;

        $bloqueosData = [
            // Feriados institucionales de clínica completa (id_medico = NULL)
            [
                'id_medico' => null,
                'fecha' => '2026-11-02',
                'hora_inicio' => null,
                'hora_fin' => null,
                'motivo' => 'Feriado Nacional: Día de Todos los Santos (Cierre total de clínica).',
            ],
            [
                'id_medico' => null,
                'fecha' => '2026-12-25',
                'hora_inicio' => null,
                'hora_fin' => null,
                'motivo' => 'Feriado Nacional: Navidad (Atención exclusiva de emergencias).',
            ],
            // Licencias médicas / Congresos individuales
            [
                'id_medico' => $idMedCardio,
                'fecha' => $ahora->copy()->subDays(12)->format('Y-m-d'),
                'hora_inicio' => '08:00:00',
                'hora_fin' => '18:00:00',
                'motivo' => 'Asistencia a Congreso Panamericano de Cardiología y Hemodinamia.',
            ],
            [
                'id_medico' => $idMedPedia,
                'fecha' => $ahora->copy()->subDays(5)->format('Y-m-d'),
                'hora_inicio' => '14:00:00',
                'hora_fin' => '18:00:00',
                'motivo' => 'Permiso institucional para capacitación en infectología pediátrica.',
            ],
            [
                'id_medico' => $idMedGastro,
                'fecha' => $ahora->copy()->addDays(3)->format('Y-m-d'),
                'hora_inicio' => '08:00:00',
                'hora_fin' => '12:00:00',
                'motivo' => 'Mantenimiento preventivo de torre de endoscopía digestiva.',
            ],
        ];

        foreach ($bloqueosData as $b) {
            $existe = DB::table('bloqueos_horario')
                ->where('fecha', $b['fecha'])
                ->where('id_medico', $b['id_medico'])
                ->first();

            if (!$existe) {
                DB::table('bloqueos_horario')->insert([
                    'id_medico' => $b['id_medico'],
                    'fecha' => $b['fecha'],
                    'hora_inicio' => $b['hora_inicio'],
                    'hora_fin' => $b['hora_fin'],
                    'motivo' => $b['motivo'],
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ]);
            }
        }

        // =========================================================================
        // 2. PAGOS (CU21 - Mayoría Efectivo, algunos QR/Transferencia y Stripe)
        // =========================================================================
        $citasAtendidas = DB::table('citas')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->where('citas.estado', 'ATENDIDA')
            ->select('citas.*', 'especialidades.precio_consulta')
            ->get();

        $citasProgramadas = DB::table('citas')
            ->join('especialidades', 'citas.id_especialidad', '=', 'especialidades.id_especialidad')
            ->whereIn('citas.estado', ['PROGRAMADA', 'CONFIRMADA'])
            ->select('citas.*', 'especialidades.precio_consulta')
            ->get();

        $pagoCount = 1;
        // Pagos para citas atendidas (todos COMPLETADO)
        foreach ($citasAtendidas as $idx => $cita) {
            $yaPagada = DB::table('pagos')->where('id_cita', $cita->id_cita)->first();
            if ($yaPagada) continue;

            // Distribución: 70% Efectivo, 20% QR / Transferencia, 10% Stripe
            $mod = $idx % 10;
            if ($mod < 7) {
                $metodo = 'EFECTIVO';
                $stripeId = null;
            } elseif ($mod < 9) {
                $metodo = ($mod === 7) ? 'QR_BANCARIO' : 'TRANSFERENCIA';
                $stripeId = null;
            } else {
                $metodo = 'STRIPE';
                $stripeId = 'pi_test_' . substr(md5('pago_' . $cita->id_cita . '_' . $cita->codigo_cita), 0, 24);
            }

            DB::table('pagos')->insert([
                'id_cita' => $cita->id_cita,
                'id_paciente' => $cita->id_paciente,
                'monto' => $cita->precio_consulta ?? 80.00,
                'metodo_pago' => $metodo,
                'stripe_payment_intent_id' => $stripeId,
                'estado' => 'COMPLETADO',
                'fecha_pago' => $cita->fecha_hora_fin ?? $cita->fecha_hora_inicio,
                'created_at' => $cita->fecha_hora_inicio,
                'updated_at' => $cita->fecha_hora_fin ?? $cita->fecha_hora_inicio,
            ]);
            $pagoCount++;
        }

        // Algunos pagos PENDIENTE o COMPLETADO por adelantado para citas futuras
        foreach ($citasProgramadas as $idx => $cita) {
            $yaPagada = DB::table('pagos')->where('id_cita', $cita->id_cita)->first();
            if ($yaPagada) continue;

            $esAnticipado = ($idx % 2 === 0);
            DB::table('pagos')->insert([
                'id_cita' => $cita->id_cita,
                'id_paciente' => $cita->id_paciente,
                'monto' => $cita->precio_consulta ?? 90.00,
                'metodo_pago' => $esAnticipado ? 'QR_BANCARIO' : 'EFECTIVO',
                'stripe_payment_intent_id' => null,
                'estado' => $esAnticipado ? 'COMPLETADO' : 'PENDIENTE',
                'fecha_pago' => $cita->fecha_hora_inicio,
                'created_at' => $cita->created_at,
                'updated_at' => $cita->created_at,
            ]);
        }

        // =========================================================================
        // 3. ÓRDENES DE EXÁMENES MÉDICOS (CU25)
        // =========================================================================
        $consultas = DB::table('consultas_medicas')
            ->join('historias_clinicas', 'consultas_medicas.id_historia_clinica', '=', 'historias_clinicas.id_historia_clinica')
            ->select('consultas_medicas.*', 'historias_clinicas.id_paciente')
            ->limit(22)
            ->get();

        $catalogoEstudios = [
            ['tipo' => 'LABORATORIO', 'nombre' => 'Hemograma Completo y Plaquetas', 'prep' => 'Ayuno de 8 horas. No realizar actividad física intensa previa.', 'presuntivo' => 'Descarte de síndrome anémico o proceso infeccioso activo.'],
            ['tipo' => 'LABORATORIO', 'nombre' => 'Perfil Lipídico (Colesterol, Triglicéridos, HDL, LDL)', 'prep' => 'Ayuno estricto de 12 horas. Evitar comidas grasas la noche anterior.', 'presuntivo' => 'Dislipidemia mixta y control de riesgo cardiovascular.'],
            ['tipo' => 'LABORATORIO', 'nombre' => 'Glicemia en Ayunas y Hemoglobina Glicosilada (HbA1c)', 'prep' => 'Ayuno de 8 a 10 horas. Tomar medicación matutina después de la toma.', 'presuntivo' => 'Monitoreo metabólico de Diabetes Mellitus.'],
            ['tipo' => 'LABORATORIO', 'nombre' => 'Examen General de Orina y Urocultivo', 'prep' => 'Primera orina de la mañana con técnica de chorro medio previo aseo.', 'presuntivo' => 'Sospecha de infección del tracto urinario bajo.'],
            ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Radiografía de Tórax AP y Lateral', 'prep' => 'Retirar objetos metálicos, cadenas y sostenes con aros metálicos.', 'presuntivo' => 'Evaluación de parénquima pulmonar y silueta cardíaca.'],
            ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Ecografía Abdominal Total', 'prep' => 'Ayuno de 6 horas y retención de orina 1 hora antes del estudio.', 'presuntivo' => 'Dolor abdominal recurrente y evaluación de vesícula/hígado.'],
            ['tipo' => 'CARDIOLOGIA', 'nombre' => 'Electrocardiograma de Reposo de 12 Derivaciones', 'prep' => 'Reposo de 10 minutos previo. Piel limpia sin cremas corporales.', 'presuntivo' => 'Control de arritmias y trazado basal en paciente hipertenso.'],
            ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Tomografía Axial Computarizada de Senos Paranasales', 'prep' => 'Sin preparación especial. Presentar estudios previos.', 'presuntivo' => 'Sinusitis crónica refractaria a tratamiento farmacológico.'],
        ];

        $ordenIndex = (DB::table('ordenes_examenes')->max('id_orden') ?? 0) + 1;
        $ordenesCreadas = [];

        foreach ($consultas as $i => $cons) {
            $estudio = $catalogoEstudios[$i % count($catalogoEstudios)];
            $codigoOrden = sprintf('ORD-%04d', $ordenIndex);

            $idOrden = DB::table('ordenes_examenes')->insertGetId([
                'codigo_orden' => $codigoOrden,
                'id_consulta' => $cons->id_consulta,
                'id_historia_clinica' => $cons->id_historia_clinica,
                'id_medico' => $cons->id_medico,
                'tipo_estudio' => $estudio['tipo'],
                'nombre_estudio' => $estudio['nombre'],
                'indicaciones_preparacion' => $estudio['prep'],
                'diagnostico_presuntivo' => $estudio['presuntivo'],
                'estado' => ($i % 3 === 0) ? 'PENDIENTE' : 'CON_RESULTADOS',
                'fecha_emision' => $cons->fecha_consulta,
                'created_at' => $cons->fecha_consulta,
                'updated_at' => $cons->fecha_consulta,
            ], 'id_orden');

            $ordenesCreadas[] = [
                'id_orden' => $idOrden,
                'id_consulta' => $cons->id_consulta,
                'id_historia_clinica' => $cons->id_historia_clinica,
                'id_medico' => $cons->id_medico,
                'tipo' => $estudio['tipo'],
                'nombre' => $estudio['nombre'],
                'fecha' => $cons->fecha_consulta,
            ];
            $ordenIndex++;
        }

        // =========================================================================
        // 4. DOCUMENTOS CLÍNICOS ADJUNTOS CON ARCHIVOS DICOM Y PDF (CU26)
        // =========================================================================
        // Almacenamiento simulado en Cloudinary / storage clínico institucional
        $documentosDemo = [
            // Archivos DICOM (.dcm) para Imagenología Médica
            [
                'titulo' => 'Estudio Tomográfico de Senos Paranasales (Cortes Axiales y Coronales)',
                'tipo_documento' => 'IMAGENOLOGIA',
                'descripcion' => 'Serie de cortes tomográficos computarizados en formato DICOM nativo (visores PACS compatibles).',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/raw/upload/v1730001001/dicom/spn_axial_coronal_series.dcm',
                'mime_type' => 'application/dicom',
                'tamanio_bytes' => 14850240, // ~14.1 MB
            ],
            [
                'titulo' => 'Radiografía Digital de Tórax AP en Alta Definición',
                'tipo_documento' => 'IMAGENOLOGIA',
                'descripcion' => 'Radiografía digitalizada en estándar DICOM médico para evaluación de campos pulmonares.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/raw/upload/v1730001002/dicom/rx_torax_ap_digital.dcm',
                'mime_type' => 'application/dicom',
                'tamanio_bytes' => 8420180, // ~8.0 MB
            ],
            [
                'titulo' => 'Resonancia Magnética Lumbar L1-S1 (Cortes Sagitales)',
                'tipo_documento' => 'IMAGENOLOGIA',
                'descripcion' => 'Captura DICOM de columna lumbosacra evidenciando integridad de discos intervertebrales.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/raw/upload/v1730001003/dicom/rmn_lumbar_l1_s1.dcm',
                'mime_type' => 'application/dicom',
                'tamanio_bytes' => 22048910, // ~21 MB
            ],
            [
                'titulo' => 'Ecografía Abdominal y Hepatobiliopancreática (Fotogramas DICOM)',
                'tipo_documento' => 'IMAGENOLOGIA',
                'descripcion' => 'Fotogramas de ultrasonido de alta resolución con mediciones ecográficas de vesícula y parénquima hepático.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/raw/upload/v1730001004/dicom/us_abdominal_frames.dcm',
                'mime_type' => 'application/dicom',
                'tamanio_bytes' => 11200480, // ~10.6 MB
            ],
            // Documentos Clínicos PDF e Informes de Laboratorio
            [
                'titulo' => 'Informe Oficial de Laboratorio Bioquímico y Hemograma',
                'tipo_documento' => 'LABORATORIO',
                'descripcion' => 'Resultado de laboratorio emitido por BioAnálisis Clínico con validación bacteriológica.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/image/upload/v1730001005/docs/informe_laboratorio_hemograma.pdf',
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => 524288, // 512 KB
            ],
            [
                'titulo' => 'Trazado Electrocardiográfico Digital con Interpretación',
                'tipo_documento' => 'INFORME_EXTERNO',
                'descripcion' => 'Electrocardiograma de 12 derivaciones con informe cardiológico de ritmo sinusal.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/image/upload/v1730001006/docs/electrocardiograma_trazado.pdf',
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => 312040, // ~304 KB
            ],
            [
                'titulo' => 'Consentimiento Informado para Procedimiento Diagnóstico Invasivo',
                'tipo_documento' => 'CONSENTIMIENTO',
                'descripcion' => 'Documento formal firmado por el paciente aceptando protocolo de punción diagnóstica.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/image/upload/v1730001007/docs/consentimiento_firmado_paciente.pdf',
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => 245760, // 240 KB
            ],
            [
                'titulo' => 'Informe de Interconsulta Especializada de Neurología',
                'tipo_documento' => 'INFORME_EXTERNO',
                'descripcion' => 'Evaluación neurológica clínica de cefalea crónica resistente a tratamiento ambulatorio.',
                'ruta_archivo' => 'https://res.cloudinary.com/clinica-lacruz/image/upload/v1730001008/docs/interconsulta_neurologica.pdf',
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => 418290, // ~408 KB
            ],
        ];

        foreach ($documentosDemo as $k => $doc) {
            $ordenRef = $ordenesCreadas[$k % count($ordenesCreadas)] ?? null;
            $hcId = $ordenRef ? $ordenRef['id_historia_clinica'] : 1;
            $consId = $ordenRef ? $ordenRef['id_consulta'] : 1;
            $medId = $ordenRef ? $ordenRef['id_medico'] : 1;
            $ordId = $ordenRef ? $ordenRef['id_orden'] : null;

            DB::table('documentos_clinicos')->insert([
                'id_historia_clinica' => $hcId,
                'id_consulta' => $consId,
                'id_orden' => $ordId,
                'id_medico' => $medId,
                'titulo' => $doc['titulo'],
                'tipo_documento' => $doc['tipo_documento'],
                'descripcion' => $doc['descripcion'],
                'ruta_archivo' => $doc['ruta_archivo'],
                'mime_type' => $doc['mime_type'],
                'tamanio_bytes' => $doc['tamanio_bytes'],
                'fecha_subida' => $ordenRef ? $ordenRef['fecha'] : $ahora,
                'estado' => 'ACTIVO',
                'created_at' => $ordenRef ? $ordenRef['fecha'] : $ahora,
                'updated_at' => $ordenRef ? $ordenRef['fecha'] : $ahora,
            ]);
        }

        // =========================================================================
        // 5. REPORTES DE VOZ CON IA (CU23)
        // =========================================================================
        $reportesDemo = [
            [
                'comando' => 'Muéstrame el reporte de citas atendidas del mes pasado por médico y especialidad',
                'filtros' => json_encode(['periodo' => 'mes_anterior', 'estado' => 'ATENDIDA', 'agrupar_por' => ['medico', 'especialidad']]),
                'tipo' => 'CITAS_MEDICO',
            ],
            [
                'comando' => 'Generar balance total de ingresos de consultas médicas pagadas en efectivo y por transferencia',
                'filtros' => json_encode(['metodos_pago' => ['EFECTIVO', 'TRANSFERENCIA'], 'estado_pago' => 'COMPLETADO']),
                'tipo' => 'BALANCE',
            ],
            [
                'comando' => 'Listar citas canceladas con motivo en las últimas dos semanas',
                'filtros' => json_encode(['estado' => 'CANCELADA', 'rango_dias' => 14, 'incluir_motivo' => true]),
                'tipo' => 'CITAS_CANCELADAS',
            ],
            [
                'comando' => 'Calcular la tasa de inasistencias de pacientes en el turno de la mañana',
                'filtros' => json_encode(['estado' => 'NO_ASISTIO', 'turno' => 'MAÑANA', 'dias_semana' => [1, 2, 3, 4, 5]]),
                'tipo' => 'TASA_INASISTENCIA',
            ],
            [
                'comando' => 'Reporte estadístico de diagnósticos más frecuentes clasificados por código CIE-10',
                'filtros' => json_encode(['modulo' => 'diagnosticos', 'orden' => 'frecuencia_descendente', 'limite' => 10]),
                'tipo' => 'TOP_DIAGNOSTICOS',
            ],
        ];

        foreach ($reportesDemo as $r) {
            DB::table('reportes_ia')->insert([
                'id_usuario' => $adminId,
                'comando_texto' => $r['comando'],
                'filtros_json' => $r['filtros'],
                'tipo_reporte' => $r['tipo'],
                'fecha_generacion' => $ahora->copy()->subDays(rand(1, 15)),
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }

        // =========================================================================
        // 6. CITAS DEMOSTRATIVAS PARA EL DÍA DE HOY (CU13, CU14, CU16, CU21)
        // =========================================================================
        // Genera citas para la jornada de hoy con estados variados para interactuar de inmediato
        $docPerez = DB::table('medicos')->where('correo_profesional', 'juan.perez@clinicalacruz.com')->first();
        $docAlejandro = DB::table('medicos')->where('correo_profesional', 'alejandro.cardiologia@clinicalacruz.com')->first();
        $pacientesHoy = DB::table('pacientes')->take(6)->get();

        if ($docPerez && $pacientesHoy->count() >= 3) {
            $hoyStr = $ahora->format('Y-m-d');
            $maxCitaNum = DB::table('citas')
                ->where('codigo_cita', 'LIKE', 'CM-%')
                ->selectRaw("MAX(CAST(SUBSTRING(codigo_cita FROM 4) AS INTEGER)) as max_num")
                ->value('max_num') ?? 100;

            $citasHoyConfig = [
                [
                    'hora_ini' => '08:30:00',
                    'hora_fin' => '09:00:00',
                    'estado'   => 'CONFIRMADA', // Lista para CU16: Iniciar Consulta Médica
                    'pagada'   => true,
                    'monto'    => 80.00,
                    'motivo'   => 'Control de hipertensión arterial y ajuste de medicación.',
                    'paciente' => $pacientesHoy->get(0),
                    'medico'   => $docPerez,
                    'esp'      => 1, // Medicina General
                ],
                [
                    'hora_ini' => '09:30:00',
                    'hora_fin' => '10:00:00',
                    'estado'   => 'PROGRAMADA', // Lista para CU13: Check-in / Confirmar asistencia
                    'pagada'   => false,
                    'monto'    => 80.00,
                    'motivo'   => 'Consulta general por cuadro de cefalea tensional recurrente.',
                    'paciente' => $pacientesHoy->get(1),
                    'medico'   => $docPerez,
                    'esp'      => 1,
                ],
                [
                    'hora_ini' => '10:30:00',
                    'hora_fin' => '11:00:00',
                    'estado'   => 'PROGRAMADA', // Lista para CU21: Pagar con Stripe Sandbox
                    'pagada'   => false,
                    'monto'    => 80.00,
                    'motivo'   => 'Evaluación médica preventiva y chequeo de rutina.',
                    'paciente' => $pacientesHoy->get(2),
                    'medico'   => $docPerez,
                    'esp'      => 1,
                ],
            ];

            foreach ($citasHoyConfig as $ch) {
                $existeCitaHoy = DB::table('citas')
                    ->where('id_medico', $ch['medico']->id_medico)
                    ->whereDate('fecha_hora_inicio', $hoyStr)
                    ->whereTime('fecha_hora_inicio', $ch['hora_ini'])
                    ->first();

                if (!$existeCitaHoy) {
                    $maxCitaNum++;
                    $cod = sprintf('CM-%04d', $maxCitaNum);
                    $ini = Carbon::parse("{$hoyStr} {$ch['hora_ini']}");
                    $fin = Carbon::parse("{$hoyStr} {$ch['hora_fin']}");

                    $idCitaNueva = DB::table('citas')->insertGetId([
                        'codigo_cita'       => $cod,
                        'id_paciente'       => $ch['paciente']->id_paciente,
                        'id_medico'         => $ch['medico']->id_medico,
                        'id_especialidad'   => $ch['esp'],
                        'id_tipo_cita'      => 1, // Primera vez
                        'fecha_hora_inicio' => $ini,
                        'fecha_hora_fin'    => $fin,
                        'duracion_minutos'  => 30,
                        'estado'            => $ch['estado'],
                        'modalidad'         => 'PRESENCIAL',
                        'motivo_consulta'   => $ch['motivo'],
                        'pagada'            => $ch['pagada'],
                        'monto_pago'        => $ch['monto'],
                        'creada_por'        => $adminId,
                        'created_at'        => $ahora->copy()->subHours(2),
                        'updated_at'        => $ahora->copy()->subHours(1),
                    ], 'id_cita');

                    // Registrar estado en historial
                    DB::table('cita_estado_historial')->insert([
                        'id_cita'          => $idCitaNueva,
                        'estado_anterior'  => null,
                        'estado_nuevo'     => $ch['estado'],
                        'id_usuario'       => $adminId,
                        'observacion'      => 'Reserva demostrativa de cita para el día en curso.',
                        'fecha_cambio'     => $ahora->copy()->subHours(2),
                    ]);

                    // Si está pagada, registrar pago
                    if ($ch['pagada']) {
                        DB::table('pagos')->insert([
                            'id_cita'     => $idCitaNueva,
                            'id_paciente' => $ch['paciente']->id_paciente,
                            'monto'       => $ch['monto'],
                            'metodo_pago' => 'EFECTIVO',
                            'estado'      => 'COMPLETADO',
                            'fecha_pago'  => $ahora->copy()->subHours(1),
                            'created_at'  => $ahora->copy()->subHours(1),
                            'updated_at'  => $ahora->copy()->subHours(1),
                        ]);
                    }
                }
            }
        }

        // =========================================================================
        // 7. NOTIFICACIONES DEL SISTEMA (CU20)
        // =========================================================================
        $usersMap = DB::table('usuarios')->pluck('id_usuario', 'username');
        $citasRecientes = DB::table('citas')->orderBy('id_cita', 'desc')->take(10)->get();

        $notificacionesDemo = [];

        // Notificaciones para Administrador
        if (isset($usersMap['admin'])) {
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['admin'],
                'id_cita'     => $citasRecientes->first()?->id_cita,
                'tipo'        => 'RECORDATORIO_24H',
                'canal'       => 'EMAIL',
                'titulo'      => 'Recordatorio de Operaciones Clínicas (24h)',
                'mensaje'     => 'Se han evaluado las citas preventivas para la jornada de mañana. Planificador de recordatorios activo.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subMinutes(15),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['admin'],
                'id_cita'     => $citasRecientes->get(1)?->id_cita,
                'tipo'        => 'PAGO_EXITOSO',
                'canal'       => 'IN_APP',
                'titulo'      => 'Comprobante de Pago Confirmado con Stripe',
                'mensaje'     => 'Transacción electrónica por $80.00 USD procesada exitosamente en modo prueba.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subHours(1),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['admin'],
                'id_cita'     => $citasRecientes->get(2)?->id_cita,
                'tipo'        => 'CONFIRMACION',
                'canal'       => 'IN_APP',
                'titulo'      => 'Cita Médica Reservada en Recepción',
                'mensaje'     => 'Nueva cita médica agendada para Medicina General en la sede central.',
                'leida'       => true,
                'fecha_envio' => $ahora->copy()->subHours(5),
            ];
        }

        // Notificaciones para Personal Médico (doctor.perez)
        if (isset($usersMap['doctor.perez'])) {
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['doctor.perez'],
                'id_cita'     => $citasRecientes->first()?->id_cita,
                'tipo'        => 'RECORDATORIO_24H',
                'canal'       => 'IN_APP',
                'titulo'      => 'Recordatorio de Agenda (24h) — Citas de Mañana',
                'mensaje'     => 'Estimado Dr. Pérez: Tiene consultas programadas en su agenda a partir de las 08:30 en el Consultorio 101.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subMinutes(30),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['doctor.perez'],
                'id_cita'     => $citasRecientes->get(1)?->id_cita,
                'tipo'        => 'CONFIRMACION',
                'canal'       => 'IN_APP',
                'titulo'      => 'Nueva Cita en su Agenda Asistencial',
                'mensaje'     => 'Se ha reservado un turno para el paciente Carlos Silva en horario de la mañana.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subHours(2),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['doctor.perez'],
                'id_cita'     => $citasRecientes->get(2)?->id_cita,
                'tipo'        => 'REPROGRAMACION',
                'canal'       => 'IN_APP',
                'titulo'      => 'Cita Reprogramada en su Agenda',
                'mensaje'     => 'El control de hipertensión de la paciente Mariana Torrico fue reprogramado para el lunes a las 09:00.',
                'leida'       => true,
                'fecha_envio' => $ahora->copy()->subDay(),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['doctor.perez'],
                'id_cita'     => $citasRecientes->get(3)?->id_cita,
                'tipo'        => 'CANCELACION',
                'canal'       => 'IN_APP',
                'titulo'      => 'Cita Cancelada en su Agenda',
                'mensaje'     => 'El turno de las 11:30 fue cancelado por motivo de viaje imprevisto. El cupo horario ha sido liberado.',
                'leida'       => true,
                'fecha_envio' => $ahora->copy()->subDays(2),
            ];
        }

        // Notificaciones para Recepcionista (recepcion)
        if (isset($usersMap['recepcion'])) {
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['recepcion'],
                'id_cita'     => $citasRecientes->first()?->id_cita,
                'tipo'        => 'CONFIRMACION',
                'canal'       => 'IN_APP',
                'titulo'      => 'Nueva Reserva Registrada en Ventanilla',
                'mensaje'     => 'Se agendó la cita CM-0002 para Medicina General.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subMinutes(10),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['recepcion'],
                'id_cita'     => $citasRecientes->get(1)?->id_cita,
                'tipo'        => 'PAGO_EXITOSO',
                'canal'       => 'IN_APP',
                'titulo'      => 'Pago de Consulta Confirmado',
                'mensaje'     => 'Cobro de $80.00 USD confirmado con tarjeta de crédito en Stripe.',
                'leida'       => true,
                'fecha_envio' => $ahora->copy()->subHours(3),
            ];
        }

        // Notificaciones para Paciente (paciente.carlos)
        if (isset($usersMap['paciente.carlos'])) {
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['paciente.carlos'],
                'id_cita'     => $citasRecientes->first()?->id_cita,
                'tipo'        => 'RECORDATORIO_24H',
                'canal'       => 'EMAIL',
                'titulo'      => 'Recordatorio de Cita Médica (24h) — Centro Médico La Cruz',
                'mensaje'     => 'Estimado(a) Carlos Silva: Le recordamos su cita con el Dr. Juan Pérez para mañana a las 08:30. Por favor presentarse 15 minutos antes con su cédula de identidad.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subMinutes(45),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['paciente.carlos'],
                'id_cita'     => $citasRecientes->get(1)?->id_cita,
                'tipo'        => 'PAGO_EXITOSO',
                'canal'       => 'IN_APP',
                'titulo'      => 'Comprobante de Pago Confirmado',
                'mensaje'     => 'Hemos recibido tu pago de $80.00 USD para tu cita médica. Tu turno se encuentra garantizado.',
                'leida'       => false,
                'fecha_envio' => $ahora->copy()->subHours(4),
            ];
            $notificacionesDemo[] = [
                'id_usuario'  => $usersMap['paciente.carlos'],
                'id_cita'     => $citasRecientes->get(2)?->id_cita,
                'tipo'        => 'CONFIRMACION',
                'canal'       => 'IN_APP',
                'titulo'      => 'Cita Médica Reservada Exitosamente',
                'mensaje'     => 'Tu cita con Dr. Juan Pérez ha sido registrada. Código de confirmación asignado.',
                'leida'       => true,
                'fecha_envio' => $ahora->copy()->subDays(1),
            ];
        }

        foreach ($notificacionesDemo as $n) {
            $existeNotif = DB::table('notificaciones')
                ->where('id_usuario', $n['id_usuario'])
                ->where('titulo', $n['titulo'])
                ->first();

            if (!$existeNotif) {
                DB::table('notificaciones')->insert(array_merge($n, [
                    'created_at' => $n['fecha_envio'],
                    'updated_at' => $n['fecha_envio'],
                ]));
            }
        }

        // =========================================================================
        // 8. SINCRONIZACIÓN DE SECUENCIAS POSTGRESQL
        // =========================================================================
        $tablasSeq = [
            'bloqueos_horario' => 'bloqueos_horario_id_bloqueo_seq',
            'citas'            => 'citas_id_cita_seq',
            'pagos'            => 'pagos_id_pago_seq',
            'ordenes_examenes' => 'ordenes_examenes_id_orden_seq',
            'documentos_clinicos' => 'documentos_clinicos_id_documento_seq',
            'notificaciones'   => 'notificaciones_id_notificacion_seq',
            'reportes_ia'      => 'reportes_ia_id_reporte_seq',
        ];

        foreach ($tablasSeq as $tabla => $seq) {
            try {
                $pkCol = DB::select("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = '{$tabla}'::regclass AND i.indisprimary")[0]->attname ?? 'id';
                DB::statement("SELECT setval('{$seq}', COALESCE((SELECT MAX({$pkCol}) FROM {$tabla}), 1))");
            } catch (\Throwable $e) {}
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Seeder de Historial Clínico Extenso (Pacientes 41 al 50)
 * Puebla pacientes con antecedentes médicos complejos y un historial denso
 * de citas y atenciones en un rango temporal de 4 meses (~120 días).
 */
class ExtendedClinicalHistorySeeder extends Seeder
{
    public function run(): void
    {
        $passwordHash = Hash::make('Admin123@');
        $ahora = Carbon::now('America/La_Paz');

        $rolPaciente = DB::table('roles')->where('nombre', 'PACIENTE')->first();
        $adminUser = DB::table('usuarios')->where('tipo_usuario', 'ADMIN')->first();
        $adminId = $adminUser ? $adminUser->id_usuario : 1;

        $medicos = DB::table('medicos')->get();
        $totalMedicos = $medicos->count();
        $especialidades = DB::table('especialidades')->get();
        $espMap = $especialidades->pluck('id_especialidad', 'nombre');
        $tiposCita = DB::table('tipos_cita')->pluck('id_tipo_cita')->toArray();

        // =========================================================================
        // 1. LOS 10 PACIENTES NUEVOS (IDs 41 al 50)
        // =========================================================================
        $pacientesData = [
            [
                'nombres' => 'Gustavo Adolfo',
                'apellidos' => 'Méndez Antelo',
                'fnac' => '1968-04-12',
                'sexo' => 'MASCULINO',
                'ci' => '4930219',
                'sangre' => 'O+',
                'tel' => '77145829',
                'dir' => 'Av. Busch esq. 3er Anillo Interno #340',
                'contacto' => ['nombre' => 'Rosa Antelo de Méndez', 'parentesco' => 'Esposa', 'tel' => '77145800'],
            ],
            [
                'nombres' => 'Beatriz Eugenia',
                'apellidos' => 'Ribera Salvatierra',
                'fnac' => '1980-09-23',
                'sexo' => 'FEMENINO',
                'ci' => '6820194',
                'sangre' => 'A+',
                'tel' => '78239011',
                'dir' => 'Barrio Sirari Calle Los Claveles #18',
                'contacto' => ['nombre' => 'Carlos Ribera Salvatierra', 'parentesco' => 'Hermano', 'tel' => '78239099'],
            ],
            [
                'nombres' => 'Ramiro Gonzalo',
                'apellidos' => 'Justiniano Hurtado',
                'fnac' => '1962-11-05',
                'sexo' => 'MASCULINO',
                'ci' => '3948201',
                'sangre' => 'O-',
                'tel' => '79340122',
                'dir' => 'Condominio La Riviera Depto 5B',
                'contacto' => ['nombre' => 'Patricia Justiniano Menacho', 'parentesco' => 'Hija', 'tel' => '79340188'],
            ],
            [
                'nombres' => 'Lucía Fernanda',
                'apellidos' => 'Céspedes Vaca',
                'fnac' => '1994-02-17',
                'sexo' => 'FEMENINO',
                'ci' => '8192034',
                'sangre' => 'B+',
                'tel' => '70451233',
                'dir' => 'Barrio Equipetrol Calle 9 Este #88',
                'contacto' => ['nombre' => 'Mario Céspedes Suárez', 'parentesco' => 'Padre', 'tel' => '70451277'],
            ],
            [
                'nombres' => 'Mario Alberto',
                'apellidos' => 'Sandoval Roca',
                'fnac' => '1971-08-30',
                'sexo' => 'MASCULINO',
                'ci' => '5019284',
                'sangre' => 'A-',
                'tel' => '71562344',
                'dir' => 'Av. San Martín Calle Tucumán #120',
                'contacto' => ['nombre' => 'Silvia Roca de Sandoval', 'parentesco' => 'Esposa', 'tel' => '71562366'],
            ],
            [
                'nombres' => 'Patricia Viviana',
                'apellidos' => 'Montero Cuéllar',
                'fnac' => '1985-06-14',
                'sexo' => 'FEMENINO',
                'ci' => '7392018',
                'sangre' => 'AB+',
                'tel' => '72673455',
                'dir' => 'Villa 1ro de Mayo Calle 5 #45',
                'contacto' => ['nombre' => 'Jorge Montero Cuéllar', 'parentesco' => 'Hermano', 'tel' => '72673499'],
            ],
            [
                'nombres' => 'Enrique Sebastián',
                'apellidos' => 'Banzer Suárez',
                'fnac' => '1955-12-10',
                'sexo' => 'MASCULINO',
                'ci' => '3102948',
                'sangre' => 'O+',
                'tel' => '73784566',
                'dir' => 'Barrio Las Palmas Calle Palmeras #32',
                'contacto' => ['nombre' => 'María Banzer Suárez', 'parentesco' => 'Hija', 'tel' => '73784500'],
            ],
            [
                'nombres' => 'Claudia Marcela',
                'apellidos' => 'Arteaga Menacho',
                'fnac' => '1997-03-29',
                'sexo' => 'FEMENINO',
                'ci' => '9028194',
                'sangre' => 'O+',
                'tel' => '74895677',
                'dir' => 'Av. Banzer 6to Anillo Condominio Sevilla',
                'contacto' => ['nombre' => 'Esteban Arteaga Menacho', 'parentesco' => 'Padre', 'tel' => '74895611'],
            ],
            [
                'nombres' => 'Víctor Hugo',
                'apellidos' => 'Terrazas Baldivieso',
                'fnac' => '1965-10-18',
                'sexo' => 'MASCULINO',
                'ci' => '4492017',
                'sangre' => 'A+',
                'tel' => '75906788',
                'dir' => 'Barrio Hamacas Calle 12 #200',
                'contacto' => ['nombre' => 'Carmen Baldivieso de Terrazas', 'parentesco' => 'Esposa', 'tel' => '75906700'],
            ],
            [
                'nombres' => 'Silvana Rocío',
                'apellidos' => 'Aguilera Torrico',
                'fnac' => '1989-07-22',
                'sexo' => 'FEMENINO',
                'ci' => '10294821',
                'sangre' => 'B-',
                'tel' => '76017899',
                'dir' => 'Av. Piraí 3er Anillo Externo #410',
                'contacto' => ['nombre' => 'Renato Aguilera Torrico', 'parentesco' => 'Hermano', 'tel' => '76017822'],
            ],
        ];

        $historiasMap = []; // id_paciente => id_historia_clinica

        foreach ($pacientesData as $pData) {
            $pacienteExistente = DB::table('pacientes')->where('numero_documento', $pData['ci'])->first();

            if (!$pacienteExistente) {
                $targetId = (DB::table('pacientes')->max('id_paciente') ?? 40) + 1;
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
                    'fecha_creacion' => $ahora->copy()->subDays(130),
                    'fecha_actualizacion' => $ahora,
                ], 'id_usuario');

                if ($rolPaciente) {
                    DB::table('usuario_rol')->insertOrIgnore([
                        'id_usuario' => $idUsuarioPaciente,
                        'id_rol' => $rolPaciente->id_rol,
                    ]);
                }

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
                    'fecha_registro' => $ahora->copy()->subDays(130),
                ], 'id_paciente');

                // Contacto de emergencia
                DB::table('contactos_emergencia')->insert([
                    'id_paciente' => $idPac,
                    'nombre' => $pData['contacto']['nombre'],
                    'parentesco' => $pData['contacto']['parentesco'],
                    'telefono' => $pData['contacto']['tel'],
                ]);
            } else {
                $idPac = $pacienteExistente->id_paciente;
            }

            // Historia clínica
            $hc = DB::table('historias_clinicas')->where('id_paciente', $idPac)->first();
            if (!$hc) {
                $idHc = DB::table('historias_clinicas')->insertGetId([
                    'id_paciente' => $idPac,
                    'fecha_apertura' => $ahora->copy()->subDays(130)->format('Y-m-d'),
                    'estado' => 'ACTIVO',
                    'created_at' => $ahora->copy()->subDays(130),
                    'updated_at' => $ahora,
                ], 'id_historia_clinica');
            } else {
                $idHc = $hc->id_historia_clinica;
            }

            $historiasMap[$idPac] = $idHc;
        }

        // =========================================================================
        // 2. ANTECEDENTES MÉDICOS VARIADOS Y RICOS (2 a 3 por paciente)
        // =========================================================================
        $antecedentesNuevos = [
            41 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Cardiopatía isquémica crónica e hipertensión diagnosticadas en 2020. Monitoreo regular por cardiología.'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Tratamiento continuo con Ácido Acetilsalicílico 100mg/día y Atorvastatina 40mg/noche.'],
                ['tipo' => 'FAMILIAR', 'desc' => 'Padre fallecido por infarto agudo de miocardio a los 62 años.'],
            ],
            42 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Hipotiroidismo primario de etiología autoinmune (Tiroiditis de Hashimoto) desde 2017.'],
                ['tipo' => 'ALERGICO', 'desc' => 'Reacción de erupción cutánea y edema facial comprobada frente a Sulfamidas (Cotrimoxazol).'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Levotiroxina sódica 75 mcg en ayunas estricto diario.'],
            ],
            43 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Diabetes Mellitus Tipo 2 de larga data (12 años) con neuropatía periférica leve en miembros inferiores.'],
                ['tipo' => 'QUIRURGICO', 'desc' => 'Bypass gástrico laparoscópico realizado en 2018 con adecuada tolerancia posoperatoria.'],
                ['tipo' => 'FAMILIAR', 'desc' => 'Madre y hermana con diabetes mellitus y nefropatía diabética.'],
            ],
            44 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Asma bronquial de origen alérgico moderada con exacerbaciones por frío y humedad.'],
                ['tipo' => 'ALERGICO', 'desc' => 'Alergia severa confirmada a Penicilina, Amoxicilina y Ampicilina (broncoespasmo severo).'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Budesonida + Formoterol 160/4.5 mcg inhalado cada 12 horas en temporada invernal.'],
            ],
            45 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Hipertensión Arterial Grado 2 refractaria con hipertrofia concéntrica ventricular izquierda leve.'],
                ['tipo' => 'QUIRURGICO', 'desc' => 'Artroplastia total de rodilla derecha (prótesis tricompartimental) en 2022.'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Tratamiento biterápico: Telmisartán 80mg + Amlodipino 5mg cada mañana.'],
            ],
            46 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Gastritis crónica atrófica con metaplasia intestinal incompleta y reflujo gastroesofágico.'],
                ['tipo' => 'ALERGICO', 'desc' => 'Hipersensibilidad gástrica y urticaria frente a AINEs (Naproxeno, Diclofenaco y Ketorolaco).'],
            ],
            47 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Enfermedad Pulmonar Obstructiva Crónica (EPOC) estadio GOLD 2 en ex-tabaquista severo.'],
                ['tipo' => 'QUIRURGICO', 'desc' => 'Resección transuretral de próstata (RTUP) por hiperplasia prostática benigna en 2020.'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Bromuro de Tiotropio 18 mcg polvo inhalado 1 cápsula al día por la mañana.'],
            ],
            48 => [
                ['tipo' => 'ALERGICO', 'desc' => 'Rinitis alérgica perenne y conjuntivitis alérgica estacional frente a ácaros y gramíneas.'],
                ['tipo' => 'FAMILIAR', 'desc' => 'Hermana diagnosticada con Lupus Eritematoso Sistémico (LES).'],
            ],
            49 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Insuficiencia Cardíaca Congestiva con Fracción de Eyección Reducida (FEVI 42%) clase funcional NYHA II.'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Sacubitrilo/Valsartán 24/26 mg cada 12 horas y Espironolactona 25mg/día.'],
                ['tipo' => 'QUIRURGICO', 'desc' => 'Cateterismo cardíaco diagnóstico y angioplastia coronaria con stent en 2021.'],
            ],
            50 => [
                ['tipo' => 'PATOLOGICO', 'desc' => 'Migraña sin aura episódica de alta frecuencia con crisis pulsátiles incapacitantes.'],
                ['tipo' => 'QUIRURGICO', 'desc' => 'Cesárea segmentaria electiva sin complicaciones quirúrgicas en 2019.'],
                ['tipo' => 'FARMACOLOGICO', 'desc' => 'Topiramato 25mg/noche como profilaxis neurológica y Rizatriptán 10mg en rescate agudo.'],
            ],
        ];

        foreach ($antecedentesNuevos as $pacId => $listaAnt) {
            $hcId = $historiasMap[$pacId] ?? null;
            if (!$hcId) continue;

            foreach ($listaAnt as $ant) {
                $existe = DB::table('antecedentes')
                    ->where('id_historia_clinica', $hcId)
                    ->where('tipo_antecedente', $ant['tipo'])
                    ->where('descripcion', $ant['desc'])
                    ->first();

                if (!$existe) {
                    DB::table('antecedentes')->insert([
                        'id_historia_clinica' => $hcId,
                        'tipo_antecedente' => $ant['tipo'],
                        'descripcion' => $ant['desc'],
                        'registrado_por' => $adminId,
                        'fecha_registro' => $ahora->copy()->subDays(rand(60, 120)),
                        'estado' => 'ACTIVO',
                        'created_at' => $ahora->copy()->subDays(rand(60, 120)),
                        'updated_at' => $ahora,
                    ]);
                }
            }
        }

        // =========================================================================
        // 3. CITAS MÉDICAS HISTÓRICAS EN RANGO DE 4 MESES (~120 días)
        // =========================================================================
        // Mapeo médico -> especialidad principal
        $medicoEspMap = [];
        foreach ($medicos as $m) {
            $esp = DB::table('medico_especialidad')->where('id_medico', $m->id_medico)->where('es_principal', true)->value('id_especialidad');
            if (!$esp) {
                $esp = DB::table('medico_especialidad')->where('id_medico', $m->id_medico)->value('id_especialidad') ?? 1;
            }
            $medicoEspMap[$m->id_medico] = $esp;
        }

        // Catálogo de atenciones clínicas coherente con patologías
        $catalogoClinico = [
            [
                'cie' => 'I25.9',
                'diag' => 'Enfermedad isquémica crónica del corazón',
                'motivo' => 'Control cardiológico rutinario, opresión precordial leve ante esfuerzo físico moderado.',
                'trat' => 'Mantener dosis de estatinas y aspirina. Dieta mediterránea baja en sodio y caminata 30 min diarios.',
                'med' => 'Atorvastatina 40mg',
                'dosis' => '1 comprimido',
                'freq' => 'Cada noche',
                'dur' => '90 días',
                'estudio' => ['tipo' => 'CARDIOLOGIA', 'nombre' => 'Electrocardiograma de 12 Derivaciones', 'prep' => 'Reposo previo de 10 min.', 'pres' => 'Monitoreo de isquemia miocárdica.'],
                'doc' => ['titulo' => 'Electrocardiograma de Control con Trazado Digital', 'tipo' => 'INFORME_EXTERNO', 'mime' => 'application/pdf', 'bytes' => 380120],
            ],
            [
                'cie' => 'E03.9',
                'diag' => 'Hipotiroidismo, no especificado',
                'motivo' => 'Evaluación de fatiga matutina, piel seca y control periódico de TSH y T4 libre.',
                'trat' => 'Ajuste de dosis de Levotiroxina a 88 mcg en ayunas con agua. Recontrol en 8 semanas.',
                'med' => 'Levotiroxina 88mcg',
                'dosis' => '1 comprimido',
                'freq' => 'En ayunas diario',
                'dur' => '60 días',
                'estudio' => ['tipo' => 'LABORATORIO', 'nombre' => 'Perfil Tiroideo Completo (TSH, T4 libre, T3)', 'prep' => 'Ayuno de 8 horas sin tomar levotiroxina antes de la extracción.', 'pres' => 'Ajuste de dosificación tiroidea.'],
                'doc' => ['titulo' => 'Resultado de Perfil Tiroideo Bioquímico', 'tipo' => 'LABORATORIO', 'mime' => 'application/pdf', 'bytes' => 450190],
            ],
            [
                'cie' => 'E11.4',
                'diag' => 'Diabetes tipo 2 con complicaciones neurológicas',
                'motivo' => 'Parestesias en ambos pies, sensación de ardor nocturno y control de hemoglobina glicosilada.',
                'trat' => 'Optimización de esquema glucémico. Pregabalina 75mg nocturna para dolor neuropático.',
                'med' => 'Pregabalina 75mg',
                'dosis' => '1 cápsula',
                'freq' => 'Cada noche antes de dormir',
                'dur' => '30 días',
                'estudio' => ['tipo' => 'LABORATORIO', 'nombre' => 'Hemoglobina Glicosilada (HbA1c) y Microalbuminuria', 'prep' => 'Ayuno de 10 horas.', 'pres' => 'Control de nefropatía y glucemia diabética.'],
                'doc' => ['titulo' => 'Informe de Hemoglobina Glicosilada y Química Sanguínea', 'tipo' => 'LABORATORIO', 'mime' => 'application/pdf', 'bytes' => 512000],
            ],
            [
                'cie' => 'J45.0',
                'diag' => 'Asma predominantemente alérgica',
                'motivo' => 'Sibilancias espiratorias nocturnas, tos seca persistente tras exposición a alérgenos.',
                'trat' => 'Uso regular de corticoide inhalado + broncodilatador. Evitar exposición a humo y cambios bruscos de temperatura.',
                'med' => 'Salbutamol 100mcg aerosol',
                'dosis' => '2 inhalaciones',
                'freq' => 'Cada 6 u 8 horas según crisis',
                'dur' => '1 inhalador',
                'estudio' => ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Radiografía de Tórax PA en Alta Resolución (DICOM)', 'prep' => 'Retirar joyas y objetos metálicos.', 'pres' => 'Descarte de condensación o hiperinsuflación pulmonar.'],
                'doc' => ['titulo' => 'Radiografía de Tórax PA Digitalizada en Estándar DICOM', 'tipo' => 'IMAGENOLOGIA', 'mime' => 'application/dicom', 'bytes' => 12450190],
            ],
            [
                'cie' => 'I10',
                'diag' => 'Hipertensión esencial (primaria)',
                'motivo' => 'Cifras tensionales elevadas en domicilio (150/95 mmHg) acompañadas de cefalea tensional.',
                'trat' => 'Adición de diurético tiazídico a dosis bajas + restricción moderada de cafeína y sal.',
                'med' => 'Hidroclorotiazida 12.5mg',
                'dosis' => '1 comprimido',
                'freq' => 'Por la mañana con desayuno',
                'dur' => '30 días',
                'estudio' => ['tipo' => 'CARDIOLOGIA', 'nombre' => 'Ecocardiograma Transtorácico Doppler Color', 'prep' => 'Ropa cómoda de dos piezas.', 'pres' => 'Evaluación de grosor parietal y función diastólica.'],
                'doc' => ['titulo' => 'Ecocardiograma Transtorácico con Flujometría Doppler', 'tipo' => 'INFORME_EXTERNO', 'mime' => 'application/pdf', 'bytes' => 610400],
            ],
            [
                'cie' => 'K29.4',
                'diag' => 'Gastritis atrófica crónica',
                'motivo' => 'Pesadez gástrica, náuseas posprandiales y saciedad precoz tras ingesta habitual.',
                'trat' => 'Esquema con inhibidor de bomba de protones matutino + fraccionar comidas en 5 tomas pequeñas.',
                'med' => 'Esomeprazol 40mg',
                'dosis' => '1 comprimido',
                'freq' => '30 minutos antes del desayuno',
                'dur' => '45 días',
                'estudio' => ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Endoscopía Digestiva Alta con Biopsia Gástrica', 'prep' => 'Ayuno absoluto de 8 horas previas.', 'pres' => 'Evolución de metaplasia gástrica.'],
                'doc' => ['titulo' => 'Informe Anatomopatológico de Biopsia Gástrica', 'tipo' => 'LABORATORIO', 'mime' => 'application/pdf', 'bytes' => 480200],
            ],
            [
                'cie' => 'J44.9',
                'diag' => 'Enfermedad pulmonar obstructiva crónica',
                'motivo' => 'Disnea progresiva mMRC 2 ante caminatas en pendientes y aumento de expectoración mucosa.',
                'trat' => 'Terapia broncodilatadora dual inhalada diaria. Ejercicios de fisioterapia respiratoria.',
                'med' => 'Bromuro de Ipratropio + Fenoterol',
                'dosis' => '2 puff',
                'freq' => 'Cada 8 horas con aerocámara',
                'dur' => '1 frasco',
                'estudio' => ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Tomografía Computarizada de Alta Resolución de Tórax (DICOM)', 'prep' => 'Sin preparación especial.', 'pres' => 'Evaluación de atrapamiento aéreo y enfisema centrolobulillar.'],
                'doc' => ['titulo' => 'Tomografía Axial Computarizada de Tórax (Cortes Milimétricos DICOM)', 'tipo' => 'IMAGENOLOGIA', 'mime' => 'application/dicom', 'bytes' => 28401920],
            ],
            [
                'cie' => 'J30.1',
                'diag' => 'Rinitis alérgica debida al polen',
                'motivo' => 'Crisis de estornudos en salva, rinorrea acuosa y prurito ocular al despertar.',
                'trat' => 'Antihistamínico de segunda generación + spray nasal de corticoide tópico por 3 semanas.',
                'med' => 'Levocetirizina 5mg',
                'dosis' => '1 comprimido',
                'freq' => 'Cada noche antes de dormir',
                'dur' => '20 días',
                'estudio' => ['tipo' => 'LABORATORIO', 'nombre' => 'Inmunoglobulina E Total (IgE) y Prick Test de Alergia', 'prep' => 'Suspender antihistamínicos 5 días antes.', 'pres' => 'Identificación de alérgenos específicos.'],
                'doc' => ['titulo' => 'Panel Alergológico y Dosificación de IgE Específica', 'tipo' => 'LABORATORIO', 'mime' => 'application/pdf', 'bytes' => 395100],
            ],
            [
                'cie' => 'I50.9',
                'diag' => 'Insuficiencia cardíaca, no especificada',
                'motivo' => 'Edema bimaleolar vespertino progresivo y ortopnea que requiere elevar 2 almohadas al dormir.',
                'trat' => 'Ajuste de diurético de asa matutino. Registro diario matutino de peso y presión arterial.',
                'med' => 'Furosemida 40mg',
                'dosis' => '1 tableta',
                'freq' => 'Cada mañana en ayunas',
                'dur' => '30 días',
                'estudio' => ['tipo' => 'LABORATORIO', 'nombre' => 'Péptido Natriurético Cerebral (NT-proBNP) y Electrolitos', 'prep' => 'Ayuno de 6 horas.', 'pres' => 'Valoración de descompensación de insuficiencia cardíaca.'],
                'doc' => ['titulo' => 'Concentración de Biomarcadores Cardíacos y Función Renal', 'tipo' => 'LABORATORIO', 'mime' => 'application/pdf', 'bytes' => 420900],
            ],
            [
                'cie' => 'G43.0',
                'diag' => 'Migraña sin aura [migraña común]',
                'motivo' => 'Episodio de dolor hemicraneano intenso pulsátil de 18 horas con fotofobia y náuseas.',
                'trat' => 'Reposo en habitación oscura y silenciosa. Triptán al inicio de la fase dolorosa.',
                'med' => 'Rizatriptán 10mg',
                'dosis' => '1 comprimido bucodispersable',
                'freq' => 'Al inicio de la crisis migrañosa',
                'dur' => '6 comprimidos',
                'estudio' => ['tipo' => 'IMAGENOLOGIA', 'nombre' => 'Resonancia Magnética Nuclear de Encéfalo (DICOM)', 'prep' => 'Retirar implantes o piercings metálicos.', 'pres' => 'Descarte de patología estructural o vascular cerebral.'],
                'doc' => ['titulo' => 'Resonancia Magnética de Cerebro en Secuencias T1, T2 y FLAIR (DICOM)', 'tipo' => 'IMAGENOLOGIA', 'mime' => 'application/dicom', 'bytes' => 31204890],
            ],
        ];

        $codigoIndex = (DB::table('citas')->max('id_cita') ?? 0) + 1;
        $ordenIndex = (DB::table('ordenes_examenes')->max('id_orden') ?? 0) + 1;
        $horasSlots = ['08:30:00', '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00', '17:00:00'];

        // Cargar slots ocupados para evitar solapamientos
        $occupiedSlots = [];
        $existingCitas = DB::table('citas')->where('estado', '!=', 'CANCELADA')->get(['id_medico', 'fecha_hora_inicio']);
        foreach ($existingCitas as $ec) {
            $occupiedSlots[$ec->id_medico][$ec->fecha_hora_inicio] = true;
        }

        // Cada uno de los 10 pacientes tendrá 5 citas en el rango de los últimos 4 meses (~120 días)
        foreach ($pacientesData as $pIdx => $pData) {
            $pacienteObj = DB::table('pacientes')->where('numero_documento', $pData['ci'])->first();
            if (!$pacienteObj) continue;

            $pacId = $pacienteObj->id_paciente;
            $hcId = $historiasMap[$pacId] ?? null;
            if (!$hcId) continue;

            $clinicaProfile = $catalogoClinico[$pIdx % count($catalogoClinico)];

            // 5 citas escalonadas en el tiempo:
            // Cita 1: hace 110 - 120 días (apertura de control)
            // Cita 2: hace 80 - 95 días (seguimiento clínico)
            // Cita 3: hace 50 - 65 días (control de exámenes)
            // Cita 4: hace 15 - 30 días (evolución reciente)
            // Cita 5: hace 2 - 5 días o próximos 3 días (último control / cita programada)
            $citasDistribucion = [
                ['dias' => rand(110, 120), 'futura' => false, 'estado' => 'ATENDIDA'],
                ['dias' => rand(80, 95),   'futura' => false, 'estado' => 'ATENDIDA'],
                ['dias' => rand(50, 65),   'futura' => false, 'estado' => 'ATENDIDA'],
                ['dias' => rand(18, 32),   'futura' => false, 'estado' => ($pIdx === 3 ? 'CANCELADA' : ($pIdx === 7 ? 'NO_ASISTIO' : 'ATENDIDA'))],
                ['dias' => rand(1, 4),     'futura' => ($pIdx % 3 === 0), 'estado' => ($pIdx % 3 === 0 ? 'CONFIRMADA' : 'ATENDIDA')],
            ];

            foreach ($citasDistribucion as $cIdx => $cConf) {
                $codigoCita = sprintf('CM-%04d', $codigoIndex++);
                $medico = $medicos[($pacId + $cIdx) % $totalMedicos];
                $idEsp = $medicoEspMap[$medico->id_medico] ?? 1;
                $precioConsulta = DB::table('especialidades')->where('id_especialidad', $idEsp)->value('precio_consulta') ?? 90.00;
                $idTipo = $tiposCita[($cIdx) % count($tiposCita)];

                if ($cConf['futura']) {
                    $fechaCita = $ahora->copy()->addDays($cConf['dias']);
                } else {
                    $fechaCita = $ahora->copy()->subDays($cConf['dias']);
                }

                $estado = $cConf['estado'];

                // Encontrar slot horario sin colisión
                $slotFound = false;
                $slotTry = 0;
                $fInicio = null;
                $fFin = null;

                while (!$slotFound && $slotTry < count($horasSlots)) {
                    $horaStr = $horasSlots[($pacId + $cIdx + $slotTry) % count($horasSlots)];
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
                    $fInicio = Carbon::parse($fechaCita->format('Y-m-d') . ' 10:30:00');
                    $fFin = $fInicio->copy()->addMinutes(30);
                }

                $motivoCancelacion = null;
                $canceladaEn = null;
                if ($estado === 'CANCELADA') {
                    $motivoCancelacion = 'Paciente con cuadro febril agudo solicitó reprogramación de fecha.';
                    $canceladaEn = $fInicio->copy()->subHours(6);
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
                    'motivo_consulta' => $clinicaProfile['motivo'],
                    'motivo_cancelacion' => $motivoCancelacion,
                    'cancelada_en' => $canceladaEn,
                    'creada_por' => $adminId,
                    'created_at' => $fInicio->copy()->subDays(2),
                    'updated_at' => ($estado === 'ATENDIDA') ? $fFin : $fInicio,
                ], 'id_cita');

                // Trazabilidad de estados
                DB::table('cita_estado_historial')->insert([
                    'id_cita' => $idCita,
                    'estado_anterior' => null,
                    'estado_nuevo' => ($estado === 'ATENDIDA' || $estado === 'CONFIRMADA') ? 'PROGRAMADA' : $estado,
                    'id_usuario' => $adminId,
                    'observacion' => 'Agendamiento programado en sistema clínico.',
                    'fecha_cambio' => $fInicio->copy()->subDays(2),
                ]);

                if ($estado !== 'PROGRAMADA') {
                    DB::table('cita_estado_historial')->insert([
                        'id_cita' => $idCita,
                        'estado_anterior' => 'PROGRAMADA',
                        'estado_nuevo' => $estado,
                        'id_usuario' => $adminId,
                        'observacion' => ($estado === 'CANCELADA') ? $motivoCancelacion : ($estado === 'NO_ASISTIO' ? 'Incomparecencia del paciente en horario asignado.' : 'Atención médica concluida con éxito.'),
                        'fecha_cambio' => ($estado === 'ATENDIDA') ? $fFin : ($estado === 'CANCELADA' ? $canceladaEn : $fInicio),
                    ]);
                }

                // Si está ATENDIDA: registrar Consulta, Diagnóstico, Evolución, Receta y Pago
                if ($estado === 'ATENDIDA') {
                    $peso = rand(58, 86) + (rand(0, 9) / 10);
                    $talla = rand(156, 182) + (rand(0, 9) / 10);
                    $temp = 36.3 + (rand(0, 10) / 10);
                    $sistolica = rand(112, 138);
                    $diastolica = rand(72, 88);
                    $fc = rand(66, 84);

                    $idConsulta = DB::table('consultas_medicas')->insertGetId([
                        'id_cita' => $idCita,
                        'id_historia_clinica' => $hcId,
                        'id_medico' => $medico->id_medico,
                        'motivo_consulta' => $clinicaProfile['motivo'],
                        'peso_kg' => $peso,
                        'talla_cm' => $talla,
                        'temperatura_c' => $temp,
                        'presion_arterial' => $sistolica . '/' . $diastolica,
                        'frecuencia_cardiaca' => $fc,
                        'observaciones' => 'Paciente lúcido, normohidratado, hemodinámicamente estable. Cumpliendo pautas previas.',
                        'plan_tratamiento' => $clinicaProfile['trat'],
                        'fecha_consulta' => $fFin,
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ], 'id_consulta');

                    // Diagnóstico CIE-10
                    DB::table('diagnosticos')->insert([
                        'id_historia_clinica' => $hcId,
                        'id_consulta' => $idConsulta,
                        'descripcion' => $clinicaProfile['diag'],
                        'codigo_cie10' => $clinicaProfile['cie'],
                        'tipo' => 'DEFINITIVO',
                        'fecha_registro' => $fFin,
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ]);

                    // Evolución
                    DB::table('evoluciones')->insert([
                        'id_historia_clinica' => $hcId,
                        'id_medico' => $medico->id_medico,
                        'nota' => 'Evolución clínica favorable con buena adherencia a medicación de base. Se refuerzan pautas de estilo de vida.',
                        'fecha_registro' => $fFin,
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ]);

                    // Receta y detalle
                    $idReceta = DB::table('recetas')->insertGetId([
                        'id_historia_clinica' => $hcId,
                        'id_consulta' => $idConsulta,
                        'id_medico' => $medico->id_medico,
                        'fecha_emision' => $fFin,
                        'indicaciones_generales' => 'Tomar medicación con agua. Mantener horario estricto.',
                        'estado' => 'ACTIVO',
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ], 'id_receta');

                    DB::table('receta_detalles')->insert([
                        'id_receta' => $idReceta,
                        'medicamento' => $clinicaProfile['med'],
                        'dosis' => $clinicaProfile['dosis'],
                        'frecuencia' => $clinicaProfile['freq'],
                        'duracion' => $clinicaProfile['dur'],
                        'indicaciones' => 'Vía oral con abundante agua.',
                        'created_at' => $fFin,
                        'updated_at' => $fFin,
                    ]);

                    // Pago de la consulta
                    $metodoPago = ($cIdx % 4 === 0) ? 'QR_BANCARIO' : 'EFECTIVO';
                    DB::table('pagos')->insert([
                        'id_cita' => $idCita,
                        'id_paciente' => $pacId,
                        'monto' => $precioConsulta,
                        'metodo_pago' => $metodoPago,
                        'stripe_payment_intent_id' => null,
                        'estado' => 'COMPLETADO',
                        'fecha_pago' => $fFin,
                        'created_at' => $fInicio,
                        'updated_at' => $fFin,
                    ]);

                    // En la 2da y 3ra consulta: emitir orden médica y documento clínico / DICOM
                    if ($cIdx === 1 || $cIdx === 2) {
                        $idOrden = DB::table('ordenes_examenes')->insertGetId([
                            'codigo_orden' => sprintf('ORD-%04d', $ordenIndex++),
                            'id_consulta' => $idConsulta,
                            'id_historia_clinica' => $hcId,
                            'id_medico' => $medico->id_medico,
                            'tipo_estudio' => $clinicaProfile['estudio']['tipo'],
                            'nombre_estudio' => $clinicaProfile['estudio']['nombre'],
                            'indicaciones_preparacion' => $clinicaProfile['estudio']['prep'],
                            'diagnostico_presuntivo' => $clinicaProfile['estudio']['pres'],
                            'estado' => 'CON_RESULTADOS',
                            'fecha_emision' => $fFin,
                            'created_at' => $fFin,
                            'updated_at' => $fFin,
                        ], 'id_orden');

                        // Documento clínico adjunto (PDF o DICOM)
                        $isDicom = ($clinicaProfile['doc']['mime'] === 'application/dicom');
                        $cloudinaryUrl = $isDicom
                            ? 'https://res.cloudinary.com/clinica-lacruz/raw/upload/v173000200' . $pacId . '/dicom/estudio_' . strtolower(explode(' ', $clinicaProfile['estudio']['nombre'])[0]) . '.dcm'
                            : 'https://res.cloudinary.com/clinica-lacruz/image/upload/v173000200' . $pacId . '/docs/resultado_clinico_' . $pacId . '.pdf';

                        DB::table('documentos_clinicos')->insert([
                            'id_historia_clinica' => $hcId,
                            'id_consulta' => $idConsulta,
                            'id_orden' => $idOrden,
                            'id_medico' => $medico->id_medico,
                            'titulo' => $clinicaProfile['doc']['titulo'],
                            'tipo_documento' => $clinicaProfile['doc']['tipo'],
                            'descripcion' => 'Estudio complementario institucional vinculado a consulta médica del paciente.',
                            'ruta_archivo' => $cloudinaryUrl,
                            'mime_type' => $clinicaProfile['doc']['mime'],
                            'tamanio_bytes' => $clinicaProfile['doc']['bytes'],
                            'fecha_subida' => $fFin,
                            'estado' => 'ACTIVO',
                            'created_at' => $fFin,
                            'updated_at' => $fFin,
                        ]);
                    }
                }
            }
        }

        // =========================================================================
        // 4. SINCRONIZACIÓN DE SECUENCIAS POSTGRESQL
        // =========================================================================
        $tablasSeq = [
            'pacientes' => 'pacientes_id_paciente_seq',
            'usuarios' => 'usuarios_id_usuario_seq',
            'citas' => 'citas_id_cita_seq',
            'consultas_medicas' => 'consultas_medicas_id_consulta_seq',
            'diagnosticos' => 'diagnosticos_id_diagnostico_seq',
            'evoluciones' => 'evoluciones_id_evolucion_seq',
            'recetas' => 'recetas_id_receta_seq',
            'receta_detalles' => 'receta_detalles_id_detalle_seq',
            'historias_clinicas' => 'historias_clinicas_id_historia_clinica_seq',
            'antecedentes' => 'antecedentes_id_antecedente_seq',
            'ordenes_examenes' => 'ordenes_examenes_id_orden_seq',
            'documentos_clinicos' => 'documentos_clinicos_id_documento_seq',
            'pagos' => 'pagos_id_pago_seq',
            'cita_estado_historial' => 'cita_estado_historial_id_historial_seq',
            'contactos_emergencia' => 'contactos_emergencia_id_contacto_seq',
        ];

        foreach ($tablasSeq as $tabla => $seq) {
            try {
                $pkCol = DB::select("SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = '{$tabla}'::regclass AND i.indisprimary")[0]->attname ?? 'id';
                DB::statement("SELECT setval('{$seq}', COALESCE((SELECT MAX({$pkCol}) FROM {$tabla}), 1))");
            } catch (\Throwable $e) {}
        }
    }
}

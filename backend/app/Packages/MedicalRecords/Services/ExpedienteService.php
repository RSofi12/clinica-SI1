<?php

namespace App\Packages\MedicalRecords\Services;

use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\MedicalRecords\Models\Antecedente;
use App\Packages\MedicalRecords\Models\ConsultaMedica;
use App\Packages\MedicalRecords\Models\HistoriaClinica;
use App\Packages\MedicalRecords\Models\Receta;
use App\Packages\MedicalRecords\Models\OrdenExamen;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Servicio de Dominio para Consulta y Agregación de Expediente Clínico (CU19)
 * Paquete 4: Historial Clínico y Consultas
 */
class ExpedienteService
{
    /**
     * Obtiene el expediente clínico integral por ID de paciente con Scoping RBAC / Anti-IDOR
     *
     * @param int $idPaciente
     * @param User $usuario
     * @param string|null $ip
     * @return array
     * @throws HttpException
     */
    public function obtenerExpedientePorPaciente(int $idPaciente, User $usuario, ?string $ip = null): array
    {
        // 1. Control de Acceso RBAC y Anti-IDOR
        $this->validarAcceso($idPaciente, $usuario);

        // 2. Localizar Paciente con contactos de emergencia
        $paciente = Paciente::with(['contactosEmergencia'])->findOrFail($idPaciente);

        // 3. Obtener o inicializar la Historia Clínica agregadora
        $historia = HistoriaClinica::firstOrCreate(
            ['id_paciente' => $idPaciente],
            [
                'fecha_apertura' => now()->toDateString(),
                'estado' => 'ACTIVO',
            ]
        );

        // 4. Cargar Antecedentes (CU17)
        $antecedentes = Antecedente::with([
                'registrador:id_usuario,username,tipo_usuario',
                'registrador.medico:id_medico,id_usuario,nombres,apellidos',
            ])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->orderBy('id_antecedente', 'desc')
            ->get();

        // 5. Cargar Consultas Médicas y Triaje con Diagnósticos CIE-10 (CU16)
        $consultas = ConsultaMedica::with(['diagnosticos', 'medico.usuario'])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->orderBy('fecha_consulta', 'desc')
            ->orderBy('id_consulta', 'desc')
            ->get();

        // 6. Cargar Recetas Médicas con sus fármacos y posología (CU18)
        $recetas = Receta::with(['detalles', 'medico.usuario'])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->orderBy('fecha_emision', 'desc')
            ->orderBy('id_receta', 'desc')
            ->get();

        // 7. Síntesis y Métricas Clínicas de Alto Valor
        $alertasAlergicas = $antecedentes->filter(fn($a) => $a->tipo_antecedente === 'ALERGICO' && $a->estado === 'ACTIVO')
            ->map(fn($a) => [
                'id_antecedente' => $a->id_antecedente,
                'tipo_antecedente' => $a->tipo_antecedente,
                'descripcion' => $a->descripcion,
                'fecha_registro' => $a->fecha_registro,
                'registrador' => $a->registrador,
            ])->values();

        $patologicosCronicos = $antecedentes->filter(fn($a) => $a->tipo_antecedente === 'PATOLOGICO' && $a->estado === 'ACTIVO')
            ->map(fn($a) => [
                'id_antecedente' => $a->id_antecedente,
                'tipo_antecedente' => $a->tipo_antecedente,
                'descripcion' => $a->descripcion,
                'fecha_registro' => $a->fecha_registro,
                'registrador' => $a->registrador,
            ])->values();

        $ultimaConsulta = $consultas->first();
        $ultimoTriaje = null;
        if ($ultimaConsulta) {
            $ultimoTriaje = [
                'fecha' => $ultimaConsulta->fecha_consulta,
                'presion_arterial' => $ultimaConsulta->presion_arterial,
                'frecuencia_cardiaca' => $ultimaConsulta->frecuencia_cardiaca,
                'frecuencia_respiratoria' => $ultimaConsulta->frecuencia_respiratoria,
                'temperatura' => $ultimaConsulta->temperatura,
                'saturacion_oxigeno' => $ultimaConsulta->saturacion_oxigeno,
                'peso' => $ultimaConsulta->peso,
                'altura' => $ultimaConsulta->altura,
                'imc' => $ultimaConsulta->imc,
            ];
        }

        // 7.1 Órdenes de Exámenes Auxiliares (CU25)
        $ordenes = OrdenExamen::with([
            'medico:id_medico,nombres,apellidos,codigo_profesional',
            'documentosAdjuntos:id_documento,id_orden,titulo,tipo_documento,ruta_archivo,mime_type,tamanio_bytes,fecha_subida',
        ])
        ->where('id_historia_clinica', $historia->id_historia_clinica)
        ->latest('fecha_emision')
        ->get();

        // 8. Trazabilidad inmutable en Bitácora (CU03)
        Bitacora::registrar(
            $usuario->id_usuario,
            'HISTORIAL_CLINICO',
            'CONSULTAR_EXPEDIENTE',
            'historias_clinicas',
            $historia->id_historia_clinica,
            "Consulta de expediente clínico del paciente #{$idPaciente} ({$paciente->nombre_completo})",
            $ip
        );

        return [
            'historia_clinica' => $historia,
            'paciente' => $paciente,
            'resumen_clinico' => [
                'alertas_alergicas' => $alertasAlergicas,
                'patologicos_cronicos' => $patologicosCronicos,
                'total_consultas' => $consultas->count(),
                'total_recetas' => $recetas->count(),
                'total_recetas_activas' => $recetas->where('estado', 'EMITIDA')->count(),
                'total_ordenes' => $ordenes->count(),
                'total_ordenes_pendientes' => $ordenes->where('estado', 'PENDIENTE')->count(),
                'ultima_consulta' => $ultimaConsulta,
                'ultimo_triaje' => $ultimoTriaje,
            ],
            'antecedentes' => $antecedentes,
            'consultas' => $consultas,
            'recetas' => $recetas,
            'ordenes' => $ordenes,
        ];
    }

    /**
     * Obtiene el expediente propio del paciente en sesión (Autoservicio CU19)
     *
     * @param User $usuario
     * @param string|null $ip
     * @return array
     */
    public function obtenerMiExpediente(User $usuario, ?string $ip = null): array
    {
        $paciente = $usuario->paciente;
        if (!$paciente) {
            throw new HttpException(404, 'No se encontró un perfil de paciente asociado a este usuario.');
        }

        return $this->obtenerExpedientePorPaciente($paciente->id_paciente, $usuario, $ip);
    }

    /**
     * Genera un timeline cronológico unificado de todas las atenciones, prescripciones y antecedentes
     *
     * @param int $idPaciente
     * @param User $usuario
     * @return array
     */
    public function obtenerTimeline(int $idPaciente, User $usuario): array
    {
        $this->validarAcceso($idPaciente, $usuario);

        $historia = HistoriaClinica::where('id_paciente', $idPaciente)->first();
        if (!$historia) {
            return [];
        }

        $eventos = [];

        // Consultas
        $consultas = ConsultaMedica::with(['diagnosticos', 'medico.usuario'])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->get();

        foreach ($consultas as $c) {
            $medicoNombre = $c->medico?->usuario?->name ?? 'Médico Asignado';
            $diagnosticos = $c->diagnosticos->map(fn($d) => $d->descripcion_cie10 ?? $d->codigo_cie10)->toArray();

            $eventos[] = [
                'tipo' => 'CONSULTA',
                'icono' => 'stethoscope',
                'fecha' => $c->fecha_consulta ? $c->fecha_consulta->format('Y-m-d H:i') : null,
                'timestamp' => $c->fecha_consulta ? $c->fecha_consulta->timestamp : 0,
                'titulo' => 'Consulta Médica Presencial',
                'subtitulo' => "Atendido por: Dr(a). {$medicoNombre}",
                'descripcion' => $c->motivo_consulta,
                'detalles' => [
                    'diagnosticos' => $diagnosticos,
                    'plan_tratamiento' => $c->plan_tratamiento,
                    'imc' => $c->imc,
                    'presion_arterial' => $c->presion_arterial,
                ],
                'id_referencia' => $c->id_consulta,
            ];
        }

        // Recetas
        $recetas = Receta::with(['detalles', 'medico.usuario'])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->get();

        foreach ($recetas as $r) {
            $medicoNombre = $r->medico?->usuario?->name ?? 'Médico Prescriptor';
            $farmacos = $r->detalles->map(fn($d) => "{$d->medicamento} ({$d->dosis})")->toArray();

            $eventos[] = [
                'tipo' => 'RECETA',
                'icono' => 'pill',
                'fecha' => $r->fecha_emision ? $r->fecha_emision->format('Y-m-d') : null,
                'timestamp' => $r->fecha_emision ? $r->fecha_emision->timestamp : 0,
                'titulo' => "Receta Médica #{$r->id_receta}",
                'subtitulo' => "Emitida por: Dr(a). {$medicoNombre} • Estado: {$r->estado}",
                'descripcion' => $r->diagnostico_cie10 ?: 'Prescripción farmacológica',
                'detalles' => [
                    'medicamentos' => $farmacos,
                    'estado' => $r->estado,
                    'instrucciones_generales' => $r->instrucciones_generales,
                ],
                'id_referencia' => $r->id_receta,
            ];
        }

        // Antecedentes (CU17)
        $antecedentes = Antecedente::with([
                'registrador:id_usuario,username,tipo_usuario',
                'registrador.medico:id_medico,id_usuario,nombres,apellidos',
            ])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->get();
        foreach ($antecedentes as $a) {
            $fecha = $a->fecha_registro ?: $a->created_at ?: now();
            $registradorNombre = 'Personal Clínico';
            if ($a->registrador) {
                if ($a->registrador->medico) {
                    $registradorNombre = "Dr(a). {$a->registrador->medico->nombres} {$a->registrador->medico->apellidos}";
                } else {
                    $registradorNombre = "@{$a->registrador->username}";
                }
            }
            $eventos[] = [
                'tipo' => 'ANTECEDENTE',
                'icono' => 'clipboard-document-list',
                'fecha' => $fecha->format('Y-m-d H:i'),
                'timestamp' => $fecha->timestamp,
                'titulo' => "Antecedente: {$a->tipo_antecedente}",
                'subtitulo' => "Registrado por: {$registradorNombre} • Estado: {$a->estado}",
                'descripcion' => $a->descripcion,
                'detalles' => [
                    'tipo_antecedente' => $a->tipo_antecedente,
                    'estado' => $a->estado,
                    'descripcion' => $a->descripcion,
                ],
                'id_referencia' => $a->id_antecedente,
            ];
        }

        // Órdenes de Exámenes Auxiliares (CU25)
        $ordenesExamenes = OrdenExamen::with(['medico.usuario', 'documentosAdjuntos'])
            ->where('id_historia_clinica', $historia->id_historia_clinica)
            ->get();

        foreach ($ordenesExamenes as $oe) {
            $medicoNombre = $oe->medico?->usuario?->name ?? 'Médico Tratante';
            $eventos[] = [
                'tipo' => 'ORDEN_EXAMEN',
                'icono' => 'flask',
                'fecha' => $oe->fecha_emision ? $oe->fecha_emision->format('Y-m-d H:i') : null,
                'timestamp' => $oe->fecha_emision ? $oe->fecha_emision->timestamp : 0,
                'titulo' => "Orden de Examen: {$oe->nombre_estudio}",
                'subtitulo' => "Tipo: {$oe->tipo_estudio} • Estado: {$oe->estado} • Dr(a). {$medicoNombre}",
                'descripcion' => $oe->indicaciones_preparacion ?: 'Sin preparación especial requerida.',
                'detalles' => [
                    'codigo_orden' => $oe->codigo_orden,
                    'tipo_estudio' => $oe->tipo_estudio,
                    'estado' => $oe->estado,
                    'diagnostico_presuntivo' => $oe->diagnostico_presuntivo,
                    'total_documentos' => $oe->documentosAdjuntos->count(),
                ],
                'id_referencia' => $oe->id_orden,
            ];
        }

        // Ordenar cronológicamente descendente
        usort($eventos, fn($a, $b) => $b['timestamp'] <=> $a['timestamp']);

        return $eventos;
    }

    /**
     * Valida permisos y aplica política Anti-IDOR
     *
     * @param int $idPaciente
     * @param User $usuario
     * @throws HttpException
     */
    protected function validarAcceso(int $idPaciente, User $usuario): void
    {
        $rol = strtoupper($usuario->tipo_usuario ?? $usuario->rol ?? '');

        // 1. Recepcionistas estrictamente denegados para resguardar secreto médico y confidencialidad clínica
        if ($rol === 'RECEPCIONISTA') {
            throw new HttpException(403, 'Acceso restringido: el personal de recepción no está autorizado para consultar expedientes médicos confidenciales.');
        }

        // 2. Pacientes restringidos únicamente a su propio expediente (Anti-IDOR)
        if ($rol === 'PACIENTE') {
            $pacienteVinculado = $usuario->paciente;
            if (!$pacienteVinculado || (int) $pacienteVinculado->id_paciente !== (int) $idPaciente) {
                throw new HttpException(403, 'Acceso denegado: solo puedes consultar tu propio expediente clínico.');
            }
            return;
        }

        // 3. Administradores y Médicos tienen acceso autorizado asistencial
        if (in_array($rol, ['ADMIN', 'ADMINISTRADOR', 'MEDICO'], true)) {
            return;
        }

        throw new HttpException(403, 'Rol de usuario no autorizado para consultar expedientes clínicos.');
    }
}

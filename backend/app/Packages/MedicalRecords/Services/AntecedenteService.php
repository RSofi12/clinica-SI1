<?php

namespace App\Packages\MedicalRecords\Services;

use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\MedicalRecords\Models\Antecedente;
use App\Packages\MedicalRecords\Models\HistoriaClinica;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de Gestión de Antecedentes Médicos (CU17)
 * Paquete 4: Historial Clínico y Consultas
 */
class AntecedenteService
{
    /**
     * Consulta los antecedentes médicos de un paciente con filtros y control de privacidad (RBAC / Anti-IDOR)
     */
    public function obtenerPorPaciente(int $idPaciente, array $filtros, User $usuario): array
    {
        $paciente = Paciente::find($idPaciente);
        if (!$paciente) {
            throw new \Exception('Paciente no encontrado en el sistema.', 404);
        }

        $rol = $usuario->tipo_usuario ?? $usuario->rol;

        // 1. Scoping RBAC / Anti-IDOR para pacientes
        if ($rol === 'PACIENTE') {
            $esTitular = ((int)$paciente->id_usuario === (int)$usuario->id_usuario) ||
                         ($paciente->correo && $paciente->correo === $usuario->email) ||
                         ($paciente->numero_documento && $paciente->numero_documento === $usuario->username);

            if (!$esTitular) {
                throw new \Exception('Acceso denegado: solo puede consultar sus propios antecedentes médicos.', 403);
            }
        }

        // 2. Bloqueo de recepción por secreto médico
        if ($rol === 'RECEPCIONISTA') {
            throw new \Exception('Acceso restringido: el personal de recepción no cuenta con autorización asistencial para consultar antecedentes médicos (confidencialidad clínica).', 403);
        }

        // 3. Obtener Historia Clínica
        $historia = HistoriaClinica::where('id_paciente', $idPaciente)->first();
        if (!$historia) {
            return [
                'paciente' => [
                    'id_paciente' => $paciente->id_paciente,
                    'nombre_completo' => "{$paciente->nombres} {$paciente->apellidos}",
                    'numero_documento' => $paciente->numero_documento,
                    'numero_historia' => $paciente->numero_historia,
                ],
                'total' => 0,
                'tiene_alergias' => false,
                'antecedentes' => [],
            ];
        }

        // 4. Consulta de antecedentes con relaciones y filtros
        $query = Antecedente::where('id_historia_clinica', $historia->id_historia_clinica)
            ->with('registrador:id_usuario,username,nombres,apellidos,rol');

        if (!empty($filtros['tipo'])) {
            $query->porTipo($filtros['tipo']);
        }

        // Por defecto solo activos, a menos que se solicite 'todos'
        $incluirInactivos = filter_var($filtros['incluir_inactivos'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (!$incluirInactivos) {
            $query->activos();
        }

        $antecedentes = $query->orderByRaw("CASE WHEN tipo_antecedente = 'ALERGICO' THEN 1 ELSE 2 END")
            ->orderBy('fecha_registro', 'desc')
            ->get();

        $tieneAlergias = $antecedentes->where('estado', 'ACTIVO')->contains('tipo_antecedente', Antecedente::TIPO_ALERGICO);

        return [
            'paciente' => [
                'id_paciente' => $paciente->id_paciente,
                'nombre_completo' => "{$paciente->nombres} {$paciente->apellidos}",
                'numero_documento' => $paciente->numero_documento,
                'numero_historia' => $paciente->numero_historia,
            ],
            'total' => $antecedentes->count(),
            'tiene_alergias' => $tieneAlergias,
            'antecedentes' => $antecedentes,
        ];
    }

    /**
     * Registra un nuevo antecedente clínico con resiliencia de historia clínica y validación anti-duplicados
     */
    public function registrar(int $idPaciente, array $datos, User $usuario, ?string $ip = null): Antecedente
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if (!in_array($rol, ['ADMIN', 'MEDICO'], true)) {
            throw new \Exception('No tiene autorización asistencial para registrar antecedentes médicos en el sistema.', 403);
        }

        $paciente = Paciente::find($idPaciente);
        if (!$paciente) {
            throw new \Exception('Paciente no encontrado en el sistema.', 404);
        }

        return DB::transaction(function () use ($paciente, $datos, $usuario, $ip) {
            // 1. Resiliencia de Historia Clínica: crear si aún no existe
            $historia = HistoriaClinica::firstOrCreate(
                ['id_paciente' => $paciente->id_paciente],
                ['fecha_apertura' => now(), 'estado' => 'ACTIVO']
            );

            $tipo = strtoupper(trim($datos['tipo_antecedente']));
            $descripcion = trim($datos['descripcion']);

            // 2. Validación de duplicados activos idénticos
            $duplicado = Antecedente::where('id_historia_clinica', $historia->id_historia_clinica)
                ->where('tipo_antecedente', $tipo)
                ->where('estado', Antecedente::ESTADO_ACTIVO)
                ->whereRaw('LOWER(TRIM(descripcion)) = ?', [strtolower($descripcion)])
                ->exists();

            if ($duplicado) {
                throw new \Exception("Ya existe un antecedente activo idéntico para este paciente bajo la categoría {$tipo}.", 422);
            }

            // 3. Crear el antecedente
            $antecedente = Antecedente::create([
                'id_historia_clinica' => $historia->id_historia_clinica,
                'tipo_antecedente' => $tipo,
                'descripcion' => $descripcion,
                'registrado_por' => $usuario->id_usuario,
                'fecha_registro' => now(),
                'estado' => Antecedente::ESTADO_ACTIVO,
            ]);

            // 4. Auditoría inmutable en bitácora (CU03)
            Bitacora::registrar([
                'id_usuario'     => $usuario->id_usuario,
                'modulo'         => 'HISTORIAL_CLINICO',
                'accion'         => 'CREAR_ANTECEDENTE',
                'tabla_afectada' => 'antecedentes',
                'id_registro'    => $antecedente->id_antecedente,
                'descripcion'    => "Registro de antecedente [{$tipo}] para {$paciente->nombres} {$paciente->apellidos}: {$descripcion}",
                'ip_origen'      => $ip,
            ]);

            return $antecedente->load('registrador:id_usuario,username,nombres,apellidos,rol');
        });
    }

    /**
     * Actualiza un antecedente médico existente
     */
    public function actualizar(int $idAntecedente, array $datos, User $usuario, ?string $ip = null): Antecedente
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if (!in_array($rol, ['ADMIN', 'MEDICO'], true)) {
            throw new \Exception('No tiene autorización asistencial para modificar antecedentes médicos.', 403);
        }

        $antecedente = Antecedente::find($idAntecedente);
        if (!$antecedente) {
            throw new \Exception('Antecedente médico no encontrado.', 404);
        }

        $camposActualizados = [];
        if (!empty($datos['tipo_antecedente'])) {
            $antecedente->tipo_antecedente = strtoupper(trim($datos['tipo_antecedente']));
            $camposActualizados[] = "tipo: {$antecedente->tipo_antecedente}";
        }
        if (!empty($datos['descripcion'])) {
            $antecedente->descripcion = trim($datos['descripcion']);
            $camposActualizados[] = "descripción modificada";
        }
        if (!empty($datos['estado'])) {
            $antecedente->estado = $datos['estado'];
            $camposActualizados[] = "estado: {$antecedente->estado}";
        }

        $antecedente->save();

        Bitacora::registrar([
            'id_usuario'     => $usuario->id_usuario,
            'modulo'         => 'HISTORIAL_CLINICO',
            'accion'         => 'ACTUALIZAR_ANTECEDENTE',
            'tabla_afectada' => 'antecedentes',
            'id_registro'    => $antecedente->id_antecedente,
            'descripcion'    => "Actualización de antecedente #{$antecedente->id_antecedente} (" . implode(', ', $camposActualizados) . ")",
            'ip_origen'      => $ip,
        ]);

        return $antecedente->fresh(['registrador:id_usuario,username,nombres,apellidos,rol']);
    }

    /**
     * Alterna el estado del antecedente aplicando Baja Lógica (RN11)
     */
    public function toggleStatus(int $idAntecedente, User $usuario, ?string $ip = null): Antecedente
    {
        $rol = $usuario->tipo_usuario ?? $usuario->rol;
        if (!in_array($rol, ['ADMIN', 'MEDICO'], true)) {
            throw new \Exception('No tiene autorización asistencial para modificar el estado del antecedente.', 403);
        }

        $antecedente = Antecedente::find($idAntecedente);
        if (!$antecedente) {
            throw new \Exception('Antecedente médico no encontrado.', 404);
        }

        $nuevoEstado = $antecedente->estado === Antecedente::ESTADO_ACTIVO
            ? Antecedente::ESTADO_INACTIVO
            : Antecedente::ESTADO_ACTIVO;

        $antecedente->estado = $nuevoEstado;
        $antecedente->save();

        Bitacora::registrar([
            'id_usuario'     => $usuario->id_usuario,
            'modulo'         => 'HISTORIAL_CLINICO',
            'accion'         => 'BAJA_LOGICA_ANTECEDENTE',
            'tabla_afectada' => 'antecedentes',
            'id_registro'    => $antecedente->id_antecedente,
            'descripcion'    => "Cambio de estado (RN11) del antecedente #{$antecedente->id_antecedente} a '{$nuevoEstado}'",
            'ip_origen'      => $ip,
        ]);

        return $antecedente->fresh(['registrador:id_usuario,username,nombres,apellidos,rol']);
    }
}

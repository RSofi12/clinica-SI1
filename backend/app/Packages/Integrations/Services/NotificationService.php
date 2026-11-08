<?php

namespace App\Packages\Integrations\Services;

use App\Packages\Appointments\Models\Cita;
use App\Packages\ClinicalResources\Models\Paciente;
use App\Packages\ClinicalResources\Models\Medico;
use App\Packages\Integrations\Models\Notificacion;
use App\Packages\Integrations\Models\Pago;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Servicio Central de Notificaciones y Recordatorios de Citas (CU20 / RF06, RF08, RF09)
 * Metodología PUDS / RUP — Clínica Vida Salud / Centro Médico La Cruz
 * Paquete 5: Integraciones Externas y Pagos
 */
class NotificationService
{
    /**
     * Resuelve el ID de usuario vinculado a un paciente (para notificaciones en el portal)
     */
    protected function resolverUsuarioPaciente(Paciente $paciente): ?int
    {
        if ($paciente->id_usuario) {
            return (int) $paciente->id_usuario;
        }

        // Búsqueda por correo o número de documento
        $user = User::where('email', $paciente->correo)
            ->orWhere('username', $paciente->numero_documento)
            ->first();

        return $user ? (int) $user->id_usuario : null;
    }

    /**
     * Resuelve el ID de usuario vinculado a un médico
     */
    protected function resolverUsuarioMedico(Medico $medico): ?int
    {
        if ($medico->id_usuario) {
            return (int) $medico->id_usuario;
        }

        $user = User::where('email', $medico->correo_profesional)
            ->orWhere('username', $medico->codigo_profesional)
            ->first();

        return $user ? (int) $user->id_usuario : null;
    }

    /**
     * Crea un registro de notificación individual en base de datos
     */
    public function crearNotificacion(
        int $idUsuario,
        string $tipo,
        string $titulo,
        string $mensaje,
        ?int $idCita = null,
        string $canal = Notificacion::CANAL_EMAIL
    ): Notificacion {
        return Notificacion::create([
            'id_usuario'  => $idUsuario,
            'id_cita'     => $idCita,
            'tipo'        => $tipo,
            'canal'       => $canal,
            'titulo'      => $titulo,
            'mensaje'     => $mensaje,
            'leida'       => false,
            'fecha_envio' => Carbon::now(),
        ]);
    }

    /**
     * Dispara notificación ante la reserva inicial de una cita médica (CU10 / RF06)
     */
    public function notificarCitaCreada(Cita $cita): array
    {
        $enviadas = [];
        $cita->loadMissing(['paciente', 'medico', 'especialidad']);

        $paciente = $cita->paciente;
        $medico = $cita->medico;
        $especialidad = $cita->especialidad;

        $fechaStr = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('d/m/Y') : 'Fecha pendiente';
        $horaStr = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('H:i') : '--:--';

        // 1. Notificar al paciente (si tiene cuenta de usuario activa o vinculada)
        if ($paciente) {
            $idUsuarioPaciente = $this->resolverUsuarioPaciente($paciente);
            if ($idUsuarioPaciente) {
                $enviadas[] = $this->crearNotificacion(
                    $idUsuarioPaciente,
                    Notificacion::TIPO_CONFIRMACION,
                    "Cita Médica Reservada ({$cita->codigo_cita})",
                    "Estimado(a) {$paciente->nombre_completo}: Su cita para {$especialidad?->nombre} con el Dr.(a) {$medico?->nombre_completo} ha sido agendada con éxito para el {$fechaStr} a las {$horaStr}. Por favor acudir 10 minutos antes.",
                    $cita->id_cita,
                    Notificacion::CANAL_IN_APP
                );
            }
        }

        // 2. Notificar al médico sobre la nueva cita en su agenda
        if ($medico) {
            $idUsuarioMedico = $this->resolverUsuarioMedico($medico);
            if ($idUsuarioMedico) {
                $enviadas[] = $this->crearNotificacion(
                    $idUsuarioMedico,
                    Notificacion::TIPO_CONFIRMACION,
                    "Nueva Cita en su Agenda ({$cita->codigo_cita})",
                    "Se ha agendado una cita con el paciente {$paciente?->nombre_completo} para el {$fechaStr} a las {$horaStr} ({$especialidad?->nombre}). Motivo: " . ($cita->motivo_consulta ?: 'Consulta general'),
                    $cita->id_cita,
                    Notificacion::CANAL_IN_APP
                );
            }
        }

        return $enviadas;
    }

    /**
     * Dispara notificación de reprogramación de cita médica (CU11 / RF08)
     */
    public function notificarCitaReprogramada(Cita $cita, string $motivo): array
    {
        $enviadas = [];
        $cita->loadMissing(['paciente', 'medico', 'especialidad']);

        $paciente = $cita->paciente;
        $medico = $cita->medico;
        $especialidad = $cita->especialidad;

        $nuevaFecha = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('d/m/Y') : 'Nueva fecha';
        $nuevaHora = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('H:i') : '--:--';

        // 1. Notificar al paciente
        if ($paciente) {
            $idUsuarioPaciente = $this->resolverUsuarioPaciente($paciente);
            if ($idUsuarioPaciente) {
                $enviadas[] = $this->crearNotificacion(
                    $idUsuarioPaciente,
                    Notificacion::TIPO_REPROGRAMACION,
                    "Cita Médica Reprogramada ({$cita->codigo_cita})",
                    "Su cita médica para {$especialidad?->nombre} ha sido reprogramada para el {$nuevaFecha} a las {$nuevaHora} con Dr.(a) {$medico?->nombre_completo}. Motivo: {$motivo}.",
                    $cita->id_cita,
                    Notificacion::CANAL_IN_APP
                );
            }
        }

        // 2. Notificar al médico
        if ($medico) {
            $idUsuarioMedico = $this->resolverUsuarioMedico($medico);
            if ($idUsuarioMedico) {
                $enviadas[] = $this->crearNotificacion(
                    $idUsuarioMedico,
                    Notificacion::TIPO_REPROGRAMACION,
                    "Cita Reprogramada en su Agenda ({$cita->codigo_cita})",
                    "La cita del paciente {$paciente?->nombre_completo} ha sido reprogramada al {$nuevaFecha} a las {$nuevaHora}. Motivo: {$motivo}.",
                    $cita->id_cita,
                    Notificacion::CANAL_IN_APP
                );
            }
        }

        return $enviadas;
    }

    /**
     * Dispara notificación de cancelación de cita médica (CU12 / RF09)
     */
    public function notificarCitaCancelada(Cita $cita, string $motivo, ?User $actor = null): array
    {
        $enviadas = [];
        $cita->loadMissing(['paciente', 'medico', 'especialidad']);

        $paciente = $cita->paciente;
        $medico = $cita->medico;
        $especialidad = $cita->especialidad;

        $fechaStr = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('d/m/Y H:i') : '';

        // 1. Notificar al paciente
        if ($paciente) {
            $idUsuarioPaciente = $this->resolverUsuarioPaciente($paciente);
            if ($idUsuarioPaciente) {
                $enviadas[] = $this->crearNotificacion(
                    $idUsuarioPaciente,
                    Notificacion::TIPO_CANCELACION,
                    "Cita Médica Cancelada ({$cita->codigo_cita})",
                    "Su cita médica con Dr.(a) {$medico?->nombre_completo} para el {$fechaStr} ha sido cancelada. Motivo registrado: {$motivo}. El cupo horario ha sido liberado.",
                    $cita->id_cita,
                    Notificacion::CANAL_IN_APP
                );
            }
        }

        // 2. Notificar al médico
        if ($medico) {
            $idUsuarioMedico = $this->resolverUsuarioMedico($medico);
            if ($idUsuarioMedico) {
                $enviadas[] = $this->crearNotificacion(
                    $idUsuarioMedico,
                    Notificacion::TIPO_CANCELACION,
                    "Cita Cancelada en su Agenda ({$cita->codigo_cita})",
                    "La cita del paciente {$paciente?->nombre_completo} para el {$fechaStr} ha sido cancelada. Motivo: {$motivo}. Su horario ha quedado disponible.",
                    $cita->id_cita,
                    Notificacion::CANAL_IN_APP
                );
            }
        }

        return $enviadas;
    }

    /**
     * Dispara notificación tras completar exitosamente un pago con Stripe (CU21)
     */
    public function notificarPagoCompletado(Pago $pago): ?Notificacion
    {
        $pago->loadMissing(['cita.paciente', 'cita.medico', 'cita.especialidad']);
        $cita = $pago->cita;
        if (!$cita || !$cita->paciente) {
            return null;
        }

        $idUsuario = $this->resolverUsuarioPaciente($cita->paciente);
        if (!$idUsuario) {
            return null;
        }

        $montoStr = number_format((float) $pago->monto, 2);
        $moneda = $pago->moneda ?? 'USD';

        return $this->crearNotificacion(
            $idUsuario,
            Notificacion::TIPO_PAGO_EXITOSO,
            "Comprobante de Pago Confirmado ({$cita->codigo_cita})",
            "Hemos registrado satisfactoriamente el pago de \${$montoStr} {$moneda} para su cita {$cita->codigo_cita} con Dr.(a) {$cita->medico?->nombre_completo} ({$cita->especialidad?->nombre}). Su atención se encuentra garantizada.",
            $cita->id_cita,
            Notificacion::CANAL_IN_APP
        );
    }

    /**
     * Cron Job / Planificador: Dispara recordatorios 24 horas antes de cada cita médica (CU20)
     * Revisa citas en estado PROGRAMADA o CONFIRMADA en la ventana de las próximas 24 a 48 horas
     * Aplica idempotencia para no duplicar recordatorios ya despachados.
     *
     * @param bool $forzar Si es true, ignora si ya fue recordada (útil para pruebas de demostración)
     * @param int|null $idCitaEspecifica Para pruebas dirigidas de una cita en particular
     * @return array Resumen de la ejecución
     */
    public function ejecutarRecordatorios24h(bool $forzar = false, ?int $idCitaEspecifica = null): array
    {
        $inicioVentana = Carbon::now();
        $finVentana = Carbon::now()->addHours(48); // Ventana de 24 a 48 horas hacia adelante

        $query = Cita::with(['paciente', 'medico', 'especialidad'])
            ->whereIn('estado', [Cita::ESTADO_PROGRAMADA, Cita::ESTADO_CONFIRMADA]);

        if ($idCitaEspecifica) {
            $query->where('id_cita', $idCitaEspecifica);
        } else {
            // Citas programadas entre hoy y pasadomañana (ventana preventiva de 24h)
            $query->whereBetween('fecha_hora_inicio', [$inicioVentana, $finVentana]);
        }

        $citas = $query->orderBy('fecha_hora_inicio', 'asc')->get();

        $enviados = 0;
        $omitidos = 0;
        $detalles = [];

        foreach ($citas as $cita) {
            // Idempotencia: Verificar si ya existe recordatorio para esta cita
            $yaRecordada = Notificacion::where('id_cita', $cita->id_cita)
                ->where('tipo', Notificacion::TIPO_RECORDATORIO_24H)
                ->exists();

            if ($yaRecordada && !$forzar) {
                $omitidos++;
                continue;
            }

            $paciente = $cita->paciente;
            $medico = $cita->medico;
            $especialidad = $cita->especialidad;

            $fechaStr = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('d/m/Y') : '';
            $horaStr = $cita->fecha_hora_inicio ? $cita->fecha_hora_inicio->format('H:i') : '';

            $titulo = "Recordatorio de Cita Médica (24h) — {$cita->codigo_cita}";
            $mensaje = "Estimado(a) {$paciente?->nombre_completo}: Le recordamos su cita médica programada para el {$fechaStr} a las {$horaStr} con el Dr.(a) {$medico?->nombre_completo} ({$especialidad?->nombre}). Por favor presentarse 15 minutos antes con su cédula de identidad en la sede central.";

            $destinatarios = 0;

            // Enviar al paciente (si tiene usuario)
            if ($paciente) {
                $idUsuarioPaciente = $this->resolverUsuarioPaciente($paciente);
                if ($idUsuarioPaciente) {
                    $this->crearNotificacion(
                        $idUsuarioPaciente,
                        Notificacion::TIPO_RECORDATORIO_24H,
                        $titulo,
                        $mensaje,
                        $cita->id_cita,
                        Notificacion::CANAL_EMAIL
                    );
                    $destinatarios++;
                }
            }

            // Enviar al médico asignado
            if ($medico) {
                $idUsuarioMedico = $this->resolverUsuarioMedico($medico);
                if ($idUsuarioMedico) {
                    $this->crearNotificacion(
                        $idUsuarioMedico,
                        Notificacion::TIPO_RECORDATORIO_24H,
                        "Recordatorio de Agenda (24h) — {$cita->codigo_cita}",
                        "Recordatorio: Cita programada con {$paciente?->nombre_completo} el {$fechaStr} a las {$horaStr} ({$especialidad?->nombre}).",
                        $cita->id_cita,
                        Notificacion::CANAL_IN_APP
                    );
                    $destinatarios++;
                }
            }

            if ($destinatarios > 0) {
                $enviados++;
                $detalles[] = [
                    'id_cita'     => $cita->id_cita,
                    'codigo_cita' => $cita->codigo_cita,
                    'paciente'    => $paciente?->nombre_completo,
                    'medico'      => $medico?->nombre_completo,
                    'fecha_hora'  => "{$fechaStr} {$horaStr}",
                    'notificados' => $destinatarios,
                ];
            }
        }

        // Registrar en bitácora inmutable (CU03)
        $adminUser = User::where('tipo_usuario', 'ADMIN')->first();
        Bitacora::registrar(
            $adminUser ? $adminUser->id_usuario : 1,
            'NOTIFICACIONES',
            'RECORDATORIOS_24H_ENVIADOS',
            'notificaciones',
            null,
            "Se ejecutó el planificador de recordatorios 24h: {$enviados} citas notificadas, {$omitidos} omitidas por idempotencia.",
            '127.0.0.1'
        );

        return [
            'total_evaluadas'       => $citas->count(),
            'recordatorios_enviados'=> $enviados,
            'omitidos_idempotencia' => $omitidos,
            'detalles'              => $detalles,
            'fecha_ejecucion'       => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Consulta el listado paginado y métricas de notificaciones para el usuario en sesión
     */
    public function listarNotificaciones(User $user, array $filtros = []): array
    {
        $tipoUsuario = $user->tipo_usuario ?? $user->rol;
        $query = Notificacion::with(['cita.paciente', 'cita.medico', 'cita.especialidad']);

        // Control de Acceso: El usuario solo ve sus propias notificaciones
        // Si es ADMIN y pide ver 'todas', se le permite; por defecto ve las suyas
        $modoAdmin = ($tipoUsuario === 'ADMIN') && (($filtros['alcance'] ?? 'mias') === 'todas');

        if (!$modoAdmin) {
            $query->where('id_usuario', $user->id_usuario);
        }

        // Filtro por solo no leídas
        if (!empty($filtros['no_leidas']) && filter_var($filtros['no_leidas'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('leida', false);
        }

        // Filtro por tipo de notificación
        if (!empty($filtros['tipo'])) {
            $query->where('tipo', $filtros['tipo']);
        }

        // Total no leídas para el badge del usuario
        $unreadCount = Notificacion::where('id_usuario', $user->id_usuario)
            ->where('leida', false)
            ->count();

        // Conteo por tipo
        $conteoPorTipo = Notificacion::where('id_usuario', $user->id_usuario)
            ->select('tipo', DB::raw('count(*) as total'))
            ->groupBy('tipo')
            ->pluck('total', 'tipo')
            ->toArray();

        $limit = isset($filtros['limit']) ? min((int) $filtros['limit'], 50) : 15;
        $notificaciones = $query->orderBy('fecha_envio', 'desc')
            ->orderBy('id_notificacion', 'desc')
            ->paginate($limit);

        return [
            'unread_count'    => $unreadCount,
            'conteo_por_tipo' => $conteoPorTipo,
            'notificaciones'  => $notificaciones,
        ];
    }

    /**
     * Marca una notificación como leída con validación Anti-IDOR
     */
    public function marcarComoLeida(int $idNotificacion, User $user): Notificacion
    {
        $notificacion = Notificacion::findOrFail($idNotificacion);

        // Anti-IDOR: solo el propietario o un ADMIN pueden mutar la notificación
        $esAdmin = ($user->tipo_usuario ?? $user->rol) === 'ADMIN';
        if ((int) $notificacion->id_usuario !== (int) $user->id_usuario && !$esAdmin) {
            throw new Exception('Acceso no autorizado: No puede modificar notificaciones de otro usuario.', 403);
        }

        $notificacion->marcarComoLeida();

        return $notificacion;
    }

    /**
     * Marca todas las notificaciones pendientes del usuario como leídas
     */
    public function marcarTodasComoLeidas(User $user): int
    {
        return Notificacion::where('id_usuario', $user->id_usuario)
            ->where('leida', false)
            ->update(['leida' => true, 'updated_at' => Carbon::now()]);
    }

    /**
     * Elimina una notificación con verificación Anti-IDOR
     */
    public function eliminarNotificacion(int $idNotificacion, User $user): bool
    {
        $notificacion = Notificacion::findOrFail($idNotificacion);

        $esAdmin = ($user->tipo_usuario ?? $user->rol) === 'ADMIN';
        if ((int) $notificacion->id_usuario !== (int) $user->id_usuario && !$esAdmin) {
            throw new Exception('Acceso no autorizado: No puede eliminar notificaciones de otro usuario.', 403);
        }

        return (bool) $notificacion->delete();
    }
}

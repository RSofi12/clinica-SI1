<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Packages\Integrations\Services\NotificationService;

/**
 * Comando de Consola para Recordatorios de Citas Médicas 24h (CU20)
 * Metodología PUDS / RUP — Clínica Vida Salud
 *
 * Uso:
 *   php artisan appointments:send-reminders
 *   php artisan appointments:send-reminders --force
 *   php artisan appointments:send-reminders --cita=12
 */
class SendAppointmentRemindersCommand extends Command
{
    /**
     * El nombre y la firma del comando en consola.
     */
    protected $signature = 'appointments:send-reminders 
                            {--force : Enviar recordatorio forzado ignorando si ya fue notificado}
                            {--cita= : ID específico de la cita médica a evaluar}';

    /**
     * Descripción del comando para `php artisan list`.
     */
    protected $description = 'Dispara los recordatorios automáticos de citas médicas 24 horas antes a pacientes y médicos (CU20)';

    /**
     * Ejecuta el comando de consola.
     */
    public function handle(NotificationService $service): int
    {
        $this->info('===========================================================');
        $this->info('  CENTRO MÉDICO LA CRUZ — RECORDATORIOS DE CITAS 24H (CU20)');
        $this->info('===========================================================');

        $force = (bool) $this->option('force');
        $citaId = $this->option('cita') ? (int) $this->option('cita') : null;

        if ($force) {
            $this->warn('Modo --force activado: Se emitirán recordatorios ignorando la regla de idempotencia.');
        }

        if ($citaId) {
            $this->comment("Evaluando únicamente la cita específica ID #{$citaId}...");
        }

        $resultado = $service->ejecutarRecordatorios24h($force, $citaId);

        $this->line('');
        $this->info("Citas evaluadas en ventana preventiva: {$resultado['total_evaluadas']}");
        $this->info("Recordatorios generados y enviados:   {$resultado['recordatorios_enviados']}");
        $this->comment("Omitidas por idempotencia:            {$resultado['omitidos_idempotencia']}");

        if (!empty($resultado['detalles'])) {
            $this->line('');
            $this->table(
                ['Código Cita', 'Paciente', 'Médico', 'Fecha y Hora', 'Destinatarios'],
                array_map(function ($d) {
                    return [
                        $d['codigo_cita'],
                        $d['paciente'] ?? 'N/A',
                        $d['medico'] ?? 'N/A',
                        $d['fecha_hora'],
                        $d['notificados'],
                    ];
                }, $resultado['detalles'])
            );
        }

        $this->line('');
        $this->info('Proceso de recordatorios CU20 finalizado exitosamente.');

        return Command::SUCCESS;
    }
}

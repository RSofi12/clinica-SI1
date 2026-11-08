<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * CU20: Planificador de Recordatorios de Citas Médicas 24 Horas Antes
 * Actor Secundario: Sistema (Planificador / Cron)
 * Frecuencia: Diario a las 08:00 AM
 */
Schedule::command('appointments:send-reminders')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->runInBackground();

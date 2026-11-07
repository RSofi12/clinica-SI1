<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 5: Integraciones Externas y Pagos (CU20, CU21)
     */
    public function up(): void
    {
        // 1. pagos (CU21)
        Schema::create('pagos', function (Blueprint $table) {
            $table->id('id_pago');
            $table->foreignId('id_cita')->constrained('citas', 'id_cita')->onDelete('restrict');
            $table->foreignId('id_paciente')->constrained('pacientes', 'id_paciente')->onDelete('restrict');
            $table->decimal('monto', 10, 2);
            $table->string('metodo_pago', 50)->default('STRIPE');
            $table->string('stripe_payment_intent_id', 150)->nullable()->unique();
            $table->string('estado', 20)->default('PENDIENTE'); // PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO
            $table->timestampTz('fecha_pago')->useCurrent();
            $table->timestamps();
        });

        // 2. notificaciones (CU20)
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id('id_notificacion');
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->foreignId('id_cita')->nullable()->constrained('citas', 'id_cita')->onDelete('set null');
            $table->string('tipo', 50); // RECORDATORIO_24H, CONFIRMACION, CANCELACION, REPROGRAMACION
            $table->string('canal', 20)->default('EMAIL'); // EMAIL, PUSH, SMS
            $table->string('titulo', 150);
            $table->text('mensaje');
            $table->boolean('leida')->default(false);
            $table->timestampTz('fecha_envio')->useCurrent();
            $table->timestamps();
        });

        // 3. push_suscripciones (CU20)
        Schema::create('push_suscripciones', function (Blueprint $table) {
            $table->id('id_suscripcion');
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->text('endpoint');
            $table->text('p256dh_key');
            $table->text('auth_token');
            $table->timestampTz('fecha_registro')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_suscripciones');
        Schema::dropIfExists('notificaciones');
        Schema::dropIfExists('pagos');
    }
};

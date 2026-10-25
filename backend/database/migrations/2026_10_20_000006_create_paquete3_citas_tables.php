<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 3: Gestión de Citas Médicas (CU09, CU10, CU12, CU14, CU15 / RF06, RF07, RF09, RF11, RF12)
     */
    public function up(): void
    {
        // 1. Catálogo de Tipos de Cita
        Schema::create('tipos_cita', function (Blueprint $table) {
            $table->id('id_tipo_cita');
            $table->string('nombre', 50)->unique(); // 'PRIMERA CONSULTA', 'CONTROL', 'RECONSULTA'
            $table->timestamps();
        });

        // 2. Tabla Principal de Citas Médicas
        Schema::create('citas', function (Blueprint $table) {
            $table->id('id_cita');
            $table->string('codigo_cita', 30)->unique(); // ej: 'CM-0001' (RF06)
            $table->unsignedBigInteger('id_paciente');
            $table->unsignedBigInteger('id_medico');
            $table->unsignedBigInteger('id_especialidad');
            $table->unsignedBigInteger('id_tipo_cita');
            $table->unsignedBigInteger('id_cita_origen')->nullable(); // Para reprogramaciones (CU11)
            $table->timestampTz('fecha_hora_inicio');
            $table->timestampTz('fecha_hora_fin');
            $table->integer('duracion_minutos')->default(30);
            $table->string('estado', 30)->default('PROGRAMADA'); // PROGRAMADA, CONFIRMADA, EN_CONSULTA, ATENDIDA, CANCELADA, NO_ASISTIO
            $table->string('modalidad', 30)->default('PRESENCIAL'); // PRESENCIAL, TELEMEDICINA
            $table->string('motivo_consulta', 255)->nullable();
            $table->text('motivo_cancelacion')->nullable(); // Obligatorio si estado = 'CANCELADA' (RF09)
            $table->timestampTz('cancelada_en')->nullable();
            $table->unsignedBigInteger('creada_por');
            $table->timestamps();

            // Relaciones con protección de historial médico (RN10 / RN11: ON DELETE RESTRICT)
            $table->foreign('id_paciente')
                ->references('id_paciente')
                ->on('pacientes')
                ->restrictOnDelete();

            $table->foreign('id_medico')
                ->references('id_medico')
                ->on('medicos')
                ->restrictOnDelete();

            $table->foreign('id_especialidad')
                ->references('id_especialidad')
                ->on('especialidades')
                ->restrictOnDelete();

            $table->foreign('id_tipo_cita')
                ->references('id_tipo_cita')
                ->on('tipos_cita')
                ->restrictOnDelete();

            $table->foreign('id_cita_origen')
                ->references('id_cita')
                ->on('citas')
                ->nullOnDelete();

            $table->foreign('creada_por')
                ->references('id_usuario')
                ->on('usuarios')
                ->restrictOnDelete();

            // Índices de optimización para búsquedas de agenda y disponibilidad
            $table->index(['id_medico', 'fecha_hora_inicio'], 'idx_citas_medico_fecha');
            $table->index(['id_paciente', 'fecha_hora_inicio'], 'idx_citas_paciente_fecha');
            $table->index('estado', 'idx_citas_estado');
        });

        // 3. Historial de Transición de Estados de la Cita (Trazabilidad RUP/PUDS)
        Schema::create('cita_estado_historial', function (Blueprint $table) {
            $table->id('id_historial');
            $table->unsignedBigInteger('id_cita');
            $table->string('estado_anterior', 30)->nullable();
            $table->string('estado_nuevo', 30);
            $table->unsignedBigInteger('id_usuario');
            $table->text('observacion')->nullable();
            $table->timestampTz('fecha_cambio')->useCurrent();

            $table->foreign('id_cita')
                ->references('id_cita')
                ->on('citas')
                ->cascadeOnDelete();

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cita_estado_historial');
        Schema::dropIfExists('citas');
        Schema::dropIfExists('tipos_cita');
    }
};

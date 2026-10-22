<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 2: Recursos Clínicos - Horarios de Atención y Bloqueos (CU08 / RF05)
     */
    public function up(): void
    {
        // 1. Tabla de Disponibilidades / Franjas Horarias Semanales por Médico
        Schema::create('disponibilidades', function (Blueprint $table) {
            $table->id('id_disponibilidad');
            $table->unsignedBigInteger('id_medico');
            $table->unsignedTinyInteger('dia_semana'); // 1: Lunes .. 7: Domingo (según DDL)
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->integer('duracion_cita_minutos')->default(30);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('id_medico')
                ->references('id_medico')
                ->on('medicos')
                ->cascadeOnDelete();
        });

        // 2. Tabla de Bloqueos de Horario (Feriados Institucionales y Licencias Médicas)
        Schema::create('bloqueos_horario', function (Blueprint $table) {
            $table->id('id_bloqueo');
            $table->unsignedBigInteger('id_medico')->nullable(); // NULL = feriado general de la clínica
            $table->date('fecha');
            $table->time('hora_inicio')->nullable(); // NULL = día completo
            $table->time('hora_fin')->nullable();
            $table->string('motivo', 255);
            $table->timestamps();

            $table->foreign('id_medico')
                ->references('id_medico')
                ->on('medicos')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bloqueos_horario');
        Schema::dropIfExists('disponibilidades');
    }
};

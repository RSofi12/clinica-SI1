<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 2: Recursos Clínicos - Especialidades y Médicos (CU06 / RF03, CU07 / RF04)
     */
    public function up(): void
    {
        // 1. Tabla de Especialidades Médicas (CU07 / RF04)
        Schema::create('especialidades', function (Blueprint $table) {
            $table->id('id_especialidad');
            $table->string('nombre', 100);
            $table->string('nombre_normalizado', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->integer('edad_min_anios')->nullable();
            $table->integer('edad_max_anios')->nullable();
            $table->decimal('precio_consulta', 10, 2)->default(0.00);
            $table->string('estado', 20)->default('ACTIVO'); // ACTIVO, INACTIVO
            $table->timestamps();
        });

        // 2. Tabla de Médicos (CU06 / RF03 - Actor Médico Unificado)
        Schema::create('medicos', function (Blueprint $table) {
            $table->id('id_medico');
            $table->unsignedBigInteger('id_usuario')->nullable()->unique();
            $table->string('codigo_profesional', 50)->unique(); // Matrícula profesional médica única
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('telefono_contacto', 30)->nullable();
            $table->string('correo_profesional', 120)->nullable();
            $table->boolean('estado_activo')->default(true); // Baja lógica (RN04, RN11)
            $table->timestamps();

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->nullOnDelete();
        });

        // 3. Tabla Intermedia: Médico - Especialidad (N:M con especialidad principal)
        Schema::create('medico_especialidad', function (Blueprint $table) {
            $table->unsignedBigInteger('id_medico');
            $table->unsignedBigInteger('id_especialidad');
            $table->boolean('es_principal')->default(false);

            $table->primary(['id_medico', 'id_especialidad']);

            $table->foreign('id_medico')
                ->references('id_medico')
                ->on('medicos')
                ->cascadeOnDelete();

            $table->foreign('id_especialidad')
                ->references('id_especialidad')
                ->on('especialidades')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medico_especialidad');
        Schema::dropIfExists('medicos');
        Schema::dropIfExists('especialidades');
    }
};

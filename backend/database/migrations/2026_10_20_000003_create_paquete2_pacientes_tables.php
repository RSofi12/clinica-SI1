<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 2: Recursos Clínicos - Pacientes y Contactos de Emergencia (CU04 / RF02)
     */
    public function up(): void
    {
        Schema::create('pacientes', function (Blueprint $table) {
            $table->id('id_paciente');
            $table->unsignedBigInteger('id_usuario')->nullable()->unique();
            $table->string('numero_historia', 50)->unique();
            $table->string('numero_documento', 30)->unique(); // CI único obligatorio (RF02)
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->date('fecha_nacimiento');
            $table->string('sexo', 20); // MASCULINO, FEMENINO
            $table->string('tipo_sangre', 10)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('correo', 120)->nullable();
            $table->text('direccion')->nullable();
            $table->boolean('notificaciones_activas')->default(true);
            $table->string('estado_paciente', 20)->default('ACTIVO'); // ACTIVO, INACTIVO (RN11)
            $table->timestampTz('fecha_registro')->useCurrent();

            $table->foreign('id_usuario')
                ->references('id_usuario')
                ->on('usuarios')
                ->nullOnDelete();
        });

        Schema::create('contactos_emergencia', function (Blueprint $table) {
            $table->id('id_contacto');
            $table->unsignedBigInteger('id_paciente');
            $table->string('nombre', 150);
            $table->string('parentesco', 50);
            $table->string('telefono', 30);

            $table->foreign('id_paciente')
                ->references('id_paciente')
                ->on('pacientes')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contactos_emergencia');
        Schema::dropIfExists('pacientes');
    }
};

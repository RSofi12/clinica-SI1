<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 4: Historial Clínico y Consultas (CU16, CU17, CU18, CU19, CU25, CU26 y reservas)
     */
    public function up(): void
    {
        // 1. historias_clinicas
        Schema::create('historias_clinicas', function (Blueprint $table) {
            $table->id('id_historia_clinica');
            $table->foreignId('id_paciente')->unique()->constrained('pacientes', 'id_paciente')->onDelete('restrict');
            $table->date('fecha_apertura')->useCurrent();
            $table->string('estado', 20)->default('ACTIVO'); // ACTIVO, ARCHIVADO
            $table->timestamps();
        });

        // 2. consultas_medicas
        Schema::create('consultas_medicas', function (Blueprint $table) {
            $table->id('id_consulta');
            $table->foreignId('id_cita')->unique()->constrained('citas', 'id_cita')->onDelete('restrict');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onDelete('restrict');
            $table->text('motivo_consulta');
            $table->decimal('peso_kg', 5, 2)->nullable();
            $table->decimal('talla_cm', 5, 2)->nullable();
            $table->decimal('temperatura_c', 4, 1)->nullable();
            $table->string('presion_arterial', 20)->nullable();
            $table->smallInteger('frecuencia_cardiaca')->nullable();
            $table->text('observaciones')->nullable();
            $table->text('plan_tratamiento');
            $table->timestampTz('fecha_consulta')->useCurrent();
            $table->timestamps();
        });

        // 3. antecedentes
        Schema::create('antecedentes', function (Blueprint $table) {
            $table->id('id_antecedente');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->string('tipo_antecedente', 50); // PATOLOGICO, QUIRURGICO, ALERGICO, FAMILIAR, FARMACOLOGICO
            $table->text('descripcion');
            $table->foreignId('registrado_por')->constrained('usuarios', 'id_usuario')->onDelete('restrict');
            $table->timestampTz('fecha_registro')->useCurrent();
            $table->string('estado', 20)->default('ACTIVO');
            $table->timestamps();
        });

        // 4. diagnosticos
        Schema::create('diagnosticos', function (Blueprint $table) {
            $table->id('id_diagnostico');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_consulta')->constrained('consultas_medicas', 'id_consulta')->onDelete('restrict');
            $table->text('descripcion');
            $table->string('codigo_cie10', 20)->nullable();
            $table->string('tipo', 20)->default('PRESUNTIVO'); // PRESUNTIVO, DEFINITIVO
            $table->timestampTz('fecha_registro')->useCurrent();
            $table->timestamps();
        });

        // 5. evoluciones
        Schema::create('evoluciones', function (Blueprint $table) {
            $table->id('id_evolucion');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onDelete('restrict');
            $table->text('nota');
            $table->timestampTz('fecha_registro')->useCurrent();
            $table->timestamps();
        });

        // 6. recetas
        Schema::create('recetas', function (Blueprint $table) {
            $table->id('id_receta');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_consulta')->constrained('consultas_medicas', 'id_consulta')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onDelete('restrict');
            $table->timestampTz('fecha_emision')->useCurrent();
            $table->text('indicaciones_generales')->nullable();
            $table->string('estado', 20)->default('ACTIVO'); // ACTIVO, ANULADO
            $table->timestamps();
        });

        // 7. receta_detalles
        Schema::create('receta_detalles', function (Blueprint $table) {
            $table->id('id_detalle');
            $table->foreignId('id_receta')->constrained('recetas', 'id_receta')->onDelete('cascade');
            $table->string('medicamento', 150);
            $table->string('dosis', 100);
            $table->string('frecuencia', 100);
            $table->string('duracion', 100);
            $table->text('indicaciones')->nullable();
            $table->timestamps();
        });

        // 8. ordenes_examenes (CU25)
        Schema::create('ordenes_examenes', function (Blueprint $table) {
            $table->id('id_orden');
            $table->string('codigo_orden', 30)->unique(); // Ej: ORD-0001
            $table->foreignId('id_consulta')->constrained('consultas_medicas', 'id_consulta')->onDelete('restrict');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onDelete('restrict');
            $table->string('tipo_estudio', 30); // LABORATORIO, IMAGENOLOGIA, CARDIOLOGIA, OTROS
            $table->string('nombre_estudio', 150);
            $table->text('indicaciones_preparacion')->nullable();
            $table->string('diagnostico_presuntivo', 255)->nullable();
            $table->string('estado', 20)->default('PENDIENTE'); // PENDIENTE, CON_RESULTADOS, CANCELADA
            $table->timestampTz('fecha_emision')->useCurrent();
            $table->timestamps();
        });

        // 9. documentos_clinicos (CU26)
        Schema::create('documentos_clinicos', function (Blueprint $table) {
            $table->id('id_documento');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_consulta')->nullable()->constrained('consultas_medicas', 'id_consulta')->onDelete('set null');
            $table->foreignId('id_orden')->nullable()->constrained('ordenes_examenes', 'id_orden')->onDelete('set null');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onDelete('restrict');
            $table->string('titulo', 150);
            $table->string('tipo_documento', 50); // LABORATORIO, IMAGENOLOGIA, INFORME_EXTERNO, CONSENTIMIENTO, OTRO
            $table->text('descripcion')->nullable();
            $table->string('ruta_archivo', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('tamanio_bytes');
            $table->timestampTz('fecha_subida')->useCurrent();
            $table->string('estado', 20)->default('ACTIVO'); // ACTIVO, ARCHIVADO
            $table->timestamps();
        });

        // 10. analisis_clinicos (Reserva CU28-OPC)
        Schema::create('analisis_clinicos', function (Blueprint $table) {
            $table->id('id_analisis');
            $table->foreignId('id_historia_clinica')->constrained('historias_clinicas', 'id_historia_clinica')->onDelete('restrict');
            $table->foreignId('id_medico')->constrained('medicos', 'id_medico')->onDelete('restrict');
            $table->text('resumen');
            $table->jsonb('alertas')->nullable();
            $table->string('modelo_ia', 100);
            $table->timestampTz('fecha_generacion')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analisis_clinicos');
        Schema::dropIfExists('documentos_clinicos');
        Schema::dropIfExists('ordenes_examenes');
        Schema::dropIfExists('receta_detalles');
        Schema::dropIfExists('recetas');
        Schema::dropIfExists('evoluciones');
        Schema::dropIfExists('diagnosticos');
        Schema::dropIfExists('antecedentes');
        Schema::dropIfExists('consultas_medicas');
        Schema::dropIfExists('historias_clinicas');
    }
};

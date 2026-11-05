<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 6: Reportes y Analítica (CU23)
     */
    public function up(): void
    {
        Schema::create('reportes_ia', function (Blueprint $table) {
            $table->id('id_reporte');
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->text('comando_texto'); // Transcripción de la voz del usuario
            $table->jsonb('filtros_json'); // Parámetros estructurados extraídos por la IA
            $table->string('tipo_reporte', 50); // CITAS_MEDICO, CITAS_CANCELADAS, BALANCE, ETC.
            $table->timestampTz('fecha_generacion')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes_ia');
    }
};

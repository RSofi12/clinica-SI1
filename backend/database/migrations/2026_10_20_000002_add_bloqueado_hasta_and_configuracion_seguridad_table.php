<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mapeo estricto con DDL_Database_Clinica_LaCruz.sql y diagrama_de_clases.puml
     */
    public function up(): void
    {
        // 1. Agregar bloqueado_hasta a la tabla usuarios
        Schema::table('usuarios', function (Blueprint $table) {
            $table->timestampTz('bloqueado_hasta')->nullable()->after('intentos_fallidos');
        });

        // 2. Crear tabla configuracion_seguridad
        Schema::create('configuracion_seguridad', function (Blueprint $table) {
            $table->increments('id_configuracion');
            $table->integer('max_intentos_fallidos')->default(3);
            $table->integer('minutos_bloqueo')->default(5);
            $table->unsignedBigInteger('actualizado_por')->nullable();
            $table->timestampTz('fecha_actualizacion')->useCurrent();

            $table->foreign('actualizado_por')
                  ->references('id_usuario')
                  ->on('usuarios')
                  ->onDelete('set null');
        });

        // 3. Sembrar registro inicial por defecto
        DB::table('configuracion_seguridad')->insert([
            'max_intentos_fallidos' => 3,
            'minutos_bloqueo' => 5,
            'actualizado_por' => null,
            'fecha_actualizacion' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuracion_seguridad');

        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn('bloqueado_hasta');
        });
    }
};

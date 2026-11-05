<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Paquete 3: Gestión de Citas Médicas (CU11 / RF08 - Reprogramación de Citas)
     */
    public function up(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->timestampTz('reprogramada_en')->nullable()->after('cancelada_en');
            $table->string('motivo_reprogramacion', 255)->nullable()->after('reprogramada_en');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->dropColumn(['reprogramada_en', 'motivo_reprogramacion']);
        });
    }
};

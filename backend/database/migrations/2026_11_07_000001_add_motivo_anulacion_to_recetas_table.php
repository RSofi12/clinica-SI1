<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('recetas', function (Blueprint $table) {
            if (!Schema::hasColumn('recetas', 'motivo_anulacion')) {
                $table->string('motivo_anulacion', 500)->nullable()->after('indicaciones_generales');
            }
            if (!Schema::hasColumn('recetas', 'anulado_en')) {
                $table->timestampTz('anulado_en')->nullable()->after('estado');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recetas', function (Blueprint $table) {
            if (Schema::hasColumn('recetas', 'anulado_en')) {
                $table->dropColumn('anulado_en');
            }
            if (Schema::hasColumn('recetas', 'motivo_anulacion')) {
                $table->dropColumn('motivo_anulacion');
            }
        });
    }
};

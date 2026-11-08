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
        Schema::table('ordenes_examenes', function (Blueprint $table) {
            if (!Schema::hasColumn('ordenes_examenes', 'motivo_cancelacion')) {
                $table->string('motivo_cancelacion', 255)->nullable()->after('estado');
            }
            if (!Schema::hasColumn('ordenes_examenes', 'cancelado_en')) {
                $table->timestampTz('cancelado_en')->nullable()->after('motivo_cancelacion');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ordenes_examenes', function (Blueprint $table) {
            if (Schema::hasColumn('ordenes_examenes', 'cancelado_en')) {
                $table->dropColumn('cancelado_en');
            }
            if (Schema::hasColumn('ordenes_examenes', 'motivo_cancelacion')) {
                $table->dropColumn('motivo_cancelacion');
            }
        });
    }
};


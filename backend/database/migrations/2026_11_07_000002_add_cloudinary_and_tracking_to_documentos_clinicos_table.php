<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documentos_clinicos', function (Blueprint $table) {
            $table->string('nombre_archivo', 255)->nullable()->after('titulo');
            $table->string('formato_archivo', 10)->nullable()->after('nombre_archivo'); // JPG, PNG, PDF, DCM
            $table->string('ruta_archivo', 500)->change();
            $table->string('cloudinary_public_id', 255)->nullable()->after('ruta_archivo');
            $table->foreignId('subido_por')->nullable()->after('id_medico')->constrained('usuarios', 'id_usuario')->onDelete('set null');
            $table->foreignId('id_medico')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('documentos_clinicos', function (Blueprint $table) {
            $table->dropForeign(['subido_por']);
            $table->dropColumn([
                'nombre_archivo',
                'formato_archivo',
                'cloudinary_public_id',
                'subido_por',
            ]);
            $table->string('ruta_archivo', 255)->change();
        });
    }
};

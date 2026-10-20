<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mapeo estricto con:
     * - DDL_Database_Clinica_LaCruz.sql (Paquete 1: Seguridad y Auditoría)
     * - diagrama_de_clases.puml (Clases: Usuarios, Roles, Permisos, TokensRecuperacion, Bitacora)
     */
    public function up(): void
    {
        // 1. Tabla: usuarios
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->string('username', 50)->unique();
            $table->string('email', 120)->unique();
            $table->string('password_hash', 255);
            $table->string('tipo_usuario', 30); // CHECK ('ADMIN', 'RECEPCIONISTA', 'MEDICO', 'PACIENTE')
            $table->string('estado', 20)->default('ACTIVO'); // CHECK ('ACTIVO', 'INACTIVO', 'BLOQUEADO')
            $table->smallInteger('intentos_fallidos')->default(0);
            $table->timestampTz('ultimo_acceso')->nullable();
            $table->timestampTz('fecha_creacion')->useCurrent();
            $table->timestampTz('fecha_actualizacion')->useCurrent();
            $table->rememberToken();
        });

        // 2. Tabla: roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id('id_rol');
            $table->string('nombre', 50)->unique();
        });

        // 3. Tabla: permisos
        Schema::create('permisos', function (Blueprint $table) {
            $table->id('id_permiso');
            $table->string('nombre', 100)->unique();
        });

        // 4. Tabla pivote: usuario_rol
        Schema::create('usuario_rol', function (Blueprint $table) {
            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_rol');
            $table->primary(['id_usuario', 'id_rol']);

            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            $table->foreign('id_rol')->references('id_rol')->on('roles')->onDelete('cascade');
        });

        // 5. Tabla pivote: rol_permiso
        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->unsignedBigInteger('id_rol');
            $table->unsignedBigInteger('id_permiso');
            $table->primary(['id_rol', 'id_permiso']);

            $table->foreign('id_rol')->references('id_rol')->on('roles')->onDelete('cascade');
            $table->foreign('id_permiso')->references('id_permiso')->on('permisos')->onDelete('cascade');
        });

        // 6. Tabla: tokens_recuperacion
        Schema::create('tokens_recuperacion', function (Blueprint $table) {
            $table->id('id_token');
            $table->unsignedBigInteger('id_usuario');
            $table->string('token_hash', 255);
            $table->string('tipo_token', 50)->default('RECUPERACION_PASSWORD');
            $table->timestampTz('fecha_creacion')->useCurrent();
            $table->timestampTz('fecha_expiracion');
            $table->boolean('usado')->default(false);

            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('cascade');
        });

        // 7. Tabla: bitacora (Extra para trazabilidad)
        Schema::create('bitacora', function (Blueprint $table) {
            $table->id('id_bitacora');
            $table->unsignedBigInteger('id_usuario')->nullable();
            $table->string('modulo', 100);
            $table->string('accion', 50);
            $table->string('tabla_afectada', 100)->nullable();
            $table->unsignedBigInteger('id_registro')->nullable();
            $table->text('descripcion')->nullable();
            $table->string('ip_origen', 45)->nullable();
            $table->timestampTz('fecha_registro')->useCurrent();

            $table->foreign('id_usuario')->references('id_usuario')->on('usuarios')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bitacora');
        Schema::dropIfExists('tokens_recuperacion');
        Schema::dropIfExists('rol_permiso');
        Schema::dropIfExists('usuario_rol');
        Schema::dropIfExists('permisos');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('usuarios');
    }
};

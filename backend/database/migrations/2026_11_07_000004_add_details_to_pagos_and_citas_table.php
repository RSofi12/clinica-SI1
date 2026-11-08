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
        Schema::table('pagos', function (Blueprint $table) {
            if (!Schema::hasColumn('pagos', 'codigo_pago')) {
                $table->string('codigo_pago', 30)->nullable()->unique()->after('id_pago');
            }
            if (!Schema::hasColumn('pagos', 'moneda')) {
                $table->string('moneda', 10)->default('usd')->after('monto');
            }
            if (!Schema::hasColumn('pagos', 'tarjeta_marca')) {
                $table->string('tarjeta_marca', 30)->nullable()->after('stripe_payment_intent_id');
            }
            if (!Schema::hasColumn('pagos', 'tarjeta_ultimos4')) {
                $table->string('tarjeta_ultimos4', 4)->nullable()->after('tarjeta_marca');
            }
            if (!Schema::hasColumn('pagos', 'descripcion')) {
                $table->string('descripcion', 255)->nullable()->after('tarjeta_ultimos4');
            }
            if (!Schema::hasColumn('pagos', 'recibo_url')) {
                $table->string('recibo_url', 500)->nullable()->after('estado');
            }
        });

        Schema::table('citas', function (Blueprint $table) {
            if (!Schema::hasColumn('citas', 'pagada')) {
                $table->boolean('pagada')->default(false)->after('estado');
            }
            if (!Schema::hasColumn('citas', 'monto_pago')) {
                $table->decimal('monto_pago', 10, 2)->nullable()->after('pagada');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            if (Schema::hasColumn('citas', 'monto_pago')) {
                $table->dropColumn('monto_pago');
            }
            if (Schema::hasColumn('citas', 'pagada')) {
                $table->dropColumn('pagada');
            }
        });

        Schema::table('pagos', function (Blueprint $table) {
            if (Schema::hasColumn('pagos', 'recibo_url')) {
                $table->dropColumn('recibo_url');
            }
            if (Schema::hasColumn('pagos', 'descripcion')) {
                $table->dropColumn('descripcion');
            }
            if (Schema::hasColumn('pagos', 'tarjeta_ultimos4')) {
                $table->dropColumn('tarjeta_ultimos4');
            }
            if (Schema::hasColumn('pagos', 'tarjeta_marca')) {
                $table->dropColumn('tarjeta_marca');
            }
            if (Schema::hasColumn('pagos', 'moneda')) {
                $table->dropColumn('moneda');
            }
            if (Schema::hasColumn('pagos', 'codigo_pago')) {
                $table->dropColumn('codigo_pago');
            }
        });
    }
};

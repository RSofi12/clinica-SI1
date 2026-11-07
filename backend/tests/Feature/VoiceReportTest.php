<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Packages\Analytics\Services\VoiceCommandParserService;

class VoiceReportTest extends TestCase
{
    /**
     * Prueba el motor de análisis de comandos en lenguaje natural
     */
    public function test_voice_command_parser_detects_status_and_time_range(): void
    {
        $parser = new VoiceCommandParserService();

        // 1. Detección de canceladas y mes actual
        $resultado = $parser->parse('Citas canceladas de este mes');

        $this->assertEquals('CITAS_CANCELADAS', $resultado['tipo_reporte']);
        $this->assertEquals('CANCELADA', $resultado['filtros']['estado']);
        $this->assertNotNull($resultado['filtros']['fecha_inicio']);
        $this->assertNotNull($resultado['filtros']['fecha_fin']);

        // 2. Detección de atendidas
        $resAtendidas = $parser->parse('Reporte de citas atendidas de hoy');
        $this->assertEquals('ATENDIDA', $resAtendidas['filtros']['estado']);
        $this->assertStringContainsString('atendidas', strtolower($resAtendidas['interpretacion_legible']));
    }
}

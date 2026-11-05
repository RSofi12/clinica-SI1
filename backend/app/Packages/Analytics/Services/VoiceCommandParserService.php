<?php

namespace App\Packages\Analytics\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Packages\ClinicalResources\Models\Especialidad;
use App\Packages\ClinicalResources\Models\Medico;

/**
 * Servicio de Procesamiento de Lenguaje Natural (NLP) para Comandos de Voz
 * Arquitectura Híbrida:
 * 1. Motor Determinístico por Reglas Semánticas (Zero-latency, 100% offline, sin costos de API).
 * 2. Adaptador Gemini API opcional (Si se provee GEMINI_API_KEY en .env) con fallback automático.
 */
class VoiceCommandParserService
{
    protected array $meses = [
        'enero'      => 1,
        'febrero'    => 2,
        'marzo'      => 3,
        'abril'      => 4,
        'mayo'       => 5,
        'junio'      => 6,
        'julio'      => 7,
        'agosto'     => 8,
        'septiembre' => 9,
        'setiembre'  => 9,
        'octubre'    => 10,
        'noviembre'  => 11,
        'diciembre'  => 12,
    ];

    /**
     * Procesa la transcripción textual y extrae los filtros estructurados
     */
    public function parse(string $comandoTexto, array $contexto = []): array
    {
        $textoLimpio = $this->normalizarTexto($comandoTexto);

        // 1. Ejecutar análisis determinístico local (siempre disponible y rápido)
        $resultadoLocal = $this->parseLocal($textoLimpio, $comandoTexto);

        // 2. Si hay API Key de Gemini y el parsing local quedó con baja confianza, intentar enriquecer
        $geminiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');
        if (!empty($geminiKey) && $this->requiereEnriquecimientoIa($resultadoLocal)) {
            try {
                $resultadoIa = $this->consultarGeminiApi($comandoTexto, $geminiKey);
                if (!empty($resultadoIa)) {
                    return $this->fusionarResultados($resultadoLocal, $resultadoIa);
                }
            } catch (\Throwable $e) {
                Log::warning('Fallo en enriquecimiento Gemini para reporte por voz, usando motor determinístico: ' . $e->getMessage());
            }
        }

        return $resultadoLocal;
    }

    /**
     * Motor determinístico por patrones de lenguaje natural
     */
    protected function parseLocal(string $texto, string $textoOriginal): array
    {
        $filtros = [
            'tipo_reporte'        => 'CITAS_GENERALES',
            'estado'              => null,
            'id_especialidad'     => null,
            'especialidad_nombre' => null,
            'id_medico'           => null,
            'medico_nombre'       => null,
            'fecha_inicio'        => null,
            'fecha_fin'           => null,
            'agrupador'           => null,
        ];

        // --- A. Detección de Estado de Citas (RF10) ---
        if (preg_match('/\b(cancelad[ao]s?|anulad[ao]s?)\b/', $texto)) {
            $filtros['estado'] = 'CANCELADA';
            $filtros['tipo_reporte'] = 'CITAS_CANCELADAS';
        } elseif (preg_match('/\b(atendid[ao]s?|realizad[ao]s?|completad[ao]s?)\b/', $texto)) {
            $filtros['estado'] = 'ATENDIDA';
            $filtros['tipo_reporte'] = 'CITAS_ATENDIDAS';
        } elseif (preg_match('/\b(inasistencias?|no asisti[oó]s?|faltas?)\b/', $texto)) {
            $filtros['estado'] = 'INASISTENCIA';
            $filtros['tipo_reporte'] = 'CITAS_ESTADO';
        } elseif (preg_match('/\b(confirmad[ao]s?)\b/', $texto)) {
            $filtros['estado'] = 'CONFIRMADA';
            $filtros['tipo_reporte'] = 'CITAS_ESTADO';
        } elseif (preg_match('/\b(programad[ao]s?|pendientes?|agendad[ao]s?)\b/', $texto)) {
            $filtros['estado'] = 'PROGRAMADA';
            $filtros['tipo_reporte'] = 'CITAS_ESTADO';
        }

        // --- B. Detección de Reportes de Balance o Pacientes ---
        if (preg_match('/\b(balance|tasa|estadistica|resumen|comparativa)\b/', $texto)) {
            $filtros['tipo_reporte'] = 'BALANCE_ATENCIONES';
        } elseif (preg_match('/\b(pacientes? nuevos?|pacientes? registrados?|padron)\b/', $texto)) {
            $filtros['tipo_reporte'] = 'PACIENTES_REGISTRADOS';
        }

        // --- C. Detección de Especialidad ---
        try {
            $especialidades = Especialidad::all(['id_especialidad', 'nombre']);
            foreach ($especialidades as $esp) {
                $nombreEspNorm = $this->normalizarTexto($esp->nombre);
                if (str_contains($texto, $nombreEspNorm)) {
                    $filtros['id_especialidad'] = $esp->id_especialidad;
                    $filtros['especialidad_nombre'] = $esp->nombre;
                    if ($filtros['tipo_reporte'] === 'CITAS_GENERALES') {
                        $filtros['tipo_reporte'] = 'CITAS_ESPECIALIDAD';
                    }
                    break;
                }
            }
        } catch (\Throwable) {
            // Silencioso si la base de datos o facade no está disponible
        }

        // --- D. Detección de Médico ---
        try {
            $medicos = Medico::all(['id_medico', 'nombres', 'apellidos']);
            foreach ($medicos as $med) {
                $nombreComp = $this->normalizarTexto($med->nombres . ' ' . $med->apellidos);
                $apellidos = $this->normalizarTexto($med->apellidos);
                $primerApellido = explode(' ', $apellidos)[0] ?? '';

                if (str_contains($texto, $nombreComp) || (!empty($primerApellido) && strlen($primerApellido) > 3 && str_contains($texto, $primerApellido))) {
                    $filtros['id_medico'] = $med->id_medico;
                    $filtros['medico_nombre'] = 'Dr(a). ' . $med->nombres . ' ' . $med->apellidos;
                    $filtros['tipo_reporte'] = 'CITAS_MEDICO';
                    break;
                }
            }
        } catch (\Throwable) {
            // Silencioso si la base de datos o facade no está disponible
        }

        // --- E. Detección de Rango Temporal (Carbon) ---
        $rangoFechas = $this->extraerRangoFechas($texto);
        if ($rangoFechas) {
            $filtros['fecha_inicio'] = $rangoFechas['inicio'];
            $filtros['fecha_fin'] = $rangoFechas['fin'];
        }

        // --- F. Generar Interpretación en Lenguaje Natural Legible ---
        $interpretacion = $this->generarInterpretacionLegible($filtros, $textoOriginal);

        return [
            'comando_texto'           => $textoOriginal,
            'tipo_reporte'            => $filtros['tipo_reporte'],
            'filtros'                 => $filtros,
            'interpretacion_legible' => $interpretacion,
            'motor'                   => 'DETERMINISTIC_NLP',
            'confianza'               => $this->calcularConfianza($filtros),
        ];
    }

    /**
     * Resuelve rangos de fechas a partir de expresiones coloquiales
     */
    protected function extraerRangoFechas(string $texto): ?array
    {
        $hoy = Carbon::today();

        if (preg_match('/\b(hoy|el dia de hoy)\b/', $texto)) {
            return [
                'inicio' => $hoy->copy()->startOfDay()->toDateString(),
                'fin'    => $hoy->copy()->endOfDay()->toDateString(),
            ];
        }

        if (preg_match('/\b(ayer)\b/', $texto)) {
            $ayer = $hoy->copy()->subDay();
            return [
                'inicio' => $ayer->startOfDay()->toDateString(),
                'fin'    => $ayer->endOfDay()->toDateString(),
            ];
        }

        if (preg_match('/\b(esta semana)\b/', $texto)) {
            return [
                'inicio' => $hoy->copy()->startOfWeek()->toDateString(),
                'fin'    => $hoy->copy()->endOfWeek()->toDateString(),
            ];
        }

        if (preg_match('/\b(semana pasada|semana anterior|ultima semana)\b/', $texto)) {
            $semPasada = $hoy->copy()->subWeek();
            return [
                'inicio' => $semPasada->startOfWeek()->toDateString(),
                'fin'    => $semPasada->endOfWeek()->toDateString(),
            ];
        }

        if (preg_match('/\b(este mes)\b/', $texto)) {
            return [
                'inicio' => $hoy->copy()->startOfMonth()->toDateString(),
                'fin'    => $hoy->copy()->endOfMonth()->toDateString(),
            ];
        }

        if (preg_match('/\b(mes pasado|mes anterior|ultimo mes)\b/', $texto)) {
            $mesPasado = $hoy->copy()->subMonth();
            return [
                'inicio' => $mesPasado->startOfMonth()->toDateString(),
                'fin'    => $mesPasado->endOfMonth()->toDateString(),
            ];
        }

        if (preg_match('/\b(este a[nñ]o)\b/', $texto)) {
            return [
                'inicio' => $hoy->copy()->startOfYear()->toDateString(),
                'fin'    => $hoy->copy()->endOfYear()->toDateString(),
            ];
        }

        // Búsqueda por nombre de mes (ej. "en octubre", "mes de octubre")
        foreach ($this->meses as $nombreMes => $numMes) {
            if (preg_match("/\b(en\s+|mes\s+de\s+|durante\s+)?{$nombreMes}(\s+del?\s+(\d{4}))?\b/", $texto, $coincidencias)) {
                $anio = !empty($coincidencias[3]) ? (int)$coincidencias[3] : (int)$hoy->year;
                $fechaMes = Carbon::createFromDate($anio, $numMes, 1);
                return [
                    'inicio' => $fechaMes->copy()->startOfMonth()->toDateString(),
                    'fin'    => $fechaMes->copy()->endOfMonth()->toDateString(),
                ];
            }
        }

        // Búsqueda de fechas numéricas directas (ej: 2026-10-15 o 15/10/2026)
        if (preg_match('/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/', $texto, $m)) {
            $fecha = Carbon::createFromDate($m[1], $m[2], $m[3]);
            return [
                'inicio' => $fecha->toDateString(),
                'fin'    => $fecha->toDateString(),
            ];
        }

        if (preg_match('/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/', $texto, $m)) {
            $fecha = Carbon::createFromDate($m[3], $m[2], $m[1]);
            return [
                'inicio' => $fecha->toDateString(),
                'fin'    => $fecha->toDateString(),
            ];
        }

        return null;
    }

    /**
     * Construye un resumen legible en español de lo que el sistema entendió
     */
    protected function generarInterpretacionLegible(array $filtros, string $original): string
    {
        $partes = [];

        switch ($filtros['tipo_reporte']) {
            case 'CITAS_CANCELADAS':
                $partes[] = 'Citas canceladas';
                break;
            case 'CITAS_ATENDIDAS':
                $partes[] = 'Citas asistidas y atendidas';
                break;
            case 'CITAS_ESTADO':
                $partes[] = 'Citas con estado ' . ($filtros['estado'] ?? 'seleccionado');
                break;
            case 'CITAS_ESPECIALIDAD':
                $partes[] = 'Citas de ' . ($filtros['especialidad_nombre'] ?? 'especialidad');
                break;
            case 'CITAS_MEDICO':
                $partes[] = 'Citas correspondientes a ' . ($filtros['medico_nombre'] ?? 'médico');
                break;
            case 'BALANCE_ATENCIONES':
                $partes[] = 'Balance y estadísticas comparativas de atención';
                break;
            case 'PACIENTES_REGISTRADOS':
                $partes[] = 'Padrón y registro de pacientes';
                break;
            default:
                $partes[] = 'Reporte general de citas';
                break;
        }

        if ($filtros['id_especialidad'] && !in_array($filtros['tipo_reporte'], ['CITAS_ESPECIALIDAD'])) {
            $partes[] = 'en ' . $filtros['especialidad_nombre'];
        }

        if ($filtros['id_medico'] && !in_array($filtros['tipo_reporte'], ['CITAS_MEDICO'])) {
            $partes[] = 'con ' . $filtros['medico_nombre'];
        }

        if ($filtros['fecha_inicio'] && $filtros['fecha_fin']) {
            if ($filtros['fecha_inicio'] === $filtros['fecha_fin']) {
                $partes[] = 'para el día ' . Carbon::parse($filtros['fecha_inicio'])->format('d/m/Y');
            } else {
                $partes[] = 'desde el ' . Carbon::parse($filtros['fecha_inicio'])->format('d/m/Y') . ' hasta el ' . Carbon::parse($filtros['fecha_fin'])->format('d/m/Y');
            }
        }

        return implode(' ', $partes);
    }

    protected function calcularConfianza(array $filtros): float
    {
        $puntos = 0.5; // Base
        if (!empty($filtros['estado'])) $puntos += 0.2;
        if (!empty($filtros['id_especialidad'])) $puntos += 0.15;
        if (!empty($filtros['id_medico'])) $puntos += 0.15;
        if (!empty($filtros['fecha_inicio'])) $puntos += 0.15;

        return min(1.0, $puntos);
    }

    protected function requiereEnriquecimientoIa(array $resultado): bool
    {
        return ($resultado['confianza'] ?? 0) < 0.7;
    }

    /**
     * Consulta opcional a Gemini API para consultas ambiguas (Structured Outputs)
     */
    protected function consultarGeminiApi(string $comando, string $apiKey): ?array
    {
        $prompt = "Eres un asistente de base de datos clínica. Analiza esta frase de un administrador y extrae parámetros en JSON con los campos: " .
            "tipo_reporte (CITAS_MEDICO, CITAS_ESPECIALIDAD, CITAS_CANCELADAS, CITAS_ATENDIDAS, BALANCE_ATENCIONES, CITAS_GENERALES), " .
            "estado (PROGRAMADA, CONFIRMADA, ATENDIDA, CANCELADA, INASISTENCIA o null), " .
            "medico_nombre (o null), especialidad_nombre (o null), fecha_inicio (YYYY-MM-DD o null), fecha_fin (YYYY-MM-DD o null). " .
            "Fecha de hoy: " . Carbon::today()->toDateString() . ". Frase: \"{$comando}\"";

        $response = Http::timeout(3)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
            ],
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $textoJson = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if ($textoJson) {
                return json_decode($textoJson, true);
            }
        }

        return null;
    }

    protected function fusionarResultados(array $local, array $ia): array
    {
        foreach (['estado', 'id_especialidad', 'especialidad_nombre', 'id_medico', 'medico_nombre', 'fecha_inicio', 'fecha_fin'] as $campo) {
            if (empty($local['filtros'][$campo]) && !empty($ia[$campo])) {
                $local['filtros'][$campo] = $ia[$campo];
            }
        }
        if (!empty($ia['tipo_reporte'])) {
            $local['tipo_reporte'] = $ia['tipo_reporte'];
            $local['filtros']['tipo_reporte'] = $ia['tipo_reporte'];
        }
        $local['motor'] = 'HYBRID_GEMINI_NLP';
        $local['confianza'] = 0.95;

        return $local;
    }

    protected function normalizarTexto(string $texto): string
    {
        $texto = mb_strtolower($texto, 'UTF-8');
        $reemplazos = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'ü' => 'u', 'ñ' => 'n',
        ];
        return strtr($texto, $reemplazos);
    }
}

<?php

namespace App\Packages\MedicalRecords\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Exception;

/**
 * Servicio de Almacenamiento Seguro Cloudinary para Documentos Clínicos (CU26)
 * Paquete 4: Historial Clínico y Consultas
 */
class CloudinaryStorageService
{
    protected ?string $cloudName;
    protected ?string $apiKey;
    protected ?string $apiSecret;

    public function __construct()
    {
        // 1. Intentar leer desde CLOUDINARY_URL (ej: cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
        $cloudinaryUrl = env('CLOUDINARY_URL');
        if ($cloudinaryUrl) {
            $parsed = parse_url($cloudinaryUrl);
            $this->apiKey = $parsed['user'] ?? null;
            $this->apiSecret = $parsed['pass'] ?? null;
            $this->cloudName = $parsed['host'] ?? null;
        } else {
            $this->cloudName = env('CLOUDINARY_CLOUD_NAME');
            $this->apiKey = env('CLOUDINARY_API_KEY');
            $this->apiSecret = env('CLOUDINARY_API_SECRET');
        }
    }

    /**
     * Determina si las credenciales de Cloudinary están configuradas en el entorno
     */
    public function estaConfigurado(): bool
    {
        return !empty($this->cloudName) && !empty($this->apiKey) && !empty($this->apiSecret);
    }

    /**
     * Resuelve el tipo de recurso según el formato clínico
     */
    public function resolverResourceType(string $formato): string
    {
        $fmt = strtoupper($formato);
        // DICOM y PDFs se manejan como 'raw' o 'auto' para preservar fidelidad binaria exacta
        if (in_array($fmt, ['DCM', 'DICOM', 'PDF'], true)) {
            return 'raw';
        }
        return 'image';
    }

    /**
     * Sube un archivo a Cloudinary con fallback resiliente
     *
     * @param UploadedFile $archivo
     * @param int $idHistoria
     * @param string $formato
     * @return array ['secure_url' => string, 'public_id' => string, 'resource_type' => string]
     * @throws Exception
     */
    public function subirArchivo(UploadedFile $archivo, int $idHistoria, string $formato): array
    {
        $resourceType = $this->resolverResourceType($formato);
        $folder = "clinica-la-cruz/documentos-clinicos/historia-{$idHistoria}";

        // Si Cloudinary está configurado, sube directamente a la nube
        if ($this->estaConfigurado()) {
            return $this->subirACloudinaryApi($archivo, $folder, $resourceType);
        }

        // Fallback local seguro (dev / offline)
        return $this->subirALocalStorage($archivo, $idHistoria, $resourceType);
    }

    /**
     * Sube a la API oficial de Cloudinary mediante multipart HTTP
     */
    protected function subirACloudinaryApi(UploadedFile $archivo, string $folder, string $resourceType): array
    {
        $timestamp = time();
        $paramsToSign = [
            'folder' => $folder,
            'timestamp' => $timestamp,
        ];
        ksort($paramsToSign);

        $signString = '';
        foreach ($paramsToSign as $k => $v) {
            $signString .= "{$k}={$v}&";
        }
        $signString = rtrim($signString, '&') . $this->apiSecret;
        $signature = sha1($signString);

        $endpoint = "https://api.cloudinary.com/v1_1/{$this->cloudName}/{$resourceType}/upload";

        $response = Http::attach(
            'file',
            file_get_contents($archivo->getRealPath()),
            $archivo->getClientOriginalName()
        )->post($endpoint, [
            'api_key' => $this->apiKey,
            'timestamp' => $timestamp,
            'folder' => $folder,
            'signature' => $signature,
        ]);

        if (!$response->successful()) {
            Log::error('Fallo en subida a Cloudinary', ['status' => $response->status(), 'body' => $response->body()]);
            throw new Exception('No fue posible almacenar el documento clínico en Cloudinary: ' . $response->body());
        }

        $data = $response->json();
        $secureUrl = $data['secure_url'] ?? null;
        $publicId = $data['public_id'] ?? null;

        if (!$secureUrl || !$publicId) {
            throw new Exception('Respuesta incompleta de Cloudinary al subir el documento clínico.');
        }

        return [
            'secure_url' => $secureUrl,
            'public_id' => $publicId,
            'resource_type' => $resourceType,
        ];
    }

    /**
     * Fallback de almacenamiento local en disco público
     */
    protected function subirALocalStorage(UploadedFile $archivo, int $idHistoria, string $resourceType): array
    {
        $extension = $archivo->getClientOriginalExtension() ?: 'bin';
        $nombreUnico = uniqid("doc_{$idHistoria}_", true) . ".{$extension}";
        $pathRelativo = "documentos-clinicos/historia-{$idHistoria}/{$nombreUnico}";

        Storage::disk('public')->put($pathRelativo, file_get_contents($archivo->getRealPath()));
        $url = asset("storage/{$pathRelativo}");

        return [
            'secure_url' => $url,
            'public_id' => "local_{$pathRelativo}",
            'resource_type' => $resourceType,
        ];
    }

    /**
     * Elimina un archivo de Cloudinary o del almacenamiento local
     */
    public function eliminarArchivo(string $publicId, string $resourceType = 'image'): bool
    {
        if (str_starts_with($publicId, 'local_')) {
            $pathRelativo = str_replace('local_', '', $publicId);
            return Storage::disk('public')->delete($pathRelativo);
        }

        if (!$this->estaConfigurado()) {
            return false;
        }

        $timestamp = time();
        $paramsToSign = [
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];
        ksort($paramsToSign);

        $signString = '';
        foreach ($paramsToSign as $k => $v) {
            $signString .= "{$k}={$v}&";
        }
        $signString = rtrim($signString, '&') . $this->apiSecret;
        $signature = sha1($signString);

        $endpoint = "https://api.cloudinary.com/v1_1/{$this->cloudName}/{$resourceType}/destroy";

        $response = Http::asForm()->post($endpoint, [
            'api_key' => $this->apiKey,
            'timestamp' => $timestamp,
            'public_id' => $publicId,
            'signature' => $signature,
            'invalidate' => true,
        ]);

        return $response->successful();
    }
}

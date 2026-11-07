<?php

namespace App\Packages\MedicalRecords\Services;

use App\Packages\MedicalRecords\Models\DocumentoClinico;
use App\Packages\MedicalRecords\Models\HistoriaClinica;
use App\Packages\MedicalRecords\Models\OrdenExamen;
use App\Packages\Security\Models\Bitacora;
use App\Packages\Security\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Exception;
use Throwable;

/**
 * Servicio de Dominio para Gestión de Documentos Clínicos Adjuntos (CU26)
 * Soporta almacenamiento Cloudinary, visor DICOM y enlace opcional con CU25 (Órdenes de Exámenes)
 * Paquete 4: Historial Clínico y Consultas
 */
class DocumentoClinicoService
{
    public function __construct(
        protected CloudinaryStorageService $cloudinaryService
    ) {}

    /**
     * Valida permisos y aplica política Anti-IDOR y secreto profesional
     *
     * @param HistoriaClinica $historia
     * @param User $usuario
     * @param bool $paraModificar
     * @throws HttpException
     */
    public function validarAcceso(HistoriaClinica $historia, User $usuario, bool $paraModificar = false): void
    {
        $rol = strtoupper($usuario->tipo_usuario ?? $usuario->rol ?? '');

        // 1. Recepcionista bloqueada por secreto médico y confidencialidad asistencial
        if ($rol === 'RECEPCIONISTA') {
            throw new HttpException(403, 'Acceso restringido: personal de recepción no autorizado para ver documentos clínicos confidenciales.');
        }

        // 2. Paciente solo lectura de sus propios documentos
        if ($rol === 'PACIENTE') {
            if ($paraModificar) {
                throw new HttpException(403, 'Acceso denegado: los pacientes no tienen autorización para adjuntar o eliminar documentos clínicos.');
            }

            $pacienteVinculado = $usuario->paciente;
            if (!$pacienteVinculado || (int) $pacienteVinculado->id_paciente !== (int) $historia->id_paciente) {
                throw new HttpException(403, 'Acceso denegado: solo puedes consultar documentos de tu propio expediente clínico.');
            }
            return;
        }

        // 3. Médicos y Administradores autorizados
        if (in_array($rol, ['ADMIN', 'ADMINISTRADOR', 'MEDICO'], true)) {
            return;
        }

        throw new HttpException(403, 'Rol de usuario no autorizado para acceder al archivo documental clínico.');
    }

    /**
     * Lista los documentos clínicos de un historial con filtros y paginación
     *
     * @param int $idHistoria
     * @param User $usuario
     * @param array $filtros
     * @return array
     */
    public function listarPorHistoria(int $idHistoria, User $usuario, array $filtros = []): array
    {
        $historia = HistoriaClinica::findOrFail($idHistoria);
        $this->validarAcceso($historia, $usuario, false);

        $query = DocumentoClinico::with(['medico.usuario', 'subidoPorUsuario', 'ordenExamen'])
            ->where('id_historia_clinica', $idHistoria)
            ->where('estado', '!=', 'INACTIVO');

        // Filtro por tipo de documento / categoría
        if (!empty($filtros['tipo_documento'])) {
            $query->where('tipo_documento', $filtros['tipo_documento']);
        }

        // Filtro por formato de archivo (DCM, PDF, PNG, JPG)
        if (!empty($filtros['formato'])) {
            $query->where('formato_archivo', strtoupper($filtros['formato']));
        }

        // Filtro por orden de examen asociada (CU25)
        if (!empty($filtros['id_orden'])) {
            $query->where('id_orden', $filtros['id_orden']);
        }

        // Búsqueda textual por título, nombre de archivo u observaciones
        if (!empty($filtros['buscar'])) {
            $term = '%' . trim($filtros['buscar']) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('titulo', 'ilike', $term)
                  ->orWhere('nombre_archivo', 'ilike', $term)
                  ->orWhere('descripcion', 'ilike', $term);
            });
        }

        $perPage = max(1, min(50, (int) ($filtros['per_page'] ?? 15)));
        $paginados = $query->orderByDesc('fecha_subida')->orderByDesc('id_documento')->paginate($perPage);

        // Métricas de resumen del archivo documental
        $stats = [
            'total' => DocumentoClinico::where('id_historia_clinica', $idHistoria)->where('estado', '!=', 'INACTIVO')->count(),
            'dicom' => DocumentoClinico::where('id_historia_clinica', $idHistoria)->where('formato_archivo', 'DCM')->where('estado', '!=', 'INACTIVO')->count(),
            'pdf'   => DocumentoClinico::where('id_historia_clinica', $idHistoria)->where('formato_archivo', 'PDF')->where('estado', '!=', 'INACTIVO')->count(),
            'img'   => DocumentoClinico::where('id_historia_clinica', $idHistoria)->whereIn('formato_archivo', ['JPG', 'PNG'])->where('estado', '!=', 'INACTIVO')->count(),
        ];

        return [
            'documentos' => $paginados,
            'estadisticas' => $stats,
            'historia' => [
                'id_historia_clinica' => $historia->id_historia_clinica,
                'id_paciente' => $historia->id_paciente,
                'estado' => $historia->estado,
            ],
        ];
    }

    /**
     * Sube y adjunta un nuevo documento clínico (soporta modo autónomo y vinculado a CU25)
     *
     * @param int $idHistoria
     * @param UploadedFile $archivo
     * @param array $datos
     * @param User $usuario
     * @param string|null $ip
     * @return DocumentoClinico
     * @throws HttpException|Exception
     */
    public function adjuntarDocumento(
        int $idHistoria,
        UploadedFile $archivo,
        array $datos,
        User $usuario,
        ?string $ip = null
    ): DocumentoClinico {
        $historia = HistoriaClinica::findOrFail($idHistoria);
        $this->validarAcceso($historia, $usuario, true);

        if ($historia->estado === 'ARCHIVADO') {
            throw new HttpException(422, 'El historial clínico se encuentra archivado. No admite nuevos documentos adjuntos.');
        }

        // Determinar formato formal
        $extension = strtolower($archivo->getClientOriginalExtension() ?: 'bin');
        $formato = match ($extension) {
            'jpg', 'jpeg' => 'JPG',
            'png' => 'PNG',
            'pdf' => 'PDF',
            'dcm' => 'DCM',
            default => strtoupper($extension),
        };

        // 1. Subir archivo a Cloudinary
        $cloudinaryData = $this->cloudinaryService->subirArchivo($archivo, $idHistoria, $formato);

        // 2. Persistir en base de datos con transacción atómica
        try {
            return DB::transaction(function () use ($historia, $archivo, $datos, $formato, $cloudinaryData, $usuario, $ip) {
                // Resolver médico responsable
                $idMedico = null;
                if ($usuario->tipo_usuario === 'MEDICO' && $usuario->medico) {
                    $idMedico = $usuario->medico->id_medico;
                } elseif (!empty($datos['id_medico'])) {
                    $idMedico = (int) $datos['id_medico'];
                }

                // Si se vinculó a una orden de examen auxiliar (CU25)
                $idOrden = !empty($datos['id_orden']) ? (int) $datos['id_orden'] : null;
                if ($idOrden) {
                    $orden = OrdenExamen::where('id_orden', $idOrden)
                        ->where('id_historia_clinica', $historia->id_historia_clinica)
                        ->first();

                    if ($orden && $orden->estado === 'PENDIENTE') {
                        $orden->update(['estado' => 'CON_RESULTADOS']);
                    }
                }

                $titulo = !empty($datos['titulo'])
                    ? trim($datos['titulo'])
                    : (!empty($datos['especialidad']) ? "[{$datos['especialidad']}] {$datos['tipo_documento']}" : $datos['tipo_documento']);
                $descripcion = !empty($datos['observaciones']) ? trim($datos['observaciones']) : ($datos['descripcion'] ?? null);

                $documento = DocumentoClinico::create([
                    'id_historia_clinica' => $historia->id_historia_clinica,
                    'id_consulta'         => !empty($datos['id_consulta']) ? (int) $datos['id_consulta'] : null,
                    'id_orden'            => $idOrden,
                    'id_medico'           => $idMedico,
                    'subido_por'          => $usuario->id_usuario,
                    'titulo'              => $titulo,
                    'nombre_archivo'      => $archivo->getClientOriginalName(),
                    'formato_archivo'     => $formato,
                    'tipo_documento'      => $datos['tipo_documento'],
                    'descripcion'         => $descripcion,
                    'ruta_archivo'        => $cloudinaryData['secure_url'],
                    'cloudinary_public_id'=> $cloudinaryData['public_id'],
                    'mime_type'           => $archivo->getClientMimeType() ?: 'application/octet-stream',
                    'tamanio_bytes'       => $archivo->getSize(),
                    'fecha_subida'        => now(),
                    'estado'              => 'ACTIVO',
                ]);

                // Auditoría inmutable en Bitácora (CU03)
                Bitacora::registrar(
                    $usuario->id_usuario,
                    'HISTORIAL_CLINICO',
                    'ADJUNTAR_DOCUMENTO_CLINICO',
                    'documentos_clinicos',
                    $documento->id_documento,
                    "Adjuntado documento clínico #{$documento->id_documento} ({$documento->nombre_archivo}) al historial #{$historia->id_historia_clinica}" . ($idOrden ? " vinculado a Orden #{$idOrden}" : ''),
                    $ip
                );

                return $documento->load(['medico.usuario', 'subidoPorUsuario', 'ordenExamen']);
            });
        } catch (Throwable $e) {
            // Rollback seguro en Cloudinary si falló la base de datos
            try {
                $this->cloudinaryService->eliminarArchivo(
                    $cloudinaryData['public_id'],
                    $cloudinaryData['resource_type']
                );
            } catch (Throwable $cleanupError) {
                // Silenciar fallo de limpieza para re-lanzar la excepción original
            }
            throw new Exception('Error al registrar el documento clínico en base de datos: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Elimina un documento clínico de Cloudinary y aplica baja lógica inmutable (RN11)
     *
     * @param int $idDocumento
     * @param User $usuario
     * @param string|null $motivo
     * @param string|null $ip
     * @return bool
     * @throws HttpException
     */
    public function eliminarDocumento(int $idDocumento, User $usuario, ?string $motivo = null, ?string $ip = null): bool
    {
        $documento = DocumentoClinico::with('historiaClinica')->findOrFail($idDocumento);
        $rol = strtoupper($usuario->tipo_usuario ?? $usuario->rol ?? '');

        // Validación de permisos de eliminación: Solo Administrador o el propio médico autor
        $esAutor = (int) $documento->subido_por === (int) $usuario->id_usuario ||
                   ($usuario->medico && (int) $documento->id_medico === (int) $usuario->medico->id_medico);

        if ($rol !== 'ADMIN' && $rol !== 'ADMINISTRADOR' && !$esAutor) {
            throw new HttpException(403, 'No tiene autorización para eliminar un documento clínico adjuntado por otro profesional.');
        }

        // Eliminar recurso en Cloudinary
        if ($documento->cloudinary_public_id) {
            $resourceType = $this->cloudinaryService->resolverResourceType($documento->formato_archivo);
            $this->cloudinaryService->eliminarArchivo($documento->cloudinary_public_id, $resourceType);
        }

        // Baja lógica en base de datos (RN11)
        $documento->estado = 'INACTIVO';
        $documento->save();

        // Auditoría inmutable en Bitácora
        Bitacora::registrar(
            $usuario->id_usuario,
            'HISTORIAL_CLINICO',
            'ELIMINAR_DOCUMENTO_CLINICO',
            'documentos_clinicos',
            $documento->id_documento,
            "Eliminado documento clínico #{$documento->id_documento} ({$documento->nombre_archivo})" . ($motivo ? ": {$motivo}" : ''),
            $ip
        );

        return true;
    }

    /**
     * Retorna las órdenes de exámenes pendientes para asociar en el formulario (CU25 -> CU26)
     *
     * @param int $idHistoria
     * @param User $usuario
     * @return array
     */
    public function obtenerOrdenesPendientes(int $idHistoria, User $usuario): array
    {
        $historia = HistoriaClinica::findOrFail($idHistoria);
        $this->validarAcceso($historia, $usuario, false);

        return OrdenExamen::where('id_historia_clinica', $idHistoria)
            ->where('estado', 'PENDIENTE')
            ->select(['id_orden', 'codigo_orden', 'tipo_estudio', 'nombre_estudio', 'fecha_emision'])
            ->orderByDesc('id_orden')
            ->get()
            ->toArray();
    }
}

<?php

namespace App\Packages\Security\Models;

/**
 * Clase puente de compatibilidad retroactiva: AuditLog -> Bitacora
 * Se mantiene para preservar retrocompatibilidad total sin romper llamadas existentes.
 * El modelo oficial del sistema es Bitacora.php (Mapea tabla 'bitacora' y clase 'Bitacora' del diagrama PUML).
 */
class AuditLog extends Bitacora
{
    // Hereda todas las propiedades, scopes y métodos de Bitacora
}

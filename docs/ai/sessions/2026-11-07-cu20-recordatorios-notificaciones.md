# Bitácora de Sesión: Implementación Full-Stack de CU20 (Enviar Recordatorios y Notificaciones)
**Fecha:** 07 de Noviembre de 2026  
**Autor:** Antigravity / Roberto  
**Caso de Uso:** CU20 — Enviar Recordatorios y Notificaciones (§3.4 / Cron)  
**Paquete:** Paquete 5: Integraciones Externas y Pagos (P5)  
**Actor Primario / Secundario:** Sistema (Planificador / Cron Scheduler)  
**Metodología:** PUDS / RUP  

---

## 1. Resumen Ejecutivo
Se implementó de punta a punta el Caso de Uso **CU20: Enviar Recordatorios y Notificaciones**, completando el **100% de los 24 Casos de Uso regulares del sistema** y el Paquete 5 (Integraciones Externas y Pagos).

El módulo resuelve dos vertientes fundamentales de comunicación clínica:
1. **Planificador Preventivo de 24 Horas (`RECORDATORIO_24H`):**
   - Tarea automatizada en segundo plano que examina citas en estado `PROGRAMADA` o `CONFIRMADA` en la ventana de las próximas 24 a 48 horas.
   - Aplica estricta regla de **idempotencia**: no genera recordatorios duplicados para citas que ya hayan sido notificadas preventivamente.
   - Envía el aviso simultáneo a la cuenta del paciente (con indicaciones previas de asistencia y documento de identidad) y a la agenda del profesional médico.
2. **Disparadores Desacoplados en el Ciclo de Vida Asistencial:**
   - **Confirmación de Reserva (`CONFIRMACION` - CU10):** Despachada automáticamente al momento en que recepción o el paciente agendan un turno.
   - **Alerta de Reprogramación (`REPROGRAMACION` - CU11):** Notifica inmediatamente al paciente y al médico la nueva fecha y hora con el motivo justificado.
   - **Aviso de Cancelación (`CANCELACION` - CU12):** Notifica la anulación del turno y la liberación del cupo.
   - **Comprobante de Pago Confirmado (`PAGO_EXITOSO` - CU21):** Certifica la garantía financiera de la cita tras abonar exitosamente con tarjeta vía Stripe Sandbox.

Con este hito, el proyecto alcanza **24 de 26 Casos de Uso completados (92.3% de avance global)**, restando únicamente las 2 reservas opcionales/condicionales (CU27-RES y CU28-OPC).

---

## 2. Cambios en Backend (`backend/app/Packages/Integrations/` y `Console/`)
1. **Modelo de Notificaciones:**
   - [`Notificacion.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Integrations/Models/Notificacion.php): Mapea la tabla relacional `notificaciones` con constantes de evento (`RECORDATORIO_24H`, `CONFIRMACION`, `REPROGRAMACION`, `CANCELACION`, `PAGO_EXITOSO`), scopes (`noLeidas`, `paraUsuario`, `porTipo`), accessor de tiempo relativo (`diffForHumans`) y método `marcarComoLeida()`.
2. **Modelo de Usuario:**
   - [`User.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Security/Models/User.php): Relación Eloquent `notificaciones()` HasMany registrada.
3. **Servicio Orquestador de Notificaciones:**
   - [`NotificationService.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Integrations/Services/NotificationService.php):
     - Resolutores automáticos de cuentas de usuario por clave foránea, correo electrónico o documento de identidad.
     - Métodos de despacho de eventos: `notificarCitaCreada`, `notificarCitaReprogramada`, `notificarCitaCancelada`, `notificarPagoCompletado`.
     - Motor central `ejecutarRecordatorios24h` con soporte para `--force` e idempotencia.
     - Métodos de consulta y mutación con validación Anti-IDOR (`listarNotificaciones`, `marcarComoLeida`, `marcarTodasComoLeidas`, `eliminarNotificacion`).
     - Auditoría inmutable en `Bitacora.php` (`RECORDATORIOS_24H_ENVIADOS`).
4. **Comando de Consola Artisan:**
   - [`SendAppointmentRemindersCommand.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Console/Commands/SendAppointmentRemindersCommand.php):
     - Firma: `php artisan appointments:send-reminders {--force} {--cita=ID}`.
     - Salida visual en consola con tabla formateada de citas evaluadas y notificaciones entregadas.
5. **Planificador de Laravel Schedule:**
   - [`backend/routes/console.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/routes/console.php): Tarea registrada con `Schedule::command('appointments:send-reminders')->dailyAt('08:00')->withoutOverlapping()`.
6. **Controlador REST:**
   - [`NotificationsController.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/app/Packages/Integrations/Controllers/NotificationsController.php):
     - `index`: Bandeja paginada con métricas y conteo de no leídas.
     - `unreadCount`: Endpoint ligero para el badge de la campana.
     - `markAsRead`: Marcar individualmente como leída con Anti-IDOR.
     - `markAllAsRead`: Marcar todas como leídas.
     - `destroy`: Eliminación con Anti-IDOR.
     - `triggerReminders`: Disparador manual para el personal administrativo y docente.
7. **Rutas API:**
   - [`backend/routes/api.php`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/backend/routes/api.php): 6 endpoints protegidos bajo `/api/notifications/` con middleware `web` y roles autorizados.
8. **Disparadores en Servicios Existentes:**
   - `AppointmentBookingService.php`: Dispara notificación automática al crear cita.
   - `AppointmentRescheduleService.php`: Dispara notificación automática al reprogramar cita.
   - `AppointmentsController.php`: Dispara notificación automática al cancelar cita.
   - `StripePaymentService.php`: Dispara notificación automática al confirmar pago con Stripe.

---

## 3. Cambios en Frontend (`frontend/src/apps/integrations/` y `components/`)
1. **Servicio API:**
   - [`notificationService.js`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/apps/integrations/services/notificationService.js): Métodos para consumo REST (`fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`, `triggerReminders`).
2. **Componente Interactivo:**
   - [`NotificationsDropdown.jsx`](file:///c:/Users/Roberto/Desktop/Examen%20parcial%202/parcial2/frontend/src/components/NotificationsDropdown.jsx):
     - Ubicado en el header superior permanente de `App.jsx`.
     - Badge numérico en tiempo real con animación de pulso cuando existen notificaciones no leídas.
     - Polling en segundo plano cada 30 segundos sin recargar la interfaz.
     - Pestañas de filtrado: *Todas*, *No leídas* y *Recordatorios 24h*.
     - Tarjetas de aviso enriquecidas con iconos específicos por tipo (`Clock` ámbar para recordatorios, `Calendar` para confirmaciones, `CalendarClock` para reprogramaciones, `CalendarX` rojo para cancelaciones y `CreditCard` esmeralda para pagos Stripe).
     - Acciones de marcar como leída al hacer clic, marcar todas con un clic y eliminar.
     - Botón de prueba docente **"Probar 24h Ahora"** con spinner de carga para disparar el Cron en vivo.

---

## 4. Verificaciones y Pruebas Realizadas
- `php -l`: Cero errores sintácticos en los 10 archivos PHP modificados.
- `php artisan appointments:send-reminders`: Ejecución limpia y sin excepciones.
- Script de prueba end-to-end con PostgreSQL: Creación de notificaciones, listado de bandeja, actualización a leída, y despacho idempotente verificado para médico y paciente.
- `npm run build`: Compilación de Frontend completada con **0 errores** (2050 módulos transformados en 690ms).

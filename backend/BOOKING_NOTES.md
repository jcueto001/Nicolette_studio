# Validación local de reservas

Con los emuladores arrancados y `LOCAL_FIREBASE_EMULATORS=1`:

    node migrate-bookings.js

Solo revisa registros y devuelve códigos/identificadores hash, sin datos de clientas. No corrige conflictos ni infiere duraciones históricas faltantes. Revisar los registros antes de continuar. Para aplicar exclusivamente al proyecto demo local:

    node migrate-bookings.js --apply-local

El backend rechaza nuevas reservas hasta que exista `BookingConfig/control` con `ready: true` y `version: 1`. La activación productiva queda bloqueada hasta una migración revisada y aplicación coordinada de las reglas; este script no acepta producción.

Los bloqueos administrativos requieren un servicio `Servicios/bloqueo` con duración y precio explícitos. No se inventa la duración de un bloqueo. El backend acepta inicios entre 09:00 y 21:00; no interpreta sobrecupo como atención simultánea. Disponibilidad pública devuelve solo horas.

`/api/flow/create` ahora requiere `requestId`, generado una sola vez por intento en el frontend y reutilizado en reintentos. Es necesario para no repetir llamadas de cobro. Las firmas públicas de StorageHelper se conservan; sus escrituras de citas delegan a endpoints autenticados y no tienen fallback offline.

Un pago verificado sin horario disponible crea `FinancialConflicts/{reservationId}` con estado `manual_review`, sin crear cita ni iniciar una devolución. Un fallo incierto al crear la orden no se reintenta automáticamente: la retención vence y la orden queda para reconciliación mediante webhook/retorno verificado o revisión manual.

Las reservas manuales y los cambios requieren ID token Firebase, rol vigente y revisión de cita; todas las escrituras de ocupación pasan por el servidor. No borrar documentos de `AgendaLocks` ni modificar `Citas` directamente: usar cancelación/reprogramación. Conservar la duración fijada en cada reserva.

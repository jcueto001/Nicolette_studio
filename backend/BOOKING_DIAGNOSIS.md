# Diagnóstico productivo: solo lectura

Desde la raíz, con Node 24 actualizado:

```powershell
node backend/diagnose-bookings.js --read-only --project nicolett-studio
```

Confirmar antes que `nicolett-studio` sea el proyecto correcto. El ID debe coincidir exactamente con `FIREBASE_PROJECT_ID`. El proceso necesita `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` en su entorno, idealmente de una cuenta dedicada con `roles/datastore.viewer`. No compartir claves en el chat, incorporarlas al repositorio ni descargar el conjunto de variables productivas de Vercel.

Usar una terminal separada sin `LOCAL_FIREBASE_EMULATORS`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST` ni `VERCEL`. El diagnóstico no carga `.env`, no usa ADC y no admite `--apply` ni `--apply-local`. No ejecutar el migrador local contra producción.

La fachada solo permite lecturas y la transacción real usa `readOnly: true`. Los snapshots no exponen referencias para escribir. Se reutilizan lecturas de catálogo y se limita cada consulta a 200 registros, con presupuesto aproximado de 1000 unidades de lectura; superar un límite bloquea el informe, sin considerarlo completo ni habilitar paginación automáticamente. Las lecturas productivas pueden generar consumo de cuota. No consulta Flow ni modifica estados de pago.

El informe contiene códigos, cantidades y referencias hash, sin nombres, teléfonos, correos ni importes individuales. Código de salida 0: sin incidencias detectadas; 2: requiere revisión; 1: diagnóstico bloqueado o incompleto. `canApply=true` no autoriza ni ejecuta una migración productiva: revisar también `productionWriteAuthorized=false` y `applied=false`.

Revisión posterior, sin correcciones automáticas:

- Solapamientos: José debe decidir qué atención conservar o reprogramar; no cancelar citas ni devolver pagos automáticamente.
- Duraciones/importes faltantes: recuperar evidencia histórica. Nunca sustituir por precios actuales ni inventar abonos o saldos.
- UID inconsistente: verificar la identidad del personal y documentar la correspondencia; no asignar por nombre o correo.
- Pagos/retenciones pendientes y conflictos financieros: conciliar antes del corte, preservando webhooks y comprobantes.

Mantener `BOOKING_PAUSED=true`. Antes de autorizar escrituras: respaldo verificable, plan por documento con IDs e historia conservados, nueva revisión tras pausar las entradas actuales y estrategia de recuperación. La aplicación productiva permanece sin implementar; no crear manualmente `BookingConfig/control` para forzar la activación.

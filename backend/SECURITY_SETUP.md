# Configuración de pagos del servidor

Vercel utiliza Node.js 24.x y la raíz del repositorio como Root Directory. Mantener el preset sin framework (Other) y la salida estática actual de la SPA; no cambiarla a `backend/`. `vercel.json` instala ambos lockfiles mediante `npm ci` y conserva `/api/*` → `api/index.js` → Express. Firebase Admin se declara también en el manifiesto raíz (14.5.1, misma versión que el lockfile del backend) para que sea una dependencia directa del proyecto que publica `api/index.js`; se conserva la declaración del backend para su instalación independiente. Se carga exclusivamente en servidor. Incluir ambos lockfiles al publicar los cambios.

El script raíz `vercel-build` verifica las importaciones modulares de Admin y la entrada Express, sin consultar Firebase ni Flow. Vercel debe ejecutar ese script durante el build; no configurar `npm start` como Build Command. Esta comprobación detecta módulos ausentes antes de publicar la función. Si persiste un error de empaquetado, revisar el artefacto de Vercel y Build Logs; una importación local no garantiza por sí sola el contenido del artefacto remoto.

Node.js 22 no cumple los requisitos de todas las dependencias bloqueadas: `@firebase/database@1.1.6` y `@firebase/database-compat@2.1.8` requieren Node >=24.12.0. Aunque las pruebas funcionales pasan en Node 22, no se considera una combinación soportada. Se selecciona Node 24.x sin cambiar versiones de dependencias; si fuera obligatorio mantener Node 22, habría que autorizar y probar una selección distinta de esas dependencias.

Instalar desde la raíz con Node.js 24 actualizado (>=24.12.0):

    npm ci --no-audit --no-fund
    npm --prefix backend ci --no-audit --no-fund
    npm --prefix backend test

Para arrancar localmente, iniciar primero los emuladores y activar `LOCAL_FIREBASE_EMULATORS=1`. Nunca usar credenciales productivas en pruebas locales. Desde `backend/`:

    npm ci
    npm test
    npm start

Configurar mediante el gestor de secretos del entorno de ejecución:

- `FLOW_API_KEY` y `FLOW_SECRET_KEY`: credenciales de la cuenta del comercio.
- `FLOW_SANDBOX`: `true` para pruebas; `false` para pagos reales.
- `BACKEND_URL`: origen HTTPS público y fijo de esta aplicación. Se admite HTTP únicamente para localhost.
- Firebase Admin usa `cert()` con `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`. Normaliza los saltos de línea escapados de la clave y rechaza configuración incompleta al inicializar, sin fallback a ADC. Reutiliza la instancia del servidor. Configurar estos valores solo en el entorno servidor; nunca incluir claves en archivos públicos, repositorio ni variables con prefijos públicos.
- `BOOKING_PAUSED`: activar con `true` durante la preparación. Bloquea nuevas órdenes y reservas manuales; mantiene webhooks, retornos, verificación y consultas de pagos existentes. Cambiar una variable de Vercel requiere un nuevo despliegue para aplicarla; no cancela pagos ni libera retenciones.
- `FRONTEND_URL`: retorno del respaldo Webpay, si se mantiene habilitado.

## Correo de la cita

El retorno conserva el comprobante solo durante el arranque de la página de pago; logout y cambio posterior de usuario siguen eliminándolo. La etiqueta `flow-success` de la URL no acredita un pago: se consulta siempre el estado al backend con el comprobante.

El backend puede enviar la confirmación con EmailJS después de verificar pago y cita. Configurar exclusivamente en Vercel `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` y `EMAILJS_PRIVATE_KEY`; habilitar el uso del API desde servidor en EmailJS. La clave privada nunca pertenece al frontend. Se conserva el template existente y el destinatario proviene de la cita guardada, no del navegador.

`AppointmentNotifications/{reservationId}` evita envíos automáticos duplicados entre webhook, retorno y consulta de estado. Sin configuración queda `pending_configuration`; un fallo del correo no cambia el pago ni elimina la cita. Un envío iniciado con resultado incierto requiere revisión manual del historial de EmailJS antes de reintentarlo; no se promete entrega exactamente una vez. El endpoint del proveedor tiene límites de frecuencia y cuota: un rechazo se registra para revisión, sin reintento automático. Las claves y respuestas del proveedor no se imprimen. Ver https://www.emailjs.com/docs/rest-api/send/.

## Preview aislado

José debe seleccionar el alcance Preview al configurar variables. Usar un proyecto Firebase de prueba separado y una cuenta de servicio limitada a ese proyecto; el frontend Preview también debe apuntar a ese proyecto de prueba. El frontend actual contiene configuración fija: no promover ni probar accesos Firebase en Preview mientras siga apuntando a producción. No copiar secretos productivos ni descargar variables de producción.

Mantener `BOOKING_PAUSED=true`, `FLOW_SANDBOX=true` y omitir las claves Flow si no se probarán pagos. Para una validación posterior de Flow, usar exclusivamente claves sandbox y un `BACKEND_URL` HTTPS estable del Preview; garantizar que la protección del despliegue no impida recibir `/api/flow/notify`. No enviar pagos ni conectar al Firebase real durante las pruebas locales de configuración. Vercel no debe tener `LOCAL_FIREBASE_EMULATORS`, `FIRESTORE_EMULATOR_HOST` ni `FIREBASE_AUTH_EMULATOR_HOST` activados; esos hosts solo funcionan en el equipo local.

Verificar en Preview la carga estática y `/api/flow/config`; después, con autorización independiente, probar el proyecto de prueba y sandbox. Confirmar 503 en nuevas órdenes durante la pausa y que webhooks/consultas alcanzan su validación normal. La migración productiva continúa bloqueada: el script disponible solo admite emuladores.

El navegador usa el backend del mismo origen. Las claves no se reciben del cliente ni se incorporan a URLs. Las transacciones se guardan en `FlowTransactions`; solo el servidor escribe la cita pagada en `Citas` mediante una transacción idempotente. El retorno y el webhook consultan Flow; el navegador solo consulta el resultado con un comprobante aleatorio de su sesión.

Sin configuración válida, los pagos fallan de forma cerrada. Los servicios y profesionales deben existir en Firestore y usar sus IDs de documento; un servicio debe tener `price` o `precio` numérico de al menos 5000 CLP.

Antes de habilitar en producción, rotar las claves utilizadas con el flujo anterior y eliminar sus copias en `Configuracion/flow`, historiales y registros. Revisar y aplicar por separado `../firestore.rules`: es una propuesta local y no protege la base hasta desplegarse. Verificar los UID reales de personal (`Usuarios/{uid}`), la asignación `profId` de fichas/citas y los permisos IAM de la cuenta del servidor. La política restringe accesos antiguos por nombre/correo e impide lectura pública de citas y fichas.

Las pruebas usan Flow y Firestore simulados; no validan reglas desplegadas, credenciales ni un pago real. La prueba de arranque carga las dependencias reales y solo consulta localhost.

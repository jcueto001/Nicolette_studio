# Manual técnico de Nicolett Studio Fantasy

Este documento describe cómo se relacionan la interfaz, el servidor y Firebase. La configuración operativa del backend está en `backend/README.md` y el detalle de las colecciones en `DATABASE_SCHEMA.md`.

## Componentes

La interfaz se carga desde `index.html`. `AppRouter`, definido en `js/app.js`, cambia el contenido de la vista sin recargar toda la página. `js/main.js` conecta los formularios, los botones y los eventos de inicio.

Los archivos de `js/modules/` agrupan funciones de citas, clientas, inventario, autenticación y elementos de interfaz. `StorageHelper`, en `js/mockData.js`, mantiene el estado utilizado por las vistas y coordina el acceso a Firebase y a la API.

El servidor Express se encuentra en `backend/server.js`. En Vercel se carga desde `api/index.js`; las solicitudes bajo `/api/` se dirigen a esa entrada según `vercel.json`.

## Reservas y abonos

La clienta elige el servicio, la profesional, la fecha y la hora, e ingresa sus datos de contacto. La disponibilidad se consulta al backend. El servidor valida el catálogo y la ocupación del horario antes de crear la solicitud de pago.

El abono del flujo de reservas con Flow es de $5.000 CLP. Las credenciales se leen desde variables de entorno del servidor. El navegador no determina el importe ni confirma el pago.

Flow devuelve a la clienta a `/api/flow/return` y puede notificar al servidor mediante `/api/flow/notify`. El backend consulta el estado al proveedor y registra el resultado. Los identificadores de las operaciones permiten procesar solicitudes repetidas sin crear otra reserva por el mismo pago.

Si un pago llega cuando el horario ya no puede asignarse, el caso queda para revisión. Un error de correo no elimina la cita ni cambia el estado del pago.

Las rutas alternativas de Webpay se encuentran en `backend/server.js`.

## Acceso del personal

Firebase Authentication verifica las cuentas. Los roles se consultan en `Usuarios/{uid}`; una sesión guardada en el navegador no acredita permisos.

Administración puede gestionar la agenda y los registros del salón. Las profesionales acceden a la información que les corresponde por asignación. Las reglas de Firestore y las validaciones del servidor aplican estas restricciones en las operaciones correspondientes.

El cierre de sesión y los cambios de usuario invalidan los datos privados de la sesión anterior. Los errores de autenticación no habilitan acceso con contraseñas locales.

`reset-password.html` permite completar el restablecimiento de contraseña mediante Firebase Authentication.

## Acceso de clientas

La personalización del navegador conserva nombre y datos de contacto para facilitar el uso de los formularios. Esos datos no autorizan la consulta de citas ni de fichas.

La consulta de citas utiliza un código enviado al correo de la clienta. Tras verificarlo, el servidor establece una cookie HttpOnly con vencimiento. Este acceso es independiente de la cuenta del personal.

## Fichas e inventario

Las fichas registran la atención, el servicio, la profesional y los datos técnicos del procedimiento. Su guardado pasa por la API, que comprueba la identidad y los permisos antes de aplicar la operación.

El servicio de fichas coordina el registro de los insumos utilizados y su descuento de inventario. Los identificadores de operación permiten reconocer reintentos y evitar descuentos duplicados.

## Galería

La galería pública muestra trabajos aprobados. Las profesionales pueden aportar fotografías propias pendientes de aprobación. Administración revisa las publicaciones y gestiona el contenido según los permisos definidos en `firestore.rules`.

## Datos y caché

Firestore almacena los registros compartidos. StorageHelper mantiene datos en memoria para las vistas y utiliza almacenamiento local para el catálogo público y la personalización.

El almacenamiento local no sustituye la autenticación ni permite confirmar reservas sin conexión. La aplicación necesita conexión para las operaciones del servidor y la consulta de información privada.

## Configuración y despliegue

El proyecto declara Node.js 24 en sus archivos `package.json`. Vercel instala las dependencias de la raíz y del backend mediante `npm ci`, según `vercel.json`.

La configuración pública de Firebase está en `js/firebase-config.js`. Las claves privadas de Firebase Admin, Flow y EmailJS se configuran únicamente en el entorno del servidor.

El archivo `firestore.rules` contiene las reglas del repositorio. Un cambio local solo afecta al entorno remoto después de desplegar esas reglas en el proyecto correspondiente.

HTTPS/TLS protege el tráfico en tránsito. Las mediciones de rendimiento y las validaciones visuales deben registrarse con su fecha y entorno; no se deducen de la tecnología utilizada.

## Verificación

La suite del backend cubre reservas, pagos simulados, sesiones, permisos, fichas, inventario y escape de contenido, entre otros casos. La prueba de integración real está en `backend/booking.integration.test.js` y requiere los emuladores.

Para preparar una entrega se deben revisar también las vistas en móvil y escritorio, la configuración del entorno y los resultados del despliegue. Una comprobación de sintaxis o una prueba con dobles no reemplaza estas verificaciones.

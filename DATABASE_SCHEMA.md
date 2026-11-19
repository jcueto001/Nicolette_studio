# Datos de Nicolett Studio Fantasy

La aplicación utiliza Cloud Firestore. Este documento describe las colecciones referenciadas en el código y sus responsabilidades. No representa un inventario de los documentos existentes en producción ni fija cantidades de servicios o profesionales.

La configuración pública del proyecto está en `js/firebase-config.js`. El backend utiliza Firebase Admin con credenciales del entorno servidor. Las reglas de acceso del navegador están en `firestore.rules`.

## Catálogo y personal

| Colección | Contenido | Acceso del navegador según las reglas |
|---|---|---|
| `Servicios` | Nombres, categorías, precios, duración y descripción de los servicios | Lectura pública; escritura de administración |
| `Categorias` | Etiquetas e iconos que organizan los servicios | Lectura pública; escritura de administración |
| `Perfiles` | Opciones de personalización del catálogo | Lectura pública; escritura de administración |
| `Profesionales` | Información de las especialistas y su relación con la agenda | Lectura pública; escritura de administración |
| `Usuarios` | Rol y estado de las cuentas del personal, con el UID de Auth como ID | Lectura propia o de administración; escritura de administración |

La información incluida en las colecciones públicas debe ser apta para mostrarse a visitantes. La configuración web de Firebase identifica el proyecto; los permisos dependen de Authentication y de las reglas.

## Atención y contenido

| Colección | Contenido | Acceso del navegador según las reglas |
|---|---|---|
| `Citas` | Clienta, servicio, profesional, horario, estado y datos del abono | Lectura por administración o profesional asignada; modificación directa limitada a notas |
| `FichasClientas` | Datos técnicos de la atención y consumo asociado | Lectura por administración o profesional asignada; guardado mediante backend |
| `Inventario` | Productos, existencias y umbral de stock | Lectura del personal; escritura de administración |
| `Galeria` | Fotografías, autora y estado de aprobación | Lectura pública de aprobadas; aportes y gestión según rol |
| `perfil_cliente` | Registros de acceso de clientas y posibles datos anteriores | Acceso directo limitado a administración; consulta de citas mediante backend |
| `FichasClinicas` | Colección contemplada en las reglas para acceso administrativo | Lectura y escritura de administración |

La asignación se comprueba con `profId` y el UID autenticado. La vinculación entre la profesional del catálogo y su cuenta se gestiona desde `backend/professional-identity.js`.

## Reservas y pagos

Estas colecciones no permiten acceso directo del navegador. El servidor las utiliza para coordinar las operaciones.

| Colección | Propósito |
|---|---|
| `Reservas` | Estado de las reservas y retenciones |
| `AgendaLocks` | Ocupación de intervalos por profesional y fecha |
| `BookingRequests` | Identificación de solicitudes para reconocer reintentos |
| `BookingConfig` | Configuración del proceso de reservas |
| `FlowOrders` | Relación entre una orden de Flow y una reserva |
| `FlowTransactions` | Relación entre la transacción verificada y la reserva |
| `FinancialConflicts` | Pagos que requieren revisión por un conflicto de asignación |
| `BookingMigrationArchive` | Registros conservados por las herramientas de migración |

El servicio de reservas calcula los intervalos usando `America/Santiago`. Las fechas se normalizan a `YYYY-MM-DD` y las horas utilizan `HH:mm`. Los importes del flujo de pago se expresan en pesos chilenos.

El catálogo aporta el precio y la duración del servicio. El backend determina el abono y verifica el importe, la moneda y la orden antes de confirmar. No se debe reconstruir un pago histórico usando únicamente el catálogo actual.

## Operaciones de fichas y correo

| Colección | Propósito |
|---|---|
| `ConsumosInventario` | Registro del consumo de productos por atención |
| `FichaOperations` | Identificación de operaciones para evitar descuentos repetidos |
| `AppointmentNotifications` | Estado del envío de confirmación de una cita |
| `AppointmentEmailRequests` | Control de reintentos y solicitudes de reenvío |

Estas colecciones se escriben desde el servidor. Un resultado incierto del proveedor de correo requiere revisar el envío antes de solicitar otro; el estado de la notificación no acredita un pago.

## Configuración y compatibilidad

`Configuracion` está cerrada al navegador. Las credenciales actuales de Flow se leen desde variables de entorno del servidor; el documento histórico `Configuracion/flow` no debe utilizarse como almacén público de claves.

El código admite algunos nombres de campos de registros anteriores. Para una modificación o migración, revisar las normalizaciones de `backend/booking-service.js`, `backend/ficha-service.js` y `js/mockData.js`. Este resumen no sustituye los validadores ni define un esquema JSON exhaustivo.

## Reglas de acceso

Las reglas del repositorio permiten consultar catálogos públicos y restringen los datos de atención según el rol y la asignación. Las colecciones no autorizadas expresamente quedan denegadas.

Firebase Admin ejecuta las operaciones del servidor sin aplicar las reglas del SDK cliente. Por eso las rutas privadas también verifican identidad, rol y asignación antes de acceder a los datos.

Guardar cambios en `firestore.rules` no actualiza por sí solo las reglas remotas. La prueba con emuladores permite verificar la propuesta local antes de desplegarla en el entorno elegido.

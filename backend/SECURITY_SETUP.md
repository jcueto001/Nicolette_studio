# Configuración de pagos del servidor

Requiere Node.js 22 o posterior. Instalar y probar desde `backend/`:

    npm ci
    npm test
    npm start

Configurar mediante el gestor de secretos del entorno de ejecución:

- `FLOW_API_KEY` y `FLOW_SECRET_KEY`: credenciales de la cuenta del comercio.
- `FLOW_SANDBOX`: `true` para pruebas; `false` para pagos reales.
- `BACKEND_URL`: origen HTTPS público y fijo de esta aplicación. Se admite HTTP únicamente para localhost.
- Firebase Admin usa Application Default Credentials con acceso al proyecto correcto. No colocar archivos de credenciales dentro de la carpeta pública ni del repositorio.

El navegador usa el backend del mismo origen. Las claves no se reciben del cliente ni se incorporan a URLs. Las transacciones se guardan en `FlowTransactions`; solo el servidor escribe la cita pagada en `Citas` mediante una transacción idempotente. El retorno y el webhook consultan Flow; el navegador solo consulta el resultado con un comprobante aleatorio de su sesión.

Sin configuración válida, los pagos fallan de forma cerrada. Los servicios y profesionales deben existir en Firestore y usar sus IDs de documento; un servicio debe tener `price` o `precio` numérico de al menos 5000 CLP.

Antes de habilitar en producción, rotar las claves utilizadas con el flujo anterior y eliminar sus copias en `Configuracion/flow`, historiales y registros. Revisar y aplicar por separado `../firestore.rules`: es una propuesta local y no protege la base hasta desplegarse. Verificar los UID reales de personal (`Usuarios/{uid}`), la asignación `profId` de fichas/citas y los permisos IAM de la cuenta del servidor. La política restringe accesos antiguos por nombre/correo e impide lectura pública de citas y fichas.

Las pruebas usan Flow y Firestore simulados; no validan reglas desplegadas, credenciales ni un pago real. La prueba de arranque carga las dependencias reales y solo consulta localhost.

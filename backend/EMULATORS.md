# Entorno local aislado

Requiere Firebase CLI y Java compatible con Firestore Emulator (recomendado Java 21 o superior). No se instalan automáticamente. No requiere login de Firebase ni cuentas de servicio: usar siempre `demo-nicolett`.

Terminal PowerShell 1:

    cd C:\Users\Usuario\Nicolette_studio
    firebase emulators:start --only auth,firestore --project demo-nicolett

Terminal PowerShell 2:

    cd C:\Users\Usuario\Nicolette_studio\backend
    $env:LOCAL_FIREBASE_EMULATORS="1"
    npm start

Abrir http://127.0.0.1:3000 y la UI en http://127.0.0.1:4000. Usar exclusivamente este servidor para la SPA local: sirve una configuración Compat alternativa sin modificar `js/firebase-config.js`. Incluye apps secundarias y la página de restablecimiento de contraseña. No abrir con file:// ni con otro servidor estático.

El backend fija Auth en 127.0.0.1:9099, Firestore en 127.0.0.1:8080 y el proyecto demo. No utiliza archivos de credenciales ni claves Flow en este modo; las rutas de pagos externos están bloqueadas. Comprueba ambos puertos al arrancar y en cada solicitud. Si uno falta devuelve error, sin recurrir a producción; el SDK ya cargado sigue apuntando solo a localhost. El SDK puede conservar operaciones locales pendientes al desconectarse, pero nunca reenviarlas a producción.

Sin el flag, el servidor de desarrollo bloquea la configuración Firebase real para solicitudes localhost. El modo local se rechaza en Vercel o con NODE_ENV=production. No establecer el flag ni variables de emulación en producción.

Los datos de prueba se crean desde Emulator UI: usar usuarios ficticios y `Usuarios/{uid}` con roles autorizados, además del catálogo requerido. Las reglas locales se cargan desde `firestore.rules`; Admin SDK las omite, como sucede normalmente. No importar datos productivos.

Pruebas sin servicios reales:

    node --test emulators.test.js security.test.js xss.test.js

Las pruebas unitarias de configuración usan dobles, no acreditan una sesión real en Firebase Emulator. La integración real necesita las herramientas indicadas y ambos emuladores arrancados. El navegador continúa descargando librerías CDN; este modo aísla Firebase y bloquea pagos externos, no convierte la SPA en una aplicación sin conexión.

# Contexto de desarrollo de Nicolett Studio Fantasy

Resumen para retomar el trabajo con una herramienta de asistencia. La implementación y los archivos de configuración deben consultarse antes de proponer cambios; este documento puede quedar desactualizado.

## Proyecto

Nicolett Studio Fantasy es una aplicación web para un salón de belleza de Buin. Forma parte del proyecto Capstone APT 2026 de Duoc UC, grupo 9. José Cueto Moreira trabaja en frontend y cumple el rol de Scrum Master. Benjamín Moya Meza trabaja en backend y cumple el rol de Product Owner.

El sitio del proyecto es https://nicolette-studio.vercel.app y el repositorio es https://github.com/jcueto001/Nicolette_studio.

## Implementación

La interfaz utiliza HTML, CSS y JavaScript. `js/app.js` contiene AppRouter y las vistas; `js/main.js` conecta los eventos. Los módulos de `js/modules/` reúnen funciones de citas, clientas, inventario, autenticación e interfaz.

`js/mockData.js` contiene StorageHelper y participa en el acceso a datos real. Su nombre no significa que sea únicamente un archivo de ejemplos.

El backend utiliza Node.js 24, Express y Firebase Admin. `backend/server.js` define las rutas y `api/index.js` lo expone en Vercel. Las reservas, fichas, acceso de clientas, correos y vinculación de profesionales tienen servicios propios en `backend/`.

## Datos y permisos

Firebase Authentication autentica al personal. `Usuarios/{uid}` define su rol. Las profesionales consultan datos asignados a su UID; administración tiene permisos más amplios. Revisar `firestore.rules` y `backend/staff-auth.js` al modificar accesos.

La personalización local del navegador no autoriza la consulta de información privada. El acceso de clientas a sus citas requiere verificar un código por correo y utiliza una cookie HttpOnly emitida por el backend.

No existe autenticación de contingencia con contraseñas guardadas localmente. El catálogo público y la personalización pueden usar almacenamiento local; las operaciones privadas necesitan autorización.

## Reservas

El flujo de Flow utiliza un abono de $5.000 CLP. El servidor consulta el catálogo, comprueba disponibilidad, crea la orden y verifica el pago con el proveedor. Una etiqueta de éxito en la URL no confirma una reserva.

Conservar la identificación de solicitudes y las validaciones de reintentos al modificar pagos o consumo de inventario. Las credenciales privadas pertenecen al entorno del servidor.

## Trabajo local y pruebas

El equipo trabaja con PowerShell. Ejecutar los comandos dependientes por separado y revisar su resultado antes de continuar.

Usar los emuladores con `demo-nicolett` siguiendo `backend/EMULATORS.md`. No utilizar datos ni credenciales de producción para pruebas locales.

La suite se ejecuta desde la raíz con `npm --prefix backend test`. La integración real con Firebase requiere los emuladores y su configuración específica. Las pruebas simuladas no acreditan un pago real ni las reglas remotas.

## Documentación de referencia

- `README.md`: presentación e inicio.
- `DOCUMENTACION.md`: funcionamiento y componentes.
- `DATABASE_SCHEMA.md`: colecciones y acceso a datos.
- `HANDOFF_TECNICO.md`: continuidad y preparación de entregas.
- `backend/README.md`: rutas y variables del servidor.
- `backend/SECURITY_SETUP.md`: preparación del entorno y seguridad.

Al comunicar resultados, indicar qué se modificó y cómo se comprobó. No declarar rendimiento, despliegue o requisitos aprobados sin evidencia de la verificación correspondiente.

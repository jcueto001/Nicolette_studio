# Continuidad técnica de Nicolett Studio Fantasy

Este documento reúne la información necesaria para continuar el desarrollo y preparar una entrega. El funcionamiento de la aplicación se describe en `DOCUMENTACION.md`.

## Datos del proyecto

| Dato | Detalle |
|---|---|
| Institución | Duoc UC |
| Asignatura | Capstone APT 2026, sección 003-D |
| Equipo | Grupo 9 |
| Docente guía | Paz Constanza Morales Saavedra |
| Frontend y Scrum Master | José Cueto Moreira |
| Backend y Product Owner | Benjamín Moya Meza |
| Cliente | Nicolett Studio Fantasy, Buin |
| Sitio | https://nicolette-studio.vercel.app |
| Repositorio | https://github.com/jcueto001/Nicolette_studio |

## Ubicación de los cambios

| Trabajo | Archivos principales |
|---|---|
| Navegación y vistas | `js/app.js` |
| Formularios y eventos | `js/main.js` |
| Estado y acceso a datos del navegador | `js/mockData.js` |
| Autenticación del personal | `js/modules/auth.js`, `backend/staff-auth.js` |
| Reservas y disponibilidad | `backend/booking-service.js`, `js/modules/citas.js` |
| Fichas y consumo de insumos | `backend/ficha-service.js`, `js/modules/clientas.js` |
| Acceso de clientas | `backend/client-profile.js`, `js/client-profile.js` |
| Confirmaciones por correo | `backend/appointment-email.js` |
| Vinculación de profesionales | `backend/professional-identity.js` |
| Rutas de la API | `backend/server.js` |
| Permisos de Firestore | `firestore.rules` |

## Requisitos y evidencia

| Requisito | Área de implementación |
|---|---|
| RF-01 y RF-02 | Autenticación, roles y gestión del personal |
| RF-03 y RF-04 | Reservas y agenda por profesional |
| RF-05 | Abono de reserva con Flow |
| RF-06 | Confirmaciones por correo |
| RF-07 y RF-08 | Fichas de atención y campos técnicos |
| RF-09 y RF-10 | Catálogo de productos, inventario y consumo de insumos |
| RNF-01 y RNF-02 | Identidad visual y adaptación de las vistas |
| RNF-03 | Rendimiento, sujeto a medición |
| RNF-04 | Reglas de Firestore y permisos en el servidor |
| RNF-05 | Transporte mediante HTTPS/TLS |

La existencia de una implementación no acredita por sí sola la aprobación del requisito. La entrega debe acompañarse de los resultados de pruebas, las mediciones y las validaciones que correspondan.

## Desarrollo local

Usar el entorno descrito en `backend/EMULATORS.md`, con el proyecto `demo-nicolett`. Este modo sustituye la configuración Firebase del navegador y bloquea pagos externos.

Los datos de prueba deben ser ficticios. El entorno local no necesita credenciales de producción.

## Preparación de una entrega

1. Revisar los cambios con `git diff` y comprobar qué archivos se incluirán.
2. Ejecutar `npm --prefix backend test` desde la raíz.
3. Ejecutar la integración con emuladores cuando se modifiquen reglas, permisos o reservas.
4. Revisar las vistas afectadas en móvil y escritorio.
5. Comprobar las variables del entorno de destino y las reglas que se desplegarán.
6. Revisar el resultado del despliegue y registrar la evidencia de validación.

Si cambian estilos o scripts, revisar las versiones de sus referencias en `index.html` para que el navegador solicite los archivos actualizados.

## Resultado de la revisión del 18 de noviembre de 2026

La suite del backend terminó con 133 pruebas aprobadas, ninguna fallida y una omitida. La prueba omitida requiere Firestore y Auth Emulator reales. Esta ejecución no comprobó pagos reales, credenciales de producción ni las reglas publicadas en Firebase.

## Mantenimiento

Conviene separar gradualmente las vistas y los eventos concentrados en `js/app.js` y `js/main.js` cuando se trabaje en esas áreas. Los cambios deben conservar las validaciones de sesión, los identificadores de operación y el comportamiento de reintentos.

El diagnóstico de reservas y la migración tienen instrucciones propias en los documentos de `backend/`. Revisarlas antes de ejecutar herramientas que modifiquen datos.

El historial de cambios se consulta en Git. Los parámetros de versión de los recursos del navegador sirven para gestionar caché y no sustituyen ese historial.

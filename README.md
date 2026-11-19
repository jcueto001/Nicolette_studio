# Nicolett Studio Fantasy

Aplicación web para consultar los servicios del salón, reservar horas con un abono de $5.000 y gestionar la agenda, las fichas de atención y el inventario.

Proyecto de título Capstone APT 2026, Duoc UC, sección 003-D, grupo 9.

## Equipo

| Integrante | Responsabilidad |
|---|---|
| José Cueto Moreira | Scrum Master y desarrollo frontend |
| Benjamín Moya Meza | Product Owner y desarrollo backend |

Docente guía: Paz Constanza Morales Saavedra. Cliente: Nicolett Studio Fantasy, Buin, Región Metropolitana.

[Sitio del proyecto](https://nicolette-studio.vercel.app) · [Repositorio](https://github.com/jcueto001/Nicolette_studio)

## Funciones

- Catálogo de servicios, precios y profesionales.
- Consulta de disponibilidad y reserva con abono mediante Flow.
- Acceso del personal con Firebase Authentication y permisos por rol.
- Agenda, fichas de atención, consumo de insumos e inventario.
- Galería de trabajos con aprobación de administración.
- Consulta de citas de la clienta mediante un código enviado a su correo.

## Tecnologías

La interfaz utiliza HTML, CSS y JavaScript. El servidor está desarrollado con Node.js 24 y Express. Firebase Authentication gestiona las cuentas del personal y Firestore almacena los datos. Los pagos de reservas se verifican en el servidor con Flow y las notificaciones de citas utilizan EmailJS.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Página principal y contenedor de las vistas |
| `reset-password.html` | Recuperación de contraseñas |
| `css/` e `img/` | Estilos e imágenes |
| `js/app.js` | Navegación y generación de vistas |
| `js/main.js` | Eventos e inicialización de la interfaz |
| `js/mockData.js` | Acceso a datos y estado de la sesión mediante StorageHelper |
| `js/modules/` | Funciones de citas, clientas, inventario, autenticación e interfaz |
| `backend/` | API, servicios y pruebas |
| `api/index.js` | Entrada del servidor para Vercel |
| `firestore.rules` | Reglas de acceso a Firestore |
| `vercel.json` | Instalación y rutas del despliegue |

## Desarrollo local

Instalar las dependencias desde la raíz:

```powershell
npm ci
npm --prefix backend ci
```

El entorno local utiliza los emuladores de Firebase con el proyecto `demo-nicolett`. Las instrucciones de inicio y los requisitos están en [backend/EMULATORS.md](backend/EMULATORS.md).

## Pruebas

```powershell
npm --prefix backend test
```

La integración con emuladores reales requiere una ejecución adicional. Las pruebas con servicios simulados no comprueban credenciales, pagos reales ni reglas desplegadas.

## Documentación

| Documento | Propósito |
|---|---|
| [DOCUMENTACION.md](DOCUMENTACION.md) | Funcionamiento, componentes y acceso a datos |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Colecciones y criterios de almacenamiento |
| [HANDOFF_TECNICO.md](HANDOFF_TECNICO.md) | Continuidad del desarrollo y verificación de la entrega |
| [backend/README.md](backend/README.md) | API y configuración del servidor |
| [backend/SECURITY_SETUP.md](backend/SECURITY_SETUP.md) | Configuración de seguridad y preparación del entorno |

El archivo `AI_CONTEXT_PROMPT.md` conserva un resumen de trabajo para consultas asistidas durante el desarrollo.

# Servidor de Nicolett Studio Fantasy

API Express para reservas, verificación de pagos, fichas de atención, acceso de clientas y confirmaciones por correo. El punto de entrada es `server.js`; Vercel lo carga a través de `../api/index.js`.

## Instalación y pruebas

Desde la raíz del repositorio:

```powershell
npm ci
npm --prefix backend ci
npm --prefix backend test
```

El proyecto declara Node.js 24. Para iniciar la aplicación local con Firebase aislado, seguir [EMULATORS.md](EMULATORS.md). Ese modo bloquea los pagos externos y utiliza el proyecto `demo-nicolett`.

## Variables del servidor

| Variable | Uso |
|---|---|
| `PORT` | Puerto local; por defecto, 3000 |
| `FIREBASE_PROJECT_ID` | Proyecto de Firebase Admin |
| `FIREBASE_CLIENT_EMAIL` | Correo de la cuenta de servicio |
| `FIREBASE_PRIVATE_KEY` | Clave privada de la cuenta de servicio |
| `FLOW_API_KEY` | Clave de acceso a Flow |
| `FLOW_SECRET_KEY` | Clave para la firma de solicitudes Flow |
| `FLOW_SANDBOX` | Usa sandbox salvo que el valor sea `false` |
| `BACKEND_URL` | Origen público del servidor para retornos y notificaciones |
| `FRONTEND_URL` | Retorno de las rutas alternativas de Webpay |
| `BOOKING_PAUSED` | Con `true`, pausa nuevas reservas y órdenes |
| `EMAILJS_SERVICE_ID` | Servicio de correo |
| `EMAILJS_TEMPLATE_ID` | Plantilla de confirmación de cita |
| `EMAILJS_PUBLIC_KEY` | Identificador público utilizado por el envío del servidor |
| `EMAILJS_PRIVATE_KEY` | Credencial privada de EmailJS |
| `EMAILJS_CLIENT_ACCESS_TEMPLATE_ID` | Plantilla del código de acceso de clientas |
| `CLIENT_PROFILE_SECRET` | Secreto de al menos 32 caracteres para el acceso de clientas |

Las credenciales se configuran en el entorno del servidor. No se reciben desde el panel del navegador. `BACKEND_URL` requiere HTTPS, con la excepción local prevista en el código.

El archivo `.env.example` contiene un ejemplo parcial de las variables de Flow; no reemplaza esta lista ni la configuración de Firebase Admin y correo.

## Rutas principales

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/bookings/availability` | Consultar disponibilidad |
| POST | `/api/bookings/manual` | Registrar una reserva desde el personal autorizado |
| PATCH | `/api/bookings/:id` | Cambiar una cita con verificación de permisos |
| GET | `/api/flow/config` | Consultar si Flow está configurado y su entorno |
| POST | `/api/flow/create` | Crear una solicitud de pago de reserva |
| GET | `/api/flow/status/:token` | Verificar el pago con el comprobante de sesión |
| GET o POST | `/api/flow/return` | Procesar el retorno de Flow |
| POST | `/api/flow/notify` | Recibir una notificación de Flow |
| POST | `/api/bookings/:id/email` | Solicitar un reenvío autorizado de confirmación |
| POST | `/api/fichas` | Guardar una ficha y su consumo de insumos |
| POST | `/api/professionals/:id/link-account` | Vincular una profesional con su cuenta |
| POST | `/api/client-profile/code` | Solicitar un código de acceso por correo |
| POST | `/api/client-profile/verify` | Verificar el código y establecer la sesión |
| GET | `/api/client-profile/appointments` | Consultar las citas de la clienta verificada |
| POST | `/api/client-profile/logout` | Cerrar el acceso de la clienta |
| POST | `/api/webpay/create` | Crear una transacción con la integración alternativa |
| GET | `/api/webpay/commit` | Procesar el retorno de Webpay |

## Pago de reservas con Flow

El backend obtiene el precio y la duración desde el catálogo, valida la disponibilidad y crea la orden con un abono de $5.000. Firma los parámetros con HMAC-SHA256 y devuelve la dirección del proveedor al navegador.

El retorno, la notificación y la consulta de estado verifican el pago en Flow. El servicio comprueba la orden y los importes antes de registrar la cita. Los reintentos utilizan los registros de operación para evitar duplicados.

La consulta de estado del navegador requiere el encabezado `X-Booking-Receipt`. El nombre de una acción en la URL no acredita el pago.

## Correos y sesiones

El correo de confirmación se envía desde el servidor a partir de la cita verificada. Un fallo de correo conserva el pago y la reserva. Los resultados inciertos quedan para revisión antes de reenviar.

Las rutas privadas del personal verifican el token de Firebase y el rol vigente. El acceso de clientas utiliza un código de correo, una sesión con vencimiento y una cookie HttpOnly. Las solicitudes POST de ese acceso comprueban el origen.

## Despliegue

La configuración actual de Vercel utiliza la raíz del repositorio. `../vercel.json` instala ambas listas de dependencias y dirige `/api/` a la entrada Express. El script raíz `vercel-build` comprueba las importaciones del servidor.

Consultar [SECURITY_SETUP.md](SECURITY_SETUP.md) antes de configurar el entorno. Las reglas propuestas están en `../firestore.rules`; deben desplegarse por separado para aplicarse a una base remota.

## Otras guías

- [EMULATORS.md](EMULATORS.md): entorno local.
- [BOOKING_NOTES.md](BOOKING_NOTES.md): funcionamiento de reservas.
- [BOOKING_DIAGNOSIS.md](BOOKING_DIAGNOSIS.md): diagnóstico de datos.

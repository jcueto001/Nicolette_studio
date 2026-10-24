# Manual Técnico y Documentación del Sistema: Nicolett Studio Fantasy

**Versión:** 1.2.0  
**Fecha de actualización:** Octubre 2026  
**Estado:** Producción / En Mantenimiento Activo  

---

## Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Arquitectura Tecnológica](#2-arquitectura-tecnológica)
3. [Estructura del Proyecto y Archivos](#3-estructura-del-proyecto-y-archivos)
4. [Módulos del Frontend (SPA)](#4-módulos-del-frontend-spa)
   - [4.1 Router y Ciclo de Vistas](#41-router-y-ciclo-de-vistas)
   - [4.2 Flujo de Agendamiento de Citas](#42-flujo-de-agendamiento-de-citas)
   - [4.3 Portal y Perfil de Clienta](#43-portal-y-perfil-de-clienta)
   - [4.4 Panel de Administración y BI](#44-panel-de-administración-y-bi)
   - [4.5 Fichas Clínicas y CRM](#45-fichas-clínicas-y-crm)
5. [Estructura de Base de Datos (Firebase Firestore)](#5-estructura-de-base-de-datos-firebase-firestore)
6. [Autenticación y Control de Accesos](#6-autenticación-y-control-de-accesos)
7. [Integraciones Externas](#7-integraciones-externas)
   - [7.1 Pasarela de Pagos (Transbank Webpay Plus)](#71-pasarela-de-pagos-transbank-webpay-plus)
   - [7.2 Notificaciones por Correo (EmailJS)](#72-notificaciones-por-correo-emailjs)
8. [Capa de Persistencia y Caché (StorageHelper)](#8-capa-de-persistencia-y-caché-storagehelper)
9. [Guía de Instalación y Despliegue](#9-guía-de-instalación-y-despliegue)
   - [9.1 Despliegue del Frontend](#91-despliegue-del-frontend)
   - [9.2 Despliegue del Backend en Render](#92-despliegue-del-backend-en-render)
10. [Mantenimiento y Preguntas Frecuentes](#10-mantenimiento-y-preguntas-frecuentes)

---

## 1. Visión General del Sistema

**Nicolett Studio Fantasy** es una plataforma web desarrollada para la gestión integral de un centro de estética y belleza ubicado en Buin, Chile. El sistema cubre dos áreas operativas:

1. **Plataforma Pública (Clientas):** Catálogo de servicios, visualización de trabajos en galería con filtros, personalización de perfil de usuaria y motor de reservas de horas en tiempo real con validación de disponibilidad y opción de pago en línea vía Webpay Plus.
2. **Plataforma Privada (Administración):** Panel con métricas de negocio (KPIs e ingresos), administración del estado de citas, fichas técnicas de clientas, historial de tratamientos, control de stock de insumos, gestión del equipo de trabajadoras y carga de imágenes a la galería.

---

## 2. Arquitectura Tecnológica

El sistema utiliza una arquitectura desacoplada: un **Frontend SPA** estático conectado directamente a **Firebase** (Firestore y Auth) y a un **microservicio Backend en Node.js/Express** dedicado exclusivamente a la integración bancaria con Transbank.

```
+-------------------------------------------------------------------+
|                        NAVEGADOR CLIENTE                          |
|  index.html + styles.css + app.js (Vistas) + main.js (Eventos)    |
+-------------------+--------------------+--------------------+-----+
                    |                    |                    |
                    v                    v                    v
          +-------------------+ +------------------+ +---------------+
          | Firebase Firestore| |  Firebase Auth   | |    EmailJS    |
          |  (Base de datos)  | |  (Sesión Admin)  | |(Notificaciones|
          +-------------------+ +------------------+ +---------------+
                    ^
                    |
+-------------------+-----------------------------------------------+
|             MICROSERVICIO BACKEND (backend/server.js)             |
|              Node.js + Express + Transbank Webpay SDK             |
+-------------------------------------------------------------------+
```

### Tecnologías Clave

| Capa | Componente | Descripción |
|---|---|---|
| **Frontend Base** | HTML5, CSS3 Nativo, Vanilla JavaScript | Arquitectura sin frameworks pesados (cero dependencias de compilación en cliente). |
| **Diseño / Estilos** | CSS Variables, Flexbox, CSS Grid | Sistema de diseño basado en tonos nude, rose gold y tipografía moderna; optimizado para móviles. |
| **Iconografía** | Lucide Icons (CDN) | Iconos SVG renderizados dinámicamente en el DOM. |
| **Gráficos BI** | Chart.js (CDN) | Visualización de ingresos mensuales y distribución de servicios en el dashboard. |
| **Notificaciones** | EmailJS SDK | Disparo de correos transaccionales directos desde el cliente sin servidor SMTP propio. |
| **Backend Pagos** | Node.js + Express | Servidor REST para la creación y confirmación de transacciones con Webpay Plus. |
| **Base de Datos** | Firebase Firestore (v10.7.1 Compat) | Base de datos NoSQL documental en tiempo real. |
| **Autenticación** | Firebase Authentication | Inicio de sesión con correo y contraseña para administradoras y profesionales. |

---

## 3. Estructura del Proyecto y Archivos

```text
Nicolette_studio/
├── backend/
│   ├── package.json          # Dependencias del backend (express, cors, transbank-sdk)
│   ├── package-lock.json     # Bloqueo de versiones de paquetes de node
│   ├── server.js             # API REST de integración con Webpay Plus
│   └── README.md             # Guía de ejecución y despliegue del backend en Render
├── css/
│   └── styles.css            # Hoja de estilos global, variables CSS y responsive design
├── img/                      # Recursos gráficos estáticos y fotografías del local
├── js/
│   ├── app.js                # Router SPA y funciones que renderizan el HTML de cada vista
│   ├── firebase-config.js    # Inicialización y credenciales del cliente Firebase
│   ├── main.js               # Controladores de eventos, lógica de formularios y CRM
│   └── mockData.js           # Capa StorageHelper, estado local y datos semilla
├── index.html                # Contenedor raíz, barra de navegación, modales y scripts CDN
├── test.html                 # Archivo auxiliar de prueba para validar conexión con Firebase
├── DOCUMENTACION.md          # Este documento
└── README.md                 # Resumen inicial del repositorio
```

---

## 4. Módulos del Frontend (SPA)

### 4.1 Router y Ciclo de Vistas
El archivo `js/app.js` expone el objeto `AppRouter`. Este gestiona la navegación interna sin recargar la página mediante el atributo HTML `data-route`:

* **`AppRouter.navigate(route)`**: Oculta el contenedor `#app-content` mediante una transición de opacidad, inserta el nuevo HTML generado por la función correspondiente (`renderHomeView`, `renderAgendarView`, etc.) y vuelve a vincular iconos y controladores.
* **`AppRouter.refresh()`**: Vuelve a evaluar y dibujar la vista activa. Se utiliza tras guardar o eliminar registros en el panel administrativo.

### 4.2 Flujo de Agendamiento de Citas
Ubicado en la ruta `'agendar'` (`renderAgendarView`), implementa un asistente secuencial de 5 pasos:

1. **Paso 1: Selección de Servicio:** Muestra los servicios filtrados por categorías (Manicure, Mirada, Capilar, Bienestar).
2. **Paso 2: Selección de Profesional:** Permite elegir a la especialista deseada o marcar "Cualquiera disponible".
3. **Paso 3: Fecha y Horario:** El calendario consulta a Firestore (`StorageHelper.getAvailableTimeSlots`) las citas ocupadas en la fecha para esa profesional y deshabilita los bloques ya tomados.
4. **Paso 4: Datos del Cliente:** Formulario de nombre, teléfono y correo electrónico. Si la clienta ya personalizó su navegador, estos datos se autorrellenan automáticamente.
5. **Paso 5: Confirmación / Pago:**
   - **Confirmación directa:** Guarda la cita en la colección `Citas` con estado `'confirmada'` y envía el correo de respaldo con EmailJS.
   - **Pago con Webpay:** Llama al backend en `/api/webpay/create`, redirige al formulario seguro de Transbank y tras el pago exitoso redirige con confirmación de orden.

### 4.3 Portal y Perfil de Clienta
Accesible mediante la ruta `'perfil'` (`renderPerfilView`):
* Muestra el resumen de la clienta (nombre y correo registrados en el navegador en la clave `nicolett_personalization`).
* Consulta las citas históricas y futuras de esa clienta comparando `clientEmail` contra la colección `Citas`.
* Ordena cronológicamente las visitas y muestra el estado actual de cada reserva.
* **Captura de Fotos del Servicio:**
  - Incluye un banner principal y botones directos en cada tarjeta de cita ("Sacar foto de este servicio").
  - Abre el modal `#client-photo-modal` que permite:
    - **Cámara Móvil Nativa:** Abre la cámara trasera en smartphones/tablets (`accept="image/*" capture="environment"`).
    - **Archivos / Galería:** Selección de fotografías desde la biblioteca local.
    - **Webcam en Vivo:** Transmisión y captura de instantánea en computadores mediante `navigator.mediaDevices.getUserMedia`.
  - Optimización en cliente: Redimensionamiento automático a máximo 800px y compresión JPEG al 70% mediante Canvas HTML5 para no saturar memoria.
  - Guarda la imagen con metadatos (`source: 'client'`, nombre y correo de la clienta, servicio y fecha) en `StorageHelper` y la sincroniza con Firebase Firestore.
* **Galería de Resultados de la Clienta:** Muestra el listado de fotos aportadas por la usuaria, con fecha, servicio e indicador de publicación en la galería del salón, permitiéndole además eliminar sus fotos si lo desea.
* **Cierre de Sesión de Clienta:** Incluye un botón para cerrar sesión directamente en la cabecera de la vista y sincroniza el botón de salida en la barra de navegación general (`logoutClientProfile()`). Al cerrar sesión, se eliminan los datos locales de personalización y se redirige a la vista principal.

### 4.4 Panel de Administración y BI
Accesible en la ruta `'admin'` (`renderAdminView`). Protegido por autenticación: si no hay un usuario autenticado en `StorageHelper.getAuth()`, el router redirige automáticamente al home.

El panel se organiza en pestañas operativas:
1. **Dashboard BI:**
   - Tarjetas de KPIs: Ingresos Totales acumulados, Citas Totales, Tasa de Asistencia (%) y Clientas Registradas.
   - Gráfico de Línea: Evolución mensual de ingresos generados.
   - Gráfico de Dona: Distribución de la demanda por categoría de servicio.
2. **Gestión de Citas:** Tabla con todas las reservas. Permite cambiar el estado en vivo a:
   - `confirmada` (dispara correo de confirmación a la clienta).
   - `completada` (suma automáticamente a las métricas de ingresos).
   - `cancelada` o `no asiste` (libera el bloque horario).
3. **Fichas Clínicas:** Registro del expediente técnico por sesión de cada clienta.
4. **Inventario:** Vista de insumos con niveles de alerta para productos con stock bajo.
5. **Equipo / Profesionales:** Alta y baja de especialistas.
6. **Galería:**
   - Carga de fotografías oficiales del estudio con compresión automática.
   - **Integración con Fotos de Clientas:** Despliega todas las fotos subidas desde el portal de clientas identificadas con insignias rose gold (`Clienta: [Nombre]`, servicio y fecha).
   - **Filtros Dinámicos:** Pestañas de filtrado ("Todas", "Subidas por Clientas 💕", "Estudio").
   - Eliminación de imágenes con confirmación tanto para fotos oficiales como aportadas.
7. **Directorio de Clientas (CRM):** Resumen de clientes con total de visitas y monto acumulado gastado en el salón. Al abrir la ficha CRM de una clienta, se exhibe adicionalmente la galería de fotos de servicios subidas por ella.

### 4.5 Fichas Clínicas y CRM
Al guardar una ficha clínica:
* Se registra la fecha, la clienta, el servicio y las notas de procedimiento (ej. alergias, fórmula de tinte, curvatura de pestañas).
* Se descuenta el stock de los insumos seleccionados en la colección `Inventario`.
* Si la clienta no existía en el directorio local, se añade automáticamente.
* Al presionar el botón "Ver CRM", un modal reúne todas las citas y fichas pasadas de la clienta junto con notas privadas de seguimiento.

---

## 5. Estructura de Base de Datos (Firebase Firestore)

La base de datos utiliza nombres de colecciones en español y en formato singular/plural según la entidad:

### 1. Colección `perfil_cliente`
Almacena las preferencias y datos capturados cuando una visitante utiliza el modal de personalización del sitio.
```json
{
  "name": "Valentina Pérez",
  "email": "valentina@ejemplo.cl",
  "createdAt": "Timestamp"
}
```

### 2. Colección `Citas`
Registra cada reserva generada desde la web o manualmente por el equipo.
```json
{
  "clientName": "Valentina Pérez",
  "clientPhone": "+56912345678",
  "clientEmail": "valentina@ejemplo.cl",
  "serviceId": "s1",
  "servicio": "Esmaltado Permanente",
  "price": 15000,
  "profId": "p1",
  "profesional": "Nicolett",
  "date": "2026-11-05",
  "time": "15:00",
  "status": "confirmada",
  "createdAt": "Timestamp"
}
```
*Estados válidos de una cita:* `'confirmada'`, `'completada'`, `'cancelada'`, `'no asiste'`, `'bloqueada'`, `'Pago Reportado'`.

### 3. Colección `FichasClinicas`
Expedientes de tratamientos y procedimientos técnicos aplicados a las clientas.
```json
{
  "clientName": "Valentina Pérez",
  "serviceName": "Uñas Acrílicas",
  "date": "2026-10-18",
  "notes": "Largo #3, punta almendrada, cutículas sensibles.",
  "productsUsed": ["inv1"],
  "createdAt": "Timestamp"
}
```

### 4. Colección `Inventario`
Control de insumos consumibles y productos.
```json
{
  "name": "Esmalte Permanente Rojo",
  "stock": 14,
  "category": "manos-pies"
}
```

### 5. Colección `Profesionales`
Especialistas que atienden en el salón.
```json
{
  "name": "Camila",
  "email": "camila@gmail.com",
  "role": "profesional",
  "avatar": "https://..."
}
```

### 6. Colección `Usuarios`
Colección indexada por el UID de Firebase Authentication (`user.uid`). Define los permisos internos:
```json
{
  "email": "nicolette@gmail.com",
  "rol": "Admin",
  "nombre": "Nicolett"
}
```

---

## 6. Autenticación y Control de Accesos

1. **Flujo de Acceso:**  
   El acceso administrativo se realiza mediante Firebase Auth con correo y contraseña a través del modal `#auth-modal`.
2. **Detección Automática de Administradora:**  
   En `js/main.js`, si en el formulario de bienvenida de clienta se ingresa el correo `nicolette@gmail.com`, el sistema interrumpe el flujo normal y despliega directamente el modal de contraseña administrativo.
3. **Verificación de Rol:**  
   Al autenticar el usuario en Firebase Auth, el sistema consulta el documento en la colección `Usuarios` con el UID obtenido. Si el campo `rol` es `'Admin'`, se otorga permiso completo de gestión.
4. **Cierre de Sesión:**  
   - **Administración:** El botón de salir ejecuta `firebase.auth().signOut()`, limpia la sesión en `StorageHelper`, oculta el acceso al portal y redirige a la vista principal.
   - **Perfil de Clienta:** La función `logoutClientProfile()` limpia la clave `nicolett_personalization` de `localStorage`, oculta el enlace de "Mi Perfil" en la navegación y regresa a la vista de inicio (`home`).

---

## 7. Integraciones Externas

### 7.1 Pasarela de Pagos (Transbank Webpay Plus)
El flujo opera contra el servidor Node.js en la carpeta `backend/`:

1. **Creación de Transacción:**
   - **Frontend:** Hace una petición `POST /api/webpay/create` enviando:
     ```json
     {
       "buyOrder": "O-1729000000",
       "sessionId": "S-1729000000",
       "amount": 15000,
       "returnUrl": "https://<BACKEND_URL>/api/webpay/commit"
     }
     ```
   - **Backend:** Emplea el SDK oficial de Transbank (`WebpayPlus.Transaction`). Retorna un token (`token`) y una URL oficial de Transbank (`url`).
   - **Frontend:** Crea un formulario dinámico en memoria y hace POST a la URL de Transbank con el token recibido.

2. **Confirmación y Retorno:**
   - El cliente ingresa sus datos en la pantalla bancaria de Webpay.
   - Transbank envía a la clienta de vuelta al endpoint del backend: `GET /api/webpay/commit?token_ws=...`.
   - El backend llama a `tx.commit(token)`. Si la respuesta es `'AUTHORIZED'`, redirige al frontend con los parámetros:
     `?action=webpay-success&buyOrder=...&authCode=...`.
   - El script `main.js` captura estos parámetros al cargar la página, guarda la cita confirmada y muestra la pantalla de confirmación.

### 7.2 Notificaciones por Correo (EmailJS)
Se ejecuta en el lado del cliente utilizando el script `@emailjs/browser`:
* **Llave Pública:** `tUxZAGW52juzs6H5Q`
* **ID de Servicio:** `service_rmc9mu9`
* **Plantilla de Reserva Creada:** `template_2h2ya38`
* **Plantilla de Cita Confirmada por Admin:** `template_pcxbtx3`

Parámetros enviados a las plantillas:
- `to_name`: Nombre de la clienta.
- `to_email`: Correo de la clienta.
- `service_name`: Nombre del servicio reservado.
- `date`: Fecha de la cita.
- `time`: Hora agendada.
- `professional`: Nombre de la especialista asignada.

---

## 8. Capa de Persistencia y Caché (StorageHelper)

El objeto `StorageHelper` (en `js/mockData.js`) implementa un patrón de repositorio híbrido:

1. **Caché en Memoria:** Mantiene arreglos en memoria (`_appointmentsCache`, `_fichasCache`, `_professionalsCache`, `_inventoryCache`) para que los cambios de vista en el router sean instantáneos.
2. **Sincronización con Firestore:** Toda operación de lectura inicial puebla la caché desde Firestore. Toda operación de escritura (`saveAppointment`, `saveFicha`, `updateProductStock`) persiste en Firestore y actualiza la caché local.
3. **Resiliencia (Modo Fallback Offline):** Si la conexión con Firebase falla o la base de datos no está disponible temporalmente, `StorageHelper` almacena las operaciones en `localStorage` (claves `nicolett_appointments`, `nicolett_clients`, `nicolett_gallery_v2`), evitando bloqueos o pérdidas de información para el usuario final.

---

## 9. Guía de Instalación y Despliegue

### 9.1 Despliegue del Frontend
El frontend es 100% estático. Puede ser alojado en cualquier proveedor de hosting estático (Firebase Hosting, Vercel, Netlify, GitHub Pages o un servidor Apache/Nginx).

#### Pasos para desplegar en GitHub Pages:
1. Asegurarse de que todos los cambios estén en la rama `main`.
2. Ir en GitHub a **Settings > Pages**.
3. En **Source**, seleccionar la rama `main` y la carpeta `/ (root)`.
4. Guardar. El sitio quedará disponible en `https://<tu-usuario>.github.io/Nicolette_studio/`.

### 9.2 Despliegue del Backend en Render

1. Crear una cuenta en [Render.com](https://render.com).
2. Hacer clic en **New + > Web Service** y conectar el repositorio de GitHub.
3. Configuración del servicio:
   - **Name:** `nicolett-backend`
   - **Environment:** `Node`
   - **Root Directory:** `backend` *(fundamental: este subdirectorio contiene el package.json del servidor)*
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Variables de entorno (pestaña **Environment** en Render):
   - `FRONTEND_URL`: URL pública real de tu frontend (ejemplo: `https://jcueto001.github.io/Nicolette_studio/index.html`).
   - `PORT`: `3000` (o el asignado por Render por defecto).
5. En el frontend ([js/main.js](file:///c:/Users/Usuario/Nicolette_studio/js/main.js)), actualizar la variable `backendUrl` con la dirección HTTPS entregada por Render:
   ```javascript
   const backendUrl = 'https://nicolett-backend.onrender.com';
   ```

---

## 10. Mantenimiento y Preguntas Frecuentes

### ¿Cómo agregar un nuevo servicio?
Los servicios iniciales están definidos en el arreglo `mockData.services` en `js/mockData.js`. Para dar de alta un servicio, se añade un objeto con la siguiente estructura:
```javascript
{
    id: 's5',
    categoryId: 'manos-pies',
    name: 'Kapping Gel',
    price: 18000,
    duration: 60,
    recommendedFor: ['ejecutiva', 'turnos'],
    image: 'img/nuevo-servicio.jpg'
}
```

### ¿Cómo dar de alta a una nueva profesional en Firebase?
Desde el panel administrador (`#admin`), en la pestaña **Profesionales**, ingresar nombre, correo y seleccionar la foto. El sistema creará el registro automáticamente en la colección `Profesionales` de Firestore.

### ¿Dónde se administran las reglas de seguridad de Firestore?
En la consola de Firebase del proyecto `nicolett-studio` > **Firestore Database** > pestaña **Reglas**. Se recomienda permitir lectura general de citas y servicios, y restringir la modificación de usuarios e inventario a usuarios autenticados:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Citas/{document=**} {
      allow read, create: if true;
      allow update, delete: if request.auth != null;
    }
    match /perfil_cliente/{document=**} {
      allow read, create: if true;
    }
    match /Galeria/{document=**} {
      allow read, create: if true;
      allow update, delete: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

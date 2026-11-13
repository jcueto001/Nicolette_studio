# 🗄️ DOSSIER DE BASE DE DATOS: GOOGLE CLOUD FIRESTORE
## Nicolett Studio Fantasy ✨ • Arquitectura de Persistencia NoSQL
### Capstone Proyecto de Título APT 2026 • Duoc UC • Grupo 9

---

## 📌 1. Identificación y Conexión Cloud

| Parámetro | Valor de Configuración |
|---|---|
| **Motor de Base de Datos** | Google Cloud Firestore (Modo Nativo NoSQL Documental) |
| **Project ID de Firebase** | `nicolett-studio` |
| **Auth Domain** | `nicolett-studio.firebaseapp.com` |
| **Storage Bucket** | `nicolett-studio.firebasestorage.app` |
| **Endpoint REST Base** | `https://firestore.googleapis.com/v1/projects/nicolett-studio/databases/(default)/documents` |
| **Modo de Acceso Frontend** | Firebase Web SDK Compat v10.7.1 (`firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-auth-compat.js`) |
| **Archivo Central de Inicialización** | [js/firebase-config.js](file:///c:/Users/Usuario/Nicolette_studio/js/firebase-config.js) |
| **Capa de Persistencia Híbrida** | `StorageHelper` en [js/mockData.js](file:///c:/Users/Usuario/Nicolette_studio/js/mockData.js) (Cloud Firestore + Caché Offline en `localStorage`) |

---

## 🗂️ 2. Mapa Global de Colecciones

La base de datos contiene **10 colecciones activas** estructuradas en español:

| N° | Colección | Propósito del Sistema | Cantidad Aprox. | Modo de Sincronización |
|:---:|---|---|:---:|---|
| **1** | `Servicios` | Catálogo maestro de atenciones, precios oficiales, duraciones y recomendaciones | 61 documentos | En vivo (`StorageHelper.getServices`) |
| **2** | `Categorias` | Categorías principales que organizan el catálogo y los filtros de la web | 10 documentos | En vivo (`StorageHelper.getCategories`) |
| **3** | `Perfiles` | Arquetipos de usuarias (Mamá, Turnos, Ejecutiva, Evento) para recomendación | 4 documentos | En vivo (`StorageHelper.getProfiles`) |
| **4** | `Citas` | Reservas agendadas por clientas o registradas por el equipo con abono Flow | Variable | En vivo con deduplicación y filtros |
| **5** | `FichasClientas` | Expedientes técnicos y bitácora clínica histórica con Lash Mapping | Variable | En vivo (`StorageHelper.getFichas`) |
| **6** | `Inventario` | Control de stock de insumos consumibles con umbral de alerta crítica | 4+ documentos | En vivo con descuento automático |
| **7** | `Profesionales` | Equipo de especialistas del salón, cargos, especialidad y fotos de avatar | 3+ documentos | En vivo (`StorageHelper.getProfessionals`) |
| **8** | `Usuarios` | Control de roles del sistema indexados por el UID de Firebase Authentication | Según personal | Verificación en inicio de sesión |
| **9** | `perfil_cliente` | Preferencias y datos de personalización capturados en la bienvenida | Variable | Consulta por correo/teléfono |
| **10**| `Galeria` | Registro de fotografías de trabajos realizados, autora y estado de aprobación | 6+ documentos | En vivo con opción de subida |
| **11**| `Configuracion` | Parámetros globales de la aplicación (Credenciales Flow.cl, entorno sandbox) | 1 documento (`flow`) | Lectura al inicializar pagos |

---

## 📋 3. Diccionario de Datos Colección por Colección

---

### 1. Colección `Servicios`
Almacena la totalidad de la carta de atenciones del salón. Permite a la administradora ajustar tarifas, tiempos o nombres directamente en Firestore sin necesidad de modificar el código fuente.

* **ID del Documento:** Identificador alfanumérico único (ej: `s1`, `s_mani_ruber`, `s_podo_clinica`).
* **Estructura del Documento JSON:**
```json
{
  "name": "Esmaltado Permanente 1 Tono",
  "category": "manicura",
  "categoryGroup": "manicura",
  "price": 15000,
  "duration": 60,
  "description": "Un solo tono + 2 diseños simples.",
  "adicionales": "Francesa o degradé (+$5.000) • Diseños aparte ($1.000 el par)",
  "recommendedFor": ["turnos", "ejecutiva"],
  "image": "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
  "combo": false
}
```
* **Campos:**
  - `name` *(string)*: Nombre público del servicio.
  - `category` *(string)*: Identificador de la categoría foránea (ej: `manicura`, `pedicure`, `capilar`, `podologia`).
  - `categoryGroup` *(string)*: Agrupación visual para la interfaz.
  - `price` *(number)*: Valor en pesos chilenos (CLP).
  - `duration` *(number)*: Duración estimada en minutos.
  - `description` *(string)*: Detalle técnico del procedimiento.
  - `adicionales` *(string, opcional)*: Servicios extra o variaciones de precio.
  - `recommendedFor` *(array de strings)*: Lista de IDs de perfiles que hacen match en el recomendador inteligente.
  - `image` *(string URL)*: Imagen ilustrativa en alta definición.
  - `combo` *(boolean)*: Indica si es un paquete promocional multiarea.

---

### 2. Colección `Categorias`
Organiza las áreas funcionales del salón en la barra de navegación y en los filtros de la vista de Servicios.

* **ID del Documento:** `capilar`, `manicura`, `pedicure`, `podologia`, `pestanas-cejas`, `depilacion-femenina`, `depilacion`, `bienestar`.
* **Estructura del Documento JSON:**
```json
{
  "id": "podologia",
  "label": "Podología Clínica",
  "icon": "stethoscope",
  "desc": "Por Podóloga Priscila Villarreal, ROL MINSAL 164959"
}
```
* **Campos:**
  - `id` *(string)*: Identificador foráneo usado por los servicios.
  - `label` *(string)*: Nombre formal para mostrar en la interfaz.
  - `icon` *(string)*: Nombre del ícono de la librería Lucide Icons (`scissors`, `sparkles`, `eye`, etc.).
  - `desc` *(string)*: Breve bajada descriptiva o acreditaciones profesionales.

---

### 3. Colección `Perfiles`
Define los arquetipos de clientas para el motor de recomendación personalizada (modal de bienvenida).

* **ID del Documento:** `mama`, `turnos`, `ejecutiva`, `evento`.
* **Estructura del Documento JSON:**
```json
{
  "id": "turnos",
  "label": "Turnos Rotativos",
  "icon": "clock",
  "desc": "Horarios flexibles y extendidos de 18:00 a 21:00"
}
```

---

### 4. Colección `Citas`
Registra cada reserva generada por las usuarias (mediante Flow.cl) o de manera manual por la administradora en el salón.

* **ID del Documento:** Autogenerado por Firestore (ej: `2wK90xYZaBmP1c`) o prefijado.
* **Estructura del Documento JSON:**
```json
{
  "clientName": "Valentina Pérez",
  "clientPhone": "+56912345678",
  "clientEmail": "valentina@ejemplo.cl",
  "serviceId": "s1",
  "servicio": "Permanente",
  "price": 15000,
  "profId": "p2",
  "profesional": "Camila",
  "date": "2026-11-20",
  "time": "15:00",
  "status": "confirmada",
  "abono": 5000,
  "saldoPendiente": 10000,
  "flowOrder": "ABONO-1731456000000",
  "flowToken": "tok_flow_live_abc123",
  "createdAt": "Timestamp"
}
```
* **Estados Válidos de `status`:**
  - `'confirmada'`: Abono de \$5.000 validado correctamente.
  - `'completada'`: Atención realizada en el local y saldo liquidado.
  - `'cancelada'`: Cancelada con antelación o rechazada.
  - `'no asiste'`: Inasistencia de la clienta al horario reservado.
  - `'bloqueada'`: Bloqueo de agenda preventivo de la trabajadora.

---

### 5. Colección `FichasClientas`
Expediente técnico donde las especialistas registran los procedimientos realizados, insumos aplicados y especificaciones técnicas (ej: extensiones de pestañas).

* **ID del Documento:** Autogenerado por Firestore.
* **Estructura del Documento JSON:**
```json
{
  "clientName": "Valentina Pérez",
  "clientEmail": "valentina@ejemplo.cl",
  "clientPhone": "+56912345678",
  "serviceName": "Extensiones de Pestañas Volumen Ruso",
  "profesional": "Camila",
  "profId": "p2",
  "date": "2026-11-13",
  "notes": "Clienta con ojos sensibles. Se utilizó adhesivo Sky Glue S+ de grado médico sin vapores.",
  "productsUsed": ["inv2", "inv4"],
  "lashMapping": {
    "longitud": "11mm",
    "curvatura": "D",
    "grosor": "0.07",
    "estilo": "Cat Eye / Ojo de Gata"
  },
  "createdAt": "Timestamp"
}
```

---

### 6. Colección `Inventario`
Control de existencias de insumos profesionales del salón (Sprint 3 - RF-10).

* **ID del Documento:** `inv1`, `inv2`, `inv3`, etc.
* **Estructura del Documento JSON:**
```json
{
  "name": "Esmalte Permanente Rojo Cherimoya",
  "stock": 14,
  "minStock": 5,
  "category": "manos-pies",
  "brand": "Cherimoya Profesional",
  "lastUpdated": "Timestamp"
}
```
* **Lógica de Alerta:**
  $$\text{Alerta Crítica} \iff \text{stock} \le \text{minStock (o 5 por defecto)}$$

---

### 7. Colección `Profesionales`
Especialistas que atienden en el estudio.

* **ID del Documento:** `p1`, `p2`, `p3`, etc.
* **Estructura del Documento JSON:**
```json
{
  "name": "Priscila Villarreal",
  "email": "priscila@gmail.com",
  "role": "profesional",
  "specialty": "Podología Clínica (ROL MINSAL 164959)",
  "avatar": "https://images.unsplash.com/photo-1594824813583-0599a80b064c?auto=format&fit=crop&w=150&q=80",
  "active": true
}
```

---

### 8. Colección `Usuarios`
Mapeo de privilegios de acceso indexados por el Identificador Único (`user.uid`) de Firebase Authentication.

* **ID del Documento:** `user.uid` (ej: `V5wF9XyZ10AbCdEfGhIjKlMnOpQr`).
* **Estructura del Documento JSON:**
```json
{
  "email": "nicolette@gmail.com",
  "nombre": "Nicolett",
  "rol": "admin",
  "updatedAt": "Timestamp"
}
```

---

### 9. Colección `Configuracion`
Parámetros de integración de la plataforma. Documento fijo `flow`.

* **ID del Documento:** `flow`.
* **Estructura del Documento JSON:**
```json
{
  "apiKey": "D2E0B49B-515A-4382-8419-7BA2417730E7",
  "sandbox": true,
  "abonoDefecto": 5000,
  "updatedAt": "Timestamp"
}
```

---

## 🔒 4. Reglas de Seguridad en Cloud Firestore (`firestore.rules`)

Para garantizar la seguridad de la información médica y financiera (RNF-04), las reglas de Firestore se configuran con validación de roles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar: verifica si el usuario está autenticado en Firebase Auth
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función auxiliar: verifica si el usuario posee rol 'admin'
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/Usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // Catálogo público (Servicios, Categorías, Perfiles): Lectura libre, escritura exclusiva Admin
    match /Servicios/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /Categorias/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /Perfiles/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Citas: Creación pública (al agendar), lectura y modificación para personal autenticado
    match /Citas/{document} {
      allow read, write: if isAuthenticated();
      allow create: if true; // Permite creación al concretar abono Flow
    }

    // Fichas Clientas: Personal autorizado puede leer y escribir; solo admin puede eliminar
    match /FichasClientas/{document} {
      allow read, create, update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Inventario: Lectura y rebaja para trabajadoras; creación y borrado para admin
    match /Inventario/{document} {
      allow read, update: if isAuthenticated();
      allow create, delete: if isAdmin();
    }

    // Profesionales y Usuarios: Protegido
    match /Profesionales/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /Usuarios/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAdmin();
    }
  }
}
```

---

## ⚡ 5. Mecanismo de Persistencia Híbrida (Offline-First)

Para asegurar que la aplicación nunca se quede "en blanco" si una clienta tiene conexión lenta o intermitente en Buin:

1. **Al Iniciar (`StorageHelper.init`):**
   - La aplicación lee instantáneamente los datos guardados en `localStorage` (`nicolett_services_cache`, `nicolett_categories_cache`, `nicolett_profiles_cache`).
   - La vista inicial se renderiza en **menos de 50 milisegundos**.
2. **Sincronización en Segundo Plano:**
   - De inmediato, `StorageHelper.loadAppointmentsCache()` consulta en paralelo a Firestore (`db.collection("Servicios").get()`, etc.).
   - Cuando Firestore responde, actualiza la memoria viva (`mockData.services = servs`) y refresca la caché local.
   - Si hubo algún cambio de precio o servicio nuevo, la vista se re-renderiza fluidamente mediante `AppRouter.refresh()`.


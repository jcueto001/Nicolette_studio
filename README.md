# Nicolett Studio Fantasy ✨
### Proyecto de Título / Capstone APT 2026 - Duoc UC

Plataforma web integral para la gestión y digitalización de **Nicolett Studio Fantasy**, salón de belleza y estética ubicado en Buin, Región Metropolitana.

---

## 👥 Equipo de Desarrollo (Grupo 9)

| Integrante | Rol en el Proyecto | Enfoque Técnico |
|---|---|---|
| **José Cueto Moreira** | **Scrum Master** | Desarrollo Frontend, experiencia de usuario (UX/UI), maquetación responsiva, arquitectura web y control de calidad. |
| **Benjamín Moya Meza** | **Product Owner** | Desarrollo Backend, arquitectura de datos en la nube, lógica de negocio e integración con Firebase Firestore y Auth. |

* **Asignatura:** Capstone (APT) • **Sección:** 003-D  
* **Docente Guía:** Paz Constanza Morales Saavedra  
* **Cliente / Beneficiario:** Nicolett Studio (Buin)  
* **URL en Producción:** [https://nicolette-studio.vercel.app](https://nicolette-studio.vercel.app)

---

## 🏛️ Arquitectura de Código del Sistema

El software implementa una **arquitectura modular desacoplada** orientada a componentes, donde cada módulo responde directamente a los requerimientos funcionales y sprints planificados en el informe técnico de ingeniería:

```text
Nicolett_studio/
├── css/
│   └── styles.css               # Estilos globales, paleta institucional (rose gold/nude/ivory) y responsive mobile-first
├── img/                         # Recursos gráficos estáticos, fotografías reales del local e iconografía
├── js/                          # Lógica de la aplicación estructurada por módulos de ingeniería
│   ├── firebase-config.js       # Conexión central y credenciales de Cloud Firestore y Firebase Auth
│   ├── mockData.js              # Capa de datos inicial, caché local y servicio híbrido StorageHelper
│   ├── modules/                 # MÓDULOS DE NEGOCIO (Plan de Trabajo / Sprints)
│   │   ├── citas.js             # [Sprint 1] Módulo de Citas, Horarios (09:00-17:00), Sobrecupos y Abono ($5.000)
│   │   ├── clientas.js          # [Sprint 2] Módulo de Clientas, Fichas Técnicas y Mapeo de Pestañas (Mapping 9-13)
│   │   ├── inventario.js        # [Sprint 3] Módulo de Inventario, Alertas de Stock Crítico y Catálogo para Clientas
│   │   ├── auth.js              # [Sprint 4] Módulo de Autenticación, Control de Roles (Admin vs Trabajadora) y Seguridad
│   │   └── ui.js                # [Sprint 5] Componentes de Interfaz, Modales de Confirmación y Notificaciones Toast
│   ├── app.js                   # Enrutador SPA (AppRouter) y renderizado reactivo de vistas HTML
│   └── main.js                  # Inicialización global (Bootstrap), eventos del DOM y CRM
├── backend/                     # Microservicio Node.js / Express
│   ├── server.js                # API REST para pagos en línea (Flow.cl / Webpay Plus) y webhooks
│   └── package.json             # Dependencias del servidor backend
├── index.html                   # Contenedor raíz de la Single Page Application (SPA)
├── reset-password.html          # Portal exclusivo y personalizado para recuperación segura de contraseñas
├── DOCUMENTACION.md             # Manual técnico extendido de la arquitectura y base de datos
└── README.md                    # Este documento
```

---

## 📋 Módulos y Trazabilidad de Requerimientos (Anexo 5)

La arquitectura de código se alinea con la **Matriz de Requerimientos (Anexo 5)** definida en el informe de ingeniería:

### 1. Módulo de Citas y Agendamiento (`js/modules/citas.js`)
* **RF-03:** Agendamiento con horario base regular (09:00 a 17:00 hrs) y sobrecupos flexibles (18:00 a 21:00 hrs).
* **RF-04:** Agenda individual por trabajadora con vistas filtradas por profesional para evitar traslapes de turnos.
* **RF-05:** Política de abono obligatorio de $5.000 (vía Flow.cl / Webpay) y condición de cancelación con 24 horas.
* **RF-06:** Generación de recordatorios y confirmaciones automáticas de asistencia vía correo electrónico (EmailJS).

### 2. Módulo de Clientas y Fichas Técnicas (`js/modules/clientas.js`)
* **RF-07:** Ficha técnica y bitácora cronológica con registro de atenciones, profesional asignada y notas clínicas.
* **RF-08:** Campos técnicos dinámicos por servicio con **Mapeo de Pestañas (*Lash Mapping* con longitudes del 9 al 13 mm, curvaturas y grosores)**.

### 3. Módulo de Inventario y Catálogo (`js/modules/inventario.js`)
* **RF-09:** Catálogo informativo de productos profesionales certificados (marcas, certificaciones e insumos para clientas).
* **RF-10:** Control de existencias con alertas visuales de stock crítico y **descuento automático de insumos según el servicio realizado**.

### 4. Módulo de Autenticación, Seguridad y Roles (`js/modules/auth.js`)
* **RF-01 & RF-02:** Inicio de sesión diferenciado para **Administradora** (acceso total, alta/baja de personal, reportes financieros) y **Trabajadoras** (acceso restringido exclusivamente a su agenda y atenciones asignadas).
* **RNF-04:** Reglas de seguridad estrictas en Cloud Firestore (denegación de borrado de fichas a trabajadoras y bloqueo de accesos anónimos).
* **RNF-05:** Cifrado de extremo a extremo bajo protocolo forzado **HTTPS/TLS**.

### 5. Experiencia de Usuario y Calidad (`js/modules/ui.js` & `css/styles.css`)
* **RNF-01:** Identidad visual coherente con paleta de marca: tonos oro rosa (*rose gold*), *nude*, marfil (*ivory*) y fondos marmoleados.
* **RNF-02:** Enfoque *Mobile-First* completamente adaptable a smartphones (360px a 480px) y pantallas de escritorio (≥ 1024px).
* **RNF-03:** Rendimiento optimizado con puntuación superior a 85 puntos en auditorías de Google Lighthouse.

---

## 🛠️ Stack Tecnológico

* **Frontend:** HTML5 Semántico, CSS3 Nativo (Variables CSS, Flexbox, Grid), Vanilla JavaScript (ES6+ Modular).
* **Base de Datos & Auth:** Google Firebase (Cloud Firestore NoSQL & Firebase Authentication).
* **Pasarelas de Pago & APIs:** Flow.cl (Webpay Plus, CuentaRUT, Servipag) con microservicio Express en Node.js.
* **Notificaciones Transaccionales:** EmailJS Browser SDK.
* **Iconografía:** Lucide Icons.
* **Despliegue Continuo (CI/CD):** Vercel integrado al repositorio central de GitHub (`main`).

---

## 🎯 Criterio de Finalización (*Definition of Done*)

Cada módulo integrado al repositorio cumple estrictamente las 4 condiciones fijadas en el informe:
1. Conexión total con Firebase Firestore en tiempo real sin inconsistencias de datos.
2. Comprobación responsiva en resoluciones móviles (360px–480px) y de escritorio.
3. Revisión de código conjunta entre José Cueto y Benjamín Moya.
4. Validación funcional directa con la administración de Nicolett Studio.

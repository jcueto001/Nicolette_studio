# Nicolett Studio - Integración Oficial Flow.cl (Abonos de $5.000)

Este backend implementa la integración oficial con la API de [Flow.cl](https://developers.flow.cl/docs/intro) para cobrar el **abono obligatorio de $5.000** antes de confirmar cualquier reserva de cita en **Nicolett Studio Fantasy**.

---

## 📌 ¿Cómo Funciona el Flujo de Reserva y Abono?

```
[ Clienta agenda ] 
       │
       ▼
[ Modal de Abono $5.000 ] ───▶ Frontend solicita orden a /api/flow/create
                                        │
                                        ▼ (Firma HMAC-SHA256)
                                 [ API de Flow.cl ]
                                        │
                                        ▼ (URL de pago)
[ Redirección a Pasarela Flow ] (Clienta paga con Webpay, CuentaRUT, etc.)
       │
       ▼
[ Retorno a /api/flow/return ] ──▶ Backend consulta getStatus en Flow
       │
       ▼ (Si status === 2: Pagada)
[ Retorno a index.html ] ────────▶ Cita confirmada + Abono $5.000 registrado
```

---

## 🚀 Inicio Rápido (Desarrollo Local)

1. Abre una terminal en la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea tu archivo `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
   El backend estará disponible en `http://localhost:3000`.

---

## 🔑 Cómo Obtener tus Credenciales de Flow

### Modo Sandbox (Pruebas - Recomendado para probar):
1. Regístrate gratis en [https://sandbox.flow.cl/](https://sandbox.flow.cl/).
2. Inicia sesión y ve a **Mis Datos** ➡️ pestaña **Seguridad**.
3. Copia tu **API Key** y tu **Secret Key**.
4. Puedes ingresarlas directamente en:
   - El archivo `.env` del backend (`FLOW_API_KEY`, `FLOW_SECRET_KEY`), O
   - En el **Portal Administradora** de la web (pestaña **Configuración Flow**).

### Tarjetas de Prueba en Sandbox Flow:
Al pagar en el entorno de pruebas de Flow (Webpay Plus):
- **Cualquier número de tarjeta válido de prueba** o seleccionar "Transacción Aprobada" en la pantalla de simulación de Flow.
- No se debitará dinero real.

---

## ⚙️ Variables de Entorno (.env)

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `PORT` | Puerto de escucha | `3000` |
| `FLOW_API_KEY` | Tu API Key de Flow | Vacío (puede pasarse desde el panel admin) |
| `FLOW_SECRET_KEY` | Tu Secret Key de Flow | Vacío (puede pasarse desde el panel admin) |
| `FLOW_SANDBOX` | `true` para pruebas (`sandbox.flow.cl`), `false` para producción | `true` |
| `BACKEND_URL` | URL donde corre este servidor | `http://localhost:3000` |
| `FRONTEND_URL` | URL de la web principal | `http://127.0.0.1:5500/index.html` |

---

## 🌐 Despliegue en Producción (Render.com)

1. Sube tu proyecto a tu repositorio de **GitHub**.
2. En [Render.com](https://render.com), crea un nuevo **Web Service**.
3. Conecta tu repositorio y configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. En **Environment Variables**, añade:
   - `FLOW_API_KEY`: Tu API Key real de Flow.
   - `FLOW_SECRET_KEY`: Tu Secret Key real de Flow.
   - `FLOW_SANDBOX`: `false` (para cobrar dinero real) o `true` (pruebas).
   - `FRONTEND_URL`: `https://tu-dominio-del-estudio.cl`
5. En el Portal Administradora de Nicolett Studio, actualiza la **URL Servidor Backend** con la dirección que te proporcione Render (ej: `https://nicolett-backend.onrender.com`).


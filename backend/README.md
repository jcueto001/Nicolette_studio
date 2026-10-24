# Nicolett Studio Payments Backend (Flow.cl & Webpay)

Backend para el procesamiento de pagos de abonos ($5.000) e integraciones con **Flow.cl** (Webpay, Tarjetas de Débito/Crédito, CuentaRUT BancoEstado, Mach, Servipag) y Transbank Webpay Plus, construido en Node.js y Express.

## Desarrollo Local

1. Abre una terminal en esta carpeta (`backend`).
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
4. El servidor estará corriendo en `http://localhost:3000`.

## Variables de Entorno Recomendadas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `FLOW_API_KEY` | Llave API de Flow.cl | Obtenida en portal Flow |
| `FLOW_SECRET_KEY` | Llave secreta de Flow.cl | Obtenida en portal Flow |
| `FLOW_SANDBOX` | Activar sandbox de pruebas | `true` o `false` |
| `FRONTEND_URL` | URL de la web pública | `https://tu-sitio.com/index.html` |
| `BACKEND_URL` | URL de este backend | `https://nicolett-backend.onrender.com` |

## Despliegue en Render.com

1. Sube tu proyecto a tu repositorio de **GitHub**.
2. Entra a [Render.com](https://render.com) y crea un nuevo **Web Service**.
3. Selecciona tu repositorio.
4. Parámetros en Render:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Agrega las variables de entorno (`FRONTEND_URL`, `FLOW_API_KEY`, `FLOW_SECRET_KEY`).

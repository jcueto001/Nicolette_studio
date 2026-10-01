# Nicolett Studio Webpay Backend

Este es el backend de integración con Transbank Webpay Plus, construido en Node.js y Express.

## Desarrollo Local

1. Abre una terminal en esta carpeta (`backend`).
2. Instala las dependencias si no lo has hecho:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
4. El servidor estará corriendo en `http://localhost:3000`.

## Despliegue en Render.com

Para poner en producción este backend (necesario para que los clientes puedan pagar desde cualquier lugar):

1. Sube tu proyecto completo a un repositorio de **GitHub**.
2. Entra a [Render.com](https://render.com) y crea una cuenta (puedes usar la de GitHub).
3. Haz clic en **New +** y selecciona **Web Service**.
4. Conecta tu repositorio de GitHub y selecciona este proyecto.
5. Configuración en Render:
   - **Name**: `nicolett-backend` (o el que prefieras).
   - **Environment**: `Node`
   - **Root Directory**: `backend` (¡Muy importante! Ya que tu `package.json` está dentro de esta carpeta).
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (Gratis).
6. Haz clic en **Create Web Service** y espera un par de minutos a que se despliegue.

### Configuración Final

1. Una vez desplegado, Render te dará una URL (ej: `https://nicolett-backend.onrender.com`).
2. Ve a tu archivo frontend `js/main.js` (línea ~510 donde configuramos el backend).
3. **Cambia `const backendUrl = 'http://localhost:3000';` por la URL que te dio Render**:
   ```javascript
   const backendUrl = 'https://nicolett-backend.onrender.com';
   ```
4. En el archivo `backend/server.js`, cambia la variable `FRONTEND_URL` para que apunte a tu web real:
   Render permite configurar **Environment Variables (Variables de Entorno)**. En la pestaña "Environment" de tu servicio en Render, agrega:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://tu-sitio-web-real.com/index.html` (o donde esté alojado tu frontend).

¡Y listo! Ya tendrás Transbank operando automáticamente.

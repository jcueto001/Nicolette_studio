const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
let WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment;
try {
    ({ WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = require('transbank-sdk'));
} catch (e) {
    console.warn('transbank-sdk no disponible, endpoints de Webpay deshabilitados.');
}

// Cargar variables de entorno desde .env si existe
try { require('dotenv').config(); } catch (e) {}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir los archivos estáticos de la web completa (HTML, CSS, JS, imágenes)
// Permite acceder a la web en http://localhost:3000 sin problemas de protocolo file://
app.use(express.static(path.join(__dirname, '..')));

// Ruta limpia para restablecer contraseña personalizada de Nicolett Studio
app.get(['/reset-password', '/restablecer-contrasena'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'reset-password.html'));
});

// --- Configuración Flow.cl ---
const FLOW_API_KEY = (process.env.FLOW_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
const FLOW_SECRET_KEY = (process.env.FLOW_SECRET_KEY || '').trim().replace(/^['"]|['"]$/g, '');
const FLOW_IS_SANDBOX = process.env.FLOW_SANDBOX !== 'false';
const FLOW_BASE_URL = FLOW_IS_SANDBOX ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';

// Función para obtener la URL base dinámicamente de la solicitud o del entorno Vercel
function getBaseUrl(req) {
    if (req) {
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
        if (host) {
            return `${proto}://${host}`;
        }
    }
    if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'https://nicolette-studio.vercel.app';
}

function getFrontendUrl(req) {
    if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
    return `${getBaseUrl(req)}/index.html`;
}

const BACKEND_URL = process.env.BACKEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://nicolette-studio.vercel.app');
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/index.html` : 'https://nicolette-studio.vercel.app/index.html');

// En desarrollo local (localhost), los servidores de Flow en la nube no pueden conectarse a localhost.
// Para evitar el error 999 en el webhook de notificación durante desarrollo, usamos una URL pública de respuesta inmediata 200.
const isLocalhost = BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
const CONFIRMATION_URL = process.env.FLOW_CONFIRMATION_URL || (isLocalhost ? 'https://httpbin.org/status/200' : `${BACKEND_URL}/api/flow/notify`);

/**
 * Función para firmar parámetros según el protocolo HMAC-SHA256 de Flow.cl
 * Según la documentación oficial:
 * 1. Ordenar parámetros alfabéticamente por nombre
 * 2. Concatenar: nombre_parametrovalornombre_parametrovalor (sin separadores)
 * 3. Firmar con HMAC-SHA256 usando la Secret Key
 * Ejemplo: "amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP"
 */
function signFlowParams(params, secretKey) {
    const keys = Object.keys(params).sort();
    let toSign = '';
    for (const key of keys) {
        toSign += key + params[key];
    }
    return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

// ==========================================
// ENDPOINTS FLOW.CL (Abonos de $5.000)
// ==========================================

// Memoria para transacciones activas de Flow (asocia token -> credenciales y url)
const flowTransactions = new Map();

// Limpiar transacciones viejas cada hora (mayores a 24 horas)
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of flowTransactions.entries()) {
        if (now - data.createdAt > 24 * 60 * 60 * 1000) {
            flowTransactions.delete(token);
        }
    }
}, 60 * 60 * 1000);

// Endpoint para verificar si el backend está configurado
app.get('/api/flow/config', (req, res) => {
    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
    const protoHeader = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const originUrl = hostHeader ? `${protoHeader}://${hostHeader}` : BACKEND_URL;
    res.json({
        configured: !!(FLOW_API_KEY && FLOW_SECRET_KEY),
        sandbox: FLOW_IS_SANDBOX,
        backendUrl: originUrl,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para crear orden de abono en Flow
app.post('/api/flow/create', async (req, res) => {
    try {
        const { clientEmail, clientName, orderId, amount, isSandbox, returnUrl } = req.body;
        const abonoAmount = amount || 5000;
        const rawApiKey = req.body.apiKey || FLOW_API_KEY || '';
        const rawSecretKey = req.body.secretKey || FLOW_SECRET_KEY || '';
        const apiKey = rawApiKey.trim().replace(/^['"]|['"]$/g, '');
        const secretKey = rawSecretKey.trim().replace(/^['"]|['"]$/g, '');

        if (!apiKey || !secretKey) {
            return res.status(400).json({
                error: 'Faltan credenciales de Flow (API Key o Secret Key no configuradas).'
            });
        }

        // Determinar si usar sandbox o producción
        const useSandbox = isSandbox !== undefined ? isSandbox : FLOW_IS_SANDBOX;
        const flowApiUrl = useSandbox ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';

        // Determinar dinámicamente el dominio actual (funciona automáticamente en Vercel o localhost)
        const currentOrigin = getBaseUrl(req);

        // URL base de frontend a la que retornará el cliente
        let frontendReturn = returnUrl || req.headers.referer || `${currentOrigin}/index.html`;
        if (!frontendReturn.startsWith('http://') && !frontendReturn.startsWith('https://')) {
            frontendReturn = `${currentOrigin}/index.html`;
        }
        // En Vercel o producción, asegurarse de que no quede localhost si la petición vino desde un host público
        if (!currentOrigin.includes('localhost') && (frontendReturn.includes('localhost') || frontendReturn.includes('127.0.0.1'))) {
            frontendReturn = `${currentOrigin}/index.html`;
        }

        // En Vercel o dominios públicos, usar el webhook real /api/flow/notify
        const isPublicDomain = !currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1');
        const confirmationEndpoint = isPublicDomain ? `${currentOrigin}/api/flow/notify` : CONFIRMATION_URL;

        const commerceOrder = orderId || `ABONO-${Date.now()}`;

        // Empaquetar datos de retorno en urlReturn para garantizar persistencia en serverless (Vercel)
        const returnQueryParams = new URLSearchParams({
            frontend: frontendReturn.split('?')[0],
            sb: useSandbox ? '1' : '0'
        });
        if (apiKey && secretKey) {
            try {
                const creds = Buffer.from(JSON.stringify({ k: apiKey, s: secretKey })).toString('base64url');
                returnQueryParams.set('auth', creds);
            } catch(e) {}
        }

        const params = {
            apiKey: apiKey,
            commerceOrder: commerceOrder,
            subject: `Abono Reserva Cita - Nicolett Studio`,
            currency: 'CLP',
            amount: abonoAmount,
            email: clientEmail || 'cliente@estudio.cl',
            urlConfirmation: confirmationEndpoint,
            urlReturn: `${currentOrigin}/api/flow/return?${returnQueryParams.toString()}`
        };

        params.s = signFlowParams(params, secretKey);

        console.log(`[Flow] Creando pago en ${flowApiUrl}/payment/create`);
        console.log(`[Flow] Orden: ${commerceOrder}, Monto: ${abonoAmount}, Email: ${params.email}`);

        const formBody = new URLSearchParams(params).toString();
        const response = await fetch(`${flowApiUrl}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody
        });

        const flowData = await response.json();

        if (response.ok && flowData.url && flowData.token) {
            console.log(`[Flow] Pago creado exitosamente. Token: ${flowData.token}`);

            // Guardar contexto de la transacción para el retorno
            flowTransactions.set(flowData.token, {
                apiKey,
                secretKey,
                useSandbox,
                commerceOrder,
                frontendReturn,
                amount: abonoAmount,
                createdAt: Date.now()
            });

            res.json({
                success: true,
                token: flowData.token,
                url: flowData.url,
                redirectUrl: `${flowData.url}?token=${flowData.token}`,
                flowOrder: flowData.flowOrder
            });
        } else {
            console.error("[Flow] Error respuesta:", flowData);
            let errorMsg = flowData.message || 'Error en respuesta de Flow';
            if (typeof errorMsg === 'string' && errorMsg.includes('apiKey not found')) {
                errorMsg = `apiKey not found en ${useSandbox ? 'Flow Sandbox' : 'Flow Producción'}. ` +
                    (useSandbox 
                        ? 'Estás en modo Sandbox pero la API Key parece ser de tu cuenta real de flow.cl (desmarca la casilla Sandbox en la configuración).' 
                        : 'Estás en modo Producción pero la API Key no fue encontrada en www.flow.cl.');
            }
            res.status(400).json({ error: errorMsg, details: flowData });
        }
    } catch (error) {
        console.error("[Flow] Error creando pago:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para consultar estado de pago por token
app.get('/api/flow/status/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const tx = flowTransactions.get(token);
        const apiKey = (tx && tx.apiKey) || FLOW_API_KEY;
        const secretKey = (tx && tx.secretKey) || FLOW_SECRET_KEY;
        const useSandbox = tx ? tx.useSandbox : FLOW_IS_SANDBOX;
        const flowApiUrl = useSandbox ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';

        if (!apiKey || !secretKey) {
            return res.status(400).json({ error: 'Credenciales de Flow no disponibles para este token.' });
        }

        const params = { apiKey, token };
        params.s = signFlowParams(params, secretKey);
        const query = new URLSearchParams(params).toString();
        const statusRes = await fetch(`${flowApiUrl}/payment/getStatus?${query}`);
        const statusData = await statusRes.json();

        res.json(statusData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generador de plantilla HTML segura para el retorno del pago (evita ERR_UNSAFE_REDIRECT)
function renderReturnHtml(title, subtitle, isSuccess, targetUrl) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Nicolett Studio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #fff5f7, #fdf2f4);
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: white;
            padding: 40px 30px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.06);
            text-align: center;
            max-width: 480px;
            width: 100%;
        }
        .icon { font-size: 3.5rem; margin-bottom: 12px; }
        h2 { margin: 0 0 10px; color: ${isSuccess ? '#2e7d32' : '#c62828'}; font-size: 1.4rem; }
        p { color: #666; font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px; }
        .spinner {
            width: 28px;
            height: 28px;
            border: 3px solid rgba(212, 163, 115, 0.3);
            border-top-color: #d4a373;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn {
            display: inline-block;
            padding: 13px 30px;
            background: #d4a373;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            box-shadow: 0 4px 14px rgba(212, 163, 115, 0.4);
            transition: all 0.2s;
            cursor: pointer;
            border: none;
            font-size: 1rem;
        }
        .btn:hover { background: #b08968; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">${isSuccess ? '✨' : '⚠️'}</div>
        <div class="spinner"></div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <button id="btn-redirect" class="btn" onclick="doRedirect()">Continuar a Nicolett Studio</button>
    </div>
    <script>
        var navigated = false;
        function doRedirect() {
            if (navigated) return;
            navigated = true;
            if (window._redirTimer) clearTimeout(window._redirTimer);
            var btn = document.getElementById('btn-redirect');
            if (btn) {
                btn.disabled = true;
                btn.innerText = 'Redirigiendo...';
                btn.style.opacity = '0.7';
                btn.style.pointerEvents = 'none';
            }
            window.location.replace(${JSON.stringify(targetUrl)});
        }
        window._redirTimer = setTimeout(doRedirect, 800);
    </script>
</body>
</html>`;
}

// Endpoint de retorno tras pagar en Flow (GET o POST)
const handleFlowReturn = async (req, res) => {
    try {
        const token = (req.query && req.query.token) || (req.body && req.body.token);
        const tx = token ? flowTransactions.get(token) : null;

        // Determinar URL de retorno al frontend sin depender de memoria serverless ni localhost
        let targetFrontend = (req.query && req.query.frontend) || (tx && tx.frontendReturn) || getFrontendUrl(req);
        targetFrontend = targetFrontend.split('?')[0];
        if (!targetFrontend.startsWith('http://') && !targetFrontend.startsWith('https://')) {
            targetFrontend = `${getBaseUrl(req)}/index.html`;
        }
        // Si estamos en un dominio público (Vercel), forzar que no use localhost
        const currentBase = getBaseUrl(req);
        if (!currentBase.includes('localhost') && !currentBase.includes('127.0.0.1')) {
            if (targetFrontend.includes('localhost') || targetFrontend.includes('127.0.0.1')) {
                targetFrontend = `${currentBase}/index.html`;
            }
        }

        if (!token) {
            const redirectUrl = `${targetFrontend}?action=flow-cancelled`;
            return res.send(renderReturnHtml('Pago Cancelado', 'Has cancelado el proceso de pago en Flow.', false, redirectUrl));
        }

        // Consultar estado en Flow con soporte serverless (credenciales recuperadas)
        let isPaid = false;
        let flowOrder = '';
        let apiKey = (tx && tx.apiKey) || FLOW_API_KEY;
        let secretKey = (tx && tx.secretKey) || FLOW_SECRET_KEY;
        let useSandbox = (tx && tx.useSandbox !== undefined) ? tx.useSandbox : FLOW_IS_SANDBOX;

        if (req.query && req.query.sb !== undefined) {
            useSandbox = req.query.sb === '1';
        }

        if (req.query && req.query.auth && (!apiKey || !secretKey)) {
            try {
                const creds = JSON.parse(Buffer.from(req.query.auth, 'base64url').toString('utf8'));
                if (creds.k && creds.s) {
                    apiKey = creds.k;
                    secretKey = creds.s;
                }
            } catch(e) {}
        }

        const flowApiUrl = useSandbox ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';

        if (apiKey && secretKey) {
            const params = { apiKey, token };
            params.s = signFlowParams(params, secretKey);
            const query = new URLSearchParams(params).toString();
            const statusRes = await fetch(`${flowApiUrl}/payment/getStatus?${query}`);
            const statusData = await statusRes.json();
            console.log("[Flow Return] Estado:", statusData);
            isPaid = (statusData.status === 2); // 2 = Pagada en Flow
            flowOrder = statusData.flowOrder || '';
        } else {
            // Si no hay keys para consultar, asumimos pago ok al recibir token de retorno
            isPaid = true;
        }

        if (isPaid) {
            const redirectUrl = `${targetFrontend}?action=flow-success&token=${encodeURIComponent(token)}&order=${encodeURIComponent(flowOrder)}`;
            return res.send(renderReturnHtml(
                '¡Abono de $5.000 Confirmado!',
                'Tu pago vía Flow se ha recibido correctamente. Redirigiendo a tu cita en Nicolett Studio...',
                true,
                redirectUrl
            ));
        } else {
            const redirectUrl = `${targetFrontend}?action=flow-failed&token=${encodeURIComponent(token)}`;
            return res.send(renderReturnHtml(
                'Pago No Completado',
                'El pago del abono no fue aprobado en Flow. Puedes volver a intentar agendar tu cita.',
                false,
                redirectUrl
            ));
        }
    } catch (error) {
        console.error("[Flow Return] Error:", error);
        const fallbackUrl = `${getFrontendUrl(req)}?action=flow-error&msg=${encodeURIComponent(error.message)}`;
        res.send(renderReturnHtml('Error de Retorno', error.message, false, fallbackUrl));
    }
};

app.get('/api/flow/return', handleFlowReturn);
app.post('/api/flow/return', handleFlowReturn);

// Webhook de notificación asíncrona de Flow
app.post('/api/flow/notify', async (req, res) => {
    try {
        const token = req.body.token;
        console.log("[Flow Webhook] Notificación recibida para token:", token);

        const tx = flowTransactions.get(token);
        const apiKey = (tx && tx.apiKey) || FLOW_API_KEY;
        const secretKey = (tx && tx.secretKey) || FLOW_SECRET_KEY;
        const useSandbox = tx ? tx.useSandbox : FLOW_IS_SANDBOX;
        const flowApiUrl = useSandbox ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';

        if (token && apiKey && secretKey) {
            const params = { apiKey, token };
            params.s = signFlowParams(params, secretKey);
            const query = new URLSearchParams(params).toString();
            const statusRes = await fetch(`${flowApiUrl}/payment/getStatus?${query}`);
            const statusData = await statusRes.json();
            console.log("[Flow Webhook] Estado verificado:", statusData.status, "Orden:", statusData.flowOrder);
        }

        res.status(200).send("OK");
    } catch (e) {
        console.error("[Flow Webhook] Error:", e);
        res.status(500).send(e.message);
    }
});

// ==========================================
// ENDPOINTS WEBPAY PLUS (Respaldo Transbank)
// ==========================================

// Endpoint para crear una transacción en Webpay Plus
app.post('/api/webpay/create', async (req, res) => {
    try {
        const { buyOrder, sessionId, amount, returnUrl } = req.body;
        const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
        
        const createResponse = await tx.create(
            buyOrder,
            sessionId,
            amount || 5000,
            returnUrl || `${BACKEND_URL}/api/webpay/commit`
        );

        res.json({
            token: createResponse.token,
            url: createResponse.url
        });
    } catch (error) {
        console.error("Error creating Webpay transaction:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para confirmar la transacción Webpay
app.get('/api/webpay/commit', async (req, res) => {
    try {
        const token = req.query.token_ws;
        
        if (!token) {
            return res.send(`
                <html><body>
                    <h2>Pago cancelado o anulado.</h2>
                    <a href="${FRONTEND_URL}">Volver al inicio</a>
                </body></html>
            `);
        }

        const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
        const commitResponse = await tx.commit(token);

        if (commitResponse.status === 'AUTHORIZED') {
            res.redirect(`${FRONTEND_URL}?action=webpay-success&buyOrder=${commitResponse.buy_order}&authCode=${commitResponse.authorization_code}`);
        } else {
            res.send(`
                <html><body>
                    <h2>El pago fue rechazado o falló.</h2>
                    <p>Estado: ${commitResponse.status}</p>
                    <a href="${FRONTEND_URL}">Volver al inicio</a>
                </body></html>
            `);
        }
    } catch (error) {
        console.error("Error committing Webpay transaction:", error);
        res.send(`
            <html><body>
                <h2>Error al procesar el pago.</h2>
                <p>${error.message}</p>
            </body></html>
        `);
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Backend de pagos Flow y Webpay escuchando en http://localhost:${port}`);
    });
}

module.exports = app;

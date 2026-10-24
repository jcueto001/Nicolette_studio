const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = require('transbank-sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Configuración Flow.cl ---
const FLOW_API_KEY = process.env.FLOW_API_KEY || '';
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY || '';
const FLOW_IS_SANDBOX = process.env.FLOW_SANDBOX === 'true';
const FLOW_BASE_URL = FLOW_IS_SANDBOX ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${port}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/index.html';

/**
 * Función para firmar parámetros según el protocolo HMAC-SHA256 de Flow.cl
 */
function signFlowParams(params, secretKey) {
    const keys = Object.keys(params).sort();
    let toSign = '';
    for (const key of keys) {
        toSign += `${key}=${params[key]}&`;
    }
    toSign = toSign.slice(0, -1);
    return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

// ==========================================
// ENDPOINTS FLOW.CL (Abonos de $5.000)
// ==========================================

// Endpoint para crear orden de abono en Flow
app.post('/api/flow/create', async (req, res) => {
    try {
        const { clientEmail, clientName, orderId, amount } = req.body;
        const abonoAmount = amount || 5000;
        const apiKey = req.body.apiKey || FLOW_API_KEY;
        const secretKey = req.body.secretKey || FLOW_SECRET_KEY;

        if (!apiKey || !secretKey) {
            return res.status(400).json({ 
                error: 'Faltan credenciales de Flow (API Key o Secret Key no configuradas).' 
            });
        }

        const commerceOrder = orderId || `ABONO-${Date.now()}`;
        const params = {
            apiKey: apiKey,
            commerceOrder: commerceOrder,
            subject: `Abono Reserva Cita ($${abonoAmount}) - Nicolett Studio`,
            currency: 'CLP',
            amount: abonoAmount,
            email: clientEmail || 'cliente@estudio.cl',
            urlConfirmation: `${BACKEND_URL}/api/flow/notify`,
            urlReturn: `${BACKEND_URL}/api/flow/return`
        };

        params.s = signFlowParams(params, secretKey);

        const formBody = new URLSearchParams(params).toString();
        const response = await fetch(`${FLOW_BASE_URL}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody
        });

        const flowData = await response.json();

        if (response.ok && flowData.url && flowData.token) {
            res.json({
                success: true,
                token: flowData.token,
                url: flowData.url,
                redirectUrl: `${flowData.url}?token=${flowData.token}`,
                flowOrder: flowData.flowOrder
            });
        } else {
            console.error("Error respuesta Flow:", flowData);
            res.status(400).json({ error: flowData.message || 'Error en respuesta de Flow' });
        }
    } catch (error) {
        console.error("Error creando pago Flow:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de retorno tras pagar en Flow (GET o POST)
const handleFlowReturn = async (req, res) => {
    try {
        const token = req.query.token || req.body.token;

        if (!token) {
            return res.send(`
                <html><head><meta charset="UTF-8"><title>Pago Cancelado</title></head>
                <body style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h2>El pago en Flow fue cancelado o no completado.</h2>
                    <p>Puedes regresar al sitio para intentar nuevamente.</p>
                    <a href="${FRONTEND_URL}" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#d4a373; color:white; text-decoration:none; border-radius:4px;">Volver al Inicio</a>
                </body></html>
            `);
        }

        // Consultar estado en Flow si hay API Key configurada
        let isPaid = true;
        let flowOrder = '';
        if (FLOW_API_KEY && FLOW_SECRET_KEY) {
            const params = { apiKey: FLOW_API_KEY, token: token };
            params.s = signFlowParams(params, FLOW_SECRET_KEY);
            const query = new URLSearchParams(params).toString();
            const statusRes = await fetch(`${FLOW_BASE_URL}/payment/getStatus?${query}`);
            const statusData = await statusRes.json();
            isPaid = (statusData.status === 2); // 2 = Pagada en Flow
            flowOrder = statusData.flowOrder || '';
        }

        if (isPaid) {
            res.redirect(`${FRONTEND_URL}?action=flow-success&token=${encodeURIComponent(token)}&order=${encodeURIComponent(flowOrder)}`);
        } else {
            res.send(`
                <html><head><meta charset="UTF-8"><title>Pago no completado</title></head>
                <body style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h2>El pago del abono en Flow no fue aprobado.</h2>
                    <p>Por favor vuelve a intentar con otro medio de pago.</p>
                    <a href="${FRONTEND_URL}" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#d4a373; color:white; text-decoration:none; border-radius:4px;">Volver a Intentar</a>
                </body></html>
            `);
        }
    } catch (error) {
        console.error("Error confirmando Flow return:", error);
        res.redirect(`${FRONTEND_URL}?action=flow-error&msg=${encodeURIComponent(error.message)}`);
    }
};

app.get('/api/flow/return', handleFlowReturn);
app.post('/api/flow/return', handleFlowReturn);

// Webhook de notificación asíncrona de Flow
app.post('/api/flow/notify', async (req, res) => {
    try {
        const token = req.body.token;
        console.log("Notificación recibida de Flow para token:", token);
        res.status(200).send("OK");
    } catch (e) {
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

app.listen(port, () => {
    console.log(`Backend de pagos Flow y Webpay escuchando en http://localhost:${port}`);
});

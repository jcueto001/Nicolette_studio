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
app.use(express.json({ limit: '16kb', inflate: false }));
app.use(express.urlencoded({ extended: false, limit: '16kb', inflate: false }));

// Servir los archivos estáticos de la web completa (HTML, CSS, JS, imágenes)
// Permite acceder a la web en http://localhost:3000 sin problemas de protocolo file://
for (const directory of ['js', 'css', 'img', 'images', 'fonts', 'assets']) {
    app.use('/' + directory, express.static(path.join(__dirname, '..', directory), { dotfiles: 'deny' }));
}
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/reset-password.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'reset-password.html')));

// Ruta limpia para restablecer contraseña personalizada de Nicolett Studio
app.get(['/reset-password', '/restablecer-contrasena'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'reset-password.html'));
});

// Flow: secretos y confirmaciones exclusivamente en servidor.
const admin = require('firebase-admin');
function database() {
    if (!admin.apps.length) admin.initializeApp(); // Application Default Credentials, solo servidor.
    return admin.firestore();
}
const FLOW_API_KEY = (process.env.FLOW_API_KEY || '').trim();
const FLOW_SECRET_KEY = (process.env.FLOW_SECRET_KEY || '').trim();
const FLOW_IS_SANDBOX = process.env.FLOW_SANDBOX !== 'false';
const FLOW_BASE_URL = FLOW_IS_SANDBOX ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';
const BACKEND_URL = process.env.BACKEND_URL || '';
const FRONTEND_URL = process.env.FRONTEND_URL || '';
function originUrl() {
    const url = new URL(BACKEND_URL);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
        throw new Error('BACKEND_URL requiere HTTPS.');
    }
    return url.origin;
}
function signFlowParams(params) {
    return crypto.createHmac('sha256', FLOW_SECRET_KEY)
        .update(Object.keys(params).sort().map(key => key + params[key]).join('')).digest('hex');
}
async function flowRequest(endpoint, fields, method = 'GET') {
    if (!FLOW_API_KEY || !FLOW_SECRET_KEY) throw new Error('Flow no configurado.');
    const params = { ...fields, apiKey: FLOW_API_KEY };
    params.s = signFlowParams(params);
    const body = new URLSearchParams(params).toString();
    const response = await fetch(FLOW_BASE_URL + endpoint + (method === 'GET' ? '?' + body : ''), {
        method, signal: AbortSignal.timeout(15000),
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body } : {})
    });
    const data = await response.json();
    if (!response.ok) throw new Error('Flow rechazó la solicitud.');
    return data;
}
function tokenRef(token) {
    if (typeof token !== 'string' || !/^[a-zA-Z0-9_-]{8,256}$/.test(token)) throw new Error('Token inválido.');
    return database().collection('FlowTransactions').doc(crypto.createHash('sha256').update(token).digest('hex'));
}
function receiptHash(receipt) { return crypto.createHash('sha256').update(receipt).digest('hex'); }
async function confirmPayment(token, receipt) {
    const ref = tokenRef(token);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Transacción desconocida.');
    const tx = snap.data();
    if (receipt !== undefined && (typeof receipt !== 'string' || receipt.length > 128 || receiptHash(receipt) !== tx.receiptHash)) {
        throw new Error('Comprobante inválido.');
    }
    if (tx.sandbox !== FLOW_IS_SANDBOX) throw new Error('Entorno incorrecto.');
    const status = await flowRequest('/payment/getStatus', { token });
    if (status.status !== 2) return { paid: false };
    if (String(status.commerceOrder) !== tx.orderId || status.currency !== 'CLP' || Number(status.amount) !== 5000 ||
        String(status.flowOrder) !== String(tx.flowOrder)) throw new Error('Pago no corresponde a la reserva.');
    await database().runTransaction(async transaction => {
        const current = await transaction.get(ref);
        if (!current.exists || current.data().paid) return;
        const booking = { ...current.data().booking, status: 'confirmada', paymentStatus: 'pagado',
            depositAmount: 5000, paymentMethod: 'Flow', flowOrder: tx.flowOrder, orderId: tx.orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp() };
        transaction.create(database().collection('Citas').doc(tx.orderId), booking);
        transaction.update(ref, { paid: true, paidAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return { paid: true };
}
app.get('/api/flow/config', (req, res) => res.json({ configured: !!(FLOW_API_KEY && FLOW_SECRET_KEY && BACKEND_URL), sandbox: FLOW_IS_SANDBOX }));
app.post('/api/flow/create', async (req, res) => {
    try {
        if (['apiKey', 'secretKey', 'amount', 'isSandbox', 'returnUrl'].some(key => key in req.body)) {
            return res.status(400).json({ error: 'Parámetros de pago no permitidos.' });
        }
        const input = req.body.booking || {};
        const booking = {};
        for (const key of ['serviceId', 'profId', 'date', 'time', 'clientName', 'clientPhone', 'clientEmail', 'notes']) {
            if (input[key] !== undefined) {
                if (typeof input[key] !== 'string' || input[key].length > 1000) throw new Error('Reserva inválida.');
                booking[key] = input[key];
            }
        }
        if (!booking.clientName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.clientEmail || '') ||
            !/^\d{4}-\d{2}-\d{2}$/.test(booking.date || '') || !/^\d{2}:\d{2}$/.test(booking.time || '') ||
            !booking.serviceId || !booking.profId || /[/]/.test(booking.serviceId + booking.profId)) throw new Error('Reserva incompleta.');
        if (input.needs && typeof input.needs === 'object' && !Array.isArray(input.needs)) {
            booking.needs = Object.fromEntries(['kids', 'time', 'event'].map(key => [key, input.needs[key] === true]));
        }
        const db = database();
        const [service, professional] = await Promise.all([
            db.collection('Servicios').doc(booking.serviceId).get(), db.collection('Profesionales').doc(booking.profId).get()
        ]);
        if (!service.exists || !professional.exists || professional.data().activo === false) throw new Error('Servicio o profesional no disponible.');
        const price = Number(service.data().price ?? service.data().precio);
        if (!Number.isFinite(price) || price < 5000) throw new Error('Precio inválido.');
        Object.assign(booking, { servicio: service.data().name || service.data().nombre || booking.serviceId,
            profesional: professional.data().name || professional.data().nombre || booking.profId,
            totalPrice: price, balanceDue: price - 5000 });
        const orderId = 'FLOW-' + crypto.randomUUID();
        const receipt = crypto.randomBytes(32).toString('hex');
        const origin = originUrl();
        const data = await flowRequest('/payment/create', { commerceOrder: orderId, subject: 'Abono reserva Nicolett Studio',
            currency: 'CLP', amount: 5000, email: booking.clientEmail,
            urlConfirmation: origin + '/api/flow/notify', urlReturn: origin + '/api/flow/return' }, 'POST');
        const paymentUrl = new URL(data.url);
        const expectedHost = FLOW_IS_SANDBOX ? 'sandbox.flow.cl' : 'www.flow.cl';
        if (paymentUrl.protocol !== 'https:' || paymentUrl.hostname !== expectedHost || !data.token || !data.flowOrder) throw new Error('Respuesta inválida de Flow.');
        await tokenRef(data.token).create({ booking, orderId, flowOrder: data.flowOrder, receiptHash: receiptHash(receipt), sandbox: FLOW_IS_SANDBOX, paid: false });
        paymentUrl.searchParams.set('token', data.token);
        res.json({ success: true, receipt, redirectUrl: paymentUrl.href });
    } catch (error) { res.status(400).json({ error: 'No se pudo crear el pago. Revisa la reserva y la configuración del servidor.' }); }
});
app.get('/api/flow/status/:token', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
        const receipt = req.get('X-Booking-Receipt');
        if (!receipt) return res.status(403).json({ error: 'Comprobante requerido.' });
        res.json(await confirmPayment(req.params.token, receipt));
    } catch (error) { res.status(400).json({ error: 'Pago no verificado.' }); }
});
async function handleFlowReturn(req, res) {
    res.set('Cache-Control', 'no-store');
    const token = req.query.token || req.body?.token;
    try {
        const result = await confirmPayment(token);
        const target = new URL('/index.html', originUrl());
        target.searchParams.set('action', result.paid ? 'flow-success' : 'flow-failed');
        target.searchParams.set('token', token);
        res.redirect(303, target.href);
    } catch (error) { res.status(400).send('No se pudo verificar el pago. Conserva tu comprobante.'); }
}
app.get('/api/flow/return', handleFlowReturn);
app.post('/api/flow/return', handleFlowReturn);
app.post('/api/flow/notify', async (req, res) => {
    try { await confirmPayment(req.body.token); res.status(200).send('OK'); }
    catch (error) { res.status(503).send('Pago no verificado; reintentar.'); }
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

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
const localFirebase = require('./firebase-emulators')(process.env);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '16kb', inflate: false }));
app.use(express.urlencoded({ extended: false, limit: '16kb', inflate: false }));

if (localFirebase.enabled) {
    app.use(async (req, res, next) => {
        if (!['127.0.0.1', 'localhost', '[::1]'].includes(req.hostname)) {
            return res.status(403).send('Modo local: solo localhost.');
        }
        if (/^\/api\/(flow|webpay)(\/|$)/.test(req.path)) {
            return res.status(503).json({ error: 'Pagos externos deshabilitados en modo emuladores.' });
        }
        try { await localFirebase.assertAvailable(); next(); }
        catch (error) {
            return res.status(503).type('text/plain').send('Inicia Auth y Firestore Emulator; no se usará producción.');
        }
    });
    app.get('/js/firebase-config.js', (req, res) => {
        res.set('Cache-Control', 'no-store');
        const source = require('node:fs').readFileSync(path.join(__dirname, 'firebase-emulator-client.js'), 'utf8');
        res.type('application/javascript').send(source.replace('/* EMULATOR_PORTS */ { auth: 9099, firestore: 8080 }', JSON.stringify(localFirebase.ports)));
    });
}
// En localhost no permitir que olvidar el flag cargue la configuración real.
app.get('/js/firebase-config.js', (req, res, next) => {
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production'
        && ['localhost', '127.0.0.1', '[::1]'].includes(req.hostname)) {
        return res.status(503).type('text/plain').send('Activa LOCAL_FIREBASE_EMULATORS=1 para pruebas locales.');
    }
    next();
});

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
const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
function database() {
    if (localFirebase.enabled) return localFirebase.database({ getApps, initializeApp, getFirestore });
    let app = getApps().find(item => item.name === '[DEFAULT]');
    if (!app) {
        const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
        const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
        if (!projectId || !clientEmail || !privateKey) throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED');
        try { app = initializeApp({ projectId, credential: cert({ projectId, clientEmail, privateKey }) }); }
        catch (_) { throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED'); }
    }
    return getFirestore(app);
}
const FLOW_API_KEY = (process.env.FLOW_API_KEY || '').trim();
const FLOW_SECRET_KEY = (process.env.FLOW_SECRET_KEY || '').trim();
const FLOW_IS_SANDBOX = process.env.FLOW_SANDBOX !== 'false';
const FLOW_BASE_URL = FLOW_IS_SANDBOX ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api';
const BACKEND_URL = process.env.BACKEND_URL || '';
const FRONTEND_URL = process.env.FRONTEND_URL || '';
function bookingPaused() {
    return String(process.env.BOOKING_PAUSED || '').trim().toLowerCase() === 'true';
}
function bookingPausedResponse(res) {
    return res.status(503).set('Cache-Control', 'no-store').json({
        code: 'BOOKING_PAUSED',
        error: 'Las nuevas reservas están temporalmente pausadas por mantenimiento. Inténtalo más tarde.'
    });
}
function requireBookingOpen(req, res, next) {
    if (bookingPaused()) return bookingPausedResponse(res);
    next();
}
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
function reportFlowError(operation, error) {
    const codes = new Set(['FLOW_NOT_CONFIGURED', 'FLOW_TIMEOUT', 'FLOW_NETWORK_ERROR', 'FLOW_INVALID_RESPONSE',
        'FLOW_AUTH_REJECTED', 'FLOW_RETURN_URL_REJECTED', 'FLOW_PROVIDER_REJECTED', 'INVALID_FLOW_RESPONSE',
        'PAYMENT_CREATION_PENDING_REVIEW', 'BOOKING_MIGRATION_REQUIRED', 'SLOT_UNAVAILABLE',
        'FIREBASE_ADMIN_NOT_CONFIGURED', 'FLOW_ORDER_CONFLICT', 'FLOW_TOKEN_CONFLICT']);
    const firestoreCodes = { 7: 'FIRESTORE_PERMISSION_DENIED', 14: 'FIRESTORE_UNAVAILABLE',
        4: 'FIRESTORE_TIMEOUT', 'permission-denied': 'FIRESTORE_PERMISSION_DENIED', unavailable: 'FIRESTORE_UNAVAILABLE' };
    console.warn('[Flow]', { operation, environment: FLOW_IS_SANDBOX ? 'sandbox' : 'production',
        code: codes.has(error?.code) ? error.code : firestoreCodes[error?.code] || 'FLOW_OPERATION_FAILED',
        ...(Number.isInteger(error?.providerHttpStatus) ? { providerHttpStatus: error.providerHttpStatus } : {}),
        ...(Number.isSafeInteger(error?.providerCode) ? { providerCode: error.providerCode } : {}) });
}
async function flowRequest(endpoint, fields, method = 'GET') {
    const failure = (code, details = {}) => Object.assign(new Error(code), { code, ...details });
    if (!FLOW_API_KEY || !FLOW_SECRET_KEY) throw failure('FLOW_NOT_CONFIGURED');
    const params = { ...fields, apiKey: FLOW_API_KEY };
    params.s = signFlowParams(params);
    const body = new URLSearchParams(params).toString();
    let response;
    try {
        response = await fetch(FLOW_BASE_URL + endpoint + (method === 'GET' ? '?' + body : ''), {
            method, signal: AbortSignal.timeout(15000),
            ...(method === 'POST' ? { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body } : {})
        });
    } catch (error) { throw failure(['TimeoutError', 'AbortError'].includes(error.name) ? 'FLOW_TIMEOUT' : 'FLOW_NETWORK_ERROR'); }
    let data;
    try { data = await response.json(); }
    catch (error) { throw failure(['TimeoutError', 'AbortError'].includes(error.name) ? 'FLOW_TIMEOUT' : 'FLOW_INVALID_RESPONSE', { providerHttpStatus: response.status }); }
    if (!response.ok) {
        // Clasificar el texto del proveedor sin registrarlo: puede contener datos sensibles.
        const message = typeof data?.message === 'string' ? data.message : '';
        const code = /api.?key|secret.?key|signature|firma|credentials/i.test(message) ? 'FLOW_AUTH_REJECTED'
            : /urlreturn|urlconfirmation/i.test(message) ? 'FLOW_RETURN_URL_REJECTED' : 'FLOW_PROVIDER_REJECTED';
        throw failure(code, { providerHttpStatus: response.status,
            ...(Number.isSafeInteger(data?.code) ? { providerCode: data.code } : {}) });
    }
    return data;
}
const { createBookingService } = require('./booking-service');
function bookings() {
    return createBookingService(database(), {
        isBookingPaused: bookingPaused,
        sandbox: FLOW_IS_SANDBOX,
        flowCreate: localFirebase.enabled ? undefined : async (orderId, booking) => {
            const origin = originUrl();
            const data = await flowRequest('/payment/create', { commerceOrder: orderId, subject: 'Abono reserva Nicolett Studio',
                currency: 'CLP', amount: 5000, email: booking.clientEmail,
                urlConfirmation: origin + '/api/flow/notify', urlReturn: origin + '/api/flow/return' }, 'POST');
            const url = new URL(data.url);
            if (url.protocol !== 'https:' || url.hostname !== (FLOW_IS_SANDBOX ? 'sandbox.flow.cl' : 'www.flow.cl')) throw new Error('INVALID_FLOW_RESPONSE');
            url.searchParams.set('token', data.token);
            return { ...data, redirectUrl: url.href };
        },
        flowStatus: localFirebase.enabled ? undefined : token => flowRequest('/payment/getStatus', { token })
    });
}
const confirmPayment = async (token, receipt) => {
    const result = await bookings().confirmPayment(token, receipt);
    if (result.paid && result.booked) {
        try {
            const email = await require('./appointment-email').notifyConfirmedAppointment(database(), token, { env: process.env, fetchImpl: fetch });
            return { ...result, emailStatus: email.status, ...(email.errorCode ? { emailErrorCode: email.errorCode } : {}) };
        } catch (_) {
            console.warn('[AppointmentEmail] No se pudo completar la notificación; el pago conserva su estado verificado.');
            return { ...result, emailStatus: 'review_required' };
        }
    }
    return result;
};
function bookingError(error, res) {
    if (error.code === 'BOOKING_PAUSED') return bookingPausedResponse(res);
    const safeCodes = new Set(['SLOT_UNAVAILABLE', 'BOOKING_MIGRATION_REQUIRED', 'INVALID_CATALOG_DURATION',
        'INVALID_CATALOG_PRICE', 'CATALOG_UNAVAILABLE', 'PROFESSIONAL_UNAVAILABLE', 'PAST_BOOKING', 'OUTSIDE_SCHEDULE',
        'INVALID_DATE', 'INVALID_TIME', 'INVALID_ID', 'INVALID_REQUEST_ID', 'IDEMPOTENCY_MISMATCH',
        'PAYMENT_CREATION_PENDING_REVIEW', 'FORBIDDEN', 'STALE_APPOINTMENT', 'MIGRATION_REQUIRED_FOR_APPOINTMENT']);
    res.status(error.status || 400).json({ error: safeCodes.has(error.code) ? error.code : 'BOOKING_REQUEST_FAILED' });
}
async function requireStaff(req, res, next) {
    try {
        const match = /^Bearer (.+)$/.exec(req.get('Authorization') || '');
        if (!match) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        const db = database();
        const app = getApps().find(item => item.name === (localFirebase.enabled ? localFirebase.appName : '[DEFAULT]'));
        const { getAuth } = require('firebase-admin/auth');
        const user = await getAuth(app).verifyIdToken(match[1], true);
        const record = await db.collection('Usuarios').doc(user.uid).get();
        const data = record.exists ? record.data() : null;
        if (!data || data.activo === false || !['Admin', 'admin', 'profesional'].includes(data.rol)) return res.status(403).json({ error: 'FORBIDDEN' });
        req.staff = { uid: user.uid, role: data.rol.toLowerCase() };
        next();
    } catch (error) { res.status(403).json({ error: 'FORBIDDEN' }); }
}
app.post('/api/bookings/:id/email', requireStaff, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
        if (!req.body || Object.keys(req.body).some(key => key !== 'requestId')) {
            return res.status(400).json({ error: 'INVALID_EMAIL_REQUEST' });
        }
        const result = await require('./appointment-email').resendAppointmentEmail(database(), req.params.id, req.staff, req.body.requestId,
            { env: process.env, fetchImpl: fetch });
        res.json(result);
    } catch (error) {
        const allowed = new Set(['INVALID_EMAIL_REQUEST', 'FORBIDDEN', 'CONFIRMED_APPOINTMENT_REQUIRED', 'EMAIL_REQUEST_MISMATCH',
            'EMAIL_SEND_IN_PROGRESS', 'EMAIL_DELIVERY_UNCERTAIN', 'EMAIL_RETRY_RATE_LIMIT']);
        res.status(allowed.has(error.code) ? error.status : 503).json({ error: allowed.has(error.code) ? error.code : 'EMAIL_NOTIFICATION_UNAVAILABLE' });
    }
});
app.post('/api/fichas', requireStaff, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { res.json(await require('./ficha-service').saveFicha(database(), req.body.ficha, req.body.requestId, req.staff)); }
    catch (error) {
        const codes = ['INVALID_FICHA', 'INVALID_QUANTITY', 'FORBIDDEN', 'INVALID_ATTENTION',
            'FICHA_ALREADY_RECORDED', 'FICHA_REVIEW_REQUIRED', 'INSUFFICIENT_STOCK'];
        res.status(codes.includes(error.code) ? error.status : 503).json({ error: codes.includes(error.code) ? error.code : 'FICHA_SAVE_FAILED' });
    }
});
app.get('/api/bookings/availability', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
        const times = (req.query.times || '09:00,11:00,13:00,15:00,17:00,19:00,21:00').split(',');
        res.json({ times: await bookings().availability({ date: req.query.date, profId: req.query.profId, serviceId: req.query.serviceId, times }) });
    } catch (error) { bookingError(error, res); }
});
app.post('/api/bookings/manual', requireBookingOpen, requireStaff, async (req, res) => {
    try {
        const saved = await bookings().reserve(req.body.booking, req.body.requestId, 'manual', req.staff);
        res.json((await database().collection('Citas').doc(saved.reservationId).get()).data());
    } catch (error) { bookingError(error, res); }
});
app.patch('/api/bookings/:id', requireStaff, async (req, res) => {
    try { res.json(await bookings().change(req.params.id, req.body.changes || {}, req.staff, req.body.requestId)); }
    catch (error) { bookingError(error, res); }
});
app.get('/api/flow/config', (req, res) => res.json({ configured: !!(FLOW_API_KEY && FLOW_SECRET_KEY && BACKEND_URL), sandbox: FLOW_IS_SANDBOX }));
app.post('/api/flow/create', requireBookingOpen, async (req, res) => {
    try {
        if (['apiKey', 'secretKey', 'amount', 'isSandbox', 'returnUrl'].some(key => key in (req.body || {}))) {
            return res.status(400).json({ error: 'Parámetros de pago no permitidos.' });
        }
        if (!FLOW_API_KEY || !FLOW_SECRET_KEY) return res.status(503).json({ error: 'PAYMENTS_DISABLED' });
        res.json(await bookings().createPayment(req.body.booking, req.body.requestId));
    } catch (error) { reportFlowError('create', error); bookingError(error, res); }
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
        target.searchParams.set('action', result.conflict ? 'flow-conflict' : result.paid && result.booked ? 'flow-success' : 'flow-failed');
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
app.post('/api/webpay/create', requireBookingOpen, async (req, res) => {
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
    localFirebase.assertAvailable().then(() => {
        app.listen(port, ...(localFirebase.enabled ? ['127.0.0.1'] : []), () => {
            console.log(`Servidor disponible en http://localhost:${port}`);
        });
    }).catch(() => {
        console.error('No se inicia la SPA: faltan los emuladores locales de Auth/Firestore.');
        process.exitCode = 1;
    });
}

module.exports = app;

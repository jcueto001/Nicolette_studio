const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// Dobles locales: ninguna prueba llama a Firebase, Google o Flow.
async function fixture(env = {}, hooks = {}) {
    const { db, docs } = require('./test-firestore').memoryFirestore([
        ['BookingConfig/control', { version: 1, ready: true }],
        ['Servicios/s1', { name: 'Servicio', price: 15000, duration: 60 }],
        ['Profesionales/p1', { name: 'Profesional', activo: true }]
    ]);
    const appApi = { getApps: () => [{ name: '[DEFAULT]' }], initializeApp: () => { throw new Error('App ya inicializada'); } };
    const firestoreApi = { getFirestore: () => db, FieldValue: { serverTimestamp: () => 'server-time' } };
    let fields;
    let statusOverride = {};
    const context = {
        require: name => name === 'firebase-admin/app' ? appApi : name === 'firebase-admin/firestore' ? firestoreApi : name === 'dotenv' ? { config() {} } : require(name),
        module: { exports: {} }, __dirname, URL, URLSearchParams, AbortSignal, console: hooks.console || console,
        process: { env: { BACKEND_URL: 'http://localhost:3000', FLOW_API_KEY: 'test-only', FLOW_SECRET_KEY: 'test-only', ...env } },
        fetch: async (url, options) => {
            if (url.includes('/payment/create')) {
                fields = new URLSearchParams(options.body);
                if (hooks.flowCreate) return hooks.flowCreate();
                return { ok: true, json: async () => ({ url: 'https://sandbox.flow.cl/app/web/pay.php', token: 'test_token_123', flowOrder: 123 }) };
            }
            return { ok: true, json: async () => ({ status: 2, commerceOrder: fields?.get('commerceOrder'), currency: 'CLP', amount: 5000, flowOrder: 123, ...statusOverride }) };
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), context);
    const server = context.module.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const request = (route, options) => fetch(`http://127.0.0.1:${server.address().port}${route}`, options);
    const create = booking => request('/api/flow/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking, requestId: 'security-test-request-00000001' }) });
    return { docs, request, create, setStatus: value => { statusOverride = value; }, fields: () => fields,
        close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
const booking = { serviceId: 's1', profId: 'p1', clientName: 'Test', clientEmail: 'test@example.invalid',
    date: '2035-12-01', time: '10:00', needs: { kids: true }, totalPrice: 1, paymentStatus: 'pagado' };

test('Backend inicia; no publica backend ni acepta parámetros de pago del cliente', async () => {
    const f = await fixture();
    try {
        assert.equal((await f.request('/api/flow/config')).status, 200);
        assert.equal((await f.request('/backend/server.js')).status, 404);
        assert.equal((await f.request('/package.json')).status, 404);
        const response = await f.request('/api/flow/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1 }) });
        assert.equal(response.status, 400);
        const returned = await f.request('/api/flow/return?token=unknown_token&auth=ignored&sb=1', { redirect: 'manual' });
        assert.equal(returned.status, 303);
        const target = new URL(returned.headers.get('location'));
        assert.equal(target.origin, 'http://localhost:3000');
        assert.equal(target.searchParams.get('action'), 'flow-failed');
        assert.equal(target.searchParams.has('auth'), false);
        assert.equal([...f.docs.keys()].filter(key => key.startsWith('Citas/')).length, 0);
    } finally { await f.close(); }
});

test('Pago validado, precio de catálogo, persistencia e idempotencia', async () => {
    const f = await fixture();
    try {
        const created = await f.create(booking);
        assert.equal(created.status, 200);
        const data = await created.json();
        assert.ok(data.receipt);
        assert.equal(f.fields().get('amount'), '5000');
        assert.equal(new URL(f.fields().get('urlReturn')).search, '');
        assert.equal((await f.request('/api/flow/status/test_token_123')).status, 403);
        assert.equal((await f.request('/api/flow/status/test_token_123', { headers: { 'X-Booking-Receipt': 'wrong' } })).status, 400);
        const options = { headers: { 'X-Booking-Receipt': data.receipt } };
        const results = await Promise.all([f.request('/api/flow/status/test_token_123', options), f.request('/api/flow/status/test_token_123', options)]);
        for (const result of results) assert.equal((await result.json()).paid, true);
        const citas = [...f.docs].filter(([key]) => key.startsWith('Citas/'));
        assert.equal(citas.length, 1);
        assert.equal(citas[0][1].totalPrice, 15000);
        assert.equal(citas[0][1].balanceDue, 10000);
        assert.equal(citas[0][1].paymentStatus, 'pagado');
        const notify = await f.request('/api/flow/notify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'token=test_token_123' });
        assert.equal(notify.status, 200);
    } finally { await f.close(); }
});

test('Pago pendiente, monto/moneda/orden incorrectos o claves ausentes nunca confirman', async () => {
    const f = await fixture();
    try {
        const data = await (await f.create(booking)).json();
        for (const status of [{ status: 1 }, { amount: 1 }, { currency: 'USD' }, { commerceOrder: 'other' }, { flowOrder: 999 }]) {
            f.setStatus(status);
            const response = await f.request('/api/flow/status/test_token_123', { headers: { 'X-Booking-Receipt': data.receipt } });
            assert.notEqual((await response.json()).paid, true);
        }
        assert.equal([...f.docs.keys()].filter(key => key.startsWith('Citas/')).length, 0);
    } finally { await f.close(); }
    const missing = await fixture({ FLOW_SECRET_KEY: '' });
    try { assert.equal((await missing.create(booking)).status, 503); }
    finally { await missing.close(); }
});

test('StorageHelper ignora sesión falsificada, exige rol por UID y no valida claves locales', async () => {
    const store = new Map([['nicolett_auth', JSON.stringify({ loggedIn: true, user: { role: 'admin' } })]]);
    let current = { uid: 'uid-test', email: 'test@example.invalid' };
    let userData = null;
    const context = { console, window: { location: { origin: 'http://localhost' } },
        localStorage: { getItem: key => store.get(key) || null, setItem: (key, val) => store.set(key, val), removeItem: key => store.delete(key) },
        firebase: { auth: () => ({ currentUser: current }), firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: !!userData, data: () => userData }) }) }) }) }
    };
    const source = fs.readFileSync(path.join(__dirname, '../js/mockData.js'), 'utf8').replace('StorageHelper.init();', 'globalThis.helper = StorageHelper;');
    vm.runInNewContext(source, context);
    assert.equal(context.helper.getAuth().loggedIn, false);
    assert.equal(context.helper.verifyStaffPassword('any', 'anything'), false);
    await assert.rejects(context.helper.resolveStaffUser(current));
    userData = { rol: 'profesional', nombre: 'Test' };
    await context.helper.resolveStaffUser(current);
    assert.equal(context.helper.getAuth().user.role, 'profesional');
    current = null;
    assert.equal(context.helper.getAuth().loggedIn, false);
});

test('Rechazo de Firebase no intenta autenticación offline', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    const start = source.indexOf('window.authenticateStaffUser = async function');
    const end = source.indexOf('\n        };', start) + '\n        };'.length;
    const context = { window: {}, firebase: { auth: () => ({ signInWithEmailAndPassword: async () => { throw new Error('auth/invalid-credential'); } }) },
        StorageHelper: { verifyStaffPassword: () => assert.fail('No debe usar contraseña local') } };
    vm.runInNewContext(source.slice(start, end), context);
    await assert.rejects(context.window.authenticateStaffUser('admin@example.invalid', 'wrong'), /invalid-credential/);
});

test('URL flow-success falsificada no escribe reservas', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    const start = source.indexOf('async function checkFlowPaymentReturn()');
    const end = source.indexOf('// --- Modal y Acceso', start);
    let alerts = 0;
    const context = { URLSearchParams, window: { location: { search: '?action=flow-success&token=forged', pathname: '/', hash: '' }, history: { replaceState() {} } },
        document: { title: 'Test' }, sessionStorage: { getItem: () => null }, alert: () => { alerts++; },
        StorageHelper: { saveAppointment: () => assert.fail('El cliente no debe confirmar pagos') },
        fetch: () => assert.fail('Sin comprobante no debe consultar') };
    vm.runInNewContext(source.slice(start, end), context);
    await context.checkFlowPaymentReturn();
    assert.equal(alerts, 1);
});

test('Retorno verifica el estado servidor aunque la etiqueta diga fallido, sin confirmar desde navegador', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    const start = source.indexOf('async function checkFlowPaymentReturn()');
    const end = source.indexOf('// --- Modal y Acceso', start);
    for (const action of ['flow-success', 'flow-failed', 'flow-conflict']) {
        const messages = [], stored = new Map([['nicolett_flow_receipt', 'a'.repeat(64)]]);
        let requests = 0;
        const context = { URLSearchParams, window: { location: { search: '?action=' + action + '&token=synthetic_token_123', pathname: '/', hash: '' }, history: { replaceState() {} } },
            document: { title: 'Synthetic' }, sessionStorage: { getItem: key => stored.get(key), removeItem: key => stored.delete(key) },
            localStorage: { removeItem() {} }, alert: message => messages.push(message),
            StorageHelper: { saveAppointment: () => assert.fail('No confirmar desde cliente') },
            fetch: async (_, options) => {
                requests++; assert.equal(options.headers['X-Booking-Receipt'], 'a'.repeat(64));
                return { ok: true, json: async () => ({ paid: true, booked: true, emailStatus: 'pending_configuration' }) };
            } };
        vm.runInNewContext(source.slice(start, end), context);
        await context.checkFlowPaymentReturn();
        assert.equal(requests, 1); assert.ok(messages[0].includes('Tu cita está confirmada'));
        assert.equal(stored.has('nicolett_flow_receipt'), false);
    }
});

test('Reenvío del panel usa backend y conserva requestId si se pierde respuesta, sin enviar datos privados del navegador', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    const start = source.indexOf('function appointmentEmailMessage(');
    const end = source.indexOf('// Variable de bloqueo', start);
    const requests = [];let first = true;
    const context = { window: {}, crypto: { randomUUID: () => 'synthetic-request-id' },
        document: { querySelectorAll: () => [] }, alert() {},
        StorageHelper: { getAppointments: () => [{ id: 'r', clientEmail: 'private@example.invalid', clientName: 'PRIVATE' }] },
        firebase: { auth: () => ({ currentUser: { getIdToken: async () => 'synthetic-auth-token' } }) },
        fetch: async (url, options) => {
            assert.equal(url, '/api/bookings/r/email');assert.equal(options.headers.Authorization, 'Bearer synthetic-auth-token');
            const payload = JSON.parse(options.body);assert.deepEqual(Object.keys(payload), ['requestId']);requests.push(payload.requestId);
            if (first) { first = false;throw new Error('synthetic timeout'); }
            return { ok: true, json: async () => ({ status: 'sent' }) };
        } };
    vm.runInNewContext(source.slice(start, end), context);
    await context.window.resendAppointmentEmail('r');await context.window.resendAppointmentEmail('r');
    assert.deepEqual(requests, ['synthetic-request-id', 'synthetic-request-id']);
});

test('Backend real carga Admin SDK y responde localmente sin credenciales', async () => {
    process.env.FLOW_API_KEY = '';
    process.env.FLOW_SECRET_KEY = '';
    process.env.DOTENV_CONFIG_QUIET = 'true';
    const app = require('./server');
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/flow/config`);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).configured, false);
    } finally {
        await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
});

test('Diagnóstico Flow seguro: rechazo, timeout y respuesta inválida sin secretos ni reintentos', async () => {
    const sensitive = 'secret-synthetic-token-and-email@example.invalid';
    for (const scenario of [
        { code: 'FLOW_AUTH_REJECTED', run: () => ({ ok: false, status: 401, json: async () => ({ code: 123, message: 'apiKey not found ' + sensitive }) }) },
        { code: 'FLOW_RETURN_URL_REJECTED', run: () => ({ ok: false, status: 400, json: async () => ({ message: 'urlReturn invalid ' + sensitive }) }) },
        { code: 'FLOW_TIMEOUT', run: () => { throw Object.assign(new Error(sensitive), { name: 'TimeoutError' }); } },
        { code: 'FLOW_NETWORK_ERROR', run: () => { throw new Error(sensitive); } },
        { code: 'FLOW_INVALID_RESPONSE', run: () => ({ status: 502, json: async () => { throw new Error(sensitive); } }) }
    ]) {
        const logs = []; let attempts = 0;
        const f = await fixture({}, { console: { ...console, warn: (...args) => logs.push(args) },
            flowCreate: () => { attempts++; return scenario.run(); } });
        try {
            const first = await f.create(booking);
            const payload = await first.json();
            assert.equal(payload.error, 'BOOKING_REQUEST_FAILED');
            assert.equal(logs[0][1].code, scenario.code);
            assert.equal(logs[0][1].environment, 'sandbox');
            const retry = await f.create(booking);
            assert.equal(retry.status, 409);
            assert.equal((await retry.json()).error, 'PAYMENT_CREATION_PENDING_REVIEW');
            assert.equal(attempts, 1);
            assert.equal(logs.at(-1)[1].code, 'PAYMENT_CREATION_PENDING_REVIEW');
            assert.equal(JSON.stringify(logs).includes(sensitive), false);
            assert.equal(JSON.stringify(payload).includes(sensitive), false);
            assert.equal([...f.docs.keys()].filter(key => key.startsWith('Citas/')).length, 0);
        } finally { await f.close(); }
    }
});

test('Retorno Flow vuelve al estudio por GET/POST incluso ante error, sin confirmar ni redirigir a URLs ajenas', async () => {
    const f = await fixture({}, { console: { ...console, warn() {} } });
    try {
        for (const options of [undefined, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'token=unknown_token&returnUrl=https://example.invalid' }]) {
            const response = await f.request('/api/flow/return' + (options ? '' : '?token=unknown_token&returnUrl=https://example.invalid'), { ...options, redirect: 'manual' });
            assert.equal(response.status, 303);
            assert.equal(response.headers.get('cache-control'), 'no-store');
            const location = new URL(response.headers.get('location'));
            assert.equal(location.origin, 'http://localhost:3000');
            assert.equal(location.searchParams.get('action'), 'flow-failed');
            assert.equal(location.searchParams.get('token'), 'unknown_token');
            assert.equal(location.searchParams.has('returnUrl'), false);
        }
        const missing = await f.request('/api/flow/return', { redirect: 'manual' });
        const location = new URL(missing.headers.get('location'));
        assert.equal(location.searchParams.get('action'), 'flow-failed');
        assert.equal(location.searchParams.has('token'), false);
        assert.equal([...f.docs.keys()].filter(key => key.startsWith('Citas/')).length, 0);
    } finally { await f.close(); }
});

test('Splash se omite en retornos de Flow y no cambia almacenamiento de pagos', () => {
    const source = fs.readFileSync(path.join(__dirname, '../js/welcome.js'), 'utf8');
    for (const action of ['flow-success', 'flow-failed', 'flow-conflict']) {
        vm.runInNewContext(source, {
            window: { location: { hash: '', search: '?action=' + action + '&token=synthetic_token' },
                matchMedia: () => ({ matches: false }) },
            sessionStorage: { getItem() { assert.fail('El retorno no debe leer almacenamiento del splash'); } }
        });
    }
});

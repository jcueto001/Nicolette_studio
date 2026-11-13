const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// Dobles locales: ninguna prueba llama a Firebase, Google o Flow.
async function fixture(env = {}) {
    const docs = new Map([
        ['Servicios/s1', { name: 'Servicio', price: 15000 }],
        ['Profesionales/p1', { name: 'Profesional', activo: true }]
    ]);
    const snapshot = key => ({ exists: docs.has(key), data: () => docs.get(key) });
    const ref = key => ({ key, get: async () => snapshot(key), create: async data => {
        if (docs.has(key)) throw new Error('exists');
        docs.set(key, data);
    } });
    let queue = Promise.resolve();
    const db = {
        collection: name => ({ doc: id => ref(name + '/' + id) }),
        runTransaction: callback => {
            const next = queue.then(() => callback({
                get: async r => snapshot(r.key),
                create: (r, data) => { assert.equal(docs.has(r.key), false); docs.set(r.key, data); },
                update: (r, data) => docs.set(r.key, { ...docs.get(r.key), ...data })
            }));
            queue = next.catch(() => {});
            return next;
        }
    };
    const firestore = () => db;
    firestore.FieldValue = { serverTimestamp: () => 'server-time' };
    const admin = { apps: [{}], firestore };
    let fields;
    let statusOverride = {};
    const context = {
        require: name => name === 'firebase-admin' ? admin : name === 'dotenv' ? { config() {} } : require(name),
        module: { exports: {} }, __dirname, URL, URLSearchParams, AbortSignal, console,
        process: { env: { BACKEND_URL: 'http://localhost:3000', FLOW_API_KEY: 'test-only', FLOW_SECRET_KEY: 'test-only', ...env } },
        fetch: async (url, options) => {
            if (url.includes('/payment/create')) {
                fields = new URLSearchParams(options.body);
                return { ok: true, json: async () => ({ url: 'https://sandbox.flow.cl/app/web/pay.php', token: 'test_token_123', flowOrder: 123 }) };
            }
            return { ok: true, json: async () => ({ status: 2, commerceOrder: fields?.get('commerceOrder'), currency: 'CLP', amount: 5000, flowOrder: 123, ...statusOverride }) };
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), context);
    const server = context.module.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const request = (route, options) => fetch(`http://127.0.0.1:${server.address().port}${route}`, options);
    const create = booking => request('/api/flow/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking }) });
    return { docs, request, create, setStatus: value => { statusOverride = value; }, fields: () => fields,
        close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
const booking = { serviceId: 's1', profId: 'p1', clientName: 'Test', clientEmail: 'test@example.invalid',
    date: '2026-12-01', time: '10:00', needs: { kids: true }, totalPrice: 1, paymentStatus: 'pagado' };

test('Backend inicia; no publica backend ni acepta parámetros de pago del cliente', async () => {
    const f = await fixture();
    try {
        assert.equal((await f.request('/api/flow/config')).status, 200);
        assert.equal((await f.request('/backend/server.js')).status, 404);
        assert.equal((await f.request('/package.json')).status, 404);
        const response = await f.request('/api/flow/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1 }) });
        assert.equal(response.status, 400);
        assert.equal((await f.request('/api/flow/return?token=unknown_token&auth=ignored&sb=1')).status, 400);
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
    try { assert.equal((await missing.create(booking)).status, 400); }
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

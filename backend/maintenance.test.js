const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { memoryFirestore } = require('./test-firestore');
const { createBookingService } = require('./booking-service');

async function httpFixture(paused) {
    const calls = [];
    const env = { BACKEND_URL: 'http://localhost:3000', FRONTEND_URL: 'http://localhost:3000/index.html',
        FLOW_API_KEY: 'test-only', FLOW_SECRET_KEY: 'test-only' };
    if (paused !== undefined) env.BOOKING_PAUSED = paused;
    const db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ id: 'existing', rol: 'admin', activo: true }) }) }) }) };
    const appApi = { getApps: () => [{ name: '[DEFAULT]' }], initializeApp: () => assert.fail('App ya inicializada') };
    const gateway = { WebpayPlus: { Transaction: class {
        async create() { calls.push('webpay.create'); return { token: 'test-token', url: 'https://example.invalid' }; }
        async commit() { calls.push('webpay.commit'); return { status: 'AUTHORIZED', buy_order: 'test-order', authorization_code: 'test-code' }; }
    } }, Options: class {}, IntegrationCommerceCodes: { WEBPAY_PLUS: 'test' }, IntegrationApiKeys: { WEBPAY: 'test' }, Environment: { Integration: 'test' } };
    const services = { createBookingService: (database, options) => ({
        createPayment: async () => { calls.push('flow.create'); assert.equal(options.isBookingPaused(), false); return { success: true }; },
        reserve: async () => { calls.push('manual.create'); assert.equal(options.isBookingPaused(), false); return { reservationId: 'existing' }; },
        confirmPayment: async () => { calls.push('confirm'); return { paid: true, booked: true }; },
        availability: async () => { calls.push('availability'); return ['10:00']; },
        change: async () => { calls.push('change'); return { id: 'existing', status: 'cancelada' }; }
    }) };
    const context = { __dirname, process: { env }, module: { exports: {} }, console, URL, URLSearchParams, AbortSignal,
        fetch: () => assert.fail('Ninguna llamada a servicios externos permitida'),
        require: name => {
            if (name === 'dotenv') return { config() {} };
            if (name === 'firebase-admin/app') return appApi;
            if (name === 'firebase-admin/firestore') return { getFirestore: () => db };
            if (name === 'firebase-admin/auth') return { getAuth: () => ({ verifyIdToken: async () => ({ uid: 'admin' }) }) };
            if (name === 'transbank-sdk') return gateway;
            if (name === './booking-service') return services;
            return require(name);
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), context);
    const server = context.module.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    return { env, calls,
        request: (route, options = {}) => fetch(`http://127.0.0.1:${server.address().port}${route}`, { redirect: 'manual', ...options }),
        close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
const post = { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer synthetic-token' }, body: '{}' };

test('Pausa bloquea Flow, Webpay y manuales antes de crear órdenes o retenciones', async () => {
    const f = await httpFixture('true');
    try {
        for (const route of ['/api/flow/create', '/api/webpay/create', '/api/bookings/manual', '/API/FLOW/CREATE/', '/API/BOOKINGS/MANUAL/']) {
            const response = await f.request(route, post);
            assert.equal(response.status, 503);
            assert.equal(response.headers.get('cache-control'), 'no-store');
            const body = await response.json();
            assert.equal(body.code, 'BOOKING_PAUSED'); assert.match(body.error, /mantenimiento/);
        }
        assert.deepEqual(f.calls, []);
        const response = await f.request('/api/flow/create?BOOKING_PAUSED=false', { ...post, body: JSON.stringify({ BOOKING_PAUSED: false }) });
        assert.equal(response.status, 503);
    } finally { await f.close(); }
});
test('Variable ausente o false conserva las tres rutas de creación', async () => {
    for (const value of [undefined, 'false']) {
        const f = await httpFixture(value);
        try {
            for (const route of ['/api/flow/create', '/api/webpay/create', '/api/bookings/manual']) assert.equal((await f.request(route, post)).status, 200);
            assert.deepEqual(f.calls, ['flow.create', 'webpay.create', 'manual.create']);
        } finally { await f.close(); }
    }
});
test('Pausa mantiene webhooks, retornos, verificación, estado, disponibilidad y cancelación', async () => {
    const f = await httpFixture('true');
    try {
        const status = await f.request('/api/flow/status/existing-token', { headers: { 'X-Booking-Receipt': 'synthetic-receipt' } });
        assert.equal(status.status, 200); assert.equal((await status.json()).paid, true);
        assert.equal((await f.request('/api/flow/notify', { ...post, body: JSON.stringify({ token: 'existing-token' }) })).status, 200);
        assert.equal((await f.request('/api/flow/return?token=existing-token')).status, 303);
        assert.equal((await f.request('/api/flow/return', { ...post, body: JSON.stringify({ token: 'existing-token' }) })).status, 303);
        assert.equal((await f.request('/api/webpay/commit?token_ws=existing-token')).status, 302);
        assert.equal((await f.request('/api/bookings/availability')).status, 200);
        assert.equal((await f.request('/api/flow/config')).status, 200);
        assert.equal((await f.request('/api/bookings/existing', { ...post, method: 'PATCH', body: JSON.stringify({ changes: { status: 'cancelada' } }) })).status, 200);
        assert.equal(f.calls.filter(call => call === 'confirm').length, 4);
        assert.ok(f.calls.includes('webpay.commit')); assert.ok(f.calls.includes('change'));
        assert.ok(!f.calls.some(call => call.endsWith('.create')));
    } finally { await f.close(); }
});
test('Estado de pausa se consulta en cada petición, no desde el cuerpo del cliente', async () => {
    const f = await httpFixture('false');
    try {
        assert.equal((await f.request('/api/flow/create', post)).status, 200);
        f.env.BOOKING_PAUSED = ' TRUE ';
        assert.equal((await f.request('/api/flow/create', post)).status, 503);
        delete f.env.BOOKING_PAUSED;
        assert.equal((await f.request('/api/flow/create', post)).status, 200);
    } finally { await f.close(); }
});
test('Servicio real bloquea reactivaciones/reprogramaciones, mantiene cancelaciones y pagos existentes', async () => {
    const { db, docs } = memoryFirestore([
        ['BookingConfig/control', { ready: true, version: 1 }],
        ['Servicios/s', { name: 'Synthetic', price: 12000, duration: 60 }],
        ['Profesionales/p', { id: 'p', activo: true }]
    ]);
    let paused = false;
    const payments = new Map();
    const service = createBookingService(db, { now: () => Date.parse('2034-01-01T00:00:00Z'), isBookingPaused: () => paused,
        flowCreate: async id => { payments.set('existing_token_123', { commerceOrder: id, status: 2, currency: 'CLP', amount: 5000, flowOrder: 1 }); return { token: 'existing_token_123', flowOrder: 1, redirectUrl: 'https://sandbox.flow.cl/pay' }; },
        flowStatus: async token => payments.get(token) });
    const input = { serviceId: 's', profId: 'p', date: '2035-01-10', time: '10:00', clientName: 'Synthetic', clientEmail: 'synthetic@example.invalid' };
    await service.createPayment(input, crypto.randomUUID());
    const before = structuredClone([...docs]); paused = true;
    await assert.rejects(service.createPayment({ ...input, time: '12:00' }, crypto.randomUUID()), { code: 'BOOKING_PAUSED', status: 503 });
    await assert.rejects(service.reserve({ ...input, time: '12:00' }, crypto.randomUUID(), 'manual', { uid: 'admin', role: 'admin' }), { code: 'BOOKING_PAUSED' });
    assert.deepEqual([...docs], before, 'Pausa no libera ni altera retenciones existentes');
    assert.equal((await service.confirmPayment('existing_token_123')).booked, true);
    const id = payments.get('existing_token_123').commerceOrder, actor = { uid: 'admin', role: 'admin' };
    await assert.rejects(service.change(id, { time: '12:00', revision: 0 }, actor, crypto.randomUUID()), { code: 'BOOKING_PAUSED' });
    await service.change(id, { status: 'completada', revision: 0 }, actor, crypto.randomUUID());
    await service.change(id, { status: 'cancelada', revision: 1 }, actor, crypto.randomUUID());
    const cancelled = structuredClone([...docs]);
    await assert.rejects(service.change(id, { status: 'confirmada', revision: 2 }, actor, crypto.randomUUID()), { code: 'BOOKING_PAUSED' });
    assert.deepEqual([...docs], cancelled);
    paused = false;
    await service.change(id, { status: 'confirmada', revision: 2 }, actor, crypto.randomUUID());
});

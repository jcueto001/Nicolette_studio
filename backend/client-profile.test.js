const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { memoryFirestore } = require('./test-firestore');
const { createClientProfileService } = require('./client-profile');

function fixture() {
    const original = [
        ['Citas/past', { clientEmail: 'client@example.invalid', servicio: 'Original', date: '2020-01-01', status: 'completada', totalPrice: 12000, notes: 'PRIVATE', profId: 'worker-a' }],
        ['Citas/future', { clientEmail: 'client@example.invalid', date: '2035-01-01', time: '10:00', status: 'confirmada', depositAmount: 5000, profId: 'worker-a' }],
        ['Citas/pending', { clientEmail: 'client@example.invalid', status: 'pendiente de pago', paymentStatus: 'pendiente' }],
        ['Citas/foreign', { clientEmail: 'other@example.invalid', status: 'confirmada', profId: 'worker-b' }]
    ];
    const { db, docs } = memoryFirestore(original);
    let time = 10000000;
    const sent = [];
    const env = { CLIENT_PROFILE_SECRET: 'synthetic-local-test-secret-only-32-characters' };
    const service = createClientProfileService(db, { env, now: () => time,
        sendCode: async (email, code) => { sent.push({ email, code }); } });
    return { service, db, docs, env, sent, original, advance: ms => { time += ms; } };
}

test('Correo verificado consulta solo citas propias, pasadas y futuras, sin copiar ni modificar reservas', async () => {
    const f = fixture();
    await assert.rejects(f.service.appointments('client@example.invalid'), { code: 'CLIENT_ACCESS_REQUIRED' });
    const challenge = await f.service.requestCode(' Client@Example.Invalid ', 'synthetic-ip');
    assert.equal(f.sent[0].email, 'client@example.invalid');
    assert.match(f.sent[0].code, /^\d{6}$/);
    assert.equal(JSON.stringify(challenge).includes(f.sent[0].code), false);
    const session = await f.service.verifyCode(challenge.challenge, f.sent[0].code);
    const result = await f.service.appointments(session.token);
    assert.equal(result.email, 'client@example.invalid');
    assert.equal(result.appointments.length, 3);
    assert.equal(result.appointments.some(row => row.id === 'foreign'), false);
    assert.equal(result.appointments.some(row => 'notes' in row || 'profId' in row || 'clientEmail' in row), false);
    assert.equal(result.appointments.find(row => row.id === 'pending').status, 'pendiente de pago');
    for (const [key, value] of f.original) assert.deepEqual(f.docs.get(key), value);
    assert.equal([...f.docs.keys()].every(key => key.startsWith('Citas/') || key.startsWith('perfil_cliente/__access_')), true);
    const saved = [...f.docs.values()].find(data => data.email === 'client@example.invalid');
    assert.equal(saved.codeHash, null);
    assert.equal(JSON.stringify([...f.docs]).includes(session.token), false);
    await assert.rejects(f.service.verifyCode(challenge.challenge, f.sent[0].code), { code: 'INVALID_CLIENT_CODE' });
});

test('Código: intentos limitados, expiración, challenge alterado y uso concurrente único', async () => {
    let f = fixture(); let c = await f.service.requestCode('client@example.invalid', 'ip');
    const wrong = f.sent[0].code === '000000' ? '000001' : '000000';
    for (let i = 0; i < 5; i++) await assert.rejects(f.service.verifyCode(c.challenge, wrong), { code: 'INVALID_CLIENT_CODE' });
    await assert.rejects(f.service.verifyCode(c.challenge, f.sent[0].code), { code: 'INVALID_CLIENT_CODE' });
    f = fixture(); c = await f.service.requestCode('client@example.invalid', 'ip'); f.advance(600001);
    await assert.rejects(f.service.verifyCode(c.challenge, f.sent[0].code), { code: 'INVALID_CLIENT_CODE' });
    f = fixture(); c = await f.service.requestCode('client@example.invalid', 'ip');
    const results = await Promise.allSettled([f.service.verifyCode(c.challenge, f.sent[0].code), f.service.verifyCode(c.challenge, f.sent[0].code)]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
});

test('Sesiones: token alterado, logout durable y vencimiento rechazan consultas', async () => {
    const f = fixture(); const c = await f.service.requestCode('client@example.invalid', 'ip');
    const session = await f.service.verifyCode(c.challenge, f.sent[0].code);
    const [key, token] = session.token.split('.');
    await assert.rejects(f.service.appointments(key + '.' + (token[0] === 'a' ? 'b' : 'a') + token.slice(1)), { code: 'CLIENT_ACCESS_REQUIRED' });
    await f.service.logout(session.token);
    await assert.rejects(f.service.appointments(session.token), { code: 'CLIENT_ACCESS_REQUIRED' });
    f.advance(60001); const next = await f.service.requestCode('client@example.invalid', 'ip');
    const second = await f.service.verifyCode(next.challenge, f.sent.at(-1).code);
    assert.equal(second.expiresIn, 86400);
    f.advance(23 * 3600000);
    assert.equal((await f.service.appointments(second.token)).appointments.length, 3);
    f.advance(3600001);
    await assert.rejects(f.service.appointments(second.token), { code: 'CLIENT_ACCESS_REQUIRED' });
});

test('Logout durante verificación invalida el código y también una sesión recién creada', async () => {
    const f = fixture(); const c = await f.service.requestCode('client@example.invalid', 'ip');
    await f.service.logout(undefined, c.challenge);
    await assert.rejects(f.service.verifyCode(c.challenge, f.sent[0].code), { code: 'INVALID_CLIENT_CODE' });
    f.advance(60001); const next = await f.service.requestCode('client@example.invalid', 'ip');
    const session = await f.service.verifyCode(next.challenge, f.sent.at(-1).code);
    await f.service.logout(undefined, next.challenge);
    await assert.rejects(f.service.appointments(session.token), { code: 'CLIENT_ACCESS_REQUIRED' });
});

test('Envíos limitados en transacciones, correos inexistentes sin enumeración y fallo de envío seguro', async () => {
    const f = fixture();
    const results = await Promise.allSettled([f.service.requestCode('new@example.invalid', 'ip'), f.service.requestCode('new@example.invalid', 'ip')]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 2);
    assert.equal(results[0].value.challenge, results[1].value.challenge);
    assert.equal(f.sent.length, 1);
    for (let i = 0; i < 2; i++) { f.advance(60001); await f.service.requestCode('new@example.invalid', 'ip'); }
    f.advance(60001);
    await assert.rejects(f.service.requestCode('new@example.invalid', 'ip'), { code: 'CLIENT_CODE_RATE_LIMIT' });
    const broken = createClientProfileService(f.db, { env: f.env, sendCode: async () => { throw Object.assign(new Error('synthetic-secret'), { deliveryRejected: true }); } });
    await assert.rejects(broken.requestCode('different@example.invalid', 'ip'), error => error.code === 'CLIENT_CODE_DELIVERY_FAILED' && !error.message.includes('synthetic-secret'));
});

test('Correo entregado con respuesta perdida permite verificar y recuperar el mismo código sin reenviar', async () => {
    const f = fixture(); let sentCode, sends = 0;
    const service = createClientProfileService(f.db, { env: f.env, sendCode: async (_, code) => {
        sends++; sentCode = code;
        throw Object.assign(new Error('synthetic-sensitive-provider-body'), { name: 'TimeoutError' });
    } });
    const requested = await service.requestCode('client@example.invalid', 'ip');
    assert.equal(requested.delivery, 'unconfirmed');
    assert.equal(requested.expiresIn, 600);
    const recovered = await service.requestCode('client@example.invalid', 'ip');
    assert.equal(recovered.challenge, requested.challenge); assert.equal(sends, 1);
    const access = await service.verifyCode(recovered.challenge, sentCode);
    assert.equal((await service.appointments(access.token)).appointments.length, 3);
});

test('Estado hidden del perfil prevalece sobre display inline-flex de botones', () => {
    const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');
    assert.match(css, /#client-private-appointments \[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('EmailJS simulado: 200 confirma envío, 5xx permite código recibido y 4xx conserva rechazo', async () => {
    for (const status of [200, 502, 403]) {
        const f = fixture(); let params;
        const service = createClientProfileService(f.db, { env: { ...f.env, EMAILJS_SERVICE_ID: 'synthetic-service',
            EMAILJS_CLIENT_ACCESS_TEMPLATE_ID: 'synthetic-template', EMAILJS_PUBLIC_KEY: 'synthetic-public', EMAILJS_PRIVATE_KEY: 'synthetic-private' },
        fetchImpl: async (url, options) => {
            assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send');
            const body = JSON.parse(options.body); params = body.template_params;
            assert.equal(body.template_id, 'synthetic-template');
            return { status, ok: status === 200 };
        } });
        if (status === 403) {
            await assert.rejects(service.requestCode('client@example.invalid', 'ip'), { code: 'CLIENT_CODE_DELIVERY_FAILED' });
        } else {
            const result = await service.requestCode('client@example.invalid', 'ip');
            assert.equal(result.delivery, status === 200 ? 'sent' : 'unconfirmed');
            const session = await service.verifyCode(result.challenge, params.code);
            assert.equal((await service.appointments(session.token)).appointments.length, 3);
        }
        assert.equal(params.to_email, 'client@example.invalid');
    }
});

test('Configuración incompleta y modo local impiden enviar correos externos', async () => {
    const f = fixture();
    assert.throws(() => createClientProfileService(f.db, { env: {} }), { code: 'CLIENT_ACCESS_NOT_CONFIGURED' });
    const local = createClientProfileService(f.db, { env: { ...f.env, LOCAL_FIREBASE_EMULATORS: '1',
        EMAILJS_SERVICE_ID: 'test', EMAILJS_CLIENT_ACCESS_TEMPLATE_ID: 'test', EMAILJS_PUBLIC_KEY: 'test', EMAILJS_PRIVATE_KEY: 'test' } });
    await assert.rejects(local.requestCode('client@example.invalid', 'ip'), { code: 'CLIENT_ACCESS_NOT_CONFIGURED' });
    assert.equal(f.docs.size, 4);
});

test('Frontend mantiene respuestas privadas fuera de almacenamiento y escapa campos mediante textContent', () => {
    const source = fs.readFileSync(path.join(__dirname, '../js/client-profile.js'), 'utf8');
    assert.equal(source.includes('innerHTML'), false);
    assert.equal(source.includes('setItem'), false);
    assert.ok(source.includes('textContent'));
    assert.ok(source.includes('epoch === generation && root.isConnected'));
    assert.ok(source.includes('credentials: \'same-origin\''));
    new vm.Script(source);
});

test('Histórico con mayúsculas verificadas se recupera sin duplicar ni consultar otros correos', async () => {
    const f = fixture();
    f.docs.set('Citas/mixed', { clientEmail: 'Client@Example.Invalid', status: 'cancelada' });
    const code = await f.service.requestCode('Client@Example.Invalid', 'ip');
    const session = await f.service.verifyCode(code.challenge, f.sent[0].code);
    const rows = (await f.service.appointments(session.token)).appointments;
    assert.equal(rows.length, 4);
    assert.equal(rows.find(row => row.id === 'mixed').status, 'cancelada');
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
});

test('HTTP local: cookie HttpOnly, CSRF, email manipulado, revocación y acceso anónimo', async () => {
    const f = fixture();
    const context = { require: name => {
        if (name === 'firebase-admin/app') return { getApps: () => [{ name: '[DEFAULT]' }] };
        if (name === 'firebase-admin/firestore') return { getFirestore: () => f.db };
        if (name === './client-profile') return { createClientProfileService: () => f.service };
        if (name === 'dotenv') return { config() {} };
        return require(name);
    }, module: { exports: {} }, __dirname, console, URL, URLSearchParams, AbortSignal,
        process: { env: { BACKEND_URL: 'http://localhost:3000' } }, fetch: () => assert.fail('Servicios externos prohibidos') };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), context);
    const server = context.module.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const request = (route, options) => fetch('http://127.0.0.1:' + server.address().port + '/api/client-profile/' + route, options);
    const post = (body, cookie) => ({ method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
    try {
        assert.equal((await request('appointments?email=client@example.invalid')).status, 401);
        const denied = post({ email: 'client@example.invalid' }); denied.headers.Origin = 'https://example.invalid';
        assert.equal((await request('code', denied)).status, 403);
        assert.equal(f.sent.length, 0);
        const challenge = await (await request('code', post({ email: 'client@example.invalid' }))).json();
        const verified = await request('verify', post({ challenge: challenge.challenge, code: f.sent[0].code }));
        assert.equal(verified.status, 200);
        const cookieHeader = verified.headers.get('set-cookie');
        assert.match(cookieHeader, /HttpOnly/); assert.match(cookieHeader, /SameSite=Strict/); assert.match(cookieHeader, /Path=\/api\/client-profile/);
        assert.equal('token' in await verified.json(), false);
        const cookie = cookieHeader.split(';')[0];
        const response = await request('appointments?email=other@example.invalid', { headers: { Cookie: cookie } });
        assert.equal(response.headers.get('cache-control'), 'no-store');
        const data = await response.json(); assert.equal(data.appointments.length, 3);
        assert.equal(data.appointments.some(row => row.id === 'foreign'), false);
        assert.equal((await request('logout', post({}, cookie))).status, 200);
        assert.equal((await request('appointments', { headers: { Cookie: cookie } })).status, 401);
    } finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
});

test('DOM simulado: código, historial literal, estados reales, logout y respuesta tardía', async () => {
    function element() {
        return { children: [], listeners: {}, hidden: false, disabled: false, value: '', textContent: '', isConnected: true,
            appendChild(node) { this.children.push(node); }, replaceChildren() { this.children = []; }, focus() {},
            addEventListener(name, fn, options) { this.listeners[name] = fn; options?.signal.addEventListener('abort', () => { delete this.listeners[name]; }); } };
    }
    const root = element(), status = element(), list = element(), request = element(), verify = element(), close = element(), input = element(), button = element();
    const nodes = { '[data-client-status]': status, '[data-client-appointments]': list, '[data-client-request]': request,
        '[data-client-verify]': verify, '[data-client-close]': close };
    root.querySelector = selector => nodes[selector]; verify.querySelector = selector => selector === 'input' ? input : button;
    let verified = false, deferred, resolveLate;
    const timers = new Map(); let next = 0;
    const payload = '<img src=x onerror=alert(1)> Ángela O\'Connor';
    const context = { AbortController, console, Date, setTimeout: (fn, ms) => { timers.set(++next, { fn, ms }); return next; }, clearTimeout: id => timers.delete(id),
        document: { getElementById: () => root, querySelector: selector => nodes[selector], createElement: element },
        window: { addEventListener() {} }, fetch: async (url, options) => {
            if (url.endsWith('/code')) return { ok: true, json: async () => ({ challenge: 'synthetic-challenge' }) };
            if (url.endsWith('/verify')) { verified = true; return { ok: true, json: async () => ({ verified: true }) }; }
            if (url.endsWith('/logout')) { verified = false; return { ok: true, json: async () => ({ success: true }) }; }
            if (deferred) return deferred;
            return { ok: verified, json: async () => verified ? { email: 'client@example.invalid', expiresAtMs: Date.now() + 1800000,
                appointments: [{ servicio: payload, status: 'pendiente de pago', depositAmount: 5000 }] } : { error: 'CLIENT_ACCESS_REQUIRED' } };
        } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/client-profile.js'), 'utf8'), context);
    const tick = () => new Promise(resolve => setImmediate(resolve));
    context.window.ClientProfile.mount('client@example.invalid'); await tick();
    assert.equal(list.children.length, 0); assert.equal(request.disabled, false);
    await request.listeners.click(); assert.equal(verify.hidden, false);
    input.value = '123456'; await verify.listeners.submit({ preventDefault() {} });
    assert.equal(list.children.length, 1);
    assert.equal(list.children[0].children[0].textContent, payload);
    assert.ok(list.children[0].children[1].textContent.includes('pendiente de pago'));
    assert.equal(input.value, '');
    deferred = new Promise(resolve => { resolveLate = resolve; });
    const poll = [...timers.values()].find(item => item.ms === 30000); poll.fn();
    await context.window.ClientProfile.logout(); assert.equal(list.children.length, 0);
    resolveLate({ ok: true, json: async () => ({ email: 'client@example.invalid', appointments: [{ servicio: 'LATE' }] }) });
    await tick(); assert.equal(list.children.length, 0); assert.equal(timers.size, 0);
});

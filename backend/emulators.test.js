const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const createMode = require('./firebase-emulators');

test('Configuración: puertos loopback y reglas locales', () => {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../firebase.json'), 'utf8'));
    for (const [name, port] of Object.entries({ auth: 9099, firestore: 8080, ui: 4000 })) {
        assert.equal(config.emulators[name].host, '127.0.0.1');
        assert.equal(config.emulators[name].port, port);
    }
    assert.equal(config.firestore.rules, 'firestore.rules');
    assert.ok(fs.existsSync(path.join(__dirname, '..', config.firestore.rules)));
});

test('Backend: modo explícito, proyecto demo y sin credenciales productivas', () => {
    assert.equal(createMode({}).enabled, false);
    assert.throws(() => createMode({ LOCAL_FIREBASE_EMULATORS: '1', VERCEL: '1' }));
    assert.throws(() => createMode({ LOCAL_FIREBASE_EMULATORS: '1', NODE_ENV: 'production' }));
    assert.throws(() => createMode({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' }));
    const env = { LOCAL_FIREBASE_EMULATORS: '1', GCLOUD_PROJECT: 'wrong-project',
        GOOGLE_APPLICATION_CREDENTIALS: 'unused-test-path', FLOW_API_KEY: 'unused', FLOW_SECRET_KEY: 'unused' };
    const mode = createMode(env);
    assert.equal(env.GCLOUD_PROJECT, 'demo-nicolett');
    assert.equal(env.GOOGLE_CLOUD_PROJECT, 'demo-nicolett');
    assert.equal(env.METADATA_SERVER_DETECTION, 'none');
    assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
    assert.equal(env.FLOW_API_KEY, '');
    assert.equal(env.FLOW_SECRET_KEY, '');
    let initialized;
    const apps = [{ name: '[DEFAULT]' }];
    let initializations = 0;
    const fakeAdmin = { getApps: () => apps, initializeApp: (options, name) => {
        initializations++;
        initialized = { options, name };
        const app = { name }; apps.push(app); return app;
    }, getFirestore: app => { assert.equal(app.name, 'nicolett-local-emulators'); return 'local-database'; } };
    assert.equal(mode.database(fakeAdmin), 'local-database');
    assert.equal(mode.database(fakeAdmin), 'local-database');
    assert.equal(initializations, 1);
    assert.equal(initialized.options.projectId, 'demo-nicolett');
    assert.notEqual(initialized.name, '[DEFAULT]');
});

test('Producción usa cert, normaliza clave y reutiliza default sin ADC', () => {
    const source = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const start = source.indexOf('function database() {');
    const end = source.indexOf('\n}', start) + 2;
    const apps = [{ name: 'nicolett-local-emulators' }];
    let initialized = 0;
    const env = { FIREBASE_PROJECT_ID: 'synthetic', FIREBASE_CLIENT_EMAIL: 'test@example.invalid', FIREBASE_PRIVATE_KEY: 'line1\\nline2' };
    const context = { process: { env }, cert: options => {
        assert.equal(options.privateKey, 'line1\nline2');
        assert.equal(options.projectId, 'synthetic'); return 'synthetic-cert';
    }, localFirebase: { enabled: false }, getApps: () => apps,
        initializeApp: (...args) => {
            assert.equal(args[0].credential, 'synthetic-cert');
            initialized++;
            const app = { name: '[DEFAULT]' }; apps.push(app); return app;
        }, getFirestore: app => app };
    vm.runInNewContext(source.slice(start, end), context);
    assert.equal(context.database().name, '[DEFAULT]');
    assert.equal(context.database().name, '[DEFAULT]');
    assert.equal(initialized, 1);
    apps.length = 0;
    for (const key of Object.keys(env)) {
        const value = env[key]; delete env[key];
        assert.throws(() => context.database(), /FIREBASE_ADMIN_NOT_CONFIGURED/);
        env[key] = value;
    }
    context.cert = () => { throw new Error('sensitive-detail'); };
    assert.throws(() => context.database(), /^Error: FIREBASE_ADMIN_NOT_CONFIGURED$/);
});

test('Puertos alternativos: par completo, localhost y proyecto demo obligatorio', () => {
    const env = { LOCAL_FIREBASE_EMULATORS: '1', FIRESTORE_EMULATOR_HOST: 'localhost:8180', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199' };
    const mode = createMode(env);
    assert.equal(mode.ports.firestore, 8180); assert.equal(mode.ports.auth, 9199);
    assert.equal(mode.appName, 'nicolett-local-emulators-8180');
    assert.equal(env.GCLOUD_PROJECT, 'demo-nicolett');
    assert.equal(env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180');
    for (const patch of [
        { LOCAL_FIREBASE_EMULATORS: undefined }, { VERCEL: '1' }, { NODE_ENV: 'production' },
        { FIRESTORE_EMULATOR_HOST: undefined }, { FIREBASE_AUTH_EMULATOR_HOST: '' },
        { FIRESTORE_EMULATOR_HOST: 'example.invalid:8180' }, { FIRESTORE_EMULATOR_HOST: '127.0.0.1:9999' },
        { FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' }
    ]) assert.throws(() => createMode({ ...env, ...patch }));
});

test('Frontend alternativo conserva ambos puertos en apps secundarias', () => {
    const fixture = clientFixture();
    const source = fs.readFileSync(path.join(__dirname, 'firebase-emulator-client.js'), 'utf8')
        .replace('/* EMULATOR_PORTS */ { auth: 9099, firestore: 8080 }', '{ auth: 9199, firestore: 8180 }');
    vm.runInNewContext(source, fixture.context);
    fixture.context.firebase.initializeApp({ projectId: 'demo-nicolett' }, 'secondary');
    assert.equal(fixture.calls.filter(call => call[0] === 'auth' && call[1] === 'http://127.0.0.1:9199').length, 2);
    assert.equal(fixture.calls.filter(call => call[0] === 'firestore' && call[2] === 8180).length, 2);
});

test('Falta Auth o Firestore: comprobación falla sin intentar otro host', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'firebase-emulators.js'), 'utf8');
    for (const missing of [9099, 8080, null]) {
        const calls = [];
        const context = { module: { exports: {} }, require: () => ({ createConnection: options => {
            calls.push(options);
            const socket = new EventEmitter();
            socket.destroy = () => {};
            socket.setTimeout = () => {};
            queueMicrotask(() => socket.emit(options.port === missing ? 'error' : 'connect'));
            return socket;
        } }) };
        vm.runInNewContext(source, context);
        const mode = context.module.exports({ LOCAL_FIREBASE_EMULATORS: '1' });
        if (missing) await assert.rejects(mode.assertAvailable());
        else await mode.assertAvailable();
        assert.equal(calls.length, 2);
        assert.ok(calls.every(call => call.host === '127.0.0.1'));
    }
});

function clientFixture(hostname = 'localhost', initialized = false) {
    const apps = initialized ? [{}] : [];
    const calls = [];
    const firebase = { apps, initializeApp: (options, name) => {
        calls.push(['init', options.projectId, name]);
        const app = { options, auth: () => ({ useEmulator: url => calls.push(['auth', url]) }),
            firestore: () => ({ useEmulator: (host, port) => calls.push(['firestore', host, port]) }) };
        apps.push(app); return app;
    } };
    return { context: { window: { location: { hostname } }, firebase }, calls };
}

test('Frontend Compat: default y apps secundarias usan solo ambos emuladores', () => {
    const { context, calls } = clientFixture();
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'firebase-emulator-client.js'), 'utf8'), context);
    context.firebase.initializeApp({ projectId: 'demo-nicolett' }, 'secondary');
    assert.equal(calls.filter(call => call[0] === 'init').length, 2);
    assert.equal(calls.filter(call => call[0] === 'auth' && call[1] === 'http://127.0.0.1:9099').length, 2);
    assert.equal(calls.filter(call => call[0] === 'firestore' && call[1] === '127.0.0.1' && call[2] === 8080).length, 2);
    assert.throws(() => context.firebase.initializeApp({ projectId: 'wrong-project' }));
});

test('Frontend rechaza dominios remotos y apps previamente inicializadas', () => {
    const source = fs.readFileSync(path.join(__dirname, 'firebase-emulator-client.js'), 'utf8');
    for (const fixture of [clientFixture('example.invalid'), clientFixture('localhost', true)]) {
        assert.throws(() => vm.runInNewContext(source, fixture.context));
        assert.equal(fixture.calls.length, 0);
    }
});

test('HTTP local sustituye configuración, bloquea pagos y falla sin emuladores', async () => {
    let available = true;
    const source = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const context = { __dirname, module: { exports: {} }, console, URL, URLSearchParams, AbortSignal,
        process: { env: { LOCAL_FIREBASE_EMULATORS: '1' } },
        require: name => name === 'dotenv' ? { config() {} } : name === './firebase-emulators' ? env => {
            const mode = createMode(env);
            mode.assertAvailable = async () => { if (!available) throw new Error('missing'); };
            return mode;
        } : require(name) };
    vm.runInNewContext(source, context);
    const server = context.module.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        const config = await fetch(base + '/js/firebase-config.js?v=25');
        assert.equal(config.status, 200);
        assert.equal(await config.text(), fs.readFileSync(path.join(__dirname, 'firebase-emulator-client.js'), 'utf8')
            .replace('/* EMULATOR_PORTS */ { auth: 9099, firestore: 8080 }', JSON.stringify({ auth: 9099, firestore: 8080 })));
        assert.equal(config.headers.get('cache-control'), 'no-store');
        for (const route of ['/api/flow/create', '/api/flow/notify', '/api/webpay/create']) {
            assert.equal((await fetch(base + route, { method: 'POST' })).status, 503);
        }
        available = false;
        assert.equal((await fetch(base + '/js/firebase-config.js')).status, 503);
        assert.equal((await fetch(base + '/')).status, 503);
    } finally {
        await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
});

test('HTTP de desarrollo sin flag no sirve la configuración productiva', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const context = { __dirname, module: { exports: {} }, console, URL, URLSearchParams, AbortSignal,
        process: { env: {} }, require: name => name === 'dotenv' ? { config() {} } : require(name) };
    vm.runInNewContext(source, context);
    const server = context.module.exports.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/js/firebase-config.js`);
        assert.equal(response.status, 503);
    } finally {
        await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
});

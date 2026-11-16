const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createBookingService, HOLD_MS, lockId } = require('./booking-service');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

test('Firestore/Auth Emulator reales: concurrencia, ciclo de reservas y reglas', {
    skip: process.env.RUN_BOOKING_EMULATOR_TESTS !== '1', timeout: 90000
}, async () => {
    assert.equal(process.env.LOCAL_FIREBASE_EMULATORS, '1');
    assert.ok(!process.env.VERCEL && process.env.NODE_ENV !== 'production');
    const mode = require('./firebase-emulators')(process.env);
    await mode.assertAvailable();
    const { getApps, initializeApp, deleteApp } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const db = mode.database({ getApps, initializeApp, getFirestore });
    assert.equal(db.projectId, 'demo-nicolett');
    const originalFetch = globalThis.fetch;
    const localFetch = (url, options) => {
        assert.equal(new URL(url).hostname, '127.0.0.1');
        return originalFetch(url, { ...options, signal: AbortSignal.timeout(10000) });
    };
    const prefix = 'booking_test_' + crypto.randomUUID().replaceAll('-', '');
    const users = [], reservations = new Set(), requests = new Set(), seeds = [];
    const controlRef = db.collection('BookingConfig').doc('control');
    const previousControl = await controlRef.get();
    let server;
    const auth = async (action, body) => localFetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:' + action + '?key=demo-only',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    async function seed(collection, id, data) { const ref = db.collection(collection).doc(id); await ref.set(data); seeds.push(ref); }
    try {
        for (const role of ['admin', 'profesional']) {
            const response = await auth('signUp', { email: prefix + '-' + role + '@example.invalid', password: crypto.randomBytes(24).toString('hex'), returnSecureToken: true });
            assert.equal(response.status, 200);
            const user = await response.json(); users.push(user);
            assert.equal(JSON.parse(Buffer.from(user.idToken.split('.')[1], 'base64url')).aud, 'demo-nicolett');
            await seed('Usuarios', user.localId, { rol: role, activo: true });
        }
        const admin = { uid: users[0].localId, role: 'admin' }, professionalKey = users[1].localId;
        await seed('Profesionales', prefix, { id: professionalKey, name: 'Synthetic', activo: true });
        await seed('Servicios', prefix + '_90', { name: 'Synthetic 90', price: 15000, duration: 90 });
        await seed('Servicios', prefix + '_30', { name: 'Synthetic 30', price: 10000, duration: 30 });
        await controlRef.set({ ready: true, version: 1 });
        let time = Date.parse('2034-01-01T00:00:00Z'), sequence = 0;
        const payments = new Map();
        const options = { now: () => time, sandbox: true, flowCreate: async order => {
            reservations.add(order);
            const token = 'emulated_flow_' + (++sequence) + '_' + prefix;
            payments.set(token, { commerceOrder: order, flowOrder: sequence, status: 2, amount: 5000, currency: 'CLP' });
            return { token, flowOrder: sequence, redirectUrl: 'https://sandbox.flow.cl/pay?token=' + token };
        }, flowStatus: async token => payments.get(token) };
        const service = createBookingService(db, options);
        const input = (date, hour, duration = 90) => ({ date, time: hour, profId: prefix, serviceId: prefix + '_' + duration,
            clientName: 'Synthetic', clientEmail: 'synthetic@example.invalid' });
        const payment = async (date, hour, duration = 90) => {
            const requestId = crypto.randomUUID(); requests.add(hash('flow:guest:' + requestId));
            const result = await service.createPayment(input(date, hour, duration), requestId);
            return { ...result, token: new URL(result.redirectUrl).searchParams.get('token') };
        };
        const manual = async (date, hour, duration = 90) => {
            const requestId = crypto.randomUUID(); requests.add(hash('manual:' + admin.uid + ':' + requestId));
            const result = await service.reserve(input(date, hour, duration), requestId, 'manual', admin);
            reservations.add(result.reservationId); return result;
        };
        const change = async (id, changes) => {
            const requestId = crypto.randomUUID(); requests.add(hash('change:' + admin.uid + ':' + requestId));
            return service.change(id, changes, admin, requestId);
        };
        const concurrent = await Promise.allSettled([payment('2035-01-10', '10:00'), payment('2035-01-10', '10:00')]);
        assert.equal(concurrent.filter(result => result.status === 'fulfilled').length, 1);
        await assert.rejects(payment('2035-01-10', '11:00', 30), { code: 'SLOT_UNAVAILABLE' });
        await payment('2035-01-10', '11:30', 30);
        const first = concurrent.find(result => result.status === 'fulfilled').value;
        // Un proceso Node nuevo debe ver la retención durable sin compartir memoria con este test.
        const childRequest = crypto.randomUUID(); requests.add(hash('flow:guest:' + childRequest));
        const childCode = `
            const mode = require('./firebase-emulators')(process.env);
            const {getApps,initializeApp,deleteApp}=require('firebase-admin/app');
            const {getFirestore}=require('firebase-admin/firestore');
            let input='';process.stdin.on('data',chunk=>input+=chunk);
            process.stdin.on('end',async()=>{
                const data=JSON.parse(input);let db;
                try{await mode.assertAvailable();db=mode.database({getApps,initializeApp,getFirestore});
                    const service=require('./booking-service').createBookingService(db,{now:()=>Date.parse('2034-01-01T00:00:00Z')});
                    const saved=await service.reserve(data.booking,data.requestId,'flow');
                    console.log(JSON.stringify({id:saved.reservationId,code:'UNEXPECTED_SUCCESS'}));
                }catch(error){console.log(JSON.stringify({code:error.code||'FAIL'}));}
                finally{if(db)await db.terminate();for(const app of getApps().filter(app=>app.name==='nicolett-local-emulators'))await deleteApp(app);}
            });`;
        const childResult = await new Promise((resolve, reject) => {
            const child = require('node:child_process').spawn(process.execPath, ['-e', childCode], { cwd: __dirname, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
            let output = '';
            child.stdout.on('data', chunk => { output += chunk; });
            child.stderr.resume();
            child.once('error', reject);
            child.once('exit', () => { try { resolve(JSON.parse(output.trim())); } catch { reject(new Error('Child integration failed')); } });
            child.stdin.end(JSON.stringify({ booking: input('2035-01-10', '10:00'), requestId: childRequest }));
        });
        if (childResult.id) reservations.add(childResult.id);
        assert.equal(childResult.code, 'SLOT_UNAVAILABLE');
        time += HOLD_MS + 1;
        const second = await payment('2035-01-10', '10:00');
        const results = await Promise.all([service.confirmPayment(first.token), service.confirmPayment(second.token)]);
        assert.equal(results.filter(result => result.booked).length, 1);
        assert.equal(results.filter(result => result.conflict).length, 1);
        for (const token of [first.token, second.token]) await service.confirmPayment(token);
        const restart = createBookingService(db, options);
        await assert.rejects(restart.reserve(input('2035-01-10', '10:00'), crypto.randomUUID(), 'flow'), { code: 'SLOT_UNAVAILABLE' });
        const booking = await manual('2035-01-11', '10:00');
        await change(booking.reservationId, { status: 'cancelada', revision: 0 });
        const replacement = await manual('2035-01-11', '10:00', 30);
        await assert.rejects(change(booking.reservationId, { status: 'confirmada', revision: 1 }), { code: 'SLOT_UNAVAILABLE' });
        await change(replacement.reservationId, { time: '12:00', revision: 0 });
        await change(booking.reservationId, { status: 'confirmada', revision: 1 });
        const lateFree = await payment('2035-01-12', '10:00'); time += HOLD_MS + 1;
        assert.equal((await service.confirmPayment(lateFree.token)).booked, true);
        const availability = await service.availability({ ...input('2035-01-11', '09:00', 30), times: ['09:00', '10:00', '11:00', '11:30', '12:00', '12:30'] });
        assert.deepEqual(availability, ['09:00', '11:30', '12:30']);

        // Reglas reales: el ID token de admin tampoco puede saltarse el servicio de ocupación.
        const restRoot = 'http://127.0.0.1:8080/v1/projects/demo-nicolett/databases/(default)/documents/';
        const rest = (method, id, fields, token = users[0].idToken, mask = '') => localFetch(restRoot + id + mask,
            { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
                ...(fields ? { body: JSON.stringify({ fields }) } : {}) });
        const unauthorizedId = prefix + '_denied';
        for (const collection of ['Citas', 'Reservas', 'AgendaLocks', 'FlowOrders', 'FlowTransactions', 'BookingRequests', 'BookingConfig', 'FinancialConflicts']) {
            const response = await rest('PATCH', collection + '/' + unauthorizedId, { test: { booleanValue: true } });
            if (response.status === 200) seeds.push(db.collection(collection).doc(unauthorizedId));
            assert.equal(response.status, 403, 'Regla debe denegar escritura directa: ' + collection);
        }
        assert.equal((await rest('PATCH', 'Citas/' + booking.reservationId, { status: { stringValue: 'cancelada' } }, users[0].idToken, '?updateMask.fieldPaths=status')).status, 403);
        assert.equal((await rest('GET', 'Citas/' + booking.reservationId, null, null)).status, 403);
        assert.equal((await rest('PATCH', 'Citas/' + booking.reservationId, { notes: { stringValue: 'Synthetic note' } }, users[1].idToken, '?updateMask.fieldPaths=notes')).status, 200);

        process.env.DOTENV_CONFIG_QUIET = 'true';
        const app = require('./server'); server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        const base = `http://127.0.0.1:${server.address().port}`;
        assert.equal((await localFetch(base + '/api/bookings/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
        const manualRequest = crypto.randomUUID(); requests.add(hash('manual:' + admin.uid + ':' + manualRequest));
        const response = await localFetch(base + '/api/bookings/manual', { method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + users[0].idToken },
            body: JSON.stringify({ booking: input('2035-01-13', '19:00', 30), requestId: manualRequest }) });
        const created = await response.json();
        if (created.id) reservations.add(created.id);
        assert.equal(response.status, 200, 'Endpoint manual real debe validar Auth Emulator');
        assert.equal((await localFetch(base + '/api/flow/create', { method: 'POST' })).status, 503);
        console.log('Integración real: ocupación atómica, pagos simulados, Auth/Firestore Emulator y reglas aprobados.');
    } finally {
        if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
        for (const id of reservations) {
            for (const collection of ['Citas', 'Reservas', 'FlowOrders', 'FinancialConflicts']) await db.collection(collection).doc(id).delete();
        }
        // Cada token de prueba incorpora el prefijo único; no se leen ni borran transacciones ajenas.
        for (let i = 1; i <= 20; i++) await db.collection('FlowTransactions').doc(hash('emulated_flow_' + i + '_' + prefix)).delete();
        for (const id of requests) await db.collection('BookingRequests').doc(id).delete();
        if (users[1]) for (const day of ['2035-01-10', '2035-01-11', '2035-01-12', '2035-01-13', '2035-01-14']) await db.collection('AgendaLocks').doc(lockId(users[1].localId, day)).delete();
        for (const ref of seeds.reverse()) await ref.delete();
        if (previousControl.exists) await controlRef.set(previousControl.data()); else await controlRef.delete();
        for (const user of users) assert.equal((await auth('delete', { idToken: user.idToken })).status, 200);
        await db.terminate();
        for (const app of getApps().filter(item => item.name === 'nicolett-local-emulators')) await deleteApp(app);
    }
});

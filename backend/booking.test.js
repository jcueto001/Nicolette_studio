const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { memoryFirestore } = require('./test-firestore');
const { createBookingService, HOLD_MS, startTime, overlaps } = require('./booking-service');
const key = () => crypto.randomUUID();
const actor = { uid: 'admin', role: 'admin' };
function fixture() {
    const { db, docs } = memoryFirestore([
        ['BookingConfig/control', { ready: true, version: 1 }],
        ['Servicios/long', { name: 'Long', price: 15000, duration: 90 }],
        ['Servicios/short', { name: 'Short', price: 10000, duration: 30 }],
        ['Servicios/bloqueo', { name: 'Bloqueo', price: 0, duration: 60 }],
        ['Profesionales/pro', { name: 'Synthetic', id: 'professional-uid', activo: true }]
    ]);
    let time = Date.parse('2034-01-01T00:00:00Z'), creates = 0;
    const payments = new Map();
    const options = { now: () => time, sandbox: true,
        flowCreate: async (order, booking) => {
            const token = 'synthetic_token_' + (++creates);
            payments.set(token, { commerceOrder: order, status: 2, amount: 5000, currency: 'CLP', flowOrder: creates });
            return { token, flowOrder: creates, redirectUrl: 'https://sandbox.flow.cl/pay?token=' + token };
        }, flowStatus: async token => payments.get(token) };
    const service = createBookingService(db, options);
    const input = (time = '10:00', serviceId = 'long') => ({ profId: 'pro', serviceId, date: '2035-01-10', time,
        clientName: 'Synthetic', clientEmail: 'synthetic@example.invalid' });
    const create = async (time, serviceId, requestId = key()) => {
        const result = await service.createPayment(input(time, serviceId), requestId);
        return { ...result, token: new URL(result.redirectUrl).searchParams.get('token') };
    };
    return { db, docs, options, service, input, create, payments, creates: () => creates, advance: () => { time += HOLD_MS + 1; } };
}

test('Dos solicitudes concurrentes: una sola retención y llamada a Flow', async () => {
    const f = fixture();
    const results = await Promise.allSettled([f.create('10:00'), f.create('10:00')]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(f.creates(), 1);
});
test('90 y 30 minutos solapados se rechazan; intervalos contiguos se permiten', async () => {
    const f = fixture(); await f.create('10:00', 'long');
    await assert.rejects(f.create('11:00', 'short'), { code: 'SLOT_UNAVAILABLE' });
    await f.create('11:30', 'short');
    assert.equal(f.creates(), 2);
});
test('Idempotencia de creación no duplica cobros; cambios de payload se rechazan', async () => {
    const f = fixture(); const requestId = key();
    const first = await f.create('10:00', 'long', requestId);
    const second = await f.create('10:00', 'long', requestId);
    assert.equal(first.redirectUrl, second.redirectUrl); assert.equal(first.receipt, second.receipt);
    assert.equal(f.creates(), 1);
    await assert.rejects(f.create('12:00', 'long', requestId), { code: 'IDEMPOTENCY_MISMATCH' });
});
test('Dos reintentos simultáneos con la misma clave nunca hacen dos llamadas a Flow', async () => {
    const f = fixture(); const requestId = key();
    const results = await Promise.allSettled([f.create('10:00', 'long', requestId), f.create('10:00', 'long', requestId)]);
    assert.ok(results.some(result => result.status === 'fulfilled'));
    assert.equal(f.creates(), 1);
    assert.equal([...f.docs.keys()].filter(id => id.startsWith('Reservas/')).length, 1);
});
test('Retención vencida, dos pagos válidos y webhook repetido: una sola cita', async () => {
    const f = fixture(); const first = await f.create('10:00'); f.advance();
    const second = await f.create('10:00');
    const results = await Promise.all([f.service.confirmPayment(first.token), f.service.confirmPayment(second.token)]);
    assert.equal(results.filter(result => result.booked).length, 1);
    assert.equal(results.filter(result => result.conflict).length, 1);
    for (const payment of [first, second]) await f.service.confirmPayment(payment.token);
    assert.equal([...f.docs.keys()].filter(id => id.startsWith('Citas/')).length, 1);
    assert.equal([...f.docs.keys()].filter(id => id.startsWith('FinancialConflicts/')).length, 1);
});
test('Pago tardío recupera solo si libre; pago con horario confirmado ocupado queda en revisión', async () => {
    const f = fixture(); const first = await f.create('10:00'); f.advance();
    assert.equal((await f.service.confirmPayment(first.token)).booked, true);
    await assert.rejects(f.create('10:00'), { code: 'SLOT_UNAVAILABLE' });
    const g = fixture(); const late = await g.create('10:00'); g.advance();
    const current = await g.create('10:00'); await g.service.confirmPayment(current.token);
    assert.deepEqual(await g.service.confirmPayment(late.token), { paid: true, booked: false, conflict: true });
});
test('Reinicio conserva retenciones y estado de pagos', async () => {
    const f = fixture(); const payment = await f.create('10:00');
    const restarted = createBookingService(f.db, f.options);
    await assert.rejects(restarted.reserve(f.input(), key(), 'flow'), { code: 'SLOT_UNAVAILABLE' });
    assert.equal((await restarted.confirmPayment(payment.token)).booked, true);
});
test('Manuales, cancelación, reactivación y reprogramación usan la misma exclusividad', async () => {
    const f = fixture();
    const first = await f.service.reserve(f.input('10:00', 'long'), key(), 'manual', actor);
    const id = first.reservationId;
    await assert.rejects(f.create('11:00', 'short'), { code: 'SLOT_UNAVAILABLE' });
    await f.service.change(id, { status: 'cancelada', revision: 0 }, actor, key());
    const second = await f.service.reserve(f.input('10:00', 'short'), key(), 'manual', actor);
    await assert.rejects(f.service.change(id, { status: 'confirmada', revision: 1 }, actor, key()), { code: 'SLOT_UNAVAILABLE' });
    await f.service.change(second.reservationId, { time: '12:00', revision: 0 }, actor, key());
    await f.service.change(id, { status: 'confirmada', revision: 1 }, actor, key());
    const requestId = key();
    const changes = { status: 'cancelada', revision: 2 };
    await f.service.change(id, changes, actor, requestId);
    await f.service.change(id, changes, actor, requestId);
    assert.equal(f.docs.get('Reservas/' + id).revision, 3);
});
test('Pago después de cancelación no recrea cita ni ocupación', async () => {
    const f = fixture(); const payment = await f.create('10:00');
    await f.service.confirmPayment(payment.token);
    const order = f.payments.get(payment.token).commerceOrder;
    await f.service.change(order, { status: 'cancelada', revision: 0 }, actor, key());
    assert.equal((await f.service.confirmPayment(payment.token)).booked, false);
    await f.create('10:00');
});
test('Validación de servidor: duración/precio manipulados ignorados y fechas inválidas rechazadas', async () => {
    const f = fixture();
    const saved = await f.service.reserve({ ...f.input(), duration: 1, totalPrice: 1 }, key(), 'manual', actor);
    assert.equal(saved.booking.duration, 90); assert.equal(saved.booking.totalPrice, 15000);
    await assert.rejects(f.service.reserve({ ...f.input(), date: '2035-02-30' }, key(), 'manual', actor));
    await assert.rejects(f.service.reserve({ ...f.input(), time: '08:30' }, key(), 'manual', actor));
    await assert.rejects(f.service.reserve(f.input(), key(), 'manual', { uid: 'worker', role: 'profesional' }), { code: 'FORBIDDEN' });
    assert.equal(overlaps({ startMs: 0, endMs: 90 }, { startMs: 90, endMs: 120 }), false);
    assert.equal(startTime('2035-01-10', '09:00') < startTime('2035-01-10', '21:00'), true);
});
test('Respuesta incierta de Flow no vuelve a crear orden y deja retención durable', async () => {
    const f = fixture(); let calls = 0;
    const service = createBookingService(f.db, { ...f.options, flowCreate: async () => { calls++; throw new Error('timeout'); } });
    const requestId = key();
    await assert.rejects(service.createPayment(f.input(), requestId));
    await assert.rejects(service.createPayment(f.input(), requestId), { code: 'PAYMENT_CREATION_PENDING_REVIEW' });
    assert.equal(calls, 1);
    assert.equal([...f.docs.values()].some(record => record.status === 'creation_unknown'), true);
});
test('Webhook antes de persistir el token reconcilia por orden durable', async () => {
    const f = fixture();
    let service;
    service = createBookingService(f.db, { ...f.options, flowCreate: async order => {
        f.payments.set('early_token_123', { commerceOrder: order, status: 2, amount: 5000, currency: 'CLP', flowOrder: 77 });
        assert.equal((await service.confirmPayment('early_token_123')).booked, true);
        return { token: 'early_token_123', flowOrder: 77, redirectUrl: 'https://sandbox.flow.cl/pay?token=early_token_123' };
    } });
    await service.createPayment(f.input(), key());
    assert.equal([...f.docs.keys()].filter(id => id.startsWith('Citas/')).length, 1);
});
test('Migración diagnostica conflictos sin ejecutar escrituras ni activar la agenda', async () => {
    const f = fixture(); f.docs.delete('BookingConfig/control');
    const financial = { totalPrice: 12000, depositAmount: 3000, balanceDue: 9000, profId: 'professional-uid' };
    f.docs.set('Citas/legacy_a', { ...f.input('10:00'), ...financial, duration: 90, status: 'confirmada' });
    f.docs.set('Citas/legacy_b', { ...f.input('11:00', 'short'), ...financial, duration: 30, status: 'confirmada' });
    const before = structuredClone([...f.docs]);
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'LEGACY_OVERLAP'));
    assert.equal(report.canApply, false);
    assert.deepEqual([...f.docs], before);
    f.docs.delete('Citas/legacy_b');
    const clean = await f.service.migrate();
    assert.equal(clean.canApply, true);
    assert.equal(clean.applied, false);
    assert.equal(f.docs.has('BookingConfig/control'), false);
});

test('Migración pendiente y duración histórica desconocida se diagnostican sin aplicar', async () => {
    const f = fixture(); f.docs.delete('BookingConfig/control');
    await assert.rejects(f.create('10:00'), { code: 'BOOKING_MIGRATION_REQUIRED' });
    f.docs.set('Citas/unknown_duration', { ...f.input(), status: 'confirmada' });
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'LEGACY_DURATION_REQUIRES_REVIEW'));
    assert.equal(report.canApply, false);
    assert.equal(f.docs.has('BookingConfig/control'), false);
});

test('Horario extendido, cruce de medianoche y alias de profesional conservan exclusividad', async () => {
    const f = fixture();
    f.docs.set('Servicios/long', { name: 'Long', price: 15000, duration: 1440 });
    await f.create('21:00', 'long');
    await assert.rejects(f.service.reserve({ ...f.input('09:00', 'short'), date: '2035-01-11', profId: 'professional-uid' }, key(), 'manual', actor), { code: 'SLOT_UNAVAILABLE' });
    assert.equal([...f.docs.keys()].filter(id => id.startsWith('AgendaLocks/')).length, 2);
});

test('StorageHelper usa disponibilidad del backend, mantiene firmas y no crea citas offline', async () => {
    const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
    const calls = [];
    const context = { console, crypto, URLSearchParams, window: { location: { origin: 'http://localhost' } },
        localStorage: { getItem: () => null, removeItem() {}, setItem() {} },
        firebase: { auth: () => ({ currentUser: { uid: 'admin', getIdToken: async () => 'synthetic-token' } }) },
        fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ times: ['09:00', '11:30'] }) }; } };
    const source = fs.readFileSync(path.join(__dirname, '../js/mockData.js'), 'utf8').replace('StorageHelper.init();', 'globalThis.helper = StorageHelper;');
    vm.runInNewContext(source, context);
    const helper = context.helper;
    assert.equal(helper.getAvailableTimeSlots.length, 2);
    assert.equal((await helper.getAvailableTimeSlots('2035-01-10', 'pro')).length, 0);
    helper._bookingServiceId = 'long';
    const slots = await helper.getAvailableTimeSlots('2035-01-10', 'pro');
    assert.equal(slots.join(','), '09:00,11:30');
    assert.equal(new URL(calls[0].url, 'http://localhost').searchParams.get('serviceId'), 'long');
    helper._observedUid = 'admin'; helper._verifiedStaff = { id: 'admin', role: 'admin' };
    context.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(helper.saveAppointment({ serviceId: 'long', profId: 'pro', date: '2035-01-10', time: '10:00' }), /offline/);
    assert.equal(helper.getAppointments().length, 0);
});

test('Disponibilidad distingue mantenimiento, errores y una agenda realmente sin horas', async () => {
    const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
    const context = { console, crypto, URLSearchParams, window: { location: { origin: 'http://localhost' } },
        localStorage: { getItem: () => null, removeItem() {}, setItem() {} } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/mockData.js'), 'utf8')
        .replace('StorageHelper.init();', 'globalThis.helper = StorageHelper;'), context);
    context.helper._bookingServiceId = 'service';
    for (const code of ['BOOKING_MIGRATION_REQUIRED', 'BOOKING_PAUSED']) {
        context.fetch = async () => ({ ok: false, json: async () => ({ error: code }) });
        await assert.rejects(context.helper.getAvailableTimeSlots('2035-01-10', 'pro'), { code });
    }
    for (const response of [
        { ok: false, json: async () => { throw new SyntaxError('Server failed'); } },
        { ok: true, json: async () => ({ times: ['<img onerror=alert(1)>'] }) },
        { ok: false, json: async () => ({ error: '<script>private server detail</script>' }) }
    ]) {
        context.fetch = async () => response;
        await assert.rejects(context.helper.getAvailableTimeSlots('2035-01-10', 'pro'), error => {
            assert.equal(error.code, 'AVAILABILITY_UNAVAILABLE');
            assert.ok(!error.message.includes('script')); return true;
        });
    }
    context.fetch = async () => ({ ok: true, json: async () => ({ times: [] }) });
    assert.equal((await context.helper.getAvailableTimeSlots('2035-01-10', 'pro')).length, 0);
    context.fetch = async () => ({ ok: true, json: async () => ({ times: ['09:00', '11:00'] }) });
    assert.equal((await context.helper.getAvailableTimeSlots('2035-01-10', 'pro')).join(','), '09:00,11:00');
});

test('Formulario bloquea avance ante error y descarta respuestas tardías de otra fecha', async () => {
    const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
    const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    const start = source.indexOf('        let availabilityRequest = 0;');
    const end = source.indexOf("        btnPrev3?.addEventListener", start);
    assert.ok(start > 0 && end > start);
    let handler, resolveOld;
    const dateInput = { value: '2035-01-10', addEventListener: (_, callback) => { handler = callback; } };
    const grid = { innerHTML: '', textContent: '', isConnected: true, querySelectorAll: () => [] };
    const state = { date: null, time: '09:00', profId: 'pro' };
    const context = { dateInput, timeSlotsGrid: grid, btnNext3: { disabled: false }, bookingState: state,
        StorageHelper: { getAvailableTimeSlots: () => new Promise(resolve => { resolveOld = resolve; }) } };
    vm.runInNewContext(source.slice(start, end), context);
    const first = handler();
    dateInput.value = '2035-01-11';
    context.StorageHelper.getAvailableTimeSlots = async () => { throw new Error('Reservas en mantenimiento'); };
    await handler(); resolveOld(['09:00']); await first;
    assert.equal(grid.textContent, 'Reservas en mantenimiento');
    assert.equal(context.btnNext3.disabled, true); assert.equal(state.time, null);
    context.StorageHelper.getAvailableTimeSlots = async () => [];
    await handler(); assert.ok(grid.innerHTML.includes('No hay horas disponibles'));
    context.StorageHelper.getAvailableTimeSlots = async () => ['11:00'];
    await handler(); assert.ok(grid.innerHTML.includes('data-time="11:00"'));
});

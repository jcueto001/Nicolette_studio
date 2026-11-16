const { test } = require('node:test');
const assert = require('node:assert/strict');
const { memoryFirestore } = require('./test-firestore');
const { createBookingService, startTime, days, lockId } = require('./booking-service');
const { historicalBooking, historicalReservation } = require('./booking-migration');

function fixture() {
    const { db, docs } = memoryFirestore([
        ['Servicios/s', { name: 'Current catalogue', price: 99000, duration: 30 }],
        ['Profesionales/p', { id: 'p', name: 'Current catalogue name', activo: true }]
    ]);
    const source = (overrides = {}) => ({ serviceId: 's', profId: 'p', date: '10/01/2035', time: '10:00', duration: 60,
        totalPrice: 12000, depositAmount: 3000, balanceDue: 9000, status: 'confirmada', paymentStatus: 'parcial',
        servicio: 'Historical service', profesional: 'Historical name', orderId: 'historical-order', revision: 4, ...overrides });
    const identity = raw => ({ ...raw, date: '2035-01-10', totalPrice: 99000, balanceDue: 99000, profId: 'p', professionalKey: 'p',
        professionalDocId: 'p', startMs: startTime(raw.date, raw.time), endMs: startTime(raw.date, raw.time) + 30 * 60000, duration: 30, timeZone: 'America/Santiago' });
    function referenced(id = 'cita_a', reservationId = 'res_a', overrides = {}) {
        const data = source({ reservationId, ...overrides });
        const booking = historicalBooking(data, identity(data));
        docs.set('Citas/' + id, data);
        const cancelled = ['cancelada', 'no asiste'].includes(data.status);
        docs.set('Reservas/' + reservationId, { sourceCitaId: id, booking, kind: 'legacy', status: cancelled ? 'cancelled' : 'confirmed', revision: data.revision });
        if (!cancelled) for (const day of days(booking)) docs.set('AgendaLocks/' + lockId('p', day), { version: 1,
            entries: [{ reservationId, startMs: booking.startMs, endMs: booking.endMs, state: 'confirmed', expiresAtMs: null }] });
        return { data, booking };
    }
    // Cualquier intento de escritura falla: todas las pruebas de este archivo son de diagnóstico.
    const run = db.runTransaction; let writes = 0, options;
    db.runTransaction = (callback, settings) => {
        options = settings;
        return run(tx => {
            for (const name of ['create', 'set', 'update', 'delete']) tx[name] = () => { writes++; assert.fail('Diagnóstico intentó escribir'); };
            return callback(tx);
        });
    };
    return { db, docs, source, identity, referenced, service: createBookingService(db), writes: () => writes, options: () => options };
}

test('Referencia válida comprueba cita, profesional, intervalo y ocupación sin escrituras', async () => {
    const f = fixture(); f.referenced(); const before = structuredClone([...f.docs]);
    const report = await f.service.migrate();
    assert.equal(report.referenced, 1); assert.equal(report.eligible, 0);
    assert.equal(report.issues.length, 0); assert.equal(report.canApply, true);
    assert.equal(report.applied, false); assert.equal(f.writes(), 0);
    assert.equal(f.options().readOnly, true); assert.deepEqual([...f.docs], before);
});
test('Referencia inexistente no se omite ni permite activar agenda', async () => {
    const f = fixture(); f.docs.set('Citas/a', f.source({ reservationId: 'missing' }));
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'RESERVATION_REFERENCE_NOT_FOUND'));
    assert.equal(report.canApply, false); assert.equal(report.scanned, 1);
});
test('Referencias duplicadas se informan en ambas citas', async () => {
    const f = fixture(); f.referenced();
    f.docs.set('Citas/cita_b', f.source({ reservationId: 'res_a', time: '12:00' }));
    const report = await f.service.migrate();
    assert.equal(report.issues.filter(issue => issue.code === 'DUPLICATE_RESERVATION_REFERENCE').length, 2);
    assert.ok(report.issues.some(issue => issue.code === 'RESERVATION_CITA_MISMATCH'));
    assert.ok(report.issues.some(issue => issue.code === 'RESERVATION_DATE_MISMATCH'));
    assert.equal(report.canApply, false);
});
test('Referencia con profesional, intervalo, importe o estado inconsistentes se rechaza', async () => {
    const f = fixture(); f.referenced();
    const reservation = f.docs.get('Reservas/res_a');
    reservation.booking.profId = 'another'; reservation.booking.endMs++;
    reservation.booking.totalPrice++; reservation.status = 'cancelled';
    const report = await f.service.migrate();
    for (const code of ['RESERVATION_PROFESSIONAL_OR_SERVICE_MISMATCH', 'RESERVATION_INTERVAL_MISMATCH', 'RESERVATION_FINANCIAL_MISMATCH', 'RESERVATION_STATUS_MISMATCH']) {
        assert.ok(report.issues.some(issue => issue.code === code), code);
    }
    assert.equal(report.canApply, false);
});
test('Ocupación ausente, duplicada o inesperada no se omite', async () => {
    const f = fixture(); const { booking } = f.referenced();
    const id = 'AgendaLocks/' + lockId('p', days(booking)[0]);
    const lock = f.docs.get(id); lock.entries.push({ ...lock.entries[0] });
    let report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'DUPLICATE_AGENDA_ENTRY'));
    assert.ok(report.issues.some(issue => issue.code === 'RESERVATION_OCCUPANCY_MISMATCH'));
    f.docs.delete(id); report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'RESERVATION_OCCUPANCY_MISMATCH'));
});
test('Plan histórico preserva precio, abono, saldo, estado, fechas e identificadores originales', () => {
    const f = fixture(); const source = f.source({ id: 'legacy-business-id', createdAt: 'historical-date', notes: 'Original text' });
    const before = structuredClone(source);
    const booking = historicalBooking(source, f.identity(source));
    assert.equal(booking.totalPrice, 12000); assert.equal(booking.depositAmount, 3000); assert.equal(booking.balanceDue, 9000);
    for (const field of ['status', 'paymentStatus', 'date', 'time', 'profId', 'serviceId', 'id', 'orderId', 'createdAt', 'notes', 'servicio', 'profesional']) assert.equal(booking[field], source[field], field);
    const plan = historicalReservation({ id: 'original-document-id', booking, source, cancelled: false, revision: 4 });
    assert.equal(plan.id, 'original-document-id'); assert.equal(plan.sourceCitaId, 'original-document-id');
    assert.equal(plan.revision, 4); assert.equal(plan.legacyStatus, source.status);
    assert.deepEqual(plan.originalAppointment, before); assert.deepEqual(source, before);
});
test('No inferir importes faltantes del catálogo actual y presentar todas las incidencias', async () => {
    const f = fixture(); const source = f.source();
    delete source.totalPrice; delete source.depositAmount; delete source.balanceDue;
    f.docs.set('Citas/incomplete', source);
    const report = await f.service.migrate();
    assert.equal(report.issues.filter(issue => issue.code === 'HISTORICAL_FINANCIAL_DATA_REQUIRED').length, 3);
    assert.equal(report.eligible, 0); assert.equal(report.canApply, false);
    assert.throws(() => historicalBooking(source, f.identity(source)), { code: 'HISTORICAL_FINANCIAL_DATA_REQUIRED' });
});
test('Diagnóstico incluye agenda habilitada y ocupaciones existentes que impedirían aplicar', async () => {
    const f = fixture(); f.docs.set('BookingConfig/control', { version: 1, ready: true });
    f.docs.set('Citas/legacy', f.source());
    const id = lockId('p', '2035-01-10');
    f.docs.set('AgendaLocks/' + id, { version: 1, entries: [{ reservationId: 'unknown', startMs: startTime('2035-01-10', '10:00'), endMs: startTime('2035-01-10', '11:00'), state: 'confirmed' }] });
    const report = await f.service.migrate();
    for (const code of ['MIGRATION_ALREADY_ENABLED', 'MIGRATION_LEDGER_NOT_EMPTY', 'ORPHAN_AGENDA_ENTRY']) assert.ok(report.issues.some(issue => issue.code === code), code);
    assert.equal(report.canApply, false); assert.equal(f.writes(), 0);
});
test('Canceladas sin ocupación y completadas/bloqueadas mantienen su historia', async () => {
    const f = fixture(); f.referenced('cancelled', 'res_cancelled', { status: 'cancelada' });
    const valid = await f.service.migrate(); assert.equal(valid.canApply, true);
    const g = fixture();
    for (const [id, status, date] of [['a', 'cancelada', '2035-01-10'], ['b', 'completada', '2035-01-11'], ['c', 'bloqueada', '2035-01-12']]) {
        const source = g.source({ status, date }); g.docs.set('Citas/' + id, source);
        const plan = historicalReservation({ id, source, booking: historicalBooking(source, g.identity(source)), revision: 4, cancelled: status === 'cancelada' });
        assert.equal(plan.legacyStatus, status); assert.equal(plan.originalAppointment.status, status);
    }
    const report = await g.service.migrate(); assert.equal(report.canApply, true);
    assert.equal(report.writesPlanned.locks, 2); assert.equal(report.eligible, 3);
});
test('Identificador profesional que precisaría sobrescritura exige revisión manual', async () => {
    const f = fixture(); f.docs.set('Profesionales/p', { id: 'canonical-uid', activo: true });
    f.docs.set('Citas/a', f.source());
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'LEGACY_PROFESSIONAL_ID_REQUIRES_REVIEW'));
    assert.equal(report.canApply, false);
});
test('Referencia online actual sigue válida aunque el abono se haya fijado al crear Citas', async () => {
    const f = fixture(); f.referenced();
    const saved = f.docs.get('Reservas/res_a'); saved.kind = 'flow'; delete saved.booking.depositAmount;
    assert.equal((await f.service.migrate()).canApply, true);
});
test('Marcadores inválidos y reservaciones confirmadas huérfanas se reportan', async () => {
    const f = fixture(); f.docs.set('Citas/a', f.source({ reservationId: null }));
    f.docs.set('Reservas/orphan', { status: 'confirmed' });
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'INVALID_RESERVATION_REFERENCE'));
    assert.ok(report.issues.some(issue => issue.code === 'ORPHAN_CONFIRMED_RESERVATION'));
    assert.equal(report.canApply, false);
});
test('Presupuesto de escrituras y límite de registros están presentes en el diagnóstico', async () => {
    const f = fixture();
    for (let i = 0; i < 141; i++) {
        const date = new Date(Date.UTC(2035, 0, 1 + i)).toISOString().slice(0, 10);
        f.docs.set('Citas/a_' + i, f.source({ date }));
    }
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'MIGRATION_RECORD_LIMIT_EXCEEDED'));
    assert.equal(report.canApply, false); assert.equal(f.writes(), 0);
});
test('Plan repetido es estable, no filtra importes en el informe y no muta datos', async () => {
    const f = fixture(); f.docs.set('Citas/a', f.source());
    const before = structuredClone([...f.docs]);
    const first = await f.service.migrate(), second = await f.service.migrate();
    assert.equal(first.planDigest, second.planDigest); assert.equal(first.canApply, true);
    assert.equal(JSON.stringify(first).includes('totalPrice'), false);
    assert.deepEqual([...f.docs], before); assert.equal(f.writes(), 0);
});
test('Intervalos corruptos enormes se diagnostican sin recorrer rangos ilimitados', async () => {
    const f = fixture(); const { booking } = f.referenced();
    f.docs.get('Reservas/res_a').booking.endMs = booking.startMs + 1e15;
    const report = await f.service.migrate();
    assert.ok(report.issues.some(issue => issue.code === 'AGENDA_RESERVATION_MISMATCH'));
    assert.equal(report.canApply, false); assert.equal(f.writes(), 0);
});

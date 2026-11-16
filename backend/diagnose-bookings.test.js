const { test } = require('node:test');
const assert = require('node:assert/strict');
const { memoryFirestore } = require('./test-firestore');
const { configuration, readOnlyDatabase, diagnose } = require('./diagnose-bookings');
const env = () => ({ FIREBASE_PROJECT_ID: 'synthetic-project', FIREBASE_CLIENT_EMAIL: 'test@example.invalid', FIREBASE_PRIVATE_KEY: 'line1\\nline2' });

test('Diagnóstico exige lectura explícita, proyecto coincidente y cert; rechaza escritura y emuladores', () => {
    const args = ['--read-only', '--project', 'synthetic-project'];
    assert.equal(configuration(args, env()).privateKey, 'line1\nline2');
    for (const bad of [[], ['--apply-local'], [...args, '--apply'], ['--read-only', '--project', 'demo-nicolett']]) assert.throws(() => configuration(bad, env()));
    for (const patch of [{ FIREBASE_PROJECT_ID: 'different-project' }, { FIREBASE_PRIVATE_KEY: '' },
        { LOCAL_FIREBASE_EMULATORS: '1' }, { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180' }, { FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199' }, { VERCEL: '1' }]) {
        assert.throws(() => configuration(args, { ...env(), ...patch }));
    }
});

function fixture(extra = []) {
    return memoryFirestore([
        ['Servicios/s', { name: 'Synthetic current catalogue', price: 99000, duration: 30 }],
        ['Profesionales/p', { id: 'p', name: 'Synthetic', activo: true }],
        ['Usuarios/p', { rol: 'profesional', activo: true }],
        ['Citas/c', { serviceId: 's', profId: 'p', date: '2035-01-10', time: '10:00', duration: 60,
            totalPrice: 12000, depositAmount: 3000, balanceDue: 9000, status: 'confirmada', clientName: 'PRIVATE_SYNTHETIC' }], ...extra
    ]);
}

test('Diagnóstico válido, catálogo cacheado y datos privados ausentes del informe; cero escrituras', async () => {
    const f = fixture(); const before = structuredClone([...f.docs]);
    let settings; const run = f.db.runTransaction;
    f.db.runTransaction = (callback, options) => { settings = options; return run(callback); };
    const report = await diagnose(f.db);
    assert.equal(settings.readOnly, true); assert.equal(report.canApply, true);
    assert.equal(report.applied, false); assert.equal(report.readOnly, true);
    assert.equal(report.productionWriteAuthorized, false); assert.equal(report.writeAttempts, 0);
    assert.ok(report.readBudgetUnits > 0); assert.ok(!JSON.stringify(report).includes('PRIVATE_SYNTHETIC'));
    assert.deepEqual([...f.docs], before);
});

test('Conflictos, importes incompletos, pagos pendientes y UID inválido bloquean sin corregir datos', async () => {
    const f = fixture([
        ['Citas/overlap', { serviceId: 's', profId: 'p', date: '2035-01-10', time: '10:30', duration: 30,
            totalPrice: 9000, depositAmount: 0, balanceDue: 9000, status: 'confirmada' }],
        ['Citas/incomplete', { serviceId: 's', profId: 'p', date: '2035-01-10', time: '17:00', status: 'confirmada' }],
        ['FlowOrders/pending', { paid: false, status: 'creating' }],
        ['FinancialConflicts/conflict', { status: 'manual_review' }],
        ['Reservas/held', { status: 'held' }]
    ]);
    f.docs.delete('Usuarios/p'); const before = structuredClone([...f.docs]);
    const report = await diagnose(f.db);
    for (const code of ['LEGACY_OVERLAP', 'LEGACY_DURATION_REQUIRES_REVIEW', 'HISTORICAL_FINANCIAL_DATA_REQUIRED',
        'PAYMENT_RECONCILIATION_REQUIRED', 'FINANCIAL_CONFLICT_REQUIRES_REVIEW', 'STAFF_UID_REQUIRES_REVIEW', 'RETENTION_RECONCILIATION_REQUIRED']) assert.ok(report.issueCounts[code] > 0);
    assert.equal(report.canApply, false); assert.deepEqual([...f.docs], before);
});

test('Fachada rechaza cualquier escritura, referencias externas y colecciones ajenas', async () => {
    const f = fixture(), readonly = readOnlyDatabase(f.db), before = structuredClone([...f.docs]);
    assert.throws(() => readonly.db.collection('perfil_cliente'), { code: 'COLLECTION_NOT_ALLOWED' });
    assert.throws(() => readonly.db.collection('Citas').doc('new').set({}), { code: 'WRITE_FORBIDDEN' });
    await assert.rejects(readonly.db.runTransaction(tx => tx.update(readonly.db.collection('Citas').doc('c'), {})), { code: 'WRITE_FORBIDDEN' });
    await assert.rejects(readonly.db.runTransaction(tx => tx.get(f.db.collection('Citas').doc('c'))), { code: 'INVALID_READ_REFERENCE' });
    await readonly.db.runTransaction(async tx => {
        const snapshot = await tx.get(readonly.db.collection('Citas'));
        assert.equal(snapshot.docs[0].ref, undefined);
    });
    assert.deepEqual([...f.docs], before);
});

test('Límites bloquean informes incompletos y conservan limit(1) del planificador', async () => {
    const f = fixture([
        ['Citas/second', { marker: true }], ['Citas/third', { marker: true }]
    ]);
    await assert.rejects(diagnose(f.db, { maxRecords: 2 }), { code: 'READ_BUDGET_EXCEEDED' });
    const limited = readOnlyDatabase(f.db, { readBudget: 2 });
    await assert.rejects(limited.db.runTransaction(tx => tx.get(limited.db.collection('Citas'))), { code: 'READ_BUDGET_EXCEEDED' });
    const one = readOnlyDatabase(f.db);
    const snapshot = await one.db.runTransaction(tx => tx.get(one.db.collection('Citas').limit(1)));
    assert.equal(snapshot.docs.length, 1);
});

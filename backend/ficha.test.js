const { test } = require('node:test');
const assert = require('node:assert/strict');
const { memoryFirestore } = require('./test-firestore');
const { saveFicha } = require('./ficha-service');
function fixture() {
    return memoryFirestore([
        ['Usuarios/pro', { rol: 'profesional', activo: true }],
        ['Usuarios/other', { rol: 'profesional' }], ['Usuarios/admin', { rol: 'Admin' }],
        ['Citas/a', { profId: 'pro', status: 'completada' }],
        ['Citas/b', { profId: 'pro', status: 'confirmada' }],
        ['Inventario/p', { name: 'Synthetic', stock: 5 }]
    ]);
}
const ficha = (appointmentId = 'a', quantity = 2) => ({ appointmentId, clientName: 'Synthetic', products: [{ id: 'p', quantity }] });
const actor = { uid: 'pro', role: 'profesional' };
test('Profesional asignado: ficha, stock y consumo atómicos, UID y nombres del servidor', async () => {
    const f = fixture();
    const result = await saveFicha(f.db, { ...ficha(), profId: 'other', products: [{ id: 'p', name: 'forged', quantity: 2 }] }, 'op1', actor);
    assert.equal(result.ficha.profId, 'pro'); assert.equal(result.ficha.products[0].name, 'Synthetic');
    assert.equal(f.docs.get('Inventario/p').stock, 3);
    for (const collection of ['FichasClientas', 'ConsumosInventario', 'FichaOperations']) assert.equal([...f.docs.keys()].filter(key => key.startsWith(collection + '/')).length, 1);
});
test('No asignado, rol falsificado, revocado y cita inválida: cero escrituras', async () => {
    const f = fixture(); const before = structuredClone([...f.docs]);
    await assert.rejects(saveFicha(f.db, ficha(), 'op', { uid: 'other', role: 'admin' }), { code: 'FORBIDDEN' });
    await assert.rejects(saveFicha(f.db, ficha('missing'), 'op', actor), { code: 'FORBIDDEN' });
    await assert.rejects(saveFicha(f.db, { ...ficha(), appointmentId: null }, 'op', actor), { code: 'FORBIDDEN' });
    assert.deepEqual([...f.docs], before);
    f.docs.set('Usuarios/pro', { rol: 'profesional', activo: false });
    await assert.rejects(saveFicha(f.db, ficha(), 'op', actor), { code: 'FORBIDDEN' });
    f.docs.set('Usuarios/pro', { rol: 'profesional' }); f.docs.get('Citas/a').status = 'cancelada';
    await assert.rejects(saveFicha(f.db, ficha(), 'op', actor), { code: 'INVALID_ATTENTION' });
});
test('Admin conserva atención ajena y ficha independiente; stock nunca negativo', async () => {
    const f = fixture(); const admin = { uid: 'admin' };
    assert.equal((await saveFicha(f.db, ficha(), 'admin-op', admin)).ficha.profId, 'pro');
    assert.equal((await saveFicha(f.db, { appointmentId: null, products: [] }, 'standalone', admin)).ficha.profId, 'admin');
    await assert.rejects(saveFicha(f.db, { ...ficha(), appointmentId: null }, 'standalone-stock', admin), { code: 'INVALID_ATTENTION' });
    assert.equal(f.docs.get('Inventario/p').stock, 3);
});
test('Reintentos por operación y atención no duplican; payload diferente se rechaza', async () => {
    const f = fixture(); const first = await saveFicha(f.db, ficha(), 'op', actor);
    for (const op of ['op', 'different']) assert.equal((await saveFicha(f.db, ficha(), op, actor)).ficha.id, first.ficha.id);
    const before = structuredClone([...f.docs]);
    await assert.rejects(saveFicha(f.db, ficha('b'), 'op', actor), { code: 'FICHA_ALREADY_RECORDED' });
    await assert.rejects(saveFicha(f.db, ficha('a', 1), 'different', actor), { code: 'FICHA_ALREADY_RECORDED' });
    assert.deepEqual([...f.docs], before);
});
test('Cantidades inválidas, repetidas, stock insuficiente e historial: sin cambios parciales', async () => {
    const f = fixture(); const before = structuredClone([...f.docs]);
    for (const quantity of [0, -1, 1.5, '2', NaN, Infinity]) await assert.rejects(saveFicha(f.db, ficha('a', quantity), 'op', actor), { code: 'INVALID_QUANTITY' });
    await assert.rejects(saveFicha(f.db, ficha('a', 6), 'op', actor), { code: 'INSUFFICIENT_STOCK' });
    await assert.rejects(saveFicha(f.db, { ...ficha(), products: [{ id: 'p', quantity: 1 }, { id: 'missing', quantity: 1 }] }, 'op', actor), { code: 'INSUFFICIENT_STOCK' });
    await assert.rejects(saveFicha(f.db, { ...ficha(), products: [{ id: 'p', quantity: 1 }, { id: 'p', quantity: 1 }] }, 'op', actor), { code: 'INVALID_QUANTITY' });
    assert.deepEqual([...f.docs], before);
    f.docs.set('FichasClientas/legacy', { appointmentId: 'a' });
    await assert.rejects(saveFicha(f.db, ficha(), 'op', actor), { code: 'FICHA_REVIEW_REQUIRED' });
    assert.equal(f.docs.get('Inventario/p').stock, 5);
});
test('Concurrencia: misma atención una vez; dos atenciones no sobreconsumen', async () => {
    const f = fixture();
    const duplicate = await Promise.all(['op1', 'op2'].map(op => saveFicha(f.db, ficha('a', 3), op, actor)));
    assert.equal(duplicate[0].ficha.id, duplicate[1].ficha.id); assert.equal(f.docs.get('Inventario/p').stock, 2);
    const g = fixture();
    const results = await Promise.allSettled(['a', 'b'].map(a => saveFicha(g.db, ficha(a, 3), a, actor)));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(g.docs.get('Inventario/p').stock, 2);
});
test('Fallo de commit simulado no deja ficha, consumo ni stock parcial', async () => {
    const f = fixture(); const before = structuredClone([...f.docs]);
    const failing = { ...f.db, runTransaction: callback => f.db.runTransaction(async tx => {
        await callback(tx); throw new Error('synthetic commit failure');
    }) };
    await assert.rejects(saveFicha(failing, ficha(), 'op', actor), /synthetic commit failure/);
    assert.deepEqual([...f.docs], before);
    await saveFicha(f.db, ficha(), 'op', actor); assert.equal(f.docs.get('Inventario/p').stock, 3);
});

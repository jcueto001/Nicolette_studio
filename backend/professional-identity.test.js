const { test } = require('node:test');
const assert = require('node:assert/strict');
const { memoryFirestore } = require('./test-firestore');
const { linkProfessional } = require('./professional-identity');
const { createBookingService } = require('./booking-service');

function fixture() {
    const data = memoryFirestore([
        ['BookingConfig/control', { ready: true, version: 1 }],
        ['Servicios/service', { name: 'Servicio', duration: 60, price: 10000 }],
        ['Profesionales/doc', { id: 'p_old', name: 'Synthetic', email: 'staff@example.invalid' }],
        ['Usuarios/auth_uid', { rol: 'profesional', email: 'staff@example.invalid' }],
        ['Citas/one', { profId: 'p_old', professionalKey: 'p_old', price: 10000, depositPaid: true, date: '2035-01-10' }],
        ['Reservas/one', { status: 'confirmed', booking: { profId: 'p_old', professionalKey: 'p_old', date: '2035-01-10' } }],
        ['FichasClientas/one', { profId: 'p_old' }],
        ['Citas/other', { profId: 'another_uid' }],
        ['AgendaLocks/keep', { version: 1, entries: [{ reservationId: 'one', state: 'confirmed' }] }]
    ]);
    const auth = { getUserByEmail: async email => {
        assert.equal(email, 'staff@example.invalid');
        return { uid: 'auth_uid', email };
    } };
    return { ...data, auth, actor: { uid: 'admin', role: 'admin' } };
}

test('Vincular agenda corrige asignaciones sin modificar pagos ni claves de ocupación', async () => {
    const f = fixture();
    const locks = structuredClone(f.docs.get('AgendaLocks/keep'));
    const result = await linkProfessional(f.db, f.auth, 'doc', f.actor);
    assert.equal(result.updated, 3);
    assert.equal(f.docs.get('Profesionales/doc').uid, 'auth_uid');
    assert.equal(f.docs.get('Profesionales/doc').professionalKey, 'p_old');
    assert.equal(f.docs.get('Citas/one').profId, 'auth_uid');
    assert.equal(f.docs.get('Citas/one').depositPaid, true);
    assert.equal(f.docs.get('Citas/one').price, 10000);
    assert.equal(f.docs.get('Reservas/one').booking.profId, 'auth_uid');
    assert.equal(f.docs.get('Reservas/one').booking.professionalKey, 'p_old');
    assert.equal(f.docs.get('FichasClientas/one').profId, 'auth_uid');
    assert.equal(f.docs.get('Citas/other').profId, 'another_uid');
    assert.deepEqual(f.docs.get('AgendaLocks/keep'), locks);
    assert.equal((await linkProfessional(f.db, f.auth, 'doc', f.actor)).updated, 0);
});

test('Las nuevas reservas usan el UID vinculado y mantienen la clave de ocupación', async () => {
    const f = fixture(); await linkProfessional(f.db, f.auth, 'doc', f.actor);
    const service = createBookingService(f.db, { now: () => Date.parse('2034-01-01T00:00:00Z') });
    const saved = await service.reserve({ profId: 'doc', serviceId: 'service', date: '2035-01-10', time: '10:00',
        clientName: 'Synthetic', clientEmail: 'client@example.invalid' }, 'identity_test_request', 'manual', f.actor);
    assert.equal(saved.booking.profId, 'auth_uid');
    assert.equal(saved.booking.professionalKey, 'p_old');
});

test('Solo una administradora puede vincular cuentas y se exige un perfil activo', async () => {
    const f = fixture();
    await assert.rejects(linkProfessional(f.db, f.auth, 'doc', { role: 'profesional' }), /FORBIDDEN/);
    f.docs.get('Usuarios/auth_uid').activo = false;
    await assert.rejects(linkProfessional(f.db, f.auth, 'doc', f.actor), /STAFF_PROFILE_REQUIRED/);
    assert.equal(f.docs.get('Citas/one').profId, 'p_old');
});

test('Vincular una agenda ocupada conserva el bloqueo frente a nuevas reservas', async () => {
    const f = fixture();
    const service = createBookingService(f.db, { now: () => Date.parse('2034-01-01T00:00:00Z') });
    const booking = { profId: 'doc', serviceId: 'service', date: '2035-01-10', time: '10:00',
        clientName: 'Synthetic', clientEmail: 'client@example.invalid' };
    const before = await service.reserve(booking, 'identity_before_link', 'manual', f.actor);
    const locks = [...f.docs].filter(([key]) => key.startsWith('AgendaLocks/'));
    await linkProfessional(f.db, f.auth, 'doc', f.actor);
    assert.equal(f.docs.get('Citas/' + before.reservationId).profId, 'auth_uid');
    assert.deepEqual([...f.docs].filter(([key]) => key.startsWith('AgendaLocks/')), locks);
    await assert.rejects(service.reserve(booking, 'identity_after_link_request', 'manual', f.actor), { code: 'SLOT_UNAVAILABLE' });
});

test('Identidades incompatibles y cuentas inexistentes no reasignan citas', async () => {
    const f = fixture();
    f.docs.get('Profesionales/doc').uid = 'another_uid';
    await assert.rejects(linkProfessional(f.db, f.auth, 'doc', f.actor), /IDENTITY_CONFLICT/);
    f.auth.getUserByEmail = async () => { throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' }); };
    await assert.rejects(linkProfessional(f.db, f.auth, 'doc', f.actor), /STAFF_ACCOUNT_NOT_FOUND/);
    assert.equal(f.docs.get('Citas/one').profId, 'p_old');
});

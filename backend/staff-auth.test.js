const { test } = require('node:test');
const assert = require('node:assert/strict');
const { staffAuth } = require('./staff-auth');

async function run({ setupError, tokenError, readError, role = 'Admin', exists = true, active = true, header = 'Bearer test-token' } = {}) {
    const req = { get: () => header };
    const result = { next: false };
    const res = { status(value) { result.status = value; return this; }, json(value) { result.body = value; return this; } };
    const middleware = staffAuth({
        database: () => {
            if (setupError) throw setupError;
            return { collection: name => {
                assert.equal(name, 'Usuarios');
                return { doc: uid => {
                    assert.equal(uid, 'verified_uid');
                    return { get: async () => {
                        if (readError) throw readError;
                        return { exists, data: () => ({ rol: role, activo: active }) };
                    } };
                } };
            } };
        },
        auth: () => ({ verifyIdToken: async (token, revoked) => {
            assert.equal(token, 'test-token'); assert.equal(revoked, true);
            if (tokenError) throw tokenError;
            return { uid: 'verified_uid' };
        } }), log() {}
    });
    await middleware(req, res, () => { result.next = true; });
    return { ...result, staff: req.staff };
}

test('Acepta Admin y admin verificados sin tomar el rol del navegador', async () => {
    for (const role of ['Admin', 'admin']) {
        const result = await run({ role });
        assert.equal(result.next, true);
        assert.deepEqual(result.staff, { uid: 'verified_uid', role: 'admin' });
    }
});

test('Distingue configuración ausente, sesión vencida y falta de rol', async () => {
    const config = await run({ setupError: new Error('FIREBASE_ADMIN_NOT_CONFIGURED') });
    assert.equal(config.status, 503);
    assert.equal(config.body.error, 'FIREBASE_ADMIN_NOT_CONFIGURED');
    const expired = await run({ tokenError: { code: 'auth/id-token-expired' } });
    assert.equal(expired.status, 401);
    assert.equal(expired.body.error, 'AUTH_EXPIRED');
    const role = await run({ role: 'clienta' });
    assert.equal(role.status, 403);
    assert.equal(role.body.error, 'STAFF_ROLE_REQUIRED');
});

test('Errores de servicio no se presentan como permisos ni exponen mensajes privados', async () => {
    const result = await run({ readError: new Error('private details') });
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { error: 'STAFF_DATABASE_UNAVAILABLE' });
    assert.equal(result.next, false);
    assert.equal(result.staff, undefined);
});

test('No permite avanzar sin token o con perfil ausente o desactivado', async () => {
    assert.equal((await run({ header: '' })).status, 401);
    for (const options of [{ exists: false }, { active: false }]) {
        const result = await run(options);
        assert.equal(result.status, 403);
        assert.equal(result.next, false);
    }
});

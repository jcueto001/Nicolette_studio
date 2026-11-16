const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { memoryFirestore } = require('./test-firestore');
const { notifyConfirmedAppointment, resendAppointmentEmail, providerError } = require('./appointment-email');
const token = 'synthetic_token_123';
const env = { EMAILJS_SERVICE_ID: 'synthetic-service', EMAILJS_TEMPLATE_ID: 'synthetic-template', EMAILJS_PUBLIC_KEY: 'synthetic-public', EMAILJS_PRIVATE_KEY: 'synthetic-private' };
function fixture() {
    return memoryFirestore([
        ['FlowTransactions/' + createHash('sha256').update(token).digest('hex'), { reservationId: 'r' }],
        ['FlowOrders/r', { paid: true, result: { booked: true } }],
        ['Citas/r', { status: 'confirmada', paymentStatus: 'pagado', clientEmail: 'synthetic@example.invalid', clientName: 'Synthetic',
            servicio: 'Synthetic service', date: '2035-01-10', time: '10:00', depositAmount: 5000, balanceDue: 7000 }]
    ]);
}
test('Correo usa cita verificada; webhook/retorno concurrentes envían una sola solicitud', async () => {
    const f = fixture(); let sends = 0;
    const fetchImpl = async (url, options) => {
        assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send');
        const data = JSON.parse(options.body);assert.equal(data.template_params.to_email, 'synthetic@example.invalid');
        assert.equal(data.accessToken, env.EMAILJS_PRIVATE_KEY);sends++;return { ok: true };
    };
    await Promise.all([1, 2, 3].map(() => notifyConfirmedAppointment(f.db, token, { env, fetchImpl })));
    assert.equal(sends, 1);assert.equal(f.docs.get('AppointmentNotifications/r').status, 'sent');
    await notifyConfirmedAppointment(f.db, token, { env, fetchImpl });assert.equal(sends, 1);
});
test('Sin configuración queda pendiente y luego se envía; pago no verificado nunca envía', async () => {
    const f = fixture(); const original = structuredClone(f.docs.get('Citas/r'));
    assert.equal((await notifyConfirmedAppointment(f.db, token, { env: {}, fetchImpl: () => assert.fail('Sin credenciales') })).status, 'pending_configuration');
    await notifyConfirmedAppointment(f.db, token, { env, fetchImpl: async () => ({ ok: true }) });
    assert.equal(f.docs.get('AppointmentNotifications/r').status, 'sent');assert.deepEqual(f.docs.get('Citas/r'), original);
    f.docs.get('FlowOrders/r').paid = false;
    await assert.rejects(notifyConfirmedAppointment(f.db, token, { env, fetchImpl: () => assert.fail('Pago no validado') }), /CONFIRMED_APPOINTMENT_REQUIRED/);
});
test('Respuesta perdida o rechazada no provoca reenvíos automáticos ni altera la cita', async () => {
    for (const fails of [true, false]) {
        const f = fixture();let sends = 0;const original = structuredClone(f.docs.get('Citas/r'));
        const fetchImpl = async () => { sends++;if (fails) throw new Error('synthetic network failure');return { ok: false }; };
        const result = await notifyConfirmedAppointment(f.db, token, { env, fetchImpl });
        assert.equal(result.status, fails ? 'delivery_unknown' : 'delivery_failed');
        await notifyConfirmedAppointment(f.db, token, { env, fetchImpl });assert.equal(sends, 1);
        assert.deepEqual(f.docs.get('Citas/r'), original);assert.equal(f.docs.get('FlowOrders/r').paid, true);
    }
});

test('Rechazo guarda solo categoría y HTTP, nunca texto con claves ni destinatarios', async () => {
    const f = fixture();
    const result = await notifyConfirmedAppointment(f.db, token, { env, fetchImpl: async () => ({ ok: false, status: 403,
        text: async () => 'API requests are disabled for non-browser applications; synthetic-private; synthetic@example.invalid' }) });
    assert.equal(result.errorCode, 'EMAIL_SERVER_API_DISABLED');assert.equal(result.providerHttpStatus, 403);
    const stored = JSON.stringify(f.docs.get('AppointmentNotifications/r'));
    assert.ok(!stored.includes('synthetic-private'));assert.ok(!stored.includes('synthetic@example.invalid'));
    assert.equal(providerError(400, 'The Public Key is invalid'), 'EMAIL_PUBLIC_KEY_INVALID');
    assert.equal(providerError(400, 'The Private Key is invalid'), 'EMAIL_PRIVATE_KEY_INVALID');
    assert.equal(providerError(429, 'Limit exceeded'), 'EMAIL_QUOTA_EXCEEDED');
});

test('Reenvío exige rol y asignación reales; no permite modificar destinatario', async () => {
    const f = fixture();f.docs.set('Usuarios/admin', { rol: 'admin', activo: true });
    f.docs.set('Usuarios/pro', { rol: 'profesional', activo: true });
    f.docs.get('Citas/r').profId = 'pro';
    f.docs.set('Usuarios/other', { rol: 'profesional', activo: true });
    const fetchImpl = async (_, options) => {
        assert.equal(JSON.parse(options.body).template_params.to_email, 'synthetic@example.invalid');return { ok: true, status: 200 };
    };
    await assert.rejects(resendAppointmentEmail(f.db, 'r', { uid: 'other', role: 'admin' }, 'request-other', { env, fetchImpl }), { code: 'FORBIDDEN' });
    assert.equal((await resendAppointmentEmail(f.db, 'r', { uid: 'pro' }, 'request-professional', { env, fetchImpl })).status, 'sent');
    f.docs.get('Usuarios/admin').activo = false;
    await assert.rejects(resendAppointmentEmail(f.db, 'r', { uid: 'admin' }, 'request-disabled', { env, fetchImpl }), { code: 'FORBIDDEN' });
});

test('Reenvío explícito idempotente y concurrente recupera fallo conocido sin duplicar', async () => {
    const f = fixture();f.docs.set('Usuarios/admin', { rol: 'Admin' });
    f.docs.set('AppointmentNotifications/r', { status: 'delivery_failed', attemptedAtMs: 1, errorCode: 'EMAIL_PROVIDER_REJECTED' });
    let sends = 0;const fetchImpl = async () => { sends++;return { ok: true, status: 200 }; };
    const before = structuredClone(f.docs.get('Citas/r'));
    await Promise.all([1, 2].map(() => resendAppointmentEmail(f.db, 'r', { uid: 'admin' }, 'request-retry-1', { env, fetchImpl, now: () => 120000 })));
    assert.equal(sends, 1);
    await resendAppointmentEmail(f.db, 'r', { uid: 'admin' }, 'request-retry-1', { env, fetchImpl, now: () => 120000 });
    assert.equal(sends, 1);
    await assert.rejects(resendAppointmentEmail(f.db, 'r', { uid: 'admin' }, 'request-retry-2', { env, fetchImpl, now: () => 120001 }), { code: 'EMAIL_RETRY_RATE_LIMIT' });
    f.docs.get('AppointmentNotifications/r').status = 'delivery_unknown';
    await assert.rejects(resendAppointmentEmail(f.db, 'r', { uid: 'admin' }, 'request-retry-3', { env, fetchImpl, now: () => 240000 }), { code: 'EMAIL_DELIVERY_UNCERTAIN' });
    assert.deepEqual(f.docs.get('Citas/r'), before);
});

test('Confirmación manual legítima conserva reenvío y las respuestas 5xx requieren revisión', async () => {
    const f = fixture();f.docs.delete('FlowOrders/r');f.docs.set('Usuarios/admin', { rol: 'admin' });
    f.docs.set('Reservas/r', { kind: 'manual', status: 'confirmed' });f.docs.get('Citas/r').paymentStatus = 'sin_pago_online';
    const result = await resendAppointmentEmail(f.db, 'r', { uid: 'admin' }, 'request-manual', {
        env, fetchImpl: async () => ({ ok: false, status: 502, text: async () => 'Upstream error' })
    });
    assert.equal(result.status, 'delivery_unknown');assert.equal(result.providerHttpStatus, 502);
});

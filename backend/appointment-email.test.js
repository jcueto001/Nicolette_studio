const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { memoryFirestore } = require('./test-firestore');
const { notifyConfirmedAppointment } = require('./appointment-email');
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

const { createHash, randomUUID } = require('node:crypto');

async function notifyConfirmedAppointment(db, token, { env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
    const configured = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY']
        .every(key => typeof env[key] === 'string' && env[key].trim());
    const attemptId = randomUUID();
    const claimed = await db.runTransaction(async tx => {
        const known = await tx.get(db.collection('FlowTransactions').doc(createHash('sha256').update(token).digest('hex')));
        if (!known.exists) throw new Error('PAYMENT_REFERENCE_REQUIRED');
        const reservationId = known.data().reservationId;
        const order = await tx.get(db.collection('FlowOrders').doc(reservationId));
        const appointment = await tx.get(db.collection('Citas').doc(reservationId));
        const jobRef = db.collection('AppointmentNotifications').doc(reservationId);
        const job = await tx.get(jobRef);
        if (!order.exists || order.data().paid !== true || order.data().result?.booked !== true
            || !appointment.exists || appointment.data().paymentStatus !== 'pagado'
            || !['confirmada', 'completada'].includes(appointment.data().status)) throw new Error('CONFIRMED_APPOINTMENT_REQUIRED');
        if (job.exists && !['pending_configuration'].includes(job.data().status)) {
            return { status: job.data().status, send: false };
        }
        if (!configured) {
            if (!job.exists) tx.create(jobRef, { reservationId, status: 'pending_configuration', createdAtMs: now() });
            return { status: 'pending_configuration', send: false };
        }
        const data = appointment.data();
        if (typeof data.clientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) {
            tx.set(jobRef, { reservationId, status: 'invalid_recipient', createdAtMs: now() });
            return { status: 'invalid_recipient', send: false };
        }
        // No reintentar automáticamente un envío iniciado: una respuesta perdida podría duplicarlo.
        tx.set(jobRef, { reservationId, status: 'sending', attemptId, attemptedAtMs: now() });
        return { status: 'sending', send: true, reservationId, data };
    });
    if (!claimed.send) return { status: claimed.status };
    const data = claimed.data;
    const name = data.clientName || 'Clienta';
    const balance = '$' + Number(data.balanceDue || 0).toLocaleString('es-CL');
    const params = {
        to_email: data.clientEmail, email: data.clientEmail, client_email: data.clientEmail,
        reply_to: data.clientEmail, user_email: data.clientEmail, recipient: data.clientEmail,
        to_name: name, client_name: name, nombre: name, name,
        service: data.servicio || '', servicio: data.servicio || '',
        date: data.date, fecha: data.date, time: data.time, hora: data.time,
        profesional: data.profesional || '', professional: data.profesional || '',
        deposit: '$' + Number(data.depositAmount || 0).toLocaleString('es-CL'),
        abono: '$' + Number(data.depositAmount || 0).toLocaleString('es-CL'), balance, saldo: balance
    };
    let status = 'delivery_unknown';
    let errorCode;
    try {
        const response = await fetchImpl('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
            body: JSON.stringify({ service_id: env.EMAILJS_SERVICE_ID.trim(), template_id: env.EMAILJS_TEMPLATE_ID.trim(),
                user_id: env.EMAILJS_PUBLIC_KEY.trim(), accessToken: env.EMAILJS_PRIVATE_KEY.trim(), template_params: params })
        });
        status = response.ok ? 'sent' : 'delivery_failed';
        if (!response.ok) errorCode = 'EMAIL_PROVIDER_REJECTED';
    } catch (_) { errorCode = 'EMAIL_DELIVERY_UNCERTAIN'; }
    await db.runTransaction(async tx => {
        const ref = db.collection('AppointmentNotifications').doc(claimed.reservationId);
        const saved = await tx.get(ref);
        if (saved.exists && saved.data().attemptId === attemptId && saved.data().status === 'sending') {
            tx.update(ref, { status, completedAtMs: now(), ...(errorCode ? { errorCode } : {}) });
        }
    });
    return { status };
}
module.exports = { notifyConfirmedAppointment };

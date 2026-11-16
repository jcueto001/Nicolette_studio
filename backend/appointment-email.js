const { createHash, randomUUID } = require('node:crypto');

function emailError(code, status = 400) { throw Object.assign(new Error(code), { code, status }); }
function providerError(status, message) {
    const text = typeof message === 'string' ? message.toLowerCase() : '';
    if (/non.browser|browser applications|api requests.*disabled/.test(text)) return 'EMAIL_SERVER_API_DISABLED';
    if (/private.?key|access.?token|authentication.*failed/.test(text)) return 'EMAIL_PRIVATE_KEY_INVALID';
    if (/public.?key|user.?id|account.*not found/.test(text)) return 'EMAIL_PUBLIC_KEY_INVALID';
    if (/service.*not found|service.*invalid|service.?id/.test(text)) return 'EMAIL_SERVICE_INVALID';
    if (/template/.test(text)) return 'EMAIL_TEMPLATE_INVALID';
    if (/recipient|address.*corrupt/.test(text)) return 'EMAIL_RECIPIENT_INVALID';
    if (status === 429 || /quota|limit.*exceed/.test(text)) return 'EMAIL_QUOTA_EXCEEDED';
    if (/gmail|oauth|invalid_grant|reauth|token.*expired/.test(text)) return 'EMAIL_MAILBOX_RECONNECT_REQUIRED';
    return 'EMAIL_PROVIDER_REJECTED';
}
function resultOf(data) {
    return { status: data.status, ...(data.errorCode ? { errorCode: data.errorCode } : {}),
        ...(Number.isInteger(data.providerHttpStatus) ? { providerHttpStatus: data.providerHttpStatus } : {}) };
}

async function notifyConfirmedAppointment(db, token, { env = process.env, fetchImpl = fetch, now = Date.now, manual } = {}) {
    const missingConfiguration = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY']
        .filter(key => typeof env[key] !== 'string' || !env[key].trim());
    const configured = missingConfiguration.length === 0;
    const attemptId = randomUUID();
    const claimed = await db.runTransaction(async tx => {
        let reservationId, staff, requestRef, priorRequest;
        if (manual) {
            if (!/^[\w-]{1,128}$/.test(manual.appointmentId || '') || !/^[\w-]{8,128}$/.test(manual.requestId || '')
                || typeof manual.actor?.uid !== 'string') emailError('INVALID_EMAIL_REQUEST');
            staff = await tx.get(db.collection('Usuarios').doc(manual.actor.uid));
            if (!staff.exists || staff.data().activo === false || !['Admin', 'admin', 'profesional'].includes(staff.data().rol)) emailError('FORBIDDEN', 403);
            reservationId = manual.appointmentId;
            requestRef = db.collection('AppointmentEmailRequests').doc(createHash('sha256').update(manual.actor.uid + ':' + manual.requestId).digest('hex'));
            priorRequest = await tx.get(requestRef);
        } else {
            const known = await tx.get(db.collection('FlowTransactions').doc(createHash('sha256').update(token).digest('hex')));
            if (!known.exists) throw new Error('PAYMENT_REFERENCE_REQUIRED');
            reservationId = known.data().reservationId;
        }
        const order = await tx.get(db.collection('FlowOrders').doc(reservationId));
        const appointment = await tx.get(db.collection('Citas').doc(reservationId));
        const reservation = manual ? await tx.get(db.collection('Reservas').doc(reservationId)) : null;
        const jobRef = db.collection('AppointmentNotifications').doc(reservationId);
        const job = await tx.get(jobRef);
        if (manual && (!appointment.exists || (staff.data().rol === 'profesional' && appointment.data().profId !== manual.actor.uid))) emailError('FORBIDDEN', 403);
        const flowVerified = order.exists && order.data().paid === true && order.data().result?.booked === true && appointment.data()?.paymentStatus === 'pagado';
        const manualVerified = manual && reservation.exists && reservation.data().kind === 'manual' && reservation.data().status === 'confirmed'
            && appointment.data()?.paymentStatus === 'sin_pago_online';
        if (!appointment.exists || !['confirmada', 'completada'].includes(appointment.data().status) || (!flowVerified && !manualVerified)) emailError('CONFIRMED_APPOINTMENT_REQUIRED', 409);
        if (priorRequest?.exists) {
            if (priorRequest.data().reservationId !== reservationId) emailError('EMAIL_REQUEST_MISMATCH', 409);
            return { ...resultOf(priorRequest.data()), send: false };
        }
        if (manual && job.exists) {
            if (job.data().status === 'sending') emailError('EMAIL_SEND_IN_PROGRESS', 409);
            if (job.data().status === 'delivery_unknown') emailError('EMAIL_DELIVERY_UNCERTAIN', 409);
            if (now() - (job.data().attemptedAtMs || 0) < 60000) emailError('EMAIL_RETRY_RATE_LIMIT', 429);
        }
        if (!manual && job.exists && job.data().status !== 'pending_configuration') {
            return { ...resultOf(job.data()), send: false };
        }
        if (!configured) {
            if (!job.exists) tx.create(jobRef, { reservationId, status: 'pending_configuration', createdAtMs: now() });
            if (requestRef) tx.create(requestRef, { reservationId, status: 'pending_configuration', errorCode: 'EMAIL_CONFIGURATION_MISSING' });
            return { status: 'pending_configuration', errorCode: 'EMAIL_CONFIGURATION_MISSING', missingConfiguration, send: false };
        }
        const data = appointment.data();
        if (typeof data.clientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) {
            tx.set(jobRef, { reservationId, status: 'invalid_recipient', createdAtMs: now() });
            if (requestRef) tx.create(requestRef, { reservationId, status: 'invalid_recipient', errorCode: 'EMAIL_RECIPIENT_INVALID' });
            return { status: 'invalid_recipient', errorCode: 'EMAIL_RECIPIENT_INVALID', send: false };
        }
        // No reintentar automáticamente un envío iniciado: una respuesta perdida podría duplicarlo.
        tx.set(jobRef, { reservationId, status: 'sending', attemptId, attemptedAtMs: now() });
        if (requestRef) tx.create(requestRef, { reservationId, status: 'sending', attemptId });
        return { status: 'sending', send: true, reservationId, data, requestRef };
    });
    if (!claimed.send) return { ...resultOf(claimed), ...(claimed.missingConfiguration ? { missingConfiguration: claimed.missingConfiguration } : {}) };
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
    let errorCode, providerHttpStatus;
    try {
        const response = await fetchImpl('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
            body: JSON.stringify({ service_id: env.EMAILJS_SERVICE_ID.trim(), template_id: env.EMAILJS_TEMPLATE_ID.trim(),
                user_id: env.EMAILJS_PUBLIC_KEY.trim(), accessToken: env.EMAILJS_PRIVATE_KEY.trim(), template_params: params })
        });
        providerHttpStatus = response.status;
        status = response.ok ? 'sent' : response.status >= 500 ? 'delivery_unknown' : 'delivery_failed';
        if (!response.ok) {
            let message = '';
            try { message = (await response.text()).slice(0, 2048); } catch (_) {}
            errorCode = providerError(response.status, message);
            // Solo códigos conocidos: jamás guardar ni imprimir texto del proveedor, claves o destinatarios.
            console.warn('[AppointmentEmail]', { errorCode, providerHttpStatus });
        }
    } catch (_) { errorCode = 'EMAIL_DELIVERY_UNCERTAIN'; }
    await db.runTransaction(async tx => {
        const ref = db.collection('AppointmentNotifications').doc(claimed.reservationId);
        const saved = await tx.get(ref);
        if (saved.exists && saved.data().attemptId === attemptId && saved.data().status === 'sending') {
            const summary = { status, completedAtMs: now(), ...(errorCode ? { errorCode } : {}),
                ...(Number.isInteger(providerHttpStatus) ? { providerHttpStatus } : {}) };
            tx.update(ref, summary);
            if (claimed.requestRef) tx.update(claimed.requestRef, summary);
        }
    });
    return resultOf({ status, errorCode, providerHttpStatus });
}
const resendAppointmentEmail = (db, appointmentId, actor, requestId, options = {}) =>
    notifyConfirmedAppointment(db, null, { ...options, manual: { appointmentId, actor, requestId } });
module.exports = { notifyConfirmedAppointment, resendAppointmentEmail, providerError };

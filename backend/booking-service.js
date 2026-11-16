const crypto = require('node:crypto');
const HOLD_MS = 10 * 60 * 1000;
const ZONE = 'America/Santiago';
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function fail(code, status = 409) { const error = new Error(code); error.code = code; error.status = status; throw error; }
function identifier(value) { if (typeof value !== 'string' || !/^[\w-]{1,128}$/.test(value)) fail('INVALID_ID', 400); return value; }
function dateString(value) {
    if (typeof value !== 'string') fail('INVALID_DATE', 400);
    const legacy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (legacy) value = `${legacy[3]}-${legacy[2]}-${legacy[1]}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) fail('INVALID_DATE', 400);
    return value;
}
function localParts(ms) {
    const parts = Object.fromEntries(formatter.formatToParts(ms).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
function startTime(date, time) {
    date = dateString(date);
    if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) fail('INVALID_TIME', 400);
    const [hour, minute] = time.split(':').map(Number);
    if (minute > 59 || hour * 60 + minute < 540 || hour * 60 + minute > 1260) fail('OUTSIDE_SCHEDULE', 400);
    const base = Date.parse(`${date}T${time}:00Z`);
    const matches = [];
    for (let offset = -14; offset <= 14; offset += 0.5) {
        const ms = base + offset * 3600000; const local = localParts(ms);
        if (local.date === date && local.time === time) matches.push(ms);
    }
    if (matches.length !== 1) fail('AMBIGUOUS_OR_INVALID_TIME', 400);
    return matches[0];
}
function days(booking) {
    const result = new Set();
    for (let ms = booking.startMs; ms < booking.endMs; ms += 3600000) result.add(localParts(ms).date);
    result.add(localParts(booking.endMs - 1).date);
    return [...result].sort();
}
function lockId(professionalKey, date) { return hash(professionalKey) + '_' + date; }
function overlaps(a, b) { return a.startMs < b.endMs && b.startMs < a.endMs; }
function active(entries, now, except) {
    return (entries || []).filter(entry => entry.reservationId !== except && (entry.state === 'confirmed' || entry.expiresAtMs > now));
}
function cleanInput(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('INVALID_BOOKING', 400);
    const result = { serviceId: identifier(input.serviceId), profId: identifier(input.profId), date: dateString(input.date), time: input.time };
    startTime(result.date, result.time);
    for (const key of ['clientName', 'clientEmail', 'clientPhone', 'notes']) {
        if (input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length > 1000)) fail('INVALID_BOOKING', 400);
        result[key] = input[key] || '';
    }
    if (input.needs && typeof input.needs === 'object') result.needs = Object.fromEntries(['kids', 'time', 'event'].map(key => [key, input.needs[key] === true]));
    return result;
}

function createBookingService(db, { now = Date.now, flowCreate, flowStatus, sandbox = true, isBookingPaused = () => false } = {}) {
    const ref = (collection, id) => db.collection(collection).doc(id);
    async function ready(tx) {
        const config = await tx.get(ref('BookingConfig', 'control'));
        if (!config.exists || config.data().version !== 1 || config.data().ready !== true) fail('BOOKING_MIGRATION_REQUIRED', 503);
    }
    async function catalog(tx, input, kind) {
        const service = await tx.get(ref('Servicios', input.serviceId));
        let professional = await tx.get(ref('Profesionales', input.profId));
        if (!professional.exists) {
            const matches = await tx.get(db.collection('Profesionales').where('id', '==', input.profId).limit(2));
            if (matches.docs.length !== 1) fail('PROFESSIONAL_UNAVAILABLE', 400);
            professional = matches.docs[0];
        }
        if (!service.exists || service.data().activo === false || professional.data().activo === false) fail('CATALOG_UNAVAILABLE', 400);
        const data = service.data(), person = professional.data();
        const duration = Number(data.duration ?? data.duracion), price = Number(data.price ?? data.precio);
        if (!Number.isInteger(duration) || duration < 1 || duration > 1440) fail('INVALID_CATALOG_DURATION', 400);
        if (!Number.isSafeInteger(price) || price < (kind === 'flow' ? 5000 : 0)) fail('INVALID_CATALOG_PRICE', 400);
        const professionalKey = identifier(person.uid || person.authUid || person.id || professional.id);
        const startMs = startTime(input.date, input.time);
        return { ...input, profId: professionalKey, professionalKey, professionalDocId: professional.id,
            servicio: String(data.name || data.nombre || input.serviceId), profesional: String(person.name || person.nombre || professional.id),
            duration, totalPrice: price, balanceDue: Math.max(0, price - (kind === 'flow' ? 5000 : 0)), startMs, endMs: startMs + duration * 60000, timeZone: ZONE };
    }
    async function readLocks(tx, bookings) {
        const ids = [...new Set(bookings.flatMap(booking => days(booking).map(day => lockId(booking.professionalKey, day))))].sort();
        const records = [];
        for (const id of ids) { const r = ref('AgendaLocks', id); const snap = await tx.get(r); records.push({ ref: r, entries: snap.exists ? snap.data().entries : [] }); }
        return records;
    }
    function writeLocks(tx, locks, booking, reservationId, state, expiresAtMs, time) {
        const needed = new Set(days(booking).map(day => lockId(booking.professionalKey, day)));
        for (const lock of locks) {
            const entries = active(lock.entries, time, reservationId);
            if (state && needed.has(lock.ref.id)) entries.push({ reservationId, startMs: booking.startMs, endMs: booking.endMs, state, expiresAtMs });
            if (entries.length > 256) fail('AGENDA_CAPACITY_REACHED', 503);
            tx.set(lock.ref, { entries, version: 1 });
        }
    }
    function available(locks, booking, time, except) { return !locks.some(lock => active(lock.entries, time, except).some(entry => overlaps(entry, booking))); }
    function requireActor(actor, booking, adminOnly = false) {
        if (!actor || (actor.role !== 'admin' && (adminOnly || actor.uid !== booking.profId))) fail('FORBIDDEN', 403);
    }
    function cita(booking, id, status, paid = false, flowOrder = null) {
        return { ...booking, id, reservationId: id, status, paymentStatus: paid ? 'pagado' : 'sin_pago_online',
            depositAmount: paid ? 5000 : 0, paymentMethod: paid ? 'Flow' : 'manual', orderId: id, flowOrder };
    }
    async function reserve(raw, requestId, kind, actor) {
        identifier(requestId);
        if (requestId.length < 20) fail('INVALID_REQUEST_ID', 400);
        const input = cleanInput(raw);
        if (kind === 'flow' && (!input.clientName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.clientEmail))) fail('INVALID_CLIENT', 400);
        const requestKey = hash(`${kind}:${actor?.uid || 'guest'}:${requestId}`);
        const fingerprint = hash(JSON.stringify(input));
        const reservationId = 'RES-' + crypto.randomUUID();
        const receipt = crypto.randomBytes(32).toString('hex');
        return db.runTransaction(async tx => {
            if (isBookingPaused()) fail('BOOKING_PAUSED', 503);
            await ready(tx);
            const requestRef = ref('BookingRequests', requestKey), request = await tx.get(requestRef);
            if (request.exists) {
                if (request.data().fingerprint !== fingerprint) fail('IDEMPOTENCY_MISMATCH');
                const saved = await tx.get(ref('Reservas', request.data().reservationId));
                if (!saved.exists) fail('RESERVATION_UNAVAILABLE', 503);
                return { reservationId: saved.id, ...saved.data(), newRequest: false };
            }
            const booking = await catalog(tx, input, kind);
            if (kind !== 'flow') requireActor(actor, booking, true);
            if (booking.startMs <= now()) fail('PAST_BOOKING', 400);
            const locks = await readLocks(tx, [booking]);
            const time = now();
            if (!available(locks, booking, time)) fail('SLOT_UNAVAILABLE');
            const expiresAtMs = kind === 'flow' ? time + HOLD_MS : null;
            const state = kind === 'flow' ? 'held' : 'confirmed';
            const status = kind === 'flow' ? 'held' : input.serviceId === 'bloqueo' ? 'blocked' : 'confirmed';
            const reservation = { booking, status, kind, expiresAtMs, receipt, receiptHash: hash(receipt), sandbox, createdAtMs: time, revision: 0 };
            writeLocks(tx, locks, booking, reservationId, state, expiresAtMs, time);
            tx.create(ref('Reservas', reservationId), reservation);
            tx.create(requestRef, { reservationId, fingerprint });
            if (kind === 'flow') tx.create(ref('FlowOrders', reservationId), { reservationId, status: 'creating', paid: false, sandbox, receiptHash: hash(receipt), createdAtMs: time });
            else tx.create(ref('Citas', reservationId), cita(booking, reservationId, status === 'blocked' ? 'bloqueada' : 'confirmada'));
            return { reservationId, ...reservation, newRequest: true };
        });
    }
    async function createPayment(input, requestId) {
        if (!flowCreate) fail('PAYMENTS_DISABLED', 503);
        const reservation = await reserve(input, requestId, 'flow');
        const orderRef = ref('FlowOrders', reservation.reservationId);
        if (!reservation.newRequest) {
            const order = (await orderRef.get()).data();
            if (!order?.redirectUrl) fail('PAYMENT_CREATION_PENDING_REVIEW', 409);
            return { success: true, receipt: reservation.receipt, redirectUrl: order.redirectUrl };
        }
        try {
            // La llamada externa nunca se reintenta automáticamente ni se ejecuta dentro de una transacción.
            const payment = await flowCreate(reservation.reservationId, reservation.booking);
            if (!payment || typeof payment.token !== 'string' || !/^[\w-]{8,256}$/.test(payment.token) || !payment.flowOrder) fail('INVALID_FLOW_RESPONSE', 502);
            await db.runTransaction(async tx => {
                const order = await tx.get(orderRef);
                const tokenRef = ref('FlowTransactions', hash(payment.token));
                const existing = await tx.get(tokenRef);
                if (existing.exists && existing.data().reservationId !== reservation.reservationId) fail('FLOW_TOKEN_CONFLICT');
                if (order.data().flowOrder && String(order.data().flowOrder) !== String(payment.flowOrder)) fail('FLOW_ORDER_CONFLICT');
                tx.set(tokenRef, { reservationId: reservation.reservationId, flowOrder: payment.flowOrder });
                tx.update(orderRef, { flowOrder: payment.flowOrder, tokenHash: hash(payment.token), redirectUrl: payment.redirectUrl,
                    status: order.data().paid ? order.data().status : 'created' });
            });
            return { success: true, receipt: reservation.receipt, redirectUrl: payment.redirectUrl };
        } catch (error) {
            // Una respuesta perdida puede haber creado un cobro. No crear una segunda orden ni liberar anticipadamente.
            await db.runTransaction(async tx => { const order = await tx.get(orderRef); if (!order.data().paid && order.data().status === 'creating') tx.update(orderRef, { status: 'creation_unknown' }); });
            throw error;
        }
    }
    async function confirmPayment(token, receipt) {
        if (typeof token !== 'string' || !/^[\w-]{8,256}$/.test(token)) fail('INVALID_TOKEN', 400);
        if (!flowStatus) fail('PAYMENTS_DISABLED', 503);
        const status = await flowStatus(token); // Respuesta autenticada de Flow, fuera de la transacción.
        const orderId = identifier(status.commerceOrder);
        return db.runTransaction(async tx => {
            const orderRef = ref('FlowOrders', orderId), orderSnap = await tx.get(orderRef);
            if (!orderSnap.exists) fail('UNKNOWN_ORDER', 400);
            const order = orderSnap.data();
            if (order.sandbox !== sandbox || status.currency !== 'CLP' || Number(status.amount) !== 5000 || !status.flowOrder) fail('PAYMENT_MISMATCH', 400);
            if (order.flowOrder && String(order.flowOrder) !== String(status.flowOrder)) fail('PAYMENT_MISMATCH', 400);
            if (order.tokenHash && order.tokenHash !== hash(token)) fail('PAYMENT_MISMATCH', 400);
            if (receipt !== undefined && (typeof receipt !== 'string' || receipt.length > 128 || hash(receipt) !== order.receiptHash)) fail('INVALID_RECEIPT', 403);
            if (status.status !== 2) return { paid: false, booked: false };
            if (order.paid) return order.result;
            const reservationRef = ref('Reservas', order.reservationId), saved = await tx.get(reservationRef);
            if (!saved.exists) fail('UNKNOWN_RESERVATION', 503);
            const reservation = saved.data(), booking = reservation.booking;
            const config = await tx.get(ref('BookingConfig', 'control'));
            const locks = await readLocks(tx, [booking]);
            const tokenRef = ref('FlowTransactions', hash(token)), knownToken = await tx.get(tokenRef);
            if (knownToken.exists && knownToken.data().reservationId !== order.reservationId) fail('FLOW_TOKEN_CONFLICT');
            const time = now();
            const canBook = config.exists && config.data().ready === true && config.data().version === 1
                && reservation.status === 'held' && booking.startMs > time && available(locks, booking, time, order.reservationId);
            const result = { paid: true, booked: !!canBook, conflict: !canBook };
            writeLocks(tx, locks, booking, order.reservationId, canBook ? 'confirmed' : null, null, time);
            if (canBook) tx.create(ref('Citas', order.reservationId), cita(booking, order.reservationId, 'confirmada', true, status.flowOrder));
            else tx.set(ref('FinancialConflicts', order.reservationId), { reservationId: order.reservationId, flowOrder: status.flowOrder, amount: 5000, currency: 'CLP', state: 'manual_review', createdAtMs: time });
            tx.update(reservationRef, { status: canBook ? 'confirmed' : 'paid_conflict' });
            tx.update(orderRef, { paid: true, result, flowOrder: status.flowOrder, tokenHash: hash(token), status: canBook ? 'paid' : 'paid_conflict' });
            tx.set(tokenRef, { reservationId: order.reservationId, flowOrder: status.flowOrder });
            return result;
        });
    }
    async function change(id, changes, actor, requestId) {
        identifier(id); identifier(requestId);
        const requestRef = ref('BookingRequests', hash(`change:${actor?.uid}:${requestId}`));
        const fingerprint = hash(JSON.stringify({ id, changes }));
        return db.runTransaction(async tx => {
            await ready(tx);
            const prior = await tx.get(requestRef);
            if (prior.exists) { if (prior.data().fingerprint !== fingerprint) fail('IDEMPOTENCY_MISMATCH'); return prior.data().result; }
            const reservationRef = ref('Reservas', id), saved = await tx.get(reservationRef);
            const citaRef = ref('Citas', id), savedCita = await tx.get(citaRef);
            if (!saved.exists || !savedCita.exists) fail('MIGRATION_REQUIRED_FOR_APPOINTMENT', 409);
            const reservation = saved.data(), old = reservation.booking;
            requireActor(actor, old);
            if (reservation.status === 'paid_conflict') fail('FINANCIAL_REVIEW_REQUIRED');
            if (!Number.isInteger(changes.revision) || changes.revision !== reservation.revision) fail('STALE_APPOINTMENT');
            const requested = changes.status || savedCita.data().status;
            if (!['confirmada', 'completada', 'cancelada', 'no asiste', 'bloqueada'].includes(requested)) fail('INVALID_STATUS', 400);
            const rescheduling = ['date', 'time', 'profId', 'serviceId'].some(key => changes[key] !== undefined && changes[key] !== old[key]);
            if (rescheduling) requireActor(actor, old, true);
            const booking = rescheduling ? await catalog(tx, cleanInput({ ...old, ...changes }), reservation.kind) : old;
            const addsOccupation = !['cancelada', 'no asiste'].includes(requested)
                && (reservation.status === 'cancelled' || booking.professionalKey !== old.professionalKey
                    || booking.startMs !== old.startMs || booking.endMs !== old.endMs);
            if (isBookingPaused() && addsOccupation) fail('BOOKING_PAUSED', 503);
            if ((rescheduling || reservation.status === 'cancelled') && booking.startMs <= now()) fail('PAST_BOOKING', 400);
            const locks = await readLocks(tx, [old, booking]);
            const orderRef = ref('FlowOrders', id), order = await tx.get(orderRef);
            const time = now(), cancelled = ['cancelada', 'no asiste'].includes(requested);
            if (!cancelled && !available(locks, booking, time, id)) fail('SLOT_UNAVAILABLE');
            writeLocks(tx, locks, booking, id, cancelled ? null : 'confirmed', null, time);
            const updated = { ...savedCita.data(), ...booking, status: requested, revision: reservation.revision + 1 };
            tx.update(reservationRef, { booking, status: cancelled ? 'cancelled' : 'confirmed', revision: updated.revision });
            tx.set(citaRef, updated);
            if (order.exists && order.data().paid) tx.update(orderRef, { result: { paid: true, booked: !cancelled, cancelled } });
            tx.create(requestRef, { fingerprint, result: updated });
            return updated;
        });
    }
    async function availability({ date, profId, serviceId, times }) {
        date = dateString(date); identifier(profId); identifier(serviceId);
        if (!Array.isArray(times) || times.length > 24) fail('INVALID_TIMES', 400);
        return db.runTransaction(async tx => {
            await ready(tx);
            const candidates = [];
            for (const time of times) candidates.push(await catalog(tx, { date, time, profId, serviceId }, 'manual'));
            const locks = await readLocks(tx, candidates);
            return candidates.filter(booking => booking.startMs > now() && available(locks, booking, now())).map(booking => booking.time);
        });
    }
    async function migrate({ apply = false } = {}) {
        return require('./booking-migration').migrateBookings({
            db, now, catalog, cleanInput, days, lockId, overlaps, identifier, dateString
        }, { apply });
    }
    return { reserve, createPayment, confirmPayment, change, availability, migrate };
}
module.exports = { createBookingService, HOLD_MS, dateString, startTime, localParts, days, lockId, overlaps, cleanInput };

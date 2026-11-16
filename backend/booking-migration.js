const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

// Solo para migración: no tomar importes actuales del catálogo para reconstruir historia.
function historicalBooking(source, catalogBooking) {
    for (const key of ['totalPrice', 'depositAmount', 'balanceDue']) {
        if (!own(source, key) || !Number.isSafeInteger(source[key]) || source[key] < 0) {
            const error = new Error('HISTORICAL_FINANCIAL_DATA_REQUIRED');
            error.code = 'HISTORICAL_FINANCIAL_DATA_REQUIRED';
            error.field = key;
            throw error;
        }
    }
    return { ...catalogBooking, ...source, profId: source.profId,
        professionalKey: catalogBooking.professionalKey, professionalDocId: catalogBooking.professionalDocId,
        duration: source.duration, startMs: catalogBooking.startMs, endMs: catalogBooking.startMs + source.duration * 60000,
        timeZone: 'America/Santiago', totalPrice: source.totalPrice, depositAmount: source.depositAmount, balanceDue: source.balanceDue };
}
function historicalReservation(item) {
    return { id: item.id, booking: item.booking, kind: 'legacy', status: item.cancelled ? 'cancelled' : 'confirmed',
        legacyStatus: item.source.status, sourceCitaId: item.id, originalAppointment: item.source, revision: item.revision, expiresAtMs: null };
}

async function migrateBookings({ db, now, catalog, cleanInput, days, lockId, overlaps, identifier, dateString }, { apply = false } = {}) {
    const ref = (collection, id) => db.collection(collection).doc(id);
    return db.runTransaction(async tx => {
        const control = await tx.get(ref('BookingConfig', 'control'));
        const history = await tx.get(db.collection('Citas'));
        const payments = await tx.get(db.collection('FlowTransactions'));
        const savedReservations = await tx.get(db.collection('Reservas'));
        const savedLocks = await tx.get(db.collection('AgendaLocks'));
        const reservations = new Map(savedReservations.docs.map(doc => [doc.id, doc.data()]));
        const locks = new Map(savedLocks.docs.map(doc => [doc.id, doc.data()]));
        const issues = [], records = [], items = [], references = new Map();
        const add = (code, id, extra = {}) => issues.push({ code, ...(id ? { record: hash(id) } : {}), ...extra });
        if (control.exists && control.data().ready) add('MIGRATION_ALREADY_ENABLED');
        if (control.exists && control.data().version !== undefined && control.data().version !== 1) add('MIGRATION_CONFIG_VERSION_UNSUPPORTED');
        for (const payment of payments.docs) if (!payment.data().reservationId) add('LEGACY_PAYMENT_REQUIRES_REVIEW', payment.id);

        for (const record of history.docs) {
            const source = record.data(), startIssueCount = issues.length;
            const status = String(source.status || '').toLowerCase();
            const cancelled = ['cancelada', 'no asiste'].includes(status);
            if (!['confirmada', 'completada', 'bloqueada', 'cancelada', 'no asiste'].includes(status)) add('LEGACY_PENDING_REQUIRES_REVIEW', record.id);
            try { identifier(record.id); } catch { add('INVALID_CITA_ID', record.id); }
            if (!Number.isInteger(source.duration) || source.duration < 1 || source.duration > 1440) add('LEGACY_DURATION_REQUIRES_REVIEW', record.id);
            if (source.revision !== undefined && (!Number.isSafeInteger(source.revision) || source.revision < 0)) add('INVALID_CITA_REVISION', record.id);
            for (const field of ['totalPrice', 'depositAmount', 'balanceDue']) {
                if (!own(source, field) || !Number.isSafeInteger(source[field]) || source[field] < 0) add('HISTORICAL_FINANCIAL_DATA_REQUIRED', record.id, { field });
            }
            let identity;
            try { identity = await catalog(tx, cleanInput(source), 'manual'); }
            catch (error) { add(error.code || 'LEGACY_INVALID_RECORD', record.id); }
            let booking;
            if (identity && Number.isInteger(source.duration) && source.duration > 0 && source.duration <= 1440) {
                const interval = { ...identity, duration: source.duration, endMs: identity.startMs + source.duration * 60000 };
                // No cambiar silenciosamente un identificador histórico ni sus permisos por UID.
                if (source.profId !== identity.profId) add('LEGACY_PROFESSIONAL_ID_REQUIRES_REVIEW', record.id);
                for (const field of ['startMs', 'endMs', 'professionalKey', 'timeZone']) {
                    if (own(source, field) && source[field] !== interval[field]) add('CITA_INTERVAL_MISMATCH', record.id, { field });
                }
                try { booking = historicalBooking(source, interval); } catch { /* Los campos faltantes ya se informaron individualmente. */ }
                records.push({ id: record.id, booking: interval, cancelled });
            }

            if (own(source, 'reservationId')) {
                let reservationId;
                try { reservationId = identifier(source.reservationId); } catch { add('INVALID_RESERVATION_REFERENCE', record.id); }
                if (reservationId) {
                    if (!references.has(reservationId)) references.set(reservationId, []);
                    references.get(reservationId).push(record.id);
                    const reservation = reservations.get(reservationId);
                    if (!reservation) add('RESERVATION_REFERENCE_NOT_FOUND', record.id);
                    else {
                        if ((reservation.sourceCitaId || reservationId) !== record.id) add('RESERVATION_CITA_MISMATCH', record.id);
                        const other = reservation.booking;
                        if (!other || !identity) add('RESERVATION_BOOKING_INVALID', record.id);
                        else {
                            if (other.profId !== source.profId || other.professionalKey !== identity.professionalKey || other.serviceId !== source.serviceId) add('RESERVATION_PROFESSIONAL_OR_SERVICE_MISMATCH', record.id);
                            try { if (dateString(other.date) !== dateString(source.date) || other.time !== source.time) add('RESERVATION_DATE_MISMATCH', record.id); }
                            catch { add('RESERVATION_DATE_MISMATCH', record.id); }
                            if (other.startMs !== identity.startMs || other.duration !== source.duration || other.endMs !== identity.startMs + source.duration * 60000) add('RESERVATION_INTERVAL_MISMATCH', record.id);
                            for (const field of ['totalPrice', 'depositAmount', 'balanceDue']) {
                                // Las reservas online/manuales actuales fijan el abono al crear la cita,
                                // no en booking. No inventar ni reescribir ese campo ausente.
                                if (field === 'depositAmount' && !own(other, field) && ['flow', 'manual'].includes(reservation.kind)) continue;
                                if (other[field] !== source[field]) add('RESERVATION_FINANCIAL_MISMATCH', record.id, { field });
                            }
                        }
                        if (cancelled ? reservation.status !== 'cancelled' : !['confirmed', 'blocked'].includes(reservation.status)) add('RESERVATION_STATUS_MISMATCH', record.id);
                    }
                }
            } else {
                if (reservations.has(record.id)) add('LEGACY_ID_COLLISION', record.id);
                if (booking && issues.length === startIssueCount) items.push({ id: record.id, booking, cancelled, source, revision: source.revision || 0 });
            }
        }
        for (const ids of references.values()) if (ids.length > 1) for (const id of ids) add('DUPLICATE_RESERVATION_REFERENCE', id);
        for (const [id, reservation] of reservations) {
            if (['confirmed', 'blocked'].includes(reservation.status) && !references.has(id)) add('ORPHAN_CONFIRMED_RESERVATION', id);
        }
        for (let a = 0; a < records.length; a++) for (let b = a + 1; b < records.length; b++) {
            if (!records[a].cancelled && !records[b].cancelled && records[a].booking.professionalKey === records[b].booking.professionalKey && overlaps(records[a].booking, records[b].booking)) {
                issues.push({ records: [hash(records[a].id), hash(records[b].id)], code: 'LEGACY_OVERLAP' });
            }
        }

        const entriesByReservation = new Map();
        for (const [id, lock] of locks) {
            if (lock.version !== 1 || !Array.isArray(lock.entries)) { add('INVALID_AGENDA_LOCK', id); continue; }
            const seen = new Set();
            if (lock.entries.length > 256) add('AGENDA_CAPACITY_REACHED', id);
            for (const entry of lock.entries) {
                if (!entry || typeof entry.reservationId !== 'string' || !Number.isFinite(entry.startMs) || !Number.isFinite(entry.endMs) || entry.startMs >= entry.endMs || entry.endMs - entry.startMs > 1440 * 60000
                    || !['held', 'confirmed'].includes(entry.state) || (entry.state === 'held' && !Number.isFinite(entry.expiresAtMs))) { add('INVALID_AGENDA_ENTRY', id); continue; }
                if (seen.has(entry.reservationId)) add('DUPLICATE_AGENDA_ENTRY', id);
                seen.add(entry.reservationId);
                const reservation = reservations.get(entry.reservationId);
                if (!reservation) add('ORPHAN_AGENDA_ENTRY', id);
                else {
                    const booking = reservation.booking;
                    try {
                        if (!booking || typeof booking.professionalKey !== 'string' || !Number.isFinite(booking.startMs) || !Number.isFinite(booking.endMs) || booking.startMs >= booking.endMs || booking.endMs - booking.startMs > 1440 * 60000
                            || entry.startMs !== booking.startMs || entry.endMs !== booking.endMs
                            || !days(booking).some(day => lockId(booking.professionalKey, day) === id)
                            || (entry.state === 'confirmed' ? !['confirmed', 'blocked'].includes(reservation.status) : reservation.status !== 'held' || entry.expiresAtMs !== reservation.expiresAtMs)) {
                            add('AGENDA_RESERVATION_MISMATCH', id);
                        }
                    } catch { add('AGENDA_RESERVATION_MISMATCH', id); }
                }
                if (!entriesByReservation.has(entry.reservationId)) entriesByReservation.set(entry.reservationId, []);
                entriesByReservation.get(entry.reservationId).push({ lockId: id, ...entry });
            }
            const occupied = lock.entries.filter(entry => entry && (entry.state === 'confirmed' || entry.expiresAtMs > now()));
            for (let a = 0; a < occupied.length; a++) for (let b = a + 1; b < occupied.length; b++) {
                if (occupied[a].reservationId !== occupied[b].reservationId && overlaps(occupied[a], occupied[b])) add('EXISTING_OCCUPANCY_OVERLAP', id);
            }
        }
        for (const record of records) {
            const source = history.docs.find(doc => doc.id === record.id).data();
            if (!own(source, 'reservationId') || typeof source.reservationId !== 'string') continue;
            const entries = entriesByReservation.get(source.reservationId) || [];
            const expected = record.cancelled ? [] : days(record.booking).map(day => lockId(record.booking.professionalKey, day));
            if (entries.length !== expected.length || expected.some(id => entries.filter(entry => entry.lockId === id && entry.state === 'confirmed'
                && entry.startMs === record.booking.startMs && entry.endMs === record.booking.endMs).length !== 1)) add('RESERVATION_OCCUPANCY_MISMATCH', record.id);
        }

        const plannedLocks = new Map();
        for (const item of items.filter(item => !item.cancelled)) {
            for (const day of days(item.booking)) {
                const id = lockId(item.booking.professionalKey, day);
                if (!plannedLocks.has(id)) plannedLocks.set(id, []);
                plannedLocks.get(id).push({ reservationId: item.id, startMs: item.booking.startMs, endMs: item.booking.endMs, state: 'confirmed', expiresAtMs: null });
            }
        }
        for (const [id, entries] of plannedLocks) {
            if (locks.has(id) && (!Array.isArray(locks.get(id).entries) || locks.get(id).entries.length)) add('MIGRATION_LEDGER_NOT_EMPTY', id);
            if (entries.length > 256) add('AGENDA_CAPACITY_REACHED', id);
        }
        if (items.length > 140) add('MIGRATION_RECORD_LIMIT_EXCEEDED');
        const writesPlanned = { reservations: items.length, appointments: items.length, locks: plannedLocks.size, control: 1 };
        if (2 * items.length + plannedLocks.size + 1 > 500) add('MIGRATION_WRITE_BUDGET_EXCEEDED');
        const plannedReservations = items.map(historicalReservation);
        let bytes = 0;
        for (const reservation of plannedReservations) {
            const size = Buffer.byteLength(JSON.stringify(reservation), 'utf8');
            bytes += size;
            if (size > 900000) add('MIGRATION_DOCUMENT_SIZE_LIMIT', reservation.id);
        }
        if (bytes + Buffer.byteLength(JSON.stringify([...plannedLocks]), 'utf8') > 8 * 1024 * 1024) add('MIGRATION_TRANSACTION_SIZE_LIMIT');
        const report = { scanned: history.docs.length, eligible: items.length, referenced: [...references.values()].reduce((sum, ids) => sum + ids.length, 0),
            issues, canApply: issues.length === 0, writesPlanned, planDigest: hash(JSON.stringify({ reservations: plannedReservations, locks: [...plannedLocks] })), applied: false };
        if (!apply) return report;
        if (!report.canApply) { const error = new Error('MIGRATION_REVIEW_REQUIRED'); error.report = report; throw error; }
        // La misma planificación y las mismas validaciones gobiernan diagnóstico y aplicación.
        for (const [id, entries] of plannedLocks) tx.set(ref('AgendaLocks', id), { entries, version: 1 });
        for (const reservation of plannedReservations) {
            const { id, ...data } = reservation;
            tx.create(ref('Reservas', id), { ...data, createdAtMs: now() });
            // No sobrescribir identificadores, importes, estados, fechas ni revisiones originales.
            const existing = items.find(item => item.id === id);
            const patch = { reservationId: id, professionalKey: data.booking.professionalKey, startMs: data.booking.startMs, endMs: data.booking.endMs, timeZone: 'America/Santiago' };
            if (!own(existing.source, 'revision')) patch.revision = 0;
            tx.update(ref('Citas', id), patch);
        }
        tx.set(ref('BookingConfig', 'control'), { ready: true, version: 1, migratedAtMs: now() });
        return { ...report, applied: true };
    }, apply ? undefined : { readOnly: true });
}
module.exports = { migrateBookings, historicalBooking, historicalReservation };

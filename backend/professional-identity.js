const validId = value => typeof value === 'string' && /^[\w-]{1,128}$/.test(value);
const emailOf = value => String(value || '').trim().toLowerCase();
function fail(code) { throw Object.assign(new Error(code), { code, status: 409 }); }

// La administradora confirma la vinculación; el UID se obtiene desde Auth en el servidor.
async function linkProfessional(db, auth, professionalId, actor) {
    if (actor?.role !== 'admin') throw Object.assign(new Error('FORBIDDEN'), { status: 403 });
    if (!validId(professionalId)) fail('INVALID_PROFESSIONAL');
    const ref = db.collection('Profesionales').doc(professionalId);
    const initial = await ref.get();
    if (!initial.exists || !emailOf(initial.data().email)) fail('PROFESSIONAL_EMAIL_REQUIRED');
    let account;
    try { account = await auth.getUserByEmail(emailOf(initial.data().email)); }
    catch (error) {
        if (error.code === 'auth/user-not-found') fail('STAFF_ACCOUNT_NOT_FOUND');
        throw error;
    }
    if (account.disabled || !validId(account.uid)) fail('STAFF_ACCOUNT_UNAVAILABLE');
    return db.runTransaction(async tx => {
        const current = await tx.get(ref);
        const user = await tx.get(db.collection('Usuarios').doc(account.uid));
        if (!current.exists || emailOf(current.data().email) !== emailOf(account.email)) fail('PROFESSIONAL_CHANGED');
        const person = current.data(), staff = user.exists ? user.data() : null;
        if (!staff || staff.activo === false || !['Admin', 'admin', 'profesional'].includes(staff.rol)
            || emailOf(staff.email) !== emailOf(account.email)) fail('STAFF_PROFILE_REQUIRED');
        if ((person.uid && person.uid !== account.uid) || (person.authUid && person.authUid !== account.uid)) fail('IDENTITY_CONFLICT');
        const professionalKey = person.professionalKey || person.uid || person.authUid || person.id || professionalId;
        if (!validId(professionalKey)) fail('INVALID_PROFESSIONAL');
        const aliases = [...new Set([professionalId, person.id, professionalKey, account.uid].filter(validId))];
        const changes = new Map();
        for (const alias of aliases) {
            if (alias !== professionalId && alias !== account.uid) {
                const owners = await tx.get(db.collection('Profesionales').where('id', '==', alias).limit(2));
                if (owners.docs.some(doc => doc.id !== professionalId)) fail('IDENTITY_CONFLICT');
            }
            for (const collection of ['Citas', 'Reservas', 'FichasClientas', 'FichasClinicas', 'Galeria']) {
                const field = collection === 'Reservas' ? 'booking.profId' : 'profId';
                const records = await tx.get(db.collection(collection).where(field, '==', alias).limit(101));
                if (records.docs.length > 100) fail('IDENTITY_REPAIR_TOO_LARGE');
                for (const doc of records.docs) {
                    const data = doc.data();
                    const assignedDoc = collection === 'Reservas' ? data.booking?.professionalDocId : data.professionalDocId;
                    if (assignedDoc && assignedDoc !== professionalId) fail('IDENTITY_CONFLICT');
                    if (collection === 'Reservas') {
                        if (data.booking?.profId !== account.uid) changes.set(collection + '/' + doc.id,
                            { ref: db.collection(collection).doc(doc.id), data: { booking: { ...data.booking, profId: account.uid } } });
                    } else if (data.profId !== account.uid) {
                        changes.set(collection + '/' + doc.id,
                            { ref: db.collection(collection).doc(doc.id), data: { profId: account.uid } });
                    }
                }
            }
        }
        if (changes.size > 400) fail('IDENTITY_REPAIR_TOO_LARGE');
        // Se conservan las claves de ocupación, fechas, pagos y referencias de las reservas.
        tx.update(ref, { uid: account.uid, professionalKey });
        for (const change of changes.values()) tx.update(change.ref, change.data);
        return { success: true, updated: changes.size };
    });
}
module.exports = { linkProfessional };

const { createHmac, randomBytes, randomInt, timingSafeEqual } = require('node:crypto');

const CODE_MS = 10 * 60000;
const SESSION_MS = 24 * 60 * 60000;
function fail(code, status = 400) { throw Object.assign(new Error(code), { code, status }); }
function createClientProfileService(db, { env = process.env, now = Date.now, sendCode, fetchImpl = fetch } = {}) {
    const secret = env.CLIENT_PROFILE_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) fail('CLIENT_ACCESS_NOT_CONFIGURED', 503);
    const digest = text => createHmac('sha256', secret).update(text).digest('hex');
    const ref = key => db.collection('perfil_cliente').doc('__access_' + key);
    const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length
        && timingSafeEqual(Buffer.from(a), Buffer.from(b));
    const parse = value => {
        if (typeof value !== 'string' || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(value)) fail('CLIENT_ACCESS_REQUIRED', 401);
        return value.split('.');
    };
    const configuredMail = ['EMAILJS_SERVICE_ID', 'EMAILJS_CLIENT_ACCESS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY']
        .every(key => typeof env[key] === 'string' && env[key].trim());
    const deliver = sendCode || (async (email, code) => {
        if (!configuredMail || env.LOCAL_FIREBASE_EMULATORS === '1') fail('CLIENT_ACCESS_NOT_CONFIGURED', 503);
        const response = await fetchImpl('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
            body: JSON.stringify({ service_id: env.EMAILJS_SERVICE_ID.trim(), template_id: env.EMAILJS_CLIENT_ACCESS_TEMPLATE_ID.trim(),
                user_id: env.EMAILJS_PUBLIC_KEY.trim(), accessToken: env.EMAILJS_PRIVATE_KEY.trim(),
                template_params: { to_email: email, code, expires_minutes: 10 } })
        });
        if (!response.ok) {
            console.warn('[ClientAccess]', { code: response.status >= 500 ? 'EMAIL_PROVIDER_UNAVAILABLE' : 'EMAIL_PROVIDER_REJECTED', providerHttpStatus: response.status });
            throw Object.assign(new Error('CLIENT_CODE_DELIVERY_FAILED'), { code: 'CLIENT_CODE_DELIVERY_FAILED', status: 503, deliveryRejected: response.status < 500 });
        }
    });
    async function requestCode(rawEmail, address) {
        if (!sendCode && (!configuredMail || env.LOCAL_FIREBASE_EMULATORS === '1')) fail('CLIENT_ACCESS_NOT_CONFIGURED', 503);
        if (typeof rawEmail !== 'string' || rawEmail.length > 254) fail('INVALID_CLIENT_EMAIL');
        const email = rawEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('INVALID_CLIENT_EMAIL');
        const key = digest('email:' + email), nonce = randomBytes(32).toString('hex');
        const code = String(randomInt(1000000)).padStart(6, '0');
        const time = now(), hour = Math.floor(time / 3600000);
        const globalRef = ref('global'), ipRef = ref('ip_' + digest(String(address || 'unknown'))), profileRef = ref(key);
        const recovered = await db.runTransaction(async tx => {
            const [profile, global, ip] = await Promise.all([tx.get(profileRef), tx.get(globalRef), tx.get(ipRef)]);
            const old = profile.exists ? profile.data() : {};
            // Recuperar el mismo código si se perdió la respuesta; nunca reenviar en paralelo.
            if (old.codeHash && old.codeExpiresMs > time && old.attempts < 5 && time - old.lastSentMs < 60000
                && ['sending', 'unconfirmed'].includes(old.deliveryState)) return { nonce: old.nonce, expiresIn: Math.floor((old.codeExpiresMs - time) / 1000) };
            const globalCount = global.exists && global.data().hour === hour ? global.data().count : 0;
            const ipCount = ip.exists && ip.data().hour === hour ? ip.data().count : 0;
            const count = old.hour === hour ? old.count : 0;
            if ((old.lastSentMs !== undefined && time - old.lastSentMs < 60000) || count >= 3 || ipCount >= 10 || globalCount >= 100) fail('CLIENT_CODE_RATE_LIMIT', 429);
            tx.set(profileRef, { ...old, email, queryEmails: [...new Set([email, rawEmail.trim(), ...(old.queryEmails || [])])].slice(0, 8),
                nonce, codeHash: digest(nonce + ':' + code), attempts: 0,
                codeExpiresMs: time + CODE_MS, lastSentMs: time, deliveryState: 'sending', hour, count: count + 1 });
            tx.set(globalRef, { hour, count: globalCount + 1 });
            tx.set(ipRef, { hour, count: ipCount + 1 });
        });
        if (recovered) return { challenge: key + '.' + recovered.nonce, expiresIn: recovered.expiresIn, delivery: 'unconfirmed' };
        let delivery = 'sent';
        try { await deliver(email, code); }
        catch (error) {
            delivery = error.deliveryRejected === true ? 'rejected' : 'unconfirmed';
            if (delivery === 'unconfirmed') console.warn('[ClientAccess]', { code: 'EMAIL_DELIVERY_UNCONFIRMED' });
        }
        try {
            await db.runTransaction(async tx => {
                const saved = await tx.get(profileRef);
                if (saved.exists && saved.data().nonce === nonce) tx.update(profileRef, { deliveryState: delivery });
            });
        } catch (_) { console.warn('[ClientAccess]', { code: 'EMAIL_DELIVERY_STATE_NOT_SAVED' }); }
        if (delivery === 'rejected') fail('CLIENT_CODE_DELIVERY_FAILED', 503);
        return { challenge: key + '.' + nonce, expiresIn: CODE_MS / 1000, delivery };
    }
    async function verifyCode(challenge, code) {
        const [key, nonce] = parse(challenge);
        if (typeof code !== 'string' || !/^\d{6}$/.test(code)) fail('INVALID_CLIENT_CODE');
        const token = randomBytes(32).toString('hex'), time = now();
        const result = await db.runTransaction(async tx => {
            const profile = await tx.get(ref(key));
            const data = profile.exists ? profile.data() : {};
            if (data.nonce !== nonce || !data.codeHash || data.codeExpiresMs <= time || data.attempts >= 5) return false;
            if (!equal(data.codeHash, digest(nonce + ':' + code))) {
                tx.update(ref(key), { attempts: data.attempts + 1 });
                return false;
            }
            const sessions = (data.sessions || []).filter(s => s.expiresMs > time).slice(-4);
            sessions.push({ hash: digest(token), nonce, expiresMs: time + SESSION_MS });
            tx.update(ref(key), { codeHash: null, codeExpiresMs: 0, sessions });
            return true;
        });
        if (!result) fail('INVALID_CLIENT_CODE', 401);
        return { token: key + '.' + token, expiresIn: SESSION_MS / 1000 };
    }
    async function appointments(session) {
        const [key, token] = parse(session);
        const snap = await ref(key).get();
        const data = snap.exists ? snap.data() : {};
        const access = (data.sessions || []).find(s => s.expiresMs > now() && equal(s.hash, digest(token)));
        if (!access) fail('CLIENT_ACCESS_REQUIRED', 401);
        // El correo procede de la verificación del servidor, nunca del navegador.
        const emails = [...new Set([data.email, ...(data.queryEmails || [])])]
            .filter(email => typeof email === 'string' && email.toLowerCase() === data.email).slice(0, 8);
        const snapshots = await Promise.all(emails.map(email => db.collection('Citas').where('clientEmail', '==', email).get()));
        const rows = [...new Map(snapshots.flatMap(snapshot => snapshot.docs).map(doc => [doc.id, doc])).values()];
        const fields = ['servicio', 'date', 'time', 'profesional', 'status', 'duration', 'paymentStatus', 'totalPrice', 'depositAmount', 'balanceDue'];
        return { email: data.email, expiresAtMs: access.expiresMs, appointments: rows.map(doc => {
            const source = doc.data(), row = { id: doc.id };
            for (const field of fields) if (source[field] !== undefined) row[field] = source[field];
            return row;
        }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.time || '').localeCompare(String(a.time || '')) ) };
    }
    async function logout(session, challenge) {
        const access = session ? parse(session) : null;
        const pending = challenge ? parse(challenge) : null;
        const keys = [...new Set([access?.[0], pending?.[0]].filter(Boolean))];
        await db.runTransaction(async tx => {
            const records = await Promise.all(keys.map(key => tx.get(ref(key))));
            records.forEach((saved, index) => {
                if (!saved.exists) return;
                const key = keys[index], data = saved.data();
                const update = { sessions: (data.sessions || []).filter(s => !(access?.[0] === key && equal(s.hash, digest(access[1])))
                    && !(pending?.[0] === key && s.nonce === pending[1])) };
                if (pending?.[0] === key && data.nonce === pending[1]) Object.assign(update, { codeHash: null, codeExpiresMs: 0 });
                tx.update(ref(key), update);
            });
        });
    }
    return { requestCode, verifyCode, appointments, logout };
}
module.exports = { createClientProfileService };

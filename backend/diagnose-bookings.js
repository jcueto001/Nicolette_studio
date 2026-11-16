// Diagnóstico exclusivamente de lectura. No importa server.js ni habilita la agenda.
const { createHash } = require('node:crypto');
const { createBookingService } = require('./booking-service');
function blocked(code) { throw Object.assign(new Error(code), { code }); }

function configuration(args, env) {
    if (args.length !== 3 || args[0] !== '--read-only' || args[1] !== '--project') blocked('READ_ONLY_ARGUMENTS_REQUIRED');
    const projectId = args[2];
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) || projectId.startsWith('demo-')) blocked('INVALID_PRODUCTION_PROJECT');
    if (env.LOCAL_FIREBASE_EMULATORS || env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST || env.VERCEL) blocked('LOCAL_OR_HOSTED_ENVIRONMENT_REJECTED');
    if (projectId !== env.FIREBASE_PROJECT_ID) blocked('PROJECT_MISMATCH');
    const clientEmail = (env.FIREBASE_CLIENT_EMAIL || '').trim();
    const privateKey = (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
    if (!clientEmail || !privateKey) blocked('FIREBASE_ADMIN_NOT_CONFIGURED');
    return { projectId, clientEmail, privateKey };
}

// El planificador solo recibe consultas, snapshots sin referencias y tx.get.
// Los límites contienen el coste y las lecturas de catálogo repetidas se reutilizan.
function readOnlyDatabase(db, { maxRecords = 200, readBudget = 1000, review } = {}) {
    const allowed = new Set(['Citas', 'FlowTransactions', 'FlowOrders', 'FinancialConflicts', 'Reservas', 'AgendaLocks', 'BookingConfig', 'Servicios', 'Profesionales', 'Usuarios']);
    const references = new WeakMap();
    const stats = { readBudgetUnits: 0, writeAttempts: 0 };
    const snapshot = original => {
        if (Array.isArray(original.docs)) {
            if (original.docs.length > maxRecords) blocked('READ_BUDGET_EXCEEDED');
            const docs = original.docs.map(snapshot);
            return Object.freeze({ docs: Object.freeze(docs), empty: docs.length === 0, forEach: callback => docs.forEach(callback) });
        }
        const data = original.exists ? original.data() : undefined;
        return Object.freeze({ id: original.id, exists: original.exists, data: () => data });
    };
    const deny = () => { stats.writeAttempts++; blocked('WRITE_FORBIDDEN'); };
    function wrap(original, key, query = false, cap = maxRecords + 1) {
        const wrapper = query ? {
            doc: id => wrap(original.doc(id), key + '/' + id),
            where: (field, op, value) => wrap(original.where(field, op, value), key + ':' + JSON.stringify([field, op, value]), true, cap),
            limit: count => wrap(original.limit(Math.min(count, cap)), key + ':limit:' + count, true, Math.min(count, cap))
        } : {};
        Object.assign(wrapper, { create: deny, set: deny, update: deny, delete: deny });
        references.set(wrapper, { original, key, query, cap });
        return Object.freeze(wrapper);
    }
    const facade = Object.freeze({
        collection: name => {
            if (!allowed.has(name)) blocked('COLLECTION_NOT_ALLOWED');
            return wrap(db.collection(name), name, true);
        },
        runTransaction: callback => db.runTransaction(async transaction => {
            const cache = new Map();
            const tx = Object.freeze({ get: async reference => {
                const target = references.get(reference);
                if (!target) blocked('INVALID_READ_REFERENCE');
                if (cache.has(target.key)) return cache.get(target.key);
                if (stats.readBudgetUnits >= readBudget) blocked('READ_BUDGET_EXCEEDED');
                const original = await transaction.get(target.query ? target.original.limit(Math.min(target.cap, readBudget - stats.readBudgetUnits + 1)) : target.original);
                stats.readBudgetUnits += Array.isArray(original.docs) ? Math.max(1, original.docs.length) : 1;
                if (stats.readBudgetUnits > readBudget) blocked('READ_BUDGET_EXCEEDED');
                const value = snapshot(original);
                cache.set(target.key, value); return value;
            }, create: deny, set: deny, update: deny, delete: deny });
            const report = await callback(tx);
            return review ? review(report, tx, facade.collection) : report;
        }, { readOnly: true })
    });
    return { db: facade, stats };
}

async function diagnose(db, options) {
    const readonly = readOnlyDatabase(db, { ...options, review: async (report, tx, collection) => {
        const add = (code, id) => report.issues.push({ code, record: createHash('sha256').update(id).digest('hex') });
        const orders = await tx.get(collection('FlowOrders'));
        for (const order of orders.docs) {
            const data = order.data();
            if (!data.paid || data.status === 'paid_conflict' || data.result?.conflict) add('PAYMENT_RECONCILIATION_REQUIRED', order.id);
        }
        const financial = await tx.get(collection('FinancialConflicts'));
        for (const conflict of financial.docs) add('FINANCIAL_CONFLICT_REQUIRES_REVIEW', conflict.id);
        const reservations = await tx.get(collection('Reservas'));
        for (const reservation of reservations.docs) {
            if (reservation.data().status === 'held') add('RETENTION_RECONCILIATION_REQUIRED', reservation.id);
        }
        const citas = await tx.get(collection('Citas'));
        const uids = new Set(citas.docs.map(doc => doc.data().profId).filter(id => typeof id === 'string' && /^[\w-]{1,128}$/.test(id)));
        for (const uid of uids) {
            const user = await tx.get(collection('Usuarios').doc(uid));
            if (!user.exists || user.data().activo === false || !['Admin', 'admin', 'profesional'].includes(user.data().rol)) add('STAFF_UID_REQUIRES_REVIEW', uid);
        }
        report.canApply = report.issues.length === 0;
        return report;
    } });
    const report = await createBookingService(readonly.db).migrate({ apply: false });
    const issueCounts = {};
    for (const issue of report.issues) issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    return { ...report, issueCounts, ...readonly.stats, readOnly: true, productionWriteAuthorized: false };
}

async function main(args = process.argv.slice(2), env = process.env) {
    let app, db;
    try {
        const config = configuration(args, env);
        const { cert, initializeApp } = require('firebase-admin/app');
        app = initializeApp({ projectId: config.projectId, credential: cert(config) }, 'booking-diagnostic-readonly');
        db = require('firebase-admin/firestore').getFirestore(app);
        db.settings({ host: 'firestore.googleapis.com', ssl: true });
        const report = await diagnose(db);
        console.log(JSON.stringify({ projectId: config.projectId, ...report }));
        process.exitCode = report.canApply ? 0 : 2;
    } catch (error) {
        // No imprimir mensajes del SDK, documentos, correos ni claves.
        const safe = new Set(['READ_ONLY_ARGUMENTS_REQUIRED', 'INVALID_PRODUCTION_PROJECT', 'LOCAL_OR_HOSTED_ENVIRONMENT_REJECTED',
            'PROJECT_MISMATCH', 'FIREBASE_ADMIN_NOT_CONFIGURED', 'READ_BUDGET_EXCEEDED', 'WRITE_FORBIDDEN', 'COLLECTION_NOT_ALLOWED']);
        console.error(JSON.stringify({ error: safe.has(error.code) ? error.code : 'READ_ONLY_DIAGNOSIS_FAILED', readOnly: true, applied: false }));
        process.exitCode = 1;
    } finally {
        if (db) await db.terminate().catch(() => {});
        if (app) await require('firebase-admin/app').deleteApp(app).catch(() => {});
    }
}
if (require.main === module) main();
module.exports = { configuration, readOnlyDatabase, diagnose };

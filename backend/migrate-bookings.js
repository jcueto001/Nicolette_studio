// Solo preparación/ensayo local. No hay un modo de ejecución contra producción.
if (process.env.LOCAL_FIREBASE_EMULATORS !== '1' || process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.error('Migración bloqueada: requiere emuladores locales y demo-nicolett.');
    process.exitCode = 1;
} else {
    const mode = require('./firebase-emulators')(process.env);
    const { getApps, initializeApp, deleteApp } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const { createBookingService } = require('./booking-service');
    (async () => {
        let db;
        try {
            await mode.assertAvailable();
            db = mode.database({ getApps, initializeApp, getFirestore });
            const report = await createBookingService(db).migrate({ apply: process.argv.includes('--apply-local') });
            console.log(JSON.stringify(report));
            if (!report.canApply) process.exitCode = 2;
        } catch (error) {
            console.error(JSON.stringify(error.report || { error: error.code || 'MIGRATION_BLOCKED' }));
            process.exitCode = 1;
        } finally {
            if (db) await db.terminate();
            for (const app of getApps().filter(item => item.name === 'nicolett-local-emulators')) await deleteApp(app);
        }
    })();
}

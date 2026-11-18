function staffAuth({ database, auth, log = console.warn }) {
    return async function requireStaff(req, res, next) {
        const match = /^Bearer (.+)$/.exec(req.get('Authorization') || '');
        if (!match) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        let db, user;
        try {
            db = database();
            user = await auth().verifyIdToken(match[1], true);
        } catch (error) {
            const codes = {
                'auth/id-token-expired': 'AUTH_EXPIRED',
                'auth/id-token-revoked': 'AUTH_REVOKED',
                'auth/argument-error': 'AUTH_INVALID',
                'auth/invalid-id-token': 'AUTH_INVALID',
                'auth/user-disabled': 'AUTH_REVOKED',
                'auth/user-not-found': 'AUTH_REVOKED'
            };
            if (codes[error.code]) return res.status(401).json({ error: codes[error.code] });
            const code = error.message === 'FIREBASE_ADMIN_NOT_CONFIGURED'
                ? 'FIREBASE_ADMIN_NOT_CONFIGURED' : 'STAFF_AUTH_UNAVAILABLE';
            log('[StaffAuth]', { code, cause: String(error.code || 'unknown') });
            return res.status(503).json({ error: code });
        }
        try {
            const record = await db.collection('Usuarios').doc(user.uid).get();
            const data = record.exists ? record.data() : null;
            if (!data || data.activo === false || !['Admin', 'admin', 'profesional'].includes(data.rol)) {
                return res.status(403).json({ error: 'STAFF_ROLE_REQUIRED' });
            }
            req.staff = { uid: user.uid, role: data.rol.toLowerCase() };
        } catch (error) {
            log('[StaffAuth]', { code: 'STAFF_DATABASE_UNAVAILABLE', cause: String(error.code || 'unknown') });
            return res.status(503).json({ error: 'STAFF_DATABASE_UNAVAILABLE' });
        }
        next();
    };
}
module.exports = { staffAuth };

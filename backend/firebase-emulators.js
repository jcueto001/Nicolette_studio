const net = require('node:net');

module.exports = function createEmulatorMode(env) {
    const enabled = env.LOCAL_FIREBASE_EMULATORS === '1';
    const hosted = !!env.VERCEL || env.NODE_ENV === 'production';
    if (enabled && hosted) throw new Error('El modo de emuladores está prohibido en producción.');
    if (!enabled && (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST)) {
        throw new Error('Activa explícitamente LOCAL_FIREBASE_EMULATORS para usar emuladores.');
    }
    let ports = { auth: 9099, firestore: 8080 };
    if (enabled) {
        const firestore = env.FIRESTORE_EMULATOR_HOST;
        const auth = env.FIREBASE_AUTH_EMULATOR_HOST;
        if (firestore !== undefined || auth !== undefined) {
            if (typeof firestore !== 'string' || typeof auth !== 'string') throw new Error('Configura ambos emuladores locales.');
            const match = (value, allowed) => {
                const result = /^(?:127\.0\.0\.1|localhost):(\d+)$/.exec(value);
                if (!result || !allowed.includes(Number(result[1]))) throw new Error('Host o puerto de emulador no permitido.');
                return Number(result[1]);
            };
            ports = { auth: match(auth, [9099, 9199]), firestore: match(firestore, [8080, 8180]) };
            if ((ports.auth === 9199) !== (ports.firestore === 8180)) throw new Error('No mezcles los dos entornos locales.');
        }
        env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:' + ports.firestore;
        env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:' + ports.auth;
        env.GCLOUD_PROJECT = 'demo-nicolett';
        env.GOOGLE_CLOUD_PROJECT = 'demo-nicolett';
        // El SDK no debe intentar descubrir credenciales vía metadatos remotos.
        env.METADATA_SERVER_DETECTION = 'none';
        // No leer archivos de credenciales ni reutilizar claves Flow en este modo.
        delete env.GOOGLE_APPLICATION_CREDENTIALS;
        env.FLOW_API_KEY = '';
        env.FLOW_SECRET_KEY = '';
    }
    async function assertAvailable() {
        if (!enabled) return;
        await Promise.all([ports.auth, ports.firestore].map(port => new Promise((resolve, reject) => {
            const socket = net.createConnection({ host: '127.0.0.1', port });
            const fail = () => { socket.destroy(); reject(new Error('Auth y Firestore Emulator deben estar disponibles.')); };
            socket.setTimeout(1000);
            socket.once('error', fail);
            socket.once('timeout', fail);
            socket.once('connect', () => { socket.destroy(); resolve(); });
        })));
    }
    function database({ getApps, initializeApp, getFirestore }) {
        const name = appName;
        const existing = getApps().find(item => item.name === name);
        const app = existing
            || initializeApp({ projectId: 'demo-nicolett' }, name);
        const db = getFirestore(app);
        if (!existing && typeof db.settings === 'function') db.settings({ host: '127.0.0.1:' + ports.firestore, ssl: false });
        return db;
    }
    const appName = ports.firestore === 8180 ? 'nicolett-local-emulators-8180' : 'nicolett-local-emulators';
    return { enabled, assertAvailable, database, ports, appName };
};

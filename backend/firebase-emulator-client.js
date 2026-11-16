// Este archivo reemplaza firebase-config.js solo en el servidor local explícito.
// No contiene ni carga la configuración productiva.
const db = (() => {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
        throw new Error('La configuración de emuladores requiere localhost.');
    }
    if (firebase.apps.length) throw new Error('Firebase ya inicializado: aislamiento local no garantizado.');
    const ports = /* EMULATOR_PORTS */ { auth: 9099, firestore: 8080 };
    if (!((ports.auth === 9099 && ports.firestore === 8080) || (ports.auth === 9199 && ports.firestore === 8180))) {
        throw new Error('Configuración local incompleta o no permitida.');
    }
    const initialize = firebase.initializeApp.bind(firebase);
    const options = { apiKey: 'demo-nicolett-local-only', projectId: 'demo-nicolett',
        authDomain: 'demo-nicolett.firebaseapp.com', appId: 'demo-nicolett-local' };
    // Incluye las apps secundarias utilizadas para crear personal.
    firebase.initializeApp = function (config, name) {
        if (config?.projectId !== 'demo-nicolett') throw new Error('Proyecto no permitido en pruebas locales.');
        const app = initialize(options, name);
        app.auth().useEmulator('http://127.0.0.1:' + ports.auth);
        app.firestore().useEmulator('127.0.0.1', ports.firestore);
        return app;
    };
    return firebase.initializeApp(options).firestore();
})();

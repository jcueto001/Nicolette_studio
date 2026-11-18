const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}
function snapshot(records) {
    const docs = records.map(data => ({ id: data.id, data: () => data }));
    return { docs, empty: !docs.length, forEach: callback => docs.forEach(callback) };
}
function fixture() {
    const local = new Map(); const session = new Map();
    const store = map => ({ getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
    const state = { user: { uid: 'admin' }, role: 'admin', read: null, write: null, roleListener: null, calls: [], appointmentListeners: [] };
    const db = { collection: collection => {
        const query = filters => ({
            where: (field, op, value) => query([...filters, [field, value]]),
            onSnapshot: (next, error) => {
                const listener = { collection, filters, next, error, stopped: false };
                state.appointmentListeners.push(listener);
                return () => { listener.stopped = true; };
            },
            get: async options => {
                state.calls.push({ collection, filters, options });
                if (state.read) {
                    const result = await state.read(collection);
                    if (result) return result;
                }
                const data = ['Citas', 'FichasClientas'].includes(collection)
                    ? [{ id: 'admin-record', profId: 'admin' }, { id: 'worker-record', profId: 'worker' }]
                    : collection === 'Inventario' ? [{ id: 'stock' }] : [];
                return snapshot(data.filter(row => filters.every(([field, value]) => row[field] === value)));
            },
            doc: id => ({
                get: async () => {
                    if (collection === 'Citas') return { exists: !!state.appointment, data: () => state.appointment };
                    if (state.read) await state.read('Usuarios');
                    return { exists: true, data: () => ({ rol: state.role, nombre: 'Synthetic' }) };
                },
                onSnapshot: callback => { state.roleListener = callback; return () => { state.roleListener = null; }; },
                set: async () => state.write ? state.write(collection) : undefined,
                update: async () => state.write ? state.write(collection) : undefined,
                delete: async () => state.write ? state.write(collection) : undefined
            }),
            add: async data => {
                state.lastAdded = { collection, data };
                if (state.write) await state.write(collection);
                return { id: 'synthetic-created' };
            }
        });
        return query([]);
    } };
    const firestore = () => db;
    firestore.FieldValue = { serverTimestamp: () => 'synthetic-time' };
    const context = { crypto, URLSearchParams, console: { log() {}, warn() {}, error() {} }, db,
        window: { location: { origin: 'http://localhost' } },
        localStorage: store(local), sessionStorage: store(session),
        firebase: { auth: () => ({ currentUser: state.user }), firestore } };
    const source = fs.readFileSync(path.join(__dirname, '../js/mockData.js'), 'utf8')
        .replace('StorageHelper.init();', 'globalThis.helper = StorageHelper;');
    vm.runInNewContext(source, context);
    const helper = context.helper;
    helper._bookingApi = async (url, method, body, stamp) => {
        assert.equal(url, '/api/fichas'); assert.equal(method, 'POST');
        state.apiBody = structuredClone(body);
        if (state.write) await state.write('FichasClientas');
        helper._assertSessionCurrent(stamp);
        return { ficha: { ...body.ficha, id: 'synthetic-created', profId: state.user.uid }, stocks: [] };
    };
    const login = async (uid = 'admin', role = 'admin') => {
        state.user = { uid }; state.role = role;
        await helper.resolveStaffUser(state.user);
        helper.setAuth({ loggedIn: true });
    };
    return { helper, state, local, session, login, context };
}

test('Retorno Flow conserva solo comprobante durante arranque y primer Auth; logout lo elimina', async () => {
    const f = fixture();
    f.context.window.location.search = '?action=flow-success&token=synthetic_token_123';
    const receipt = 'a'.repeat(64);
    f.session.set('nicolett_flow_receipt', receipt);
    f.session.set('nicolett_pending_booking', 'PRIVATE');
    f.local.set('nicolett_pending_booking', 'PRIVATE');
    f.helper._clearPrivateData({ preservePaymentReturn: true });
    assert.equal(f.session.get('nicolett_flow_receipt'), receipt);
    assert.equal(f.session.has('nicolett_pending_booking'), false);
    assert.equal(f.local.has('nicolett_pending_booking'), false);
    f.state.user = null; // Firebase todavía no ha restaurado currentUser.
    f.helper.getAuth();
    assert.equal(f.helper._hasObservedAuth, false);
    await f.login();
    assert.equal(f.session.get('nicolett_flow_receipt'), receipt);
    f.helper.setAuth({ loggedIn: false });
    assert.equal(f.session.has('nicolett_flow_receipt'), false);
    f.helper.getAuth();
    assert.equal(f.session.has('nicolett_flow_receipt'), false);
});

test('Arranque normal y cambio de usuario no conservan comprobantes de otra sesión', async () => {
    const f = fixture();
    f.session.set('nicolett_flow_receipt', 'a'.repeat(64));
    f.helper._clearPrivateData({ preservePaymentReturn: true });
    assert.equal(f.session.has('nicolett_flow_receipt'), false);
    await f.login();
    f.context.window.location.search = '?action=flow-success&token=synthetic_token_123';
    f.session.set('nicolett_flow_receipt', 'a'.repeat(64));
    f.state.user = { uid: 'worker' };
    f.helper.getAuth();
    assert.equal(f.session.has('nicolett_flow_receipt'), false);
});

test('saveFicha usa backend e identificador estable, nunca escritura directa ni descuento antiguo', async () => {
    const f = fixture(); await f.login('worker', 'profesional');
    const ficha = { appointmentId: 'assigned', profId: 'forged', products: [{ id: 'p', quantity: 2 }] };
    await f.helper.saveFicha(ficha);
    const requestId = f.state.apiBody.requestId;
    await f.helper.saveFicha(ficha);
    assert.equal(f.state.apiBody.requestId, requestId);
    assert.equal(f.state.apiBody.ficha.appointmentId, 'assigned');
    assert.equal(ficha.profId, 'worker');
    assert.equal(f.state.lastAdded, undefined);
    await assert.rejects(f.helper.updateProductStock('p', 1));
});

test('Profesional publica solo aportes propios pendientes y no puede aprobar', async () => {
    const f = fixture(); await f.login('worker', 'profesional');
    await f.helper.addGalleryImage({ src: 'synthetic', source: 'admin', profId: 'forged', approved: true });
    const image = f.state.lastAdded.data;
    assert.equal(image.profId, 'worker'); assert.equal(image.source, 'worker');
    assert.equal(image.approved, false); assert.equal(image.status, 'pending');
    await assert.rejects(f.helper.setGalleryImageApproval('synthetic-created', true));
    await f.helper.loadAppointmentsCache();
    const reads = f.state.calls.filter(call => call.collection === 'Galeria');
    assert.ok(reads.every(call => call.filters.length === 1));
    assert.ok(reads.some(call => call.filters[0][0] === 'profId' && call.filters[0][1] === 'worker'));
});

test('Admin carga datos; logout vacía getters, memoria y almacenamiento privado', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    assert.equal(f.helper.getAppointments().length, 2);
    assert.equal(f.helper.getFichas().length, 2);
    f.helper.saveClients([{ id: 'synthetic-client' }]);
    for (const key of ['nicolett_user', 'nicolett_personalization', 'nicolett_gallery_v2', 'nicolett_appointments']) f.local.set(key, 'private');
    f.session.set('nicolett_pending_booking', 'private');
    f.helper.setAuth({ loggedIn: false });
    for (const getter of ['getAppointments', 'getFichas', 'getClients', 'getInventory']) assert.equal(f.helper[getter]().length, 0);
    assert.equal(Object.keys(f.helper.getUser()).length, 0);
    for (const value of f.local.values()) assert.notEqual(value, 'private');
    assert.equal(f.session.has('nicolett_pending_booking'), false);
});

test('Nueva profesional recibe exclusivamente datos de su UID y nunca CRM anterior', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    f.helper.saveClients([{ id: 'admin-client' }]);
    f.helper.setAuth({ loggedIn: false });
    await f.login('worker', 'profesional');
    assert.equal(f.helper.getAppointments().length, 0);
    assert.equal(f.helper.getClients().length, 0);
    await f.helper.loadAppointmentsCache();
    assert.equal(f.helper.getAppointments().length, 1);
    assert.equal(f.helper.getAppointments()[0].profId, 'worker');
    assert.equal(f.helper.getFichas()[0].profId, 'worker');
    assert.ok(f.state.calls.filter(call => call.collection === 'Citas').at(-1).filters.some(([key, value]) => key === 'profId' && value === 'worker'));
});

test('Eliminar profesional usa ID del documento y actualiza ambas cachés tras confirmación', async () => {
    const f = fixture(); await f.login();
    f.state.read = async collection => collection === 'Profesionales' ? {
        forEach: callback => callback({ id: 'document-id', data: () => ({ id: 'old-id', name: 'Ana' }) })
    } : null;
    await f.helper.loadAppointmentsCache();
    assert.equal(f.helper.getProfessionals()[0].id, 'document-id');
    let deleted;
    const collection = f.context.db.collection;
    f.context.db.collection = name => name === 'Profesionales'
        ? { doc: id => ({ delete: async () => { deleted = id; } }) } : collection(name);
    await f.helper.deleteProfessional('document-id');
    assert.equal(deleted, 'document-id');
    assert.equal(f.helper.getProfessionals().length, 0);
    assert.equal(f.local.get('nicolett_professionals_cache'), '[]');
    assert.equal(f.local.get('nicolett_local_professionals'), '[]');
});

test('Borrado fallido no oculta la profesional ni devuelve éxito', async () => {
    const f = fixture(); await f.login();
    f.helper._professionalsCache = [{ id: 'worker', name: 'Ana' }];
    f.state.write = async () => { throw new Error('network unavailable'); };
    await assert.rejects(f.helper.deleteProfessional('worker'), /network unavailable/);
    assert.equal(f.helper.getProfessionals().length, 1);
});

test('UID cambiado antes del callback de Auth invalida getters', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    f.state.user = { uid: 'worker' };
    assert.equal(f.helper.getFichas().length, 0);
    assert.equal(f.helper.getAppointments().length, 0);
});

test('Permiso denegado borra datos; servicios, categorías y perfiles permanecen', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    const services = f.helper.getServices(); const categories = f.helper.getCategories(); const profiles = f.helper.getProfiles();
    f.local.set('nicolett_services_cache', 'public-services');
    f.local.set('nicolett_categories_cache', 'public-categories');
    f.local.set('nicolett_profiles_cache', 'public-profiles');
    f.state.read = async collection => { if (collection === 'Citas') throw { code: 'permission-denied' }; };
    await f.helper.loadAppointmentsCache();
    assert.equal(f.helper.getAppointments().length, 0); assert.equal(f.helper.getFichas().length, 0);
    f.helper.setAuth({ loggedIn: false });
    assert.equal(f.helper.getServices(), services); assert.equal(f.helper.getCategories(), categories); assert.equal(f.helper.getProfiles(), profiles);
    assert.equal(f.local.get('nicolett_services_cache'), 'public-services');
    assert.equal(f.local.get('nicolett_categories_cache'), 'public-categories');
    assert.equal(f.local.get('nicolett_profiles_cache'), 'public-profiles');
});

test('Lectura tardía de admin no repuebla cachés tras cambio de usuario', async () => {
    const f = fixture(); await f.login();
    const pending = deferred(); let started;
    const began = new Promise(resolve => { started = resolve; });
    f.state.read = async collection => { if (collection === 'Citas') { started(); return pending.promise; } };
    const load = f.helper.loadAppointmentsCache(); await began;
    f.helper.setAuth({ loggedIn: false }); f.state.read = null;
    await f.login('worker', 'profesional'); await f.helper.loadAppointmentsCache();
    pending.resolve(snapshot([{ id: 'late-admin', profId: 'admin' }])); await load;
    assert.equal(f.helper.getAppointments().length, 1);
    assert.equal(f.helper.getAppointments()[0].profId, 'worker');
});

test('Escritura tardía y error de permisos no activan fallback privado', async () => {
    const f = fixture(); await f.login();
    const pending = deferred(); f.state.write = () => pending.promise;
    const write = f.helper.saveFicha({ clientName: 'Synthetic' });
    f.helper.setAuth({ loggedIn: false }); await f.login('worker', 'profesional');
    pending.resolve(); await assert.rejects(write, { code: 'session-changed' });
    assert.equal(f.helper.getFichas().length, 0);
    f.state.write = async () => { throw { code: 'permission-denied' }; };
    await assert.rejects(f.helper.saveFicha({ clientName: 'Synthetic' }));
    assert.equal(f.helper.getFichas().length, 0);
});

test('Cambio de rol invalida inmediatamente registros anteriores', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    f.state.role = 'profesional';
    f.state.roleListener({ exists: true, data: () => ({ rol: 'profesional' }) });
    assert.equal(f.helper.getAppointments().length, 0);
    assert.equal(f.helper.getFichas().length, 0);
});

test('Resolución de rol tardía no restaura una sesión cerrada', async () => {
    const f = fixture(); const pending = deferred();
    f.state.read = async collection => { if (collection === 'Usuarios') await pending.promise; };
    const login = f.helper.resolveStaffUser(f.state.user);
    f.helper.setAuth({ loggedIn: false }); pending.resolve();
    await assert.rejects(login, /Sesión cambiada/);
    assert.equal(f.helper.getAuth().loggedIn, false);
});

test('Login y callback Auth simultáneos del mismo UID no se invalidan', async () => {
    const f = fixture(); const pending = deferred();
    f.state.read = async collection => { if (collection === 'Usuarios') await pending.promise; };
    const first = f.helper.resolveStaffUser(f.state.user);
    f.helper._observeAuthUser(f.state.user.uid);
    const second = f.helper.resolveStaffUser(f.state.user);
    pending.resolve();
    await Promise.all([first, second]);
    assert.equal(f.helper.getAuth().loggedIn, true);
});

test('Personalización es local: correo y teléfono no consultan ni autorizan datos privados', async () => {
    const f = fixture(); f.state.user = null;
    f.state.write = () => assert.fail('No se permiten escrituras remotas desde personalización');
    f.state.read = () => assert.fail('No se permiten consultas remotas desde personalización');
    for (const email of ['synthetic@example.invalid', 'other@example.invalid']) {
        const profile = await f.helper.getOrCreateClientProfile(email, 'Ángela O\'Connor', '12345678');
        assert.equal(profile.name, 'Ángela O\'Connor');
        assert.equal(profile.isExisting, false);
        f.helper._clientIdentity = email;
        f.helper._appointmentsCache = [{ clientEmail: email, clientPhone: '12345678' }];
        f.helper._fichasCache = [{ clientName: 'PRIVATE' }];
        f.helper._galleryCache = [{ clientEmail: email, approved: false }];
        assert.equal(f.helper.getClientAppointments(email, '12345678').length, 0);
        assert.equal(f.helper.getClientGallery(email).length, 0);
        assert.equal(f.helper.getFichas().length, 0);
        assert.equal(f.helper.getAuth().loggedIn, false);
    }
    assert.equal(f.state.calls.length, 0);
});

test('Recarga limpia cachés históricas y conserva personalización y catálogo públicos', async () => {
    const f = fixture(); f.state.user = null;
    f.local.set('nicolett_personalization', JSON.stringify({ name: 'Synthetic', email: 'test@example.invalid', appointments: ['PRIVATE'], photos: ['PRIVATE'] }));
    for (const key of ['nicolett_appointments', 'nicolett_fichas', 'nicolett_clients', 'nicolett_gallery_v2', 'nicolett_auth']) f.local.set(key, 'PRIVATE');
    f.helper._clearPrivateData();
    const prefs = JSON.parse(f.local.get('nicolett_personalization'));
    assert.equal(prefs.name, 'Synthetic'); assert.equal(prefs.appointments, undefined); assert.equal(prefs.photos, undefined);
    for (const key of ['nicolett_appointments', 'nicolett_fichas', 'nicolett_clients', 'nicolett_gallery_v2', 'nicolett_auth']) assert.equal(f.local.has(key), false);
    assert.equal(f.helper.getAppointments().length, 0);
    assert.ok(f.helper.getServices().length > 0); assert.ok(f.helper.getCategories().length > 0);
    f.helper._publicGalleryCache = [{ approved: true, title: 'PUBLIC' }];
    assert.equal(f.helper.getPublicGallery().length, 1);
    assert.equal(f.helper.getClientGallery('test@example.invalid').length, 0);
    await f.login();
    f.helper._galleryCache = [
        { approved: true, title: 'PUBLIC', clientEmail: 'private@example.invalid' },
        { status: 'approved', title: 'UNVERIFIED' }, { approved: false, title: 'PRIVATE' }
    ];
    const gallery = f.helper.getPublicGallery();
    assert.equal(gallery.length, 1); assert.equal(gallery[0].clientEmail, undefined);
});

test('Agenda en vivo: UID, cambios, reasignación y documento único', async () => {
    const f = fixture(); await f.login('worker', 'profesional');
    await f.helper.loadAppointmentsCache();
    const listener = f.state.appointmentListeners.at(-1);
    assert.equal(listener.collection, 'Citas');
    assert.deepEqual(listener.filters, [['profId', 'worker']]);
    listener.next(snapshot([{ id: 'one', profId: 'worker', status: 'confirmada', duration: 90 },
        { id: 'foreign', profId: 'another', profesional: 'Synthetic' }]));
    assert.equal(f.helper.getAppointments().length, 1);
    assert.equal(f.helper.getAppointments()[0].id, 'one');
    listener.next(snapshot([{ id: 'one', profId: 'worker', status: 'cancelada', time: '12:00' }]));
    assert.equal(f.helper.getAppointments()[0].status, 'cancelada');
    assert.equal(f.helper.getAppointments()[0].time, '12:00');
    listener.next(snapshot([{ id: 'one', profId: 'worker', status: 'pendiente' }]));
    listener.next(snapshot([{ id: 'one', profId: 'worker', status: 'pendiente' }]));
    assert.equal(f.helper.getAppointments().length, 1);
    assert.equal(f.helper.getAppointments()[0].status, 'pendiente');
    listener.next(snapshot([]));
    assert.equal(f.helper.getAppointments().length, 0);
    assert.equal(f.local.has('nicolett_appointments'), false);
});

test('Agenda en vivo: logout, permisos y respuestas tardías no exponen datos', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    const old = f.state.appointmentListeners.at(-1);
    f.helper.setAuth({ loggedIn: false });
    assert.equal(old.stopped, true);
    await f.login('worker', 'profesional'); await f.helper.loadAppointmentsCache();
    old.next(snapshot([{ id: 'private', profId: 'admin' }]));
    assert.equal(f.helper.getAppointments().some(a => a.id === 'private'), false);
    const current = f.state.appointmentListeners.at(-1);
    current.error({ code: 'permission-denied' });
    assert.equal(current.stopped, true);
    assert.equal(f.helper.getAppointments().length, 0);
    current.next(snapshot([{ id: 'late', profId: 'worker' }]));
    assert.equal(f.helper.getAppointments().length, 0);
});

test('Agenda en vivo: admin conserva acceso y snapshots locales no repueblan datos', async () => {
    const f = fixture(); await f.login(); await f.helper.loadAppointmentsCache();
    const listener = f.state.appointmentListeners.at(-1);
    assert.equal(listener.filters.length, 0);
    listener.next(snapshot([{ id: 'a', profId: 'worker' }, { id: 'b', profId: 'other' }]));
    assert.equal(f.helper.getAppointments().length, 2);
    listener.next({ ...snapshot([{ id: 'stale', profId: 'worker' }]), metadata: { fromCache: true } });
    assert.equal(f.helper.getAppointments().length, 2);
    await f.helper.loadAppointmentsCache();
    assert.equal(listener.stopped, true);
});

test('Agenda autorizada persiste aunque fichas, inventario o galería estén denegados', async () => {
    for (const denied of ['FichasClientas', 'Inventario', 'Galeria']) {
        const f = fixture(); await f.login('worker', 'profesional');
        f.state.read = async collection => { if (collection === denied) throw { code: 'permission-denied' }; };
        await f.helper.loadAppointmentsCache();
        assert.equal(f.helper.getAppointments().length, 1, denied);
        assert.equal(f.helper.getAppointments()[0].profId, 'worker');
        const listener = f.state.appointmentListeners.at(-1);
        assert.equal(listener.stopped, false);
        if (denied === 'FichasClientas') assert.equal(f.helper.getFichas().length, 0);
        if (denied === 'Inventario') assert.equal(f.helper.getInventory().length, 0);
        if (denied === 'Galeria') assert.equal(f.helper._galleryCache.length, 0);
        listener.next(snapshot([{ id: 'live', profId: 'worker', status: 'confirmada' }]));
        assert.equal(f.helper.getAppointments()[0].id, 'live');
        f.helper.setAuth({ loggedIn: false });
        listener.next(snapshot([{ id: 'late', profId: 'worker' }]));
        assert.equal(f.helper.getAppointments().length, 0);
    }
});

test('Agenda se carga y escucha antes de finalizar fichas; una respuesta tardía no pisa citas nuevas', async () => {
    const f = fixture(); await f.login('worker', 'profesional');
    const pending = deferred(); const started = deferred();
    f.state.read = async collection => { if (collection === 'FichasClientas') { started.resolve(); return pending.promise; } };
    const loading = f.helper.loadAppointmentsCache(); await started.promise;
    assert.equal(f.helper.getAppointments().length, 1);
    const listener = f.state.appointmentListeners.at(-1);
    listener.next(snapshot([{ id: 'new-confirmed', profId: 'worker', status: 'confirmada' }]));
    pending.resolve(snapshot([])); await loading;
    assert.equal(f.helper.getAppointments()[0].id, 'new-confirmed');
});

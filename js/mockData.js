// Sincronización dinámica de datos desde Firestore
const _cachedServices = (function () {
    try {
        const raw = localStorage.getItem('nicolett_services_cache');
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
})();

const _cachedCategories = (function () {
    try {
        const raw = localStorage.getItem('nicolett_categories_cache');
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
})();

const _cachedProfiles = (function () {
    try {
        const raw = localStorage.getItem('nicolett_profiles_cache');
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    return null;
})();

const _cachedProfessionals = (function () {
    try {
        const raw = localStorage.getItem('nicolett_professionals_cache');
        if (raw) return JSON.parse(raw).map(({ id, name, specialty, avatar }) => ({ id, name, specialty, avatar }));
    } catch (e) { }
    return null;
})();

const mockData = {
    // Perfiles de usuarias sincronizados con Firestore (Colección 'Perfiles')
    profiles: _cachedProfiles || [
        { id: 'mama', label: 'Mamá', icon: 'baby', desc: 'Espacios Kids Friendly' },
        { id: 'turnos', label: 'Turnos Rotativos', icon: 'clock', desc: 'Horarios flexibles y extendidos' },
        { id: 'ejecutiva', label: 'Ejecutiva', icon: 'briefcase', desc: 'Puntualidad y combos express' },
        { id: 'evento', label: 'Ocasión Especial', icon: 'star', desc: 'Producción completa' }
    ],

    // Categorías de Servicios sincronizadas con Firestore (Colección 'Categorias')
    categories: _cachedCategories || [
        { id: 'capilar', label: 'Cabello & Capilar', icon: 'heart', desc: 'Corte, peinado, coloración y tratamientos fotónicos' },
        { id: 'manicura', label: 'Manicura', icon: 'sparkles', desc: 'Uñas, esmaltados y extensiones' },
        { id: 'pedicure', label: 'Pedicure', icon: 'footprints', desc: 'Cuidado y spa de pies' },
        { id: 'podologia', label: 'Podología Clínica', icon: 'stethoscope', desc: 'Por Podóloga Priscila Villarreal, ROL MINSAL 164959' },
        { id: 'pestanas-cejas', label: 'Pestañas & Cejas', icon: 'eye', desc: 'Lifting coreano, extensiones y diseño' },
        { id: 'depilacion-femenina', label: 'Depilación Femenina', icon: 'flower', desc: 'Cera de abeja hipoalergénica' },
        { id: 'depilacion', label: 'Depilación Masculina', icon: 'scissors', desc: 'Cera caliente de miel de abeja' },
        // Compatibilidad previa
        { id: 'manos-pies', label: 'Manicure & Pedicure', icon: 'sparkles' },
        { id: 'mirada', label: 'Lashista & Mirada', icon: 'eye' },
        { id: 'bienestar', label: 'Bienestar y Relax', icon: 'smile' }
    ],

    // Servicios dinámicos sincronizados con Firestore (Colección 'Servicios')
    services: _cachedServices || [
        {
            id: 's1',
            categoryId: 'manicura',
            categoryGroup: 'manicura',
            name: 'Permanente',
            price: 15000,
            duration: 60,
            description: 'Un solo tono + 2 diseños simples.',
            adicionales: 'Francesa o degradé (+$5.000) • Diseños aparte ($1.000 el par)',
            recommendedFor: ['turnos', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_podo_clinica',
            categoryId: 'podologia',
            categoryGroup: 'podologia',
            name: 'Podología Clínica Integral',
            price: 25000,
            duration: 60,
            description: 'Atención podológica completa por profesional acreditada.',
            adicionales: 'Instrumental esterilizado en autoclave clínico',
            recommendedFor: ['mama', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 's_cap_fotocorte',
            categoryId: 'capilar',
            categoryGroup: 'capilar',
            name: 'Corte de Puntas + Fototerapia',
            price: 25000,
            duration: 60,
            description: 'Corte y regeneración capilar con luz fotónica.',
            adicionales: 'Incluye lavado y secado final',
            recommendedFor: ['evento', 'ejecutiva'],
            image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    ],

    // Profesionales guardadas previamente; sin personal precargado por defecto.
    professionals: _cachedProfessionals || [],

    gallery: [
        { id: 'g1', src: 'img/galeria1.jpg', title: 'Manicure Acrílica', serviceName: 'Manicure Acrílica', profesional: 'Camila', profId: 'p2' },
        { id: 'g2', src: 'img/galeria2.jpg', title: 'Lifting de Pestañas', serviceName: 'Lifting de Pestañas', profesional: 'Camila', profId: 'p2' },
        { id: 'g3', src: 'img/galeria3.jpg', title: 'Tratamiento Capilar', serviceName: 'Tratamiento Capilar', profesional: 'Nicolett', profId: 'p1' },
        { id: 'g4', src: 'img/galeria4.jpg', title: 'Maquillaje Profesional', serviceName: 'Maquillaje Profesional', profesional: 'Nicolett', profId: 'p1' },
        { id: 'g5', src: 'img/galeria5.jpg', title: 'Perfilado de Cejas', serviceName: 'Perfilado de Cejas', profesional: 'Camila', profId: 'p2' },
        { id: 'g6', src: 'img/galeria6.jpg', title: 'Pedicure Spa', serviceName: 'Pedicure Spa', profesional: 'Nicolett', profId: 'p1' }
    ],

    // Clientas Globales
    clients: [],

    // Inventario
    inventory: [
        { id: 'inv1', name: 'Esmalte Permanente Rojo', stock: 15, category: 'manos-pies' },
        { id: 'inv2', name: 'Pestañas Seda Curva C', stock: 50, category: 'mirada' },
        { id: 'inv3', name: 'Crema Masaje Capilar', stock: 8, category: 'capilar' },
        { id: 'inv4', name: 'Pegamento Pestañas', stock: 3, category: 'mirada' }
    ],

    // Horarios disponibles (simulados) - extendidos de 9 a 21 (cada 2 horas)
    timeSlots: [
        '09:00', '11:00', '13:00', '15:00',
        '17:00', '19:00', '21:00'
    ]
};

// Funciones para manejar localStorage y Firebase
const StorageHelper = {
    _appointmentsCache: [],
    _fichasCache: [],
    _professionalsCache: [],
    _inventoryCache: [],
    _servicesCache: [],
    _categoriesCache: [],
    _profilesCache: [],
    _flowConfigCache: null,

    _sessionEpoch: 0,
    _authEpoch: 0,
    _observedUid: null,
    _hasObservedAuth: false,
    _initialFlowReceiptUid: null,
    _privateOwner: null,
    _clientIdentity: null,
    _galleryCache: [],
    _publicGalleryCache: [],
    _roleUnsubscribe: null,
    _appointmentsUnsubscribe: null,
    _appointmentsWatch: null,
    _flowReturnReceipt: function () {
        try {
            const params = new URLSearchParams(window.location.search);
            if (!['flow-success', 'flow-failed', 'flow-conflict'].includes(params.get('action'))
                || !/^[\w-]{8,256}$/.test(params.get('token') || '')) return null;
            const receipt = sessionStorage.getItem('nicolett_flow_receipt');
            return /^[a-f0-9]{64}$/.test(receipt || '') ? receipt : null;
        } catch (_) { return null; }
    },
    _clearPrivateData: function (options = {}) {
        this._appointmentsWatch = null;
        if (this._appointmentsUnsubscribe) this._appointmentsUnsubscribe();
        this._appointmentsUnsubscribe = null;
        const receipt = options.preservePaymentReturn ? this._flowReturnReceipt() : null;
        this._sessionEpoch++;
        this._appointmentsCache = [];
        this._fichasCache = [];
        this._inventoryCache = [];
        this._galleryCache = [];
        this._professionalsCache = this._professionalsCache.map(this._publicProfessional);
        this._flowConfigCache = null;
        mockData.clients = [];
        // Conservar solo campos de personalización; descartar historiales incrustados antiguos.
        try {
            const raw = localStorage.getItem('nicolett_personalization');
            if (raw) {
                const saved = JSON.parse(raw);
                const clean = {};
                for (const key of ['name', 'email', 'phone']) {
                    if (typeof saved?.[key] === 'string') clean[key] = saved[key];
                }
                if (Object.keys(clean).length) localStorage.setItem('nicolett_personalization', JSON.stringify(clean));
                else localStorage.removeItem('nicolett_personalization');
            }
        } catch (_) { localStorage.removeItem('nicolett_personalization'); }
        for (const store of [localStorage, typeof sessionStorage !== 'undefined' ? sessionStorage : null]) {
            if (!store) continue;
            for (const key of ['nicolett_appointments', 'nicolett_fichas', 'nicolett_clients', 'nicolett_user',
                'nicolett_gallery_v2', 'nicolett_local_professionals',
                'nicolett_professionals_cache', 'nicolett_staff_passwords', 'nicolett_auth',
                'nicolett_flow_config', 'nicolett_pending_booking', 'nicolett_flow_receipt',
                'nicolett_active_admin_tab', 'nicolett_admin_gallery_filter']) {
                store.removeItem(key);
            }
        }
        if (receipt) sessionStorage.setItem('nicolett_flow_receipt', receipt);
    },
    _publicProfessional: function (person) {
        const { id, name, specialty, avatar } = person;
        return { id, name, specialty, avatar };
    },
    _observeAuthUser: function (uid) {
        const firstObservation = !this._hasObservedAuth;
        // currentUser puede ser null mientras Firebase restaura su sesión inicial.
        if (uid) this._hasObservedAuth = true;
        if (this._observedUid !== uid) {
            const receipt = firstObservation ? this._flowReturnReceipt() : null;
            this.setAuth({ loggedIn: false, user: null });
            this._observedUid = uid;
            if (receipt) {
                sessionStorage.setItem('nicolett_flow_receipt', receipt);
                this._initialFlowReceiptUid = uid;
            }
        }
    },
    _sessionIdentity: function () {
        const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
        if (user && this._verifiedStaff?.id === user.uid) return user.uid + ':' + this._verifiedStaff.role;
        return null; // La personalización local nunca crea una sesión privada.
    },
    _syncPrivateSession: function () {
        const uid = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser?.uid : null;
        this._observeAuthUser(uid || null);
        const identity = this._sessionIdentity();
        if (identity !== this._privateOwner) {
            this._clearPrivateData({ preservePaymentReturn: !!uid && this._initialFlowReceiptUid === uid });
            this._initialFlowReceiptUid = null;
            this._privateOwner = identity;
        }
        return identity;
    },
    _sessionStamp: function () {
        this._syncPrivateSession();
        const uid = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser?.uid : null;
        return { epoch: this._sessionEpoch, uid: uid || null, owner: this._privateOwner };
    },
    _isSessionCurrent: function (stamp) {
        const current = this._sessionStamp();
        return stamp.epoch === current.epoch && stamp.uid === current.uid && stamp.owner === current.owner;
    },
    _hasPrivateSession: function () { return !!this._syncPrivateSession(); },
    _isDenied: function (error) {
        return /(^|\/)(permission-denied|unauthenticated)$/.test(error?.code || '');
    },
    _assertSessionCurrent: function (stamp) {
        if (!this._isSessionCurrent(stamp)) {
            const error = new Error('La sesión cambió durante la operación.');
            error.code = 'session-changed';
            throw error;
        }
    },
    _handlePrivateError: function (error, stamp) {
        this._assertSessionCurrent(stamp);
        if (this._isDenied(error)) {
            this._clearPrivateData();
            this._refreshAdminIfSafe();
            throw error;
        }
    },
    _publicGalleryImage: function (image) {
        const { id, fbId, src, title, serviceName, profesional, profId, date, source, approved, status } = image;
        return { id, fbId, src, title, serviceName, profesional, profId, date, source, approved, status };
    },
    _storeGallery: function (gallery) {
        if (!this._hasPrivateSession()) return;
        this._galleryCache = gallery;
        // Las fotos privadas y sus metadatos se mantienen solo en memoria de sesión.
    },

    init: async function () {
        this._clearPrivateData({ preservePaymentReturn: true });
        const publicLoad = this.loadAppointmentsCache();

        // Sincronizar estado de autenticación con Firebase
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user?.uid !== firebase.auth().currentUser?.uid) return;
                this._observeAuthUser(user?.uid || null);
                this._hasObservedAuth = true;
                if (user) {
                    try {
                        await this.resolveStaffUser(user);

                    } catch (error) { console.warn('Cuenta sin autorización de personal.'); }
                }
                await this.loadAppointmentsCache();
                if (typeof window.updateNavAuthVisibility === 'function') window.updateNavAuthVisibility();
                this._refreshAdminIfSafe();
            });
        }

        await publicLoad;
    },

    _refreshAdminIfSafe: function () {
        if (typeof AppRouter !== 'undefined' && AppRouter.currentRoute === 'admin') {
            AppRouter.refresh();
        }
    },

    _getAppointmentKey: function (appt) {
        if (!appt) return null;
        if (appt.flowOrder) return `flow_order_${appt.flowOrder}`;
        if (appt.flowToken) return `flow_token_${appt.flowToken}`;
        if (appt.orderId) return `order_${appt.orderId}`;
        if (appt.date && appt.time) {
            const prof = (appt.profId || appt.profesional || '').toString().trim().toLowerCase();
            const client = (appt.clientEmail || appt.clientPhone || appt.clientName || '').toString().trim().toLowerCase();
            return `slot_${appt.date}_${appt.time}_${prof}_${client}`;
        }
        return appt.id || null;
    },

    getAppointments: function () {
        if (!this._hasPrivateSession()) return [];
        const seen = new Set();
        const unique = [];
        for (const a of this._appointmentsCache) {
            const key = this._getAppointmentKey(a) || a.id;
            if (key) {
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(a);
                }
            } else {
                unique.push(a);
            }
        }
        return unique;
    },

    getClientAppointments: function (email, phone) {
        if (!this.getAuth().loggedIn) return [];
        const normEmail = (email || '').toString().trim().toLowerCase();
        const cleanPhone = (phone || '').toString().replace(/\D/g, '');

        if (!normEmail && !cleanPhone) return [];

        const all = this.getAppointments();
        const matches = all.filter(a => {
            if (!a) return false;
            // Coincidencia por correo normalizado
            if (normEmail && a.clientEmail && a.clientEmail.toString().trim().toLowerCase() === normEmail) {
                return true;
            }
            // Coincidencia por teléfono (últimos 8 dígitos para cubrir variaciones +569 / 9)
            if (cleanPhone && cleanPhone.length >= 8 && a.clientPhone) {
                const apptPhone = a.clientPhone.toString().replace(/\D/g, '');
                if (apptPhone && (apptPhone === cleanPhone || apptPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(apptPhone.slice(-8)))) {
                    return true;
                }
            }
            return false;
        });

        // Ordenar de más reciente a más antigua
        matches.sort((a, b) => {
            const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
            return dateB - dateA;
        });

        return matches;
    },

    _watchAppointments: function (session) {
        if (!this._isSessionCurrent(session) || !session.owner) return;
        const auth = this.getAuth();
        let query = db.collection('Citas');
        if (auth.user.role !== 'admin') query = query.where('profId', '==', auth.user.id);
        if (typeof query.onSnapshot !== 'function') return;
        if (this._appointmentsUnsubscribe) this._appointmentsUnsubscribe();
        const watch = {};
        this._appointmentsWatch = watch;
        const current = () => this._isSessionCurrent(session) && this._appointmentsWatch === watch;
        const unsubscribe = query.onSnapshot(snapshot => {
            if (!current() || snapshot.metadata?.fromCache) return;
            this._appointmentsCache = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                .filter(appointment => auth.user.role === 'admin' || appointment.profId === auth.user.id);
            this._refreshAdminIfSafe();
        }, () => {
            if (!current()) return;
            this._clearPrivateData();
            this._refreshAdminIfSafe();
        });
        if (this._appointmentsWatch === watch) this._appointmentsUnsubscribe = unsubscribe;
        else unsubscribe();
    },

    loadAppointmentsCache: async function () {
        if (typeof db === 'undefined') return;

        const session = this._sessionStamp();
        if (this.getAuth().loggedIn) {
            const auth = this.getAuth();
            const read = async collection => {
                let query = db.collection(collection);
                if (auth.user.role !== 'admin') query = query.where('profId', '==', auth.user.id);
                const snapshot = await query.get({ source: 'server' });
                this._assertSessionCurrent(session);
                return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            };
            try {
                const appointments = await read('Citas');
                if (!this._isSessionCurrent(session)) return;
                this._appointmentsCache = appointments;
                this._watchAppointments(session);
                this._refreshAdminIfSafe();
            } catch (error) {
                if (!this._isSessionCurrent(session)) return;
                this._clearPrivateData();
                this._refreshAdminIfSafe();
                return;
            }
            try {
                let fichas = await read('FichasClientas');
                if (!this._isSessionCurrent(session)) return;
                if (!fichas.length && auth.user.role === 'admin') {
                    fichas = await read('FichasClinicas');
                    if (!this._isSessionCurrent(session)) return;
                }
                this._fichasCache = fichas;
            } catch (error) {
                if (!this._isSessionCurrent(session)) return;
                // Una colección denegada no invalida una lectura autorizada de Citas.
                this._fichasCache = [];
                console.warn('[StorageHelper] Fichas no disponibles; agenda independiente.');
                this._refreshAdminIfSafe();
            }
        }

        try {
            const profsSnapshot = await db.collection("Profesionales").get();
            if (!this._isSessionCurrent(session)) return;
            const profs = [];
            profsSnapshot.forEach((doc) => {
                profs.push({ ...doc.data(), id: doc.id });
            });
            this._professionalsCache = profs.map(person => this.getAuth().loggedIn ? person : this._publicProfessional(person));
            mockData.professionals = this._professionalsCache.map(this._publicProfessional);
            try { localStorage.setItem('nicolett_professionals_cache', JSON.stringify(this._professionalsCache.map(this._publicProfessional))); } catch (e) {}
        } catch (e) {
            console.error("Error cargando profesionales:", e);
            if (this._professionalsCache.length === 0) this._professionalsCache = mockData.professionals.map(this._publicProfessional);
        }

        if (this.getAuth().loggedIn && this._isSessionCurrent(session)) {
            try {
                const snapshot = await db.collection('Inventario').get({ source: 'server' });
                if (!this._isSessionCurrent(session)) return;
                this._inventoryCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (!snapshot.docs.length && this.getAuth().user.role === 'admin') {
                    for (const item of mockData.inventory) {
                        this._assertSessionCurrent(session);
                        const data = { ...item };
                        delete data.id;
                        await db.collection('Inventario').doc(item.id).set(data);
                        this._assertSessionCurrent(session);
                    }
                    this._inventoryCache = mockData.inventory.map(item => ({ ...item }));
                }
            } catch (error) {
                if (!this._isSessionCurrent(session)) return;
                this._inventoryCache = [];
                console.warn('[StorageHelper] Inventario no disponible; agenda independiente.');
                this._refreshAdminIfSafe();
            }
        }

        try {
            const auth = this.getAuth();
            const staff = auth.loggedIn;
            const isAdmin = staff && auth.user.role === 'admin';
            const query = isAdmin ? db.collection('Galeria') : db.collection('Galeria').where('approved', '==', true);
            const snapshot = await query.get({ source: 'server' });
            const own = staff && !isAdmin
                ? await db.collection('Galeria').where('profId', '==', firebase.auth().currentUser.uid).get({ source: 'server' }) : null;
            if (!this._isSessionCurrent(session)) return;
            const records = new Map(snapshot.docs.map(doc => [doc.id, doc]));
            if (own) own.docs.forEach(doc => records.set(doc.id, doc));
            const images = [...records.values()].map(doc => ({ id: doc.id, fbId: doc.id, ...doc.data() }));
            this._galleryCache = staff ? images : [];
            this._publicGalleryCache = images.filter(image => image.approved === true).map(this._publicGalleryImage);
        } catch (error) {
            if (!this._isSessionCurrent(session)) return;
            this._galleryCache = [];
            if (this._isDenied(error)) this._publicGalleryCache = [];
        }

        localStorage.removeItem('nicolett_flow_config');

        // --- Sincronización de Servicios desde Firestore (Colección 'Servicios') ---
        try {
            const servSnapshot = await db.collection("Servicios").get();
            if (!servSnapshot.empty) {
                const servs = [];
                servSnapshot.forEach((doc) => {
                    servs.push({ id: doc.id, ...doc.data() });
                });
                this._servicesCache = servs;
                mockData.services = servs;
                try { localStorage.setItem('nicolett_services_cache', JSON.stringify(servs)); } catch (e) {}
                console.log(`[StorageHelper] ${servs.length} servicios sincronizados en vivo desde Firestore.`);
            }
        } catch (e) {
            console.warn("[StorageHelper] Error cargando Servicios de Firestore:", e);
        }

        // --- Sincronización de Categorías desde Firestore (Colección 'Categorias') ---
        try {
            const catSnapshot = await db.collection("Categorias").get();
            if (!catSnapshot.empty) {
                const cats = [];
                catSnapshot.forEach((doc) => {
                    cats.push({ id: doc.id, ...doc.data() });
                });
                this._categoriesCache = cats;
                mockData.categories = cats;
                try { localStorage.setItem('nicolett_categories_cache', JSON.stringify(cats)); } catch (e) {}
                console.log(`[StorageHelper] ${cats.length} categorías sincronizadas en vivo desde Firestore.`);
            }
        } catch (e) {
            console.warn("[StorageHelper] Error cargando Categorías de Firestore:", e);
        }

        // --- Sincronización de Perfiles desde Firestore (Colección 'Perfiles') ---
        try {
            const profSnap = await db.collection("Perfiles").get();
            if (!profSnap.empty) {
                const profs = [];
                profSnap.forEach((doc) => {
                    profs.push({ id: doc.id, ...doc.data() });
                });
                this._profilesCache = profs;
                mockData.profiles = profs;
                try { localStorage.setItem('nicolett_profiles_cache', JSON.stringify(profs)); } catch (e) {}
            }
        } catch (e) {
            console.warn("[StorageHelper] Error cargando Perfiles de Firestore:", e);
        }

        // Refrescar vistas si están activas para reflejar datos frescos de la base de datos
        if (typeof AppRouter !== 'undefined' && (AppRouter.currentRoute === 'home' || AppRouter.currentRoute === 'servicios')) {
            AppRouter.refresh();
        }

        this._refreshAdminIfSafe();
    },

    getAvailableTimeSlots: async function (date, profId) {
        if (!this._bookingServiceId) return [];
        try {
            const query = new URLSearchParams({ date, profId, serviceId: this._bookingServiceId, times: mockData.timeSlots.join(',') });
            const response = await fetch('/api/bookings/availability?' + query);
            const result = await response.json();
            if (!response.ok) {
                const messages = {
                    BOOKING_MIGRATION_REQUIRED: 'Las reservas están temporalmente en mantenimiento. La agenda aún no está habilitada.',
                    BOOKING_PAUSED: 'Las nuevas reservas están temporalmente pausadas. Inténtalo más tarde.',
                    CATALOG_UNAVAILABLE: 'El servicio o la profesional no están disponibles. Revisa tu selección.',
                    PROFESSIONAL_UNAVAILABLE: 'La profesional seleccionada no está disponible. Selecciona otra.',
                    INVALID_CATALOG_DURATION: 'No se puede consultar este servicio en este momento. Contacta al estudio.',
                    INVALID_CATALOG_PRICE: 'No se puede consultar este servicio en este momento. Contacta al estudio.'
                };
                const code = Object.prototype.hasOwnProperty.call(messages, result?.error) ? result.error : 'AVAILABILITY_UNAVAILABLE';
                throw Object.assign(new Error(messages[code] || 'No se pudieron consultar los horarios. Inténtalo nuevamente más tarde.'), { code });
            }
            if (!Array.isArray(result?.times) || !result.times.every(time => typeof time === 'string'
                && /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) throw new Error('INVALID_AVAILABILITY_RESPONSE');
            return result.times;
        } catch (error) {
            if (['BOOKING_MIGRATION_REQUIRED', 'BOOKING_PAUSED', 'CATALOG_UNAVAILABLE', 'PROFESSIONAL_UNAVAILABLE',
                'INVALID_CATALOG_DURATION', 'INVALID_CATALOG_PRICE', 'AVAILABILITY_UNAVAILABLE'].includes(error.code)) throw error;
            throw Object.assign(new Error('No se pudieron consultar los horarios. Verifica tu conexión e inténtalo nuevamente.'), { code: 'AVAILABILITY_UNAVAILABLE' });
        }
    },
    _bookingApi: async function (url, method, body, session) {
        const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
        if (!user) throw new Error('Sesión requerida.');
        const token = await user.getIdToken();
        this._assertSessionCurrent(session);
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
        this._assertSessionCurrent(session);
        const result = await response.json();
        this._assertSessionCurrent(session);
        if (!response.ok) {
            if ([401, 403].includes(response.status)) this._clearPrivateData();
            throw new Error(result.error || 'No se pudo reservar el horario.');
        }
        return result;
    },
    saveAppointment: async function (appointment) {
        const session = this._sessionStamp();
        if (!session.owner) throw new Error('Sesión requerida.');
        const existing = appointment.id ? this._appointmentsCache.find(item => item.id === appointment.id) : null;
        appointment._bookingRequestId = appointment._bookingRequestId || crypto.randomUUID();
        const result = existing
            ? await this._bookingApi('/api/bookings/' + encodeURIComponent(existing.reservationId || existing.id), 'PATCH',
                { changes: { date: appointment.date, time: appointment.time, profId: appointment.profId, serviceId: appointment.serviceId,
                    status: appointment.status, revision: existing.revision || 0 }, requestId: appointment._bookingRequestId + '-' + (existing.revision || 0) }, session)
            : await this._bookingApi('/api/bookings/manual', 'POST', { booking: appointment, requestId: appointment._bookingRequestId }, session);
        this._assertSessionCurrent(session);
        const index = this._appointmentsCache.findIndex(item => item.id === result.id);
        if (index >= 0) this._appointmentsCache[index] = result;
        else this._appointmentsCache.push(result);
        return result;
    },

    getUser: function () {
        return this._hasPrivateSession() ? JSON.parse(localStorage.getItem('nicolett_user') || '{}') : {};
    },

    saveUser: function (user) {
        if (!this._hasPrivateSession()) return;
        localStorage.setItem('nicolett_user', JSON.stringify(user));
    },

    // Auth
    _verifiedStaff: null,
    resolveStaffUser: async function (user) {
        if (!user || firebase.auth().currentUser?.uid !== user.uid) throw new Error('Sesión requerida.');
        this._observeAuthUser(user.uid);
        const epoch = this._authEpoch;
        let snap;
        try {
            snap = await firebase.firestore().collection('Usuarios').doc(user.uid).get({ source: 'server' });
        } catch (error) {
            if (epoch === this._authEpoch && this._isDenied(error)) this.setAuth({ loggedIn: false, user: null });
            throw error;
        }
        if (epoch !== this._authEpoch || firebase.auth().currentUser?.uid !== user.uid) throw new Error('Sesión cambiada.');
        const data = snap.exists ? snap.data() : null;
        if (!data || data.activo === false || !['admin', 'Admin', 'profesional'].includes(data.rol)) {
            this.setAuth({ loggedIn: false, user: null });
            throw new Error('Cuenta sin autorización de personal.');
        }
        this._clientIdentity = null;
        this._verifiedStaff = { id: user.uid, email: user.email, name: data.nombre || data.name || 'Personal', role: data.rol.toLowerCase() };
        this._syncPrivateSession();
        this._watchStaffRole(user.uid);
        return this._verifiedStaff;
    },
    _watchStaffRole: function (uid) {
        if (this._roleUnsubscribe) this._roleUnsubscribe();
        const epoch = this._authEpoch;
        const ref = firebase.firestore().collection('Usuarios').doc(uid);
        if (typeof ref.onSnapshot !== 'function') return;
        this._roleUnsubscribe = ref.onSnapshot(snapshot => {
            if (snapshot.metadata?.fromCache) return;
            if (epoch !== this._authEpoch || firebase.auth().currentUser?.uid !== uid) return;
            const data = snapshot.exists ? snapshot.data() : null;
            const role = data?.rol?.toLowerCase();
            if (!data || data.activo === false || !['admin', 'profesional'].includes(role)) {
                this.setAuth({ loggedIn: false, user: null });
            } else if (this._verifiedStaff?.role !== role) {
                this._verifiedStaff = { ...this._verifiedStaff, role };
                this._syncPrivateSession();
                this.loadAppointmentsCache();
            }
            this._refreshAdminIfSafe();
        }, () => {
            if (epoch === this._authEpoch) {
                this.setAuth({ loggedIn: false, user: null });
                this._refreshAdminIfSafe();
            }
        });
    },
    getAuth: function () {
        this._syncPrivateSession();
        const current = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
        return current && this._verifiedStaff?.id === current.uid
            ? { loggedIn: true, user: this._verifiedStaff }
            : { loggedIn: false, user: null };
    },
    setAuth: function (authData) {
        if (!authData?.loggedIn) {
            this._hasObservedAuth = true;
            this._initialFlowReceiptUid = null;
            this._authEpoch++;
            if (this._roleUnsubscribe) this._roleUnsubscribe();
            this._roleUnsubscribe = null;
            this._verifiedStaff = null;
            this._clientIdentity = null;
            this._privateOwner = null;
            this._clearPrivateData();
        } else this._syncPrivateSession();
        localStorage.removeItem('nicolett_auth');
        localStorage.removeItem('nicolett_staff_passwords');
    },

    // Inventory
    getInventory: function () {
        return this._hasPrivateSession() ? this._inventoryCache : [];
    },
    updateProductStock: async function (productId, amountUsed) {
        throw new Error('Registra el consumo al guardar la ficha; usa el ajuste administrativo para correcciones generales.');
    },
    updateProductStockDirect: async function (productId, newStock) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        const inv = this.getInventory();
        const p = inv.find(x => x.id === productId);
        if (p) {
            p.stock = parseInt(newStock) || 0;
            if (typeof db !== 'undefined') {
                try {
                    const docData = { ...p };
                    delete docData.id;
                    await db.collection("Inventario").doc(productId).set(docData, { merge: true });
                    this._assertSessionCurrent(session);
                } catch (e) { this._handlePrivateError(e, session); console.error("Error updating stock", e); }
            }
        }
    },
    addProduct: async function (product) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        if (typeof db !== 'undefined') {
            try {
                const docRef = await db.collection("Inventario").add(product);
                this._assertSessionCurrent(session);
                product.id = docRef.id;
                this._inventoryCache.push(product);
                return product;
            } catch (e) { this._handlePrivateError(e, session); console.error("Error adding product", e); }
        }
    },

    updateAppointmentStatus: async function (id, newStatus) {
        const session = this._sessionStamp();
        const current = this.getAppointments().find(item => item.id === id);
        if (!current) throw new Error('Cita no disponible.');
        const result = await this._bookingApi('/api/bookings/' + encodeURIComponent(current.reservationId || id), 'PATCH',
            { changes: { status: newStatus, revision: current.revision || 0 }, requestId: crypto.randomUUID() }, session);
        this._assertSessionCurrent(session);
        const index = this._appointmentsCache.findIndex(item => item.id === id);
        if (index >= 0) this._appointmentsCache[index] = result;
        return result;
    },

    // Servicios y Categorías (Sincronizados con Firestore)
    getServices: function () {
        if (this._servicesCache && this._servicesCache.length > 0) return this._servicesCache;
        return mockData.services;
    },
    getCategories: function () {
        if (this._categoriesCache && this._categoriesCache.length > 0) return this._categoriesCache;
        return mockData.categories;
    },
    getProfiles: function () {
        if (this._profilesCache && this._profilesCache.length > 0) return this._profilesCache;
        return mockData.profiles;
    },
    getServiceById: function (id) {
        const list = this.getServices();
        return list.find(s => s.id === id) || null;
    },

    saveService: async function (service) {
        if (!service) return null;
        const docId = service.id || ('s_' + Date.now());
        const docData = { ...service };
        delete docData.id;
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Servicios").doc(docId).set(docData, { merge: true });
            } catch (err) {
                console.error("[StorageHelper] Error guardando servicio en Firestore:", err);
            }
        }
        service.id = docId;
        const idx = this._servicesCache.findIndex(s => s.id === docId);
        if (idx >= 0) this._servicesCache[idx] = service;
        else this._servicesCache.push(service);
        mockData.services = this._servicesCache;
        try { localStorage.setItem('nicolett_services_cache', JSON.stringify(this._servicesCache)); } catch (e) {}
        return service;
    },

    deleteService: async function (serviceId) {
        if (!serviceId) return;
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Servicios").doc(serviceId).delete();
            } catch (err) {
                console.error("[StorageHelper] Error eliminando servicio de Firestore:", err);
            }
        }
        this._servicesCache = this._servicesCache.filter(s => s.id !== serviceId);
        mockData.services = this._servicesCache;
        try { localStorage.setItem('nicolett_services_cache', JSON.stringify(this._servicesCache)); } catch (e) {}
    },

    // Professionals
    getProfessionals: function () {
        return this._hasPrivateSession() ? this._professionalsCache : this._professionalsCache.map(this._publicProfessional);
    },
    addProfessional: async function (prof) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        if (!prof.id) {
            prof.id = 'p_' + Date.now();
        }
        if (typeof db !== 'undefined') {
            try {
                const docRef = await db.collection("Profesionales").add(prof);
                this._assertSessionCurrent(session);
                prof.id = docRef.id;
            } catch (e) { this._handlePrivateError(e, session);
                console.error("Error adding professional to Firestore", e);
            }
        }
        this._professionalsCache.push(prof);
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache.map(this._publicProfessional)));
        } catch (e) { this._handlePrivateError(e, session); }
        return prof;
    },
    updateProfessional: async function (id, data) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        const profIdx = this._professionalsCache.findIndex(p => p.id === id);
        if (profIdx > -1) {
            this._professionalsCache[profIdx] = { ...this._professionalsCache[profIdx], ...data };
        }
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Profesionales").doc(id).set(data, { merge: true });
                this._assertSessionCurrent(session);
            } catch (e) { this._handlePrivateError(e, session);
                console.error("Error updating professional in Firestore", e);
            }
        }
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache.map(this._publicProfessional)));
        } catch (e) { this._handlePrivateError(e, session); }
        return this._professionalsCache[profIdx];
    },
    deleteProfessional: async function (id) {
        const session = this._sessionStamp();
        if (!session.owner || this.getAuth().user?.role !== 'admin') {
            throw new Error('Debes iniciar sesión como administradora para eliminar profesionales.');
        }
        if (typeof db === 'undefined') throw new Error('No se pudo conectar con Firebase. Intenta nuevamente.');
        try {
            await db.collection("Profesionales").doc(id).delete();
            this._assertSessionCurrent(session);
        } catch (e) {
            this._handlePrivateError(e, session);
            throw e;
        }
        this._professionalsCache = this._professionalsCache.filter(p => p.id !== id);
        mockData.professionals = this._professionalsCache.map(this._publicProfessional);
        try {
            const publicProfiles = JSON.stringify(mockData.professionals);
            localStorage.setItem('nicolett_professionals_cache', publicProfiles);
            localStorage.setItem('nicolett_local_professionals', publicProfiles);
        } catch (e) { console.warn('No se pudo actualizar la caché local de profesionales.'); }
    },

    // Las contraseñas se gestionan exclusivamente con Firebase Auth.
    verifyStaffPassword: function () { return false; },
    setStaffPassword: function () { throw new Error('Contraseñas locales deshabilitadas.'); },

    // --- Gallery ---
    getGallery: function () {
        if (this._hasPrivateSession() && this._galleryCache.length) return this._galleryCache;
        return this._publicGalleryCache.length ? this._publicGalleryCache : mockData.gallery.map(image => this._publicGalleryImage({ ...image, source: 'admin', approved: true, status: 'approved' }));
    },

    // Galería pública (solo fotos del estudio o fotos de clientas APROBADAS)
    getPublicGallery: function () {
        const gallery = this.getGallery();
        return gallery.filter(img => img.approved === true).map(this._publicGalleryImage);
    },

    getClientGallery: function (email) {
        if (!this.getAuth().loggedIn) return [];
        const gallery = this.getGallery();
        if (!email) return [];
        const normEmail = email.trim().toLowerCase();
        // Muestra todas las fotos asociadas a esta clienta (tomadas por la trabajadora o registradas para su correo)
        return gallery.filter(img => img.clientEmail && img.clientEmail.trim().toLowerCase() === normEmail);
    },

    // Obtener fotos asociadas a una trabajadora específica (por nombre o id)
    getProfessionalGallery: function (profNameOrId) {
        if (!profNameOrId) return [];
        const norm = profNameOrId.toString().trim().toLowerCase();
        const gallery = this.getGallery();
        return gallery.filter(img => {
            const pName = (img.profesional || '').toString().trim().toLowerCase();
            const pId = (img.profId || '').toString().trim().toLowerCase();
            return pName === norm || pId === norm || pName.includes(norm) || norm.includes(pName);
        });
    },

    addGalleryImage: async function (imageObj) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        const gallery = this.getGallery();
        imageObj.id = imageObj.id || ('g' + Date.now());
        imageObj.timestamp = imageObj.timestamp || Date.now();
        imageObj.date = imageObj.date || new Date().toLocaleDateString('es-CL');
        imageObj.profesional = imageObj.profesional || '';
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) throw new Error('Sesión requerida.');
        const isAdmin = this.getAuth().user.role === 'admin';
        if (!isAdmin) {
            imageObj.profId = currentUser.uid;
            imageObj.source = 'worker';
        }

        // Si la foto es subida por una clienta, queda PENDIENTE de aprobación
        const isClient = imageObj.source === 'client';
        imageObj.approved = isAdmin && !isClient;
        imageObj.status = imageObj.approved ? 'approved' : 'pending';

        // Intento de persistencia en Firebase Firestore (asíncrono y resiliente)
        if (typeof db !== 'undefined') {
            try {
                const docData = {
                    title: imageObj.title || '',
                    src: imageObj.src,
                    serviceName: imageObj.serviceName || '',
                    clientName: imageObj.clientName || '',
                    clientEmail: imageObj.clientEmail || '',
                    profesional: imageObj.profesional || '',
                    profId: imageObj.profId || '',
                    source: imageObj.source || 'admin',
                    approved: imageObj.approved,
                    status: imageObj.status,
                    date: imageObj.date,
                    createdAt: (typeof firebase !== 'undefined' && firebase.firestore)
                        ? firebase.firestore.FieldValue.serverTimestamp()
                        : new Date().toISOString()
                };
                const docRef = await db.collection("Galeria").add(docData);
                this._assertSessionCurrent(session);
                imageObj.fbId = docRef.id;
            } catch (e) { this._handlePrivateError(e, session);
                throw new Error('No se pudo publicar la fotografía.');
            }
        } else throw new Error('Firebase no disponible.');
        this._assertSessionCurrent(session);
        gallery.unshift(imageObj);
        this._storeGallery(gallery);
        return imageObj;
    },

    // Aprobar o Desaprobar/Ocultar foto en Galería Pública (Solo Administradora)
    setGalleryImageApproval: async function (id, approved) {
        const session = this._sessionStamp();
        if (!session.owner) return null;
        if (this.getAuth().user.role !== 'admin') throw new Error('Solo administración puede aprobar fotografías.');

        const gallery = this.getGallery();
        const img = gallery.find(item => item.id === id || item.fbId === id);
        if (!img) return null;

        img.approved = !!approved;
        img.status = approved ? 'approved' : 'pending';
        this._storeGallery(gallery);

        if (typeof db !== 'undefined') {
            try {
                const docId = img.fbId || (img.id && !img.id.startsWith('g') ? img.id : null);
                if (docId) {
                    await db.collection("Galeria").doc(docId).set({
                        approved: img.approved,
                        status: img.status
                    }, { merge: true });
                    this._assertSessionCurrent(session);
                }
            } catch (e) { this._handlePrivateError(e, session);
                console.warn("Firestore Galeria update approval error:", e);
            }
        }
        return img;
    },

    deleteGalleryImage: async function (id) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        let gallery = this.getGallery();
        const imgToDelete = gallery.find(img => img.id === id || img.fbId === id);
        if (this.getAuth().user.role !== 'admin' && (!imgToDelete || imgToDelete.approved
            || imgToDelete.profId !== firebase.auth().currentUser.uid)) throw new Error('Fotografía no autorizada.');
        gallery = gallery.filter(img => img.id !== id && img.fbId !== id);
        this._storeGallery(gallery);

        if (typeof db !== 'undefined' && imgToDelete) {
            try {
                const docId = imgToDelete.fbId || (imgToDelete.id && !imgToDelete.id.startsWith('g') ? imgToDelete.id : null);
                if (docId) {
                    await db.collection("Galeria").doc(docId).delete();
                    this._assertSessionCurrent(session);
                }
            } catch (e) { this._handlePrivateError(e, session);
                console.warn("Firestore Galeria delete error:", e);
            }
        }
    },

    // Fichas Clientas
    getFichas: function () {
        return this._hasPrivateSession() ? (this._fichasCache || []) : [];
    },
    saveFicha: async function (ficha) {
        const session = this._sessionStamp();
        if (!session.owner) return null;
        ficha._operationId = ficha._operationId || crypto.randomUUID();
        try {
            const result = await this._bookingApi('/api/fichas', 'POST', { ficha, requestId: ficha._operationId }, session);
            this._assertSessionCurrent(session);
            Object.assign(ficha, result.ficha);
            const index = this._fichasCache.findIndex(item => item.id === ficha.id);
            if (index < 0) this._fichasCache.push(ficha);
            else this._fichasCache[index] = ficha;
            // No usar stock de una respuesta idempotente antigua para sobrescribir la caché.
            this._inventoryCache = [];
            await this.loadAppointmentsCache();
            this._assertSessionCurrent(session);
        } catch (error) {
            this._handlePrivateError(error, session);
            throw error;
        }
    },
    deleteFicha: async function (id) {
        const session = this._sessionStamp();
        if (!session.owner) return null;

        if (typeof db !== 'undefined') {
            try {
                await db.collection("FichasClientas").doc(id).delete();
                this._assertSessionCurrent(session);
                try { await db.collection("FichasClinicas").doc(id).delete(); this._assertSessionCurrent(session); } catch (err) { this._handlePrivateError(err, session); }
                this._fichasCache = this._fichasCache.filter(f => f.id !== id);
            } catch (e) { this._handlePrivateError(e, session);
                console.error("Error eliminando ficha clienta:", e);
            }
        } else {
            this._fichasCache = this._fichasCache.filter(f => f.id !== id);
        }
    },

    // --- Clientas Globales y CRM ---
    getClients: function () {
        return this._hasPrivateSession() ? JSON.parse(localStorage.getItem('nicolett_clients') || '[]') : [];
    },
    saveClients: function (clients) {
        if (!this._hasPrivateSession()) return;
        localStorage.setItem('nicolett_clients', JSON.stringify(clients));
    },
    addClient: function (client) {
        const clients = this.getClients();
        const normEmail = (client.email || '').toString().trim().toLowerCase();
        const cleanPhone = (client.phone || '').toString().replace(/\D/g, '');

        // Evitar duplicar clientas en el listado CRM
        const existingIndex = clients.findIndex(c => {
            if (normEmail && c.email && c.email.toString().trim().toLowerCase() === normEmail) return true;
            if (cleanPhone && cleanPhone.length >= 8 && c.phone && c.phone.toString().replace(/\D/g, '').endsWith(cleanPhone.slice(-8))) return true;
            return false;
        });

        if (existingIndex !== -1) {
            clients[existingIndex] = {
                ...clients[existingIndex],
                ...client,
                id: clients[existingIndex].id
            };
            this.saveClients(clients);
            return clients[existingIndex];
        }

        client.id = client.id || ('client_' + Date.now());
        clients.push(client);
        this.saveClients(clients);
        return client;
    },
    updateClient: function (updatedClient) {
        let clients = this.getClients();
        const index = clients.findIndex(c => c.id === updatedClient.id);
        if (index !== -1) {
            clients[index] = updatedClient;
            this.saveClients(clients);
        }
    },
    deleteClient: function (id) {
        let clients = this.getClients();
        clients = clients.filter(c => c.id !== id);
        this.saveClients(clients);
    },

    // Personalización del dispositivo: no consulta ni crea perfiles privados.
    getOrCreateClientProfile: async function (rawEmail, rawName, rawPhone) {
        const clean = value => typeof value === 'string' ? value.trim() : '';
        const profile = { id: null, name: clean(rawName) || 'Clienta',
            email: clean(rawEmail).toLowerCase(), phone: clean(rawPhone), isExisting: false };
        localStorage.setItem('nicolett_personalization', JSON.stringify({
            name: profile.name, email: profile.email, phone: profile.phone
        }));
        return profile;
    },

    // --- Configuración de Flow (Pasarela de Pago de Abonos) ---
    getFlowConfig: function () {
        localStorage.removeItem('nicolett_flow_config');
        return { flowUrl: '', backendUrl: window.location.origin };
    },
    saveFlowConfig: async function () {
        throw new Error('Configura Flow mediante variables de entorno del servidor.');
    }

};

StorageHelper.init();

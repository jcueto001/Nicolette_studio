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
        if (raw) return JSON.parse(raw);
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

    // Profesionales
    professionals: _cachedProfessionals || [
        { id: 'p1', name: 'Nicolett', email: 'nicolette@gmail.com', role: 'admin', specialty: 'Especialista Integral & Fundadora', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
        { id: 'p2', name: 'Camila', email: 'camila@gmail.com', role: 'profesional', specialty: 'Manicura & Mirada', avatar: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=150&q=80' },
        { id: 'p3', name: 'Priscila Villarreal', email: 'priscila@gmail.com', role: 'profesional', specialty: 'Podología Clínica (ROL MINSAL 164959)', avatar: 'https://images.unsplash.com/photo-1594824813583-0599a80b064c?auto=format&fit=crop&w=150&q=80' }
    ],

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

    init: async function () {
        if (!localStorage.getItem('nicolett_appointments')) {
            localStorage.setItem('nicolett_appointments', JSON.stringify([]));
        }
        await this.loadAppointmentsCache();

        if (!localStorage.getItem('nicolett_user')) {
            localStorage.setItem('nicolett_user', JSON.stringify({
                name: 'Cliente Prueba',
                phone: '+56912345678',
                email: 'cliente@test.com'
            }));
        }
        if (!localStorage.getItem('nicolett_auth')) {
            localStorage.setItem('nicolett_auth', JSON.stringify({ loggedIn: false, user: null }));
        }

        // Sincronizar estado de autenticación con Firebase
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    const profs = this.getProfessionals();
                    const prof = profs.find(p => p.email === user.email) || { id: 'p_unknown', name: 'Admin', role: 'admin' };
                    localStorage.setItem('nicolett_auth', JSON.stringify({ loggedIn: true, user: prof }));

                    const btnLogout = document.getElementById('btn-logout');
                    if (btnLogout) btnLogout.style.display = 'block';

                    // Si ya estamos en admin, refrescar la vista para mostrar los datos
                    this._refreshAdminIfSafe();
                } else {
                        const currentAuth = this.getAuth();
                        if (!currentAuth || !currentAuth.loggedIn) {
                            localStorage.setItem('nicolett_auth', JSON.stringify({ loggedIn: false, user: null }));
                        }
                        // NOTA: NO forzar redirección a 'home' para que el usuario pueda ver el formulario de login del portal
                    }
                    if (typeof window.updateNavAuthVisibility === 'function') {
                        window.updateNavAuthVisibility();
                    }
                });
        }

        if (!localStorage.getItem('nicolett_gallery_v2')) {
            localStorage.setItem('nicolett_gallery_v2', JSON.stringify(mockData.gallery));
        }
        if (!localStorage.getItem('nicolett_clients')) {
            localStorage.setItem('nicolett_clients', JSON.stringify(mockData.clients));
        }
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

    loadAppointmentsCache: async function () {
        if (typeof db === 'undefined') return;

        try {
            const querySnapshot = await db.collection("Citas").get();
            const appointments = [];
            const seenKeys = new Set();
            const duplicateDocIds = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const appt = { id: doc.id, ...data };
                const key = this._getAppointmentKey(appt);

                if (key && seenKeys.has(key)) {
                    console.warn(`[StorageHelper] Cita duplicada detectada: ${doc.id} (clave: ${key}). Omitiendo.`);
                    duplicateDocIds.push(doc.id);
                } else {
                    if (key) seenKeys.add(key);
                    appointments.push(appt);
                }
            });

            this._appointmentsCache = appointments;

            // Limpieza pasiva de citas duplicadas en Firestore si se encontraron (para sanar la base de datos)
            if (duplicateDocIds.length > 0) {
                console.log(`[StorageHelper] Limpiando ${duplicateDocIds.length} citas duplicadas en Firestore...`);
                duplicateDocIds.forEach(dupId => {
                    db.collection("Citas").doc(dupId).delete().catch(err => {
                        console.warn(`[StorageHelper] Error al eliminar duplicado ${dupId}:`, err);
                    });
                });
            }
        } catch (e) { console.error("Error cargando appointments:", e); }

        try {
            let fichasSnapshot = await db.collection("FichasClientas").get();
            // Fallback si la colección anterior FichasClinicas contiene datos históricos
            if (fichasSnapshot.empty) {
                try {
                    const legacySnap = await db.collection("FichasClinicas").get();
                    if (!legacySnap.empty) fichasSnapshot = legacySnap;
                } catch (err) { }
            }
            const fichas = [];
            fichasSnapshot.forEach((doc) => {
                fichas.push({ id: doc.id, ...doc.data() });
            });
            this._fichasCache = fichas;
        } catch (e) { console.error("Error cargando fichas clientas:", e); }

        try {
            const profsSnapshot = await db.collection("Profesionales").get();
            const profs = [];
            profsSnapshot.forEach((doc) => {
                profs.push({ id: doc.id, ...doc.data() });
            });
            this._professionalsCache = profs.length > 0 ? profs : [...mockData.professionals];
            try { localStorage.setItem('nicolett_professionals_cache', JSON.stringify(this._professionalsCache)); } catch (e) {}
            // Asegurar que profesionales base (incluyendo podóloga clínica Priscila Villarreal) estén disponibles
            mockData.professionals.forEach(dp => {
                if (!this._professionalsCache.some(p => p.email === dp.email || p.id === dp.id)) {
                    this._professionalsCache.push(dp);
                }
            });
        } catch (e) {
            console.error("Error cargando profesionales:", e);
            if (this._professionalsCache.length === 0) this._professionalsCache = mockData.professionals;
        }

        try {
            const invSnapshot = await db.collection("Inventario").get();
            const inv = [];
            invSnapshot.forEach((doc) => {
                inv.push({ id: doc.id, ...doc.data() });
            });
            this._inventoryCache = inv.length > 0 ? inv : mockData.inventory;

            if (inv.length === 0 && typeof db !== 'undefined') {
                for (const item of mockData.inventory) {
                    const docData = { ...item };
                    delete docData.id;
                    try {
                        await db.collection("Inventario").doc(item.id).set(docData);
                    } catch (err) { console.error("Error inicializando inventario en FB:", err); }
                }
            }
        } catch (e) {
            console.error("Error cargando inventario:", e);
            if (this._inventoryCache.length === 0) this._inventoryCache = mockData.inventory;
        }

        try {
            const galSnapshot = await db.collection("Galeria").get();
            if (!galSnapshot.empty) {
                const currentGallery = this.getGallery();
                const existingIds = new Set(currentGallery.map(img => img.fbId || img.id));
                let addedAny = false;
                galSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (!existingIds.has(doc.id)) {
                        currentGallery.unshift({
                            id: doc.id,
                            fbId: doc.id,
                            ...data
                        });
                        addedAny = true;
                    }
                });
                if (addedAny) {
                    localStorage.setItem('nicolett_gallery_v2', JSON.stringify(currentGallery));
                }
            }
        } catch (e) {
            console.warn("Firestore Galeria (usando fallback local):", e);
        }

        try {
            const flowDoc = await db.collection("Configuracion").doc("flow").get();
            if (flowDoc.exists) {
                this._flowConfigCache = flowDoc.data();
                localStorage.setItem('nicolett_flow_config', JSON.stringify(this._flowConfigCache));
            }
        } catch (e) {
            console.warn("Firestore Configuracion Flow:", e);
        }

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
        if (typeof db === 'undefined') return mockData.timeSlots;

        try {
            const querySnapshot = await db.collection("Citas")
                .where("date", "==", date)
                .get();

            const bookedTimes = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Bloquear si pertenece a la profesional (o a cualquier si es un bloqueo general, pero por simplicidad al profId o profName)
                // Chequeo laxo por profId o profName
                if (data.profId === profId || data.profesional === profId || data.profesional === this.getProfessionals().find(p => p.id === profId)?.name) {
                    if (data.status !== 'cancelada' && data.status !== 'no asiste') {
                        bookedTimes.push(data.time);
                    }
                }
            });

            return mockData.timeSlots.filter(t => !bookedTimes.includes(t));
        } catch (e) {
            console.error("Error obteniendo horas de Firebase:", e);
            return mockData.timeSlots;
        }
    },

    saveAppointment: async function (appointment) {
        appointment.status = appointment.status || 'confirmada';
        appointment.depositAmount = appointment.depositAmount || 5000;
        appointment.createdAt = new Date().toISOString(); // Fallback date

        const key = this._getAppointmentKey(appointment);

        // 1. Evitar duplicar en la memoria local si ya está presente
        if (key) {
            const existingIdx = this._appointmentsCache.findIndex(a => this._getAppointmentKey(a) === key);
            if (existingIdx >= 0) {
                console.warn("[StorageHelper] Cita ya presente en memoria local, actualizando:", this._appointmentsCache[existingIdx].id);
                this._appointmentsCache[existingIdx] = { ...this._appointmentsCache[existingIdx], ...appointment };
                return this._appointmentsCache[existingIdx];
            }
        }

        if (typeof db !== 'undefined') {
            try {
                // 2. Verificar en Firestore si ya existe un documento previo con la misma orden, token o slot
                let existingDocId = null;
                if (appointment.flowOrder || appointment.orderId || appointment.flowToken) {
                    const queries = [];
                    if (appointment.flowOrder) queries.push(db.collection("Citas").where("flowOrder", "==", appointment.flowOrder).limit(1).get());
                    if (appointment.orderId) queries.push(db.collection("Citas").where("orderId", "==", appointment.orderId).limit(1).get());
                    if (appointment.flowToken) queries.push(db.collection("Citas").where("flowToken", "==", appointment.flowToken).limit(1).get());

                    const snaps = await Promise.all(queries);
                    for (const snap of snaps) {
                        if (!snap.empty) {
                            existingDocId = snap.docs[0].id;
                            break;
                        }
                    }
                }

                if (!existingDocId && appointment.date && appointment.time) {
                    const snap = await db.collection("Citas")
                        .where("date", "==", appointment.date)
                        .where("time", "==", appointment.time)
                        .get();
                    snap.forEach(doc => {
                        const d = doc.data();
                        const matchProf = (d.profId === appointment.profId) || (d.profesional === appointment.profesional);
                        const matchClient = (d.clientEmail && d.clientEmail === appointment.clientEmail) ||
                            (d.clientPhone && d.clientPhone === appointment.clientPhone) ||
                            (d.clientName && d.clientName === appointment.clientName);
                        if (matchProf && matchClient && d.status !== 'cancelada') {
                            existingDocId = doc.id;
                        }
                    });
                }

                if (existingDocId) {
                    console.warn("[StorageHelper] Cita ya existe en Firestore con id:", existingDocId, "- Actualizando registro en vez de duplicar.");
                    appointment.id = existingDocId;
                    await db.collection("Citas").doc(existingDocId).set(appointment, { merge: true });
                    const idx = this._appointmentsCache.findIndex(a => a.id === existingDocId);
                    if (idx >= 0) {
                        this._appointmentsCache[idx] = { ...this._appointmentsCache[idx], ...appointment };
                    } else {
                        this._appointmentsCache.push(appointment);
                    }
                    return appointment;
                }

                // 3. Documento nuevo
                appointment.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await db.collection("Citas").add(appointment);
                appointment.id = docRef.id;
                this._appointmentsCache.push(appointment); // Update local cache
                return appointment;
            } catch (e) {
                console.error("Error guardando cita en Firebase (posible falta de permisos o reglas):", e);
                // Fallback to local storage if Firebase fails
                appointment.createdAt = new Date().toISOString(); // Reset to ISO string since serverTimestamp failed
                const appointments = JSON.parse(localStorage.getItem('nicolett_appointments') || '[]');
                appointment.id = 'appt_' + Date.now();
                appointments.push(appointment);
                localStorage.setItem('nicolett_appointments', JSON.stringify(appointments));
                this._appointmentsCache.push(appointment);
                return appointment;
            }
        } else {
            // Fallback to local storage if Firebase fails
            const appointments = JSON.parse(localStorage.getItem('nicolett_appointments') || '[]');
            appointment.id = 'appt_' + Date.now();
            appointments.push(appointment);
            localStorage.setItem('nicolett_appointments', JSON.stringify(appointments));
            this._appointmentsCache.push(appointment);
            return appointment;
        }
    },

    getUser: function () {
        return JSON.parse(localStorage.getItem('nicolett_user') || '{}');
    },

    saveUser: function (user) {
        localStorage.setItem('nicolett_user', JSON.stringify(user));
    },

    // Auth
    getAuth: function () {
        return JSON.parse(localStorage.getItem('nicolett_auth') || '{"loggedIn": false, "user": null}');
    },
    setAuth: function (authData) {
        localStorage.setItem('nicolett_auth', JSON.stringify(authData));
    },

    // Inventory
    getInventory: function () {
        return this._inventoryCache;
    },
    updateProductStock: async function (productId, amountUsed) {
        const inv = this.getInventory();
        const p = inv.find(x => x.id === productId);
        if (p && typeof db !== 'undefined') {
            p.stock = Math.max(0, p.stock - amountUsed);
            try {
                const docData = { ...p };
                delete docData.id;
                await db.collection("Inventario").doc(productId).set(docData, { merge: true });
            } catch (e) { console.error("Error updating stock", e); }
        }
    },
    updateProductStockDirect: async function (productId, newStock) {
        const inv = this.getInventory();
        const p = inv.find(x => x.id === productId);
        if (p) {
            p.stock = parseInt(newStock) || 0;
            if (typeof db !== 'undefined') {
                try {
                    const docData = { ...p };
                    delete docData.id;
                    await db.collection("Inventario").doc(productId).set(docData, { merge: true });
                } catch (e) { console.error("Error updating stock", e); }
            }
        }
    },
    addProduct: async function (product) {
        if (typeof db !== 'undefined') {
            try {
                const docRef = await db.collection("Inventario").add(product);
                product.id = docRef.id;
                this._inventoryCache.push(product);
                return product;
            } catch (e) { console.error("Error adding product", e); }
        }
    },

    updateAppointmentStatus: async function (id, newStatus) {
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Citas").doc(id).update({ status: newStatus });
                const appIdx = this._appointmentsCache.findIndex(a => a.id === id);
                if (appIdx > -1) {
                    this._appointmentsCache[appIdx].status = newStatus;
                }
            } catch (e) {
                console.error("Error updating appointment status", e);
            }
        }
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
        return this._professionalsCache;
    },
    addProfessional: async function (prof) {
        if (!prof.id) {
            prof.id = 'p_' + Date.now();
        }
        if (typeof db !== 'undefined') {
            try {
                const docRef = await db.collection("Profesionales").add(prof);
                prof.id = docRef.id;
            } catch (e) {
                console.error("Error adding professional to Firestore", e);
            }
        }
        this._professionalsCache.push(prof);
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache));
        } catch (e) { }
        return prof;
    },
    updateProfessional: async function (id, data) {
        const profIdx = this._professionalsCache.findIndex(p => p.id === id);
        if (profIdx > -1) {
            this._professionalsCache[profIdx] = { ...this._professionalsCache[profIdx], ...data };
        }
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Profesionales").doc(id).set(data, { merge: true });
            } catch (e) {
                console.error("Error updating professional in Firestore", e);
            }
        }
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache));
        } catch (e) { }
        return this._professionalsCache[profIdx];
    },
    deleteProfessional: async function (id) {
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Profesionales").doc(id).delete();
            } catch (e) { console.error("Error deleting professional", e); }
        }
        this._professionalsCache = this._professionalsCache.filter(p => p.id !== id);
        try {
            localStorage.setItem('nicolett_local_professionals', JSON.stringify(this._professionalsCache));
        } catch (e) { }
    },

    // Staff Passwords Storage (para soporte offline y creación local de contraseñas)
    getStaffPasswords: function () {
        try {
            return JSON.parse(localStorage.getItem('nicolett_staff_passwords') || '{}');
        } catch (e) {
            return {};
        }
    },
    setStaffPassword: function (email, password) {
        if (!email || !password) return;
        const passes = this.getStaffPasswords();
        passes[email.trim().toLowerCase()] = password;
        try {
            localStorage.setItem('nicolett_staff_passwords', JSON.stringify(passes));
        } catch (e) { }
    },
    verifyStaffPassword: function (email, password) {
        if (!email || !password) return false;
        const normEmail = email.trim().toLowerCase();
        const passes = this.getStaffPasswords();
        const stored = passes[normEmail];
        if (stored && stored === password) return true;
        const validDefaults = ['admin123', '123456', 'Nicolett123!'];
        return validDefaults.includes(password);
    },

    // --- Gallery ---
    getGallery: function () {
        const stored = localStorage.getItem('nicolett_gallery_v2');
        if (stored) {
            try {
                const list = JSON.parse(stored);
                // Asegurar que las fotos iniciales tengan profesional si no lo tenían
                let changed = false;
                list.forEach(item => {
                    if (!item.profesional) {
                        const defaultMatch = mockData.gallery.find(d => d.id === item.id || d.title === item.title);
                        if (defaultMatch) {
                            item.profesional = defaultMatch.profesional || 'Nicolett Studio';
                            item.profId = defaultMatch.profId || '';
                            changed = true;
                        }
                    }
                });
                if (changed) {
                    localStorage.setItem('nicolett_gallery_v2', JSON.stringify(list));
                }
                return list;
            } catch (e) { }
        }

        // Inicializar con fotos aprobadas por defecto del estudio
        const initial = mockData.gallery.map(g => ({
            ...g,
            source: 'admin',
            approved: true,
            status: 'approved'
        }));
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(initial));
        return initial;
    },

    // Galería pública (solo fotos del estudio o fotos de clientas APROBADAS)
    getPublicGallery: function () {
        const gallery = this.getGallery();
        return gallery.filter(img => {
            // Si es de clienta, solo si está aprobada
            if (img.source === 'client') {
                return img.approved === true || img.status === 'approved';
            }
            // Si es de estudio/admin, visible por defecto a menos que se oculte explícitamente
            return img.approved !== false && img.status !== 'hidden';
        });
    },

    getClientGallery: function (email) {
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
        const gallery = this.getGallery();
        imageObj.id = imageObj.id || ('g' + Date.now());
        imageObj.timestamp = imageObj.timestamp || Date.now();
        imageObj.date = imageObj.date || new Date().toLocaleDateString('es-CL');
        imageObj.profesional = imageObj.profesional || '';
        imageObj.profId = imageObj.profId || '';

        // Si la foto es subida por una clienta, queda PENDIENTE de aprobación
        const isClient = imageObj.source === 'client';
        imageObj.approved = isClient ? (imageObj.approved === true) : true;
        imageObj.status = isClient ? (imageObj.status || (imageObj.approved ? 'approved' : 'pending')) : 'approved';

        gallery.unshift(imageObj); // Agregar al principio
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(gallery));

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
                imageObj.fbId = docRef.id;
            } catch (e) {
                console.warn("Firestore Galeria add error (usando local):", e);
            }
        }

        return imageObj;
    },

    // Aprobar o Desaprobar/Ocultar foto en Galería Pública (Solo Administradora)
    setGalleryImageApproval: async function (id, approved) {
        const gallery = this.getGallery();
        const img = gallery.find(item => item.id === id || item.fbId === id);
        if (!img) return null;

        img.approved = !!approved;
        img.status = approved ? 'approved' : 'pending';
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(gallery));

        if (typeof db !== 'undefined') {
            try {
                const docId = img.fbId || (img.id && !img.id.startsWith('g') ? img.id : null);
                if (docId) {
                    await db.collection("Galeria").doc(docId).set({
                        approved: img.approved,
                        status: img.status
                    }, { merge: true });
                }
            } catch (e) {
                console.warn("Firestore Galeria update approval error:", e);
            }
        }
        return img;
    },

    deleteGalleryImage: async function (id) {
        let gallery = this.getGallery();
        const imgToDelete = gallery.find(img => img.id === id || img.fbId === id);
        gallery = gallery.filter(img => img.id !== id && img.fbId !== id);
        localStorage.setItem('nicolett_gallery_v2', JSON.stringify(gallery));

        if (typeof db !== 'undefined' && imgToDelete) {
            try {
                const docId = imgToDelete.fbId || (imgToDelete.id && !imgToDelete.id.startsWith('g') ? imgToDelete.id : null);
                if (docId) {
                    await db.collection("Galeria").doc(docId).delete();
                }
            } catch (e) {
                console.warn("Firestore Galeria delete error:", e);
            }
        }
    },

    // Fichas Clientas
    getFichas: function () {
        return this._fichasCache || [];
    },
    saveFicha: async function (ficha) {
        if (typeof db !== 'undefined') {
            try {
                ficha.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = await db.collection("FichasClientas").add(ficha);
                ficha.id = docRef.id;
                this._fichasCache.push(ficha);
            } catch (e) {
                console.error("Error guardando ficha clienta en Firebase (posible falta de permisos o reglas):", e);
                // Fallback
                ficha.id = 'ficha_' + Date.now();
                ficha.createdAt = new Date().toISOString();
                this._fichasCache.push(ficha);
            }
        } else {
            // Fallback
            ficha.id = 'ficha_' + Date.now();
            this._fichasCache.push(ficha);
        }
    },
    deleteFicha: async function (id) {
        if (typeof db !== 'undefined') {
            try {
                await db.collection("FichasClientas").doc(id).delete();
                try { await db.collection("FichasClinicas").doc(id).delete(); } catch (err) { }
                this._fichasCache = this._fichasCache.filter(f => f.id !== id);
            } catch (e) {
                console.error("Error eliminando ficha clienta:", e);
            }
        } else {
            this._fichasCache = this._fichasCache.filter(f => f.id !== id);
        }
    },

    // --- Clientas Globales y CRM ---
    getClients: function () {
        return JSON.parse(localStorage.getItem('nicolett_clients') || '[]');
    },
    saveClients: function (clients) {
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

    // --- Gestión de Perfil de Clienta (Autenticación e Historial) ---
    getOrCreateClientProfile: async function (rawEmail, rawName, rawPhone) {
        const email = (rawEmail || '').toString().trim().toLowerCase();
        let name = (rawName || '').toString().trim();
        let phone = (rawPhone || '').toString().trim();

        if (!email) {
            throw new Error('El correo electrónico es requerido.');
        }

        let existingDoc = null;
        let existingDocId = null;

        if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
            try {
                // 1. Buscar en perfil_cliente por correo normalizado en minúsculas
                let snapshot = await db.collection('perfil_cliente').where('email', '==', email).get();

                // 2. Si no se encontró por minúsculas, probar con el texto original sin modificar mayúsculas
                if (snapshot.empty && rawEmail && rawEmail.trim() !== email) {
                    snapshot = await db.collection('perfil_cliente').where('email', '==', rawEmail.trim()).get();
                }

                // 3. Fallback de búsqueda case-insensitive recorriendo los perfiles si aún no se encuentra
                if (snapshot.empty) {
                    const allSnap = await db.collection('perfil_cliente').get();
                    allSnap.forEach(doc => {
                        const data = doc.data();
                        if (!existingDoc && data.email && data.email.toString().trim().toLowerCase() === email) {
                            existingDoc = data;
                            existingDocId = doc.id;
                        }
                    });
                } else {
                    const doc = snapshot.docs[0];
                    existingDoc = doc.data();
                    existingDocId = doc.id;
                }
            } catch (err) {
                console.warn('[StorageHelper] Error consultando perfil_cliente en Firestore:', err);
            }
        }

        // Si el perfil ya existe en Firestore
        if (existingDoc && existingDocId) {
            console.log(`[StorageHelper] Perfil existente encontrado en Firestore (ID: ${existingDocId}) para ${email}. No se creará duplicado.`);
            const finalName = name || existingDoc.name || 'Clienta';
            const finalPhone = phone || existingDoc.phone || '';

            // Actualización no destructiva en Firestore si se aportó nombre o teléfono
            if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
                const updates = { email: email };
                if (name && (!existingDoc.name || existingDoc.name === 'Clienta')) updates.name = name;
                if (phone && !existingDoc.phone) updates.phone = phone;

                try {
                    await db.collection('perfil_cliente').doc(existingDocId).set(updates, { merge: true });
                } catch (e) { }
            }

            const profile = {
                id: existingDocId,
                name: finalName,
                email: email,
                phone: finalPhone,
                isExisting: true
            };

            localStorage.setItem('nicolett_personalization', JSON.stringify({
                name: profile.name,
                email: profile.email,
                phone: profile.phone
            }));

            return profile;
        }

        // Si NO existe en perfil_cliente, buscar si tiene citas agendadas previas para rescatar su nombre
        const clientAppts = this.getClientAppointments(email, phone);
        if (!name && clientAppts.length > 0 && clientAppts[0].clientName) {
            name = clientAppts[0].clientName.trim();
        }
        if (!phone && clientAppts.length > 0 && clientAppts[0].clientPhone) {
            phone = clientAppts[0].clientPhone.trim();
        }

        const finalName = name || 'Clienta';
        const finalPhone = phone || '';

        // Crear registro único en Firestore
        let newDocId = 'cli_' + Date.now();
        if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
            try {
                const newDocRef = await db.collection('perfil_cliente').add({
                    name: finalName,
                    email: email,
                    phone: finalPhone,
                    createdAt: (typeof firebase !== 'undefined' && firebase.firestore)
                        ? firebase.firestore.FieldValue.serverTimestamp()
                        : new Date().toISOString()
                });
                newDocId = newDocRef.id;
                console.log(`[StorageHelper] Nuevo perfil_cliente creado en Firestore con ID: ${newDocId} para ${email}.`);
            } catch (err) {
                console.error('[StorageHelper] Error creando perfil_cliente:', err);
            }
        }

        const profile = {
            id: newDocId,
            name: finalName,
            email: email,
            phone: finalPhone,
            isExisting: false
        };

        localStorage.setItem('nicolett_personalization', JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone
        }));

        return profile;
    },

    // --- Configuración de Flow (Pasarela de Pago de Abonos) ---
    getFlowConfig: function () {
        if (this._flowConfigCache) return this._flowConfigCache;
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
        const defaultBackend = isLocal ? 'http://localhost:3000' : (typeof window !== 'undefined' ? window.location.origin : '');
        const def = {
            flowUrl: '',
            apiKey: '',
            secretKey: '',
            backendUrl: defaultBackend,
            isSandbox: true
        };
        try {
            const stored = localStorage.getItem('nicolett_flow_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.flowUrl && parsed.flowUrl.includes('abono5000')) {
                    parsed.flowUrl = '';
                }
                // Si estamos en Vercel/producción y quedó guardado localhost:3000, usar el dominio actual
                if (!isLocal && (!parsed.backendUrl || parsed.backendUrl.includes('localhost') || parsed.backendUrl.includes('127.0.0.1'))) {
                    parsed.backendUrl = defaultBackend;
                }
                this._flowConfigCache = { ...def, ...parsed };
            } else {
                this._flowConfigCache = def;
            }
        } catch (e) {
            this._flowConfigCache = def;
        }
        return this._flowConfigCache;
    },

    saveFlowConfig: async function (cfg) {
        this._flowConfigCache = cfg;
        localStorage.setItem('nicolett_flow_config', JSON.stringify(cfg));
        if (typeof db !== 'undefined') {
            try {
                await db.collection("Configuracion").doc("flow").set(cfg, { merge: true });
            } catch (e) {
                console.error("Error guardando configuración de Flow en Firestore:", e);
            }
        }
        return cfg;
    }
};

StorageHelper.init();

/**
 * Inicialización principal y manejo de eventos específicos por vista
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Iconos
    if (window.lucide) {
        lucide.createIcons();
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navLinks.classList.toggle('show');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon && window.lucide) {
                icon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
                lucide.createIcons();
            }
        });

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('show') && !navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon && window.lucide) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            }
        });

        // Cerrar menú al hacer clic en un link
        navLinks.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('click', () => {
                navLinks.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon && window.lucide) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            });
        });
    }

    // Iniciar Router
    AppRouter.init();

    // Iniciar Personalizacion
    setupPersonalization();

    // Iniciar Modal de Foto de Clienta
    setupClientPhotoModal();

    // Revisar retorno de pago de Flow
    checkFlowPaymentReturn();

    // Botón de salir del portal (Navbar)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            window.handleGlobalLogout();
        });
    }
});

// --- Manejo de Retorno de Pasarela Flow ---
function checkFlowPaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'flow-success') {
        const pendingStr = sessionStorage.getItem('nicolett_pending_booking') || localStorage.getItem('nicolett_pending_booking');
        if (pendingStr) {
            try {
                const app = JSON.parse(pendingStr);
                app.status = 'confirmada';
                app.paymentStatus = 'pagado';
                app.depositAmount = 5000;
                app.flowToken = params.get('token') || '';
                app.flowOrder = params.get('order') || '';
                app.paymentMethod = app.paymentMethod || 'Flow (Webpay Plus)';

                StorageHelper.saveAppointment(app);
                sessionStorage.removeItem('nicolett_pending_booking');
                localStorage.removeItem('nicolett_pending_booking');

                // Enviar confirmación por EmailJS si está configurado
                if (typeof emailjs !== 'undefined' && app.clientEmail) {
                    try {
                        emailjs.send("service_rmc9mu9", "template_2h2ya38", {
                            to_name: app.clientName,
                            to_email: app.clientEmail,
                            service: app.servicio,
                            date: app.date,
                            time: app.time,
                            profesional: app.profesional,
                            deposit: '$5.000 (Vía Flow)',
                            balance: "$" + (app.balanceDue || 0).toLocaleString('es-CL')
                        });
                    } catch (err) {
                        console.log("EmailJS error:", err);
                    }
                }

                // Limpiar la URL sin recargar
                window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);

                // Mostrar modal de éxito
                setTimeout(() => {
                    const balanceNotice = document.getElementById('success-balance-notice');
                    if (balanceNotice) {
                        const bal = app.balanceDue || 0;
                        balanceNotice.innerHTML = `
                            <div style="font-weight:700; color:#1b5e20; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                                <i data-lucide="check-circle" style="width:18px; height:18px; color:#2e7d32;"></i>
                                ¡Abono de $5.000 recibido exitosamente vía Flow!
                            </div>
                            <div style="font-size:0.88rem; color:#2e7d32; line-height:1.4;">
                                Cita confirmada para <strong>${app.clientName}</strong> con <strong>${app.profesional}</strong> el <strong>${app.date}</strong> a las <strong>${app.time}</strong>.<br>
                                Saldo restante en el estudio: <strong>$${bal.toLocaleString('es-CL')}</strong>.
                            </div>
                        `;
                    }
                    const successModal = document.getElementById('success-modal');
                    if (successModal) {
                        successModal.style.display = 'flex';
                        if (window.lucide) lucide.createIcons();
                    } else {
                        alert(`✨ ¡Excelente! Tu abono de $5.000 vía Flow fue recibido con éxito.\nTu cita de ${app.servicio} para el ${app.date} a las ${app.time} ha quedado confirmada.`);
                    }
                }, 400);
            } catch (e) {
                console.error("Error confirmando retorno Flow:", e);
            }
        }
    } else if (action === 'flow-failed') {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        setTimeout(() => {
            alert('⚠️ El pago en Flow no fue completado o fue rechazado.\nPuedes volver a intentar reservar tu cita cuando lo desees.');
        }, 400);
    } else if (action === 'flow-cancelled') {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        setTimeout(() => {
            alert('ℹ️ Se canceló el proceso de pago en Flow.');
        }, 400);
    }
}

// --- Modal y Acceso Privado para Administradora y Trabajadoras ---
window.openAuthModal = function() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
        const emailInput = document.getElementById('auth-email');
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 100);
        }
    }
};

window.closeAuthModal = function() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
        const errorEl = document.getElementById('auth-error');
        if (errorEl) errorEl.style.display = 'none';
    }
};

// --- Control de Sesión y Visibilidad en Navegación ---
window.updateNavAuthVisibility = function() {
    const btnLogout = document.getElementById('btn-logout');
    const navPerfil = document.getElementById('nav-perfil');
    const navAdmin = document.getElementById('nav-admin');
    const navStaffDoor = document.getElementById('nav-staff-door');
    const authData = typeof StorageHelper !== 'undefined' ? StorageHelper.getAuth() : null;
    const isPersonalized = localStorage.getItem('nicolett_personalization');

    if (authData && authData.loggedIn) {
        if (btnLogout) {
            btnLogout.style.display = 'inline-block';
            btnLogout.title = 'Cerrar sesión del portal (' + (authData.user?.name || '') + ')';
        }
        if (navAdmin) {
            navAdmin.style.display = 'inline-block';
            const isAdm = authData.user?.role === 'admin';
            navAdmin.textContent = isAdm ? 'Portal Administradora' : `Portal Trabajadora (${authData.user?.name || 'Equipo'})`;
        }
        if (navStaffDoor) navStaffDoor.style.display = 'none';
    } else if (isPersonalized) {
        if (btnLogout) {
            btnLogout.style.display = 'inline-block';
            btnLogout.title = 'Cerrar sesión de mi perfil';
        }
        if (navAdmin) navAdmin.style.display = 'none';
        if (navStaffDoor) navStaffDoor.style.display = 'inline-flex';
    } else {
        if (btnLogout) btnLogout.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navStaffDoor) navStaffDoor.style.display = 'inline-flex';
    }

    if (navPerfil) {
        navPerfil.style.display = isPersonalized ? 'inline-block' : 'none';
    }
};

window.logoutStaff = async function() {
    if (confirm('¿Segura que deseas salir del panel de administración?')) {
        StorageHelper.setAuth({ loggedIn: false, user: null });
        if (typeof firebase !== 'undefined' && firebase.auth) {
            try { await firebase.auth().signOut(); } catch(e) {}
        }
        window.updateNavAuthVisibility();
        if (typeof AppRouter !== 'undefined') {
            AppRouter.navigate('home');
        }
    }
};

window.handleGlobalLogout = function() {
    const authData = typeof StorageHelper !== 'undefined' ? StorageHelper.getAuth() : null;
    if (authData && authData.loggedIn) {
        window.logoutStaff();
    } else if (localStorage.getItem('nicolett_personalization')) {
        window.logoutClientProfile();
    }
};

window.logoutClientProfile = function() {
    if (confirm('¿Estás segura de que deseas cerrar sesión de tu perfil?')) {
        localStorage.removeItem('nicolett_personalization');
        window.updateNavAuthVisibility();
        if (typeof AppRouter !== 'undefined') {
            AppRouter.navigate('home');
        }
    }
};

function setupPersonalization() {
    const modal = document.getElementById('personalize-modal');
    const form = document.getElementById('personalize-form');
    const navPerfil = document.getElementById('nav-perfil');

    window.updateNavAuthVisibility();

    const isPersonalized = localStorage.getItem('nicolett_personalization');
    const authData = typeof StorageHelper !== 'undefined' ? StorageHelper.getAuth() : null;

    // Si ya tiene sesión activa como administradora o trabajadora, NUNCA mostrar este popup
    if (authData && authData.loggedIn) {
        if (modal) modal.style.display = 'none';
        return;
    }

    if (!isPersonalized && modal) {
        setTimeout(() => {
            // No mostrar si está en el portal admin o ya inició sesión
            if (typeof AppRouter !== 'undefined' && AppRouter.currentRoute === 'admin') return;
            const currentAuth = typeof StorageHelper !== 'undefined' ? StorageHelper.getAuth() : null;
            if (currentAuth && currentAuth.loggedIn) return;

            modal.style.display = 'flex';
            modal.offsetHeight;
            modal.style.opacity = '1';
        }, 12000);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('personalize-name').value.trim();
            const email = document.getElementById('personalize-email').value.trim();
            const btn = form.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerText = 'Guardando...';

            try {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    const db = firebase.firestore();
                    const snapshot = await db.collection('perfil_cliente').where('email', '==', email).get();
                    if (snapshot.empty) {
                        await db.collection('perfil_cliente').add({
                            name: name,
                            email: email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }

                localStorage.setItem('nicolett_personalization', JSON.stringify({ name, email }));
                window.updateNavAuthVisibility();

                if (modal) modal.style.opacity = '0';
                setTimeout(() => {
                    if (modal) modal.style.display = 'none';
                    AppRouter.navigate('perfil');
                }, 500);
            } catch (error) {
                console.error('Error al guardar perfil:', error);
                alert('Hubo un problema al guardar tus datos, intenta de nuevo.');
                btn.disabled = false;
                btn.innerText = '¡Sí, personalizar!';
            }
        });
    }

    // --- Autenticación Compartida para Administradora y Trabajadoras ---
    window.authenticateStaffUser = async function(email, password) {
        let prof = null;

        if (typeof firebase !== 'undefined' && firebase.auth) {
            try {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;
                const userEmail = userCredential.user.email || email;

                let role = 'profesional';
                let userName = 'Colaboradora';

                try {
                    const db = firebase.firestore();
                    const userDoc = await db.collection('Usuarios').doc(uid).get();
                    if (userDoc.exists) {
                        const uData = userDoc.data();
                        const isAdm = (uData.rol === 'Admin' || uData.rol === 'admin');
                        role = isAdm ? 'admin' : 'profesional';
                        userName = uData.nombre || uData.name || (isAdm ? 'Nicolett' : 'Trabajadora');
                    } else {
                        const profs = StorageHelper.getProfessionals();
                        const found = profs.find(p => p.email && p.email.toLowerCase() === userEmail.toLowerCase());
                        if (found) {
                            role = found.role || 'profesional';
                            userName = found.name || 'Colaboradora';
                        } else if (userEmail.toLowerCase().includes('nicolette') || userEmail.toLowerCase().includes('admin')) {
                            role = 'admin';
                            userName = 'Nicolett';
                        }
                    }
                } catch (docErr) {
                    console.warn("No se pudo leer colección Usuarios:", docErr);
                }

                prof = {
                    id: uid,
                    name: userName,
                    email: userEmail,
                    role: role
                };
            } catch (fbAuthErr) {
                console.warn("Firebase Auth falló, verificando credenciales locales:", fbAuthErr);
                const profs = StorageHelper.getProfessionals();
                const localFound = profs.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
                const validPasswords = ['admin123', '123456', 'Nicolett123!'];
                if (localFound && validPasswords.includes(password)) {
                    prof = {
                        id: localFound.id || 'p_local',
                        name: localFound.name,
                        email: localFound.email,
                        role: localFound.role || 'profesional'
                    };
                } else if (email.toLowerCase() === 'nicolette@gmail.com' && validPasswords.includes(password)) {
                    prof = {
                        id: 'p1',
                        name: 'Nicolett',
                        email: 'nicolette@gmail.com',
                        role: 'admin'
                    };
                } else {
                    throw fbAuthErr;
                }
            }
        } else {
            const profs = StorageHelper.getProfessionals();
            const localFound = profs.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
            if (localFound) {
                prof = {
                    id: localFound.id || 'p_local',
                    name: localFound.name,
                    email: localFound.email,
                    role: localFound.role || 'profesional'
                };
            } else {
                throw new Error("Credenciales inválidas.");
            }
        }

        return prof;
    };

    // Disparador 1: Enlace discreto en el pie de página (footer)
    const linkPortalOculto = document.getElementById('link-portal-oculto');
    if (linkPortalOculto) {
        linkPortalOculto.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof AppRouter !== 'undefined') {
                AppRouter.navigate('admin');
            }
        });
    }

    // Disparador 2: Clic directo en el monograma del logo "NS"
    const logoSecret = document.getElementById('logo-icon-secret');
    if (logoSecret) {
        logoSecret.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof AppRouter !== 'undefined') {
                AppRouter.navigate('admin');
            }
        });
    }

    // Disparador 3: Atajo secreto de teclado (Ctrl + Shift + A o Alt + A)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
            e.preventDefault();
            if (typeof AppRouter !== 'undefined') {
                AppRouter.navigate('admin');
            }
        }
    });

    // Formulario modal opcional si se invoca
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value.trim();
            const password = document.getElementById('auth-password').value.trim();
            const errorEl = document.getElementById('auth-error');
            const btnLogin = document.getElementById('btn-login');

            errorEl.style.display = 'none';
            btnLogin.disabled = true;
            btnLogin.innerHTML = 'Ingresando...';

            try {
                const prof = await window.authenticateStaffUser(email, password);
                if (prof) {
                    StorageHelper.setAuth({ loggedIn: true, user: prof });
                    window.updateNavAuthVisibility();
                    window.closeAuthModal();
                    if (typeof AppRouter !== 'undefined') {
                        AppRouter.navigate('admin');
                    }
                }
            } catch (error) {
                console.error("Error Auth:", error);
                errorEl.innerText = error.message || 'Credenciales inválidas o error de conexión.';
                errorEl.style.display = 'block';
            } finally {
                btnLogin.disabled = false;
                btnLogin.innerHTML = 'Ingresar al Portal';
            }
        });
    }

    // Restaurar estado visual del botón salir y portal admin
    window.updateNavAuthVisibility();
}

// --- Eventos de Home ---
function initHomeEvents() {
    // Ya no hay perfiles dinámicos; el carrusel es estático.
}

// --- Eventos de Agendamiento ---
// Estado global del flujo de reserva actual
const bookingState = {
    serviceId: null,
    profId: null,
    date: null,
    time: null,
    needs: { kids: false, time: false, event: false },
    notes: ''
};

function initAgendarEvents() {
    // Navegación de pasos
    const showStep = (stepNumber) => {
        document.querySelectorAll('.booking-step').forEach(el => el.style.display = 'none');
        document.getElementById(`booking-step-${stepNumber}`).style.display = 'block';

        // Update circles
        document.querySelectorAll('.step-circle').forEach((el, index) => {
            if (index + 1 <= stepNumber) {
                el.style.background = 'var(--clr-rose-gold)';
                el.style.color = 'white';
            } else {
                el.style.background = 'var(--clr-nude)';
                el.style.color = 'var(--clr-neutral-gray)';
            }
        });
    };

    // Step 1: Services
    const serviceCards = document.querySelectorAll('.service-select-card');
    const btnNext1 = document.getElementById('btn-next-1');

    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => c.style.borderColor = 'transparent');
            card.style.borderColor = 'var(--clr-rose-gold)';
            bookingState.serviceId = card.getAttribute('data-service-id');
            btnNext1.disabled = false;
        });
    });

    btnNext1?.addEventListener('click', () => {
        // Re-render prof-grid just in case data loaded late
        const profGrid = document.querySelector('.prof-grid');
        const btnNext2 = document.getElementById('btn-next-2');
        if (profGrid) {
            const professionals = StorageHelper.getProfessionals();
            profGrid.innerHTML = professionals.map(p => `
                <div class="prof-select-card card text-center" data-prof-id="${p.id}" style="cursor: pointer; border: 2px solid transparent;">
                    <img src="${p.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}" alt="${p.name || 'Profesional'}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; object-fit: cover;">
                    <h4>${p.name || 'Sin Nombre'}</h4>
                </div>
            `).join('');

            // Re-bind events
            const profCards = document.querySelectorAll('.prof-select-card');
            profCards.forEach(card => {
                card.addEventListener('click', () => {
                    profCards.forEach(c => c.style.borderColor = 'transparent');
                    card.style.borderColor = 'var(--clr-rose-gold)';
                    bookingState.profId = card.getAttribute('data-prof-id');
                    if (btnNext2) btnNext2.disabled = false;
                });
            });
        }
        showStep(2);
    });

    // Step 2: Professional
    const btnNext2 = document.getElementById('btn-next-2');
    const btnPrev2 = document.getElementById('btn-prev-2');

    btnPrev2?.addEventListener('click', () => showStep(1));
    btnNext2?.addEventListener('click', () => {
        // Set min date to today
        const dateInput = document.getElementById('booking-date');
        const today = new Date().toISOString().split('T')[0];
        if (dateInput) {
            dateInput.min = today;
            if (!dateInput.value) dateInput.value = today;

            // Disparar evento change para cargar horas disponibles automáticamente
            const event = new Event('change');
            dateInput.dispatchEvent(event);
        }
        showStep(3);
    });

    // Step 3: Date & Time
    const dateInput = document.getElementById('booking-date');
    const timeSlotsGrid = document.getElementById('time-slots-container');
    const btnNext3 = document.getElementById('btn-next-3');
    const btnPrev3 = document.getElementById('btn-prev-3');

    // Simulate updating time slots on date change
    dateInput?.addEventListener('change', async () => {
        bookingState.date = dateInput.value;
        bookingState.time = null;
        btnNext3.disabled = true;

        if (timeSlotsGrid && bookingState.profId && bookingState.date) {
            timeSlotsGrid.innerHTML = '<p>Buscando horas disponibles...</p>';
            const availableSlots = await StorageHelper.getAvailableTimeSlots(bookingState.date, bookingState.profId);

            if (availableSlots.length === 0) {
                timeSlotsGrid.innerHTML = '<p style="color:red; grid-column: 1/-1;">No hay horas disponibles para esta fecha. Por favor, selecciona otra.</p>';
            } else {
                timeSlotsGrid.innerHTML = availableSlots.map(time => `
                    <button class="time-slot-btn" data-time="${time}" style="padding: 10px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); background: white; cursor: pointer; transition: all 0.2s;">${time}</button>
                `).join('');

                // Re-bind click events for new buttons
                const newTimeSlots = timeSlotsGrid.querySelectorAll('.time-slot-btn');
                newTimeSlots.forEach(btn => {
                    btn.addEventListener('click', () => {
                        newTimeSlots.forEach(b => {
                            b.style.background = 'white';
                            b.style.color = 'var(--clr-neutral-dark)';
                        });
                        btn.style.background = 'var(--clr-rose-gold)';
                        btn.style.color = 'white';
                        bookingState.time = btn.getAttribute('data-time');

                        if (bookingState.date && bookingState.time) {
                            btnNext3.disabled = false;
                        }
                    });
                });
            }
        }
    });

    btnPrev3?.addEventListener('click', () => showStep(2));
    btnNext3?.addEventListener('click', () => {
        // Recoger necesidades
        bookingState.needs.kids = document.getElementById('check-kids')?.checked || false;
        bookingState.needs.time = document.getElementById('check-time')?.checked || false;
        bookingState.needs.event = document.getElementById('check-event')?.checked || false;
        bookingState.notes = document.getElementById('booking-notes')?.value || '';

        showStep(4);
    });

    // Step 4: Tus Datos
    const btnPrev4 = document.getElementById('btn-prev-4');
    const btnNext4 = document.getElementById('btn-next-4');
    const inputName = document.getElementById('client-name');
    const inputPhone = document.getElementById('client-phone');
    const inputEmail = document.getElementById('client-email');

    // Validate inputs for Step 4
    const validateStep4 = () => {
        const nameVal = inputName?.value.trim() || '';
        const phoneVal = inputPhone?.value.trim() || '';
        const emailVal = inputEmail?.value.trim() || '';

        // Validaciones
        const nameValid = nameVal.length >= 2; // Al menos 2 caracteres
        const digits = phoneVal.replace(/[^0-9]/g, '');
        const phoneValid = digits.length >= 8 && digits.length <= 15; // Que tenga entre 8 y 15 números reales
        const emailValid = !emailVal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal); // Vacío o formato correcto

        const errorName = document.getElementById('error-name');
        const errorPhone = document.getElementById('error-phone');
        const errorEmail = document.getElementById('error-email');

        // Feedback visual con los bordes y textos
        if (inputName) {
            if (!nameVal) {
                inputName.style.borderColor = 'var(--clr-nude)';
                if (errorName) errorName.innerText = '';
            } else if (nameValid) {
                inputName.style.borderColor = 'var(--clr-rose-gold)';
                if (errorName) errorName.innerText = '';
            } else {
                inputName.style.borderColor = 'red';
                if (errorName) errorName.innerText = 'Por favor, ingresa un nombre válido.';
            }
        }

        if (inputPhone) {
            if (!phoneVal) {
                inputPhone.style.borderColor = 'var(--clr-nude)';
                if (errorPhone) errorPhone.innerText = '';
            } else if (phoneValid) {
                inputPhone.style.borderColor = 'var(--clr-rose-gold)';
                if (errorPhone) errorPhone.innerText = '';
            } else {
                inputPhone.style.borderColor = 'red';
                if (errorPhone) errorPhone.innerText = 'El número debe tener al menos 8 dígitos.';
            }
        }

        if (inputEmail) {
            if (!emailVal || emailValid) {
                inputEmail.style.borderColor = emailVal ? 'var(--clr-rose-gold)' : 'var(--clr-nude)';
                if (errorEmail) errorEmail.innerText = '';
            } else {
                inputEmail.style.borderColor = 'red';
                if (errorEmail) errorEmail.innerText = 'El formato del correo es incorrecto (ej: nombre@correo.com).';
            }
        }

        // Habilitar botón solo si todo lo necesario es válido
        if (nameValid && phoneValid && emailValid) {
            btnNext4.disabled = false;
        } else {
            btnNext4.disabled = true;
        }
    };

    inputName?.addEventListener('input', validateStep4);
    inputPhone?.addEventListener('input', validateStep4);
    inputEmail?.addEventListener('input', validateStep4);

    // Auto-fill from personalization if exists
    const persStr = localStorage.getItem('nicolett_personalization');
    if (persStr) {
        try {
            const pers = JSON.parse(persStr);
            if (inputName && !inputName.value) inputName.value = pers.name || '';
            if (inputEmail && !inputEmail.value) inputEmail.value = pers.email || '';
            validateStep4();
        } catch (e) { }
    }

    btnPrev4?.addEventListener('click', () => showStep(3));
    btnNext4?.addEventListener('click', () => {
        bookingState.clientName = inputName.value.trim();
        bookingState.clientPhone = inputPhone.value.trim();
        bookingState.clientEmail = inputEmail?.value.trim() || '';

        // Llenar resumen final
        const s = mockData.services.find(x => x.id === bookingState.serviceId);
        const professionals = StorageHelper.getProfessionals();
        const p = professionals.find(x => x.id === bookingState.profId);

        const price = s ? s.price : 0;
        const abono = 5000;
        const balance = Math.max(0, price - abono);

        document.getElementById('summary-client').innerText = bookingState.clientName;
        document.getElementById('summary-service').innerText = s ? s.name : '';
        document.getElementById('summary-prof').innerText = p ? p.name : '';
        document.getElementById('summary-date').innerText = bookingState.date;
        document.getElementById('summary-time').innerText = bookingState.time;
        document.getElementById('summary-price').innerText = s ? `$${price.toLocaleString('es-CL')}` : '$0';
        
        const balanceEl = document.getElementById('summary-balance');
        if (balanceEl) {
            balanceEl.innerText = `$${balance.toLocaleString('es-CL')}`;
        }

        const modalServiceEl = document.getElementById('flow-modal-service');
        if (modalServiceEl) modalServiceEl.innerText = s ? s.name : '';
        const modalDatetimeEl = document.getElementById('flow-modal-datetime');
        if (modalDatetimeEl) modalDatetimeEl.innerText = `${bookingState.date} a las ${bookingState.time} con ${p ? p.name : 'especialista'}`;

        showStep(5);
    });

    // Step 5: Abono previo de $5.000 con Flow y Confirmación
    const btnPrev5 = document.getElementById('btn-prev-5');
    const btnConfirm = document.getElementById('btn-confirm-booking');

    btnPrev5?.addEventListener('click', () => showStep(4));

    btnConfirm?.addEventListener('click', async () => {
        const professionals = StorageHelper.getProfessionals();
        const prof = professionals.find(p => p.id === bookingState.profId);
        const service = mockData.services.find(s => s.id === bookingState.serviceId);
        const flowConfig = StorageHelper.getFlowConfig();

        // Guardar cita pendiente en sessionStorage
        const pendingBooking = {
            servicio: service ? service.name : bookingState.serviceId,
            profesional: prof ? prof.name : bookingState.profId,
            profId: bookingState.profId,
            serviceId: bookingState.serviceId,
            date: bookingState.date,
            time: bookingState.time,
            needs: bookingState.needs,
            notes: bookingState.notes,
            clientName: bookingState.clientName,
            clientPhone: bookingState.clientPhone,
            clientEmail: bookingState.clientEmail,
            totalPrice: service ? service.price : 0,
            depositAmount: 5000,
            balanceDue: service ? Math.max(0, service.price - 5000) : 0,
            paymentMethod: 'Flow',
            paymentStatus: 'pendiente',
            orderId: 'FLOW-' + Date.now()
        };
        sessionStorage.setItem('nicolett_pending_booking', JSON.stringify(pendingBooking));

        // Verificar si existe enlace externo de Flow configurado
        const externalOption = document.getElementById('flow-external-option');
        const btnOpenExternal = document.getElementById('btn-flow-open-gateway');
        const hasValidUrl = flowConfig.flowUrl && !flowConfig.flowUrl.includes('abono5000') && flowConfig.flowUrl.startsWith('http');

        if (externalOption) {
            externalOption.style.display = hasValidUrl ? 'block' : 'none';
        }
        if (btnOpenExternal && hasValidUrl) {
            btnOpenExternal.href = flowConfig.flowUrl;
        }

        // Configurar selección visual de medios de pago Flow
        document.querySelectorAll('.flow-method-label').forEach(label => {
            label.addEventListener('click', () => {
                document.querySelectorAll('.flow-method-label').forEach(l => {
                    l.style.borderColor = '#ddd';
                    l.style.background = '#fff';
                });
                label.style.borderColor = '#1b75bb';
                label.style.background = '#f4f9fd';
                const radio = label.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });

        // Mostrar modal de Flow
        const flowModal = document.getElementById('flow-checkout-modal');
        if (flowModal) {
            flowModal.style.display = 'flex';
            if (window.lucide) lucide.createIcons();
        }
    });

    // Cerrar modal de Flow
    const closeFlowBtn = document.getElementById('close-flow-modal');
    closeFlowBtn?.addEventListener('click', () => {
        const flowModal = document.getElementById('flow-checkout-modal');
        if (flowModal) flowModal.style.display = 'none';
    });

    // Procesar pago de abono en Flow
    const btnFlowProcess = document.getElementById('btn-flow-process-pay');
    btnFlowProcess?.addEventListener('click', async () => {
        btnFlowProcess.disabled = true;
        btnFlowProcess.innerHTML = '<i data-lucide="loader" class="lucide-spin" style="width:18px; height:18px;"></i> Conectando con Flow...';
        if (window.lucide) lucide.createIcons();

        const pendingStr = sessionStorage.getItem('nicolett_pending_booking');
        let appointmentData = pendingStr ? JSON.parse(pendingStr) : null;

        if (!appointmentData) {
            const professionals = StorageHelper.getProfessionals();
            const prof = professionals.find(p => p.id === bookingState.profId);
            const service = mockData.services.find(s => s.id === bookingState.serviceId);
            appointmentData = {
                servicio: service ? service.name : bookingState.serviceId,
                profesional: prof ? prof.name : bookingState.profId,
                profId: bookingState.profId,
                serviceId: bookingState.serviceId,
                date: bookingState.date,
                time: bookingState.time,
                needs: bookingState.needs,
                notes: bookingState.notes,
                clientName: bookingState.clientName,
                clientPhone: bookingState.clientPhone,
                clientEmail: bookingState.clientEmail,
                totalPrice: service ? service.price : 0,
                depositAmount: 5000,
                balanceDue: service ? Math.max(0, service.price - 5000) : 0,
                paymentMethod: 'Flow',
                orderId: 'FLOW-' + Date.now()
            };
            sessionStorage.setItem('nicolett_pending_booking', JSON.stringify(appointmentData));
        }

        const selectedMethod = document.querySelector('input[name="flow-method"]:checked')?.value || 'Webpay Plus';
        appointmentData.paymentMethod = `Flow (${selectedMethod})`;
        sessionStorage.setItem('nicolett_pending_booking', JSON.stringify(appointmentData));
        localStorage.setItem('nicolett_pending_booking', JSON.stringify(appointmentData));

        // Intentar crear pago real a través del backend Flow
        const flowConfig = StorageHelper.getFlowConfig();
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const defaultBackend = isLocal ? 'http://localhost:3000' : window.location.origin;
        let backendUrl = (flowConfig.backendUrl && (flowConfig.backendUrl !== 'http://localhost:3000' || isLocal)
            ? flowConfig.backendUrl
            : defaultBackend).replace(/\/+$/, '');
        // Limpiar sufijos /api o /api/... si fueron ingresados por error
        backendUrl = backendUrl.replace(/\/api(\/.*)?$/, '');

        try {
            console.log('[Flow] Solicitando orden de pago al backend:', `${backendUrl}/api/flow/create`);
            const payload = {
                clientEmail: appointmentData.clientEmail || 'cliente@estudio.cl',
                clientName: appointmentData.clientName || 'Clienta',
                orderId: appointmentData.orderId,
                amount: 5000,
                isSandbox: (flowConfig.isSandbox !== undefined) ? flowConfig.isSandbox : isLocal,
                returnUrl: window.location.href.split('?')[0]
            };
            if (flowConfig.apiKey) payload.apiKey = flowConfig.apiKey;
            if (flowConfig.secretKey) payload.secretKey = flowConfig.secretKey;

            const response = await fetch(`${backendUrl}/api/flow/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success && data.redirectUrl) {
                // Redirigir inmediatamente a la pasarela oficial de Flow
                console.log('[Flow] ¡Orden creada exitosamente! Redirigiendo a:', data.redirectUrl);
                window.location.href = data.redirectUrl;
                return; // Detiene la ejecución aquí; el usuario paga en Flow
            } else {
                console.error('[Flow] Error al crear pago en Flow:', data);
                if (flowConfig.flowUrl) {
                    window.location.href = flowConfig.flowUrl;
                    return;
                }
                let errorDetail = data.error || data.message || 'Error desconocido';
                if (typeof errorDetail === 'string' && errorDetail.includes('apiKey not found')) {
                    errorDetail = 'La API Key no coincide con el entorno de Flow seleccionado.\n\n' +
                        '• Si usas credenciales reales de Flow.cl: Ve al Panel de Administración > Configuración y DESMARCA "Usar entorno de pruebas Flow Sandbox".\n' +
                        '• Si estás probando: Verifica que tu API Key haya sido generada en https://sandbox.flow.cl (no en la web principal).';
                }
                alert(`⚠️ Error de Flow: ${errorDetail}\n\nPor favor verifica tu conexión y configuración.`);
                btnFlowProcess.disabled = false;
                btnFlowProcess.innerHTML = '<i data-lucide="shield-check" style="width:20px; height:20px;"></i> Pagar Abono de $5.000 y Agendar';
                if (window.lucide) lucide.createIcons();
                return;
            }
        } catch (fetchError) {
            console.warn('[Flow] Servidor backend no alcanzable:', fetchError.message);
            if (flowConfig.flowUrl) {
                window.location.href = flowConfig.flowUrl;
                return;
            }
            alert(`⚠️ No se pudo conectar con el servidor de pagos en ${backendUrl}.\n\nAsegúrate de tener iniciado el backend ejecutando "iniciar_backend.bat".`);
            btnFlowProcess.disabled = false;
            btnFlowProcess.innerHTML = '<i data-lucide="shield-check" style="width:20px; height:20px;"></i> Pagar Abono de $5.000 y Agendar';
            if (window.lucide) lucide.createIcons();
            return;
        }
    });
}



// --- Eventos de Admin ---
function initAdminEvents() {
    if (window.lucide) window.lucide.createIcons();

    const auth = StorageHelper.getAuth();
    if (!auth.loggedIn) {
        // Enlazar formulario de login integrado directamente en la página (sin popups)
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('admin-login-email').value.trim();
                const password = document.getElementById('admin-login-password').value.trim();
                const errorEl = document.getElementById('admin-login-error');
                const btnSubmit = document.getElementById('btn-admin-submit-login');

                errorEl.style.display = 'none';
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = 'Ingresando...';

                try {
                    const prof = await window.authenticateStaffUser(email, password);
                    if (prof) {
                        StorageHelper.setAuth({ loggedIn: true, user: prof });
                        window.updateNavAuthVisibility();
                        AppRouter.navigate('admin');
                    }
                } catch (err) {
                    console.error("Error Auth:", err);
                    errorEl.innerText = err.message || 'Credenciales inválidas o error de conexión.';
                    errorEl.style.display = 'block';
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i data-lucide="log-in" style="width:18px; height:18px;"></i> Ingresar al Portal';
                    if (window.lucide) lucide.createIcons();
                }
            });
        }
        return;
    }

    // Botón Salir del Panel Admin
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', (e) => {
            e.preventDefault();
            window.logoutStaff();
        });
    }

    // Pestañas (Tabs)
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.admin-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.borderBottomColor = 'transparent';
                t.style.color = 'var(--clr-neutral-gray)';
            });
            contents.forEach(c => c.style.display = 'none');

            tab.classList.add('active');
            tab.style.borderBottomColor = 'var(--clr-rose-gold)';
            tab.style.color = 'var(--clr-neutral-dark)';
            const targetId = tab.getAttribute('data-target');
            if (document.getElementById(targetId)) {
                document.getElementById(targetId).style.display = 'block';
            }
        });
    });

    // Selectores de estado de Citas
    const statusSelectors = document.querySelectorAll('.status-selector');
    statusSelectors.forEach(select => {
        // Inicializar color según el estado actual
        const val = select.value;
        if (val === 'cancelada' || val === 'no asiste') {
            select.style.background = '#ffebee';
            select.style.color = '#c62828';
        } else if (val === 'bloqueada') {
            select.style.background = '#eeeeee';
            select.style.color = '#616161';
        } else if (val === 'completada') {
            select.style.background = '#e3f2fd';
            select.style.color = '#1565c0';
        } else {
            select.style.background = '#e8f5e9';
            select.style.color = '#2e7d32';
        }

        select.addEventListener('change', async (e) => {
            const appId = e.target.getAttribute('data-appid');
            const newStatus = e.target.value;

            if (newStatus === 'cancelada' || newStatus === 'no asiste') {
                e.target.style.background = '#ffebee';
                e.target.style.color = '#c62828';
            } else if (newStatus === 'bloqueada') {
                e.target.style.background = '#eeeeee';
                e.target.style.color = '#616161';
            } else if (newStatus === 'completada') {
                e.target.style.background = '#e3f2fd';
                e.target.style.color = '#1565c0';
            } else {
                e.target.style.background = '#e8f5e9';
                e.target.style.color = '#2e7d32';
            }

            await StorageHelper.updateAppointmentStatus(appId, newStatus);

            // Si el estado cambia a confirmada, enviar email
            if (newStatus === 'confirmada' && typeof emailjs !== 'undefined') {
                const app = StorageHelper.getAppointments().find(a => a.id === appId);
                if (app && app.clientEmail) {
                    try {
                        // NOTA: Reemplaza "TEMPLATE_ID_CONFIRMACION" con el ID de la plantilla que crees
                        await emailjs.send("service_rmc9mu9", "template_pcxbtx3", {
                            to_name: app.clientName,
                            to_email: app.clientEmail,
                            service: app.servicio,
                            date: app.date,
                            time: app.time
                        });
                    } catch (err) {
                        console.log("EmailJS no configurado o falló: ", err);
                    }
                }
            }
        });
    });

    // Modal de Creación de Ficha
    const btnFichas = document.querySelectorAll('.btn-ficha');
    const fichaModal = document.getElementById('ficha-modal');
    const btnCloseFicha = document.getElementById('close-ficha');
    const formFicha = document.getElementById('form-ficha');
    const dynFields = document.getElementById('ficha-dynamic-fields');

    // Botón manual
    const btnCrearFichaManual = document.getElementById('btn-crear-ficha-manual');
    if (btnCrearFichaManual) {
        btnCrearFichaManual.addEventListener('click', () => {
            document.getElementById('ficha-appid').value = '';
            document.getElementById('ficha-client').value = '';
            document.getElementById('ficha-service').value = '';
            formFicha.reset();
            document.querySelectorAll('.ficha-prod-qty').forEach(input => input.disabled = true);
            dynFields.style.display = 'block'; // Mostrar siempre por si quieren agregar mapping manual
            dynFields.innerHTML = `
                <h4 style="margin-bottom:10px; font-size:1rem;">Mapping de Pestañas (Opcional)</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div>
                        <label style="font-size:0.9rem;">Ojo Izquierdo</label>
                        <input type="text" id="ficha-map-izq" placeholder="Ej: 9, 10, 11" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                    </div>
                    <div>
                        <label style="font-size:0.9rem;">Ojo Derecho</label>
                        <input type="text" id="ficha-map-der" placeholder="Ej: 9, 10, 11" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                    </div>
                </div>
            `;
            fichaModal.style.display = 'flex';
        });
    }

    btnFichas.forEach(btn => {
        btn.addEventListener('click', () => {
            const appId = btn.getAttribute('data-appid');
            const app = StorageHelper.getAppointments().find(a => a.id === appId);
            if (!app) return;

            const service = mockData.services.find(s => s.id === app.serviceId);

            document.getElementById('ficha-appid').value = appId;
            document.getElementById('ficha-client').value = app.clientName;
            document.getElementById('ficha-service').value = service ? service.name : '';

            // Limpiar form
            formFicha.reset();
            document.querySelectorAll('.ficha-prod-qty').forEach(input => input.disabled = true);

            // Mostrar campos dinámicos si es de la categoría 'mirada' (pestañas)
            if (service && service.categoryId === 'mirada') {
                dynFields.style.display = 'block';
                dynFields.innerHTML = `
                    <h4 style="margin-bottom:10px; font-size:1rem;">Mapping de Pestañas</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div>
                            <label style="font-size:0.9rem;">Ojo Izquierdo (Tamaños ej: 9-13)</label>
                            <input type="text" id="ficha-map-izq" placeholder="Ej: 9, 10, 11, 12, 13" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                        </div>
                        <div>
                            <label style="font-size:0.9rem;">Ojo Derecho (Tamaños ej: 9-13)</label>
                            <input type="text" id="ficha-map-der" placeholder="Ej: 9, 10, 11, 12, 13" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">
                        </div>
                    </div>
                `;
            } else {
                dynFields.style.display = 'none';
                dynFields.innerHTML = '';
            }

            fichaModal.style.display = 'flex';
        });
    });

    btnCloseFicha?.addEventListener('click', () => {
        fichaModal.style.display = 'none';
    });

    // Habilitar/Deshabilitar cantidad de productos al hacer check
    const prodChecks = document.querySelectorAll('.ficha-prod-check');
    prodChecks.forEach(chk => {
        chk.addEventListener('change', (e) => {
            const qtyInput = document.getElementById('qty_' + e.target.value);
            if (qtyInput) {
                qtyInput.disabled = !e.target.checked;
                if (!e.target.checked) qtyInput.value = 1;
            }
        });
    });

    // Guardar Ficha
    formFicha?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const appId = document.getElementById('ficha-appid').value;
        const app = appId ? StorageHelper.getAppointments().find(a => a.id === appId) : null;

        const clientName = document.getElementById('ficha-client').value.trim();
        const serviceName = document.getElementById('ficha-service').value.trim();

        // Productos usados
        const usedProds = [];
        prodChecks.forEach(chk => {
            if (chk.checked) {
                const qty = parseInt(document.getElementById('qty_' + chk.value).value) || 1;
                usedProds.push({ id: chk.value, name: chk.getAttribute('data-name'), quantity: qty });
                // Descontar stock
                StorageHelper.updateProductStock(chk.value, qty);
            }
        });

        // Extra data (Mapping de pestañas)
        const mapIzq = document.getElementById('ficha-map-izq')?.value || '';
        const mapDer = document.getElementById('ficha-map-der')?.value || '';

        const btnSubmit = formFicha.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Guardando...";

        const ficha = {
            appointmentId: appId || null,
            date: new Date().toLocaleDateString('es-CL'),
            clientName: clientName,
            serviceName: serviceName,
            products: usedProds,
            mapping: (mapIzq || mapDer) ? { left: mapIzq, right: mapDer } : null
        };

        await StorageHelper.saveFicha(ficha);

        // Actualizar o crear clienta
        const clientsList = StorageHelper.getClients();
        let existingClient = clientsList.find(c => c.name.toLowerCase() === clientName.toLowerCase());
        if (existingClient) {
            existingClient.lastVisit = ficha.date;
            StorageHelper.updateClient(existingClient);
        } else {
            let prodNames = usedProds.map(p => p.name).join(', ');
            StorageHelper.addClient({
                name: clientName,
                phone: app ? app.clientPhone : '',
                lastVisit: ficha.date,
                products: prodNames ? `Productos usados: ${prodNames}` : ''
            });
        }

        fichaModal.style.display = 'none';
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Guardar Ficha";

        if (typeof AppRouter !== 'undefined') {
            AppRouter.refresh(); // Refrescar vista actual
        }
    });

    // Modal Ver Ficha
    const viewFichaModal = document.getElementById('view-ficha-modal');
    const viewFichaContent = document.getElementById('view-ficha-content');

    document.querySelectorAll('.btn-view-ficha').forEach(btn => {
        btn.addEventListener('click', () => {
            const fichaId = btn.getAttribute('data-fichaid');
            const ficha = StorageHelper.getFichas().find(f => f.id === fichaId);
            if (!ficha) return;

            let prodsHtml = (ficha.products && ficha.products.length > 0)
                ? ficha.products.map(p => `<li style="margin-bottom:5px;"><i data-lucide="package" style="width:14px; display:inline;"></i> ${p.quantity}x ${p.name}</li>`).join('')
                : 'Ningún producto registrado';

            let extraHtml = '';
            if (ficha.mapping) {
                extraHtml = `
                    <div style="background:var(--clr-nude-light); padding:15px; border-radius:var(--radius-sm); margin-bottom:15px;">
                        <h4 style="margin-bottom:10px; font-size:1rem; color:var(--clr-rose-gold-dark);">Lash Mapping Utilizado</h4>
                        <p style="margin-bottom:5px;"><strong>Ojo Izquierdo:</strong> ${ficha.mapping.left || 'N/A'}</p>
                        <p style="margin-bottom:0;"><strong>Ojo Derecho:</strong> ${ficha.mapping.right || 'N/A'}</p>
                    </div>
                `;
            }

            viewFichaContent.innerHTML = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div><span style="color:var(--clr-neutral-gray); font-size:0.9rem;">Cliente</span><br><strong>${ficha.clientName}</strong></div>
                    <div><span style="color:var(--clr-neutral-gray); font-size:0.9rem;">Fecha</span><br><strong>${ficha.date}</strong></div>
                    <div style="grid-column: 1/-1;"><span style="color:var(--clr-neutral-gray); font-size:0.9rem;">Servicio</span><br><strong>${ficha.serviceName}</strong></div>
                </div>
                ${extraHtml}
                <div style="margin-bottom:20px;">
                    <h4 style="margin-bottom:10px; font-size:1rem; color:var(--clr-rose-gold-dark);">Productos Usados</h4>
                    <ul style="list-style:none; padding:0; margin:0;">${prodsHtml}</ul>
                </div>
                <div>
                    <h4 style="margin-bottom:10px; font-size:1rem; color:var(--clr-rose-gold-dark);">Observaciones</h4>
                    <p style="background:#f9f9f9; padding:15px; border-radius:var(--radius-sm); border:1px solid #eee; margin:0;">${ficha.notes || 'Ninguna'}</p>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();

            // Configurar botón de WhatsApp
            const btnWsp = document.getElementById('btn-whatsapp-reminder');
            if (btnWsp && ficha.clientPhone) {
                btnWsp.style.display = 'inline-block';
                btnWsp.onclick = () => {
                    const phone = ficha.clientPhone.replace(/[^0-9+]/g, '');
                    const msg = encodeURIComponent(`Hola ${ficha.clientName}! Te escribimos de Nicolett Studio Fantasy. Esperamos que hayas disfrutado tu servicio de ${ficha.serviceName}. Recuerda que para mantener los resultados te sugerimos... ¡Te esperamos pronto!`);
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                };
            } else if (btnWsp) {
                btnWsp.style.display = 'none';
            }

            viewFichaModal.style.display = 'flex';
        });
    });

    // Eliminar Ficha Clienta (Solo Admin)
    document.querySelectorAll('.btn-del-ficha').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('¿Estás segura de eliminar esta ficha de clienta? Esta acción no se puede deshacer.')) {
                StorageHelper.deleteFicha(btn.getAttribute('data-fichaid'));
                AppRouter.refresh();
            }
        });
    });

    // Eliminar Profesional (Solo Admin)
    document.querySelectorAll('.btn-del-prof').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('¿Estás segura de eliminar a esta trabajadora del sistema?')) {
                StorageHelper.deleteProfessional(btn.getAttribute('data-profid'));
                AppRouter.refresh();
            }
        });
    });

    // --- Configuración de Pasarela Flow (Solo Admin) ---
    const formFlowCfg = document.getElementById('form-flow-config');
    if (formFlowCfg) {
        const flowCfg = StorageHelper.getFlowConfig();
        const urlInput = document.getElementById('flow-cfg-url');
        const apiKeyInput = document.getElementById('flow-cfg-apikey');
        const secretInput = document.getElementById('flow-cfg-secret');
        const backendInput = document.getElementById('flow-cfg-backend');
        const sandboxInput = document.getElementById('flow-cfg-sandbox');
        const statusEl = document.getElementById('backend-conn-status');
        const btnTest = document.getElementById('btn-test-flow-conn');

        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const defaultBackend = isLocalHost ? 'http://localhost:3000' : window.location.origin;
        let activeBackend = flowCfg.backendUrl;
        if (!isLocalHost && (!activeBackend || activeBackend.includes('localhost') || activeBackend.includes('127.0.0.1'))) {
            activeBackend = defaultBackend;
        }

        if (urlInput) urlInput.value = flowCfg.flowUrl || '';
        if (apiKeyInput) apiKeyInput.value = flowCfg.apiKey || '';
        if (secretInput) secretInput.value = flowCfg.secretKey || '';
        if (backendInput) backendInput.value = activeBackend || defaultBackend;
        if (sandboxInput) sandboxInput.checked = (flowCfg.isSandbox !== undefined) ? flowCfg.isSandbox : isLocalHost;

        // Probar conexión con el servidor backend
        if (btnTest) {
            btnTest.addEventListener('click', async () => {
                const rawUrl = (backendInput?.value.trim() || defaultBackend).replace(/\/+$/, '');
                const url = rawUrl.replace(/\/api(\/.*)?$/, '');
                if (backendInput && backendInput.value !== url) backendInput.value = url;
                if (statusEl) {
                    statusEl.style.display = 'block';
                    statusEl.style.background = '#e3f2fd';
                    statusEl.style.color = '#0d47a1';
                    statusEl.style.border = '1px solid #bbdefb';
                    statusEl.innerHTML = '<i data-lucide="loader" style="width:16px; height:16px; display:inline-block; vertical-align:middle;"></i> Conectando con ' + url + '...';
                    if (window.lucide) lucide.createIcons();
                }

                try {
                    const resp = await fetch(`${url}/api/flow/config`, { signal: AbortSignal.timeout(4000) });
                    if (resp.ok) {
                        const data = await resp.json();
                        const envMode = data.sandbox ? 'Sandbox (Pruebas)' : 'Producción';
                        const keysStatus = data.configured ? 'Configuradas en backend (.env / Vercel)' : 'Se enviarán desde este formulario';
                        statusEl.style.background = '#e8f5e9';
                        statusEl.style.color = '#1b5e20';
                        statusEl.style.border = '1px solid #c8e6c9';
                        statusEl.innerHTML = `
                            <strong>✅ Backend Conectado Exitosamente</strong><br>
                            • Servidor: <code>${url}</code><br>
                            • Modo Flow: <strong>${envMode}</strong><br>
                            • Credenciales: ${keysStatus}
                        `;
                    } else {
                        throw new Error(`HTTP ${resp.status}`);
                    }
                } catch (err) {
                    statusEl.style.background = '#ffebee';
                    statusEl.style.color = '#b71c1c';
                    statusEl.style.border = '1px solid #ffcdd2';
                    const hintMsg = isLocalHost
                        ? 'Asegúrate de que el backend esté ejecutándose con: <br><code>cd backend &amp;&amp; npm start</code> o ejecutando <code>iniciar_backend.bat</code>'
                        : `En Vercel el backend funciona automáticamente en este mismo dominio (<code>${window.location.origin}</code>). Asegúrate de tener configurado el campo con <code>${window.location.origin}</code>.`;
                    statusEl.innerHTML = `
                        <strong>⚠️ Servidor Backend no responde en <code>${url}</code></strong><br>
                        ${hintMsg}
                    `;
                }
            });
        }

        formFlowCfg.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btn-save-flow-cfg');
            if (btnSave) {
                btnSave.disabled = true;
                btnSave.innerHTML = 'Guardando...';
            }

            const cleanBackend = (backendInput?.value.trim() || defaultBackend).replace(/\/+$/, '').replace(/\/api(\/.*)?$/, '');
            if (backendInput) backendInput.value = cleanBackend;

            const updatedCfg = {
                flowUrl: urlInput?.value.trim() || '',
                apiKey: apiKeyInput?.value.trim() || '',
                secretKey: secretInput?.value.trim() || '',
                backendUrl: cleanBackend,
                isSandbox: sandboxInput ? sandboxInput.checked : true
            };

            await StorageHelper.saveFlowConfig(updatedCfg);
            alert('¡Configuración de Flow guardada exitosamente!');

            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i data-lucide="save"></i> Guardar Configuración Flow';
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    // --- Lógica de Galería (Solo Admin) ---
    const formGallery = document.getElementById('form-upload-gallery');
    const statusGallery = document.getElementById('upload-status');

    if (formGallery) {
        formGallery.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('gallery-file');
            const titleInput = document.getElementById('gallery-title');
            const btnSubmit = document.getElementById('btn-upload-gallery');

            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                statusGallery.style.display = 'block';
                btnSubmit.disabled = true;
                btnSubmit.innerText = "Procesando...";

                const reader = new FileReader();
                reader.onload = function (event) {
                    const img = new Image();
                    img.onload = async function () {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const MAX_WIDTH = 800;

                        if (width > MAX_WIDTH) {
                            height = Math.round(height * (MAX_WIDTH / width));
                            width = MAX_WIDTH;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to JPEG, quality 0.7 para reducir el peso para localStorage
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                        try {
                            await StorageHelper.addGalleryImage({
                                title: titleInput.value.trim(),
                                serviceName: titleInput.value.trim(),
                                source: 'admin',
                                date: new Date().toLocaleDateString('es-CL'),
                                src: dataUrl
                            });
                            formGallery.reset();
                            statusGallery.style.display = 'none';
                            alert("¡Foto agregada a la galería con éxito desde el panel de administración!");
                            AppRouter.refresh(); // Recargar para ver los cambios
                        } catch (err) {
                            alert("Error: No hay más espacio en la memoria. Por favor, elimina algunas fotos de la galería primero.");
                            statusGallery.style.display = 'none';
                            btnSubmit.disabled = false;
                            btnSubmit.innerText = "Subir a Galería";
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Eliminar Ficha
    document.querySelectorAll('.btn-del-ficha').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('¿Estás segura de eliminar permanentemente esta ficha?')) {
                await StorageHelper.deleteFicha(btn.getAttribute('data-fichaid'));
                if (typeof AppRouter !== 'undefined') AppRouter.refresh();
            }
        });
    });

    // Descargar imagen de galería (Panel Admin)
    document.querySelectorAll('.btn-download-gallery').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const src = btn.getAttribute('data-src');
            const title = btn.getAttribute('data-title') || 'trabajo';
            const filename = `nicolett-studio-${title}-${Date.now()}.jpg`;

            try {
                if (src.startsWith('data:')) {
                    const a = document.createElement('a');
                    a.href = src;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    return;
                }
                const res = await fetch(src, { mode: 'cors' });
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (err) {
                console.warn("Descarga con blob no permitida por CORS, abriendo:", err);
                const a = document.createElement('a');
                a.href = src;
                a.target = '_blank';
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    });

    // Eliminar imagen de galería
    document.querySelectorAll('.btn-del-gallery').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('¿Estás segura de eliminar esta imagen de la galería pública?')) {
                await StorageHelper.deleteGalleryImage(btn.getAttribute('data-id'));
                AppRouter.refresh();
            }
        });
    });

    // Filtros de Galería en Panel Admin
    const filterChips = document.querySelectorAll('#gallery-filter-chips .gallery-filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const filter = chip.getAttribute('data-filter');
            const items = document.querySelectorAll('#admin-gallery-grid .admin-gallery-item');
            items.forEach(item => {
                const source = item.getAttribute('data-source');
                if (filter === 'all') {
                    item.style.display = 'block';
                } else if (filter === 'client' && source === 'client') {
                    item.style.display = 'block';
                } else if (filter === 'admin' && source !== 'client') {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Actualizar Stock de Inventario
    document.querySelectorAll('.btn-update-stock').forEach(btn => {
        btn.addEventListener('click', async () => {
            const prodId = btn.getAttribute('data-id');
            const input = document.querySelector(`.inv-stock-input[data-id="${prodId}"]`);
            if (input) {
                const newStock = input.value;
                btn.innerHTML = '<i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i>';
                if (window.lucide) window.lucide.createIcons();
                await StorageHelper.updateProductStockDirect(prodId, newStock);
                btn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i>';
                if (window.lucide) window.lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = '<i data-lucide="save" style="width: 14px; height: 14px;"></i>';
                    if (window.lucide) window.lucide.createIcons();
                }, 2000);
            }
        });
    });

    // --- Lógica de Nueva Trabajadora ---
    const btnAddWorker = document.getElementById('btn-add-worker');
    const workerModal = document.getElementById('worker-modal');
    const closeWorker = document.getElementById('close-worker');
    const formWorker = document.getElementById('form-worker');

    if (btnAddWorker) {
        btnAddWorker.addEventListener('click', () => {
            if (workerModal) workerModal.style.display = 'flex';
        });
    }

    if (closeWorker) {
        closeWorker.addEventListener('click', () => {
            workerModal.style.display = 'none';
        });
    }

    if (formWorker) {
        formWorker.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('worker-name').value.trim();
            const email = document.getElementById('worker-email').value.trim();
            const photoInput = document.getElementById('worker-photo');
            const btnSave = document.getElementById('btn-save-worker');
            const status = document.getElementById('worker-upload-status');

            btnSave.disabled = true;
            status.style.display = 'block';

            let reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = async function () {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX = 400; // Avatar pequeño
                    if (width > MAX) { height = Math.round(height * (MAX / width)); width = MAX; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        try {
                            const secondaryAppName = "SecondaryApp" + Date.now();
                            const secondaryApp = firebase.initializeApp(firebase.app().options, secondaryAppName);
                            await secondaryApp.auth().createUserWithEmailAndPassword(email, "Nicolett123!");
                            await secondaryApp.auth().signOut();
                            secondaryApp.delete();
                        } catch (err) {
                            console.error("No se pudo crear el usuario en Auth (puede que ya exista):", err);
                        }
                    }

                    await StorageHelper.addProfessional({
                        name: name,
                        email: email,
                        role: 'profesional',
                        avatar: dataUrl
                    });

                    workerModal.style.display = 'none';
                    btnSave.disabled = false;
                    status.style.display = 'none';
                    formWorker.reset();
                    if (typeof AppRouter !== 'undefined') AppRouter.refresh();
                };
                img.src = event.target.result;
            };

            if (photoInput.files && photoInput.files[0]) {
                reader.readAsDataURL(photoInput.files[0]);
            }
        });
    }

    // --- Lógica de Nueva Clienta ---
    const btnAddClient = document.getElementById('btn-add-client');
    const clientModal = document.getElementById('client-modal');
    const closeClient = document.getElementById('close-client');
    const formClient = document.getElementById('form-client');

    if (btnAddClient) {
        btnAddClient.addEventListener('click', () => {
            if (clientModal) clientModal.style.display = 'flex';
        });
    }

    if (closeClient) {
        closeClient.addEventListener('click', () => {
            clientModal.style.display = 'none';
        });
    }

    if (formClient) {
        formClient.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('client-name-input').value.trim();
            const phone = document.getElementById('client-phone-input').value.trim();
            const products = document.getElementById('client-products').value.trim();

            StorageHelper.addClient({
                name,
                phone,
                lastVisit: '',
                products
            });

            clientModal.style.display = 'none';
            formClient.reset();
            if (typeof AppRouter !== 'undefined') AppRouter.refresh();
        });
    }

    // Eliminar Clienta
    document.querySelectorAll('.btn-del-client').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('¿Estás segura de eliminar este registro del directorio de clientas?')) {
                StorageHelper.deleteClient(btn.getAttribute('data-id'));
                if (typeof AppRouter !== 'undefined') AppRouter.refresh();
            }
        });
    });

    // --- Lógica de Nuevo Producto ---
    const btnAddProduct = document.getElementById('btn-add-product');
    const productModal = document.getElementById('product-modal');
    const closeProduct = document.getElementById('close-product');
    const formProduct = document.getElementById('form-product');

    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', () => {
            if (productModal) productModal.style.display = 'flex';
        });
    }

    if (closeProduct) {
        closeProduct.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
    }

    if (formProduct) {
        formProduct.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('prod-name').value.trim();
            const cat = document.getElementById('prod-cat').value;
            const stock = parseInt(document.getElementById('prod-stock').value);
            const btnSave = document.getElementById('btn-save-product');

            btnSave.disabled = true;
            btnSave.innerText = "Guardando...";

            await StorageHelper.addProduct({
                name: name,
                category: cat,
                stock: stock
            });

            productModal.style.display = 'none';
            btnSave.disabled = false;
            btnSave.innerText = "Guardar Producto";
            formProduct.reset();
            if (typeof AppRouter !== 'undefined') AppRouter.refresh();
        });
    }

    // --- Lógica de Bloquear Horario ---
    const btnBloquearHora = document.getElementById('btn-bloquear-hora');
    const modalBloquearHora = document.getElementById('modal-bloquear-hora');
    const btnCloseBlockModal = document.getElementById('btn-close-block-modal');
    const btnSaveBlockModal = document.getElementById('btn-save-block-modal');

    if (btnBloquearHora && modalBloquearHora) {
        btnBloquearHora.addEventListener('click', () => {
            modalBloquearHora.style.display = 'flex';
        });

        btnCloseBlockModal.addEventListener('click', () => {
            modalBloquearHora.style.display = 'none';
        });

        btnSaveBlockModal.addEventListener('click', async () => {
            const dateInput = document.getElementById('block-date').value;
            const timeInput = document.getElementById('block-time').value;

            if (!dateInput || !timeInput) {
                alert('Por favor, selecciona fecha y hora.');
                return;
            }

            // Convertir la fecha al formato que se usa en la agenda (DD/MM/YYYY)
            const parts = dateInput.split('-');
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

            const appointmentData = {
                servicio: 'BLOQUEO DE AGENDA',
                profesional: auth.user.name,
                profId: auth.user.id,
                serviceId: 'bloqueo',
                date: formattedDate,
                time: timeInput,
                needs: {},
                notes: 'Horario bloqueado por el administrador.',
                clientName: 'N/A',
                clientPhone: '',
                clientEmail: '',
                transactionId: '',
                status: 'bloqueada'
            };

            btnSaveBlockModal.disabled = true;
            btnSaveBlockModal.innerText = 'Bloqueando...';

            try {
                await StorageHelper.saveAppointment(appointmentData);
                modalBloquearHora.style.display = 'none';
                if (typeof AppRouter !== 'undefined') AppRouter.refresh();
            } catch (e) {
                alert('Error al bloquear el horario.');
                btnSaveBlockModal.disabled = false;
                btnSaveBlockModal.innerText = 'Bloquear';
            }
        });
    }

    // --- Lógica de Descarga de Excel (CSV) ---
    const btnDescargarExcel = document.getElementById('btn-descargar-excel');
    if (btnDescargarExcel) {
        btnDescargarExcel.addEventListener('click', () => {
            const appointments = StorageHelper.getAppointments();

            // Crear cabeceras del CSV
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Fecha,Hora,Cliente,Servicio,Profesional,Estado,Abono Pagado ($),Precio Total Estimado ($)\n";

            appointments.forEach(app => {
                // Saltar si es un bloqueo de agenda para no ensuciar los números (opcional)
                if (app.status === 'bloqueada') return;

                // Buscar el precio total
                let price = 0;
                const s = typeof mockData !== 'undefined' ? mockData.services.find(ser => ser.id === app.serviceId || ser.name === app.servicio) : null;
                if (s && s.price) price = s.price;

                const abono = (app.status === 'completada' || app.status === 'confirmada' || app.status === 'Pago Reportado') ? 5000 : 0;

                const row = [
                    app.date || '',
                    app.time || '',
                    `"${(app.clientName || '').replace(/"/g, '""')}"`, // Escapar comillas
                    `"${(app.servicio || '').replace(/"/g, '""')}"`,
                    `"${(app.profesional || '').replace(/"/g, '""')}"`,
                    app.status || '',
                    abono,
                    price
                ].join(",");

                csvContent += row + "\n";
            });

            // Trigger download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Reporte_Citas_NicolettStudio_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.csv`);
            document.body.appendChild(link); // Required for FF
            link.click();
        });
    }

    // --- Lógica de Gráficos (Chart.js) ---
    if (typeof Chart !== 'undefined' && document.getElementById('chart-services') && document.getElementById('chart-earnings')) {
        const apps = StorageHelper.getAppointments().filter(a => a.status !== 'bloqueada' && a.status !== 'cancelada');
        
        // Data para Servicios
        const serviceCounts = {};
        apps.forEach(a => {
            const sName = a.servicio || 'Desconocido';
            serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
        });

        new Chart(document.getElementById('chart-services').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(serviceCounts),
                datasets: [{
                    data: Object.values(serviceCounts),
                    backgroundColor: ['#e4a8a0', '#dfc3b5', '#b58371', '#d4c4b7', '#fdfbf7'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Data para Ingresos por Profesional (Abonos de $5.000 por cita)
        const profEarnings = {};
        apps.forEach(a => {
            if (a.status === 'completada' || a.status === 'confirmada' || a.status === 'Pago Reportado') {
                const pName = a.profesional || 'Desconocida';
                const abono = a.depositAmount || 5000;
                profEarnings[pName] = (profEarnings[pName] || 0) + abono;
            }
        });

        new Chart(document.getElementById('chart-earnings').getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(profEarnings),
                datasets: [{
                    label: 'Abonos Recibidos ($5.000 c/u)',
                    data: Object.values(profEarnings),
                    backgroundColor: '#e4a8a0'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // --- Lógica de CRM (Perfil de Clienta) ---
    document.querySelectorAll('.open-crm').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const clientId = btn.getAttribute('data-clientid');
            const client = StorageHelper.getClients().find(c => c.id === clientId);
            if (!client) return;

            // Encontrar todas las citas y fichas de esta clienta
            const allApps = StorageHelper.getAppointments().filter(a => a.clientName.toLowerCase() === client.name.toLowerCase() && a.status !== 'bloqueada');
            const allFichas = StorageHelper.getFichas().filter(f => f.clientName.toLowerCase() === client.name.toLowerCase());

            let totalSpent = 0;
            let totalVisits = 0;

            allApps.forEach(a => {
                if (a.status === 'completada' || a.status === 'confirmada' || a.status === 'Pago Reportado') {
                    totalVisits++;
                    const s = typeof mockData !== 'undefined' ? mockData.services.find(ser => ser.id === a.serviceId || ser.name === a.servicio) : null;
                    if (s && s.price) totalSpent += s.price;
                }
            });

            // Llenar Modal
            document.getElementById('crm-name').innerText = client.name;
            document.getElementById('crm-phone').innerHTML = `<i data-lucide="phone" style="width:14px; display:inline;"></i> ${client.phone || 'Sin número'}`;
            document.getElementById('crm-total-visits').innerText = totalVisits;
            document.getElementById('crm-total-spent').innerText = '$' + totalSpent.toLocaleString('es-CL');
            document.getElementById('crm-notes').value = client.notes || '';
            document.getElementById('crm-client-id').value = client.id;

            // Historial
            const historyContainer = document.getElementById('crm-history-list');
            if (allFichas.length === 0 && allApps.length === 0) {
                historyContainer.innerHTML = '<p>No hay historial registrado.</p>';
            } else {
                let html = '';
                // Mostrar Fichas primero, luego Citas sin ficha
                allFichas.forEach(f => {
                    html += `
                        <div style="border:1px solid #ddd; padding:10px; border-radius:4px; font-size:0.9rem;">
                            <strong>${f.date} - ${f.serviceName}</strong> (Ficha)<br>
                            <span style="color:#666;">${f.notes || 'Sin notas'}</span>
                        </div>
                    `;
                });
                historyContainer.innerHTML = html;
            }

            // Fotos del servicio subidas por la clienta
            const clientPhotosContainer = document.getElementById('crm-client-photos');
            if (clientPhotosContainer) {
                const clientGallery = StorageHelper.getGallery().filter(g => 
                    g.source === 'client' && (
                        (client.email && g.clientEmail && g.clientEmail.toLowerCase() === client.email.toLowerCase()) ||
                        (client.name && g.clientName && g.clientName.toLowerCase() === client.name.toLowerCase())
                    )
                );
                if (clientGallery.length === 0) {
                    clientPhotosContainer.innerHTML = '<p style="color:var(--clr-neutral-gray); font-size:0.85rem; grid-column:1/-1; margin:0;">La clienta aún no ha subido fotos de sus servicios.</p>';
                } else {
                    clientPhotosContainer.innerHTML = clientGallery.map(img => `
                        <div style="border-radius:6px; overflow:hidden; box-shadow:var(--shadow-soft); height:90px; position:relative; background:#000;">
                            <img src="${img.src}" alt="${img.title || 'Foto de servicio'}" style="width:100%; height:100%; object-fit:cover; display:block;">
                            <div style="position:absolute; bottom:0; left:0; width:100%; background:rgba(0,0,0,0.75); color:white; font-size:0.7rem; padding:2px 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                ${img.serviceName || img.title || 'Servicio'}
                            </div>
                        </div>
                    `).join('');
                }
            }

            if(window.lucide) window.lucide.createIcons();
            document.getElementById('crm-modal').style.display = 'flex';
        });
    });

    document.getElementById('btn-save-crm-notes')?.addEventListener('click', () => {
        const id = document.getElementById('crm-client-id').value;
        const notes = document.getElementById('crm-notes').value;
        const client = StorageHelper.getClients().find(c => c.id === id);
        if (client) {
            client.notes = notes;
            StorageHelper.updateClient(client);
            alert('Notas guardadas correctamente.');
        }
    });

}

// --- Control del Modal de Fotos de la Clienta (Cámara / Subida) ---
let clientCapturedDataUrl = null;
let clientWebcamStream = null;

function setupClientPhotoModal() {
    const modal = document.getElementById('client-photo-modal');
    if (!modal) return;

    const btnClose = document.getElementById('btn-close-client-photo');
    const btnCancel = document.getElementById('btn-cancel-client-photo');
    const btnTriggerCamera = document.getElementById('btn-trigger-camera');
    const btnTriggerGallery = document.getElementById('btn-trigger-gallery');
    const btnTriggerWebcam = document.getElementById('btn-trigger-webcam');
    const cameraInput = document.getElementById('client-photo-camera-input');
    const fileInput = document.getElementById('client-photo-file-input');
    const webcamContainer = document.getElementById('client-webcam-container');
    const webcamVideo = document.getElementById('client-webcam-video');
    const btnWebcamCapture = document.getElementById('btn-webcam-capture');
    const btnWebcamCancel = document.getElementById('btn-webcam-cancel');
    const previewImg = document.getElementById('client-photo-img-tag');
    const emptyMsg = document.getElementById('client-photo-empty-msg');
    const btnRemovePhoto = document.getElementById('btn-remove-client-photo');
    const statusMsg = document.getElementById('client-photo-status');
    const btnSubmit = document.getElementById('btn-submit-client-photo');
    const form = document.getElementById('form-client-photo');
    const serviceSelect = document.getElementById('client-photo-service');

    function stopWebcam() {
        if (clientWebcamStream) {
            clientWebcamStream.getTracks().forEach(track => track.stop());
            clientWebcamStream = null;
        }
        if (webcamContainer) webcamContainer.style.display = 'none';
    }

    function resetModal() {
        stopWebcam();
        clientCapturedDataUrl = null;
        if (cameraInput) cameraInput.value = '';
        if (fileInput) fileInput.value = '';
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (btnRemovePhoto) btnRemovePhoto.style.display = 'none';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i data-lucide="upload"></i> Guardar en Galería';
        }
        if (statusMsg) {
            statusMsg.style.display = 'none';
            statusMsg.innerText = '';
        }
        const titleInput = document.getElementById('client-photo-title');
        if (titleInput) titleInput.value = '';
        if (window.lucide) lucide.createIcons();
    }

    function closeModal() {
        stopWebcam();
        resetModal();
        modal.style.display = 'none';
    }

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (btnRemovePhoto) {
        btnRemovePhoto.addEventListener('click', () => {
            resetModal();
        });
    }

    // Procesar archivo con compresión Canvas
    function processImageFile(file) {
        if (!file) return;

        if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.style.background = 'var(--clr-nude-light)';
            statusMsg.style.color = 'var(--clr-rose-gold-dark)';
            statusMsg.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; vertical-align:middle; margin-right:6px;"></span> Optimizando imagen...';
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 800;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round(height * (MAX_SIZE / width));
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round(width * (MAX_SIZE / height));
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
                clientCapturedDataUrl = dataUrl;

                if (previewImg) {
                    previewImg.src = dataUrl;
                    previewImg.style.display = 'block';
                }
                if (emptyMsg) emptyMsg.style.display = 'none';
                if (btnRemovePhoto) btnRemovePhoto.style.display = 'inline-block';
                if (btnSubmit) btnSubmit.disabled = false;

                if (statusMsg) {
                    statusMsg.style.display = 'block';
                    statusMsg.style.background = '#e8f5e9';
                    statusMsg.style.color = '#2e7d32';
                    statusMsg.innerText = '✓ Foto cargada y lista para publicar';
                }
                if (window.lucide) lucide.createIcons();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Botón Cámara nativa (en smartphones abre cámara directamente)
    if (btnTriggerCamera && cameraInput) {
        btnTriggerCamera.addEventListener('click', () => {
            stopWebcam();
            cameraInput.click();
        });
        cameraInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
            }
        });
    }

    // Botón Galería de archivos
    if (btnTriggerGallery && fileInput) {
        btnTriggerGallery.addEventListener('click', () => {
            stopWebcam();
            fileInput.click();
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
            }
        });
    }

    // Cámara Web para computadores
    if (btnTriggerWebcam) {
        btnTriggerWebcam.addEventListener('click', async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Tu navegador no soporta captura de webcam directa. Por favor, usa "Abrir Cámara" o "Elegir de Galería".');
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                clientWebcamStream = stream;
                if (webcamVideo) {
                    webcamVideo.srcObject = stream;
                    webcamVideo.play();
                }
                if (webcamContainer) webcamContainer.style.display = 'block';
                if (window.lucide) lucide.createIcons();
            } catch(err) {
                console.error("Error accediendo a la cámara:", err);
                alert("No se pudo acceder a la cámara web. Revisa los permisos de tu navegador o usa la opción de archivo.");
            }
        });
    }

    if (btnWebcamCancel) {
        btnWebcamCancel.addEventListener('click', () => {
            stopWebcam();
        });
    }

    if (btnWebcamCapture) {
        btnWebcamCapture.addEventListener('click', () => {
            if (!webcamVideo || !clientWebcamStream) return;
            const canvas = document.createElement('canvas');
            canvas.width = webcamVideo.videoWidth || 640;
            canvas.height = webcamVideo.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
            clientCapturedDataUrl = dataUrl;

            stopWebcam();

            if (previewImg) {
                previewImg.src = dataUrl;
                previewImg.style.display = 'block';
            }
            if (emptyMsg) emptyMsg.style.display = 'none';
            if (btnRemovePhoto) btnRemovePhoto.style.display = 'inline-block';
            if (btnSubmit) btnSubmit.disabled = false;

            if (statusMsg) {
                statusMsg.style.display = 'block';
                statusMsg.style.background = '#e8f5e9';
                statusMsg.style.color = '#2e7d32';
                statusMsg.innerText = '✓ Instantánea capturada con éxito';
            }
            if (window.lucide) lucide.createIcons();
        });
    }

    // Enviar formulario y guardar foto
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!clientCapturedDataUrl) {
                alert("Por favor, toma o selecciona una foto antes de guardar.");
                return;
            }

            const serviceVal = serviceSelect ? serviceSelect.value : '';
            if (!serviceVal) {
                alert("Por favor, selecciona qué servicio te realizaste.");
                return;
            }

            const titleInput = document.getElementById('client-photo-title');
            const customTitle = titleInput ? titleInput.value.trim() : '';

            let pers = { name: 'Clienta', email: '' };
            try {
                const persStr = localStorage.getItem('nicolett_personalization');
                if (persStr) pers = JSON.parse(persStr);
            } catch(err) {}

            // Validar que la clienta tenga citas agendadas previamente
            const clientAppointments = (pers && pers.email) 
                ? StorageHelper.getAppointments().filter(a => a.clientEmail && a.clientEmail.toLowerCase() === pers.email.toLowerCase())
                : [];

            if (clientAppointments.length === 0) {
                alert("Acción no permitida: Solo las clientas con citas agendadas previamente pueden subir fotos.");
                closeModal();
                return;
            }

            btnSubmit.disabled = true;
            btnSubmit.innerText = "Guardando en galería...";

            const newPhoto = {
                src: clientCapturedDataUrl,
                title: customTitle || `${serviceVal} - ${pers.name}`,
                serviceName: serviceVal,
                clientName: pers.name,
                clientEmail: pers.email,
                source: 'client',
                date: new Date().toLocaleDateString('es-CL'),
                timestamp: Date.now()
            };

            try {
                await StorageHelper.addGalleryImage(newPhoto);

                alert("¡Excelente! Tu foto ha sido guardada en tu perfil y enviada a la galería del salón. ¡Gracias por compartir tu resultado!");
                closeModal();

                // Recargar vista para ver los cambios
                if (typeof AppRouter !== 'undefined') {
                    AppRouter.refresh();
                }
            } catch(err) {
                console.error("Error guardando foto:", err);
                alert("Hubo un problema al guardar la foto. Es posible que el almacenamiento esté lleno.");
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Reintentar Guardar";
            }
        });
    }
}

// --- Eventos del Portal de la Clienta (Mi Perfil) ---
function initPerfilEvents() {
    if (window.lucide) lucide.createIcons();

    let pers = null;
    try {
        const persStr = localStorage.getItem('nicolett_personalization');
        if (persStr) pers = JSON.parse(persStr);
    } catch(e) {}

    // Obtener citas de la clienta
    const clientAppointments = (pers && pers.email)
        ? StorageHelper.getAppointments().filter(a => a.clientEmail && a.clientEmail.toLowerCase() === pers.email.toLowerCase())
        : [];

    const modal = document.getElementById('client-photo-modal');
    const serviceSelect = document.getElementById('client-photo-service');

    function populateServiceSelect(preselectedService) {
        if (!serviceSelect) return;
        serviceSelect.innerHTML = '<option value="">Selecciona el servicio que te realizaste...</option>';

        if (clientAppointments.length > 0) {
            const groupOpt = document.createElement('optgroup');
            groupOpt.label = 'Tus Citas Realizadas en Nicolett Studio';
            clientAppointments.forEach(a => {
                const sName = a.servicio || 'Servicio';
                const label = `${sName} (${a.date} • ${a.profesional || 'Especialista'})`;
                const opt = document.createElement('option');
                opt.value = sName;
                opt.textContent = label;
                if (preselectedService && (preselectedService === sName || preselectedService === label)) {
                    opt.selected = true;
                }
                groupOpt.appendChild(opt);
            });
            serviceSelect.appendChild(groupOpt);
        }
    }

    function openModalWithService(serviceName) {
        // Validación obligatoria: Solo clientas con citas pueden subir fotos
        if (clientAppointments.length === 0) {
            alert("Para poder subir fotos a la galería, debes tener al menos una cita agendada o completada previamente.");
            return;
        }
        populateServiceSelect(serviceName);
        if (modal) {
            modal.style.display = 'flex';
            if (window.lucide) lucide.createIcons();
        }
    }

    // Botón en banner superior del perfil
    const btnBanner = document.getElementById('btn-open-photo-modal-banner');
    if (btnBanner) {
        btnBanner.addEventListener('click', () => openModalWithService(''));
    }

    // Botones de acción "Nueva foto" o "Sacar mi primera foto"
    document.querySelectorAll('.btn-open-photo-modal-action').forEach(btn => {
        btn.addEventListener('click', () => openModalWithService(''));
    });

    // Botón específico en cada cita del historial
    document.querySelectorAll('.btn-service-photo').forEach(btn => {
        btn.addEventListener('click', () => {
            const sName = btn.getAttribute('data-service') || '';
            openModalWithService(sName);
        });
    });

    // Eliminar foto propia de la clienta
    document.querySelectorAll('.btn-del-client-photo').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('¿Deseas eliminar esta foto de tu perfil y de la galería del salón?')) {
                await StorageHelper.deleteGalleryImage(id);
                if (typeof AppRouter !== 'undefined') {
                    AppRouter.refresh();
                }
            }
        });
    });
}

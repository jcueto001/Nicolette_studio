/**
 * Router simple basado en JavaScript puro para inyectar vistas
 */

const AppRouter = {
    _navTimeout: null,
    currentRoute: 'home',
    routes: {
        'home': renderHomeView,
        'galeria': renderGaleriaView,
        'agendar': renderAgendarView,
        'perfil': renderPerfilView,
        'admin': renderAdminView
    },

    init: function () {
        // Interceptar clicks en enlaces de navegación
        document.querySelectorAll('a[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.getAttribute('data-route');
                this.navigate(route);

                // Cerrar menú móvil si está abierto
                const navLinks = document.getElementById('nav-links');
                if (navLinks.classList.contains('show')) {
                    navLinks.classList.remove('show');
                }
            });
        });

        // Revisar si viene con un hash directo en la URL (ej: #admin, #portal o #login)
        const initialHash = window.location.hash.replace('#', '').toLowerCase();
        if (initialHash === 'admin' || initialHash === 'portal') {
            this.navigate('admin');
        } else if (initialHash === 'login') {
            this.navigate('home');
            setTimeout(() => {
                if (typeof window.openAuthModal === 'function') window.openAuthModal();
            }, 300);
        } else if (initialHash && this.routes[initialHash]) {
            this.navigate(initialHash);
        } else {
            // Cargar ruta inicial
            this.navigate('home');
        }

        // Escuchar cambios de hash en la barra de direcciones
        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '').toLowerCase();
            if (h === 'admin' || h === 'portal') {
                this.navigate('admin');
            } else if (h === 'login') {
                if (typeof window.openAuthModal === 'function') window.openAuthModal();
            } else if (h && this.routes[h]) {
                this.navigate(h);
            }
        });
    },

    refresh: function () {
        this.navigate(this.currentRoute);
    },

    navigate: function (route) {
        const contentArea = document.getElementById('app-content');
        if (this.routes[route]) {
            this.currentRoute = route;
            if (this._navTimeout) clearTimeout(this._navTimeout);

            // Actualizar clase activa en el menú de navegación
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.getAttribute('data-route') === route) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Animación de salida (opcional)
            contentArea.style.opacity = '0';

            this._navTimeout = setTimeout(() => {
                // Inyectar HTML de la nueva vista
                contentArea.innerHTML = this.routes[route]();

                // Re-inicializar iconos de Lucide para los nuevos elementos inyectados
                if (window.lucide) {
                    window.lucide.createIcons();
                }

                // Ejecutar scripts específicos de la vista si existen
                if (route === 'home') initHomeEvents();
                if (route === 'agendar') initAgendarEvents();
                if (route === 'admin') initAdminEvents();
                if (route === 'perfil') initPerfilEvents();

                // Animación de entrada
                contentArea.style.transition = 'opacity 0.3s ease';
                contentArea.style.opacity = '1';

                // Scroll top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }
    }
};

// --- VISTAS (Views) ---

function renderHomeView() {
    return `
        <!-- Hero Section -->
        <section class="hero-section" style="padding: 100px 0; background-color: var(--clr-nude-light); position:relative; overflow:hidden;">
            <div class="container hero-container" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 40px;">
                <div class="hero-text" style="flex: 1; min-width: 300px; z-index: 1;">
                    <h1 class="hero-title" style="font-size: 3.5rem; color: var(--clr-rose-gold-dark); margin-bottom: 20px; line-height: 1.2;">
                        Belleza a tu ritmo<br>y sin barreras.
                    </h1>
                    <p class="hero-subtitle" style="font-size: 1.2rem; color: var(--clr-neutral-gray); margin-bottom: 30px;">
                        Descubre una experiencia integral, cercana y adaptada a tus tiempos. Agenda tu momento de autocuidado hoy.
                    </p>
                    <button class="btn btn-primary hero-btn" onclick="AppRouter.navigate('agendar')" style="font-size: 1.1rem; padding: 15px 35px;">
                        <i data-lucide="calendar"></i> Agenda tu cita
                    </button>
                </div>
                <div class="hero-image-wrap" style="flex: 1; min-width: 300px; position: relative;">
                    <!-- Imagen decorativa con bordes redondeados y sombra -->
                    <img src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                         alt="Nicolett Studio" 
                         style="width: 100%; border-radius: var(--radius-lg); box-shadow: var(--shadow-medium); transform: rotate(2deg);">
                </div>
            </div>
        </section>

        <!-- About Us Section -->
        <section class="section" id="sobre-nosotros" style="background-color: transparent;">
            <div class="container">
                <div class="about-flex" style="display: flex; flex-wrap: wrap; align-items: center; gap: 50px;">
                    <div class="about-image-wrap" style="flex: 1; min-width: 300px; position: relative;">
                        <!-- Imagen decorativa 1 -->
                        <img src="img/sobre-nosotros.webp" 
                             alt="Sobre Nicolett Studio" 
                             style="width: 100%; border-radius: var(--radius-lg); box-shadow: var(--shadow-medium); position: relative; z-index: 2; object-fit: cover; aspect-ratio: 4/3;">
                        <!-- Fondo decorativo -->
                        <div class="about-decorative-border" style="position: absolute; top: 20px; left: -20px; right: 20px; bottom: -20px; border: 2px solid var(--clr-rose-gold); border-radius: var(--radius-lg); z-index: 1;"></div>
                    </div>
                    <div class="about-text" style="flex: 1; min-width: 300px;">
                        <h2 class="section-title" style="text-align: left; margin-bottom: 10px;">Sobre Nosotros</h2>
                        <h3 style="color: var(--clr-rose-gold); margin-bottom: 20px; font-family: var(--font-heading); font-size: 1.5rem; font-style: italic;">Tu espacio seguro de belleza</h3>
                        <p style="font-size: 1.1rem; color: var(--clr-neutral-gray); margin-bottom: 20px; line-height: 1.8;">
                            En <strong>Nicolett Studio Fantasy</strong>, creemos que la belleza no tiene reglas, géneros ni barreras. Nacimos con el propósito de crear un ambiente cercano y relajante, donde cada persona pueda desconectarse del estrés diario y potenciar su estilo único.
                        </p>
                        <p style="font-size: 1.1rem; color: var(--clr-neutral-gray); margin-bottom: 30px; line-height: 1.8;">
                            Nuestro equipo está formado por especialistas apasionadas que no solo dominan las últimas tendencias, sino que te escuchan para entender exactamente lo que buscas. Aquí, la atención es a tu ritmo.
                        </p>
                        <div class="about-stats" style="display: flex; gap: 40px;">
                            <div>
                                <h4 style="color: var(--clr-rose-gold-dark); font-size: 2rem; margin-bottom: 5px; font-family: var(--font-heading);">+500</h4>
                                <p style="font-size: 0.95rem; color: var(--clr-neutral-gray); font-weight: 500;">Clientas Felices</p>
                            </div>
                            <div>
                                <h4 style="color: var(--clr-rose-gold-dark); font-size: 2rem; margin-bottom: 5px; font-family: var(--font-heading);">100%</h4>
                                <p style="font-size: 0.95rem; color: var(--clr-neutral-gray); font-weight: 500;">Personalizado</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Carousel Section -->
        <section class="section" style="background-color: var(--clr-nude-light);">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">Nuestros Servicios</h2>
                    <p class="section-subtitle">Explora algunos de los servicios favoritos de nuestras clientas.</p>
                </div>
                
                <div class="carousel-container" style="display: flex; overflow-x: auto; gap: 20px; padding-bottom: 20px; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: var(--clr-rose-gold) var(--clr-nude-light);">
                    ${mockData.services.map(s => `
                        <div class="card" style="min-width: 300px; max-width: 300px; flex: 0 0 auto; scroll-snap-align: start; padding: 0; overflow: hidden; border: none; box-shadow: var(--shadow-medium);">
                            <img src="${s.image}" alt="${s.name}" style="width: 100%; height: 250px; object-fit: cover;">
                            <div style="padding: 20px;">
                                <h3 style="font-size: 1.2rem; margin-bottom: 10px;">${s.name}</h3>
                                <div style="display:flex; justify-content: space-between; align-items:center;">
                                    <span style="color: var(--clr-rose-gold-dark); font-weight: bold; font-size:1.1rem;">$${s.price.toLocaleString('es-CL')}</span>
                                    <button class="btn btn-primary btn-sm" style="padding: 5px 10px;" onclick="AppRouter.navigate('agendar')">Agendar</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        
        <!-- Location & Hours Section -->
        <section class="section" style="background-color: var(--clr-nude-light);">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">Ubicación y Horarios</h2>
                    <p class="section-subtitle">Encuéntranos fácilmente y visítanos en el horario que más te acomode.</p>
                </div>
                
                <div class="location-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; align-items: start;">
                    <div class="card" style="padding: 30px; border: none; box-shadow: var(--shadow-medium);">
                        <h3 style="margin-bottom: 15px; color: var(--clr-rose-gold-dark); display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="map-pin" style="color: var(--clr-rose-gold);"></i> Nuestra Dirección
                        </h3>
                        <p style="font-size: 1.1rem; margin-bottom: 30px; color: var(--clr-neutral-dark);">
                            Avenida Bernardo O'Higgins 979, Buin
                        </p>
                        
                        <h3 style="margin-bottom: 15px; color: var(--clr-rose-gold-dark); display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="clock" style="color: var(--clr-rose-gold);"></i> Horario de Atención
                        </h3>
                        <ul style="list-style: none; padding: 0; color: var(--clr-neutral-gray);">
                            <li style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--clr-nude);">
                                <span>Lunes a Sábado</span>
                                <strong>09:00 - 21:00</strong>
                            </li>
                            <li style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px;">
                                <span>Domingo</span>
                                <strong>Cerrado</strong>
                            </li>
                        </ul>
                    </div>
                    
                    <div style="border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-medium); height: 100%; min-height: 350px;">
                        <iframe 
                            class="map-frame"
                            src="https://maps.google.com/maps?q=avenida+bernardo+o'higgins+979,+buin&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                            width="100%" 
                            height="100%" 
                            style="border:0; min-height: 350px;" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderGaleriaView() {
    const images = StorageHelper.getGallery();

    return `
        <div class="container section">
            <div class="section-header">
                <h2 class="section-title">Galería de Trabajos</h2>
                <p class="section-subtitle">Conoce los espectaculares resultados creados por nuestras especialistas. Desliza para ver más.</p>
            </div>
            
            <div class="gallery-container" style="display: flex; overflow-x: auto; gap: 30px; padding: 20px 0 40px; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: var(--clr-rose-gold) var(--clr-nude-light);">
                ${images.length === 0 ? '<p style="text-align:center; width:100%;">Aún no hay fotos en la galería.</p>' : ''}
                ${images.map(img => `
                    <div class="gallery-item" style="width: 85vw; max-width: 600px; flex: 0 0 auto; scroll-snap-align: center; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-medium); position: relative; aspect-ratio: 1/1;">
                        <img src="${img.src}" alt="${img.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                    </div>
                `).join('')}
            </div>

            <div style="text-align: center; margin-top: 10px; padding: 30px 20px; border-top: 1px solid var(--clr-nude);">
                <p style="font-size: 1.1rem; color: var(--clr-neutral-gray); margin-bottom: 15px;">Para ver más de nuestros trabajos, visita nuestro Instagram:</p>
                <a href="https://instagram.com/nicolettstudiofantasy" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size: 1.1rem; padding: 12px 30px;">
                    <i data-lucide="instagram"></i> @nicolettstudiofantasy
                </a>
            </div>
        </div>
    `;
}

function renderAgendarView() {
    const professionals = StorageHelper.getProfessionals();
    return `
        <div class="container section">
            <div class="section-header">
                <h2 class="section-title">Agendar Cita</h2>
                <p class="section-subtitle">Sigue estos simples pasos para reservar tu momento.</p>
            </div>
            
            <div class="booking-container" style="max-width: 800px; margin: 0 auto; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-medium); padding: 40px; position: relative;">
                
                <!-- Progress Tabs -->
                <div class="booking-steps-nav" style="display: flex; justify-content: space-between; margin-bottom: 40px; position: relative;">
                    <div style="position: absolute; top: 15px; left: 0; right: 0; height: 2px; background: var(--clr-nude); z-index: 1;"></div>
                    ${['Servicio', 'Profesional', 'Fecha', 'Tus Datos', 'Confirmar'].map((step, index) => `
                        <div style="z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                            <div class="step-circle ${index === 0 ? 'active' : ''}" id="step-circle-${index + 1}" style="width: 32px; height: 32px; border-radius: 50%; background: ${index === 0 ? 'var(--clr-rose-gold)' : 'var(--clr-nude)'}; color: ${index === 0 ? 'white' : 'var(--clr-neutral-gray)'}; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: all 0.3s;">
                                ${index + 1}
                            </div>
                            <span class="step-label" style="font-size: 0.85rem; font-weight: 500; color: ${index === 0 ? 'var(--clr-neutral-dark)' : 'var(--clr-neutral-gray)'};">${step}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Step 1: Services -->
                <div id="booking-step-1" class="booking-step">
                    <h3 style="margin-bottom: 20px;">1. Selecciona un Servicio</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${mockData.services.map(s => `
                            <div class="service-select-card card" data-service-id="${s.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; cursor: pointer; border: 2px solid transparent;">
                                <div>
                                    <h4 style="font-size: 1.1rem; margin-bottom: 5px;">${s.name}</h4>
                                    <p style="font-size: 0.9rem; color: var(--clr-neutral-gray);"><i data-lucide="clock" style="width:14px; height:14px; display:inline; vertical-align:middle;"></i> ${s.duration} min</p>
                                </div>
                                <div style="font-weight: 600; color: var(--clr-rose-gold-dark);">
                                    $${s.price.toLocaleString('es-CL')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 30px; text-align: right;">
                        <button class="btn btn-primary" id="btn-next-1" disabled>Siguiente <i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- Step 2: Professional -->
                <div id="booking-step-2" class="booking-step" style="display: none;">
                    <h3 style="margin-bottom: 20px;">2. Selecciona un Profesional</h3>
                    <div class="prof-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                        ${professionals.map(p => `
                            <div class="prof-select-card card text-center" data-prof-id="${p.id}" style="cursor: pointer; border: 2px solid transparent;">
                                <img src="${p.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}" alt="${p.name || 'Profesional'}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; object-fit: cover;">
                                <h4>${p.name || 'Sin Nombre'}</h4>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                        <button class="btn btn-outline" id="btn-prev-2"><i data-lucide="chevron-left"></i> Atrás</button>
                        <button class="btn btn-primary" id="btn-next-2" disabled>Siguiente <i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- Step 3: Date & Needs -->
                <div id="booking-step-3" class="booking-step" style="display: none;">
                    <h3 style="margin-bottom: 20px;">3. Fecha, Hora y Necesidades</h3>
                    
                    <div class="booking-step-3-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                        <div>
                            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Fecha</label>
                            <input type="date" id="booking-date" style="width: 100%; padding: 12px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); font-family: inherit; margin-bottom: 20px;">
                            
                            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Hora Disponible</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 200px; overflow-y: auto; padding-right: 10px;" id="time-slots-container">
                                ${mockData.timeSlots.map(t => `
                                    <button class="time-slot-btn" data-time="${t}" style="padding: 10px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); background: white; transition: all 0.2s;">${t}</button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 15px; font-weight: 500;">Checklist Especial (Opcional)</label>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" id="check-kids" style="width: 18px; height: 18px;">
                                    <span>Asistiré con niños (Kids Friendly)</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" id="check-time" style="width: 18px; height: 18px;">
                                    <span>Tengo el tiempo justo</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                    <input type="checkbox" id="check-event" style="width: 18px; height: 18px;">
                                    <span>Es para un evento especial</span>
                                </label>
                            </div>
                            
                            <label style="display: block; margin-top: 20px; margin-bottom: 10px; font-weight: 500;">Notas adicionales</label>
                            <textarea id="booking-notes" rows="3" style="width: 100%; padding: 12px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); font-family: inherit; resize: vertical;"></textarea>
                        </div>
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                        <button class="btn btn-outline" id="btn-prev-3"><i data-lucide="chevron-left"></i> Atrás</button>
                        <button class="btn btn-primary" id="btn-next-3" disabled>Siguiente <i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- Step 4: Personal Info -->
                <div id="booking-step-4" class="booking-step" style="display: none;">
                    <h3 style="margin-bottom: 20px;">4. Tus Datos</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div>
                            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Nombre Completo</label>
                            <input type="text" id="client-name" placeholder="Ej. Camila Silva" style="width: 100%; padding: 12px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); font-family: inherit;">
                            <span id="error-name" style="color: red; font-size: 0.85rem; display: none; margin-top: 5px; display:block;"></span>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Teléfono</label>
                            <input type="tel" id="client-phone" placeholder="Ej. +56 9 4032 2551" style="width: 100%; padding: 12px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); font-family: inherit;">
                            <span id="error-phone" style="color: red; font-size: 0.85rem; display: none; margin-top: 5px; display:block;"></span>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Correo Electrónico (Opcional)</label>
                            <input type="email" id="client-email" placeholder="Ej. correo@email.com" style="width: 100%; padding: 12px; border: 1px solid var(--clr-nude); border-radius: var(--radius-sm); font-family: inherit;">
                            <span id="error-email" style="color: red; font-size: 0.85rem; display: none; margin-top: 5px; display:block;"></span>
                        </div>
                    </div>
                    <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                        <button class="btn btn-outline" id="btn-prev-4"><i data-lucide="chevron-left"></i> Atrás</button>
                        <button class="btn btn-primary" id="btn-next-4" disabled>Siguiente <i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- Step 5: Summary & Abono Flow -->
                <div id="booking-step-5" class="booking-step" style="display: none;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="width: 58px; height: 58px; background: linear-gradient(135deg, #1b75bb, #0b4f82); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; box-shadow: 0 6px 16px rgba(27,117,187,0.3);">
                            <i data-lucide="shield-check" style="width: 28px; height: 28px;"></i>
                        </div>
                        <h3 style="margin-bottom: 6px;">5. Abono y Confirmación</h3>
                        <p style="color: var(--clr-neutral-gray); font-size: 0.9rem; margin: 0;">
                            Para agendar tu hora se requiere un abono de <strong>$5.000</strong> mediante Flow.
                        </p>
                    </div>
                    
                    <div class="card" style="background: var(--clr-nude-light); border: none; margin-bottom: 20px; padding: 20px;">
                        <h4 style="margin-bottom: 12px; border-bottom: 1px solid var(--clr-nude); padding-bottom: 8px; color: var(--clr-neutral-dark); display:flex; align-items:center; gap:8px;">
                            <i data-lucide="calendar" style="width:16px; height:16px; color:var(--clr-rose-gold-dark);"></i> Resumen de la Cita
                        </h4>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.95rem;">
                            <p style="margin: 0;"><strong>Clienta:</strong> <span id="summary-client">-</span></p>
                            <p style="margin: 0;"><strong>Servicio:</strong> <span id="summary-service">-</span></p>
                            <p style="margin: 0;"><strong>Especialista:</strong> <span id="summary-prof">-</span></p>
                            <p style="margin: 0;"><strong>Fecha y Hora:</strong> <span id="summary-date">-</span> a las <span id="summary-time">-</span></p>
                        </div>
                    </div>

                    <!-- Desglose Financiero -->
                    <div class="card" style="background: white; border: 2px solid var(--clr-rose-gold); margin-bottom: 20px; padding: 20px; border-radius: var(--radius-md);">
                        <h4 style="margin-bottom: 14px; color: var(--clr-neutral-dark); display:flex; align-items:center; justify-content:space-between;">
                            <span><i data-lucide="receipt" style="width:18px; height:18px; display:inline; vertical-align:middle; color:var(--clr-rose-gold-dark); margin-right:6px;"></i> Detalle del Pago</span>
                            <span style="font-size: 0.78rem; background: #e3f2fd; color: #1565c0; padding: 3px 10px; border-radius: 12px; font-weight: 600;">Pasarela Flow.cl</span>
                        </h4>
                        
                        <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 0.95rem; color: var(--clr-neutral-gray);">
                            <span>Valor Total del Servicio:</span>
                            <span id="summary-price" style="font-weight:600; color:var(--clr-neutral-dark);">-</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom: 12px; padding: 10px 12px; background: #e8f5e9; border-radius: 6px; border: 1px solid #a5d6a7;">
                            <span style="font-weight:700; color:#1b5e20; display:flex; align-items:center; gap:6px;">
                                <i data-lucide="check-circle" style="width:16px; height:16px;"></i> Abono a Pagar Ahora (Flow):
                            </span>
                            <span style="font-weight:800; font-size:1.15rem; color:#1b5e20;">$5.000</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom: 10px; font-size: 0.95rem; color: var(--clr-neutral-dark);">
                            <span>Saldo Restante a Pagar en el Estudio:</span>
                            <span id="summary-balance" style="font-weight:700; color:var(--clr-rose-gold-dark);">-</span>
                        </div>
                        <small style="color: var(--clr-neutral-gray); font-size: 0.8rem; display:block; border-top: 1px dashed #ddd; padding-top: 8px;">
                            * El saldo restante se cancela presencialmente el día de tu atención (efectivo, débito o transferencia).
                        </small>
                    </div>

                    <!-- Flow Information Box -->
                    <div style="background: linear-gradient(135deg, #f7faff, #eef5fc); border: 1px solid #c7ddf5; border-radius: var(--radius-sm); padding: 16px 20px; margin-bottom: 25px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="background: #1b75bb; color:white; font-weight:900; font-size:0.85rem; padding:3px 9px; border-radius:4px; letter-spacing:0.5px;">flow</span>
                                <strong style="color:#0b4f82; font-size:0.95rem;">Pago Seguro en Línea</strong>
                            </div>
                            <span style="font-size:0.75rem; color:#1b75bb; font-weight:600;"><i data-lucide="lock" style="width:12px; height:12px; display:inline; vertical-align:middle;"></i> Encriptación SSL 256-bit</span>
                        </div>
                        <p style="margin: 0 0 10px; font-size: 0.85rem; color: #2c4b6f; line-height: 1.4;">
                            Acepta <strong>Webpay (Crédito y Débito)</strong>, <strong>CuentaRUT BancoEstado</strong>, <strong>Mach</strong>, <strong>Servipag</strong> y transferencias bancarias.
                        </p>
                        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                            <span style="background:white; border:1px solid #d0e1f3; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; color:#333;">Webpay</span>
                            <span style="background:white; border:1px solid #d0e1f3; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; color:#333;">Redcompra</span>
                            <span style="background:white; border:1px solid #d0e1f3; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; color:#333;">Visa / Mastercard</span>
                            <span style="background:white; border:1px solid #d0e1f3; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; color:#333;">CuentaRUT</span>
                            <span style="background:white; border:1px solid #d0e1f3; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; color:#333;">Mach</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <button class="btn btn-outline" id="btn-prev-5"><i data-lucide="chevron-left"></i> Atrás</button>
                        <button class="btn btn-primary" id="btn-confirm-booking" style="background: linear-gradient(135deg, #1b75bb, #0b4f82); border: none; padding: 13px 28px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 15px rgba(27,117,187,0.3); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="credit-card" style="width:18px; height:18px;"></i> Pagar Abono $5.000 con Flow
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Modal de Pasarela Flow para Confirmación -->
            <div id="flow-checkout-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index: 2500; align-items:center; justify-content:center; padding:15px;">
                <div class="card" style="max-width: 480px; width: 100%; background:white; border-radius: var(--radius-md); padding: 30px 25px; position:relative; box-shadow: var(--shadow-medium); text-align:center;">
                    <button id="close-flow-modal" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer; color:var(--clr-neutral-gray);"><i data-lucide="x"></i></button>
                    
                    <div style="width: 56px; height: 56px; background: #e3f2fd; color: #1b75bb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                        <i data-lucide="external-link" style="width: 28px; height: 28px;"></i>
                    </div>
                    
                    <h3 style="margin-bottom: 8px; color: var(--clr-neutral-dark);">Abonar $5.000 en Flow</h3>
                    <p style="color: var(--clr-neutral-gray); font-size: 0.9rem; margin-bottom: 20px;">
                        Estás a un paso de asegurar tu cita. Realiza el abono seguro de <strong>$5.000</strong> a través de Flow:
                    </p>

                    <div style="background: var(--clr-nude-light); padding: 12px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 0.9rem; text-align: left;">
                        <div style="margin-bottom: 4px;"><strong>Cita:</strong> <span id="flow-modal-service">-</span></div>
                        <div style="margin-bottom: 4px;"><strong>Fecha:</strong> <span id="flow-modal-datetime">-</span></div>
                        <div style="color: #1b5e20; font-weight: 700;"><strong>Monto Abono:</strong> $5.000 CLP</div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">
                        <a id="btn-flow-open-gateway" href="#" target="_blank" class="btn btn-primary" style="background: linear-gradient(135deg, #1b75bb, #0b4f82); border: none; padding: 13px; font-size: 1rem; font-weight: 700; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none;">
                            <i data-lucide="credit-card" style="width:18px; height:18px;"></i> Abrir Pasarela de Pago Flow ($5.000)
                        </a>

                        <div style="position:relative; margin: 10px 0; text-align:center;">
                            <span style="background:white; padding: 0 10px; font-size:0.8rem; color:#999; position:relative; z-index:1;">O tras pagar en Flow</span>
                            <div style="position:absolute; top:50%; left:0; width:100%; height:1px; background:#eee;"></div>
                        </div>

                        <div>
                            <input type="text" id="flow-proof-order" placeholder="N° de Comprobante / Transacción Flow (opcional)" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.88rem; margin-bottom:8px; text-align:center;">
                        </div>

                        <button id="btn-flow-confirm-paid" class="btn" style="background: #2e7d32; color: white; border: none; padding: 13px; font-size: 0.98rem; font-weight: 700; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="check-circle" style="width:18px; height:18px;"></i> ¡Ya pagué en Flow! Confirmar Cita
                        </button>
                    </div>

                    <small style="color: var(--clr-neutral-gray); font-size: 0.78rem; display:block;">
                        <i data-lucide="shield" style="width:12px; height:12px; display:inline; vertical-align:middle;"></i> Tu cita se reservará de inmediato una vez confirmado el abono.
                    </small>
                </div>
            </div>

            <!-- Modal de Éxito Actualizado -->
            <div id="success-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index: 3000; align-items:center; justify-content:center; padding:15px;">
                <div class="card text-center" style="max-width: 440px; width: 100%; background:white; border-radius:var(--radius-md); padding:35px 25px; box-shadow:var(--shadow-medium);">
                    <div style="width: 64px; height: 64px; background: #e8f5e9; color: #2e7d32; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                        <i data-lucide="party-popper" style="width: 32px; height: 32px;"></i>
                    </div>
                    <h3 style="margin-bottom: 10px; color:var(--clr-neutral-dark);">¡Cita Agendada y Abono Confirmado!</h3>
                    <div style="background:#e8f5e9; border:1px solid #c8e6c9; border-radius:6px; padding:12px; margin-bottom:15px; font-size:0.9rem; color:#1b5e20;">
                        <strong>Abono recibido vía Flow:</strong> $5.000 CLP<br>
                        <span id="success-balance-notice" style="font-size:0.85rem; color:#2e7d32;">El saldo restante se cancela el día de tu atención en el estudio.</span>
                    </div>
                    <p style="color: var(--clr-neutral-gray); font-size: 0.9rem; margin-bottom: 25px;">
                        Te hemos enviado los detalles de tu cita y confirmación a tu correo electrónico.
                    </p>
                    <button class="btn btn-primary btn-block" onclick="document.getElementById('success-modal').style.display='none'; AppRouter.navigate('home')">Volver al Inicio</button>
                </div>
            </div>
        </div>
    `;
}

function renderAdminView() {
    const auth = StorageHelper.getAuth();
    if (!auth.loggedIn) {
        return `
            <div class="container section" style="padding: 70px 20px; max-width: 440px; margin: 0 auto;">
                <div class="card" style="padding: 40px 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.07); border-radius: var(--radius-md); border-top: 4px solid var(--clr-rose-gold); background: white;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="width: 64px; height: 64px; background: var(--clr-nude-light); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; color: var(--clr-rose-gold-dark);">
                            <i data-lucide="shield" style="width: 32px; height: 32px;"></i>
                        </div>
                        <h2 style="font-size: 1.6rem; color: var(--clr-neutral-dark); margin-bottom: 8px;">Portal de Administración</h2>
                        <p style="color: var(--clr-neutral-gray); font-size: 0.9rem; margin: 0;">
                            Acceso para Administradora y Trabajadoras
                        </p>
                    </div>
                    
                    <form id="admin-login-form" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.9rem; color:var(--clr-neutral-dark);">Correo Electrónico</label>
                            <input type="email" id="admin-login-email" required placeholder="tu-correo@estudio.cl" autocomplete="username"
                                style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.9rem; color:var(--clr-neutral-dark);">Contraseña</label>
                            <input type="password" id="admin-login-password" required placeholder="••••••••" autocomplete="current-password"
                                style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                        </div>
                        
                        <p id="admin-login-error" style="color:#c62828; background:#ffebee; padding:9px 12px; border-radius:4px; font-size:0.85rem; display:none; margin:0;"></p>
                        
                        <button type="submit" class="btn btn-primary btn-block" id="btn-admin-submit-login" style="padding:13px; font-weight:600; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:6px;">
                            <i data-lucide="log-in" style="width:18px; height:18px;"></i> Ingresar al Portal
                        </button>
                    </form>
                    
                    <div style="text-align: center; margin-top: 22px; padding-top: 15px; border-top: 1px solid #eee;">
                        <a href="#" onclick="AppRouter.navigate('home')" style="color: var(--clr-neutral-gray); text-decoration: none; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 5px;">
                            <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Volver a la página principal
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    const isAdmin = auth.user.role === 'admin';
    const appointments = StorageHelper.getAppointments();
    const inventory = StorageHelper.getInventory();
    const professionals = StorageHelper.getProfessionals();
    const fichas = StorageHelper.getFichas();
    const clientsList = StorageHelper.getClients();

    // Filtramos la agenda según el rol
    let myAppointments = appointments;
    if (!isAdmin) {
        myAppointments = appointments.filter(a => (a.profesional === auth.user.name) || (a.profId === auth.user.id));
    }

    // Tabla de Agenda
    let agendaRows = '';
    if (myAppointments.length === 0) {
        agendaRows = `<tr><td colspan="6" class="text-center" style="padding: 20px;">No hay citas para mostrar.</td></tr>`;
    } else {
        myAppointments.forEach(app => {
            const serviceName = app.servicio || mockData.services.find(s => s.id === app.serviceId)?.name || 'Servicio';
            const profName = app.profesional || professionals.find(p => p.id === app.profId)?.name || 'Prof.';
            const isFichaDone = fichas.some(f => f.appointmentId === app.id);
            
            let needsHtml = '';
            if (app.needs) {
                const tags = [];
                if (app.needs.kids) tags.push('Ir con Niños');
                if (app.needs.time) tags.push('Poco tiempo');
                if (app.needs.event) tags.push('Evento especial');
                if (tags.length > 0) {
                    needsHtml = `<div style="margin-top: 5px; display: flex; gap: 5px; flex-wrap: wrap;">
                        ${tags.map(t => `<span style="background: var(--clr-nude-light); color: var(--clr-rose-gold-dark); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">${t}</span>`).join('')}
                    </div>`;
                }
            }

            let notesHtml = '';
            if (app.notes && app.notes.trim() !== '') {
                notesHtml = `<div style="margin-top: 5px; font-size: 0.8rem; color: var(--clr-neutral-gray); font-style: italic; border-left: 2px solid var(--clr-rose-gold); padding-left: 5px;">"${app.notes}"</div>`;
            }

            agendaRows += `
                <tr style="border-bottom: 1px solid var(--clr-nude);">
                    <td style="padding: 15px;">${app.date} <br><strong style="color: var(--clr-rose-gold-dark);">${app.time}</strong></td>
                    <td style="padding: 15px;"><strong>${app.clientName || 'Cliente'}</strong><br><small>${app.clientPhone}</small></td>
                    <td style="padding: 15px;">
                        ${serviceName} ${isAdmin ? `<br><small>${profName}</small>` : ''}
                        ${needsHtml}
                        ${notesHtml}
                        ${app.transactionId ? `<div style="margin-top: 5px; font-size: 0.8rem; color: #00B19B;"><strong>Comprobante:</strong> ${app.transactionId}</div>` : ''}
                    </td>
                    <td style="padding: 15px;">
                        <select class="status-selector" data-appid="${app.id}" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.85rem; outline: none; background: #e8f5e9; color: #2e7d32; font-weight: bold; cursor:pointer;">
                            <option value="confirmada" ${(app.status || 'confirmada') === 'confirmada' ? 'selected' : ''}>CONFIRMADA</option>
                            <option value="pendiente de pago" ${app.status === 'Pendiente de Pago' ? 'selected' : ''}>PENDIENTE DE PAGO</option>
                            <option value="pago reportado" ${app.status === 'Pago Reportado' ? 'selected' : ''}>PAGO REPORTADO</option>
                            <option value="completada" ${app.status === 'completada' ? 'selected' : ''}>COMPLETADA</option>
                            <option value="cancelada" ${app.status === 'cancelada' ? 'selected' : ''}>CANCELADA</option>
                            <option value="no asiste" ${app.status === 'no asiste' ? 'selected' : ''}>NO ASISTE</option>
                            <option value="bloqueada" ${app.status === 'bloqueada' ? 'selected' : ''}>BLOQUEADA</option>
                        </select>
                    </td>
                    <td style="padding: 15px;">
                        ${!isFichaDone ? `<button class="btn btn-outline btn-sm btn-ficha" data-appid="${app.id}">Crear Ficha</button>` : `<span style="color: #4CAF50;"><i data-lucide="check-circle" style="width:16px; display:inline; vertical-align:middle;"></i> Ficha Lista</span>`}
                    </td>
                </tr>
            `;
        });
    }

    // Tabla de Fichas
    let myFichas = fichas;
    if (!isAdmin) {
        myFichas = fichas.filter(f => {
            const appointment = appointments.find(a => a.id === f.appointmentId);
            return appointment && (appointment.profesional === auth.user.name || appointment.profId === auth.user.id);
        });
    }

    let fichasRows = '';
    if (myFichas.length === 0) {
        fichasRows = `<tr><td colspan="5" class="text-center" style="padding: 20px;">No hay fichas de clientas registradas.</td></tr>`;
    } else {
        myFichas.forEach(f => {
            fichasRows += `
                <tr style="border-bottom: 1px solid var(--clr-nude);">
                    <td style="padding: 15px;">${f.date}</td>
                    <td style="padding: 15px;"><strong>${f.clientName}</strong></td>
                    <td style="padding: 15px;">${f.serviceName}</td>
                    <td style="padding: 15px;">
                        <button class="btn btn-outline btn-sm btn-view-ficha" data-fichaid="${f.id}"><i data-lucide="eye"></i></button>
                        ${isAdmin ? `<button class="btn btn-outline btn-sm btn-del-ficha" style="color:red; border-color:red;" data-fichaid="${f.id}"><i data-lucide="trash-2"></i></button>` : ''}
                    </td>
                </tr>
            `;
        });
    }

    // Dashboard Metrics (Solo $5.000 del abono de la clienta, ya que el resto se paga presencial)
    let totalEarnings = 0;
    let completedAppointmentsCount = 0;
    const ABONO_MONTO = 5000;
    
    if (isAdmin) {
        appointments.forEach(a => {
            if (a.status === 'completada' || a.status === 'confirmada' || a.status === 'Pago Reportado') {
                totalEarnings += (a.depositAmount || ABONO_MONTO);
                completedAppointmentsCount++;
            }
        });
    }

    // Tabla de Inventario
    let invRows = '';
    inventory.forEach(p => {
        const isLowStock = p.stock <= 5;
        invRows += `
            <tr style="border-bottom: 1px solid var(--clr-nude); ${isLowStock ? 'background-color: #ffebee;' : ''}">
                <td style="padding: 15px;">
                    ${p.name}
                    ${isLowStock ? '<span style="color:red; font-size:0.8rem; font-weight:bold; margin-left:10px;"><i data-lucide="alert-triangle" style="width:14px; display:inline;"></i> Bajo Stock</span>' : ''}
                </td>
                <td style="padding: 15px;">${mockData.categories.find(c => c.id === p.category)?.label || p.category}</td>
                <td style="padding: 15px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="number" class="inv-stock-input" data-id="${p.id}" value="${p.stock}" min="0" style="width: 70px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; ${isLowStock ? 'border-color:red;' : ''}">
                        <button class="btn btn-outline btn-sm btn-update-stock" data-id="${p.id}"><i data-lucide="save" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Tabla Trabajadoras
    let profRows = '';
    professionals.forEach(p => {
        profRows += `
            <tr style="border-bottom: 1px solid var(--clr-nude);">
                <td style="padding: 15px; display:flex; align-items:center; gap:10px;">
                    <img src="${p.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                    ${p.name || 'Sin Nombre'}
                </td>
                <td style="padding: 15px;">${(p.role || 'profesional').toUpperCase()}</td>
                <td style="padding: 15px;">
                    ${isAdmin && p.id !== auth.user.id ? `<button class="btn btn-outline btn-sm btn-del-prof" style="color:red; border-color:red;" data-profid="${p.id}"><i data-lucide="trash-2"></i></button>` : ''}
                </td>
            </tr>
        `;
    });

    // Tabla Clientas
    let clientRows = '';
    if (clientsList.length === 0) {
        clientRows = `<tr><td colspan="4" class="text-center" style="padding: 20px;">No hay clientas en el directorio.</td></tr>`;
    } else {
        clientsList.forEach(c => {
            clientRows += `
                <tr style="border-bottom: 1px solid var(--clr-nude);">
                    <td style="padding: 15px;">
                        <a href="#" class="open-crm" data-clientid="${c.id}" style="color: var(--clr-rose-gold-dark); text-decoration: underline; font-weight: bold; cursor: pointer;">${c.name}</a><br>
                        <small>${c.phone || ''}</small>
                    </td>
                    <td style="padding: 15px;">${c.lastVisit || 'Sin registro'}</td>
                    <td style="padding: 15px;">${c.products || 'N/A'}</td>
                    <td style="padding: 15px;">
                        <button class="btn btn-outline btn-sm btn-del-client" style="color:red; border-color:red;" data-id="${c.id}"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    return `
        <div class="container section">
            <div class="section-header" style="margin-bottom: 30px; display:flex; justify-content: space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <h2 class="section-title" style="text-align: left; margin:0;">Portal ${isAdmin ? 'Administrador' : 'Trabajadora'}</h2>
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="font-weight:bold; color:var(--clr-rose-gold-dark); background:var(--clr-nude-light); padding:7px 16px; border-radius:20px; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="user" style="width:14px; height:14px;"></i>
                        ${auth.user.name || (isAdmin ? 'Administradora' : 'Trabajadora')}
                    </div>
                    <button type="button" onclick="window.logoutStaff()" id="btn-admin-logout" class="btn btn-outline" style="border-color:#d32f2f; color:#d32f2f; padding:7px 16px; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px; cursor:pointer; background:white; font-weight:600; border-radius:20px; transition:all 0.2s;">
                        <i data-lucide="log-out" style="width:15px; height:15px;"></i> Salir del Panel
                    </button>
                </div>
            </div>
            
            <div class="tabs-container" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #ddd; overflow-x: auto; white-space: nowrap; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">
                <button class="admin-tab active" data-target="tab-agenda" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid var(--clr-rose-gold); font-weight:bold; color:var(--clr-neutral-dark); flex-shrink: 0;">Agenda</button>
                <button class="admin-tab" data-target="tab-fichas" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Fichas Clientas</button>
                <button class="admin-tab" data-target="tab-galeria" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Galería</button>
                ${isAdmin ? `
                <button class="admin-tab" data-target="tab-finanzas" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Dashboard & Finanzas</button>
                <button class="admin-tab" data-target="tab-clientas" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Directorio</button>
                <button class="admin-tab" data-target="tab-inventario" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Inventario</button>
                <button class="admin-tab" data-target="tab-profs" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Trabajadoras</button>
                <button class="admin-tab" data-target="tab-flow" style="background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid transparent; color:var(--clr-neutral-gray); flex-shrink: 0;">Configuración Flow</button>
                ` : ''}
            </div>

            <!-- Tab Finanzas -->
            ${isAdmin ? `
            <div id="tab-finanzas" class="admin-tab-content" style="display:none;">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                    <button class="btn btn-outline" id="btn-descargar-excel" style="display:flex; align-items:center; gap:5px; border-color: #2e7d32; color: #2e7d32;"><i data-lucide="download"></i> Descargar Excel</button>
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div class="card" style="text-align:center; background: var(--clr-nude-light); border: 1px solid var(--clr-rose-gold);">
                        <h4 style="color: var(--clr-neutral-gray); margin-bottom: 8px; font-size:0.9rem;">Ingresos por Abonos ($5.000 c/u)</h4>
                        <h2 style="color: var(--clr-neutral-dark); font-size: 2rem; margin:0;">$${totalEarnings.toLocaleString('es-CL')}</h2>
                        <small style="color: var(--clr-neutral-gray); font-size: 0.78rem; display:block; margin-top: 6px;">Saldo restante se paga presencial</small>
                    </div>
                    <div class="card" style="text-align:center; background: #e8f5e9; border: 1px solid #81c784;">
                        <h4 style="color: #2e7d32; margin-bottom: 8px; font-size:0.9rem;">Citas con Abono Confirmado</h4>
                        <h2 style="color: #1b5e20; font-size: 2rem; margin:0;">${completedAppointmentsCount}</h2>
                        <small style="color: #2e7d32; font-size: 0.78rem; display:block; margin-top: 6px;">Confirmadas / Pagadas</small>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 20px;">Análisis de Negocio</h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <div class="card" style="background: white; border: 1px solid #eee; padding: 20px;">
                        <h4 style="text-align:center; margin-bottom: 15px; color: var(--clr-neutral-dark);">Servicios Más Solicitados</h4>
                        <canvas id="chart-services" style="max-height: 250px;"></canvas>
                    </div>
                    <div class="card" style="background: white; border: 1px solid #eee; padding: 20px;">
                        <h4 style="text-align:center; margin-bottom: 15px; color: var(--clr-neutral-dark);">Abonos por Profesional ($5.000 c/u)</h4>
                        <canvas id="chart-earnings" style="max-height: 250px;"></canvas>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Tab Agenda -->
            <div id="tab-agenda" class="admin-tab-content">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                    <button class="btn btn-outline" id="btn-bloquear-hora" style="display:flex; align-items:center; gap:5px;"><i data-lucide="clock"></i> Bloquear Horario</button>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; min-width: 600px; white-space: nowrap; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--clr-nude-light); color: var(--clr-neutral-dark);">
                                    <th style="padding: 15px;">Fecha / Hora</th>
                                    <th style="padding: 15px;">Cliente</th>
                                    <th style="padding: 15px;">Servicio</th>
                                    <th style="padding: 15px;">Estado</th>
                                    <th style="padding: 15px;">Acción</th>
                                </tr>
                            </thead>
                            <tbody>${agendaRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab Fichas Clientas -->
            <div id="tab-fichas" class="admin-tab-content" style="display:none;">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                    <button class="btn btn-primary" id="btn-crear-ficha-manual"><i data-lucide="plus"></i> Crear Ficha Clienta</button>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; min-width: 600px; white-space: nowrap; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--clr-nude-light); color: var(--clr-neutral-dark);">
                                    <th style="padding: 15px;">Fecha</th>
                                    <th style="padding: 15px;">Cliente</th>
                                    <th style="padding: 15px;">Servicio</th>
                                    <th style="padding: 15px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>${fichasRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            ${isAdmin ? `
            <!-- Tab Inventario -->
            <div id="tab-inventario" class="admin-tab-content" style="display:none;">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                    <button class="btn btn-primary" id="btn-add-product"><i data-lucide="plus"></i> Añadir Producto</button>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; min-width: 600px; white-space: nowrap; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--clr-nude-light); color: var(--clr-neutral-dark);">
                                    <th style="padding: 15px;">Producto</th>
                                    <th style="padding: 15px;">Categoría</th>
                                    <th style="padding: 15px;">Stock Actual</th>
                                </tr>
                            </thead>
                            <tbody>${invRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab Clientas -->
            <div id="tab-clientas" class="admin-tab-content" style="display:none;">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                    <button class="btn btn-primary" id="btn-add-client"><i data-lucide="plus"></i> Añadir Clienta</button>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; min-width: 600px; white-space: nowrap; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--clr-nude-light); color: var(--clr-neutral-dark);">
                                    <th style="padding: 15px;">Clienta</th>
                                    <th style="padding: 15px;">Última Visita</th>
                                    <th style="padding: 15px;">Productos / Preferencias</th>
                                    <th style="padding: 15px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>${clientRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab Trabajadoras -->
            <div id="tab-profs" class="admin-tab-content" style="display:none;">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                    <button class="btn btn-primary" id="btn-add-worker"><i data-lucide="plus"></i> Añadir Trabajadora</button>
                </div>
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; min-width: 600px; white-space: nowrap; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--clr-nude-light); color: var(--clr-neutral-dark);">
                                    <th style="padding: 15px;">Nombre</th>
                                    <th style="padding: 15px;">Rol</th>
                                    <th style="padding: 15px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>${profRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Tab Galería -->
            <div id="tab-galeria" class="admin-tab-content" style="display:none;">
                <div class="card" style="margin-bottom:20px; padding:20px;">
                    <h3 style="margin-bottom:15px;">Subir Nueva Foto (Administración)</h3>
                    <form id="form-upload-gallery" style="display:flex; flex-wrap:wrap; gap:15px; align-items:flex-end;">
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Título / Servicio</label>
                            <input type="text" id="gallery-title" required placeholder="Ej: Manicure Permanente" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="flex: 1; min-width: 250px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Seleccionar Imagen (Máx 5MB, se comprimirá automáticamente)</label>
                            <input type="file" id="gallery-file" required accept="image/*" style="width:100%; padding:7px; border:1px solid #ccc; border-radius:4px; background:white;">
                        </div>
                        <div style="flex: 0 0 auto;">
                            <button type="submit" class="btn btn-primary" id="btn-upload-gallery"><i data-lucide="upload"></i> Subir a Galería</button>
                        </div>
                    </form>
                    <p id="upload-status" style="margin-top:10px; color:var(--clr-neutral-gray); font-size:0.9rem; display:none;">Comprimiendo imagen...</p>
                </div>

                <!-- Filtros de Galería -->
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
                    <div style="display:flex; gap:8px; flex-wrap:wrap;" id="gallery-filter-chips">
                        <button type="button" class="gallery-filter-chip active" data-filter="all">
                            Todas (${StorageHelper.getGallery().length})
                        </button>
                        <button type="button" class="gallery-filter-chip" data-filter="client">
                            <i data-lucide="camera" style="width:14px; height:14px;"></i> Subidas por Clientas (${StorageHelper.getGallery().filter(g => g.source === 'client').length})
                        </button>
                        <button type="button" class="gallery-filter-chip" data-filter="admin">
                            Estudio (${StorageHelper.getGallery().filter(g => g.source !== 'client').length})
                        </button>
                    </div>
                    <span style="font-size:0.85rem; color:var(--clr-neutral-gray);">
                        <i data-lucide="info" style="width:14px; display:inline; vertical-align:middle;"></i> Las fotos subidas por clientas se integran automáticamente
                    </span>
                </div>
                
                <div id="admin-gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
                    ${StorageHelper.getGallery().map(img => {
                        const isClient = img.source === 'client';
                        return `
                        <div class="admin-gallery-item" data-source="${isClient ? 'client' : 'admin'}" style="border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-medium); position: relative; height: 230px; background:#222;">
                            <img src="${img.src}" alt="${img.title || 'Trabajo'}" style="width:100%; height:100%; object-fit:cover; display:block;">
                            
                            ${isClient ? `
                                <div style="position:absolute; top:10px; left:10px; z-index:2;">
                                    <span class="badge-client-photo">
                                        <i data-lucide="sparkles" style="width:12px; height:12px;"></i> Clienta: ${img.clientName || 'Clienta'}
                                    </span>
                                </div>
                            ` : ''}

                            <div style="position:absolute; bottom:0; left:0; width:100%; padding:10px 12px; background:linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 75%, transparent 100%); color:white; display:flex; justify-content:space-between; align-items:flex-end;">
                                <div style="overflow:hidden; padding-right:8px;">
                                    <div style="font-size:0.88rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                        ${img.serviceName || img.title || 'Servicio'}
                                    </div>
                                    ${img.title && img.title !== img.serviceName ? `
                                        <div style="font-size:0.75rem; color:#f0d0c0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">"${img.title}"</div>
                                    ` : ''}
                                    <div style="font-size:0.72rem; color:#ccc; margin-top:2px;">
                                        ${img.date ? img.date : ''} ${isClient && img.clientEmail ? '• ' + img.clientEmail : ''}
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                                    <button type="button" class="btn-download-gallery" data-src="${img.src}" data-title="${(img.serviceName || img.title || 'trabajo').replace(/[^a-zA-Z0-9_-]/g, '_')}" title="Descargar foto" style="background:rgba(255,255,255,0.25); border:none; color:white; cursor:pointer; padding:6px; border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); transition:all 0.2s ease;">
                                        <i data-lucide="download" style="width:16px; height:16px;"></i>
                                    </button>
                                    <button type="button" class="btn-del-gallery" data-id="${img.id}" title="Eliminar foto de la galería" style="background:rgba(0,0,0,0.4); border:none; color:var(--clr-rose-gold); cursor:pointer; padding:6px; border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center;">
                                        <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;}).join('')}
                    ${StorageHelper.getGallery().length === 0 ? '<p style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--clr-neutral-gray);">No hay imágenes en la galería.</p>' : ''}
                </div>
            </div>
            
            <!-- Tab Configuración Flow -->
            <div id="tab-flow" class="admin-tab-content" style="display:none;">
                <div class="card" style="max-width: 750px; margin: 0 auto; padding: 25px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                        <div style="background: linear-gradient(135deg, #1b75bb, #0b4f82); color:white; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem;">
                            flow
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.3rem; color:var(--clr-neutral-dark);">Configuración de Pasarela Flow</h3>
                            <p style="margin:4px 0 0; color:var(--clr-neutral-gray); font-size:0.88rem;">Gestiona el abono de $5.000 que pagan las clientas para agendar su hora.</p>
                        </div>
                    </div>

                    <form id="form-flow-config" style="display:flex; flex-direction:column; gap:18px;">
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.92rem; color:var(--clr-neutral-dark);">
                                Link o Botón de Pago Flow ($5.000)
                            </label>
                            <input type="url" id="flow-cfg-url" placeholder="https://www.flow.cl/btn.php?token=... o https://flow.cl/p/..." style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                            <small style="color:var(--clr-neutral-gray); font-size:0.8rem; display:block; margin-top:5px;">
                                Enlace directo creado desde tu portal de Flow.cl para cobrar los $5.000 de abono.
                            </small>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.92rem; color:var(--clr-neutral-dark);">
                                    API Key de Flow (Opcional)
                                </label>
                                <input type="text" id="flow-cfg-apikey" placeholder="Ej: 54A0F9B..." style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.92rem; color:var(--clr-neutral-dark);">
                                    Secret Key de Flow (Opcional)
                                </label>
                                <input type="password" id="flow-cfg-secret" placeholder="••••••••••••••••" style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                            </div>
                        </div>

                        <div style="padding:12px 15px; background:var(--clr-nude-light); border-radius:var(--radius-sm); display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="flow-cfg-sandbox" style="width:18px; height:18px; cursor:pointer;">
                            <label for="flow-cfg-sandbox" style="cursor:pointer; font-size:0.9rem; font-weight:500; margin:0;">
                                Usar entorno de pruebas Flow Sandbox (modo desarrollo)
                            </label>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
                            <button type="submit" class="btn btn-primary" id="btn-save-flow-cfg" style="padding:12px 24px; font-weight:600; display:flex; align-items:center; gap:6px;">
                                <i data-lucide="save"></i> Guardar Configuración Flow
                            </button>
                        </div>
                    </form>

                    <div style="margin-top:25px; padding:15px; border-radius:var(--radius-sm); background:#f8f9fa; border-left:4px solid #1b75bb; font-size:0.85rem; color:#444;">
                        <strong><i data-lucide="info" style="width:14px; height:14px; display:inline; vertical-align:middle;"></i> ¿Cómo funciona el cobro de Flow?</strong>
                        <ul style="margin: 6px 0 0 18px; padding: 0; line-height: 1.5;">
                            <li>La clienta completa su servicio, profesional, fecha, hora y datos.</li>
                            <li>En el último paso, el sistema le desglosa el valor del servicio y le solicita el <strong>abono de $5.000 vía Flow</strong>.</li>
                            <li>La clienta paga a través de Webpay, CuentaRUT, tarjetas o transferencia con la seguridad de Flow.</li>
                            <li>Al completarse el abono, la cita queda <strong>confirmada</strong> y el dashboard computa los $5.000. El saldo se paga presencialmente en el estudio.</li>
                        </ul>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Modal Ficha Form (Oculto) -->
            <div id="ficha-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 2000; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width: 500px; width: 100%; position:relative; max-height:90vh; overflow-y:auto; background:white;">
                    <button id="close-ficha" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer;"><i data-lucide="x"></i></button>
                    <h3 style="margin-bottom: 20px;">Ficha Clienta</h3>
                    <form id="form-ficha">
                        <input type="hidden" id="ficha-appid">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Cliente:</label>
                            <input type="text" id="ficha-client" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Servicio:</label>
                            <input type="text" id="ficha-service" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        
                        <!-- Campos Dinámicos -->
                        <div id="ficha-dynamic-fields" style="background: var(--clr-nude-light); padding:15px; border-radius:4px; margin-bottom:15px; display:none;">
                            <!-- Inyectado por JS -->
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Productos Utilizados:</label>
                            <div style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding:10px; border-radius:4px;" id="ficha-products-list">
                                ${inventory.map(p => `
                                    <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; cursor:pointer;">
                                        <span><input type="checkbox" class="ficha-prod-check" value="${p.id}" data-name="${p.name}"> ${p.name} (Stock: ${p.stock})</span>
                                        <input type="number" class="ficha-prod-qty" id="qty_${p.id}" value="1" min="1" max="${p.stock}" style="width:60px; padding:4px;" disabled>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Observaciones:</label>
                            <textarea id="ficha-notes" rows="3" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-family:inherit;"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">Guardar Ficha</button>
                    </form>
                </div>
            </div>
            
            <!-- Modal Ver Ficha -->
            <div id="view-ficha-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 2000; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width: 500px; width: 100%; position:relative; max-height:90vh; overflow-y:auto; background:white;">
                    <button onclick="document.getElementById('view-ficha-modal').style.display='none'" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer;"><i data-lucide="x"></i></button>
                    <h3 style="margin-bottom: 20px;">Detalle de Ficha Clienta</h3>
                    <div id="view-ficha-content"></div>
                    <div style="margin-top: 20px; text-align:center;">
                        <button class="btn btn-outline" id="btn-whatsapp-reminder" style="border-color:#25D366; color:#25D366;"><i data-lucide="message-circle" style="display:inline; vertical-align:middle; width:18px;"></i> Enviar Recordatorio</button>
                    </div>
                </div>
            </div>

            <!-- Modal Trabajadora -->
            <div id="worker-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 2000; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width: 400px; width: 100%; position:relative; background:white;">
                    <button id="close-worker" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer;"><i data-lucide="x"></i></button>
                    <h3 style="margin-bottom: 20px;">Añadir Trabajadora</h3>
                    <form id="form-worker">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Nombre Completo:</label>
                            <input type="text" id="worker-name" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Correo Electrónico:</label>
                            <input type="email" id="worker-email" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Foto de Perfil:</label>
                            <input type="file" id="worker-photo" accept="image/*" required style="width:100%; padding:7px; border:1px solid #ccc; border-radius:4px; background:white;">
                        </div>
                        <p style="margin-bottom: 15px; color: var(--clr-neutral-gray); font-size: 0.85rem; border-left: 3px solid var(--clr-rose-gold); padding-left: 10px;">
                            La contraseña de acceso será: <strong>Nicolett123!</strong>
                        </p>
                        <button type="submit" class="btn btn-primary btn-block" id="btn-save-worker">Guardar Trabajadora</button>
                    </form>
                    <p id="worker-upload-status" style="margin-top:10px; color:var(--clr-neutral-gray); font-size:0.9rem; display:none;">Procesando...</p>
                </div>
            </div>

            <!-- Modal Clienta -->
            <div id="client-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 2000; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width: 400px; width: 100%; position:relative; background:white;">
                    <button id="close-client" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer;"><i data-lucide="x"></i></button>
                    <h3 style="margin-bottom: 20px;">Añadir Clienta</h3>
                    <form id="form-client">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Nombre Completo:</label>
                            <input type="text" id="client-name-input" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Teléfono:</label>
                            <input type="tel" id="client-phone-input" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Productos Favoritos / Notas:</label>
                            <textarea id="client-products" rows="3" placeholder="Ej: Ocupa acrílico marca X" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-family:inherit;"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="btn-save-client">Guardar Clienta</button>
                    </form>
                </div>
            </div>

            <!-- Modal Producto -->
            <div id="product-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 2000; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width: 400px; width: 100%; position:relative; background:white;">
                    <button id="close-product" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer;"><i data-lucide="x"></i></button>
                    <h3 style="margin-bottom: 20px;">Añadir Producto</h3>
                    <form id="form-product">
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Nombre del Producto:</label>
                            <input type="text" id="prod-name" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Categoría:</label>
                            <select id="prod-cat" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                                <option value="manos-pies">Manicure & Pedicure</option>
                                <option value="mirada">Lashista & Mirada</option>
                                <option value="capilar">Tratamientos Capilares</option>
                                <option value="bienestar">Bienestar y Relax</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Stock Inicial:</label>
                            <input type="number" id="prod-stock" required min="0" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="btn-save-product">Guardar Producto</button>
                    </form>
                </div>
            </div>
            
            <!-- Modal Bloquear Horario -->
            <div id="modal-bloquear-hora" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index: 2000; align-items:center; justify-content:center;">
                <div class="card" style="max-width: 400px; width: 90%; background:white; padding:20px; border-radius:8px;">
                    <h3 style="margin-bottom: 15px;">Bloquear Horario</h3>
                    <p style="font-size:0.9rem; color:#666; margin-bottom:15px;">Bloquea una fecha y hora para que los clientes no puedan agendar.</p>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">Fecha</label>
                        <input type="date" id="block-date" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">Hora</label>
                        <input type="time" id="block-time" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; margin-top:20px;">
                        <button class="btn btn-outline" id="btn-close-block-modal">Cancelar</button>
                        <button class="btn btn-primary" id="btn-save-block-modal" style="background:#d32f2f;">Bloquear</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPerfilView() {
    const persStr = localStorage.getItem('nicolett_personalization');
    if (!persStr) {
        return `
            <div class="container section text-center" style="padding: 80px 20px;">
                <div class="card" style="max-width: 550px; margin: 0 auto; padding: 40px 30px; background: #ffffff; box-shadow: var(--shadow-medium); border-radius: var(--radius-lg);">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: var(--clr-nude-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--clr-rose-gold);">
                        <i data-lucide="user" style="width: 32px; height: 32px;"></i>
                    </div>
                    <h3 class="section-title" style="margin-bottom: 15px; font-size: 1.8rem;">Mi Perfil</h3>
                    <p style="color: var(--clr-neutral-gray); margin-bottom: 25px; line-height: 1.6;">
                        Personaliza tu experiencia ingresando tus datos para acceder a tu historial de visitas y facilitar tus próximas reservas.
                    </p>
                    <button class="btn btn-primary" onclick="const m=document.getElementById('personalize-modal'); if(m){m.style.display='flex'; m.style.opacity='1';}">
                        Personalizar mi Perfil
                    </button>
                    <div style="margin-top: 15px;">
                        <button class="btn btn-secondary" style="font-size: 0.9rem;" onclick="AppRouter.navigate('agendar')">
                            Agendar Cita Directamente
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    let pers;
    try {
        pers = JSON.parse(persStr);
    } catch(e) {
        return `<div class="container section text-center"><p>Error al cargar el perfil.</p></div>`;
    }

    // Filtrar citas de la clienta por su correo registrado
    const allAppointments = StorageHelper.getAppointments();
    const userAppointments = allAppointments.filter(a => a.clientEmail && a.clientEmail.toLowerCase() === pers.email.toLowerCase());
    
    // Obtener fotos que esta clienta ha subido
    const clientPhotos = StorageHelper.getClientGallery ? StorageHelper.getClientGallery(pers.email) : [];

    // Ordenar citas por fecha descendente
    userAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));

    let historyHtml = '';
    if (userAppointments.length > 0) {
        historyHtml = '<div style="display:grid; gap:16px; max-width:680px; margin: 0 auto; text-align:left;">';
        userAppointments.forEach(appt => {
            historyHtml += `
                <div class="card" style="padding:22px 24px; border-left: 5px solid var(--clr-rose-gold); background: #ffffff; box-shadow: var(--shadow-soft); border-radius: var(--radius-md);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                        <h4 style="margin:0; color:var(--clr-neutral-dark); font-size:1.2rem;">${appt.servicio || 'Servicio de Belleza'}</h4>
                        <span style="font-size:0.85rem; color:var(--clr-rose-gold-dark); font-weight:600; background:var(--clr-nude-light); padding:5px 12px; border-radius:20px;">
                            ${appt.date} • ${appt.time}
                        </span>
                    </div>
                    <p style="margin:4px 0 0 0; font-size:0.95rem; color:var(--clr-neutral-gray);">
                        Especialista: <strong style="color:var(--clr-neutral-dark);">${appt.profesional}</strong>
                    </p>
                    ${appt.abono ? `<p style="margin:6px 0 0 0; font-size:0.85rem; color:#28a745; font-weight:500;">✓ Abono verificado: $5.000</p>` : ''}
                    
                    <div style="margin-top:14px; padding-top:12px; border-top: 1px dashed #e8dcd0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <span style="font-size:0.85rem; color:var(--clr-neutral-gray); display:inline-flex; align-items:center; gap:5px;">
                            <i data-lucide="sparkles" style="width:13px; height:13px; color:var(--clr-rose-gold);"></i> ¿Cómo quedó tu resultado?
                        </span>
                        <button type="button" class="btn btn-outline btn-sm btn-service-photo" data-service="${appt.servicio || ''}" data-prof="${appt.profesional || ''}" data-date="${appt.date || ''}" style="padding:6px 14px; font-size:0.82rem; font-weight:600; border-radius:20px; display:inline-flex; align-items:center; gap:6px; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark);">
                            <i data-lucide="camera" style="width:14px; height:14px;"></i> Sacar foto de este servicio
                        </button>
                    </div>
                </div>
            `;
        });
        historyHtml += '</div>';
    } else {
        historyHtml = `
            <div class="card" style="padding:40px 30px; max-width:680px; margin: 0 auto; background: #ffffff; box-shadow: var(--shadow-soft); text-align:center; border-radius: var(--radius-md);">
                <div style="width:65px; height:65px; border-radius:50%; background:var(--clr-nude-light); display:flex; align-items:center; justify-content:center; margin:0 auto 15px; color:var(--clr-rose-gold);">
                    <i data-lucide="sparkles" style="width:30px; height:30px;"></i>
                </div>
                <h4 style="color:var(--clr-rose-gold-dark); margin-bottom:12px; font-size:1.35rem;">¡Bienvenida a Nicolett Studio Fantasy!</h4>
                <p style="color:var(--clr-neutral-gray); max-width:480px; margin:0 auto 24px; line-height: 1.6;">
                    Aún no tienes citas registradas asociadas a tu correo (<strong>${pers.email}</strong>). ¡Te invitamos a agendar tu próxima experiencia de autocuidado!
                </p>
                <button class="btn btn-primary" onclick="AppRouter.navigate('agendar')">
                    Agendar mi primera cita
                </button>
            </div>
        `;
    }

    // Condición: La clienta solo puede subir fotos si tiene citas agendadas previamente
    const hasAppointments = userAppointments.length > 0;

    // Sección de fotos tomadas / subidas por la clienta
    let clientGalleryHtml = `
        <div style="max-width:680px; margin:40px auto 0; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="margin:0; font-size:1.35rem; color:var(--clr-rose-gold-dark); display:flex; align-items:center; gap:8px;">
                        <i data-lucide="images" style="width:22px; height:22px;"></i> Galería de mis Resultados
                    </h3>
                    <p style="margin:4px 0 0; font-size:0.88rem; color:var(--clr-neutral-gray);">
                        Fotos de tus servicios guardadas en tu perfil y enviadas a la galería del salón.
                    </p>
                </div>
                ${hasAppointments ? `
                    <button type="button" class="btn btn-outline btn-sm btn-open-photo-modal-action" style="display:inline-flex; align-items:center; gap:6px; border-radius:20px; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark);">
                        <i data-lucide="plus"></i> Nueva Foto
                    </button>
                ` : ''}
            </div>

            ${clientPhotos.length > 0 ? `
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px;">
                    ${clientPhotos.map(photo => `
                        <div class="card client-photo-card" style="padding:0; overflow:hidden; border-radius:var(--radius-md); box-shadow:var(--shadow-soft); background:#fff; position:relative;">
                            <div style="height:170px; width:100%; overflow:hidden; background:#000;">
                                <img src="${photo.src}" alt="${photo.title || 'Foto de servicio'}" style="width:100%; height:100%; object-fit:cover; display:block;">
                            </div>
                            <div style="padding:12px 14px;">
                                <div style="font-weight:600; color:var(--clr-neutral-dark); font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${photo.serviceName || photo.title || 'Servicio realizado'}
                                </div>
                                ${photo.title && photo.title !== photo.serviceName ? `
                                    <p style="margin:3px 0 0; font-size:0.8rem; color:var(--clr-neutral-gray); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${photo.title}"</p>
                                ` : ''}
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:0.75rem; color:var(--clr-neutral-gray);">
                                    <span><i data-lucide="calendar" style="width:12px; height:12px; vertical-align:middle;"></i> ${photo.date || 'Reciente'}</span>
                                    <button type="button" class="btn-del-client-photo" data-id="${photo.id}" title="Eliminar mi foto" style="background:none; border:none; color:#c62828; cursor:pointer; padding:4px;">
                                        <i data-lucide="trash-2" style="width:15px; height:15px;"></i>
                                    </button>
                                </div>
                            </div>
                            <span style="position:absolute; top:8px; right:8px; background:rgba(40,167,69,0.92); color:white; padding:2px 8px; border-radius:12px; font-size:0.7rem; font-weight:600; backdrop-filter:blur(3px);">
                                ✓ En Galería
                            </span>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="card" style="padding:28px 20px; text-align:center; background:#ffffff; box-shadow:var(--shadow-soft); border-radius:var(--radius-md); border:1.5px dashed #dfd5cb;">
                    <i data-lucide="${hasAppointments ? 'camera' : 'calendar-plus'}" style="width:36px; height:36px; color:var(--clr-rose-gold); margin-bottom:8px;"></i>
                    <h4 style="margin:0 0 6px; font-size:1.1rem; color:var(--clr-neutral-dark);">
                        ${hasAppointments ? 'Aún no has compartido fotos de tus servicios' : 'Aún no tienes fotos de servicios'}
                    </h4>
                    <p style="margin:0 auto 16px; font-size:0.88rem; color:var(--clr-neutral-gray); max-width:440px; line-height:1.5;">
                        ${hasAppointments 
                            ? 'Toma una foto de tus uñas, pestañas o peinado para mostrar el resultado de tu atención. ¡Aparecerá aquí y en la galería del salón!'
                            : 'Para poder subir fotos a la galería y compartir tus resultados, primero debes agendar tu atención con nosotros.'}
                    </p>
                    ${hasAppointments ? `
                        <button type="button" class="btn btn-outline btn-sm btn-open-photo-modal-action" style="display:inline-flex; align-items:center; gap:6px; border-radius:20px; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark); padding:8px 18px; font-weight:600;">
                            <i data-lucide="camera"></i> Sacar mi primera foto
                        </button>
                    ` : `
                        <button type="button" class="btn btn-primary btn-sm" onclick="AppRouter.navigate('agendar')" style="display:inline-flex; align-items:center; gap:6px; border-radius:20px; padding:8px 20px; font-weight:600;">
                            <i data-lucide="calendar"></i> Agendar mi primera cita
                        </button>
                    `}
                </div>
            `}
        </div>
    `;

    return `
        <div class="container section text-center" style="padding: 60px 20px;">
            <div style="max-width: 680px; margin: 0 auto 28px; text-align: center;">
                <h2 class="section-title" style="margin-bottom: 8px;">Hola, ${pers.name}</h2>
                <p class="section-subtitle" style="color: var(--clr-neutral-gray); font-size: 1.05rem;">
                    Este es tu espacio personal, el historial de tus atenciones y la galería de tus resultados.
                </p>
                <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:14px; flex-wrap:wrap;">
                    <div style="display:inline-flex; align-items:center; gap:8px; background:var(--clr-nude-light); padding:6px 16px; border-radius:30px; font-size:0.85rem; color:var(--clr-neutral-gray);">
                        <i data-lucide="mail" style="width:14px; height:14px;"></i>
                        <span>${pers.email}</span>
                    </div>
                    <button type="button" class="btn" onclick="logoutClientProfile()" style="background:#ffffff; border:1px solid #e2b9c3; color:#b5455a; padding:6px 18px; border-radius:30px; font-size:0.85rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:var(--shadow-soft); transition:all 0.3s ease;">
                        <i data-lucide="log-out" style="width:15px; height:15px;"></i>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            ${hasAppointments ? `
            <!-- Banner para tomar/subir fotos del servicio (Habilitado para clientas con citas) -->
            <div class="card" style="padding: 22px 24px; max-width: 680px; margin: 0 auto 28px; background: linear-gradient(135deg, #FFF9F5 0%, #FFFFFF 100%); border: 1.5px solid var(--clr-rose-gold-light); box-shadow: var(--shadow-soft); border-radius: var(--radius-md); text-align: left;">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
                    <div style="display:flex; align-items:center; gap:16px; flex:1; min-width:240px;">
                        <div style="width:50px; height:50px; border-radius:50%; background:var(--clr-nude); display:flex; align-items:center; justify-content:center; color:var(--clr-rose-gold-dark); flex-shrink:0;">
                            <i data-lucide="camera" style="width:24px; height:24px;"></i>
                        </div>
                        <div>
                            <h4 style="margin:0 0 4px 0; color:var(--clr-rose-gold-dark); font-size:1.15rem;">¿Te encantó tu resultado?</h4>
                            <p style="margin:0; font-size:0.88rem; color:var(--clr-neutral-gray); line-height:1.4;">
                                Saca una foto con tu cámara o sube una imagen de tu atención para guardarla en tu perfil y compartirla en la galería del salón.
                            </p>
                        </div>
                    </div>
                    <button type="button" id="btn-open-photo-modal-banner" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:8px; padding:10px 20px; font-size:0.92rem; white-space:nowrap;">
                        <i data-lucide="camera"></i> Sacar / Subir Foto
                    </button>
                </div>
            </div>
            ` : `
            <!-- Aviso de bloqueo: solo clientas con citas pueden subir fotos -->
            <div class="card" style="padding: 24px 20px; max-width: 680px; margin: 0 auto 28px; background: #faf7f4; border: 1.5px dashed var(--clr-rose-gold-light); box-shadow: var(--shadow-soft); border-radius: var(--radius-md); text-align: center;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; color: var(--clr-rose-gold-dark); box-shadow: var(--shadow-soft);">
                    <i data-lucide="lock" style="width: 22px; height: 22px;"></i>
                </div>
                <h4 style="margin: 0 0 6px 0; color: var(--clr-rose-gold-dark); font-size: 1.15rem;">Subida de fotos para clientas con citas</h4>
                <p style="margin: 0 auto 16px; color: var(--clr-neutral-gray); font-size: 0.9rem; max-width: 480px; line-height: 1.5;">
                    Para compartir fotos de tus servicios en la galería, primero debes tener al menos una cita agendada o realizada con nosotras.
                </p>
                <button class="btn btn-outline btn-sm" onclick="AppRouter.navigate('agendar')" style="padding: 8px 22px; border-radius: 20px; border-color: var(--clr-rose-gold); color: var(--clr-rose-gold-dark); font-weight: 600;">
                    <i data-lucide="calendar"></i> Agendar mi primera cita
                </button>
            </div>
            `}
            
            ${historyHtml}

            ${clientGalleryHtml}

            ${userAppointments.length > 0 ? `
            <div style="margin-top: 40px;">
                <button class="btn btn-primary" style="font-size:1.05rem; padding: 14px 34px;" onclick="AppRouter.navigate('agendar')">
                    Agendar Nueva Cita
                </button>
            </div>
            ` : ''}
        </div>
    `;
}


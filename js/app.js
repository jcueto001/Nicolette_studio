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
                if (route === 'galeria') initGaleriaEvents();
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
    const images = StorageHelper.getPublicGallery();
    const professionals = StorageHelper.getProfessionals();

    return `
        <div class="container section">
            <div class="section-header">
                <h2 class="section-title">Galería de Trabajos</h2>
                <p class="section-subtitle">Conoce los espectaculares resultados creados por nuestras especialistas. Desliza o filtra por profesional.</p>
            </div>

            <!-- Filtros por Especialista -->
            <div class="gallery-filter-chips" style="display:flex; justify-content:center; gap:10px; margin-bottom:28px; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm public-gal-filter active" data-filter="all" style="border-radius:20px; padding:8px 20px; font-weight:600; cursor:pointer;">
                    Todas (${images.length})
                </button>
                ${professionals.map(p => {
                    const count = images.filter(img => {
                        const pName = (img.profesional || '').toLowerCase();
                        const pId = (img.profId || '').toLowerCase();
                        return pName.includes(p.name.toLowerCase()) || pId === p.id.toLowerCase();
                    }).length;
                    return `
                        <button type="button" class="btn btn-outline btn-sm public-gal-filter" data-filter="${p.name.toLowerCase()}" style="border-radius:20px; padding:8px 20px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                            <i data-lucide="sparkles" style="width:13px; height:13px;"></i> ${p.name} (${count})
                        </button>
                    `;
                }).join('')}
            </div>
            
            <div class="gallery-container" id="public-gallery-grid" style="display: flex; overflow-x: auto; gap: 30px; padding: 20px 0 40px; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: var(--clr-rose-gold) var(--clr-nude-light);">
                ${images.length === 0 ? '<p style="text-align:center; width:100%; padding:40px; color:var(--clr-neutral-gray);">Aún no hay fotos públicas en la galería.</p>' : ''}
                ${images.map(img => {
                    const profName = img.profesional || 'Nicolett Studio';
                    const isClient = img.source === 'client';

                    return `
                    <div class="gallery-item public-gallery-card" data-prof="${profName.toLowerCase()}" style="width: 85vw; max-width: 520px; flex: 0 0 auto; scroll-snap-align: center; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-medium); position: relative; aspect-ratio: 1/1; background:#000;">
                        <img src="${img.src}" alt="${img.title || 'Trabajo'}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                        
                        <!-- Overlay Informativo -->
                        <div style="position:absolute; bottom:0; left:0; right:0; padding:22px 20px; background:linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 70%, transparent 100%); color:white;">
                            <h3 style="margin:0 0 6px 0; font-size:1.3rem; font-weight:700;">${img.serviceName || img.title || 'Servicio de Belleza'}</h3>
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <span style="background:rgba(219, 137, 160, 0.95); color:white; padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                                    <i data-lucide="sparkles" style="width:12px; height:12px;"></i> Especialista: ${profName}
                                </span>
                                ${isClient ? `
                                    <span style="background:rgba(255,255,255,0.25); color:white; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:600; backdrop-filter:blur(4px); display:inline-flex; align-items:center; gap:4px;">
                                        <i data-lucide="camera" style="width:12px; height:12px;"></i> Clienta: ${img.clientName || 'Clienta'}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
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
            
            <!-- Modal de Pasarela Flow -->
            <div id="flow-checkout-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index: 2500; align-items:center; justify-content:center; padding:15px;">
                <div class="card" style="max-width: 480px; width: 100%; background:white; border-radius: var(--radius-md); padding: 28px 24px; position:relative; box-shadow: var(--shadow-medium); text-align:center;">
                    <button id="close-flow-modal" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer; color:var(--clr-neutral-gray);"><i data-lucide="x"></i></button>
                    
                    <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px;">
                        <span style="background:#1b75bb; color:white; font-weight:900; font-size:1.05rem; padding:3px 10px; border-radius:4px; letter-spacing:1px;">flow</span>
                        <h3 style="margin:0; font-size:1.25rem; color:#0b4f82;">Pasarela de Pago Segura</h3>
                    </div>

                    <p style="color: var(--clr-neutral-gray); font-size: 0.88rem; margin: 0 0 16px;">
                        Abono para confirmar tu reserva en <strong>Nicolett Studio</strong>
                    </p>

                    <div style="background: var(--clr-nude-light); padding: 12px 16px; border-radius: 8px; margin-bottom: 18px; font-size: 0.9rem; text-align: left; border: 1px solid var(--clr-nude);">
                        <div style="margin-bottom: 5px;"><strong>Servicio:</strong> <span id="flow-modal-service">-</span></div>
                        <div style="margin-bottom: 5px;"><strong>Fecha y Hora:</strong> <span id="flow-modal-datetime">-</span></div>
                        <div style="color: #1b5e20; font-weight: 700; font-size: 1.05rem; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #ccc; display:flex; justify-content:space-between;">
                            <span>Monto Abono Requerido:</span>
                            <span>$5.000 CLP</span>
                        </div>
                    </div>

                    <div style="text-align:left; margin-bottom:18px;">
                        <label style="display:block; font-size:0.85rem; font-weight:600; color:var(--clr-neutral-dark); margin-bottom:8px;">Selecciona tu medio de pago Flow:</label>
                        <div style="display:flex; flex-direction:column; gap:8px;" id="flow-payment-methods">
                            <label style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:2px solid #1b75bb; border-radius:8px; background:#f4f9fd; cursor:pointer;" class="flow-method-label">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <input type="radio" name="flow-method" value="Webpay Plus" checked style="accent-color:#1b75bb; width:16px; height:16px;">
                                    <div>
                                        <div style="font-weight:600; font-size:0.88rem; color:#1b75bb;">Webpay Plus (Débito y Crédito)</div>
                                        <small style="color:#666; font-size:0.75rem;">Visa, Mastercard, Magna, Redcompra</small>
                                    </div>
                                </div>
                                <span style="font-size:0.72rem; background:#fff; padding:2px 8px; border:1px solid #cce3f5; border-radius:4px; font-weight:600; color:#1b75bb;">Transbank</span>
                            </label>
                            
                            <label style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:1px solid #ddd; border-radius:8px; background:#fff; cursor:pointer;" class="flow-method-label">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <input type="radio" name="flow-method" value="CuentaRUT" style="accent-color:#1b75bb; width:16px; height:16px;">
                                    <div>
                                        <div style="font-weight:600; font-size:0.88rem; color:#333;">BancoEstado / CuentaRUT</div>
                                        <small style="color:#666; font-size:0.75rem;">Transferencia bancaria directa</small>
                                    </div>
                                </div>
                                <span style="font-size:0.72rem; background:#fff3e0; color:#e65100; padding:2px 8px; border-radius:4px; font-weight:600;">BancoEstado</span>
                            </label>

                            <label style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border:1px solid #ddd; border-radius:8px; background:#fff; cursor:pointer;" class="flow-method-label">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <input type="radio" name="flow-method" value="Mach / Servipag" style="accent-color:#1b75bb; width:16px; height:16px;">
                                    <div>
                                        <div style="font-weight:600; font-size:0.88rem; color:#333;">Mach / Servipag / Check</div>
                                        <small style="color:#666; font-size:0.75rem;">Billeteras electrónicas y prepago</small>
                                    </div>
                                </div>
                                <span style="font-size:0.72rem; background:#ede7f6; color:#512da8; padding:2px 8px; border-radius:4px; font-weight:600;">Billeteras</span>
                            </label>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
                        <button id="btn-flow-process-pay" class="btn btn-primary" style="background: linear-gradient(135deg, #1b75bb, #0b4f82); border: none; padding: 14px; font-size: 1.05rem; font-weight: 700; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:var(--radius-sm); box-shadow:0 4px 15px rgba(27,117,187,0.3); width:100%; cursor:pointer;">
                            <i data-lucide="shield-check" style="width:20px; height:20px;"></i> Pagar Abono de $5.000 y Agendar
                        </button>
                    </div>

                    <div id="flow-external-option" style="display:none; margin-bottom:12px;">
                        <a id="btn-flow-open-gateway" href="#" target="_blank" style="font-size:0.82rem; color:#1b75bb; text-decoration:underline;">
                            O pagar en enlace directo de Flow.cl <i data-lucide="external-link" style="width:12px; height:12px; display:inline;"></i>
                        </a>
                    </div>

                    <small style="color: var(--clr-neutral-gray); font-size: 0.76rem; display:block;">
                        <i data-lucide="lock" style="width:12px; height:12px; display:inline; vertical-align:middle; color:#1b75bb;"></i> Pago protegido con encriptación SSL 256-bit. El saldo restante se paga en el estudio.
                    </small>
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
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <label style="font-weight:600; font-size:0.9rem; color:var(--clr-neutral-dark); margin:0;">Contraseña</label>
                                <a href="#" id="link-forgot-admin-page" style="font-size:0.8rem; color:var(--clr-rose-gold-dark); text-decoration:underline;">¿Olvidaste tu contraseña?</a>
                            </div>
                            <div class="input-password-wrapper">
                                <input type="password" id="admin-login-password" required placeholder="••••••••" autocomplete="current-password"
                                    style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                                <button type="button" class="btn-toggle-pass" id="btn-toggle-admin-password" title="Mostrar/Ocultar contraseña" tabindex="-1">
                                    <i data-lucide="eye" style="width:18px; height:18px;"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div id="admin-login-error" class="auth-error-box" style="display:none;"></div>
                        
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
        const isSelf = p.id === auth.user.id || (p.email && auth.user.email && p.email.toLowerCase() === auth.user.email.toLowerCase());
        profRows += `
            <tr style="border-bottom: 1px solid var(--clr-nude);">
                <td style="padding: 15px; display:flex; align-items:center; gap:12px;">
                    <div style="position:relative;">
                        <img src="${p.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid var(--clr-rose-gold); box-shadow:0 2px 6px rgba(0,0,0,0.1); display:block;">
                        ${isAdmin ? `
                        <button type="button" class="btn-worker-edit-photo" data-profid="${p.id}" data-profname="${p.name || ''}" title="Cambiar y cuadrar foto" style="position:absolute; bottom:-3px; right:-3px; background:var(--clr-rose-gold); color:white; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; border:1px solid white; cursor:pointer; font-size:10px;">
                            <i data-lucide="camera" style="width:10px; height:10px;"></i>
                        </button>
                        ` : ''}
                    </div>
                    <div>
                        <div style="font-weight:600; color:var(--clr-neutral-dark);">${p.name || 'Sin Nombre'}</div>
                        <div style="font-size:0.8rem; color:var(--clr-neutral-gray);">${p.email || 'Sin correo'}</div>
                    </div>
                </td>
                <td style="padding: 15px;">
                    <span style="display:inline-block; padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:700; letter-spacing:0.3px; background:${(p.role === 'admin' ? '#fef3c7; color:#92400e;' : '#eff6ff; color:#1e40af;')}">
                        ${(p.role || 'profesional').toUpperCase()}
                    </span>
                </td>
                <td style="padding: 15px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        ${isAdmin ? `
                        <button type="button" class="btn btn-outline btn-sm btn-worker-change-pass" data-profid="${p.id}" data-profname="${p.name || ''}" data-profemail="${p.email || ''}" title="Crear / Asignar contraseña a esta trabajadora" style="padding:6px 10px; font-size:0.8rem; border-color:#d4b692; color:var(--clr-neutral-dark); display:inline-flex; align-items:center; gap:4px; border-radius:14px;">
                            <i data-lucide="key" style="width:13px; height:13px;"></i> Contraseña
                        </button>
                        <button type="button" class="btn btn-outline btn-sm btn-worker-edit-photo" data-profid="${p.id}" data-profname="${p.name || ''}" title="Cambiar y cuadrar foto de perfil" style="padding:6px 10px; font-size:0.8rem; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark); display:inline-flex; align-items:center; gap:4px; border-radius:14px;">
                            <i data-lucide="crop" style="width:13px; height:13px;"></i> Cuadrar Foto
                        </button>
                        ` : ''}
                        ${isAdmin && !isSelf ? `
                        <button type="button" class="btn btn-outline btn-sm btn-del-prof" title="Eliminar del equipo" style="color:#dc2626; border-color:#fca5a5; padding:6px 10px; border-radius:14px;" data-profid="${p.id}">
                            <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
                        </button>
                        ` : ''}
                    </div>
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

    // Persistencia de pestaña activa en panel admin/trabajadora
    let activeTab = 'tab-agenda';
    try {
        const savedTab = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nicolett_active_admin_tab') : null;
        const allowedTabs = isAdmin 
            ? ['tab-agenda', 'tab-fichas', 'tab-galeria', 'tab-finanzas', 'tab-clientas', 'tab-inventario', 'tab-profs', 'tab-flow']
            : ['tab-agenda', 'tab-fichas', 'tab-galeria'];
        if (savedTab && allowedTabs.includes(savedTab)) {
            activeTab = savedTab;
        } else if (savedTab && !allowedTabs.includes(savedTab)) {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('nicolett_active_admin_tab', 'tab-agenda');
            }
        }
    } catch (e) {
        console.warn('Error reading active admin tab:', e);
    }

    const getTabBtnStyle = (tabId) => {
        const isActive = (activeTab === tabId);
        return `background:none; border:none; padding:10px 20px; cursor:pointer; border-bottom:3px solid ${isActive ? 'var(--clr-rose-gold)' : 'transparent'}; font-weight:${isActive ? 'bold' : 'normal'}; color:${isActive ? 'var(--clr-neutral-dark)' : 'var(--clr-neutral-gray)'}; flex-shrink: 0;`;
    };
    const getTabBtnClass = (tabId) => `admin-tab ${activeTab === tabId ? 'active' : ''}`;
    const getTabPaneStyle = (tabId) => `display: ${activeTab === tabId ? 'block' : 'none'};`;

    return `
        <div class="container section">
            <div class="section-header" style="margin-bottom: 30px; display:flex; justify-content: space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <h2 class="section-title" style="text-align: left; margin:0;">Portal ${isAdmin ? 'Administrador' : 'Trabajadora'}</h2>
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="font-weight:bold; color:var(--clr-rose-gold-dark); background:var(--clr-nude-light); padding:7px 16px; border-radius:20px; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="user" style="width:14px; height:14px;"></i>
                        ${auth.user.name || (isAdmin ? 'Administradora' : 'Trabajadora')}
                    </div>
                    <button type="button" id="btn-open-change-password" class="btn btn-outline" style="border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark); padding:7px 16px; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px; cursor:pointer; background:white; font-weight:600; border-radius:20px; transition:all 0.2s;" title="Crear o cambiar la contraseña de tu cuenta">
                        <i data-lucide="key-round" style="width:15px; height:15px;"></i> Cambiar Mi Contraseña
                    </button>
                    <button type="button" onclick="window.logoutStaff()" id="btn-admin-logout" class="btn btn-outline" style="border-color:#d32f2f; color:#d32f2f; padding:7px 16px; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px; cursor:pointer; background:white; font-weight:600; border-radius:20px; transition:all 0.2s;">
                        <i data-lucide="log-out" style="width:15px; height:15px;"></i> Salir del Panel
                    </button>
                </div>
            </div>
            
            <div class="tabs-container" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid #ddd; overflow-x: auto; white-space: nowrap; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">
                <button class="${getTabBtnClass('tab-agenda')}" data-target="tab-agenda" style="${getTabBtnStyle('tab-agenda')}">Agenda</button>
                <button class="${getTabBtnClass('tab-fichas')}" data-target="tab-fichas" style="${getTabBtnStyle('tab-fichas')}">Fichas Clientas</button>
                <button class="${getTabBtnClass('tab-galeria')}" data-target="tab-galeria" style="${getTabBtnStyle('tab-galeria')}">Galería</button>
                ${isAdmin ? `
                <button class="${getTabBtnClass('tab-finanzas')}" data-target="tab-finanzas" style="${getTabBtnStyle('tab-finanzas')}">Dashboard & Finanzas</button>
                <button class="${getTabBtnClass('tab-clientas')}" data-target="tab-clientas" style="${getTabBtnStyle('tab-clientas')}">Directorio</button>
                <button class="${getTabBtnClass('tab-inventario')}" data-target="tab-inventario" style="${getTabBtnStyle('tab-inventario')}">Inventario</button>
                <button class="${getTabBtnClass('tab-profs')}" data-target="tab-profs" style="${getTabBtnStyle('tab-profs')}">Trabajadoras</button>
                <button class="${getTabBtnClass('tab-flow')}" data-target="tab-flow" style="${getTabBtnStyle('tab-flow')}">Configuración Flow</button>
                ` : ''}
            </div>

            <!-- Tab Finanzas -->
            ${isAdmin ? `
            <div id="tab-finanzas" class="admin-tab-content" style="${getTabPaneStyle('tab-finanzas')}">
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
            <div id="tab-agenda" class="admin-tab-content" style="${getTabPaneStyle('tab-agenda')}">
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
            <div id="tab-fichas" class="admin-tab-content" style="${getTabPaneStyle('tab-fichas')}">
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
            <div id="tab-inventario" class="admin-tab-content" style="${getTabPaneStyle('tab-inventario')}">
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
            <div id="tab-clientas" class="admin-tab-content" style="${getTabPaneStyle('tab-clientas')}">
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
            <div id="tab-profs" class="admin-tab-content" style="${getTabPaneStyle('tab-profs')}">
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
            ` : ''}
            
            <!-- Tab Galería (Visible para Administradora y Trabajadoras) -->
            <div id="tab-galeria" class="admin-tab-content" style="${getTabPaneStyle('tab-galeria')}">
                ${!isAdmin ? `
                <div class="card" style="margin-bottom:20px; padding:20px; background:linear-gradient(135deg, #FFF9F5 0%, #FFFFFF 100%); border-left: 5px solid var(--clr-rose-gold);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <h3 style="margin:0; font-size:1.35rem; color:var(--clr-rose-gold-dark); display:flex; align-items:center; gap:8px;">
                                <i data-lucide="camera" style="width:22px; height:22px;"></i> Galería de Trabajos • ${auth.user.name || 'Especialista'}
                            </h3>
                            <p style="margin:6px 0 0; color:var(--clr-neutral-gray); font-size:0.92rem;">
                                Aquí se reflejan automáticamente las fotos que tus clientas suben de los servicios que realizaste con ellas. Puedes revisarlas, descargarlas o aprobarlas para la galería pública.
                            </p>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="card" style="margin-bottom:20px; padding:20px;">
                    <h3 style="margin-bottom:15px;">Subir Nueva Foto a Galería (${isAdmin ? 'Administración' : (auth.user.name || 'Trabajadora')})</h3>
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

                ${(() => {
                    const allGal = StorageHelper.getGallery();
                    const workerName = (auth.user?.name || '').trim();
                    const workerId = (auth.user?.id || '').trim();

                    // Función para determinar si una imagen pertenece a la trabajadora conectada
                    const isMyImage = (img) => {
                        if (!workerName && !workerId) return false;
                        const pName = (img.profesional || '').trim().toLowerCase();
                        const pId = (img.profId || '').trim().toLowerCase();
                        if (workerId && pId && pId === workerId.toLowerCase()) return true;
                        if (workerName && pName) {
                            return pName === workerName.toLowerCase() || pName.includes(workerName.toLowerCase()) || workerName.toLowerCase().includes(pName);
                        }
                        return false;
                    };

                    const myPhotos = allGal.filter(g => isMyImage(g));
                    const myClientPhotos = myPhotos.filter(g => g.source === 'client');
                    const myPendingList = myClientPhotos.filter(g => !g.approved && g.status !== 'approved');

                    const pendingList = allGal.filter(g => g.source === 'client' && !g.approved && g.status !== 'approved');
                    const approvedClientList = allGal.filter(g => g.source === 'client' && (g.approved === true || g.status === 'approved'));
                    const studioList = allGal.filter(g => g.source !== 'client');
                    const publicTotal = studioList.length + approvedClientList.length;

                    return `
                    <!-- Barra de Moderación y Filtros de Galería -->
                    <div style="background:#fff; border:1px solid #e7ded4; border-radius:var(--radius-md); padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
                        <div style="display:flex; gap:8px; flex-wrap:wrap;" id="gallery-filter-chips">
                            ${!isAdmin ? `
                                <button type="button" class="gallery-filter-chip active" data-filter="my-client" style="background:#fff7ed; color:#c2410c; border-color:#fdba74; font-weight:700;">
                                    <i data-lucide="camera" style="width:14px; height:14px;"></i> Fotos de Mis Clientas (${myClientPhotos.length})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="my-all">
                                    <i data-lucide="user" style="width:14px; height:14px;"></i> Todos mis Trabajos (${myPhotos.length})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="my-pending" style="${myPendingList.length > 0 ? 'background:#fffbeb; color:#b45309; border-color:#fcd34d; font-weight:700;' : ''}">
                                    <i data-lucide="clock" style="width:14px; height:14px;"></i> Por Aprobar (${myPendingList.length})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="all">
                                    Toda la Galería (${allGal.length})
                                </button>
                            ` : `
                                <button type="button" class="gallery-filter-chip active" data-filter="all">
                                    Todas (${allGal.length})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="pending" style="${pendingList.length > 0 ? 'background:#fffbeb; color:#b45309; border-color:#fcd34d; font-weight:700;' : ''}">
                                    <i data-lucide="clock" style="width:14px; height:14px;"></i> Por Aprobar (${pendingList.length})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="public">
                                    <i data-lucide="eye" style="width:14px; height:14px;"></i> En Galería Pública (${publicTotal})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="client">
                                    <i data-lucide="camera" style="width:14px; height:14px;"></i> Clientas (${pendingList.length + approvedClientList.length})
                                </button>
                                <button type="button" class="gallery-filter-chip" data-filter="admin">
                                    Estudio (${studioList.length})
                                </button>
                                ${professionals.map(p => {
                                    const pCount = allGal.filter(g => (g.profesional && g.profesional.toLowerCase().includes(p.name.toLowerCase())) || (g.profId && g.profId === p.id)).length;
                                    return `
                                        <button type="button" class="gallery-filter-chip" data-filter="prof-${p.name.toLowerCase()}">
                                            <i data-lucide="user" style="width:13px; height:13px;"></i> ${p.name} (${pCount})
                                        </button>
                                    `;
                                }).join('')}
                            `}
                        </div>

                        <div style="font-size:0.85rem; color:var(--clr-neutral-gray); display:flex; align-items:center; gap:6px;">
                            <i data-lucide="shield-check" style="width:16px; height:16px; color:var(--clr-rose-gold);"></i>
                            <span>Las fotos de clientas quedan registradas con su especialista asignada.</span>
                        </div>
                    </div>

                    <div id="admin-gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px;">
                        ${allGal.map(img => {
                            const isClient = img.source === 'client';
                            const isApproved = !isClient || img.approved === true || img.status === 'approved';
                            const statusKey = isClient ? (isApproved ? 'approved' : 'pending') : 'studio';
                            const belongsToMe = isMyImage(img);
                            const profName = img.profesional || 'Nicolett Studio';

                            return `
                            <div class="admin-gallery-item" 
                                data-source="${isClient ? 'client' : 'admin'}" 
                                data-status="${statusKey}" 
                                data-prof="${profName.toLowerCase()}"
                                data-is-my-client="${(belongsToMe && isClient) ? 'true' : 'false'}"
                                data-is-my-work="${belongsToMe ? 'true' : 'false'}"
                                data-is-my-pending="${(belongsToMe && isClient && !isApproved) ? 'true' : 'false'}"
                                style="border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-medium); position: relative; height: 260px; background:#1c1917; border: 2px solid ${!isApproved ? '#f59e0b' : 'transparent'};">
                                <img src="${img.src}" alt="${img.title || 'Trabajo'}" style="width:100%; height:100%; object-fit:cover; display:block;">
                                
                                <!-- Badges Superiores -->
                                <div style="position:absolute; top:10px; left:10px; right:10px; display:flex; justify-content:space-between; align-items:center; z-index:2; pointer-events:none; flex-wrap:wrap; gap:4px;">
                                    <div style="display:flex; gap:5px; flex-wrap:wrap;">
                                        ${isClient ? `
                                            <span class="badge-client-photo" style="box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                                <i data-lucide="user" style="width:11px; height:11px;"></i> ${img.clientName || 'Clienta'}
                                            </span>
                                        ` : `
                                            <span style="background:rgba(0,0,0,0.65); color:#f5ebe0; padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:600; backdrop-filter:blur(4px);">
                                                Estudio
                                            </span>
                                        `}
                                        ${img.profesional ? `
                                            <span style="background:rgba(219, 137, 160, 0.95); color:white; padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:700; display:inline-flex; align-items:center; gap:3px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                                <i data-lucide="sparkles" style="width:11px; height:11px;"></i> ${img.profesional}
                                            </span>
                                        ` : ''}
                                    </div>
                                    
                                    ${isClient ? `
                                        ${!isApproved ? `
                                            <span style="background:#f59e0b; color:white; padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:700; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                                <i data-lucide="clock" style="width:11px; height:11px;"></i> Por Aprobar
                                            </span>
                                        ` : `
                                            <span style="background:#10b981; color:white; padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:700; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                                <i data-lucide="check" style="width:11px; height:11px;"></i> En Galería
                                            </span>
                                        `}
                                    ` : ''}
                                </div>

                                <!-- Barra Inferior de Información y Acciones -->
                                <div style="position:absolute; bottom:0; left:0; width:100%; padding:12px 14px; background:linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 70%, transparent 100%); color:white;">
                                    <div style="margin-bottom:8px;">
                                        <div style="font-size:0.9rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                            ${img.serviceName || img.title || 'Servicio'}
                                        </div>
                                        ${img.title && img.title !== img.serviceName ? `
                                            <div style="font-size:0.78rem; color:#f0d0c0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">"${img.title}"</div>
                                        ` : ''}
                                        <div style="font-size:0.72rem; color:#d6d3d1; margin-top:2px;">
                                            ${img.date || ''} ${isClient && img.clientEmail ? '• ' + img.clientEmail : ''} ${img.profesional ? '• Atendió: ' + img.profesional : ''}
                                        </div>
                                    </div>

                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                        <!-- Botón de Moderación para Fotos de Clientas -->
                                        <div>
                                            ${isClient ? `
                                                ${!isApproved ? `
                                                    <button type="button" class="btn-approve-gallery" data-id="${img.id}" style="background:#10b981; color:white; border:none; padding:5px 12px; border-radius:16px; font-size:0.78rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.2s; box-shadow:0 2px 6px rgba(0,0,0,0.2);" title="Aprobar para que aparezca en la galería pública de trabajos">
                                                        <i data-lucide="check" style="width:13px; height:13px;"></i> Aprobar para Galería
                                                    </button>
                                                ` : `
                                                    <button type="button" class="btn-unapprove-gallery" data-id="${img.id}" style="background:rgba(255,255,255,0.22); color:#fecaca; border:1px solid rgba(255,255,255,0.3); padding:4px 10px; border-radius:16px; font-size:0.75rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:all 0.2s;" title="Ocultar de la galería de trabajos pública">
                                                        <i data-lucide="eye-off" style="width:12px; height:12px;"></i> Ocultar de Galería
                                                    </button>
                                                `}
                                            ` : ''}
                                        </div>

                                        <!-- Acciones secundarias (descargar y eliminar) -->
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <button type="button" class="btn-download-gallery" data-src="${img.src}" data-title="${(img.serviceName || img.title || 'trabajo').replace(/[^a-zA-Z0-9_-]/g, '_')}" title="Descargar foto" style="background:rgba(255,255,255,0.22); border:none; color:white; cursor:pointer; padding:6px; border-radius:50%; width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
                                                <i data-lucide="download" style="width:15px; height:15px;"></i>
                                            </button>
                                            <button type="button" class="btn-del-gallery" data-id="${img.id}" title="${isClient && !isApproved ? 'Rechazar y eliminar foto' : 'Eliminar foto'}" style="background:rgba(220,38,38,0.7); border:none; color:white; cursor:pointer; padding:6px; border-radius:50%; width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center;">
                                                <i data-lucide="trash-2" style="width:15px; height:15px;"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                        ${allGal.length === 0 ? '<p style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--clr-neutral-gray);">No hay imágenes en la galería.</p>' : ''}
                    </div>
                    `;
                })()}
            </div>
            
            ${isAdmin ? `
            <!-- Tab Configuración Flow -->
            <div id="tab-flow" class="admin-tab-content" style="${getTabPaneStyle('tab-flow')}">
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
                                    API Key de Flow
                                </label>
                                <input type="text" id="flow-cfg-apikey" placeholder="Ej: 54A0F9B-TEST..." style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.92rem; color:var(--clr-neutral-dark);">
                                    Secret Key de Flow
                                </label>
                                <input type="password" id="flow-cfg-secret" placeholder="••••••••••••••••" style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                            </div>
                        </div>

                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.92rem; color:var(--clr-neutral-dark);">
                                URL Servidor Backend (Vercel / Node.js)
                            </label>
                            <input type="url" id="flow-cfg-backend" placeholder="https://nicolette-studio.vercel.app" style="width:100%; padding:11px 13px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                            <small style="color:var(--clr-neutral-gray); font-size:0.8rem; display:block; margin-top:5px;">
                                En Vercel se autodetecta automáticamente tu dominio actual (<code>https://nicolette-studio.vercel.app</code>). En desarrollo local usa <code>http://localhost:3000</code>.
                            </small>
                        </div>

                        <div style="padding:12px 15px; background:var(--clr-nude-light); border-radius:var(--radius-sm); display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="flow-cfg-sandbox" style="width:18px; height:18px; cursor:pointer;">
                            <label for="flow-cfg-sandbox" style="cursor:pointer; font-size:0.9rem; font-weight:500; margin:0;">
                                Usar entorno de pruebas Flow Sandbox (modo desarrollo)
                            </label>
                        </div>

                        <div id="backend-conn-status" style="display:none; padding:10px 14px; border-radius:var(--radius-sm); font-size:0.88rem;"></div>

                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:10px; flex-wrap:wrap;">
                            <button type="button" class="btn btn-outline" id="btn-test-flow-conn" style="padding:10px 18px; font-weight:600; display:flex; align-items:center; gap:6px;">
                                <i data-lucide="activity"></i> Probar Conexión Backend
                            </button>
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

            <!-- Modal Añadir Trabajadora / Administradora -->
            <div id="worker-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.55); backdrop-filter:blur(3px); z-index: 2000; align-items:center; justify-content:center; padding:15px; overflow-y:auto;">
                <div class="card" style="max-width: 480px; width: 100%; position:relative; background:white; max-height:92vh; overflow-y:auto; border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,0.2); padding:24px;">
                    <button id="close-worker" type="button" style="position:absolute; top:16px; right:16px; background:none; border:none; cursor:pointer; color:var(--clr-neutral-gray); padding:4px;"><i data-lucide="x"></i></button>
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:18px;">
                        <div style="width:38px; height:38px; border-radius:50%; background:var(--clr-nude-light); color:var(--clr-rose-gold-dark); display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="user-plus" style="width:20px; height:20px;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.3rem;">Añadir Miembro del Equipo</h3>
                            <p style="margin:0; font-size:0.82rem; color:var(--clr-neutral-gray);">Crea su acceso y define su foto de perfil</p>
                        </div>
                    </div>

                    <form id="form-worker">
                        <div style="margin-bottom: 14px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Nombre Completo:</label>
                            <input type="text" id="worker-name" required placeholder="Ej: Sofía Herrera" style="width:100%; padding:10px 12px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                        </div>

                        <div style="margin-bottom: 14px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Correo Electrónico (Usuario de acceso):</label>
                            <input type="email" id="worker-email" required placeholder="sofia@estudio.cl" autocomplete="username" style="width:100%; padding:10px 12px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom: 14px;">
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Rol de Acceso:</label>
                                <select id="worker-role" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.9rem; background:white;">
                                    <option value="profesional" selected>Trabajadora</option>
                                    <option value="admin">Administradora</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Contraseña:</label>
                                <div class="input-password-wrapper">
                                    <input type="password" id="worker-password" required minlength="6" placeholder="Mín. 6 caracteres" autocomplete="new-password" style="width:100%; padding:10px 12px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                                    <button type="button" class="btn-toggle-pass" id="btn-toggle-worker-password" title="Mostrar/Ocultar" tabindex="-1">
                                        <i data-lucide="eye" style="width:16px; height:16px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Sección de Foto con Cuadrador Interactivo -->
                        <div style="margin-bottom: 16px; border-top:1px solid #eee; padding-top:14px;">
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.88rem;">Foto de Perfil:</label>
                            
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                <label for="worker-photo" class="btn btn-outline" style="cursor:pointer; padding:7px 14px; font-size:0.85rem; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark); display:inline-flex; align-items:center; gap:6px; border-radius:6px; font-weight:600;">
                                    <i data-lucide="upload" style="width:14px; height:14px;"></i> Elegir Foto
                                </label>
                                <input type="file" id="worker-photo" accept="image/*" required style="display:none;">
                                <span id="worker-photo-name" style="font-size:0.82rem; color:var(--clr-neutral-gray); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">Ningún archivo seleccionado</span>
                            </div>

                            <!-- Contenedor del Cuadrador / Cropper -->
                            <div id="worker-cropper-container" class="cropper-container" style="display:none;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <span style="font-size:0.82rem; font-weight:700; color:var(--clr-neutral-dark); display:flex; align-items:center; gap:5px;">
                                        <i data-lucide="crop" style="width:14px; height:14px; color:var(--clr-rose-gold);"></i> Cuadra el rostro o posición:
                                    </span>
                                    <button type="button" id="btn-crop-reset" class="btn btn-sm" style="font-size:0.75rem; padding:3px 10px; background:white; border:1px solid #ccc; border-radius:4px; color:var(--clr-neutral-dark);">
                                        <i data-lucide="rotate-ccw" style="width:11px; height:11px; display:inline;"></i> Centrar
                                    </button>
                                </div>

                                <div style="display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:wrap; margin-bottom:12px;">
                                    <!-- Viewport interactivo -->
                                    <div id="crop-viewport" class="crop-viewport-box">
                                        <img id="crop-image" src="" alt="Encuadre foto" style="position:absolute; top:0; left:0; pointer-events:none; max-width:none; max-height:none; transform-origin:0 0;">
                                        <div class="crop-mask-circle"></div>
                                    </div>

                                    <!-- Miniatura circular en vivo -->
                                    <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                                        <span style="font-size:0.75rem; color:var(--clr-neutral-gray); font-weight:600;">Vista Final:</span>
                                        <div class="crop-preview-bubble">
                                            <canvas id="crop-preview-canvas" width="64" height="64" style="width:100%; height:100%; display:block;"></canvas>
                                        </div>
                                    </div>
                                </div>

                                <!-- Controles de Zoom -->
                                <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                                    <button type="button" id="btn-crop-zoom-out" style="width:28px; height:28px; border-radius:50%; border:1px solid #ccc; background:white; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Alejar">
                                        <i data-lucide="minus" style="width:14px; height:14px;"></i>
                                    </button>
                                    <input type="range" id="crop-zoom-slider" min="1" max="3" step="0.02" value="1" style="width:150px; accent-color:var(--clr-rose-gold); cursor:pointer;">
                                    <button type="button" id="btn-crop-zoom-in" style="width:28px; height:28px; border-radius:50%; border:1px solid #ccc; background:white; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Acercar">
                                        <i data-lucide="plus" style="width:14px; height:14px;"></i>
                                    </button>
                                </div>
                                <p style="text-align:center; font-size:0.75rem; color:var(--clr-neutral-gray); margin:8px 0 0 0;">
                                    Arrastra la foto con el mouse o dedo para centrarla en el círculo.
                                </p>
                            </div>
                        </div>

                        <div id="worker-error" class="auth-error-box" style="display:none; margin-bottom:12px;"></div>

                        <button type="submit" class="btn btn-primary btn-block" id="btn-save-worker" style="padding:12px; font-weight:600; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="check-circle" style="width:18px; height:18px;"></i> Guardar Trabajadora
                        </button>
                    </form>
                    <p id="worker-upload-status" style="margin-top:10px; color:var(--clr-rose-gold-dark); font-weight:600; font-size:0.9rem; text-align:center; display:none;">
                        Guardando y procesando imagen cuadrada...
                    </p>
                </div>
            </div>

            <!-- Modal Cambiar / Crear Mi Contraseña (Para la usuaria activa: Trabajadora o Admin) -->
            <div id="modal-change-my-password" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.55); backdrop-filter:blur(3px); z-index: 2000; align-items:center; justify-content:center; padding:15px;">
                <div class="card" style="max-width: 420px; width: 100%; position:relative; background:white; border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,0.2); padding:24px;">
                    <button id="close-modal-change-my-password" type="button" style="position:absolute; top:16px; right:16px; background:none; border:none; cursor:pointer; color:var(--clr-neutral-gray); padding:4px;"><i data-lucide="x"></i></button>
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                        <div style="width:38px; height:38px; border-radius:50%; background:var(--clr-nude-light); color:var(--clr-rose-gold-dark); display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="key-round" style="width:20px; height:20px;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.25rem;">Seguridad de la Cuenta</h3>
                            <p style="margin:0; font-size:0.82rem; color:var(--clr-neutral-gray);" id="label-change-pass-email">${auth.user.email || 'tu-cuenta'}</p>
                        </div>
                    </div>

                    <form id="form-change-my-password">
                        <div style="margin-bottom: 14px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Nueva Contraseña:</label>
                            <div class="input-password-wrapper">
                                <input type="password" id="my-new-password" required minlength="6" placeholder="Mínimo 6 caracteres" autocomplete="new-password" style="width:100%; padding:10px 12px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                                <button type="button" class="btn-toggle-pass" id="btn-toggle-my-new-password" title="Mostrar/Ocultar" tabindex="-1">
                                    <i data-lucide="eye" style="width:16px; height:16px;"></i>
                                </button>
                            </div>
                            <div class="strength-meter-wrap" style="margin-top:6px;">
                                <div class="strength-bars">
                                    <div class="strength-bar" id="my-bar-1"></div>
                                    <div class="strength-bar" id="my-bar-2"></div>
                                    <div class="strength-bar" id="my-bar-3"></div>
                                </div>
                                <div class="strength-label">
                                    <span>Seguridad: <strong id="my-strength-text" style="color:var(--clr-neutral-gray);">Mín. 6 caracteres</strong></span>
                                    <span>Nicolett Studio</span>
                                </div>
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Confirmar Nueva Contraseña:</label>
                            <div class="input-password-wrapper">
                                <input type="password" id="my-confirm-password" required minlength="6" placeholder="Repite la contraseña" autocomplete="new-password" style="width:100%; padding:10px 12px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                                <button type="button" class="btn-toggle-pass" id="btn-toggle-my-confirm-password" title="Mostrar/Ocultar" tabindex="-1">
                                    <i data-lucide="eye" style="width:16px; height:16px;"></i>
                                </button>
                            </div>
                            <div id="my-pass-match-hint" class="pass-match-hint" style="font-size:0.78rem; margin-top:4px; display:none; align-items:center; gap:4px;"></div>
                        </div>

                        <div id="change-my-password-error" class="auth-error-box" style="display:none; margin-bottom:12px;"></div>
                        <div id="change-my-password-success" style="display:none; background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:10px 14px; border-radius:var(--radius-sm); font-size:0.88rem; margin-bottom:12px; align-items:center; gap:8px;">
                            <i data-lucide="check-circle" style="width:18px; height:18px; flex-shrink:0;"></i>
                            <span>¡Contraseña actualizada exitosamente!</span>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block" id="btn-submit-change-my-pass" style="padding:12px; font-weight:600; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="lock" style="width:18px; height:18px;"></i> Guardar Nueva Contraseña
                        </button>
                    </form>
                </div>
            </div>

            <!-- Modal Asignar Contraseña a Trabajadora (Solo Administradora) -->
            <div id="modal-set-worker-password" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.55); backdrop-filter:blur(3px); z-index: 2000; align-items:center; justify-content:center; padding:15px;">
                <div class="card" style="max-width: 420px; width: 100%; position:relative; background:white; border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,0.2); padding:24px;">
                    <button id="close-modal-set-worker-password" type="button" style="position:absolute; top:16px; right:16px; background:none; border:none; cursor:pointer; color:var(--clr-neutral-gray); padding:4px;"><i data-lucide="x"></i></button>
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                        <div style="width:38px; height:38px; border-radius:50%; background:var(--clr-nude-light); color:var(--clr-rose-gold-dark); display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="key" style="width:20px; height:20px;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.25rem;">Asignar Contraseña</h3>
                            <p style="margin:0; font-size:0.82rem; color:var(--clr-neutral-gray);" id="label-set-worker-target">Trabajadora</p>
                        </div>
                    </div>

                    <form id="form-set-worker-password">
                        <input type="hidden" id="target-worker-id" value="">
                        <input type="hidden" id="target-worker-email" value="">

                        <div style="margin-bottom: 14px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.88rem;">Nueva Contraseña para la Trabajadora:</label>
                            <div class="input-password-wrapper">
                                <input type="password" id="target-worker-password" required minlength="6" placeholder="Mínimo 6 caracteres" autocomplete="new-password" style="width:100%; padding:10px 12px; border:1px solid #ccc; border-radius:var(--radius-sm); font-size:0.95rem;">
                                <button type="button" class="btn-toggle-pass" id="btn-toggle-target-worker-pass" title="Mostrar/Ocultar" tabindex="-1">
                                    <i data-lucide="eye" style="width:16px; height:16px;"></i>
                                </button>
                            </div>
                            <small style="color:var(--clr-neutral-gray); display:block; margin-top:4px; font-size:0.78rem;">
                                Con esta clave la trabajadora podrá iniciar sesión directamente.
                            </small>
                        </div>

                        <div id="set-worker-password-error" class="auth-error-box" style="display:none; margin-bottom:12px;"></div>
                        <div id="set-worker-password-success" style="display:none; background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:10px 14px; border-radius:var(--radius-sm); font-size:0.88rem; margin-bottom:12px; align-items:center; gap:8px;">
                            <i data-lucide="check-circle" style="width:18px; height:18px; flex-shrink:0;"></i>
                            <span>¡Contraseña asignada exitosamente!</span>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block" id="btn-submit-set-worker-pass" style="padding:12px; font-weight:600; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="save" style="width:18px; height:18px;"></i> Guardar Contraseña
                        </button>
                    </form>
                </div>
            </div>

            <!-- Modal Editar y Cuadrar Foto de Trabajadora Existente -->
            <div id="modal-edit-worker-photo" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.55); backdrop-filter:blur(3px); z-index: 2000; align-items:center; justify-content:center; padding:15px; overflow-y:auto;">
                <div class="card" style="max-width: 480px; width: 100%; position:relative; background:white; border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,0.2); padding:24px; max-height:92vh; overflow-y:auto;">
                    <button id="close-modal-edit-worker-photo" type="button" style="position:absolute; top:16px; right:16px; background:none; border:none; cursor:pointer; color:var(--clr-neutral-gray); padding:4px;"><i data-lucide="x"></i></button>
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                        <div style="width:38px; height:38px; border-radius:50%; background:var(--clr-nude-light); color:var(--clr-rose-gold-dark); display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="camera" style="width:20px; height:20px;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.25rem;">Cuadrar Foto de Perfil</h3>
                            <p style="margin:0; font-size:0.82rem; color:var(--clr-neutral-gray);" id="label-edit-photo-target">Trabajadora</p>
                        </div>
                    </div>

                    <form id="form-edit-worker-photo">
                        <input type="hidden" id="edit-photo-worker-id" value="">

                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                            <label for="edit-photo-file-input" class="btn btn-outline" style="cursor:pointer; padding:7px 14px; font-size:0.85rem; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark); display:inline-flex; align-items:center; gap:6px; border-radius:6px; font-weight:600;">
                                <i data-lucide="upload" style="width:14px; height:14px;"></i> Seleccionar Nueva Foto
                            </label>
                            <input type="file" id="edit-photo-file-input" accept="image/*" style="display:none;">
                            <span id="edit-photo-filename" style="font-size:0.82rem; color:var(--clr-neutral-gray); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:230px;">O ajusta la actual</span>
                        </div>

                        <!-- Cuadrador interactivo para la foto en edición -->
                        <div id="edit-photo-cropper-container" class="cropper-container">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <span style="font-size:0.82rem; font-weight:700; color:var(--clr-neutral-dark); display:flex; align-items:center; gap:5px;">
                                    <i data-lucide="crop" style="width:14px; height:14px; color:var(--clr-rose-gold);"></i> Arrastra y cuadra la foto:
                                </span>
                                <button type="button" id="btn-edit-crop-reset" class="btn btn-sm" style="font-size:0.75rem; padding:3px 10px; background:white; border:1px solid #ccc; border-radius:4px; color:var(--clr-neutral-dark);">
                                    <i data-lucide="rotate-ccw" style="width:11px; height:11px; display:inline;"></i> Centrar
                                </button>
                            </div>

                            <div style="display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:wrap; margin-bottom:12px;">
                                <div id="edit-crop-viewport" class="crop-viewport-box">
                                    <img id="edit-crop-image" src="" alt="Encuadre" style="position:absolute; top:0; left:0; pointer-events:none; max-width:none; max-height:none; transform-origin:0 0;">
                                    <div class="crop-mask-circle"></div>
                                </div>
                                <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                                    <span style="font-size:0.75rem; color:var(--clr-neutral-gray); font-weight:600;">Resultado:</span>
                                    <div class="crop-preview-bubble">
                                        <canvas id="edit-crop-preview-canvas" width="64" height="64" style="width:100%; height:100%; display:block;"></canvas>
                                    </div>
                                </div>
                            </div>

                            <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                                <button type="button" id="btn-edit-zoom-out" style="width:28px; height:28px; border-radius:50%; border:1px solid #ccc; background:white; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Alejar">
                                    <i data-lucide="minus" style="width:14px; height:14px;"></i>
                                </button>
                                <input type="range" id="edit-crop-zoom-slider" min="1" max="3" step="0.02" value="1" style="width:150px; accent-color:var(--clr-rose-gold); cursor:pointer;">
                                <button type="button" id="btn-edit-zoom-in" style="width:28px; height:28px; border-radius:50%; border:1px solid #ccc; background:white; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Acercar">
                                    <i data-lucide="plus" style="width:14px; height:14px;"></i>
                                </button>
                            </div>
                        </div>

                        <div id="edit-photo-error" class="auth-error-box" style="display:none; margin:12px 0;"></div>
                        <div id="edit-photo-success" style="display:none; background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:10px 14px; border-radius:var(--radius-sm); font-size:0.88rem; margin:12px 0; align-items:center; gap:8px;">
                            <i data-lucide="check-circle" style="width:18px; height:18px; flex-shrink:0;"></i>
                            <span>¡Foto cuadrada y guardada exitosamente!</span>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block" id="btn-submit-edit-photo" style="margin-top:14px; padding:12px; font-weight:600; font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="save" style="width:18px; height:18px;"></i> Guardar Foto Cuadrada
                        </button>
                    </form>
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
            <div class="container section text-center" style="padding: 70px 20px;">
                <div class="card" style="max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #ffffff; box-shadow: var(--shadow-medium); border-radius: var(--radius-lg); text-align: center;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: var(--clr-nude-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--clr-rose-gold);">
                        <i data-lucide="user" style="width: 32px; height: 32px;"></i>
                    </div>
                    <h3 class="section-title" style="margin-bottom: 12px; font-size: 1.8rem; color: var(--clr-rose-gold-dark);">Acceso a tu Perfil y Citas</h3>
                    <p style="color: var(--clr-neutral-gray); margin-bottom: 25px; line-height: 1.6; font-size: 0.95rem;">
                        Ingresa tu correo para ver todas tus citas agendadas, verificar tus abonos y acceder a la galería de tus resultados. Si ya te has atendido con nosotras, tus citas aparecerán de inmediato.
                    </p>

                    <form id="perfil-direct-login-form" style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.9rem; color: var(--clr-neutral-dark);">
                                Correo Electrónico <span style="color:#e53935;">*</span>
                            </label>
                            <input type="email" id="perfil-login-email" required placeholder="ejemplo@correo.com"
                                style="width:100%; padding:12px 14px; border:1px solid #dcd3cb; border-radius:8px; font-family: var(--font-body); font-size:1rem; outline:none; transition:border-color 0.3s ease;">
                        </div>

                        <div>
                            <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.9rem; color: var(--clr-neutral-dark);">
                                Nombre y Apellido <span style="font-weight:400; font-size:0.8rem; color:var(--clr-neutral-gray);">(opcional si ya estás registrada)</span>
                            </label>
                            <input type="text" id="perfil-login-name" placeholder="Tu nombre completo"
                                style="width:100%; padding:12px 14px; border:1px solid #dcd3cb; border-radius:8px; font-family: var(--font-body); font-size:1rem; outline:none; transition:border-color 0.3s ease;">
                        </div>

                        <button type="submit" id="btn-perfil-direct-login" class="btn btn-primary" style="margin-top: 10px; font-size: 1.05rem; padding: 14px; width: 100%; font-weight: 600;">
                            <i data-lucide="log-in" style="width: 18px; height: 18px; margin-right: 6px; vertical-align: middle;"></i>
                            Ingresar a Mi Perfil / Ver Mis Citas
                        </button>
                    </form>

                    <div style="margin-top: 24px; padding-top: 18px; border-top: 1px dashed #e8dcd0; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" style="font-size: 0.9rem; padding: 10px 18px;" onclick="AppRouter.navigate('agendar')">
                            <i data-lucide="calendar" style="width: 15px; height: 15px; margin-right: 4px; vertical-align: middle;"></i>
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

    // Filtrar citas de la clienta por su correo o teléfono registrado de forma segura y normalizada
    const userAppointments = StorageHelper.getClientAppointments ? StorageHelper.getClientAppointments(pers.email, pers.phone) : [];
    
    // Obtener fotos que esta clienta ha subido
    const clientPhotos = StorageHelper.getClientGallery ? StorageHelper.getClientGallery(pers.email) : [];

    let historyHtml = '';
    if (userAppointments.length > 0) {
        historyHtml = '<div style="display:grid; gap:16px; max-width:680px; margin: 0 auto; text-align:left;">';
        userAppointments.forEach(appt => {
            const hasDeposit = appt.abono || appt.depositAmount || appt.paymentStatus === 'pagado' || appt.status === 'confirmada';
            const depAmount = appt.depositAmount || 5000;
            const statusLabel = (appt.status || 'confirmada').toUpperCase();
            const statusBg = appt.status === 'cancelada' ? '#ffebee' : (appt.status === 'completada' ? '#e3f2fd' : '#e8f5e9');
            const statusColor = appt.status === 'cancelada' ? '#c62828' : (appt.status === 'completada' ? '#1565c0' : '#2e7d32');

            historyHtml += `
                <div class="card" style="padding:22px 24px; border-left: 5px solid var(--clr-rose-gold); background: #ffffff; box-shadow: var(--shadow-soft); border-radius: var(--radius-md);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <h4 style="margin:0; color:var(--clr-neutral-dark); font-size:1.2rem;">${appt.servicio || 'Servicio de Belleza'}</h4>
                            <span style="font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:12px; background:${statusBg}; color:${statusColor};">
                                ${statusLabel}
                            </span>
                        </div>
                        <span style="font-size:0.85rem; color:var(--clr-rose-gold-dark); font-weight:600; background:var(--clr-nude-light); padding:5px 12px; border-radius:20px;">
                            ${appt.date} • ${appt.time}
                        </span>
                    </div>
                    <p style="margin:4px 0 0 0; font-size:0.95rem; color:var(--clr-neutral-gray);">
                        Especialista: <strong style="color:var(--clr-neutral-dark);">${appt.profesional}</strong>
                    </p>
                    ${hasDeposit ? `<p style="margin:6px 0 0 0; font-size:0.85rem; color:#28a745; font-weight:500;">✓ Abono verificado: $${depAmount.toLocaleString('es-CL')}</p>` : ''}
                    
                    <div style="margin-top:14px; padding-top:12px; border-top: 1px dashed #e8dcd0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <span style="font-size:0.85rem; color:var(--clr-neutral-gray); display:inline-flex; align-items:center; gap:5px;">
                            <i data-lucide="sparkles" style="width:13px; height:13px; color:var(--clr-rose-gold);"></i> ¿Cómo quedó tu resultado?
                        </span>
                        <button type="button" class="btn btn-outline btn-sm btn-service-photo" data-service="${appt.servicio || ''}" data-prof="${appt.profesional || ''}" data-prof-id="${appt.profId || ''}" data-date="${appt.date || ''}" style="padding:6px 14px; font-size:0.82rem; font-weight:600; border-radius:20px; display:inline-flex; align-items:center; gap:6px; border-color:var(--clr-rose-gold); color:var(--clr-rose-gold-dark);">
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
                                ${photo.profesional ? `
                                    <div style="font-size:0.78rem; color:var(--clr-rose-gold-dark); font-weight:600; margin-top:2px; display:flex; align-items:center; gap:4px;">
                                        <i data-lucide="sparkles" style="width:11px; height:11px;"></i> Especialista: ${photo.profesional}
                                    </div>
                                ` : ''}
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
                            ${photo.approved === true || photo.status === 'approved' ? `
                                <span style="position:absolute; top:8px; right:8px; background:rgba(16,185,129,0.95); color:white; padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:700; backdrop-filter:blur(3px); display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
                                    <i data-lucide="check" style="width:12px; height:12px;"></i> Publicada en Galería
                                </span>
                            ` : `
                                <span style="position:absolute; top:8px; right:8px; background:rgba(217,119,6,0.95); color:white; padding:3px 9px; border-radius:12px; font-size:0.72rem; font-weight:700; backdrop-filter:blur(3px); display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
                                    <i data-lucide="clock" style="width:12px; height:12px;"></i> En revisión por admin
                                </span>
                            `}
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


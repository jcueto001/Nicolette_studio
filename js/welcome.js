(() => {
    'use strict';

    const storageKey = 'nicolett_welcome_seen_v1';
    if (!window.matchMedia) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isHome = () => ['', '#', '#home'].includes(window.location.hash.toLowerCase())
        && !window.location.search && document.visibilityState !== 'hidden';
    if (!isHome() || motion.matches) return;
    try { if (sessionStorage.getItem(storageKey)) return; }
    catch (_) { return; } // Sin almacenamiento no se puede garantizar una sola vez.

    let overlay;
    let finished = false;
    let timer;
    const image = new Image();
    image.alt = '';
    image.decoding = 'async';

    const lotusPaths = [
        'M24 31C15 24 17 13 24 6c7 7 9 18 0 25Z',
        'M24 36C12 33 9 24 12 15c6 2 10 7 12 14 2-7 6-12 12-14 3 9 0 18-12 21Z',
        'M18 34C9 35 5 29 4 22c6-1 12 2 15 7M30 34c9 1 13-5 14-12-6-1-12 2-15 7M12 41h24'
    ];
    const beautyPaths = [
        ['M17 35V17c0-11 14-11 14 0v18c0 8-14 8-14 0Z', 'M18 28c3-3 9-3 12 0M21 15v6'],
        ['M24 17c-8-12-19 0-10 7-9 7 2 19 10 7 8 12 19 0 10-7 9-7-2-19-10-7Z', 'M27 24a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
        ['M17 14a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM17 35a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z', 'M16 18 40 39M16 31 40 8M25 24h1'],
        ['M9 12h20c12 0 12 16 0 16H9ZM16 28l5 14h8l-5-14', 'M9 15H4v10h5M37 15l6-3M39 20h6M37 25l6 3']
    ];
    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        node.className = className;
        if (text) node.textContent = text;
        return node;
    };
    const icon = (paths, className) => {
        const namespace = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(namespace, 'svg');
        for (const [name, value] of Object.entries({ viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor',
            'stroke-width': '1.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: className,
            'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(name, value);
        for (const d of paths) {
            const path = document.createElementNS(namespace, 'path');
            path.setAttribute('d', d);
            svg.appendChild(path);
        }
        return svg;
    };

    const remove = () => {
        finished = true;
        clearTimeout(timer);
        image.onload = image.onerror = null;
        overlay?.remove();
        document.removeEventListener('pointerdown', remove, true);
        document.removeEventListener('keydown', remove, true);
        document.removeEventListener('wheel', remove, true);
        window.removeEventListener('hashchange', remove);
        window.removeEventListener('pagehide', remove);
        motion.removeEventListener?.('change', remove);
    };

    // Una interacción o navegación siempre tiene prioridad sobre la decoración.
    document.addEventListener('pointerdown', remove, { capture: true, passive: true });
    document.addEventListener('keydown', remove, true);
    document.addEventListener('wheel', remove, { capture: true, passive: true });
    window.addEventListener('hashchange', remove);
    window.addEventListener('pagehide', remove);
    motion.addEventListener?.('change', remove);

    // Si el archivo tarda en llegar, continuar sin bienvenida ni aparición tardía.
    timer = setTimeout(remove, 800);
    image.onerror = remove;
    image.onload = () => {
        if (finished || !isHome() || motion.matches || !image.naturalWidth) { remove(); return; }
        try {
            if (sessionStorage.getItem(storageKey)) { remove(); return; }
            sessionStorage.setItem(storageKey, '1');
        } catch (_) { remove(); return; }
        clearTimeout(timer);
        overlay = document.createElement('div');
        overlay.className = 'studio-welcome';
        overlay.setAttribute('aria-hidden', 'true');
        const intro = element('div', 'studio-welcome__stage studio-welcome__intro');
        intro.appendChild(icon(lotusPaths, 'studio-welcome__lotus'));
        intro.appendChild(element('p', 'studio-welcome__caption', 'Preparando tu experiencia...'));
        overlay.appendChild(intro);
        overlay.appendChild(element('div', 'studio-welcome__wave'));
        const beauty = element('div', 'studio-welcome__stage studio-welcome__beauty');
        const icons = element('div', 'studio-welcome__icons');
        beautyPaths.forEach(paths => icons.appendChild(icon(paths, 'studio-welcome__beauty-icon')));
        beauty.appendChild(icons);
        beauty.appendChild(element('p', 'studio-welcome__caption', 'Belleza, cuidado y bienestar'));
        overlay.appendChild(beauty);
        const logo = element('div', 'studio-welcome__logo');
        const emblem = element('div', 'studio-welcome__emblem');
        emblem.appendChild(image);
        emblem.appendChild(element('span', 'studio-welcome__shine'));
        logo.appendChild(emblem);
        overlay.appendChild(logo);
        overlay.appendChild(element('p', 'studio-welcome__tagline', 'Belleza a tu ritmo y sin barreras'));
        overlay.addEventListener('animationend', event => {
            if (event.target === overlay) remove();
        });
        document.body.appendChild(overlay);
        timer = setTimeout(remove, 3300);
    };
    image.src = 'img/logo%20nicol.png';
})();

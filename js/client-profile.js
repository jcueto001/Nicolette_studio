(() => {
    'use strict';
    let generation = 0;
    let timer;
    let events;
    let expiryTimer;
    let activeChallenge;
    const messages = {
        CLIENT_ACCESS_NOT_CONFIGURED: 'El acceso por código todavía no está configurado en el estudio.',
        CLIENT_CODE_RATE_LIMIT: 'Espera un minuto antes de solicitar otro código. Hay un límite de envíos por hora.',
        CLIENT_CODE_DELIVERY_FAILED: 'No se pudo enviar el código. Inténtalo más tarde.',
        INVALID_CLIENT_CODE: 'Código incorrecto, vencido o ya utilizado.',
        INVALID_CLIENT_EMAIL: 'Revisa el correo electrónico.',
        CLIENT_ACCESS_REQUIRED: 'Verifica tu correo para consultar tus citas privadas.'
    };
    async function api(path, body) {
        const response = await fetch('/api/client-profile/' + path, {
            method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
            ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        });
        const data = await response.json();
        if (!response.ok) throw Object.assign(new Error(messages[data.error] || 'No se pudo consultar el perfil. Inténtalo más tarde.'), { code: data.error });
        return data;
    }
    function stop() { generation++; clearTimeout(timer); clearTimeout(expiryTimer); events?.abort(); }
    async function logout() {
        stop(); document.querySelector('[data-client-appointments]')?.replaceChildren();
        const challenge = activeChallenge; activeChallenge = null;
        try { await api('logout', { ...(challenge ? { challenge } : {}) }); } catch (_) {}
    }
    function mount(email) {
        stop();
        const root = document.getElementById('client-private-appointments');
        if (!root || !email) return;
        events = new AbortController();
        const listenerOptions = { signal: events.signal };
        const epoch = generation;
        const current = () => epoch === generation && root.isConnected;
        const status = root.querySelector('[data-client-status]');
        const list = root.querySelector('[data-client-appointments]');
        const request = root.querySelector('[data-client-request]');
        const verify = root.querySelector('[data-client-verify]');
        const close = root.querySelector('[data-client-close]');
        const input = verify.querySelector('input');
        list.replaceChildren(); verify.hidden = close.hidden = true; input.value = '';
        let challenge;
        let readVersion = 0;
        const locked = message => {
            clearTimeout(timer); clearTimeout(expiryTimer);
            list.replaceChildren(); request.hidden = false; close.hidden = true;
            request.disabled = false;
            status.textContent = message;
        };
        async function load() {
            const version = ++readVersion;
            try {
                const data = await api('appointments');
                if (!current() || version !== readVersion) return;
                if (data.email !== email.trim().toLowerCase()) {
                    await logout();
                    if (root.isConnected) mount(email);
                    return;
                }
                request.hidden = verify.hidden = true; close.hidden = false;
                clearTimeout(expiryTimer);
                expiryTimer = setTimeout(() => { if (current()) locked(messages.CLIENT_ACCESS_REQUIRED); }, Math.max(0, data.expiresAtMs - Date.now()));
                status.textContent = data.appointments.length ? 'Tus citas registradas' : 'No hay citas registradas con este correo verificado.';
                list.replaceChildren();
                for (const appointment of data.appointments) {
                    const card = document.createElement('article'); card.className = 'card';
                    const title = document.createElement('h3'); title.textContent = appointment.servicio || 'Servicio'; card.appendChild(title);
                    const details = [appointment.date, appointment.time, appointment.profesional, appointment.status || 'Sin confirmación'];
                    const text = document.createElement('p'); text.textContent = details.filter(Boolean).join(' · '); card.appendChild(text);
                    const payment = document.createElement('p');
                    const amounts = [['Total', 'totalPrice'], ['Abono', 'depositAmount'], ['Saldo', 'balanceDue']]
                        .filter(([, field]) => Number.isFinite(appointment[field]))
                        .map(([label, field]) => label + ': $' + appointment[field].toLocaleString('es-CL'));
                    payment.textContent = [appointment.paymentStatus, ...amounts].filter(Boolean).join(' · '); card.appendChild(payment);
                    list.appendChild(card);
                }
                timer = setTimeout(() => { if (current()) load(); }, 30000);
            } catch (error) {
                if (current() && version === readVersion) locked(error.message);
            }
        }
        request.addEventListener('click', async () => {
            request.disabled = true; status.textContent = 'Enviando código a tu correo...';
            try {
                const data = await api('code', { email });
                if (!current()) return;
                challenge = activeChallenge = data.challenge; verify.hidden = false;
                status.textContent = 'Ingresa el código de seis dígitos. Vence en 10 minutos.'; input.focus();
            } catch (error) { if (current()) status.textContent = error.message; }
            finally { if (current()) request.disabled = false; }
        }, listenerOptions);
        verify.addEventListener('submit', async event => {
            event.preventDefault(); const button = verify.querySelector('button'); button.disabled = true;
            try {
                await api('verify', { challenge, code: input.value.trim() });
                if (!current()) return;
                input.value = ''; challenge = null; activeChallenge = null; await load();
            } catch (error) { if (current()) { list.replaceChildren(); status.textContent = error.message; } }
            finally { if (current()) button.disabled = false; }
        }, listenerOptions);
        close.addEventListener('click', async () => {
            stop(); list.replaceChildren(); verify.hidden = true; locked('Verifica tu correo para consultar tus citas privadas.');
            await logout();
            if (root.isConnected) mount(email);
        }, listenerOptions);
        request.disabled = true;
        load();
    }
    window.addEventListener('pagehide', () => {
        stop(); document.querySelector('[data-client-appointments]')?.replaceChildren();
    });
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            let email; try { email = JSON.parse(localStorage.getItem('nicolett_personalization') || '{}').email; } catch (_) {}
            mount(email);
        }
    });
    window.ClientProfile = { mount, logout };
})();

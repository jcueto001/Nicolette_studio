const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const appSource = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const mainSource = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
const payload = `Ángela O'Connor "Luz" <img src=x onerror="globalThis.xss=true"> & <script>globalThis.xss=true</script>`;
const id = `reserva'" autofocus onfocus="globalThis.xss=true`;

// HTMLParser valida texto y atributos, pero no es un DOM ni ejecuta eventos.
function parse(html) {
    return JSON.parse(execFileSync('python', ['-c', `
import sys,json
from html.parser import HTMLParser
class Parser(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True); self.tags=[]; self.text=[]
 def handle_starttag(self,tag,attrs): self.tags.append([tag,dict(attrs)])
 def handle_data(self,data): self.text.append(data)
p=Parser(); p.feed(sys.stdin.read()); print(json.dumps({'tags':p.tags,'text':''.join(p.text)}))
`], { input: html, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }));
}

function fixture() {
    const appointment = { id, clientName: payload, notes: payload, clientPhone: payload,
        clientEmail: payload, servicio: payload, profesional: payload, profId: payload,
        date: payload, time: payload, transactionId: payload, status: 'confirmada' };
    const ficha = { id, clientName: payload, date: payload, serviceName: payload, notes: payload,
        mapping: { left: payload, right: payload }, products: [{ quantity: payload, name: payload }] };
    const context = { console, window: {}, localStorage: { getItem: () => JSON.stringify({ name: payload, email: payload }) },
        mockData: { services: [], categories: [] }, StorageHelper: {
            getAuth: () => ({ loggedIn: true, user: { role: 'admin', id: 'admin', name: 'Admin' } }),
            getAppointments: () => [appointment], getInventory: () => [], getProfessionals: () => [],
            getFichas: () => [ficha], getClients: () => [{ id, name: payload, phone: payload, products: payload }],
            getGallery: () => [], getClientAppointments: () => [appointment], getClientGallery: () => []
        } };
    vm.createContext(context);
    vm.runInContext(appSource, context);
    return { context, ficha };
}

function noInjectedMarkup(parsed) {
    assert.equal(parsed.tags.some(([tag]) => tag === 'script'), false);
    assert.equal(parsed.tags.some(([, attrs]) => 'onerror' in attrs || 'onfocus' in attrs || 'autofocus' in attrs), false);
    assert.ok(parsed.text.includes(payload), 'Debe conservar literalmente tildes, comillas y etiquetas');
}

test('Agenda y fichas escapan texto/atributos sin alterar IDs ni datos de botones', () => {
    const { context } = fixture();
    const parsed = parse(context.renderAdminView());
    noInjectedMarkup(parsed);
    const find = className => parsed.tags.find(([, attrs]) => (attrs.class || '').split(' ').includes(className))?.[1];
    assert.equal(find('status-selector')['data-appid'], id);
    assert.equal(find('btn-ficha')['data-appid'], id);
    assert.equal(find('btn-view-ficha')['data-fichaid'], id);
    assert.equal(find('btn-worker-take-photo')['data-clientname'], payload);
    assert.equal(find('btn-worker-take-photo')['data-clientemail'], payload);
    assert.equal(find('btn-worker-take-photo')['data-servicename'], payload);
    const resend = find('btn-resend-email');
    assert.equal(resend['data-appid'], id);
    let received;
    context.window.resendAppointmentEmail = value => { received = value; };
    context.button = { dataset: { appid: resend['data-appid'] } };
    vm.runInContext(`(function () { ${resend.onclick} }).call(button)`, context);
    assert.equal(received, id);
    assert.equal(context.xss, undefined);
});

test('Galerías toleran profesionales sin name y no cuentan todas las fotos por nombre vacío', () => {
    const { context } = fixture();
    context.StorageHelper.getProfessionals = () => [{ id: 'missing' }, { id: 'legacy', nombre: 'Ana' }];
    const images = [{ id: 'photo', profesional: 'Ana', profId: 'legacy', src: 'photo.jpg' }];
    context.StorageHelper.getGallery = () => images;
    context.StorageHelper.getPublicGallery = () => images;
    const admin = context.renderAdminView();
    assert.ok(admin.includes('Profesional sin nombre (0)'));
    assert.ok(admin.includes('Ana (1)'));
    assert.doesNotThrow(() => context.renderGaleriaView());
});

test('Perfil conserva personalización como texto', () => {
    const { context } = fixture();
    noInjectedMarkup(parse(context.renderPerfilView()));
});

test('Perfil público no consulta historial, fichas ni fotos aunque existan cachés del personal', () => {
    const { context } = fixture();
    for (const getter of ['getAppointments', 'getFichas', 'getClientAppointments', 'getClientGallery']) {
        context.StorageHelper[getter] = () => assert.fail('El perfil público no debe consultar ' + getter);
    }
    const html = context.renderPerfilView();
    assert.ok(html.includes('AppRouter.navigate(\'agendar\')'));
    assert.ok(html.includes('AppRouter.navigate(\'galeria\')'));
    assert.equal(html.includes('Abono verificado'), false);
    assert.equal(html.includes('Galería de tus Resultados'), false);
    noInjectedMarkup(parse(html));
});

test('Detalle de ficha e historial CRM escapan los mismos datos', () => {
    const { context, ficha } = fixture();
    context.ficha = ficha;
    context.viewFichaContent = {};
    const start = mainSource.indexOf('                    let prodsHtml =');
    const end = mainSource.indexOf('                    if (window.lucide)', start);
    assert.ok(start > 0 && end > start);
    vm.runInContext(mainSource.slice(start, end), context);
    noInjectedMarkup(parse(context.viewFichaContent.innerHTML));
    const historyStart = mainSource.indexOf('                        allFichas.forEach(f => {');
    const historyEnd = mainSource.indexOf('                        historyContainer.innerHTML = html;', historyStart);
    context.allFichas = [ficha];
    vm.runInContext('let html = "";\n' + mainSource.slice(historyStart, historyEnd) + '\nglobalThis.historyResult = html;', context);
    noInjectedMarkup(parse(context.historyResult));
});

test('Cambio de estado conserva ID y valor para StorageHelper', async () => {
    const { context } = fixture();
    const start = mainSource.indexOf("                select.addEventListener('change', async (e) => {");
    const bodyStart = mainSource.indexOf('\n', start);
    const finish = 'await StorageHelper.updateAppointmentStatus(appId, newStatus);';
    const end = mainSource.indexOf(finish, bodyStart) + finish.length;
    assert.ok(start > 0 && end > bodyStart);
    let received;
    context.StorageHelper.updateAppointmentStatus = async (...args) => { received = args; };
    context.event = { target: { getAttribute: name => name === 'data-appid' ? id : null, value: 'cancelada', style: {} } };
    await vm.runInContext('(async e => {' + mainSource.slice(bodyStart, end) + '})(event)', context);
    assert.deepEqual(received, [id, 'cancelada']);
});

test('Mis citas filtra por UID, muestra duración y nunca confirma estados pendientes implícitamente', () => {
    const { context } = fixture();
    context.StorageHelper.getAuth = () => ({ loggedIn: true, user: { role: 'profesional', id: 'worker', name: 'Synthetic' } });
    for (const status of ['pendiente', 'pendiente de pago', 'Pendiente de Pago', 'Pago Reportado', '', 'confirmada']) {
        context.StorageHelper.getAppointments = () => [
            { id: 'own', profId: 'worker', clientName: 'OWN', servicio: 'Servicio', duration: 90, status },
            { id: 'foreign', profId: 'other', profesional: 'Synthetic', clientName: 'FOREIGN' }
        ];
        const html = context.renderAdminView();
        assert.ok(html.includes('OWN')); assert.equal(html.includes('FOREIGN'), false);
        assert.ok(html.includes('90 min'));
        assert.equal(/value="confirmada" selected/.test(html), status === 'confirmada');
    }
});

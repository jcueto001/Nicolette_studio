const { createHash } = require('node:crypto');
const hash = value => createHash('sha256').update(value).digest('hex');
function fail(code, status = 400) { throw Object.assign(new Error(code), { code, status }); }
function id(value) {
    if (typeof value !== 'string' || !value || value.length > 200 || value.includes('/') || value === '.' || value === '..') fail('INVALID_FICHA');
    return value;
}
function text(value, max = 4000) {
    if (value == null) return '';
    if (typeof value !== 'string' || value.length > max) fail('INVALID_FICHA');
    return value;
}
async function saveFicha(db, input, requestId, actor) {
    id(requestId); id(actor.uid);
    if (!input || typeof input !== 'object') fail('INVALID_FICHA');
    const appointmentId = input.appointmentId == null ? null : id(input.appointmentId);
    const products = input.products == null ? [] : input.products;
    if (!Array.isArray(products) || products.length > 50) fail('INVALID_QUANTITY');
    const seen = new Set();
    const used = products.map(product => {
        const productId = id(product?.id);
        if (seen.has(productId) || !Number.isSafeInteger(product.quantity) || product.quantity <= 0) fail('INVALID_QUANTITY');
        seen.add(productId);
        return { id: productId, quantity: product.quantity };
    }).sort((a, b) => a.id.localeCompare(b.id));
    const fields = { appointmentId, clientName: text(input.clientName), serviceName: text(input.serviceName),
        clientEmail: text(input.clientEmail, 320), clientPhone: text(input.clientPhone, 100),
        serviceId: text(input.serviceId, 200), time: text(input.time, 100), notes: text(input.notes),
        date: text(input.date, 100), mapping: input.mapping == null ? null : {
            left: text(input.mapping.left), right: text(input.mapping.right),
            curvatura: text(input.mapping.curvatura), grosor: text(input.mapping.grosor)
        }, products: used };
    const fingerprint = hash(JSON.stringify(fields));
    const operation = db.collection('FichaOperations').doc(hash(actor.uid + ':' + requestId));
    const key = hash(appointmentId ? 'appointment:' + appointmentId : 'standalone:' + actor.uid + ':' + requestId);
    const consumption = db.collection('ConsumosInventario').doc(key);
    const fichaRef = db.collection('FichasClientas').doc('consumo_' + key);
    return db.runTransaction(async tx => {
        const user = await tx.get(db.collection('Usuarios').doc(actor.uid));
        const role = user.exists && user.data().activo !== false ? user.data().rol : null;
        const admin = ['Admin', 'admin'].includes(role);
        if (!admin && role !== 'profesional') fail('FORBIDDEN', 403);
        let profId = actor.uid;
        if (appointmentId) {
            const appointment = await tx.get(db.collection('Citas').doc(appointmentId));
            if (!appointment.exists || typeof appointment.data().profId !== 'string'
                || (!admin && appointment.data().profId !== actor.uid)) fail('FORBIDDEN', 403);
            if (!['confirmada', 'completada'].includes(appointment.data().status)) fail('INVALID_ATTENTION', 409);
            profId = appointment.data().profId;
        } else {
            if (!admin) fail('FORBIDDEN', 403);
            if (used.length) fail('INVALID_ATTENTION', 409);
        }
        const previousOp = await tx.get(operation);
        const previous = await tx.get(consumption);
        if (previousOp.exists && (previousOp.data().fingerprint !== fingerprint || previousOp.data().key !== key)) fail('FICHA_ALREADY_RECORDED', 409);
        if (previous.exists) {
            if (previous.data().fingerprint !== fingerprint) fail('FICHA_ALREADY_RECORDED', 409);
            const ficha = await tx.get(fichaRef);
            if (!ficha.exists) fail('FICHA_REVIEW_REQUIRED', 409);
            return { ficha: { ...ficha.data(), id: fichaRef.id }, stocks: previous.data().stocks };
        }
        if (previousOp.exists) fail('FICHA_REVIEW_REQUIRED', 409);
        if (appointmentId) {
            const historical = await tx.get(db.collection('FichasClientas').where('appointmentId', '==', appointmentId).limit(1));
            if (!historical.empty) fail('FICHA_REVIEW_REQUIRED', 409);
        }
        const stocks = [], savedProducts = [];
        for (const product of used) {
            const ref = db.collection('Inventario').doc(product.id);
            const snapshot = await tx.get(ref);
            if (!snapshot.exists || !Number.isSafeInteger(snapshot.data().stock) || snapshot.data().stock < product.quantity) fail('INSUFFICIENT_STOCK', 409);
            stocks.push({ id: product.id, stock: snapshot.data().stock - product.quantity });
            savedProducts.push({ ...product, name: text(snapshot.data().name) });
        }
        const saved = { ...fields, products: savedProducts, profId, createdBy: actor.uid, createdAt: new Date().toISOString() };
        for (const stock of stocks) tx.update(db.collection('Inventario').doc(stock.id), { stock: stock.stock });
        tx.create(fichaRef, saved);
        tx.create(consumption, { appointmentId, fichaId: fichaRef.id, fingerprint, stocks, createdBy: actor.uid, createdAt: saved.createdAt });
        tx.create(operation, { key, fingerprint });
        return { ficha: { ...saved, id: fichaRef.id }, stocks };
    });
}
module.exports = { saveFicha };

// Doble transaccional local. Las pruebas de integración usan además el emulador real.
const copy = value => value === undefined ? undefined : structuredClone(value);
function memoryFirestore(initial = []) {
    const docs = new Map(initial); let queue = Promise.resolve();
    const snapshot = key => ({ id: key.split('/').at(-1), exists: docs.has(key), data: () => copy(docs.get(key)) });
    const reference = key => ({ id: key.split('/').at(-1), key, get: async () => snapshot(key),
        create: async data => { if (docs.has(key)) throw new Error('exists'); docs.set(key, copy(data)); },
        set: async data => docs.set(key, copy(data)), delete: async () => docs.delete(key) });
    const query = (name, filters = [], max = Infinity) => ({
        query: true, name, filters, max,
        doc: id => reference(name + '/' + id),
        where: (field, op, value) => { if (op !== '==') throw new Error('unsupported query'); return query(name, [...filters, [field, value]], max); },
        limit: value => query(name, filters, value),
        get: async function () {
            const records = [...docs.keys()].filter(key => key.startsWith(name + '/') && filters.every(([field, value]) => docs.get(key)[field] === value)).slice(0, max).map(snapshot);
            return { docs: records, empty: !records.length, forEach: callback => records.forEach(callback) };
        }
    });
    const db = { collection: name => query(name), runTransaction: callback => {
        const next = queue.then(async () => {
            const writes = []; let wrote = false;
            const tx = {
                get: async ref => { if (wrote) throw new Error('Firestore: read after write'); return ref.query ? ref.get() : snapshot(ref.key); },
                create: (ref, data) => { wrote = true; writes.push(['create', ref.key, copy(data)]); },
                set: (ref, data) => { wrote = true; writes.push(['set', ref.key, copy(data)]); },
                update: (ref, data) => { wrote = true; writes.push(['update', ref.key, copy(data)]); }
            };
            const result = await callback(tx);
            const pending = new Map(docs);
            for (const [op, key, data] of writes) {
                if (op === 'create' && pending.has(key)) throw new Error('exists');
                if (op === 'update' && !pending.has(key)) throw new Error('missing');
                pending.set(key, op === 'update' ? { ...pending.get(key), ...data } : data);
            }
            docs.clear(); for (const [key, value] of pending) docs.set(key, value);
            return result;
        });
        queue = next.catch(() => {}); return next;
    } };
    return { db, docs };
}
module.exports = { memoryFirestore };

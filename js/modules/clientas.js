/**
 * Historial de clientas, fichas de atención y parámetros de pestañas.
 * Integrantes: José Cueto & Benjamín Moya.
 */

(function (window) {
    'use strict';

    const LONGITUDES_MAPPING_ESTANDAR = ['9mm', '10mm', '11mm', '12mm', '13mm'];
    const CURVATURAS_PERMITIDAS = ['C', 'CC', 'D', 'DD', 'L', 'M'];
    const GROSORES_PERMITIDOS = ['0.05', '0.07', '0.10', '0.15', '0.20'];

    const ClientasModule = {
        /**
         * Retorna las especificaciones técnicas estándar para mapping
         */
        getMappingSpecs: function () {
            return {
                longitudes: [...LONGITUDES_MAPPING_ESTANDAR],
                curvaturas: [...CURVATURAS_PERMITIDAS],
                grosores: [...GROSORES_PERMITIDOS]
            };
        },

        /**
         * Obtiene el directorio de clientas
         * @returns {Array}
         */
        getClientas: function () {
            return (typeof StorageHelper !== 'undefined') ? StorageHelper.getClients() : [];
        },

        /**
         * Busca o consulta una clienta por email o teléfono
         * @param {string} query
         * @returns {Object|null}
         */
        buscarClienta: function (query) {
            if (!query) return null;
            const q = query.trim().toLowerCase();
            const clientas = this.getClientas();
            return clientas.find(c =>
                (c.email && c.email.toLowerCase() === q) ||
                (c.phone && c.phone.includes(q)) ||
                (c.name && c.name.toLowerCase().includes(q))
            ) || null;
        },

        /**
         * Obtiene el historial cronológico de atenciones y fichas de una clienta
         * @param {string} clientEmail
         * @returns {Array}
         */
        getHistorialAtenciones: function (clientEmail) {
            if (!clientEmail || typeof StorageHelper === 'undefined') return [];
            return StorageHelper.getClientFichas(clientEmail);
        },

        /**
         * Guarda la ficha técnica de atención con soporte de mapping y descuento de insumos
         * @param {Object} fichaData
         * @returns {Promise<Object>}
         */
        guardarFichaTecnica: async function (fichaData) {
            if (!fichaData.clientEmail || !fichaData.serviceName) {
                throw new Error("La ficha técnica requiere el correo de la clienta y el servicio realizado.");
            }

            const fichaNormalizada = {
                appointmentId: fichaData.appointmentId || null,
                _operationId: fichaData._operationId || (fichaData._operationId = crypto.randomUUID()),
                id: fichaData.id || ('f_' + Date.now()),
                clientName: fichaData.clientName || 'Clienta',
                clientEmail: fichaData.clientEmail.trim().toLowerCase(),
                clientPhone: fichaData.clientPhone || '',
                serviceId: fichaData.serviceId || '',
                serviceName: fichaData.serviceName,
                date: fichaData.date || new Date().toISOString().split('T')[0],
                time: fichaData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                profId: fichaData.profId || '',
                profName: fichaData.profName || 'Profesional',
                notes: fichaData.notes || '',
                products: Array.isArray(fichaData.products) ? fichaData.products : [],
                mapping: fichaData.mapping || null, // { left: '9-10-11-12-11', right: '9-10-11-12-11', curvatura: 'D', grosor: '0.07' }
                createdAt: fichaData.createdAt || new Date().toISOString()
            };

            // Persistir en StorageHelper / Firestore
            if (typeof StorageHelper !== 'undefined' && StorageHelper.saveFicha) {
                await StorageHelper.saveFicha(fichaNormalizada);
            }

            // saveFicha persiste ficha y consumo en una única transacción.

            return fichaNormalizada;
        }
    };

    // Publicar el módulo para los scripts de la página
    window.NicolettClientas = ClientasModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.Clientas = ClientasModule;

})(window);


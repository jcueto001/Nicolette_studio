/**
 * Nicolett Studio Fantasy - Arquitectura Modular Capstone
 * MÓDULO 2: CLIENTAS, FICHAS TÉCNICAS Y BITÁCORA (Sprint 2)
 * 
 * Requerimientos asociados (Anexo 5 Matriz de Requerimientos):
 * - RF-07: Ficha técnica y bitácora de atención personalizada (historial cronológico, insumos, profesional).
 * - RF-08: Campos técnicos específicos por servicio (Mapeo de pestañas mapping 9 al 13 mm, curvatura y grosor).
 * 
 * Integrantes: José Cueto & Benjamín Moya (Capstone Duoc UC 2026)
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
         * RF-07: Obtiene el historial cronológico de atenciones y fichas de una clienta
         * @param {string} clientEmail
         * @returns {Array}
         */
        getHistorialAtenciones: function (clientEmail) {
            if (!clientEmail || typeof StorageHelper === 'undefined') return [];
            return StorageHelper.getClientFichas(clientEmail);
        },

        /**
         * RF-07 & RF-08: Guarda la ficha técnica de atención con soporte de mapping y descuento de insumos
         * @param {Object} fichaData
         * @returns {Promise<Object>}
         */
        guardarFichaTecnica: async function (fichaData) {
            if (!fichaData.clientEmail || !fichaData.serviceName) {
                throw new Error("La ficha técnica requiere el correo de la clienta y el servicio realizado.");
            }

            const fichaNormalizada = {
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

            // RF-10: Descontar stock de productos automáticamente
            if (fichaNormalizada.products.length > 0 && typeof StorageHelper !== 'undefined') {
                for (const prod of fichaNormalizada.products) {
                    if (prod.id && prod.quantity) {
                        try {
                            await StorageHelper.discountInventory(prod.id, prod.quantity);
                        } catch (err) {
                            console.warn("[ClientasModule] No se pudo descontar stock de:", prod.id, err);
                        }
                    }
                }
            }

            return fichaNormalizada;
        }
    };

    // Exponer globalmente en el namespace de la arquitectura
    window.NicolettClientas = ClientasModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.Clientas = ClientasModule;

})(window);


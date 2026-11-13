/**
 * Nicolett Studio Fantasy - Arquitectura Modular Capstone
 * MÓDULO 3: INVENTARIO, CONTROL DE STOCK Y CATÁLOGO (Sprint 3)
 * 
 * Requerimientos asociados (Anexo 5 Matriz de Requerimientos):
 * - RF-09: Catálogo informativo de productos del salón (marcas profesionales y descripciones para clientas).
 * - RF-10: Control de stock de insumos y productos (registro, alertas de stock crítico y rebajas automáticas por atención).
 * 
 * Integrantes: José Cueto & Benjamín Moya (Capstone Duoc UC 2026)
 */

(function (window) {
    'use strict';

    const UMBRAL_STOCK_CRITICO_DEFAULT = 5;

    // Catálogo informativo de marcas e insumos profesionales certificados (RF-09)
    const CATALOGO_INFORMATIVO_CLIENTAS = [
        {
            id: 'cat_semi',
            categoria: 'Manicura',
            nombre: 'Esmaltes Semipermanentes Premium & Rubber Base',
            marca: 'Bluesky / Cherimoya Profesional',
            descripcion: 'Fórmulas hipoalergénicas 9-Free con polímeros foto-iniciadores. Garantizan brillo espejo de larga duración (21 días) cuidando la lámina natural de la uña sin debilitamiento.',
            certificaciones: 'Cruelty-free, Hipoalergénico, Libre de Tolueno y DBP'
        },
        {
            id: 'cat_lash',
            categoria: 'Pestañas & Cejas',
            nombre: 'Extensiones de Seda Sintética & Adhesivo Médico',
            marca: 'Nagaraku / Sky Glue S+ Pro',
            descripcion: 'Fibras ultralivianas de tacto sedoso con curvaturas C y D indeformables. Adhesivo de grado estético médico de secado rápido, libre de formaldehído, seguro para ojos sensibles.',
            certificaciones: 'Oftalmológicamente testeado, Hipoalergénico'
        },
        {
            id: 'cat_lifting',
            categoria: 'Lifting de Pestañas',
            nombre: 'Kit de Lifting y Laminado Coreano con Queratina',
            marca: 'Iconsign / Thuya Keratin Complex',
            descripcion: 'Tratamiento enriquecido con queratina hidrolizada y biotina. Eleva y curva la pestaña natural desde la raíz nutriendo la fibra capilar.',
            certificaciones: 'Nutrición con Pantenol, Seguro para piel sensible'
        },
        {
            id: 'cat_podologia',
            categoria: 'Podología Clínica & Pies',
            nombre: 'Soluciones Antisépticas y Emolientes Quirúrgicos',
            marca: 'Laboratorios Valma / Prontosan Podológico',
            descripcion: 'Desinfectantes y ablandadores queratolíticos con urea al 20%. Instrumental esterilizado en calor seco grado médico para máxima bioseguridad del paciente.',
            certificaciones: 'Registro ISP Chile, Bioseguridad Hospitalaria'
        },
        {
            id: 'cat_cera',
            categoria: 'Depilación',
            nombre: 'Cera de Miel de Abeja 100% Virgen & Caléndula',
            marca: 'DepilBella Natural',
            descripcion: 'Cera tibia elastizada enriquecida con extracto de caléndula regeneradora. Proporciona una adherencia perfecta al vello sin irritar ni maltratar la piel.',
            certificaciones: 'Extractos Botánicos Orgánicos'
        }
    ];

    const InventarioModule = {
        /**
         * Obtiene todos los insumos y productos registrados en el sistema
         * @returns {Array}
         */
        getInsumos: function () {
            if (typeof StorageHelper !== 'undefined' && StorageHelper.getInventory) {
                return StorageHelper.getInventory();
            }
            return (typeof mockData !== 'undefined' && mockData.inventory) ? mockData.inventory : [];
        },

        /**
         * RF-10: Retorna los productos que se encuentran en nivel de alerta crítica (stock <= umbral)
         * @param {number} umbral
         * @returns {Array}
         */
        getStockCritico: function (umbral = UMBRAL_STOCK_CRITICO_DEFAULT) {
            const insumos = this.getInsumos();
            return insumos.filter(item => {
                const limite = item.minStock !== undefined ? item.minStock : umbral;
                return (Number(item.stock) || 0) <= limite;
            });
        },

        /**
         * RF-10: Descuenta unidades de un insumo tras ser consumido en una atención
         * @param {string} productId
         * @param {number} cantidad
         * @returns {Promise<void>}
         */
        descontarStock: async function (productId, cantidad = 1) {
            if (typeof StorageHelper !== 'undefined') {
                if (StorageHelper.discountInventory) {
                    await StorageHelper.discountInventory(productId, cantidad);
                } else if (StorageHelper.updateProductStock) {
                    await StorageHelper.updateProductStock(productId, cantidad);
                }
            }
        },

        /**
         * Actualiza directamente el stock de un producto (exclusivo administración)
         * @param {string} productId
         * @param {number} nuevoStock
         * @returns {Promise<void>}
         */
        actualizarStockDirecto: async function (productId, nuevoStock) {
            if (typeof StorageHelper !== 'undefined' && StorageHelper.updateProductStockDirect) {
                await StorageHelper.updateProductStockDirect(productId, nuevoStock);
            }
        },

        /**
         * Agrega un nuevo insumo al inventario en Firestore
         * @param {Object} producto
         * @returns {Promise<Object>}
         */
        agregarInsumo: async function (producto) {
            if (typeof StorageHelper !== 'undefined' && StorageHelper.addProduct) {
                return await StorageHelper.addProduct(producto);
            }
            return producto;
        },

        /**
         * RF-09: Retorna el catálogo informativo de productos profesionales para las clientas
         * @returns {Array}
         */
        getCatalogoInformativoClientas: function () {
            return [...CATALOGO_INFORMATIVO_CLIENTAS];
        }
    };

    // Exponer globalmente en el namespace de la arquitectura
    window.NicolettInventario = InventarioModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.Inventario = InventarioModule;

})(window);

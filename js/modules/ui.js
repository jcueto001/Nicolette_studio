/**
 * Nicolett Studio Fantasy - Arquitectura Modular Capstone
 * MÓDULO 5: EXPERIENCIA DE USUARIO, COMPONENTES Y DIÁLOGOS (Sprint 5)
 * 
 * Requerimientos asociados (Anexo 5 Matriz de Requerimientos):
 * - RNF-01: Paleta de colores institucional (tonos dorado, nude, blanco y rose-gold).
 * - RNF-02: Diseño adaptable Mobile-First (optimizado para smartphones entre 360px y 480px).
 * - RNF-03: Estándares de calidad y rendimiento (Google Lighthouse >= 85).
 * 
 * Integrantes: José Cueto & Benjamín Moya (Capstone Duoc UC 2026)
 */

(function (window) {
    'use strict';

    const UIModule = {
        /**
         * Muestra una notificación emergente estilizada (Toast)
         * @param {string} mensaje
         * @param {string} tipo - 'success', 'error', 'info'
         */
        mostrarToast: function (mensaje, tipo = 'info') {
            const toast = document.createElement('div');
            toast.className = `nicolett-toast nicolett-toast-${tipo}`;
            toast.style.cssText = `
                position: fixed;
                bottom: 25px;
                right: 25px;
                background: ${tipo === 'success' ? '#10b981' : (tipo === 'error' ? '#ef4444' : '#b68d5d')};
                color: #ffffff;
                padding: 12px 22px;
                border-radius: 14px;
                font-size: 0.92rem;
                font-weight: 600;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: toastSlideUp 0.3s ease-out;
            `;
            toast.innerHTML = `<span>${mensaje}</span>`;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        },

        /**
         * Abre un modal de diálogo o confirmación personalizado con la estética de Nicolett Studio
         * @param {Object} options - { title, message, icon, confirmText, cancelText, onConfirm }
         */
        abrirDialogo: function (options) {
            if (typeof window.showCustomDialog === 'function') {
                return window.showCustomDialog(options);
            }
            if (options.onConfirm && confirm(options.message || options.title)) {
                options.onConfirm();
            }
        },

        /**
         * Refresca los iconos SVG de Lucide en el DOM
         */
        refreshIcons: function () {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    };

    // Exponer globalmente en el namespace de la arquitectura
    window.NicolettUI = UIModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.UI = UIModule;

})(window);

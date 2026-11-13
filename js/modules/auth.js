/**
 * Nicolett Studio Fantasy - Arquitectura Modular Capstone
 * MÓDULO 4: AUTENTICACIÓN, ROLES Y SEGURIDAD (Sprint 4)
 * 
 * Requerimientos asociados (Anexo 5 Matriz de Requerimientos):
 * - RF-01: Autenticación y control de acceso diferenciado (Administradora vs Trabajadoras).
 * - RF-02: Gestión de personal (creación, asignación de especialidad y desactivación).
 * - RNF-04: Seguridad basada en roles (restricción estricta de eliminación de fichas y acceso anónimo).
 * - RNF-05: Cifrado en tránsito y protocolos HTTPS/TLS.
 * 
 * Integrantes: José Cueto & Benjamín Moya (Capstone Duoc UC 2026)
 */

(function (window) {
    'use strict';

    // Definición formal de roles de la plataforma
    const ROLES = {
        ADMIN: 'admin',
        PROFESIONAL: 'profesional',
        CLIENTA: 'clienta'
    };

    // Matriz de permisos por rol según RF-01 y RNF-04
    const PERMISOS = {
        [ROLES.ADMIN]: {
            verDashboardFinanciero: true,
            gestionarPersonal: true,
            eliminarFichasClientas: true,
            editarInventarioCompleto: true,
            verTodasLasCitas: true,
            configurarPagosFlow: true,
            gestionarGaleriaEstudio: true
        },
        [ROLES.PROFESIONAL]: {
            verDashboardFinanciero: false,
            gestionarPersonal: false,
            eliminarFichasClientas: false, // RNF-04: Denegado estrictamente
            editarInventarioCompleto: false, // Solo descuento por servicio
            verTodasLasCitas: false, // RF-04: Solo sus citas asignadas
            configurarPagosFlow: false,
            gestionarGaleriaEstudio: false
        }
    };

    const AuthModule = {
        ROLES: ROLES,

        /**
         * Obtiene la sesión autenticada actual
         * @returns {Object|null}
         */
        getCurrentUser: function () {
            if (typeof StorageHelper !== 'undefined') {
                const auth = StorageHelper.getAuth();
                if (auth && auth.loggedIn) {
                    return auth.user;
                }
            }
            return null;
        },

        /**
         * Retorna el rol del usuario actual
         * @returns {string} 'admin', 'profesional' o 'invitado'
         */
        getCurrentRole: function () {
            const user = this.getCurrentUser();
            return user ? (user.role || ROLES.PROFESIONAL) : 'invitado';
        },

        /**
         * Comprueba si el usuario autenticado tiene rol de Administrador
         * @returns {boolean}
         */
        isAdmin: function () {
            return this.getCurrentRole() === ROLES.ADMIN;
        },

        /**
         * Comprueba si el usuario autenticado es Trabajadora / Profesional
         * @returns {boolean}
         */
        isProfesional: function () {
            return this.getCurrentRole() === ROLES.PROFESIONAL;
        },

        /**
         * RF-01 & RNF-04: Valida si el usuario en sesión tiene autorización para ejecutar una acción
         * @param {string} permiso - Clave del permiso a evaluar
         * @returns {boolean}
         */
        can: function (permiso) {
            const role = this.getCurrentRole();
            const permisosRol = PERMISOS[role];
            if (!permisosRol) return false;
            return Boolean(permisosRol[permiso]);
        },

        /**
         * Inicia sesión validando credenciales contra Firebase Auth y roles
         * @param {string} email
         * @param {string} password
         * @returns {Promise<Object>}
         */
        login: async function (email, password) {
            if (typeof window.authenticateStaffUser !== 'function') {
                throw new Error('Autenticación no disponible.');
            }
            const user = await window.authenticateStaffUser(email, password);
            StorageHelper.setAuth({ loggedIn: true, user: user });
            return user;
        },

        /**
         * Cierra la sesión activa
         */
        logout: function () {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try { firebase.auth().signOut(); } catch (e) {}
            }
            if (typeof StorageHelper !== 'undefined') {
                StorageHelper.setAuth({ loggedIn: false, user: null });
            }
            if (typeof AppRouter !== 'undefined') {
                AppRouter.navigate('home');
            }
        },

        /**
         * Envía solicitud de restablecimiento de contraseña
         * @param {string} email
         */
        recuperarContrasena: async function (email) {
            const clean = (email || '').trim().toLowerCase();
            if (!clean) throw new Error("Ingresa un correo electrónico.");
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const actionCodeSettings = {
                    url: window.location.origin + '/reset-password.html',
                    handleCodeInApp: false
                };
                try {
                    await firebase.auth().sendPasswordResetEmail(clean, actionCodeSettings);
                } catch (e) {
                    console.warn("[AuthModule] Fallback directo sendPasswordResetEmail", e);
                    await firebase.auth().sendPasswordResetEmail(clean);
                }
            }
        }
    };

    // Exponer globalmente en el namespace de la arquitectura
    window.NicolettAuth = AuthModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.Auth = AuthModule;

})(window);


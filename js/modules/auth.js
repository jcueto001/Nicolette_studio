/**
 * Consulta de sesión y permisos de la interfaz según el rol.
 * Integrantes: José Cueto & Benjamín Moya.
 */

(function (window) {
    'use strict';

    // Roles de usuario
    const ROLES = {
        ADMIN: 'admin',
        PROFESIONAL: 'profesional',
        CLIENTA: 'clienta'
    };

    // Permisos disponibles en la interfaz para cada rol
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
            eliminarFichasClientas: false, // Sin permiso para eliminar fichas
            editarInventarioCompleto: false, // Solo descuento por servicio
            verTodasLasCitas: false, // Solo las citas asignadas
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
         * Valida si el usuario en sesión tiene autorización para ejecutar una acción
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
            if (typeof StorageHelper !== 'undefined') {
                StorageHelper.setAuth({ loggedIn: false, user: null });
            }
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try { firebase.auth().signOut(); } catch (e) {}
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

    // Publicar el módulo para los scripts de la página
    window.NicolettAuth = AuthModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.Auth = AuthModule;

})(window);


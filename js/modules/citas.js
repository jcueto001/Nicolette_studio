/**
 * Horarios, disponibilidad, registro de citas y texto de recordatorios.
 * Integrantes: José Cueto & Benjamín Moya.
 */

(function (window) {
    'use strict';

    const HORARIO_BASE = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const SOBRECUPOS_PERMITIDOS = ['18:00', '19:00', '20:00', '21:00'];
    const MONTO_ABONO_OBLIGATORIO = 5000;
    const HORAS_ANTICIPACION_CANCELACION = 24;

    const CitasModule = {
        /**
         * Retorna los bloques de horario base regulares (09:00 a 17:00)
         * @returns {string[]}
         */
        getHorarioBase: function () {
            return [...HORARIO_BASE];
        },

        /**
         * Retorna los sobrecupos flexibles autorizados (18:00 a 21:00)
         * @returns {string[]}
         */
        getSobrecuposPermitidos: function () {
            return [...SOBRECUPOS_PERMITIDOS];
        },

        /**
         * Retorna el monto de abono reglamentario ($5.000)
         * @returns {number}
         */
        getMontoAbono: function () {
            return MONTO_ABONO_OBLIGATORIO;
        },

        /**
         * Obtiene la lista completa de citas desde StorageHelper / Firestore
         * @returns {Array}
         */
        getCitas: function () {
            return (typeof StorageHelper !== 'undefined') ? StorageHelper.getAppointments() : [];
        },

        /**
         * Filtra y retorna las citas correspondientes exclusivamente a una trabajadora
         * @param {string} profId - Identificador de la profesional
         * @returns {Array}
         */
        getCitasByProfesional: function (profId) {
            if (!profId) return [];
            const todas = this.getCitas();
            return todas.filter(c => c.profId === profId || c.professionalId === profId);
        },

        /**
         * Calcula los bloques disponibles para una fecha y profesional evitando traslapes
         * @param {string} date - Formato YYYY-MM-DD
         * @param {string} profId - ID de la trabajadora
         * @param {boolean} includeSobrecupos - Si se habilitan los sobrecupos vespertinos
         * @returns {string[]}
         */
        getHorasDisponibles: function (date, profId, includeSobrecupos = false) {
            if (typeof StorageHelper !== 'undefined' && StorageHelper.getAvailableTimeSlots) {
                const allowed = includeSobrecupos ? [...HORARIO_BASE, ...SOBRECUPOS_PERMITIDOS] : HORARIO_BASE;
                return StorageHelper.getAvailableTimeSlots(date, profId).then(times => times.filter(time => allowed.includes(time)));
            }
            // Sin el backend no hay disponibilidad verificable.
            return [];
        },

        /**
         * Prepara los datos de la cita y solicita su registro a StorageHelper
         * @param {Object} citaData
         * @returns {Promise<Object>}
         */
        crearCita: async function (citaData) {
            if (!citaData.clientName || !citaData.date || !citaData.time) {
                throw new Error("Datos incompletos para crear la cita.");
            }

            const nuevaCita = {
                ...citaData,
                depositAmount: MONTO_ABONO_OBLIGATORIO,
                depositPaid: false,
                status: citaData.status || 'confirmada',
                policyAccepted: true,
                createdAt: citaData.createdAt || new Date().toISOString()
            };

            if (typeof StorageHelper !== 'undefined' && StorageHelper.saveAppointment) {
                return await StorageHelper.saveAppointment(nuevaCita);
            }
            return nuevaCita;
        },

        /**
         * Actualiza el estado de una cita ('confirmada', 'completada', 'cancelada', 'no asiste')
         * @param {string} citaId
         * @param {string} nuevoEstado
         * @returns {Promise<boolean>}
         */
        cambiarEstado: async function (citaId, nuevoEstado) {
            if (typeof StorageHelper !== 'undefined' && StorageHelper.updateAppointmentStatus) {
                await StorageHelper.updateAppointmentStatus(citaId, nuevoEstado);
                return true;
            }
            return false;
        },

        /**
         * Arma el recordatorio con la fecha, el servicio y la política de cancelación
         * @param {Object} cita
         * @returns {string}
         */
        generarTextoRecordatorio: function (cita) {
            if (!cita) return '';
            const servicio = cita.serviceName || cita.service || 'Servicio';
            const prof = cita.profName || cita.professionalName || 'Especialista Nicolett Studio';
            return `¡Hola ${cita.clientName}! Te recordamos tu cita para "${servicio}" con ${prof} en Nicolett Studio (Buin) para el ${cita.date} a las ${cita.time} hrs. Recuerda que para modificaciones o cancelaciones debes avisar con al menos ${HORAS_ANTICIPACION_CANCELACION} horas de anticipación para validar tu abono de $${MONTO_ABONO_OBLIGATORIO.toLocaleString('es-CL')}. ¡Te esperamos!`;
        }
    };

    // Publicar el módulo para los scripts de la página
    window.NicolettCitas = CitasModule;
    window.NicolettModules = window.NicolettModules || {};
    window.NicolettModules.Citas = CitasModule;

})(window);


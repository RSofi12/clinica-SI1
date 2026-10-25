import { apiFetch } from '../../../services/api';

/**
 * Servicio de Gestión de Citas y Disponibilidad (CU09, CU10 / RF05, RF06, RF07)
 * Paquete 3: Gestión de Citas Médicas
 */
export const appointmentService = {
  /**
   * Consultar disponibilidad de turnos para un médico en una fecha (CU09)
   */
  async fetchAvailability(params = {}) {
    const query = new URLSearchParams();
    if (params.medico_id) query.append('medico_id', params.medico_id);
    if (params.fecha) query.append('fecha', params.fecha);
    if (params.especialidad_id) query.append('especialidad_id', params.especialidad_id);

    const queryString = query.toString();
    return await apiFetch(`/appointments/availability${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Obtener catálogos para el modal de reserva (tipos de cita, especialidades, médicos)
   */
  async fetchBookingFormData() {
    return await apiFetch('/appointments/booking-form-data');
  },

  /**
   * Listado paginado de citas con filtros
   */
  async fetchAppointments(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.q) query.append('q', params.q);
    if (params.fecha) query.append('fecha', params.fecha);
    if (params.medico_id) query.append('medico_id', params.medico_id);
    if (params.paciente_id) query.append('paciente_id', params.paciente_id);
    if (params.estado) query.append('estado', params.estado);

    const queryString = query.toString();
    return await apiFetch(`/appointments${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Programar nueva cita médica con prevención anti-colisión transaccional (CU10 / RF06, RF07)
   */
  async bookAppointment(bookingData) {
    return await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  /**
   * Obtener detalle de una cita por ID
   */
  async fetchAppointmentById(id) {
    return await apiFetch(`/appointments/${id}`);
  },

  /**
   * Cancelar una cita médica con motivo obligatorio (CU12 / RF09 / Prueba #6)
   */
  async cancelAppointment(id, motivo_cancelacion) {
    return await apiFetch(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ motivo_cancelacion }),
    });
  },

  /**
   * Consultar agenda diaria de un médico por fecha y estado (CU14 / RF11 / Prueba #8)
   */
  async fetchDoctorAgenda(params = {}) {
    const query = new URLSearchParams();
    if (params.medico_id) query.append('medico_id', params.medico_id);
    if (params.fecha) query.append('fecha', params.fecha);
    if (params.estado) query.append('estado', params.estado);

    const queryString = query.toString();
    return await apiFetch(`/appointments/doctor-agenda${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Consultar historial cronológico completo de citas de un paciente (CU15 / RF12 / Prueba #7)
   */
  async fetchPatientHistory(patientId, params = {}) {
    const query = new URLSearchParams();
    if (params.estado) query.append('estado', params.estado);

    const queryString = query.toString();
    return await apiFetch(`/appointments/patient-history/${patientId}${queryString ? `?${queryString}` : ''}`);
  },
};


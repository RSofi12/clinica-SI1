import { apiFetch } from '../../../services/api';

/**
 * Servicio de Pasarela de Pagos Stripe Sandbox (CU21)
 * Paquete 5: Integraciones Externas y Pagos
 * Metodología PUDS / RUP — Clínica Vida Salud
 */
export const paymentService = {
  /**
   * Obtiene el listado de transacciones de pago con filtros y métricas
   * @param {object} params - { buscar, estado, page, per_page }
   */
  async fetchPayments(params = {}) {
    const query = new URLSearchParams();
    if (params.buscar) query.append('buscar', params.buscar);
    if (params.estado) query.append('estado', params.estado);
    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);

    const queryString = query.toString();
    return await apiFetch(`/payments${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Inicializa un PaymentIntent en Stripe para una cita médica
   * @param {number|string} idCita
   */
  async createPaymentIntent(idCita) {
    return await apiFetch('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ id_cita: idCita }),
    });
  },

  /**
   * Procesa y confirma el cobro de la cita médica en Stripe Sandbox
   * @param {object} payload - { id_cita, payment_intent_id, tarjeta_numero, tarjeta_marca, tarjeta_exp, tarjeta_cvc }
   */
  async processPayment(payload) {
    return await apiFetch('/payments/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Obtiene el comprobante oficial de pago
   * @param {number|string} idPago
   */
  async fetchReceipt(idPago) {
    return await apiFetch(`/payments/receipt/${idPago}`);
  },
};

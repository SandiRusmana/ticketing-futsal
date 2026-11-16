import axiosClient from '../api/axiosClient';

export const futsaltixApi = {
  // Auth
  login: (credentials) => axiosClient.post('/login', credentials),
  register: (payload) => axiosClient.post('/register', payload),
  me: () => axiosClient.get('/me'),
  logout: () => axiosClient.post('/logout'),

  // Publik: Jadwal, Bagan, Live Score
  getMatches: (params = {}) => axiosClient.get('/matches', { params }),
  getMatchDetail: (id) => axiosClient.get(`/matches/${id}`),

  // Suporter: Checkout, Bayar, E-Ticket
  checkoutTicket: (payload) => axiosClient.post('/orders/checkout', payload),
  payOrder: (orderId, paymentMethod = 'QRIS') =>
    axiosClient.post(`/orders/${orderId}/pay`, { payment_method: paymentMethod }),
  getMyTickets: () => axiosClient.get('/my-tickets'),

  // Operator: Gate Turnstile & Meja Wasit
  verifyGateTicket: (qrPayload, gateName) =>
    axiosClient.post('/operator/tickets/verify', { qr_payload: qrPayload, gate_name: gateName }),
  getScanLogs: () => axiosClient.get('/operator/scan-logs'),
  updateLiveScore: (matchId, payload) => axiosClient.patch(`/matches/${matchId}/score`, payload),
  addMatchEvent: (matchId, payload) => axiosClient.post(`/matches/${matchId}/events`, payload),
  toggleTicketSale: (matchId) => axiosClient.patch(`/matches/${matchId}/toggle-sale`),

  // Super Admin GGM
  getAdminSummary: () => axiosClient.get('/admin/summary'),
  createMatch: (payload) => axiosClient.post('/admin/matches', payload),
  getOperators: () => axiosClient.get('/admin/operators'),
  createOperator: (payload) => axiosClient.post('/admin/operators', payload),
};
import axiosClient from '../api/axiosClient';

/**
 * Layanan API Frontend FutsalTix Cianjur
 * Turnamen Utama: Liga Futsal Pelajar (LFP) Cianjur 2026
 * Terhubung langsung dengan Laravel REST API & Midtrans Snap
 */
export const futsaltixApi = {
  // ==================== 1. OTENTIKASI & AKUN ====================
  login: (credentials) => axiosClient.post('/login', credentials),
  register: (payload) => axiosClient.post('/register', payload),
  me: () => axiosClient.get('/me'),
  logout: () => axiosClient.post('/logout'),

  // ==================== 2. DATA TURNAMEN REAL DARI MYSQL ====================
  getMatches: (params = {}) => axiosClient.get('/matches', { params }),
  getMatchDetail: (id) => axiosClient.get(`/matches/${id}`),
  getCategories: () => axiosClient.get('/categories'),
  getTeams: (params = {}) => axiosClient.get('/teams', { params }),

  // Evaluasi Pak Yayat: Klasemen & Top Scorer Dinamis MySQL
  getStandings: () => axiosClient.get('/standings'),
  getTopScorers: () => axiosClient.get('/top-scorers'),

  // ==================== 3. SUPORTER: CHECKOUT & MIDTRANS SNAP ====================
  checkoutTicket: (payload) => axiosClient.post('/orders/checkout', payload),
  payOrder: (orderId, paymentMethod = 'Midtrans Snap') =>
    axiosClient.post(`/orders/${orderId}/pay`, { payment_method: paymentMethod }),
  confirmPayment: (orderId, paymentDetails = {}) =>
    axiosClient.post(`/orders/${orderId}/pay`, paymentDetails),
  getMyTickets: (params = {}) => axiosClient.get('/my-tickets', { params }),

  // ==================== 4. OPERATOR: MEJA WASIT & KONTROL SKOR ====================
  updateLiveScore: (matchId, payload) => axiosClient.patch(`/matches/${matchId}/score`, payload),
  operatorUpdateScore: (matchId, payload) => axiosClient.patch(`/matches/${matchId}/score`, payload),
  addMatchEvent: (matchId, payload) => axiosClient.post(`/matches/${matchId}/events`, payload),
  toggleTicketSale: (matchId) => axiosClient.patch(`/matches/${matchId}/toggle-sale`),
  toggleMatchSales: (matchId) => axiosClient.patch(`/matches/${matchId}/toggle-sale`),

  // ==================== 5. OPERATOR & ADMIN: PENJADWALAN LAGA ====================
  createMatch: (payload) => axiosClient.post('/matches', payload),
  operatorCreateMatch: (payload) => axiosClient.post('/matches', payload),
  deleteMatch: (id) => axiosClient.delete(`/matches/${id}`),

  // ==================== 6. OPERATOR: SCANNER GATE TURNSTILE ====================
  verifyGateTicket: (qrPayload, gateName) =>
    axiosClient.post('/operator/tickets/verify', { qr_payload: qrPayload, gate_name: gateName }),
  operatorScanTicket: (code, gateName) =>
    axiosClient.post('/operator/tickets/verify', { qr_payload: code, gate_name: gateName }),
  resetTicketCheckIn: (codeOrPayload) =>
    axiosClient.post('/operator/tickets/reset', typeof codeOrPayload === 'object' ? codeOrPayload : { code: codeOrPayload }),
  getActiveTestTickets: () => axiosClient.get('/operator/tickets/active-test-tickets'),
  getScanLogs: () => axiosClient.get('/operator/scan-logs'),

  // ==================== 7. SUPER ADMIN GGM ====================
  getAdminSummary: () => axiosClient.get('/admin/summary'),
  adminOverview: () => axiosClient.get('/admin/summary'),
  getOperators: () => axiosClient.get('/admin/operators'),
  adminOperators: () => axiosClient.get('/admin/operators'),
  updateOperatorStatus: (id, status) => axiosClient.post(`/admin/operators/${id}/status`, { status }),
  approveOperator: (id) => axiosClient.post(`/admin/operators/${id}/status`, { status: 'approved' }),
  rejectOperator: (id) => axiosClient.post(`/admin/operators/${id}/status`, { status: 'rejected' }),
  createOperator: (payload) => axiosClient.post('/admin/operators', payload),
};

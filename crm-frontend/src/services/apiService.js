import api from './api';

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updatePassword: (passwords) => api.put('/auth/updatepassword', passwords),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Client APIs
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
};

// Lead APIs
export const leadAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  convert: (id) => api.post(`/leads/${id}/convert`),
  getStats: () => api.get('/leads/stats'),
};

// More APIs will be added here as modules are completed
// Quotation APIs
export const quotationAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getOne: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  // extras
  getStats: () => api.get('/quotations/stats/overview'),
  send: (id) => api.post(`/quotations/${id}/send`),
  markViewed: (id) => api.post(`/quotations/${id}/view`),
  approve: (id) => api.post(`/quotations/${id}/approve`),
  reject: (id) => api.post(`/quotations/${id}/reject`),
  convertToInvoice: (id) => api.post(`/quotations/${id}/convert`),
  getHistory: (id) => api.get(`/quotations/${id}/history`),
};

// Invoice APIs
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  // extras
  getStats: () => api.get('/invoices/stats/overview'),
  getOutstanding: () => api.get('/invoices/alerts/outstanding'),
  send: (id) => api.post(`/invoices/${id}/send`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/record-payment`, data),
  getPayments: (id) => api.get(`/invoices/${id}/payments`),
};

// AMC APIs
export const amcAPI = {
  getAll: (params) => api.get('/amcs', { params }),
  getOne: (id) => api.get(`/amcs/${id}`),
  create: (data) => api.post('/amcs', data),
  update: (id, data) => api.put(`/amcs/${id}`, data),
  delete: (id) => api.delete(`/amcs/${id}`),
  // extras
  getStats: () => api.get('/amcs/stats/overview'),
  getRenewalAlerts: () => api.get('/amcs/alerts/renewal'),
  scheduleService: (id, data) => api.post(`/amcs/${id}/services`, data),
  completeService: (id, serviceIndex) => api.post(`/amcs/${id}/services/${serviceIndex}/complete`),
  renew: (id, data) => api.post(`/amcs/${id}/renew`, data),
};

// Task APIs
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Expense APIs
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  approve: (id) => api.put(`/expenses/${id}/approve`),
  reject: (id, reason) => api.put(`/expenses/${id}/reject`, { reason }),
};

// Payment APIs
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  // extras
  getStats: () => api.get('/payments/stats/overview'),
  getReconciliation: (params) => api.get('/payments/reports/reconciliation', { params }),
};

// Call Log APIs
export const callAPI = {
  getAll: (params) => api.get('/calls', { params }),
  getOne: (id) => api.get(`/calls/${id}`),
  create: (data) => api.post('/calls', data),
  update: (id, data) => api.put(`/calls/${id}`, data),
  delete: (id) => api.delete(`/calls/${id}`),
  // extras
  getStats: () => api.get('/calls/stats/overview'),
  getPendingFollowUps: () => api.get('/calls/pending/followups'),
  getExecutivePerformance: () => api.get('/calls/performance/executives'),
  completeFollowUp: (id) => api.post(`/calls/${id}/complete-followup`),
};

// AI Assisted APIs
export const aiAPI = {
  followUpDraft: (payload) => api.post('/ai/follow-up-draft', payload),
  salesPitch: (payload) => api.post('/ai/sales-pitch', payload),
  invoiceDescription: (payload) => api.post('/ai/invoice-description', payload),
  clientChurnRisk: (clientId) => api.get(`/ai/client-churn-risk/${clientId}`),
  churnRisks: () => api.get('/ai/churn-risks'),
  amcRenewalProbability: (amcId) => api.get(`/ai/amc-renewal-probability/${amcId}`),
  amcRenewalInsights: () => api.get('/ai/amc-renewal-insights'),
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getSalesStats: (params) => api.get('/dashboard/sales', { params }),
  getRevenueStats: (params) => api.get('/dashboard/revenue', { params }),
  getAmcStats: () => api.get('/dashboard/amc'),
};

export default api;

import api from './api';

export const portalAuthAPI = {
  login: (credentials) => api.post('/portal/auth/login', credentials),
};

export const portalAPI = {
  me: () => api.get('/portal/me'),
  quotations: () => api.get('/portal/quotations'),
  invoices: () => api.get('/portal/invoices'),
  amcs: () => api.get('/portal/amcs'),
  payments: () => api.get('/portal/payments'),
  serviceRequests: () => api.get('/portal/service-requests'),
  createServiceRequest: (data) => api.post('/portal/service-requests', data),
};

export default api;

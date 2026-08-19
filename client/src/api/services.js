import api from './client';

export const authApi = {
  getMe: () => api.get('/auth/me'),
  login: (password) => api.post('/auth/login', { password }),
  setup: (password) => api.post('/auth/setup', { password }),
  logout: () => api.post('/auth/logout'),
  changePassword: (current, next) => api.post('/auth/change-password', { current, next })
};

export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.lowStock) query.append('lowStock', 'true');
    return api.get(`/products?${query.toString()}`);
  },
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const inventoryApi = {
  getSummary: () => api.get('/inventory'),
  adjustStock: (productId, data) => api.post(`/inventory/products/${productId}/stock`, data)
};

export const salesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.productId) query.append('productId', params.productId);
    return api.get(`/sales?${query.toString()}`);
  },
  create: (data) => api.post('/sales', data)
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard')
};

export const reportsApi = {
  getPeriodReport: (period, params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    return api.get(`/reports/${period}?${query.toString()}`);
  },
  getInventoryReport: () => api.get('/reports/inventory')
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export const backupApi = {
  restore: (backup) => api.post('/backup/restore', { backup })
};

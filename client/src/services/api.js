import axios from 'axios';

const getApiBaseUrl = () => {
  // If explicitly configured with a remote URL, use it
  if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost:5000')) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // When deployed (e.g. on Vercel, or accessed via mobile/network), use relative '/api'
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }

  // Local development default
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth or on login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  demoLogin: (role = 'USER') => api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const transactionAPI = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  aiCategorize: (data) => api.post('/transactions/ai-categorize', data),
  uploadReceipt: (formData) => api.post('/transactions/upload-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportCsvUrl: () => `${API_BASE_URL}/transactions/export/csv`,
  importJson: (items) => api.post('/transactions/import/json', { items })
};

export const budgetAPI = {
  list: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`)
};

export const analyticsAPI = {
  getHealthScore: () => api.get('/analytics/health-score'),
  getCashflowHistory: () => api.get('/analytics/cashflow-history'),
  getCategoryBreakdown: () => api.get('/analytics/category-breakdown'),
  getForecast: () => api.get('/analytics/forecast'),
  getAnomalies: () => api.get('/analytics/anomalies'),
  dismissAnomaly: (id) => api.put(`/analytics/anomalies/${id}/dismiss`),
  getRecurring: () => api.get('/analytics/recurring')
};

export const aiAPI = {
  chat: (prompt) => api.post('/ai/chat', { prompt }),
  getQuickPrompts: () => api.get('/ai/quick-prompts'),
  getHistory: () => api.get('/ai/history')
};

export const paymentAPI = {
  getPlans: () => api.get('/payments/plans'),
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history')
};

export const goalAPI = {
  list: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`)
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getPayments: () => api.get('/admin/payments')
};

export default api;

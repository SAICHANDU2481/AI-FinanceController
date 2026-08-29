import axios from 'axios';
import * as synthetic from './syntheticData';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost:5000')) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

// Response Interceptor with synthetic data fallback (Zero Login Barrier)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful response fallback for demo environments
    const url = error.config?.url || '';

    if (url.includes('/analytics/health-score')) {
      return Promise.resolve({ data: synthetic.SYNTHETIC_HEALTH_SCORE });
    }
    if (url.includes('/analytics/cashflow-history')) {
      return Promise.resolve({ data: { history: synthetic.SYNTHETIC_CASHFLOW } });
    }
    if (url.includes('/analytics/category-breakdown')) {
      return Promise.resolve({ data: { breakdown: synthetic.SYNTHETIC_CATEGORY_BREAKDOWN } });
    }
    if (url.includes('/transactions')) {
      return Promise.resolve({
        data: {
          transactions: synthetic.SYNTHETIC_TRANSACTIONS,
          pagination: { total: synthetic.SYNTHETIC_TRANSACTIONS.length, page: 1, limit: 15, pages: 1 }
        }
      });
    }
    if (url.includes('/budgets')) {
      return Promise.resolve({
        data: {
          budgets: synthetic.SYNTHETIC_BUDGETS,
          summary: { totalBudget: 136000, totalSpent: 69400, overallUtilization: 51.0 }
        }
      });
    }
    if (url.includes('/goals')) {
      return Promise.resolve({ data: { goals: synthetic.SYNTHETIC_GOALS } });
    }
    if (url.includes('/analytics/recurring')) {
      return Promise.resolve({
        data: {
          recurringPayments: synthetic.SYNTHETIC_RECURRING,
          summary: { totalMonthlyRecurring: 54626, monthlyBurdenPercentage: 43.7 }
        }
      });
    }
    if (url.includes('/analytics/anomalies')) {
      return Promise.resolve({ data: { anomalies: synthetic.SYNTHETIC_ANOMALIES } });
    }
    if (url.includes('/admin/stats')) {
      return Promise.resolve({ data: { stats: synthetic.SYNTHETIC_ADMIN_STATS } });
    }
    if (url.includes('/auth/me') || url.includes('/auth/demo-login')) {
      return Promise.resolve({ data: { token: 'synthetic-jwt-token', user: synthetic.SYNTHETIC_USER } });
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

export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  previewAICategory: (description, amount) =>
    api.post('/transactions/preview-category', { description, amount }),
  exportCSV: () => api.get('/transactions/export/csv', { responseType: 'blob' }),
  scanReceipt: (formData) =>
    api.post('/transactions/scan-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export const budgetsAPI = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`)
};

export const analyticsAPI = {
  getHealthScore: () => api.get('/analytics/health-score'),
  getCashFlowHistory: (months = 6) => api.get('/analytics/cashflow-history', { params: { months } }),
  getCategoryBreakdown: () => api.get('/analytics/category-breakdown'),
  getForecast: (days = 30) => api.get('/analytics/forecast', { params: { days } }),
  getAnomalies: () => api.get('/analytics/anomalies'),
  dismissAnomaly: (id) => api.put(`/analytics/anomalies/${id}/dismiss`),
  getRecurringPayments: () => api.get('/analytics/recurring')
};

export const aiAdvisorAPI = {
  chat: (message, sessionHistory) =>
    api.post('/ai/chat', { message, sessionHistory }),
  getQuickPrompts: () => api.get('/ai/quick-prompts'),
  getHistory: () => api.get('/ai/history')
};

export const paymentsAPI = {
  getPlans: () => api.get('/payments/plans'),
  createOrder: (planTier, billingCycle) =>
    api.post('/payments/create-order', { planTier, billingCycle }),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getPaymentHistory: () => api.get('/payments/history')
};

export const goalsAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  addFunds: (id, amount) => api.post(`/goals/${id}/add-funds`, { amount }),
  delete: (id) => api.delete(`/goals/${id}`)
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const transactionAPI = transactionsAPI;
export const budgetAPI = budgetsAPI;
export const goalAPI = goalsAPI;
export const paymentAPI = paymentsAPI;
export const aiAPI = aiAdvisorAPI;
export const notificationAPI = notificationsAPI;

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role, tier) => api.put(`/admin/users/${id}/role`, { role, tier }),
  getPayments: (params) => api.get('/admin/payments', { params })
};

export default api;

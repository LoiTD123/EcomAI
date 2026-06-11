import axios from 'axios';

// Gateway URL
const API_URL = import.meta.env.VITE_GATEWAY_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request Interceptor: Attach JWT token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token refreshing or expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const resp = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refresh: refreshToken });
          localStorage.setItem('access_token', resp.data.access);
          originalRequest.headers.Authorization = `Bearer ${resp.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/v1/auth/register', data),
  login: (data) => api.post('/api/v1/auth/login', data),
  logout: (refresh) => api.post('/api/v1/auth/logout', { refresh }),
  profile: () => api.get('/api/v1/auth/profile'),
};

export const productAPI = {
  list: (params) => api.get('/api/v1/products', { params }),
  get: (id) => api.get(`/api/v1/products/${id}`),
};

export const cartAPI = {
  get: () => api.get('/api/v1/cart'),
  add: (data) => api.post('/api/v1/cart/add', data),
  update: (id, quantity) => api.put(`/api/v1/cart/items/${id}`, { quantity }),
  remove: (id) => api.delete(`/api/v1/cart/items/${id}`),
  clear: () => api.post('/api/v1/cart/clear'),
};

export const orderAPI = {
  create: (data) => api.post('/api/v1/orders', data),
  list: () => api.get('/api/v1/orders'),
  get: (id) => api.get(`/api/v1/orders/${id}`),
};

export const aiAPI = {
  chat: (data) => api.post('/api/v1/ai/chatbot', data),
  recommend: (limit = 5) => api.get('/api/v1/ai/recommend', { params: { limit } }),
  logBehavior: (data) => api.post('/api/v1/ai/behavior', data),
  logSearch: (query) => api.post('/api/v1/ai/search-log', { query }),
};

export default api;

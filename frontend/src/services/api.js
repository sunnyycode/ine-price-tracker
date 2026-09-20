import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const searchProducts = (query) =>
  api.get(`/products/search?q=${encodeURIComponent(query)}`);

export const getTrackedProducts = () =>
  api.get('/tracked-products');

export const trackProduct = (product) =>
  api.post('/tracked-products', product);

export const getTrackedProduct = (id) =>
  api.get(`/tracked-products/${id}`);

export const getPriceHistory = (id) =>
  api.get(`/tracked-products/${id}/history`);

export const getScrapeLogs = (id) =>
  api.get(`/tracked-products/${id}/logs`);

export const scrapeProduct = (id) =>
  api.post(`/tracked-products/${id}/scrape`);

export default api;

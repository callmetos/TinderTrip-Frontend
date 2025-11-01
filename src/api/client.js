import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let authToken = null;

export const setAuthToken = (t) => {
  authToken = t;
};

// ใส่ Header กลางทุกคำขอ
api.interceptors.request.use((config) => {
  // Ensure headers object exists
  config.headers = { ...(config.headers || {}) };

  // Only set Content-Type to application/json if it's not a FormData upload and not already specified
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (!isFormData && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  // เพิ่ม JWT token หากมี
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

// รวมการจัดการ error ที่เดียว (mapping ข้อความใช้งานได้)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // normalize error message
    err.userMessage =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'Network error';
    return Promise.reject(err);
  }
);

// Export API methods สำหรับใช้งานง่าย
export const apiMethods = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
};
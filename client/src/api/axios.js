// ─────────────────────────────────────────────────────────────────
// AlignCV — Axios Instance
// Central HTTP client with JWT interceptor and 401 redirect.
// ─────────────────────────────────────────────────────────────────

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s — Groq is ultra-fast, no need for long timeouts
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;

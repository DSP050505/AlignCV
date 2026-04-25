// ─────────────────────────────────────────────────────────────────
// AlignCV — Auth API Functions
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export const authApi = {
  signup: (name, passcode) => api.post('/auth/signup', { name, passcode }),
  login: (name, passcode) => api.post('/auth/login', { name, passcode }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

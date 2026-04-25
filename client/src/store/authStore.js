// ─────────────────────────────────────────────────────────────────
// AlignCV — Auth Zustand Store
// Manages user, token, login/logout with localStorage persistence.
// ─────────────────────────────────────────────────────────────────

import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('aligncv_user') || 'null'),
  token: localStorage.getItem('aligncv_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('aligncv_user', JSON.stringify(user));
    localStorage.setItem('aligncv_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('aligncv_user');
    localStorage.removeItem('aligncv_token');
    
    // Clear profile store to prevent profile bleeding to next user
    import('./profileStore').then(({ useProfileStore }) => {
      useProfileStore.getState().clearProfile();
    });

    set({ user: null, token: null });
  },

  isAuthenticated: () => {
    const state = useAuthStore.getState();
    return !!state.token && !!state.user;
  },
}));

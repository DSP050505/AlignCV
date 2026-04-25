// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile Zustand Store
// Manages all 7 profile sections with fetch/save actions.
// ─────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { profileApi } from '../api/profileApi';

export const useProfileStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────
  personal: {},
  education: [],
  experiences: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  completeness: 0,
  loading: false,
  loaded: false,

  // ── Fetch Full Profile ──────────────────────────────────────────
  fetchProfile: async () => {
    if (get().loaded) return;
    set({ loading: true });
    try {
      const { data } = await profileApi.getFullProfile();
      const p = data.data;
      set({
        personal: p.personal || {},
        education: p.education || [],
        experiences: p.experiences || [],
        projects: p.projects || [],
        skills: p.skills || [],
        achievements: p.achievements || [],
        certifications: p.certifications || [],
        completeness: p.completeness || 0,
        loaded: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  // ── Force Refresh ───────────────────────────────────────────────
  refreshProfile: async () => {
    set({ loaded: false });
    await get().fetchProfile();
  },

  // ── Clear Profile (On Logout) ───────────────────────────────────
  clearProfile: () => {
    set({
      personal: {},
      education: [],
      experiences: [],
      projects: [],
      skills: [],
      achievements: [],
      certifications: [],
      completeness: 0,
      loading: false,
      loaded: false,
    });
  },

  // ── Update Helpers (optimistic local update after API call) ─────
  setPersonal: (personal) => set({ personal }),
  setEducation: (education) => set({ education }),
  setExperiences: (experiences) => set({ experiences }),
  setProjects: (projects) => set({ projects }),
  setSkills: (skills) => set({ skills }),
  setAchievements: (achievements) => set({ achievements }),
  setCertifications: (certifications) => set({ certifications }),
}));

import { create } from 'zustand';
import { jdApi } from '../api/jdApi';
import { resumeApi } from '../api/resumeApi';

export const useResumeStore = create((set, get) => ({
  jdAnalysisId: null,
  currentResumeId: null,
  loading: false,
  error: null,

  setJdAnalysisId: (id) => set({ jdAnalysisId: id }),

  analyseJD: async (raw_jd) => {
    set({ loading: true, error: null });
    try {
      const response = await jdApi.analyse(raw_jd);
      set({ jdAnalysisId: response.data.data.id, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to analyse JD', loading: false });
      throw error;
    }
  },

  generateTailoredResume: async (jdAnalysisId) => {
    set({ loading: true, error: null });
    try {
      const response = await resumeApi.generate(jdAnalysisId);
      set({ currentResumeId: response.data.data.id, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to tailor resume', loading: false });
      throw error;
    }
  },

  reset: () => set({ jdAnalysisId: null, currentResumeId: null, loading: false, error: null }),
}));

import api from './axios';

export const resumeApi = {
  generate: (jd_analysis_id) => api.post('/resume/generate', { jd_analysis_id }),
  get: (id) => api.get(`/resume/${id}`),
  updateSource: (id, html_source) => api.put(`/resume/${id}/source`, { html_source }),
  getAll: () => api.get('/resume'),
  delete: (id) => api.delete(`/resume/${id}`),
};

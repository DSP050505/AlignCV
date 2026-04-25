import api from './axios';

export const jdApi = {
  analyse: (raw_jd) => api.post('/jd/analyse', { raw_jd }),
  get: (id) => api.get(`/jd/${id}`),
  getAll: () => api.get('/jd'),
};

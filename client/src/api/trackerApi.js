import api from './axios';

export const trackerApi = {
  getAll: () => api.get('/tracker'),
  create: (data) => api.post('/tracker', data),
  delete: (id) => api.delete(`/tracker/${id}`),
};

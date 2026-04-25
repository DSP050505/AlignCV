import api from './axios';

export const atsApi = {
  score: (resume_id) => api.post('/ats/score', { resume_id }),
};

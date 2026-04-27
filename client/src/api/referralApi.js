import api from './axios';

export const referralApi = {
  fetchJob: (url, manual_jd) => api.post('/referral/fetch-job', { url, manual_jd }),

  matchConnections: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/referral/match-connections', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  findPublicEmployees: (data) => api.post('/referral/find-public-employees', data),

  sendMessages: (data) => api.post('/referral/send-messages', data),

  getLog: () => api.get('/referral/log'),

  updateOutreach: (id, data) => api.put(`/referral/outreach/${id}`, data),
};

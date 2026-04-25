import api from './axios';

export const skillgapApi = {
  analyse: (resume_id, jd_analysis_id) => api.post('/skillgap/analyse', { resume_id, jd_analysis_id }),
  accept: (resume_id, skill) => api.post('/skillgap/accept', { resume_id, skill }),
  previewAccept: (resume_id, skill) => api.post('/skillgap/preview-accept', { resume_id, skill }),
  applyAccept: (resume_id, skill) => api.post('/skillgap/apply-accept', { resume_id, skill }),
};

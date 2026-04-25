// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile API Functions
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export const profileApi = {
  // Upload & Extract
  uploadResume: (formData) => api.post('/profile/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60s — Groq is ultra-fast, PDF extract + AI parse should finish in <15s
  }),

  // Full profile
  getFullProfile: () => api.get('/profile'),

  // Personal
  updatePersonal: (data) => api.put('/profile/personal', data),

  // Education
  getEducation: () => api.get('/profile/education'),
  createEducation: (data) => api.post('/profile/education', data),
  updateEducation: (id, data) => api.put(`/profile/education/${id}`, data),
  deleteEducation: (id) => api.delete(`/profile/education/${id}`),

  // Experience
  getExperiences: () => api.get('/profile/experience'),
  createExperience: (data) => api.post('/profile/experience', data),
  updateExperience: (id, data) => api.put(`/profile/experience/${id}`, data),
  deleteExperience: (id) => api.delete(`/profile/experience/${id}`),

  // Projects
  getProjects: () => api.get('/profile/projects'),
  createProject: (data) => api.post('/profile/projects', data),
  updateProject: (id, data) => api.put(`/profile/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/profile/projects/${id}`),

  // Skills
  getSkills: () => api.get('/profile/skills'),
  createSkill: (data) => api.post('/profile/skills', data),
  bulkUpdateSkills: (skills) => api.put('/profile/skills/bulk', { skills }),
  deleteSkill: (id) => api.delete(`/profile/skills/${id}`),

  // Achievements
  getAchievements: () => api.get('/profile/achievements'),
  createAchievement: (data) => api.post('/profile/achievements', data),
  updateAchievement: (id, data) => api.put(`/profile/achievements/${id}`, data),
  deleteAchievement: (id) => api.delete(`/profile/achievements/${id}`),

  // Certifications
  getCertifications: () => api.get('/profile/certifications'),
  createCertification: (data) => api.post('/profile/certifications', data),
  updateCertification: (id, data) => api.put(`/profile/certifications/${id}`, data),
  deleteCertification: (id) => api.delete(`/profile/certifications/${id}`),
};

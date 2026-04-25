// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile Routes
// Full CRUD for all 7 profile sections with Zod validation.
// ─────────────────────────────────────────────────────────────────

const { Router } = require('express');
const { z } = require('zod');
const profileController = require('../controllers/profile.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

const router = Router();

// ── Zod Schemas ──────────────────────────────────────────────────

const personalSchema = z.object({
  full_name: z.string().max(200).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  github: z.string().max(100).optional().nullable(),
  linkedin: z.string().max(100).optional().nullable(),
  leetcode: z.string().max(100).optional().nullable(),
  portfolio: z.string().max(200).optional().nullable(),
  other_links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(200).optional().nullable(),
  field: z.string().max(200).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  is_current: z.boolean().optional(),
  order_index: z.number().optional(),
});

const experienceSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  type: z.enum(['job', 'internship', 'freelance']).optional(),
  location: z.string().max(200).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  bullets: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  order_index: z.number().optional(),
});

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  bullets: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  repo_url: z.string().max(500).optional().nullable(),
  live_url: z.string().max(500).optional().nullable(),
  order_index: z.number().optional(),
});

const skillSchema = z.object({
  category: z.string().max(100).optional().nullable(),
  name: z.string().min(1).max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().nullable(),
});

const bulkSkillsSchema = z.object({
  skills: z.array(z.object({
    category: z.string().max(100).optional().nullable(),
    name: z.string().min(1).max(100),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional().nullable(),
  })),
});

const achievementSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  order_index: z.number().optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1).max(300),
  issuer: z.string().max(200).optional().nullable(),
  issued_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  url: z.string().max(500).optional().nullable(),
});

// ── Upload Resume ────────────────────────────────────────────────
const uploadService = require('../services/uploadService');
router.post('/upload', auth, uploadService.uploadMiddleWare.single('resume'), asyncHandler(profileController.uploadResume));

// ── Full Profile ─────────────────────────────────────────────────
router.get('/', auth, asyncHandler(profileController.getFullProfile));

// ── Personal ─────────────────────────────────────────────────────
router.put('/personal', auth, validate(personalSchema), asyncHandler(profileController.updatePersonal));

// ── Education ────────────────────────────────────────────────────
router.get('/education', auth, asyncHandler(profileController.getEducation));
router.post('/education', auth, validate(educationSchema), asyncHandler(profileController.createEducation));
router.put('/education/:id', auth, validate(educationSchema), asyncHandler(profileController.updateEducation));
router.delete('/education/:id', auth, asyncHandler(profileController.deleteEducation));

// ── Experience ───────────────────────────────────────────────────
router.get('/experience', auth, asyncHandler(profileController.getExperiences));
router.post('/experience', auth, validate(experienceSchema), asyncHandler(profileController.createExperience));
router.put('/experience/:id', auth, validate(experienceSchema), asyncHandler(profileController.updateExperience));
router.delete('/experience/:id', auth, asyncHandler(profileController.deleteExperience));

// ── Projects ─────────────────────────────────────────────────────
router.get('/projects', auth, asyncHandler(profileController.getProjects));
router.post('/projects', auth, validate(projectSchema), asyncHandler(profileController.createProject));
router.put('/projects/:id', auth, validate(projectSchema), asyncHandler(profileController.updateProject));
router.delete('/projects/:id', auth, asyncHandler(profileController.deleteProject));

// ── Skills ───────────────────────────────────────────────────────
router.get('/skills', auth, asyncHandler(profileController.getSkills));
router.post('/skills', auth, validate(skillSchema), asyncHandler(profileController.createSkill));
router.put('/skills/bulk', auth, validate(bulkSkillsSchema), asyncHandler(profileController.bulkUpdateSkills));
router.delete('/skills/:id', auth, asyncHandler(profileController.deleteSkill));

// ── Achievements ─────────────────────────────────────────────────
router.get('/achievements', auth, asyncHandler(profileController.getAchievements));
router.post('/achievements', auth, validate(achievementSchema), asyncHandler(profileController.createAchievement));
router.put('/achievements/:id', auth, validate(achievementSchema), asyncHandler(profileController.updateAchievement));
router.delete('/achievements/:id', auth, asyncHandler(profileController.deleteAchievement));

// ── Certifications ───────────────────────────────────────────────
router.get('/certifications', auth, asyncHandler(profileController.getCertifications));
router.post('/certifications', auth, validate(certificationSchema), asyncHandler(profileController.createCertification));
router.put('/certifications/:id', auth, validate(certificationSchema), asyncHandler(profileController.updateCertification));
router.delete('/certifications/:id', auth, asyncHandler(profileController.deleteCertification));

module.exports = router;

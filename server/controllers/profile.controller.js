// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile Controller
// Thin controller layer for all profile CRUD operations.
// ─────────────────────────────────────────────────────────────────

const profileService = require('../services/profileService');

const uploadService = require('../services/uploadService');
const nimService = require('../services/nimService');

// ── Upload Resume ────────────────────────────────────────────────
exports.uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  // 1. Extract raw text
  const rawText = await uploadService.extractTextFromBuffer(req.file.buffer, req.file.mimetype);
  
  // 2. Pass to AI for structure parsing
  const parsedData = await nimService.parseResumePDF(rawText);

  // 3. Save to profile
  await profileService.overwriteProfileFromParse(req.user.id, parsedData);

  res.json({ success: true, data: { message: 'Resume imported successfully' } });
};

// ── Full Profile ─────────────────────────────────────────────────
exports.getFullProfile = async (req, res) => {
  const profile = await profileService.getFullProfile(req.user.id);
  const completeness = profileService.calculateCompleteness(profile);
  res.json({ success: true, data: { ...profile, completeness } });
};

// ── Personal Info ────────────────────────────────────────────────
exports.updatePersonal = async (req, res) => {
  const result = await profileService.updatePersonal(req.user.id, req.body);
  res.json({ success: true, data: result });
};

// ── Education ────────────────────────────────────────────────────
exports.getEducation = async (req, res) => {
  const data = await profileService.getEducation(req.user.id);
  res.json({ success: true, data });
};

exports.createEducation = async (req, res) => {
  const data = await profileService.createEducation(req.user.id, req.body);
  res.status(201).json({ success: true, data });
};

exports.updateEducation = async (req, res) => {
  const data = await profileService.updateEducation(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
};

exports.deleteEducation = async (req, res) => {
  await profileService.deleteEducation(req.user.id, req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

// ── Experience ───────────────────────────────────────────────────
exports.getExperiences = async (req, res) => {
  const data = await profileService.getExperiences(req.user.id);
  res.json({ success: true, data });
};

exports.createExperience = async (req, res) => {
  const data = await profileService.createExperience(req.user.id, req.body);
  res.status(201).json({ success: true, data });
};

exports.updateExperience = async (req, res) => {
  const data = await profileService.updateExperience(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
};

exports.deleteExperience = async (req, res) => {
  await profileService.deleteExperience(req.user.id, req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

// ── Projects ─────────────────────────────────────────────────────
exports.getProjects = async (req, res) => {
  const data = await profileService.getProjects(req.user.id);
  res.json({ success: true, data });
};

exports.createProject = async (req, res) => {
  const data = await profileService.createProject(req.user.id, req.body);
  res.status(201).json({ success: true, data });
};

exports.updateProject = async (req, res) => {
  const data = await profileService.updateProject(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
};

exports.deleteProject = async (req, res) => {
  await profileService.deleteProject(req.user.id, req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

// ── Skills ───────────────────────────────────────────────────────
exports.getSkills = async (req, res) => {
  const data = await profileService.getSkills(req.user.id);
  res.json({ success: true, data });
};

exports.createSkill = async (req, res) => {
  const data = await profileService.createSkill(req.user.id, req.body);
  res.status(201).json({ success: true, data });
};

exports.bulkUpdateSkills = async (req, res) => {
  const data = await profileService.createSkillsBulk(req.user.id, req.body.skills);
  res.json({ success: true, data });
};

exports.deleteSkill = async (req, res) => {
  await profileService.deleteSkill(req.user.id, req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

// ── Achievements ─────────────────────────────────────────────────
exports.getAchievements = async (req, res) => {
  const data = await profileService.getAchievements(req.user.id);
  res.json({ success: true, data });
};

exports.createAchievement = async (req, res) => {
  const data = await profileService.createAchievement(req.user.id, req.body);
  res.status(201).json({ success: true, data });
};

exports.updateAchievement = async (req, res) => {
  const data = await profileService.updateAchievement(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
};

exports.deleteAchievement = async (req, res) => {
  await profileService.deleteAchievement(req.user.id, req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

// ── Certifications ───────────────────────────────────────────────
exports.getCertifications = async (req, res) => {
  const data = await profileService.getCertifications(req.user.id);
  res.json({ success: true, data });
};

exports.createCertification = async (req, res) => {
  const data = await profileService.createCertification(req.user.id, req.body);
  res.status(201).json({ success: true, data });
};

exports.updateCertification = async (req, res) => {
  const data = await profileService.updateCertification(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
};

exports.deleteCertification = async (req, res) => {
  await profileService.deleteCertification(req.user.id, req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

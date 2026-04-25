// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile Service
// Aggregates all profile sections and delegates CRUD to queries.
// ─────────────────────────────────────────────────────────────────

const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');
const profileQueries = require('../db/queries/profile.queries');
const educationQueries = require('../db/queries/education.queries');
const experienceQueries = require('../db/queries/experience.queries');
const projectsQueries = require('../db/queries/projects.queries');
const skillsQueries = require('../db/queries/skills.queries');
const achievementsQueries = require('../db/queries/achievements.queries');
const certificationsQueries = require('../db/queries/certifications.queries');

// ── Overwrite Profile from Parsed Data ──────────────────────────

// ── Overwrite Profile from Parsed Data ──────────────────────────
const db = require('../db/knex');

async function overwriteProfileFromParse(userId, parsedData) {
  logger.info(`[Profile] Overwriting profile for user: ${userId} from parsed upload`);

  // ── Date sanitizer: AI may return "November 2022", "Present", "2019" ──
  const isCurrentTrigger = (val) => {
    if (!val || typeof val !== 'string') return false;
    const lower = val.toLowerCase().trim();
    return ['present', 'current', 'ongoing', 'till date', 'till now', 'now'].includes(lower);
  };

  const sanitizeDate = (val) => {
    if (!val || typeof val !== 'string') return null;
    
    if (isCurrentTrigger(val) || ['n/a', 'na', ''].includes(val.toLowerCase().trim())) {
      return null;
    }

    // Attempt to convert "November 2022" or "2019" into standard Date objects
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
    
    // Fallback manual checks if the JS Date parser fails
    const yearMatch = val.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return `${yearMatch[0]}-01-01`; 
    }
    return null;
  };

  // ── Smart Array & URL Cleaners ──
  const cleanUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    const clean = url.trim();
    if (!clean.startsWith('http')) return `https://${clean.replace(/^(https?:\/\/)?(www\.)?/, '')}`;
    return clean;
  };

  const cleanArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.flat().map(s => String(s).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    return [];
  };

  const parseCgpa = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return val;
    // Extract first decimal pattern: e.g. "3.8/4.0" -> 3.8
    const match = String(val).match(/(\d\.\d+)/); 
    if (match) return parseFloat(match[1]);
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const sanitizeItem = (item, type, dateFields = [], urlFields = []) => {
    const cleaned = { ...item };
    
    // 1. Sanitize dates
    for (const field of dateFields) {
      if (field in cleaned) {
        const raw = cleaned[field];
        if (field === 'end_date' && isCurrentTrigger(raw)) {
          cleaned.is_current = true;
        }
        cleaned[field] = sanitizeDate(raw);
      }
    }

    // 2. Sanitize URLs
    for (const field of urlFields) {
      if (field in cleaned) cleaned[field] = cleanUrl(cleaned[field]);
    }

    // 3. Sanitize Arrays
    if ('bullets' in cleaned) cleaned.bullets = JSON.stringify(cleanArray(cleaned.bullets));
    if ('tech_stack' in cleaned) cleaned.tech_stack = cleanArray(cleaned.tech_stack);

    // 4. Erase explicitly undefined fields
    Object.keys(cleaned).forEach(k => { if (cleaned[k] === undefined) delete cleaned[k]; });

    // 5. Postgres Type Normalizations & Fallbacks
    const ensureString = (val, fallback) => (val && typeof val === 'string' && val.trim() !== '') ? val.trim() : fallback;

    if (type === 'education') {
      cleaned.institution = ensureString(cleaned.institution, 'Unknown Institution');
      cleaned.cgpa = parseCgpa(cleaned.cgpa);
    } else if (type === 'experience') {
      cleaned.company = ensureString(cleaned.company, 'Unknown Company');
      cleaned.role = ensureString(cleaned.role, 'Unknown Role');
      // Enforce enum
      const tLower = String(cleaned.type || '').toLowerCase();
      cleaned.type = ['job', 'internship', 'freelance'].includes(tLower) ? tLower : 'job';
    } else if (type === 'project') {
      cleaned.title = ensureString(cleaned.title, 'Untitled Project');
    } else if (type === 'achievement') {
      cleaned.title = ensureString(cleaned.title, 'Achievement');
    } else if (type === 'certification') {
      cleaned.name = ensureString(cleaned.name, 'Certification');
    }

    return cleaned;
  };

  // 1. Personal
  if (parsedData.personal) {
    const p = parsedData.personal;
    ['email', 'phone', 'github', 'linkedin', 'leetcode', 'portfolio'].forEach(f => {
      if (['github', 'linkedin', 'leetcode', 'portfolio'].includes(f) && p[f]) {
        p[f] = cleanUrl(p[f]);
      }
    });
    p.full_name = p.full_name || p.name || 'Anonymous User';
    await updatePersonal(userId, p);
  }

  // Helper to clear and insert
  const recreate = async (table, items) => {
    await db(table).where({ user_id: userId }).del();
    if (items && items.length > 0) {
      const toInsert = items.map(item => ({ ...item, user_id: userId }));
      await db(table).insert(toInsert);
    }
  };

  // 2. Overwrite Arrays (with guaranteed table-specific sanitization)
  const eduItems = (parsedData.education || []).map(e => sanitizeItem(e, 'education', ['start_date', 'end_date'], []));
  const expItems = (parsedData.experiences || []).map(e => sanitizeItem(e, 'experience', ['start_date', 'end_date'], []));
  const projItems = (parsedData.projects || []).map(p => sanitizeItem(p, 'project', ['start_date', 'end_date'], ['repo_url', 'live_url']));
  const achItems = (parsedData.achievements || []).map(a => sanitizeItem(a, 'achievement', ['date'], []));
  const certItems = (parsedData.certifications || []).map(c => sanitizeItem(c, 'certification', ['issued_at', 'expires_at'], ['url']));

  // 3. Skills specific NOT NULL check
  let skillItems = parsedData.skills || [];
  skillItems = skillItems.map(s => ({ ...s, name: s.name && s.name.trim() ? s.name.trim() : 'Unknown Skill' }));

  await recreate('education', eduItems);
  await recreate('experiences', expItems);
  await recreate('projects', projItems);
  await createSkillsBulk(userId, skillItems);
  await recreate('achievements', achItems);
  await recreate('certifications', certItems);
}

// ── Get Full Profile ─────────────────────────────────────────────
async function getFullProfile(userId) {
  logger.info(`[Profile] Fetching full profile for user: ${userId}`);

  const [personal, education, experiences, projects, skills, achievements, certifications] =
    await Promise.all([
      profileQueries.findByUserId(userId),
      educationQueries.findByUserId(userId),
      experienceQueries.findByUserId(userId),
      projectsQueries.findByUserId(userId),
      skillsQueries.findByUserId(userId),
      achievementsQueries.findByUserId(userId),
      certificationsQueries.findByUserId(userId),
    ]);

  return {
    personal: personal || {},
    education,
    experiences,
    projects,
    skills,
    achievements,
    certifications,
  };
}

// ── Profile Completeness ─────────────────────────────────────────
function calculateCompleteness(profile) {
  let score = 0;
  const total = 7;

  if (profile.personal?.email) score++;
  if (profile.education?.length > 0) score++;
  if (profile.experiences?.length > 0) score++;
  if (profile.projects?.length > 0) score++;
  if (profile.skills?.length > 0) score++;
  if (profile.achievements?.length > 0) score++;
  if (profile.certifications?.length > 0) score++;

  return Math.round((score / total) * 100);
}

// ── Personal Info ────────────────────────────────────────────────
async function updatePersonal(userId, data) {
  logger.info(`[Profile] Updating personal info for user: ${userId}`);
  let profile = await profileQueries.findByUserId(userId);
  if (!profile) {
    profile = await profileQueries.create(userId);
  }
  return profileQueries.update(userId, data);
}

// ── Education CRUD ───────────────────────────────────────────────
async function getEducation(userId) {
  return educationQueries.findByUserId(userId);
}

async function createEducation(userId, data) {
  return educationQueries.create(userId, data);
}

async function updateEducation(userId, id, data) {
  const entry = await educationQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Education entry');
  return educationQueries.update(id, data);
}

async function deleteEducation(userId, id) {
  const entry = await educationQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Education entry');
  return educationQueries.remove(id);
}

// ── Experience CRUD ──────────────────────────────────────────────
async function getExperiences(userId) {
  return experienceQueries.findByUserId(userId);
}

async function createExperience(userId, data) {
  return experienceQueries.create(userId, data);
}

async function updateExperience(userId, id, data) {
  const entry = await experienceQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Experience entry');
  return experienceQueries.update(id, data);
}

async function deleteExperience(userId, id) {
  const entry = await experienceQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Experience entry');
  return experienceQueries.remove(id);
}

// ── Projects CRUD ────────────────────────────────────────────────
async function getProjects(userId) {
  return projectsQueries.findByUserId(userId);
}

async function createProject(userId, data) {
  return projectsQueries.create(userId, data);
}

async function updateProject(userId, id, data) {
  const entry = await projectsQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Project');
  return projectsQueries.update(id, data);
}

async function deleteProject(userId, id) {
  const entry = await projectsQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Project');
  return projectsQueries.remove(id);
}

// ── Skills CRUD ──────────────────────────────────────────────────
async function getSkills(userId) {
  return skillsQueries.findByUserId(userId);
}

async function createSkill(userId, data) {
  return skillsQueries.create(userId, data);
}

async function createSkillsBulk(userId, skills) {
  await skillsQueries.removeAllByUser(userId);
  if (skills.length === 0) return [];
  return skillsQueries.createMany(userId, skills);
}

async function deleteSkill(userId, id) {
  return skillsQueries.remove(id);
}

// ── Achievements CRUD ────────────────────────────────────────────
async function getAchievements(userId) {
  return achievementsQueries.findByUserId(userId);
}

async function createAchievement(userId, data) {
  return achievementsQueries.create(userId, data);
}

async function updateAchievement(userId, id, data) {
  const entry = await achievementsQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Achievement');
  return achievementsQueries.update(id, data);
}

async function deleteAchievement(userId, id) {
  const entry = await achievementsQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Achievement');
  return achievementsQueries.remove(id);
}

// ── Certifications CRUD ──────────────────────────────────────────
async function getCertifications(userId) {
  return certificationsQueries.findByUserId(userId);
}

async function createCertification(userId, data) {
  return certificationsQueries.create(userId, data);
}

async function updateCertification(userId, id, data) {
  const entry = await certificationsQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Certification');
  return certificationsQueries.update(id, data);
}

async function deleteCertification(userId, id) {
  const entry = await certificationsQueries.findById(id);
  if (!entry || entry.user_id !== userId) throw new NotFoundError('Certification');
  return certificationsQueries.remove(id);
}

module.exports = {
  getFullProfile,
  calculateCompleteness,
  updatePersonal,
  getEducation, createEducation, updateEducation, deleteEducation,
  getExperiences, createExperience, updateExperience, deleteExperience,
  getProjects, createProject, updateProject, deleteProject,
  getSkills, createSkill, createSkillsBulk, deleteSkill,
  getAchievements, createAchievement, updateAchievement, deleteAchievement,
  getCertifications, createCertification, updateCertification, deleteCertification,
  overwriteProfileFromParse,
};

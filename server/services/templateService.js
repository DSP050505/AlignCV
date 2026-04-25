// ─────────────────────────────────────────────────────────────────
// AlignCV — Template Service
// Maps profile/resume JSON into Handlebars HTML
// ─────────────────────────────────────────────────────────────────

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Ensure templates logic parses the file
const TEMPLATE_PATH = path.join(__dirname, '../templates/jake_resume.template.html');
// Force nodemon restart
let template;

try {
  template = Handlebars.compile(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
} catch (e) {
  logger.error('[Template] Failed to load template file. Error: ' + e.message);
}

function groupSkillsByCategory(skills) {
  const groups = {};

  if (!skills || skills.length === 0) return [];
  
  for (const skill of skills) {
    const cat = skill.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(skill.name);
  }

  const orderRank = {
    'Languages': 1,
    'Frameworks & Libraries': 2,
    'Frameworks': 3,
    'Libraries': 4,
    'Cloud & Databases': 5,
    'Developer Tools': 6,
    'Tools': 7,
    'Soft Skills': 10,
    'Other': 20
  };

  return Object.keys(groups)
    .sort((a, b) => (orderRank[a] || 50) - (orderRank[b] || 50))
    .map(c => ({ category: c, skills_str: groups[c].join(', ') }));
}

function formatResumeDate(dateVal) {
  if (!dateVal) return '';
  const parsed = new Date(dateVal);
  if (!isNaN(parsed.getTime())) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }
  return String(dateVal);
}

function buildResumeHTML(fullProfile, generatedResumeData) {
  logger.info('[Template] Building resume HTML', { userId: fullProfile.personal.user_id });

  // Safety fallbacks
  if (!template) {
    template = Handlebars.compile(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
  }

  // Find exact references from Profile for selected experiences/projects
  const enrichedExperiences = (generatedResumeData.selected_experiences || []).map(se => {
    const profileMatch = fullProfile.experiences.find(e => e.id === se.experience_id);
    return {
      ...profileMatch,
      start_date: formatResumeDate(profileMatch?.start_date),
      end_date: formatResumeDate(profileMatch?.end_date),
      bullets: se.tailored_bullets
    };
  }).filter(e => e.role);

  const enrichedProjects = (generatedResumeData.selected_projects || []).map(sp => {
    const profileMatch = fullProfile.projects.find(p => p.id === sp.project_id);
    return {
      ...profileMatch,
      start_date: formatResumeDate(profileMatch?.start_date),
      end_date: formatResumeDate(profileMatch?.end_date),
      bullets: sp.tailored_bullets,
      tech_stack_str: profileMatch?.tech_stack?.join(', ') || ''
    };
  }).filter(p => p.title);

  // Cross reference flat selected_skills with the structured full profile skills
  const detailedSkills = fullProfile.skills.filter(s => 
    generatedResumeData.selected_skills?.includes(s.name)
  );

  // Merge in added_skills (objects with { name, category } from skill gap advisor)
  const addedSkills = typeof generatedResumeData.added_skills === 'string'
    ? JSON.parse(generatedResumeData.added_skills || '[]')
    : (generatedResumeData.added_skills || []);

  for (const added of addedSkills) {
    if (!detailedSkills.some(s => s.name === added.name)) {
      detailedSkills.push({ name: added.name, category: added.category || 'Other' });
    }
  }

  const skillGroups = groupSkillsByCategory(detailedSkills);

  const formatEdu = fullProfile.education?.map(edu => ({
    ...edu,
    start_date: formatResumeDate(edu.start_date),
    end_date: formatResumeDate(edu.end_date)
  })) || [];

  const context = {
    NAME:           fullProfile.personal.full_name || fullProfile.personal.name || 'Anonymous User',
    EMAIL:          fullProfile.personal.email,
    PHONE:          fullProfile.personal.phone,
    LINKEDIN:       fullProfile.personal.linkedin,
    GITHUB:         fullProfile.personal.github,
    LEETCODE:       fullProfile.personal.leetcode, // Optional
    PORTFOLIO:      fullProfile.personal.portfolio, // Optional
    SUMMARY:        generatedResumeData.summary || '',
    
    EDUCATION:      formatEdu,
    EXPERIENCES:    enrichedExperiences,
    PROJECTS:       enrichedProjects,
    
    SKILLS:         skillGroups.length > 0,
    SKILL_GROUPS:   skillGroups,
    
    ACHIEVEMENTS:   (fullProfile.achievements || []).map(a => ({
      ...a,
      date: formatResumeDate(a.date)
    })),
    CERTIFICATIONS: (fullProfile.certifications || []).map(c => ({
      ...c,
      issued_at: formatResumeDate(c.issued_at),
      expires_at: formatResumeDate(c.expires_at)
    })),
  };

  const html = template(context);
  logger.info('[Template] Resume HTML built successfully');
  return html;
}

module.exports = { buildResumeHTML };

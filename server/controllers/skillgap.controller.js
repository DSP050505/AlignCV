// ─────────────────────────────────────────────────────────────────
// AlignCV — Skill Gap Controller (with Preview/Apply flow)
// ─────────────────────────────────────────────────────────────────

const nimService = require('../services/nimService');
const profileService = require('../services/profileService');
const templateService = require('../services/templateService');
const exportService = require('../services/exportService');
const jdQueries = require('../db/queries/jd.queries');
const resumesQueries = require('../db/queries/resumes.queries');
const z = require('zod');
const { generateSkillDiff } = require('../utils/diffUtils');

const analyseSchema = z.object({
  resume_id: z.string().uuid(),
  jd_analysis_id: z.string().uuid(),
});

const acceptSchema = z.object({
  resume_id: z.string().uuid(),
  skill: z.object({
    name: z.string(),
    category: z.string(),
  }),
});

exports.analyseGaps = async (req, res) => {
  const { resume_id, jd_analysis_id } = analyseSchema.parse(req.body);

  const jdAnalysis = await jdQueries.findById(jd_analysis_id);
  if (!jdAnalysis || jdAnalysis.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'JD analysis not found' });
  }

  const fullProfile = await profileService.getFullProfile(req.user.id);
  const userSkills = fullProfile.skills.map(s => ({ name: s.name, category: s.category }));

  const resume = await resumesQueries.findById(resume_id);
  if (resume?.added_skills) {
    const added = typeof resume.added_skills === 'string' ? JSON.parse(resume.added_skills) : resume.added_skills;
    userSkills.push(...added);
  }

  const result = await nimService.detectSkillGaps(userSkills, jdAnalysis);

  res.json({ success: true, data: result });
};

/**
 * Preview — returns what would change if this skill is added, without saving.
 */
exports.previewAccept = async (req, res) => {
  const { resume_id, skill } = acceptSchema.parse(req.body);

  const resume = await resumesQueries.findById(resume_id);
  if (!resume || resume.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  // Build old state
  const oldSkills = typeof resume.selected_skills === 'string'
    ? JSON.parse(resume.selected_skills || '[]')
    : (resume.selected_skills || []);
  const oldAdded = typeof resume.added_skills === 'string'
    ? JSON.parse(resume.added_skills || '[]')
    : (resume.added_skills || []);

  // Build new state
  const newSkills = [...oldSkills];
  const newAdded = [...oldAdded];

  if (!newAdded.some(s => s.name === skill.name)) {
    newAdded.push(skill);
  }
  if (!newSkills.includes(skill.name)) {
    newSkills.push(skill.name);
  }

  // Create a diff highlighted version
  const diffResume = JSON.parse(JSON.stringify(resume));
  diffResume.selected_skills = generateSkillDiff(oldSkills, newSkills);
  
  const diffAdded = newAdded.map(s => {
    if (s.name === skill.name) {
      return { ...s, name: `<span style="background-color:rgba(34,197,94,0.15);color:#166534;font-weight:bold;padding:0 2px;border-radius:2px;">${s.name}</span>` };
    }
    return s;
  });
  diffResume.added_skills = JSON.stringify(diffAdded);

  // Generate Temp PDF
  const fullProfile = await profileService.getFullProfile(req.user.id);
  const html_source = templateService.buildResumeHTML(fullProfile, diffResume);
  const temp_pdf_filename = `${resume_id}_preview.pdf`;
  const pdf_path = await exportService.htmlToPDF(html_source, temp_pdf_filename);

  res.json({
    success: true,
    data: {
      skill,
      old_skills: oldSkills,
      new_skills: newSkills,
      old_added: oldAdded,
      new_added: newAdded,
      pdf_url: `/outputs/${temp_pdf_filename}`,
    },
  });
};

/**
 * Apply — actually persists the skill and rebuilds PDF.
 */
exports.applyAccept = async (req, res) => {
  const { resume_id, skill } = acceptSchema.parse(req.body);

  const resume = await resumesQueries.findById(resume_id);
  if (!resume || resume.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  const currentAdded = typeof resume.added_skills === 'string'
    ? JSON.parse(resume.added_skills || '[]')
    : (resume.added_skills || []);

  if (!currentAdded.some(s => s.name === skill.name)) {
    currentAdded.push(skill);
  }

  const currentSelected = typeof resume.selected_skills === 'string'
    ? JSON.parse(resume.selected_skills || '[]')
    : (resume.selected_skills || []);

  if (!currentSelected.includes(skill.name)) {
    currentSelected.push(skill.name);
  }

  await resumesQueries.update(resume_id, {
    added_skills: currentAdded,
    selected_skills: currentSelected,
  });

  // Rebuild HTML & PDF
  const updatedResume = await resumesQueries.findById(resume_id);
  const fullProfile = await profileService.getFullProfile(req.user.id);
  const html_source = templateService.buildResumeHTML(fullProfile, updatedResume);
  const pdf_path = await exportService.htmlToPDF(html_source, `${resume_id}.pdf`);

  const finalRecord = await resumesQueries.update(resume_id, { html_source, pdf_path });

  res.json({ success: true, data: finalRecord });
};

// Legacy accept (backward compat)
exports.acceptSkill = async (req, res) => {
  return exports.applyAccept(req, res);
};

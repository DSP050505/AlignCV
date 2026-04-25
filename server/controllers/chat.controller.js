// ─────────────────────────────────────────────────────────────────
// AlignCV — Chat Controller (with Preview/Apply flow)
// ─────────────────────────────────────────────────────────────────

const nimService = require('../services/nimService');
const templateService = require('../services/templateService');
const exportService = require('../services/exportService');
const profileService = require('../services/profileService');
const resumesQueries = require('../db/queries/resumes.queries');
const z = require('zod');
const { generateDiffText, generateSkillDiff } = require('../utils/diffUtils');

const messageSchema = z.object({
  resume_id: z.string().uuid(),
  message: z.string().min(1),
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

/**
 * Preview — runs AI edit but does NOT persist. Returns old vs new data.
 */
exports.previewMessage = async (req, res) => {
  const { resume_id, message, conversation_history } = messageSchema.parse(req.body);

  const resume = await resumesQueries.findById(resume_id);
  if (!resume || resume.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  const resumeJson = {
    title: resume.title,
    selected_projects: typeof resume.selected_projects === 'string'
      ? JSON.parse(resume.selected_projects) : resume.selected_projects,
    selected_experiences: typeof resume.selected_experiences === 'string'
      ? JSON.parse(resume.selected_experiences) : resume.selected_experiences,
    selected_skills: typeof resume.selected_skills === 'string'
      ? JSON.parse(resume.selected_skills) : resume.selected_skills,
    added_skills: typeof resume.added_skills === 'string'
      ? JSON.parse(resume.added_skills || '[]') : (resume.added_skills || []),
  };

  const result = await nimService.chatEdit(resumeJson, message, conversation_history);
  const newResume = result.updated_resume || resumeJson;

  // Build a diffResume that has HTML highlighted values
  const diffResume = JSON.parse(JSON.stringify(newResume)); // Deep clone

  // Diff Projects
  diffResume.selected_projects = (newResume.selected_projects || []).map(newProj => {
    const oldProj = (resumeJson.selected_projects || []).find(p => p.project_id === newProj.project_id) || { tailored_bullets: [] };
    const diffBullets = Array.from({ length: Math.max(oldProj.tailored_bullets.length, newProj.tailored_bullets?.length || 0) }).map((_, i) => {
      return generateDiffText(oldProj.tailored_bullets[i] || '', newProj.tailored_bullets[i] || '');
    }).filter(b => b); // Remove empty strings
    return { ...newProj, tailored_bullets: diffBullets };
  });

  // Diff Experiences
  diffResume.selected_experiences = (newResume.selected_experiences || []).map(newExp => {
    const oldExp = (resumeJson.selected_experiences || []).find(e => e.experience_id === newExp.experience_id) || { tailored_bullets: [] };
    const diffBullets = Array.from({ length: Math.max(oldExp.tailored_bullets.length, newExp.tailored_bullets?.length || 0) }).map((_, i) => {
      return generateDiffText(oldExp.tailored_bullets[i] || '', newExp.tailored_bullets[i] || '');
    }).filter(b => b);
    return { ...newExp, tailored_bullets: diffBullets };
  });

  // Diff flat skills
  diffResume.selected_skills = generateSkillDiff(resumeJson.selected_skills || [], newResume.selected_skills || []);

  // Diff added skills mapping array
  const oldAddedNames = (resumeJson.added_skills || []).map(s => s.name);
  const newAddedNames = (newResume.added_skills || []).map(s => s.name);
  diffResume.added_skills = newResume.added_skills.map(s => {
    if (!oldAddedNames.includes(s.name)) {
      return { ...s, name: `<span style="background-color:rgba(34,197,94,0.15);color:#166534;font-weight:bold;padding:0 2px;border-radius:2px;">${s.name}</span>` };
    }
    return s;
  });

  // Build temp HTML and PDF
  const fullProfile = await profileService.getFullProfile(req.user.id);
  // Trick templateService to NOT re-parse the diff_skills by just passing stringified diff text
  diffResume.added_skills = JSON.stringify(diffResume.added_skills);
  
  const html_source = templateService.buildResumeHTML(fullProfile, diffResume);
  const temp_pdf_filename = `${resume_id}_preview.pdf`;
  const pdf_path = await exportService.htmlToPDF(html_source, temp_pdf_filename);

  res.json({
    success: true,
    data: {
      assistant_message: result.message || 'Changes proposed.',
      changes_made: result.changes_made || [],
      old_resume: resumeJson,
      new_resume: newResume,
      pdf_url: `/outputs/${temp_pdf_filename}`,
    },
  });
};

/**
 * Apply — receives the proposed new_resume data, persists, rebuilds PDF.
 */
exports.applyMessage = async (req, res) => {
  const { resume_id, new_resume } = z.object({
    resume_id: z.string().uuid(),
    new_resume: z.object({}).passthrough(),
  }).parse(req.body);

  const resume = await resumesQueries.findById(resume_id);
  if (!resume || resume.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  const resumeJson = {
    selected_projects: typeof resume.selected_projects === 'string'
      ? JSON.parse(resume.selected_projects) : resume.selected_projects,
    selected_experiences: typeof resume.selected_experiences === 'string'
      ? JSON.parse(resume.selected_experiences) : resume.selected_experiences,
    selected_skills: typeof resume.selected_skills === 'string'
      ? JSON.parse(resume.selected_skills) : resume.selected_skills,
    added_skills: typeof resume.added_skills === 'string'
      ? JSON.parse(resume.added_skills || '[]') : (resume.added_skills || []),
  };

  await resumesQueries.update(resume_id, {
    selected_projects: new_resume.selected_projects || resumeJson.selected_projects,
    selected_experiences: new_resume.selected_experiences || resumeJson.selected_experiences,
    selected_skills: new_resume.selected_skills || resumeJson.selected_skills,
    added_skills: new_resume.added_skills || resumeJson.added_skills,
  });

  // Rebuild HTML & PDF
  const updatedResume = await resumesQueries.findById(resume_id);
  const fullProfile = await profileService.getFullProfile(req.user.id);
  const html_source = templateService.buildResumeHTML(fullProfile, updatedResume);
  const pdf_path = await exportService.htmlToPDF(html_source, `${resume_id}.pdf`);
  await resumesQueries.update(resume_id, { html_source, pdf_path });

  const finalRecord = await resumesQueries.findById(resume_id);

  res.json({ success: true, data: finalRecord });
};

// Keep legacy endpoint for backward compat
exports.sendMessage = async (req, res) => {
  const { resume_id, message, conversation_history } = messageSchema.parse(req.body);

  const resume = await resumesQueries.findById(resume_id);
  if (!resume || resume.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  const resumeJson = {
    title: resume.title,
    selected_projects: typeof resume.selected_projects === 'string'
      ? JSON.parse(resume.selected_projects) : resume.selected_projects,
    selected_experiences: typeof resume.selected_experiences === 'string'
      ? JSON.parse(resume.selected_experiences) : resume.selected_experiences,
    selected_skills: typeof resume.selected_skills === 'string'
      ? JSON.parse(resume.selected_skills) : resume.selected_skills,
    added_skills: typeof resume.added_skills === 'string'
      ? JSON.parse(resume.added_skills || '[]') : (resume.added_skills || []),
  };

  const result = await nimService.chatEdit(resumeJson, message, conversation_history);

  let needs_recompile = false;

  if (result.updated_resume) {
    const updated = result.updated_resume;
    await resumesQueries.update(resume_id, {
      selected_projects: updated.selected_projects || resumeJson.selected_projects,
      selected_experiences: updated.selected_experiences || resumeJson.selected_experiences,
      selected_skills: updated.selected_skills || resumeJson.selected_skills,
      added_skills: updated.added_skills || resumeJson.added_skills,
    });

    const updatedResume = await resumesQueries.findById(resume_id);
    const fullProfile = await profileService.getFullProfile(req.user.id);
    const html_source = templateService.buildResumeHTML(fullProfile, updatedResume);
    const pdf_path = await exportService.htmlToPDF(html_source, `${resume_id}.pdf`);
    await resumesQueries.update(resume_id, { html_source, pdf_path });

    needs_recompile = true;
  }

  res.json({
    success: true,
    data: {
      assistant_message: result.message || 'Changes applied.',
      changes_made: result.changes_made || [],
      needs_recompile,
    },
  });
};

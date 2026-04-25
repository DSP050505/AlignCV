// ─────────────────────────────────────────────────────────────────
// AlignCV — Tailor Service
// Orchestrates the JD Analysis and Profile Ranking pipelines.
// ─────────────────────────────────────────────────────────────────

const nimService = require('./nimService');
const profileService = require('./profileService');
const jdQueries = require('../db/queries/jd.queries');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * 1. Orchestrates parsing the JD and saving the result.
 */
async function analyseJobDescription(userId, rawJD) {
  logger.info(`[Tailor] Starting JD analysis for user: ${userId}`);
  const analysis = await nimService.analyseJD(rawJD);
  
  if (!analysis || !analysis.role_title) {
    throw new AppError('Failed to parse a valid Job Description', 400);
  }

  // Save to db
  const record = await jdQueries.create(userId, { raw_jd: rawJD, ...analysis });
  logger.info(`[Tailor] JD analysis saved for user: ${userId}, ID: ${record.id}`);
  return record;
}

/**
 * 2. Runs the full ranking, selecting, and rewriting pipeline
 */
async function buildInitialTailoredResume(userId, jdAnalysisId) {
  logger.info(`[Tailor] Starting resume generation for user: ${userId}, JD: ${jdAnalysisId}`);

  // Fetch inputs
  const jdAnalysis = await jdQueries.findById(jdAnalysisId);
  if (!jdAnalysis || jdAnalysis.user_id !== userId) {
    throw new AppError('JD Analysis not found or unauthorized', 404);
  }
  const fullProfile = await profileService.getFullProfile(userId);

  // ── Step 1: Score & Rank (with graceful fallback) ──
  let rankResults = null;
  try {
    const slimProfile = {
      projects: fullProfile.projects.map(p => ({ id: p.id, title: p.title, description: p.description, tech: p.tech_stack })),
      experiences: fullProfile.experiences.map(e => ({ id: e.id, role: e.role, company: e.company, type: e.type, tech: e.tech_stack }))
    };
    rankResults = await nimService.scoreAndRankProfile(slimProfile, jdAnalysis);
  } catch (err) {
    logger.warn(`[Tailor] Scoring failed, using fallback: ${err.message}`);
  }

  // Determine selected items (fallback: pick first 2 of each)
  let selectedProjects, selectedExperiences;

  if (rankResults?.selected_projects?.length > 0) {
    const projIds = rankResults.selected_projects.map(r => r.id);
    selectedProjects = rankResults.selected_projects.map(rp => ({
      ...fullProfile.projects.find(p => p.id === rp.id),
      relevance_score: rp.relevance_score,
    })).filter(Boolean);
  }
  if (!selectedProjects || selectedProjects.length === 0) {
    // Fallback: use first 2 (or all if fewer)
    selectedProjects = fullProfile.projects.slice(0, 2).map(p => ({ ...p, relevance_score: 50 }));
  }

  if (rankResults?.selected_experiences?.length > 0) {
    const expIds = rankResults.selected_experiences.map(r => r.id);
    selectedExperiences = rankResults.selected_experiences.map(re => ({
      ...fullProfile.experiences.find(e => e.id === re.id),
      relevance_score: re.relevance_score,
    })).filter(Boolean);
  }
  if (!selectedExperiences || selectedExperiences.length === 0) {
    selectedExperiences = fullProfile.experiences.slice(0, 2).map(e => ({ ...e, relevance_score: 50 }));
  }

  // ── Step 2: Rewrite bullets (with graceful fallback) ──
  let rewrittenItems = [];
  try {
    const itemsToRewrite = [
      ...selectedProjects.map(p => ({ id: p.id, type: 'project', original_bullets: p.bullets, original_desc: p.description })),
      ...selectedExperiences.map(e => ({ id: e.id, type: 'experience', original_bullets: e.bullets, role: e.role }))
    ];
    if (itemsToRewrite.length > 0) {
      const rewriteResults = await nimService.rewriteBullets(itemsToRewrite, jdAnalysis);
      rewrittenItems = rewriteResults.rewritten || [];
    }
  } catch (err) {
    logger.warn(`[Tailor] Bullet rewriting failed, using originals: ${err.message}`);
  }

  // Format final payload
  const finalSelectedProjects = selectedProjects.map(sp => {
    const freshRewrite = rewrittenItems.find(rw => rw.id === sp.id);
    const originalBullets = Array.isArray(sp.bullets) ? sp.bullets : [];
    return {
      project_id: sp.id,
      relevance_score: sp.relevance_score || 50,
      tailored_bullets: freshRewrite ? freshRewrite.bullets : (originalBullets.length > 0 ? originalBullets : [sp.description || 'Project details']),
    };
  });

  const finalSelectedExperiences = selectedExperiences.map(se => {
    const freshRewrite = rewrittenItems.find(rw => rw.id === se.id);
    const originalBullets = Array.isArray(se.bullets) ? se.bullets : [];
    return {
      experience_id: se.id,
      relevance_score: se.relevance_score || 50,
      tailored_bullets: freshRewrite ? freshRewrite.bullets : (originalBullets.length > 0 ? originalBullets : [`${se.role} at ${se.company}`]),
    };
  });

  // ── Step 3: Generate Professional Summary (Foreword) ──
  let summary = "";
  try {
    const summaryResult = await nimService.generateSummary({
      personal: fullProfile.personal,
      experiences: selectedExperiences,
      projects: selectedProjects
    }, jdAnalysis);
    summary = summaryResult.summary;
  } catch (err) {
    logger.warn(`[Tailor] Summary generation failed: ${err.message}`);
  }

  return {
    jd_analysis_id: jdAnalysisId,
    title: `${jdAnalysis.role_title || 'Tailored Resume'} @ ${jdAnalysis.company_name || 'Company'}`,
    summary,
    selected_projects: finalSelectedProjects,
    selected_experiences: finalSelectedExperiences,
    selected_skills: fullProfile.skills.map(s => s.name),
  };
}

module.exports = {
  analyseJobDescription,
  buildInitialTailoredResume,
};

// ─────────────────────────────────────────────────────────────────
// AlignCV — ATS Controller
// ─────────────────────────────────────────────────────────────────

const nimService = require('../services/nimService');
const jdQueries = require('../db/queries/jd.queries');
const resumesQueries = require('../db/queries/resumes.queries');
const z = require('zod');

const scoreSchema = z.object({
  resume_id: z.string().uuid(),
});

exports.scoreResume = async (req, res) => {
  const { resume_id } = scoreSchema.parse(req.body);

  const resume = await resumesQueries.findById(resume_id);
  if (!resume || resume.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Resume not found' });
  }

  if (!resume.jd_analysis_id) {
    return res.status(400).json({ success: false, error: 'No JD analysis linked' });
  }

  const jdAnalysis = await jdQueries.findById(resume.jd_analysis_id);

  // Build a text representation of the resume for ATS analysis
  const resumeText = resume.html_source || JSON.stringify({
    selected_projects: resume.selected_projects,
    selected_experiences: resume.selected_experiences,
    selected_skills: resume.selected_skills,
    added_skills: resume.added_skills,
  });

  const atsResult = await nimService.scoreATS(resumeText, jdAnalysis);

  // Persist the score back to the resume record (ensure it's an integer!)
  await resumesQueries.update(resume_id, {
    ats_score: Math.round(atsResult.overall_score || 0),
    ats_breakdown: atsResult.breakdown,
    ats_missing_keywords: atsResult.missing_keywords,
  });

  res.json({ success: true, data: atsResult });
};

exports.checkQuickScore = async (req, res) => {
  if (!req.file || !req.body.jd) {
    return res.status(400).json({ success: false, error: 'File and JD are required' });
  }

  const { jd } = req.body;
  const uploadService = require('../services/uploadService');
  
  // 1. Extract text
  const resumeText = await uploadService.extractTextFromBuffer(req.file.buffer, req.file.mimetype);
  
  // 2. Analyse JD
  const jdAnalysis = await nimService.analyseJD(jd);
  
  // 3. Score
  const atsResult = await nimService.scoreATS(resumeText, jdAnalysis);
  
  res.json({ success: true, data: atsResult });
};

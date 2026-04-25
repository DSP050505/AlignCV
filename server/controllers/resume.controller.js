// ─────────────────────────────────────────────────────────────────
// AlignCV — Resume Controller & Routing
// ─────────────────────────────────────────────────────────────────

const z = require('zod');
const tailorService = require('../services/tailorService');
const templateService = require('../services/templateService');
const exportService = require('../services/exportService');
const profileService = require('../services/profileService');
const resumesQueries = require('../db/queries/resumes.queries');

const generateSchema = z.object({
  jd_analysis_id: z.string().uuid(),
});

exports.generateResume = async (req, res) => {
  const { jd_analysis_id } = generateSchema.parse(req.body);
  
  // 1. Orchestrate Tailor AI
  const tailoredData = await tailorService.buildInitialTailoredResume(req.user.id, jd_analysis_id);
  
  // 2. Save new version to database
  const record = await resumesQueries.create(req.user.id, tailoredData);

  // 3. Render HTML
  const fullProfile = await profileService.getFullProfile(req.user.id);
  const html_source = templateService.buildResumeHTML(fullProfile, record);

  // 4. Bake PDF via Puppeteer
  const pdf_filename = `${record.id}.pdf`;
  const pdf_path = await exportService.htmlToPDF(html_source, pdf_filename);

  // 5. Update Record
  const finalRecord = await resumesQueries.update(record.id, { html_source, pdf_path });

  res.status(201).json({ success: true, data: finalRecord });
};

exports.updateSource = async (req, res) => {
  const { html_source } = z.object({ html_source: z.string() }).parse(req.body);
  
  const record = await resumesQueries.findById(req.params.id);
  if (!record || record.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  // Rebake PDF
  const pdf_filename = `${record.id}.pdf`;
  const pdf_path = await exportService.htmlToPDF(html_source, pdf_filename);

  // Update DB
  const updatedRecord = await resumesQueries.update(record.id, { html_source, pdf_path });

  res.json({ success: true, data: updatedRecord });
};

exports.getResume = async (req, res) => {
  const result = await resumesQueries.findById(req.params.id);
  if (!result || result.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.json({ success: true, data: result });
};

exports.getAllResumes = async (req, res) => {
  const results = await resumesQueries.findByUserId(req.user.id);
  res.json({ success: true, data: results });
};

exports.deleteResume = async (req, res) => {
  const result = await resumesQueries.findById(req.params.id);
  if (!result || result.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  await resumesQueries.remove(req.params.id);
  res.json({ success: true, data: { message: 'Deleted' } });
};

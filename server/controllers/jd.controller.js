// ─────────────────────────────────────────────────────────────────
// AlignCV — JD Controller & Routing
// ─────────────────────────────────────────────────────────────────

const z = require('zod');
const tailorService = require('../services/tailorService');
const jdQueries = require('../db/queries/jd.queries');

const analyseSchema = z.object({
  raw_jd: z.string().min(20, "Job description is too short"),
});

exports.analyseJD = async (req, res) => {
  const { raw_jd } = analyseSchema.parse(req.body);
  const result = await tailorService.analyseJobDescription(req.user.id, raw_jd);
  res.status(201).json({ success: true, data: result });
};

exports.getJD = async (req, res) => {
  const result = await jdQueries.findById(req.params.id);
  if (!result || result.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.json({ success: true, data: result });
};

exports.getAllJDs = async (req, res) => {
  const results = await jdQueries.findByUserId(req.user.id);
  res.json({ success: true, data: results });
};

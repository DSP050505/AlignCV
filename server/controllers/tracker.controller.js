const trackerQueries = require('../db/queries/tracker.queries');
const z = require('zod');

exports.getAll = async (req, res) => {
  try {
    const apps = await trackerQueries.findByUserId(req.user.id);
    res.json({ success: true, data: apps });
  } catch (err) {
    console.error('[Tracker] Error fetching apps:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch tracked applications' });
  }
};

const createSchema = z.object({
  company_name: z.string().min(1),
  job_id: z.string().optional(),
  resume_id: z.string().uuid().optional(),
});

exports.create = async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const newApp = await trackerQueries.create({
      user_id: req.user.id,
      company_name: data.company_name,
      job_id: data.job_id || null,
      resume_id: data.resume_id || null
    });
    
    // Fetch it back to get the joined resume title
    const apps = await trackerQueries.findByUserId(req.user.id);
    const populatedApp = apps.find(a => a.id === newApp.id) || newApp;
    
    res.json({ success: true, data: populatedApp });
  } catch (err) {
    console.error('[Tracker] Error creating app:', err);
    res.status(400).json({ success: false, error: 'Validation failed' });
  }
};

exports.delete = async (req, res) => {
  try {
    await trackerQueries.delete(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Tracker] Error deleting app:', err);
    res.status(500).json({ success: false, error: 'Failed to delete' });
  }
};

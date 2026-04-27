// ─────────────────────────────────────────────────────────────────
// AlignCV — Referral Controller
// Handles all ReferralRadar endpoints.
// ─────────────────────────────────────────────────────────────────

const z = require('zod');
const logger = require('../utils/logger');
const referralService = require('../services/referralService');
const referralQueries = require('../db/queries/referral.queries');
const profileService = require('../services/profileService');
const jdQueries = require('../db/queries/jd.queries');

// ── POST /api/referral/fetch-job ─────────────────────────────────
exports.fetchJob = async (req, res, next) => {
  try {
    const { url, manual_jd } = req.body;

  let rawData = null;

  if (url) {
    rawData = await referralService.fetchJobFromURL(url);
  }

  if (!rawData && !manual_jd) {
    return res.status(200).json({
      success: false,
      error: 'fetch_failed',
      message: 'Could not fetch this URL. Try pasting the job description manually.',
    });
  }

  const textToParse = rawData?.description || manual_jd || '';
  const sourceUrl = url || '';

  // Use AI to summarize and extract structured data
  const jdSummary = await referralService.summarizeJD(textToParse, sourceUrl);

  // Override with fetched data if available
  const company_name = (rawData?.company || jdSummary.company_name || 'Unknown Company').trim();
  const role_title = (rawData?.title || jdSummary.role_title || 'Unknown Role').trim();
  const location = rawData?.location || jdSummary.location || '';
  const domain = rawData?.domain || '';

  logger.debug(`[ReferralRadar] Saving JD for user ${req.user.id} at ${company_name}`);

  // Save to jd_analyses for reuse
  let jdRecord;
  try {
    jdRecord = await jdQueries.create(req.user.id, {
      raw_jd: textToParse.substring(0, 10000),
      role_title,
      company_name,
      required_skills: jdSummary.tech_stack || [],
      preferred_skills: jdSummary.key_requirements || [],
      keywords: [],
      seniority: jdSummary.seniority || '',
      domain: domain || '',
    });
  } catch (dbErr) {
    logger.error(`[ReferralRadar] DB insert failed: ${dbErr.message}`, { stack: dbErr.stack });
    throw dbErr; // Re-throw to be caught by global try/catch
  }

  const safeCompanyName = (company_name || 'unknown').toLowerCase().replace(/\s+/g, '');
  const logo_url = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : `https://www.google.com/s2/favicons?domain=${safeCompanyName}.com&sz=64`;

  logger.info(`[ReferralRadar] Job details processed: ${role_title} at ${company_name}`);

  res.json({
    success: true,
    data: {
      job_id: jdRecord.id,
      company_name,
      role_title,
      location,
      summary: jdSummary.summary || '',
      tech_stack: jdSummary.tech_stack || [],
      key_requirements: jdSummary.key_requirements || [],
      seniority: jdSummary.seniority || '',
      industry: jdSummary.industry || '',
      logo_url,
      domain,
      job_url: sourceUrl,
    },
  });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/referral/match-connections ──────────────────────────
exports.matchConnections = async (req, res, next) => {
  try {
    const { company_name, job_id, job_url, resume_id, connections_data } = req.body;

    if (!req.file && !connections_data) {
      return res.status(400).json({ success: false, error: 'No CSV file or extension data provided' });
    }

    if (!company_name) {
      return res.status(400).json({ success: false, error: 'company_name is required' });
    }

    let matched = [];

    if (connections_data) {
      // Use data straight from Chrome Extension
      matched = JSON.parse(connections_data);
    } else {
      // Parse CSV from buffer
      const connections = referralService.parseLinkedInCSV(req.file.buffer);
      // Match against company
      matched = referralService.matchConnections(connections, company_name);
    }

    // Apply AI-based negative filtering to ensure accurate current company alignment
    matched = await referralService.filterConnectionsWithAI(matched, company_name);

  if (matched.length === 0) {
    logger.info(`[ReferralRadar] No connections found at ${company_name}`);
    return res.json({
      success: true,
      data: { session_id: null, connections: [], total_found: 0 },
    });
  }

  // Get user profile for AI message generation
  let userProfile = {};
  try {
    userProfile = await profileService.getFullProfile(req.user.id);
  } catch { /* continue without profile */ }

  // Get JD info for message generation
  let jobInfo = { role_title: '', company_name, tech_stack: [], key_requirements: [], job_url: job_url || '' };
  if (job_id) {
    try {
      const jd = await jdQueries.findById(job_id);
      if (jd?.analysis) {
        const parsed = typeof jd.analysis === 'string' ? JSON.parse(jd.analysis) : jd.analysis;
        jobInfo = { ...parsed, company_name: jd.company_name || company_name, role_title: jd.role_title || '', job_url: job_url || '' };
      }
    } catch { /* use defaults */ }
  }

  // Generate referral messages in parallel
  matched = await referralService.generateAllMessages(matched, jobInfo, userProfile);

  // Save session
  const session = await referralQueries.createSession({
    user_id: req.user.id,
    job_id: job_id || null,
    resume_id: resume_id || null,
    company_name,
    role_title: jobInfo.role_title || '',
    connections_found: matched.length,
    connections_data: JSON.stringify(matched),
  });

  logger.info(`[ReferralRadar] Session saved: ${session.id}`);
  logger.info(`[ReferralRadar] CSV parsed and discarded — no raw data stored.`);

  res.json({
    success: true,
    data: {
      session_id: session.id,
      connections: matched,
      total_found: matched.length,
    },
  });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/referral/find-public-employees ─────────────────────
exports.findPublicEmployees = async (req, res, next) => {
  try {
    const { company_name, role_title, job_id, job_url, resume_id } = req.body;
  if (!company_name) {
    return res.status(400).json({ success: false, error: 'company_name is required' });
  }

  let profiles = await referralService.generateColdProfiles(company_name, role_title || '');

  // Get user profile and job info for message generation
  let userProfile = {};
  try { userProfile = await profileService.getFullProfile(req.user.id); } catch { /* continue */ }

  let jobInfo = { role_title: role_title || '', company_name, tech_stack: [], key_requirements: [], job_url: job_url || '' };
  if (job_id) {
    try {
      const jd = await jdQueries.findById(job_id);
      if (jd?.analysis) {
        const parsed = typeof jd.analysis === 'string' ? JSON.parse(jd.analysis) : jd.analysis;
        jobInfo = { ...parsed, company_name: jd.company_name || company_name, role_title: jd.role_title || role_title || '', job_url: job_url || '' };
      }
    } catch { /* use defaults */ }
  }

  profiles = await referralService.generateAllMessages(profiles, jobInfo, userProfile);

  // Save session
  const session = await referralQueries.createSession({
    user_id: req.user.id,
    job_id: job_id || null,
    resume_id: resume_id || null,
    company_name,
    role_title: jobInfo.role_title || role_title || '',
    connections_found: profiles.length,
    connections_data: JSON.stringify(profiles),
  });

  res.json({
    success: true,
    data: {
      session_id: session.id,
      connections: profiles,
      total_found: profiles.length,
      is_real_data: false,
    },
  });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/referral/send-messages ─────────────────────────────
exports.sendMessages = async (req, res, next) => {
  try {
    const { session_id, messages } = req.body;

  if (!session_id || !messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, error: 'session_id and messages array required' });
  }

  // Get session for context
  const session = await referralQueries.getSession(session_id);
  if (!session || session.user_id !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  const outreachRows = messages.map(m => ({
    user_id: req.user.id,
    session_id,
    person_name: m.person_name,
    person_linkedin_url: m.person_linkedin_url || '',
    person_role: m.person_role || '',
    company_name: session.company_name,
    message_text: m.message_text,
    resume_id: m.resume_id || session.resume_id,
    connection_type: m.connection_type || '1st',
    status: 'sent',
    sent_at: new Date(),
  }));

  const records = await referralQueries.createOutreachBatch(outreachRows);

  for (const r of records) {
    logger.info(`[ReferralRadar] Message dispatched to ${r.person_name} at ${r.company_name}`);
  }

  res.json({
    success: true,
    data: { sent_count: records.length, session_id },
  });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/referral/log ────────────────────────────────────────
exports.getLog = async (req, res, next) => {
  try {
    const records = await referralQueries.getOutreachByUser(req.user.id);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/referral/outreach/:id ───────────────────────────────
exports.updateOutreach = async (req, res, next) => {
  try {
    const { id } = req.params;
  const updates = {};

  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.status === 'responded') updates.responded_at = new Date();
  if (req.body.status === 'sent') updates.sent_at = new Date();

  const record = await referralQueries.updateOutreachStatus(id, req.user.id, updates);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

    logger.info(`[ReferralRadar] Referral log updated: ${record.person_name} → ${record.status}`);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

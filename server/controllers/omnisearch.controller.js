const omniSearchService = require('../services/omniSearchService');
const { AuthError } = require('../utils/errors');
const crypto = require('crypto');
const logger = require('../utils/logger');
// We need to fetch the resume to extract params.
const db = require('../db/knex');

exports.extractParams = async (req, res) => {
  const { resumeId } = req.body;
  if (!resumeId) return res.status(400).json({ message: 'Resume ID required' });

  // 1. Fetch resume from DB
  const resume = await db('resumes').where({ id: resumeId, user_id: req.user.id }).first();
  if (!resume) return res.status(404).json({ message: 'Resume not found' });

  // Combine the actual available fields from the resume schema
  const contentToAnalyze = {
    title: resume.title,
    summary: resume.summary,
    skills: resume.selected_skills || resume.added_skills,
    experience: resume.selected_experiences,
    projects: resume.selected_projects
  };
  
  const rawText = JSON.stringify(contentToAnalyze);
  if (!rawText || rawText === '{}') return res.status(400).json({ message: 'Resume has no text content' });

  try {
    const params = await omniSearchService.extractParamsFromResume(JSON.stringify(rawText));
    res.json({ params });
  } catch (error) {
    logger.error(`[OmniSearch] Extract Controller Error: ${error.stack}`);
    res.status(500).json({ message: 'Failed to extract parameters from resume.' });
  }
};

exports.startSearch = async (req, res) => {
  const { title, skills, experience } = req.body;
  if (!title) return res.status(400).json({ message: 'Job title is required for OmniSearch.' });

  // Generate a unique Job ID for this scrape session
  const searchJobId = crypto.randomUUID();

  // Kick off background task
  omniSearchService.startLiveSearch({
    jobId: searchJobId,
    title,
    skills,
    experience
  });

  res.json({ searchJobId, message: 'OmniSearch protocol initiated.' });
};

exports.getSearchStatus = async (req, res) => {
  const { jobId } = req.params;
  const status = omniSearchService.getSearchStatus(jobId);
  
  if (!status) {
    return res.status(404).json({ message: 'Search job not found or expired.' });
  }

  res.json({
    status: status.status,
    progress: status.progress,
    logs: status.logs,
    results: status.results
  });
};

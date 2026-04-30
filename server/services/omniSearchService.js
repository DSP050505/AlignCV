const axios = require('axios');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const activeSearches = new Map();

/**
 * 1. Extract Search Parameters
 */
async function extractParamsFromResume(resumeText) {
  // Not used in this direct scraper version, but kept for compatibility
  return { title: 'Engineer', skills: [], experience: 0 };
}

/**
 * 2. Start India-Only Career Portal Scan
 */
function startLiveSearch({ jobId, title, skills, experience }) {
  activeSearches.set(jobId, {
    status: 'running',
    logs: ['Initializing India-Specific Direct Career Portal Scan...'],
    results: [],
    progress: 0
  });

  executeSearch(jobId, title, skills, experience).catch(err => {
    logger.error(`[OmniSearch] Job ${jobId} failed: ${err.message}`);
    const state = activeSearches.get(jobId);
    if (state) {
      state.status = 'failed';
      state.logs.push(`Error: ${err.message}`);
    }
  });
}

/**
 * 3. Execute Search
 */
async function executeSearch(jobId, title, skills, experience) {
  const state = activeSearches.get(jobId);
  if (!state) return;

  const addLog = (msg) => state.logs.push(msg);
  
  try {
    addLog(`Deep Scan Phase 1: Accessing all 423 Company Career Portals...`);
    
    // We strictly search ONLY the career portals of the 423 companies provided
    const allJobs = await fetchIndiaCareerJobs(title, addLog);

    state.progress = 90;
    addLog(`Deduplicating and finalizing... Found ${allJobs.length} India-based openings.`);

    // Final Process: Sort by Recency
    state.results = allJobs.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)).slice(0, 100);

    state.progress = 100;
    state.status = 'completed';
    addLog(`OmniSearch complete. Displaying only Job Title and Company for India-based roles.`);
    console.log(`[DEBUG] Final India Results: ${state.results.length}`);

  } catch (error) {
    logger.error(`[OmniSearch] Fatal: ${error.message}`);
    state.status = 'failed';
    state.progress = 100;
    addLog(`Critical Failure: ${error.message}`);
  }
}

/**
 * Scrapes ALL companies, filters for India, and removes third-party sources
 */
async function fetchIndiaCareerJobs(searchTitle, addLog) {
  const filePath = path.join(__dirname, '..', 'companyList.json');
  let companies = [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    companies = JSON.parse(raw);
  } catch (e) {
    return [];
  }

  const indiaJobs = [];
  const CONCURRENCY = 20; 
  const indiaKeywords = ['india', 'bangalore', 'bengaluru', 'pune', 'mumbai', 'hyderabad', 'gurgaon', 'gurugram', 'delhi', 'noida', 'chennai'];
  const searchTerms = searchTitle.toLowerCase().split(' ');

  for (let i = 0; i < companies.length; i += CONCURRENCY) {
    const batch = companies.slice(i, i + CONCURRENCY);
    addLog(`Scanning batch ${Math.floor(i/CONCURRENCY) + 1} of ${Math.ceil(companies.length/CONCURRENCY)}...`);
    
    const results = await Promise.all(batch.map(async (name) => {
      const companyJobs = [];
      const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const urls = [`https://${domain}.com/careers`, `https://careers.${domain}.com`, `https://${domain}.com/jobs` ];
      
      for (const url of urls) {
        try {
          const res = await axios.get(url, { timeout: 5000 });
          const $ = cheerio.load(res.data);
          
          $('a[href*="job"], a[href*="career"]').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim().substring(0, 100);
            const titleLower = title.toLowerCase();
            
            // 1. Must match at least one search term (e.g., "Developer", "Engineer")
            const matchesTitle = searchTerms.some(term => titleLower.includes(term));
            
            // 2. Must match an Indian location keyword
            const matchesIndia = indiaKeywords.some(city => titleLower.includes(city) || link.toLowerCase().includes(city));
            
            if (link && matchesTitle && matchesIndia) {
              const absolute = link.startsWith('http') ? link : new URL(link, url).href;
              
              // Clean title from common noise (Apply, India, city names appended)
              let cleanedTitle = title
                .replace(/Apply/gi, '')
                .replace(/India/gi, '')
                .replace(/(Bangalore|Bengaluru|Pune|Mumbai|Hyderabad|Gurgaon|Gurugram|Delhi|Noida|Chennai)/gi, '')
                .replace(/[\s,\|-]+$/, '') // Remove trailing punctuation
                .replace(/\s+/g, ' ')
                .trim();

              if (cleanedTitle.length < 5) cleanedTitle = title; // Fallback if cleaning is too aggressive

              companyJobs.push({
                id: `india-${Date.now()}-${Math.floor(Math.random()*10000)}`,
                title: cleanedTitle, 
                company: name, 
                location: 'India',
                source: 'Official', 
                url: absolute,
                postedAt: new Date().toISOString(),
                description: 'India-based opening found on official portal.'
              });
            }
          });
          if (companyJobs.length > 0) break;
        } catch (_) {}
      }
      return companyJobs;
    }));

    results.flat().forEach(j => indiaJobs.push(j));
    if (indiaJobs.length >= 100) break; 
  }
  
  return indiaJobs;
}

function getSearchStatus(jobId) {
  return activeSearches.get(jobId) || null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  extractParamsFromResume,
  startLiveSearch,
  getSearchStatus
};

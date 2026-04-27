// ─────────────────────────────────────────────────────────────────
// AlignCV — Referral Service
// CSV parsing, job URL fetching, connection matching, message gen.
// ─────────────────────────────────────────────────────────────────

const { parse } = require('csv-parse/sync');
const cheerio = require('cheerio');
const { v4: uuid } = require('uuid');
const logger = require('../utils/logger');
const { routedCall } = require('./aiRouter');
const profileService = require('./profileService');

/**
 * Parse a LinkedIn connections CSV buffer.
 * LinkedIn CSVs have 3 junk lines before the real header row.
 */
function parseLinkedInCSV(buffer) {
  const raw = buffer.toString('utf-8');

  // LinkedIn prepends notes — find the real header line
  const lines = raw.split('\n');
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes('First Name') && lines[i].includes('Last Name')) {
      headerIdx = i;
      break;
    }
  }

  const csvContent = lines.slice(headerIdx).join('\n');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  logger.info(`[ReferralRadar] CSV parsed: ${records.length} connections found`);
  return records;
}

/**
 * Match connections against a target company name.
 */
function matchConnections(connections, companyName) {
  const target = companyName.toLowerCase().trim();

  // Build match variants (e.g. "Google" matches "Google LLC", "Google Inc")
  const variants = [target];
  // Strip common suffixes for broader match
  for (const suffix of [' llc', ' inc', ' corp', ' ltd', ' limited', ' pvt', ' gmbh']) {
    if (target.endsWith(suffix)) {
      variants.push(target.replace(suffix, '').trim());
    }
  }

  const matched = connections.filter(row => {
    const company = (row['Company'] || '').toLowerCase().trim();
    if (!company) return false;
    return variants.some(v => company.includes(v) || v.includes(company));
  });

  // Build person objects
  const people = matched.map(row => {
    const first = (row['First Name'] || '').trim();
    const last = (row['Last Name'] || '').trim();
    return {
      id: uuid(),
      first_name: first,
      last_name: last,
      full_name: `${first} ${last}`.trim(),
      linkedin_url: (row['URL'] || '').trim(),
      email: (row['Email Address'] || '').trim(),
      company: (row['Company'] || '').trim(),
      position: (row['Position'] || '').trim(),
      connected_on: (row['Connected On'] || '').trim(),
      connection_type: '1st',
      initials: `${first[0] || ''}${last[0] || ''}`.toUpperCase(),
    };
  });

  // Sort: tech/engineering roles first
  const techKeywords = ['engineer', 'developer', 'architect', 'sde', 'swe', 'devops', 'data', 'ml', 'ai', 'tech', 'software', 'platform', 'infrastructure', 'backend', 'frontend', 'fullstack'];
  people.sort((a, b) => {
    const aIsTech = techKeywords.some(k => a.position.toLowerCase().includes(k));
    const bIsTech = techKeywords.some(k => b.position.toLowerCase().includes(k));
    if (aIsTech && !bIsTech) return -1;
    if (!aIsTech && bIsTech) return 1;
    return 0;
  });

  // Limit to 20
  const result = people.slice(0, 20);
  logger.info(`[ReferralRadar] Matched ${result.length} connections at ${companyName}`);
  return result;
}

/**
 * Fetch and parse a job URL to extract details.
 */
async function fetchJobFromURL(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);

    let title = '', company = '', description = '', location = '';

    // Try JSON-LD first (most job sites use it)
    const jsonLd = $('script[type="application/ld+json"]').toArray();
    for (const el of jsonLd) {
      try {
        const data = JSON.parse($(el).html());
        const job = data['@type'] === 'JobPosting' ? data :
          (Array.isArray(data['@graph']) ? data['@graph'].find(d => d['@type'] === 'JobPosting') : null);
        if (job) {
          title = job.title || '';
          company = (typeof job.hiringOrganization === 'object') ? job.hiringOrganization.name || '' : '';
          description = job.description || '';
          location = (typeof job.jobLocation === 'object') ?
            (job.jobLocation.address?.addressLocality || '') : '';
          break;
        }
      } catch { /* skip bad JSON */ }
    }

    // Fallback: LinkedIn-specific selectors
    if (!title) {
      title = $('h1.topcard__title, h1.top-card-layout__title, h2.top-card-layout__title').first().text().trim() ||
              $('h1').first().text().trim() ||
              $('title').text().trim();
    }
    if (!company) {
      company = $('a.topcard__org-name-link, a.topcard__flavor, span.topcard__flavor').first().text().trim() ||
                $('meta[property="og:title"]').attr('content')?.split(' at ')?.[1] || '';
    }
    if (!description) {
      description = $('div.description__text, div.show-more-less-html__markup, section.description').first().text().trim() ||
                    $('meta[name="description"]').attr('content') || '';
    }
    if (!location) {
      location = $('span.topcard__flavor--bullet, span.topcard__flavor:last-of-type').first().text().trim() || '';
    }

    // Extract company domain from URL or company name
    let domain = '';
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('linkedin') && !urlObj.hostname.includes('indeed')) {
        domain = urlObj.hostname.replace('www.', '');
      }
    } catch { /* ignore */ }

    return { title, company, description: description.substring(0, 3000), location, domain };
  } catch (err) {
    logger.warn(`[ReferralRadar] JD parse failed — falling back to manual: ${err.message}`);
    return null;
  }
}

/**
 * Use AI to summarize a JD and extract structured data.
 */
async function summarizeJD(rawText, url) {
  return routedCall({
    label: 'referral_summarize_jd',
    expectJson: true,
    systemPrompt: `
You are a job description summarizer. Given raw job posting text, extract key information.
Return ONLY valid JSON:
{
  "role_title": "",
  "company_name": "",
  "location": "",
  "summary": "2-3 line summary of what the role does",
  "tech_stack": [],
  "seniority": "fresher|junior|mid|senior",
  "industry": "",
  "key_requirements": []
}
Keep summary under 50 words. tech_stack and key_requirements as arrays of short strings.
`.trim(),
    userContent: `URL: ${url}\n\nJob Posting Text:\n${rawText.substring(0, 4000)}`,
  });
}

/**
 * Generate a personalized referral message for one person.
 */
async function generateReferralMessage(params) {
  return routedCall({
    label: 'generate_referral_message',
    expectJson: true,
    systemPrompt: `
You are an expert at writing warm, professional referral request messages that feel human and personal — not templated.
Write a LinkedIn message from a job seeker to a connection asking for an internal referral.

Rules:
- Format the message neatly using clear paragraph breaks (use \n\n for spacing).
- Start with the person's first name: "Hi [name],"
- Paragraph 1: Acknowledge their role at the company and mention the specific role you are applying for. Include the job link if provided.
- Paragraph 2: Explain why you are a strong fit. You MUST explicitly mention your educational background and your top skills, tying them directly to why you are relevant for this specific role.
- Paragraph 3: A clear, low-friction referral ask — not demanding, just a genuine request, and mention that you have attached your resume for reference.
- Close warmly with "Best regards," followed by the job seeker's name on the next line.
- Sound like a real human wrote it, NOT AI. No buzzwords, no "I hope this message finds you well". Be specific, warm, and professional.

Return ONLY valid JSON:
{
  "message": "the complete message text with \\n\\n for paragraph breaks",
  "subject_line": "short subject if used as email"
}
`.trim(),
    userContent: JSON.stringify({
      recipient_name: params.recipientFirstName,
      recipient_role: params.recipientRole,
      company_name: params.companyName,
      role_applying_for: params.roleTitle,
      job_link: params.jobLink,
      applicant_name: params.applicantName,
      applicant_education: params.educationalBg,
      applicant_top_skills: params.topSkills,
      applicant_strongest_achievement: params.strongestAchievement,
      applicant_relevant_project: params.relevantProject,
      jd_key_requirements: params.jdKeyRequirements,
    }),
  });
}

/**
 * Use AI to verify if the scraped connections actually work at the target company.
 */
async function filterConnectionsWithAI(connections, companyName) {
  if (!connections || connections.length === 0) return [];
  
  // Create a minimal list for the AI to analyze to save tokens
  const listToAnalyze = connections.map(c => ({
    id: c.id,
    name: c.full_name,
    headline: c.position
  }));

  try {
    const aiResponse = await routedCall({
      label: 'referral_filter_connections',
      expectJson: true,
      systemPrompt: `
You are a strict data validation assistant. You will be given a target company and a list of LinkedIn profiles.
Your job is to determine if each person CURRENTLY works at the target company based ONLY on their headline.

Rules:
1. If their headline explicitly mentions working at a DIFFERENT company (e.g., Target: Micron. Headline: "SDE at AMD" or "Amazon | Software Engineer"), they DO NOT work at the target company. Drop them.
2. If their headline contains "Ex-" or "Past:" followed by the target company, drop them.
3. If their headline contains the target company, KEEP them.
4. If their headline is ambiguous (e.g. just "Software Engineer 2" with no company mentioned), you MUST KEEP THEM, because they were returned in a strict search for that company.
5. If in doubt, keep them, UNLESS they explicitly mention another major company.

Return ONLY a valid JSON array of strings containing the 'id's of the people who passed the filter.
Format: ["id1", "id2", ...]
`.trim(),
      userContent: `Target Company: ${companyName}\n\nProfiles:\n${JSON.stringify(listToAnalyze, null, 2)}`,
    });

    if (Array.isArray(aiResponse)) {
      const validIds = new Set(aiResponse);
      const filtered = connections.filter(c => validIds.has(c.id));
      logger.info(`[ReferralRadar] AI filtering removed ${connections.length - filtered.length} bad profiles.`);
      return filtered;
    }
  } catch (err) {
    logger.error(`[ReferralRadar] AI filtering failed: ${err.message}. Returning original list.`);
  }
  
  return connections;
}

/**
 * Generate N referral messages in parallel.
 */
async function generateAllMessages(connections, jobInfo, userProfile) {
  const applicantName = userProfile?.personal?.full_name || userProfile?.name || 'there';
  const topSkills = (userProfile?.skills || []).slice(0, 5).map(s => s.name || s);
  const strongestAchievement = (userProfile?.achievements || [])[0]?.title || '';
  const relevantProject = (userProfile?.projects || [])[0]?.title || '';
  let educationalBg = '';
  if (userProfile?.education && userProfile.education.length > 0) {
    educationalBg = `${userProfile.education[0].degree} from ${userProfile.education[0].institution}`;
  }
  const jdKeyReqs = (jobInfo.key_requirements || jobInfo.tech_stack || []).slice(0, 3);
  const jobLink = jobInfo.job_url || '';

  const startTime = Date.now();
  logger.info(`[ReferralRadar] Generating ${connections.length} referral messages via NIM`);

  const promises = connections.map(person =>
    generateReferralMessage({
      recipientFirstName: person.first_name,
      recipientRole: person.position,
      companyName: jobInfo.company_name || person.company,
      roleTitle: jobInfo.role_title,
      applicantName,
      topSkills,
      strongestAchievement,
      relevantProject,
      educationalBg,
      jdKeyRequirements: jdKeyReqs,
      jobLink,
    }).catch(err => {
      logger.warn(`[ReferralRadar] Message gen failed for ${person.full_name}: ${err.message}`);
      return {
        message: `Hi ${person.first_name},\n\nI noticed you're at ${person.company} — I'm very interested in the ${jobInfo.role_title} role there. Would you be open to a quick chat or referring me internally? I've attached my resume for your reference.\n\nThanks so much!\n${applicantName}`,
        subject_line: `Referral request for ${jobInfo.role_title}`,
      };
    })
  );

  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;
  logger.info(`[ReferralRadar] Messages generated in ${elapsed}ms`);

  return connections.map((person, i) => ({
    ...person,
    message: results[i]?.message || '',
    subject_line: results[i]?.subject_line || '',
  }));
}

/**
 * Generate suggested cold outreach profiles using AI.
 */
async function generateColdProfiles(companyName, roleTitle) {
  const result = await routedCall({
    label: 'referral_cold_profiles',
    expectJson: true,
    systemPrompt: `
You are helping a job seeker find people to cold-outreach at a company.
Generate 10 realistic but fictional employee profiles who would be good referral targets.
These should be people in engineering/tech roles relevant to the job.

Return ONLY valid JSON:
{
  "profiles": [
    {
      "first_name": "",
      "last_name": "",
      "position": "",
      "seniority": "senior|mid|lead|manager"
    }
  ]
}
Generate diverse names. Positions should be realistic for the company and relevant to the role.
`.trim(),
    userContent: JSON.stringify({ company_name: companyName, role_title: roleTitle }),
  });

  const profiles = (result?.profiles || []).slice(0, 15).map(p => ({
    id: uuid(),
    first_name: p.first_name,
    last_name: p.last_name,
    full_name: `${p.first_name} ${p.last_name}`,
    linkedin_url: '',
    email: '',
    company: companyName,
    position: p.position,
    connected_on: '',
    connection_type: 'cold',
    initials: `${(p.first_name || '')[0] || ''}${(p.last_name || '')[0] || ''}`.toUpperCase(),
  }));

  return profiles;
}

module.exports = {
  parseLinkedInCSV,
  matchConnections,
  filterConnectionsWithAI,
  fetchJobFromURL,
  summarizeJD,
  generateReferralMessage,
  generateAllMessages,
  generateColdProfiles,
};

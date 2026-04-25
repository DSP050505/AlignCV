// ─────────────────────────────────────────────────────────────────
// AlignCV — AI Integration Service (Multi-Provider via aiRouter)
// All AI prompts are defined here. Execution is routed through
// aiRouter.js which handles key rotation & provider fallback.
// ─────────────────────────────────────────────────────────────────

const { routedCall } = require('./aiRouter');

/**
 * Prompt 1 — Parse Resume PDF
 */
async function parseResumePDF(rawText) {
  return routedCall({
    label: 'parse_resume_pdf',
    expectJson: true,
    systemPrompt: `
You are a career profile parser. Extract structured data from the provided raw resume text.
Always return ONLY valid JSON matching this exact structure:
{
  "personal": { "full_name": "", "headline": "", "email": "", "phone": "", "github": "", "linkedin": "", "leetcode": "", "portfolio": "" },
  "education": [{ "institution": "", "degree": "", "field": "", "start_date": "", "end_date": "", "cgpa": null, "location": "" }],
  "experiences": [{ "company": "", "role": "", "type": "job", "location": "", "start_date": "", "end_date": "", "is_current": false, "bullets": [], "tech_stack": [] }],
  "projects": [{ "title": "", "description": "", "bullets": [], "tech_stack": [], "start_date": "", "end_date": "", "repo_url": "", "live_url": "" }],
  "skills": [{ "category": "Languages", "name": "" }],
  "achievements": [{ "title": "", "description": "", "date": "" }],
  "certifications": [{ "name": "", "issuer": "", "issued_at": "", "url": "" }]
}
Constraints:
- "personal.full_name" MUST contain the person's full name from the resume. This is CRITICAL — never leave it empty.
- Keep arrays empty [] if not found.
- Experiences \`type\` MUST be exactly one of: "job", "internship", "freelance".
- Skills \`category\` should be professional (e.g., "Languages", "Frameworks & Libraries", "Developer Tools", "Cloud & Databases"). Aim for perfect segregation.
- Dates should be kept in original format or YYYY-MM-DD if obvious.
- "is_current" should be true if end_date implies "Present".
- "bullets" MUST be an array of strings.
- NO extra markdown, NO triple backticks, ONLY raw JSON in your response.
`.trim(),
    userContent: `Extract structured data from this resume text:\n\n${rawText}`,
  });
}

/**
 * Prompt 2 — Analyse Job Description
 */
async function analyseJD(rawJD) {
  return routedCall({
    label: 'analyse_jd',
    expectJson: true,
    systemPrompt: `
You are a technical job description analyser. Extract key hiring indicators and hard constraints from the JD.
Return ONLY valid JSON:
{
  "role_title": "",
  "company_name": "",
  "required_skills": [],
  "preferred_skills": [],
  "keywords": [],
  "seniority": "fresher|junior|mid|senior",
  "domain": "frontend|backend|fullstack|ml|devops|data|mobile|other",
  "key_responsibilities": [],
  "tech_stack": []
}
Constraints: Return ONLY structural JSON. Keep skills and keywords as arrays of short simple strings.
`.trim(),
    userContent: `Analyse this job description:\n\n${rawJD}`,
  });
}

/**
 * Prompt 3 — Score & Rank Profile Items
 */
async function scoreAndRankProfile(profileData, jdAnalysis) {
  return routedCall({
    label: 'score_and_rank',
    expectJson: true,
    systemPrompt: `
You are a senior recruiter algorithms engineer. Given a user's full profile and a Job Description analysis,
score each "projects" item and "experiences" item on relevance to the JD (0-100).
Select the TOP 2 projects and TOP 2 experiences to feature dynamically on a 1-page resume.
Return ONLY valid JSON:
{
  "selected_projects": [
    { "id": "", "relevance_score": 0, "reason": "" }
  ],
  "selected_experiences": [
    { "id": "", "relevance_score": 0, "reason": "" }
  ]
}
`.trim(),
    userContent: JSON.stringify({ profile: profileData, jd: jdAnalysis }),
  });
}

/**
 * Prompt 4 — Rewrite Bullets
 */
async function rewriteBullets(items, jdAnalysis) {
  return routedCall({
    label: 'rewrite_bullets',
    expectJson: true,
    systemPrompt: `
You are a professional technical resume writer. Rewrite the bullet points for EACH item provided to maximally align with the job description.
Use strong action verbs, quantify impact where possible based ONLY on the user's provided data, and naturally inject the JD's keywords.
Return ONLY valid JSON:
{
  "rewritten": [
    { "id": "", "bullets": ["bullet 1", "bullet 2", "bullet 3"] }
  ]
}
Constraints:
- Preserve the original facts, metrics, and technical depth verbatim. DO NOT hallucinate, invent, or make up new metrics under any circumstances.
- If the user provides a metric, absolutely include it. If none are provided, focus on technical methodologies instead.
- Expand explanations to be highly detailed and comprehensive (around 30-45 words per bullet so they span roughly 3 lines on a page).
- Output EXACTLY 2 bullets per item. No more, no less.
`.trim(),
    userContent: JSON.stringify({ items, jd: jdAnalysis }),
  });
}

/**
 * Prompt 5 — Detect Skill Gaps
 */
async function detectSkillGaps(userSkills, jdAnalysis) {
  return routedCall({
    label: 'detect_skill_gaps',
    expectJson: true,
    systemPrompt: `
You are an ATS expert. Compare the user's skills with JD requirements.
Identify missing skills and estimate the ATS score boost if added.
Only suggest skills the user might realistically have at a basic level given their background.
Return ONLY valid JSON:
{
  "gaps": [
    {
      "skill": "",
      "category": "Languages|Frameworks|Tools|Libraries",
      "reason": "Required in JD but not in profile",
      "ats_boost_estimate": 5,
      "confidence": "high|medium|low"
    }
  ]
}
Return maximum 5 suggestions. Sort by ats_boost_estimate descending.
`.trim(),
    userContent: JSON.stringify({ user_skills: userSkills, jd: jdAnalysis }),
  });
}

/**
 * Prompt 6 — ATS Scoring
 */
async function scoreATS(resumeText, jdAnalysis) {
  return routedCall({
    label: 'ats_score',
    expectJson: true,
    systemPrompt: `
You are an ATS (Applicant Tracking System) simulator. Score the resume against the JD.
Use industry-standard ATS criteria. Return ONLY valid JSON:
{
  "overall_score": 0,
  "breakdown": {
    "keyword_match": 0,
    "skills_match": 0,
    "section_completeness": 0,
    "format_score": 0,
    "experience_relevance": 0
  },
  "missing_keywords": [],
  "present_keywords": [],
  "suggestions": [
    { "priority": "high|medium|low", "suggestion": "" }
  ]
}
Score each category 0-100. overall_score = weighted average.
Weights: keyword_match 35%, skills_match 25%, experience_relevance 20%, section_completeness 10%, format_score 10%.
`.trim(),
    userContent: JSON.stringify({ resume_text: resumeText, jd: jdAnalysis }),
  });
}

/**
 * Prompt 7 — Chat Editor
 */
async function chatEdit(resumeJson, instruction, conversationHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `
You are an expert resume editor. The user has a resume in JSON format and wants to make changes.
Apply their instruction to the resume JSON and return the updated version.

CRITICAL INSTRUCTIONS:
1. ONLY modify the specific parts of the resume requested by the user.
2. DO NOT rewrite or alter any unaffected bullets, skills, or projects. Keep them exactly as they are.
3. Your output will be run through a diff-generator to show the user exactly what changed in a green/red visual preview before they apply it. Keep changes precise.

Return ONLY valid JSON:
{
  "updated_resume": { ...the full resume json with changes applied... },
  "changes_made": ["List of what was changed"],
  "message": "Brief confirmation of what you did"
}
Do NOT return markdown code fences. Return ONLY the raw JSON object.

      `.trim(),
    },
    ...conversationHistory,
    {
      role: 'user',
      content: `Current resume:\n${JSON.stringify(resumeJson)}\n\nInstruction: ${instruction}`,
    },
  ];

  return routedCall({
    label: 'chat_edit',
    expectJson: true,
    messages,
  });
}

/**
 * Prompt 8 — Generate Summary (Foreword)
 */
async function generateSummary(profileData, jdAnalysis) {
  return routedCall({
    label: 'generate_summary',
    expectJson: true,
    systemPrompt: `
You are an elite Fortune 500 Executive Recruiter. Your task is to write a high-impact, uniquely tailored Professional Summary (Foreword) for a candidate's resume.
This summary is the first thing a hiring manager sees. It must perfectly bridge the candidate's actual achievements with the specific requirements of the job description.

HARD CONSTRAINTS:
1. LENGTH: Exactly 3 lines (approx 55-70 words). Do not exceed 4 lines.
2. TONE: Active, powerful, and metrics-oriented. Use "Developed", "Architected", "Spearheaded".
3. DYNAMIC FOCUS: Do not over-fixate on the candidate's university or any single company. Instead, synthesize their entire technical background to show they are the perfect fit for the SPECIFIC Job Description.
4. NO HALLUCINATIONS: Only use technical stacks and achievements physically present in the user's data.
5. FORMATTING: Return a single continuous paragraph.

Return ONLY valid JSON:
{
  "summary": "Your elite 3-line foreword here"
}
`.trim(),
    userContent: JSON.stringify({ 
      personal: profileData.personal,
      top_experiences: profileData.experiences.slice(0, 3), // Give more context
      top_projects: profileData.projects.slice(0, 3),
      jd: jdAnalysis 
    }),
  });
}

module.exports = {
  parseResumePDF,
  analyseJD,
  scoreAndRankProfile,
  rewriteBullets,
  detectSkillGaps,
  scoreATS,
  chatEdit,
  generateSummary,
};


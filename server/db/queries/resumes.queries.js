// ─────────────────────────────────────────────────────────────────
// AlignCV — Resumes Queries
// ─────────────────────────────────────────────────────────────────

const db = require('../knex');

exports.create = (userId, data) => {
  return db('resumes')
    .insert({
      user_id: userId,
      jd_analysis_id: data.jd_analysis_id,
      title: data.title || 'Untitled Resume',
      selected_projects: JSON.stringify(data.selected_projects || []),
      selected_experiences: JSON.stringify(data.selected_experiences || []),
      selected_skills: JSON.stringify(data.selected_skills || []),
      summary: data.summary || '',
      version_number: 1,
    })
    .returning('*')
    .then((rows) => rows[0]);
};

exports.findById = (id) => {
  return db('resumes').where({ id }).first();
};

exports.findByUserId = (userId) => {
  return db('resumes').where({ user_id: userId }).orderBy('updated_at', 'desc');
};

exports.update = (id, data) => {
  // Extract keys to stringify if they are arrays/objects
  const updateData = { ...data, updated_at: db.fn.now() };
  if (updateData.selected_projects) updateData.selected_projects = JSON.stringify(updateData.selected_projects);
  if (updateData.selected_experiences) updateData.selected_experiences = JSON.stringify(updateData.selected_experiences);
  if (updateData.selected_skills) updateData.selected_skills = JSON.stringify(updateData.selected_skills);
  if (updateData.added_skills) updateData.added_skills = JSON.stringify(updateData.added_skills);
  if (updateData.ats_breakdown) updateData.ats_breakdown = JSON.stringify(updateData.ats_breakdown);
  if (updateData.ats_missing_keywords) updateData.ats_missing_keywords = JSON.stringify(updateData.ats_missing_keywords);

  return db('resumes').where({ id }).update(updateData).returning('*').then(rows => rows[0]);
};

exports.remove = (id) => {
  return db('resumes').where({ id }).del();
};

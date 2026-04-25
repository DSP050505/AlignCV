// ─────────────────────────────────────────────────────────────────
// AlignCV — JD Queries
// ─────────────────────────────────────────────────────────────────

const db = require('../knex');

exports.create = (userId, data) => {
  return db('jd_analyses')
    .insert({
      user_id: userId,
      raw_jd: data.raw_jd,
      role_title: data.role_title,
      company_name: data.company_name,
      required_skills: JSON.stringify(data.required_skills || []),
      preferred_skills: JSON.stringify(data.preferred_skills || []),
      keywords: JSON.stringify(data.keywords || []),
      seniority: data.seniority,
      domain: data.domain,
    })
    .returning('*')
    .then((rows) => rows[0]);
};

exports.findById = (id) => {
  return db('jd_analyses').where({ id }).first();
};

exports.findByUserId = (userId) => {
  return db('jd_analyses').where({ user_id: userId }).orderBy('created_at', 'desc');
};

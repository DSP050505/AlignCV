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
      required_skills: JSON.stringify(Array.isArray(data.required_skills) ? data.required_skills : (data.required_skills ? [data.required_skills] : [])),
      preferred_skills: JSON.stringify(Array.isArray(data.preferred_skills) ? data.preferred_skills : (data.preferred_skills ? [data.preferred_skills] : [])),
      keywords: JSON.stringify(Array.isArray(data.keywords) ? data.keywords : (data.keywords ? [data.keywords] : [])),
      seniority: data.seniority,
      domain: data.domain,
    })
    .returning('*')
    .then((rows) => {
      if (!rows || rows.length === 0) throw new Error('Database failed to return inserted JD record');
      return rows[0];
    });
};

exports.findById = (id) => {
  return db('jd_analyses').where({ id }).first();
};

exports.findByUserId = (userId) => {
  return db('jd_analyses').where({ user_id: userId }).orderBy('created_at', 'desc');
};

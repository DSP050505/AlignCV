const db = require('../knex');

const referralQueries = {
  // ── Sessions ──────────────────────────────────────────────────
  createSession: async (data) => {
    const [record] = await db('referral_sessions').insert(data).returning('*');
    return record;
  },

  getSession: async (id) => {
    return db('referral_sessions').where({ id }).first();
  },

  getSessionsByUser: async (user_id) => {
    return db('referral_sessions')
      .where({ user_id })
      .orderBy('created_at', 'desc');
  },

  // ── Outreach ──────────────────────────────────────────────────
  createOutreach: async (data) => {
    const [record] = await db('referral_outreach').insert(data).returning('*');
    return record;
  },

  createOutreachBatch: async (rows) => {
    return db('referral_outreach').insert(rows).returning('*');
  },

  getOutreachByUser: async (user_id) => {
    return db('referral_outreach')
      .where({ user_id })
      .orderBy('created_at', 'desc');
  },

  getOutreachBySession: async (session_id) => {
    return db('referral_outreach')
      .where({ session_id })
      .orderBy('created_at', 'desc');
  },

  updateOutreachStatus: async (id, user_id, updates) => {
    const [record] = await db('referral_outreach')
      .where({ id, user_id })
      .update(updates)
      .returning('*');
    return record;
  },
};

module.exports = referralQueries;

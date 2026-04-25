// ─────────────────────────────────────────────────────────────────
// AlignCV — Profile DB Queries
// All database operations for the profiles table.
// ─────────────────────────────────────────────────────────────────

const db = require('../knex');
const logger = require('../../utils/logger');

const TABLE = 'profiles';

async function findByUserId(userId) {
  logger.debug(`[DB] Finding profile for user: ${userId}`);
  return db(TABLE).where({ user_id: userId }).first();
}

async function create(userId) {
  logger.info(`[DB] Creating blank profile for user: ${userId}`);
  const [profile] = await db(TABLE)
    .insert({ user_id: userId })
    .returning('*');
  return profile;
}

async function update(userId, data) {
  logger.info(`[DB] Updating profile for user: ${userId}`);
  const [profile] = await db(TABLE)
    .where({ user_id: userId })
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');
  return profile;
}

module.exports = { findByUserId, create, update };

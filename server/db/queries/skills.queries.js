// ─────────────────────────────────────────────────────────────────
// AlignCV — Skills DB Queries
// ─────────────────────────────────────────────────────────────────

const db = require('../knex');
const logger = require('../../utils/logger');

const TABLE = 'skills';

async function findByUserId(userId) {
  logger.debug(`[DB] Fetching skills for user: ${userId}`);
  return db(TABLE).where({ user_id: userId }).orderBy('category', 'asc');
}

async function create(userId, data) {
  logger.info(`[DB] Creating skill for user: ${userId}`);
  const [entry] = await db(TABLE)
    .insert({ ...data, user_id: userId })
    .returning('*');
  return entry;
}

async function createMany(userId, skills) {
  logger.info(`[DB] Bulk creating ${skills.length} skills for user: ${userId}`);
  const rows = skills.map((s) => ({ ...s, user_id: userId }));
  return db(TABLE).insert(rows).returning('*');
}

async function remove(id) {
  logger.info(`[DB] Deleting skill: ${id}`);
  return db(TABLE).where({ id }).del();
}

async function removeAllByUser(userId) {
  logger.info(`[DB] Removing all skills for user: ${userId}`);
  return db(TABLE).where({ user_id: userId }).del();
}

module.exports = { findByUserId, create, createMany, remove, removeAllByUser };

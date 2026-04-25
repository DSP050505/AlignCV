// ─────────────────────────────────────────────────────────────────
// AlignCV — Achievements DB Queries
// ─────────────────────────────────────────────────────────────────

const db = require('../knex');
const logger = require('../../utils/logger');

const TABLE = 'achievements';

async function findByUserId(userId) {
  logger.debug(`[DB] Fetching achievements for user: ${userId}`);
  return db(TABLE).where({ user_id: userId }).orderBy('order_index', 'asc');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(userId, data) {
  logger.info(`[DB] Creating achievement for user: ${userId}`);
  const [entry] = await db(TABLE)
    .insert({ ...data, user_id: userId })
    .returning('*');
  return entry;
}

async function update(id, data) {
  logger.info(`[DB] Updating achievement: ${id}`);
  const [entry] = await db(TABLE)
    .where({ id })
    .update(data)
    .returning('*');
  return entry;
}

async function remove(id) {
  logger.info(`[DB] Deleting achievement: ${id}`);
  return db(TABLE).where({ id }).del();
}

module.exports = { findByUserId, findById, create, update, remove };

// ─────────────────────────────────────────────────────────────────
// AlignCV — User DB Queries
// All database operations for the users table.
// ─────────────────────────────────────────────────────────────────

const db = require('../knex');
const logger = require('../../utils/logger');

const TABLE = 'users';

async function findManyByName(name) {
  logger.debug(`[DB] Finding users by name: ${name}`);
  return db(TABLE).where({ name });
}

async function findById(id) {
  logger.debug(`[DB] Finding user by id: ${id}`);
  return db(TABLE).where({ id }).first();
}

async function create({ name, passcode_hash }) {
  logger.info(`[DB] Creating user: ${name}`);
  const [user] = await db(TABLE)
    .insert({ name, passcode_hash })
    .returning(['id', 'name', 'created_at']);
  logger.info(`[DB] User created: ${user.id}`);
  return user;
}

module.exports = { findManyByName, findById, create };

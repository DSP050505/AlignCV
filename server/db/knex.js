// ─────────────────────────────────────────────────────────────────
// AlignCV — Knex Instance
// Single shared Knex instance used across the entire backend.
// ─────────────────────────────────────────────────────────────────

const knex = require('knex');
const config = require('../config');

const db = knex({
  client: config.DB.client,
  connection: config.DB.connection,
  pool: config.DB.pool,
});

module.exports = db;

// ─────────────────────────────────────────────────────────────────
// AlignCV — Server Entry Point
// Loads dotenv, starts Express on configured port.
// ─────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./db/knex');

// ── Ensure runtime directories exist ─────────────────────────────
const fs = require('fs');
[config.UPLOAD.DIR, config.EXPORT.OUTPUT_DIR, path.resolve(__dirname, 'logs')].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`[Server] Created directory: ${dir}`);
  }
});

// ── Start Server ─────────────────────────────────────────────────
async function start() {
  try {
    // Test DB connection
    await db.raw('SELECT 1');
    logger.info('[DB] PostgreSQL connection established');

    app.listen(config.PORT, () => {
      logger.info(`[Server] AlignCV API running on http://localhost:${config.PORT}`);
      logger.info(`[Server] Environment: ${config.NODE_ENV}`);
    });
  } catch (err) {
    logger.error(`[Server] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

start();

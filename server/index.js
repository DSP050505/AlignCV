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
const { initializeWhatsAppBot } = require('./services/whatsappService');

// ── Ensure runtime directories exist ─────────────────────────────
const fs = require('fs');
[config.UPLOAD.DIR, config.EXPORT.OUTPUT_DIR, path.resolve(__dirname, 'logs')].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`[Server] Created directory: ${dir}`);
  }
});

// ── Global Error Listeners ───────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error(`[Process] Unhandled Rejection: ${reason.message || reason}`, { stack: reason.stack });
  // In production, you might want to gracefully shutdown
});

process.on('uncaughtException', (err) => {
  logger.error(`[Process] Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Give logger time to write before exiting
  setTimeout(() => process.exit(1), 1000);
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

    // Initialize WhatsApp Bot
    initializeWhatsAppBot();
  } catch (err) {
    logger.error(`[Server] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

start();

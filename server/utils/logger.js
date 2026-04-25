// ─────────────────────────────────────────────────────────────────
// AlignCV — Winston Logger
// Structured JSON logs with [Tag] prefix pattern.
// Console (colorised) + file transports for error and combined.
// ─────────────────────────────────────────────────────────────────

const winston = require('winston');
const path = require('path');
const config = require('../config');

const logDir = path.resolve(__dirname, '../logs');

const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // ── Console (coloured, readable) ─────────────────────────────
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      ),
    }),
    // ── Error log file ───────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // ── Combined log file ────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

module.exports = logger;
